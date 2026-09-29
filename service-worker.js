const CACHE='uadav-stream-v8-1';
const SHELL=['/','/index.html','/artistas.html','/artista.html','/radio.html','/cartelera.html','/evento.html','/publicar-evento.html','/bolsa-trabajo.html','/contratar-artista.html','/gestionar-artista.html','/sumate-artista.html','/mi-perfil.html','/terminos.html','/privacidad.html','/uadav-design-v7.2.css','/uadav-brand-v7.2.js','/site-page-config.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL).catch(()=>{})));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.pathname.startsWith('/api/'))return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(e.request)))})
