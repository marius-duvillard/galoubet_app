import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

interface Harness {
  listeners: Record<string, (event: { waitUntil: (p: Promise<unknown>) => void }) => void>;
  cache: Map<string, string>;
  fetchLog: string[];
}

// Index.html tel que produit par `vite build` : les assets hashés portent
// le préfixe --base, les fichiers public/ sont référencés en relatif.
function indexHtml(assetBase: string): string {
  return [
    "<!doctype html><html lang=\"fr\"><head>",
    '<meta charset="UTF-8" />',
    '<link rel="manifest" href="manifest.webmanifest">',
    `<link rel="stylesheet" crossorigin href="${assetBase}assets/index-DEF.css">`,
    "</head><body><div id=\"root\"></div>",
    `<script type="module" crossorigin src="${assetBase}assets/index-ABC.js"></script>`,
    "</body></html>",
  ].join("");
}

/**
 * Le paramètre swHref est l'URL absolue du service worker, telle que vus
 * par le navigateur :
 * - http://localhost/sw.js            → app servie à la racine
 * - https://x.com/galoubet_app/sw.js  → site GitHub Pages projet (/nom-repo/)
 * Comme l'exige la spec Cache, les URLs relatives (addAll/fetch/match)
 * sont résolues contre l'emplacement du worker.
 */
function buildHarness(
  indexHtml: string,
  swHref: string,
): { harness: Harness; ctx: vm.Context } {
  const harness: Harness = { listeners: {}, cache: new Map(), fetchLog: [] };
  const keyOf = (input: RequestInfo | URL) =>
    new URL(String(input), swHref).toString();

  const mockFetch = (input: RequestInfo | URL) => {
    harness.fetchLog.push(String(input));
    const resolved = keyOf(input);
    const pathname = new URL(resolved).pathname;
    if (pathname === "/" || pathname.endsWith("index.html")) {
      return Promise.resolve(new Response(indexHtml, { status: 200 }));
    }
    return Promise.resolve(new Response("body:" + resolved, { status: 200 }));
  };

  const sandbox: Record<string, unknown> = {
    console,
    URL,
    Response,
    fetch: mockFetch,
    caches: {
      open: (_name: string) =>
        Promise.resolve({
          addAll: (urls: string[]) =>
            Promise.all(
              urls.map((u) =>
                mockFetch(u).then(() => {
                  harness.cache.set(keyOf(u), "ok");
                }),
              ),
            ),
          put: (u: string) =>
            Promise.resolve().then(() => {
              harness.cache.set(keyOf(u), "ok");
            }),
          match: (u: string) =>
            Promise.resolve(
              harness.cache.has(keyOf(u)) ? new Response("cached") : undefined,
            ),
        }),
      keys: () => Promise.resolve(["galoubet"]),
      delete: () => Promise.resolve(true),
    },
  };
  sandbox.self = {
    addEventListener: (type: string, handler: Harness["listeners"][string]) => {
      harness.listeners[type] = handler;
    },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
    location: { origin: new URL(swHref).origin, href: swHref },
  };
  const ctx = vm.createContext(sandbox);
  return { harness, ctx };
}

function runSWSource(ctx: vm.Context): void {
  const source = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
  new vm.Script(source, { filename: "sw.js" }).runInContext(ctx);
}

function fireInstall(harness: Harness): Promise<void> {
  return new Promise((done) => {
    let settled: Promise<unknown> = Promise.resolve();
    harness.listeners["install"]({
      waitUntil: (p) => {
        settled = p;
      },
    });
    void settled.then(() => done(), () => done());
  });
}

describe("sw.js : installation, app à la racine", () => {
  const ROOT = "http://localhost/sw.js";

  it("précache la liste statique + les assets hashés de index.html", async () => {
    const { harness, ctx } = buildHarness(indexHtml("/"), ROOT);
    runSWSource(ctx);
    await fireInstall(harness);
    for (const expected of [
      "http://localhost/",
      "http://localhost/index.html",
      "http://localhost/manifest.webmanifest",
      "http://localhost/icons/icon-192.png",
      "http://localhost/icons/icon-512.png",
      "http://localhost/icons/icon-maskable-512.png",
      "http://localhost/apple-touch-icon.png",
      "http://localhost/assets/index-ABC.js",
      "http://localhost/assets/index-DEF.css",
    ]) {
      expect(harness.cache.has(expected), `cache doit contenir ${expected}`).toBe(true);
    }
  });

  it("n'ajoute au cache que les assets .js/.css de index.html", async () => {
    const { harness, ctx } = buildHarness(indexHtml("/"), ROOT);
    runSWSource(ctx);
    await fireInstall(harness);
    expect(harness.fetchLog.filter((u) => u.endsWith(".svg"))).toEqual([]);
  });
});

describe("sw.js : installation, app sous sous-chemin (GitHub Pages /nom-repo/)", () => {
  const SUB = "https://example.com/galoubet_app/sw.js";
  const P = "https://example.com/galoubet_app";

  it("précache la liste statique et les assets sous le bon chemin", async () => {
    const { harness, ctx } = buildHarness(indexHtml("/galoubet_app/"), SUB);
    runSWSource(ctx);
    await fireInstall(harness);
    for (const expected of [
      P + "/",
      P + "/index.html",
      P + "/manifest.webmanifest",
      P + "/icons/icon-192.png",
      P + "/icons/icon-512.png",
      P + "/icons/icon-maskable-512.png",
      P + "/apple-touch-icon.png",
      P + "/assets/index-ABC.js",
      P + "/assets/index-DEF.css",
    ]) {
      expect(harness.cache.has(expected), `cache doit contenir ${expected}`).toBe(true);
    }
    // Rien ne doit pointer hors du sous-chemin de l'app.
    for (const [key] of harness.cache) {
      expect(key.startsWith(P + "/"), `${key} est hors du scope de l'app`).toBe(true);
    }
  });
});
