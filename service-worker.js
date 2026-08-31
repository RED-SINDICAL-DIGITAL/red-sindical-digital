self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
  // Borrar cachés viejas
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))));
});
self.addEventListener('fetch', (e) => {
  // No cachear NADA, siempre ir al servidor
  return;
});
