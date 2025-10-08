// public/sw.js
const CACHE = "medgraft-v2";
// ОСТАВЬТЕ ТОЛЬКО ASCII-ПУТИ!
const ASSETS = [
  "/", "/home",
  "/favicon.ico",
  "/icons/icon-192.png", "/icons/icon-512.png",
  "/manifest.webmanifest",
  // "/promo-1.png", "/promo-2.png", "/promo-3.png", // если переименовали
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
  e.respondWith(
    (async () => {
      const cached = await caches.match(request);
      const network = fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })()
  );
});
