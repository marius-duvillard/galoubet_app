import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

interface Harness {
  listeners: Record<string, (event: { waitUntil: (p: Promise<unknown>) => void }) => void>;
  cache: Map<string, string>;
  fetchLog: string[];
}

const INDEX_HTML = [
  "<!doctype html><html lang=\"fr\"><head>",
  '<meta charset="UTF-8" />',
  '<link rel="manifest" href="/manifest.webmanifest">',
  '<link rel="stylesheet" crossorigin href="/assets/index-DEF.css">',
  "</head><body><div id=\"root\"></div>",
  '<script type="module" crossorigin src="/assets/index-ABC.js"></script>',
  "</body></html>",
].join("");

function buildHarness(indexHtml: string): { harness: Harness; ctx: vm.Context } {
  const harness: Harness = { listeners: {}, cache: new Map(), fetchLog: [] };
  const sandbox: Record<string, unknown> = {
    console,
    URL,
    Response,
    fetch: (input: RequestInfo | URL) => {
      const u = String(input);
      harness.fetchLog.push(u);
      if (u === "/index.html" || u === "/") {
        return Promise.resolve(new Response(indexHtml, { status: 200 }));
      }
      return Promise.resolve(new Response("body:" + u, { status: 200 }));
    },
    caches: {
      open: (_name: string) =>
        Promise.resolve({
          addAll: (urls: string[]) =>
            Promise.all(
              urls.map((u) =>
                sandbox.fetch(u).then(() => {
                  harness.cache.set(u, "ok");
                }),
              ),
            ),
          put: (u: string) =>
            Promise.resolve().then(() => {
              harness.cache.set(u, "ok");
            }),
          match: (u: string) =>
            Promise.resolve(
              harness.cache.has(u) ? new Response("cached") : undefined,
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
    location: { origin: "http://localhost" },
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
    void settled.then(done, done);
  });
}

describe("sw.js : installation", () => {
  it("précache la liste statique", async () => {
    const { harness, ctx } = buildHarness(INDEX_HTML);
    runSWSource(ctx);
    await fireInstall(harness);
    for (const expected of [
      "/",
      "/index.html",
      "/manifest.webmanifest",
      "/icons/icon-192.png",
      "/icons/icon-512.png",
      "/icons/icon-maskable-512.png",
      "/apple-touch-icon.png",
    ]) {
      expect(harness.cache.has(expected), `cache doit contenir ${expected}`).toBe(true);
    }
  });

  it("précache aussi les assets hashés référencés par index.html (offline dès la 1re visite)", async () => {
    const { harness, ctx } = buildHarness(INDEX_HTML);
    runSWSource(ctx);
    await fireInstall(harness);
    expect(harness.cache.has("/assets/index-ABC.js")).toBe(true);
    expect(harness.cache.has("/assets/index-DEF.css")).toBe(true);
  });

  it("n'ajoute au cache que les assets .js/.css (pas le manifest, pas les icônes)", async () => {
    const { harness, ctx } = buildHarness(INDEX_HTML);
    runSWSource(ctx);
    await fireInstall(harness);
    expect(harness.cache.has("/manifest.webmanifest")).toBe(true);
    expect(harness.cache.has("/icons/icon-192.png")).toBe(true);
    for (const absent of [
      "/assets/autre.svg",
      "/manifest.webmanifest.js",
    ]) {
      expect(harness.cache.has(absent)).toBe(false);
    }
    expect(harness.fetchLog.filter((u) => u.endsWith(".svg"))).toEqual([]);
  });
});
