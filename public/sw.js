// Safe cleanup service worker: remove old caches and then get out of the way.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch {
      }

      try {
        await self.registration.unregister();
      } catch {
      }

      await self.clients.claim();
      // No forced navigate here to avoid reload loops on some mobile browsers.
    })()
  );
});

// No fetch handler → browser will always go to network with normal HTTP caching.

