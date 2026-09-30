const CACHE='uadav-stream-v9-1';
const SHELL=[
  '/','/index.html','/app.html','/artistas.html','/artista.html','/radio.html','/cartelera.html','/evento.html',
  '/publicar-evento.html','/bolsa-trabajo.html','/contratar-artista.html','/gestionar-artista.html','/sumate-artista.html',
  '/mi-perfil.html','/terminos.html','/privacidad.html','/peliculas-series.html','/media.html','/playlists.html','/podcasts.html',
  '/shorts.html','/manual.html','/presskit.html','/marketplace.html','/trabajo.html','/stream-plus.html',
  '/uadav-ui-v8.4.css','/uadav-ui-v8.4.js','/uadav-shell-bridge.js','/uadav-api-config.js','/site-page-config.js',
  '/uadav-design-v7.2.css','/uadav-brand-v7.2.js','/uadav-v9.css','/uadav-content-player.js','/manifest.json'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{
    for(const url of SHELL){try{const r=await fetch(url,{cache:'no-store'});if(r.ok)await cache.put(url,r.clone())}catch{}}
  }));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  let u;try{u=new URL(req.url)}catch{return}
  // Nunca interceptar recursos externos, APIs, streams, audio/video ni iframes de proveedores.
  if(u.origin!==self.location.origin || u.pathname.startsWith('/api/') || ['audio','video'].includes(req.destination))return;
  if(/\.(m3u8|mp3|aac|m4a|mp4|webm)(?:$|\?)/i.test(u.pathname))return;
  const accept=req.headers.get('accept')||'';
  const isPage=req.mode==='navigate'||accept.includes('text/html');
  event.respondWith((async()=>{
    try{
      const net=await fetch(req,{cache:'no-store'});
      if(net?.ok){const copy=net.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});}
      return net;
    }catch{
      const cached=await caches.match(req);
      if(cached)return cached;
      if(isPage){const fallback=await caches.match('/index.html');if(fallback)return fallback;}
      return new Response('',{status:504,statusText:'Offline'});
    }
  })());
});
