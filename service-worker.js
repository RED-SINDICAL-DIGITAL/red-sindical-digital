const CACHE='uadav-stream-v9-2-2';
const STATIC=['/uadav-ui-v8.4.css?v=922','/uadav-ui-v8.4.js?v=922','/uadav-shell-bridge.js?v=922','/uadav-api-config.js?v=922','/uadav-content-player.js?v=922','/uadav-v9.css?v=922','/manifest.json?v=922'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(async c=>{for(const url of STATIC){try{const r=await fetch(url,{cache:'reload'});if(r.ok)await c.put(url,r.clone())}catch{}}}));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  let u;try{u=new URL(req.url)}catch{return}
  // Nunca interceptar recursos externos, APIs, streams ni Range Requests.
  if(u.origin!==self.location.origin||u.pathname.startsWith('/api/')||req.headers.has('range')||['audio','video'].includes(req.destination)||/\.(m3u8|mp3|aac|m4a|mp4|webm|m4s|ts)(?:$|\?)/i.test(u.pathname))return;
  const accept=req.headers.get('accept')||'';
  const isPage=req.mode==='navigate'||accept.includes('text/html');
  if(isPage){event.respondWith(fetch(req,{cache:'no-store'}).catch(()=>new Response('<!doctype html><meta charset="utf-8"><title>Sin conexión</title><body style="background:#05080d;color:white;font:16px system-ui;padding:30px"><h1>UADAV STREAM</h1><p>No hay conexión. Reintentá cuando vuelva Internet.</p></body>',{status:503,headers:{'content-type':'text/html;charset=utf-8','cache-control':'no-store'}})));return;}
  event.respondWith((async()=>{try{const net=await fetch(req,{cache:'no-store'});if(net.ok)caches.open(CACHE).then(c=>c.put(req,net.clone())).catch(()=>{});return net}catch{const cached=await caches.match(req);return cached||new Response('',{status:504})}})());
});
