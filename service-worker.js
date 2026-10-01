// UADAV STREAM V10 CORE — self-destruct service worker
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.map(n=>caches.delete(n)));
    await self.registration.unregister();
    const clientsList=await self.clients.matchAll({type:'window'});
    for(const client of clientsList) client.navigate(client.url);
  })());
});
// Intentionally no fetch handler.