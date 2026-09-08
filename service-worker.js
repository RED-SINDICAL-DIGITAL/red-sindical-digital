// ============================================================
// SERVICE WORKER MAESTRO CON AUTO-LIMPIEZA DE CACHÉ EN CALIENTE
// Ecosistema de Optimización Móvil y Smart TV - UADAVSTREAM
// ============================================================

// El identificador único de caché de la aplicación
const CACHE_NAME = 'uadavstream-static-v3';

// Archivos críticos de infraestructura que se congelan para carga instantánea
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Fase de Instalación: Congela los archivos base en el almacenamiento del dispositivo
self.addEventListener('install', e => {
  self.skipWaiting(); // Fuerza a la nueva versión a tomar el control inmediatamente
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 PWA: Congelando infraestructura estática básica...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => console.warn('PWA Alerta: Falló la precarga de assets estáticos:', err))
  );
});

// 2. Fase de Activación: Borra de forma automática todo el caché viejo (Auto-Limpieza)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        // Recorre todos los cachés guardados en el celular del afiliado
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('🗑️ PWA: Detectada versión obsoleta. Limpiando caché viejo:', key);
            return caches.delete(key); // Borra la basura vieja para liberar espacio del celular
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma el control de todas las pestañas abiertas de inmediato
  );
});

// 3. Fase de Interceptación (Fetch): El motor inteligente de optimización de red
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Regla de Oro: Las llamadas a tu API del Worker de Cloudflare NUNCA se cachean.
  // Esto asegura que las métricas de SADAIC, el chat en vivo y el booking funcionen siempre en tiempo real.
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Para el HTML, manifest e iconos, lee la memoria local primero para ahorrar datos móviles
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      if (cachedResponse) {
        // Devuelve el archivo congelado velozmente sin gastar red
        return cachedResponse;
      }

      // Si no está en caché, viaja a internet a buscarlo de forma normal
      return fetch(e.request).then(networkResponse => {
        // Si la respuesta es inválida, no la guarda
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Clonar y guardar dinámicamente nuevos archivos estáticos si el usuario navega
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          // Solo guardamos si pertenece a nuestra propia web app (evita cachear cosas de YouTube)
          if (!url.href.includes('youtube.com') && !url.href.includes('googlevideo.com')) {
            cache.put(e.request, responseToCache);
          }
        });

        return networkResponse;
      }).catch(() => {
        // Fallback extremo offline si el afiliado se queda sin señal en el celular
        return new Response('', { status: 404 });
      });
    })
  );
});
