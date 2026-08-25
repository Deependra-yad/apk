self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A minimal fetch listener is required by Chrome to pass the PWA installability criteria.
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Network error occurred. You are offline.');
    })
  );
});
