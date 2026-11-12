const CACHE_NAME = "moonbeam-shell-v2";
const APP_SHELL_URL = new URL("./index.html", self.registration.scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add(APP_SHELL_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("moonbeam-shell-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      let response;
      try {
        response = await fetch(request);
      } catch (networkError) {
        const cached = await caches.match(APP_SHELL_URL);
        if (cached) return cached;
        throw networkError;
      }

      if (response.ok) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(APP_SHELL_URL, response.clone());
        } catch (cacheError) {
          console.error("Could not refresh the offline page cache:", cacheError);
        }
      }
      return response;
    })()
  );
});
