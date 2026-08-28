self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('uadavstream-v1').then(cache => {
      return cache.addAll([
        '/US.html',
        '/manifest.json'
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});