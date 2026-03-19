// One-shot killer SW to remove old caches & unregister itself everywhere.

const CACHE_PREFIX = "assetmap-cache";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clear all old AssetMap caches
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key.startsWith(CACHE_PREFIX)) {
            return caches.delete(key);
          }
        })
      );

      // Take control of all open clients
      await self.clients.claim();

      // Unregister this service worker so future loads have no SW at all
      await self.registration.unregister();

      // Gently refresh all controlled pages once to pick up latest assets
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        if ("navigate" in client && client.url) {
          client.navigate(client.url);
        }
      }
    })()
  );
});

// No fetch handler → browser will always go to network with normal HTTP caching.

