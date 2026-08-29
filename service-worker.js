self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('uadavstream-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ]).catch(err => console.warn('Error al cachear:', err));
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
