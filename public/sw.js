const CACHE = "galoubet-v3";

const PRECACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        await cache.addAll(PRECACHE);
        // Les assets hashés ne sont pas connus à l'avance : on les lit dans
        // index.html pour que l'app soit 100 % offline dès la première visite
        // (le SW s'enregistre depuis le bundle : sans ça, JS/CSS ne seraient
        // jamais mis en cache avant un second chargement).
        const response = await fetch("/index.html");
        const html = await response.text();
        const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
          .map((m) => m[1])
          .filter((u) => u.startsWith("/") && (u.endsWith(".js") || u.endsWith(".css")));
        if (assets.length > 0) await cache.addAll(assets);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation (HTML) : network-first pour servir la nouvelle version dès
  // qu'elle est disponible ; repli sur le cache en hors-ligne.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/index.html")),
        ),
    );
    return;
  }

  // Ressources statiques (assets hashés Vite) : cache-first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => Response.error());
    }),
  );
});
