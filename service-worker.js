const CACHE_NAME = 'uadavstream-static-v4';
const ASSETS_TO_CACHE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(e.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          if (!url.href.includes('youtube.com') && !url.href.includes('googlevideo.com')) {
            cache.put(e.request, responseToCache);
          }
        });
        return networkResponse;
      }).catch(() => new Response('', { status: 404 }));
    })
  );
});
