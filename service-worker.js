// service-worker.js
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('uadavstream-v2').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/landing-uadavstream.html'
      ]).catch(err => console.warn('Error al cachear:', err));
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== 'uadavstream-v2').map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request).catch(() => {
        return new Response('', { status: 404 });
      });
    })
  );
});
