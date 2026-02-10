// public/sw.js
const CACHE = "medgraft-v5";
const ASSETS = [
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(ASSETS.map((url) => new Request(encodeURI(url))));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => (key === CACHE ? null : caches.delete(key))));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isBypass =
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/.next/");

  if (isBypass) {
    event.respondWith(fetch(request));
    return;
  }

  const isNavigate = request.mode === "navigate";

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);

      // Do not cache HTML pages to avoid serving stale app shells between deployments.
      if (isNavigate) {
        try {
          return await fetch(request);
        } catch {
          return (
            (await cache.match("/home")) ||
            (await cache.match("/")) ||
            cached ||
            fetch(request)
          );
        }
      }

      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })(),
  );
});
