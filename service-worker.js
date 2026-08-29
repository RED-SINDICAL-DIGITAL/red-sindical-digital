self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('beatplay-v1').then(cache => {
      // Solo cachear archivos locales, NO externos
      return cache.addAll([
        '/beatplay/',
        '/beatplay/index.html',
        '/beatplay/manifest.json'
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  // Si la petición es a un dominio externo, no la cacheamos
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) {
    // Dejamos que el navegador maneje la petición normalmente
    e.respondWith(fetch(e.request));
    return;
  }
  // Para recursos locales, usamos caché
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
