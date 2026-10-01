// ★ UADAV STREAM V9.2.4 — Service Worker de estabilización
// Objetivo: eliminar cualquier posibilidad de que un cache viejo intercepte
// HTML, JavaScript, APIs, radio, video o streams mientras estabilizamos V9.
const BUILD='uadav-stream-v9-2-4-stabilization';
self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(n=>n.startsWith('uadav-stream-')||n.startsWith('uadavstream-')).map(n=>caches.delete(n)));
    await self.clients.claim();
  })());
});
// Intencionalmente no se registra handler fetch.
// Todo recurso va directo a red/navegador. No se interceptan APIs, media ni streams.
