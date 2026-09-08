// ============================================================
// SERVICE WORKER - UADAV STREAM (Motor de App Nativa y Caché)
// ============================================================

const CACHE_NAME = 'uadav-cache-v2.0'; // Versión 2.0 (Se actualiza sola cuando cambies cosas)

// Archivos que se guardan en el celular para abrir al instante
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. INSTALACIÓN: Guarda los archivos base en el celular
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache abierto: Instalando archivos base');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('⚠️ Error cacheando:', err))
  );
  self.skipWaiting(); // Fuerza la activación inmediata
});

// 2. ACTIVACIÓN: Borra cachés viejos para liberar espacio en el celular
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Borrando caché vieja:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Toma control inmediato de todas las pestañas
});

// 3. NAVEGACIÓN: Intercepta las peticiones para ahorrar datos
self.addEventListener('fetch', event => {
  // No cachear peticiones de la API (siempre deben ser frescas)
  if (event.request.url.includes('/api/')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en caché, lo muestra al instante
        if (response) {
          return response;
        }
        // Si no, lo baja de internet
        return fetch(event.request);
      })
  );
});
