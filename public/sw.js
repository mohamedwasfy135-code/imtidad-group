self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // نمرر كل الطلبات عادي بدون أي تخزين مؤقت (offline) حاليًا
  event.respondWith(fetch(event.request));
});
