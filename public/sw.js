// public/sw.js
const CACHE = "medgraft-v4";
// ОСТАВЬТЕ ТОЛЬКО ASCII-ПУТИ!
const ASSETS = [
  "/", "/home",
  "/favicon.ico",
  "/icons/icon-192.png", "/icons/icon-512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // безопасно добавляем: энкодим даже если кто-то случайно вставит не-ASCII
      await cache.addAll(ASSETS.map((u) => new Request(encodeURI(u))));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isBypass =
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/.next/");

  if (isBypass) {
    e.respondWith(fetch(request));
    return;
  }

  const isNavigate = request.mode === "navigate";

  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);

      if (isNavigate) {
        try {
          const resp = await fetch(request);
          if (resp.ok) {
            cache.put(request, resp.clone());
          }
          return resp;
        } catch {
          return cached || fetch(request);
        }
      }

      const network = fetch(request)
        .then((resp) => {
          if (resp.ok) {
            cache.put(request, resp.clone());
          }
          return resp;
        })
        .catch(() => cached);

      return cached || network;
    })()
  );
});
