const CACHE='uadav-stream-v8-5';
const SHELL=['/','/index.html','/artistas.html','/artista.html','/radio.html','/cartelera.html','/evento.html','/publicar-evento.html','/bolsa-trabajo.html','/contratar-artista.html','/gestionar-artista.html','/sumate-artista.html','/mi-perfil.html','/terminos.html','/privacidad.html','/app.html','/peliculas-series.html','/media.html','/playlists.html','/podcasts.html','/shorts.html','/manual.html','/presskit.html','/marketplace.html','/uadav-ui-v8.4.css','/uadav-ui-v8.4.js','/uadav-shell-bridge.js','/uadav-api-config.js','/site-page-config.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL).catch(()=>{})));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  let u;try{u=new URL(req.url)}catch{return}
  // V8.5: jamás interceptar APIs, streams o recursos externos. Evita romper Deezer/Zeno/YouTube/Invidious/audio.
  if(u.origin!==self.location.origin || u.pathname.startsWith('/api/') || req.destination==='audio' || req.destination==='video')return;
  const accept=req.headers.get('accept')||'';
  const isPage=req.mode==='navigate'||accept.includes('text/html');
  e.respondWith((async()=>{
    try{
      const net=await fetch(req);
      if(net && net.ok){const copy=net.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});} 
      return net;
    }catch(err){
      const cached=await caches.match(req);
      if(cached)return cached;
      if(isPage){const fallback=await caches.match('/index.html');if(fallback)return fallback;}
      return new Response('',{status:504,statusText:'Offline'});
    }
  })());
});
