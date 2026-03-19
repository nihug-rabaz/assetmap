// Minimal service worker: no HTTP caching, always use network.
// Also clears any old caches from previous versions.

const CACHE_PREFIX = "assetmap-cache-legacy";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key.startsWith(CACHE_PREFIX)) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// No fetch handler → browser will always go to network (with normal HTTP caching headers).

