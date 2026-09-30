(()=>{
  const embedded=window.parent!==window;
  if(!embedded)return;
  document.documentElement.classList.add('uadav-embedded');
  document.addEventListener('click',e=>{
    const a=e.target.closest?.('a[href]'); if(!a||e.defaultPrevented||a.target==='_blank'||a.hasAttribute('download'))return;
    const raw=a.getAttribute('href')||''; if(!raw||raw.startsWith('#')||/^(mailto:|tel:|javascript:)/i.test(raw))return;
    try{const u=new URL(a.href,location.href);if(u.origin!==location.origin)return;e.preventDefault();parent.postMessage({type:'uadav:navigate',href:u.pathname+u.search+u.hash},location.origin)}catch{}
  },true);
  window.UADAVShell={
    playRadio(radio){try{parent.postMessage({type:'uadav:radio-play',radio},location.origin)}catch{}},
    pauseRadio(){try{parent.postMessage({type:'uadav:radio-pause'},location.origin)}catch{}},
    meta(meta){try{parent.postMessage({type:'uadav:radio-meta',...meta},location.origin)}catch{}},
    navigate(href){try{parent.postMessage({type:'uadav:navigate',href},location.origin)}catch{}}
  };
})();
// Botón Volver universal en vistas individuales. En App Shell navega dentro de la app;
// en acceso directo usa el historial y luego la sección padre.
(()=>{
  const path=location.pathname.toLowerCase();
  const parents={
    '/artista.html':'/artistas.html','/radio.html':'/index.html','/evento.html':'/cartelera.html','/media.html':'/peliculas-series.html',
    '/contratar-artista.html':'/artista.html','/gestionar-artista.html':'/artistas.html','/publicar-evento.html':'/cartelera.html','/sumate-artista.html':'/artistas.html'
  };
  if(!parents[path]||document.querySelector('[data-uadav-back]')||document.querySelector('.back-btn,.top-back'))return;
  const b=document.createElement('button');b.type='button';b.setAttribute('data-uadav-back','1');b.textContent='←';
  b.setAttribute('aria-label','Volver');
  b.style.cssText='position:fixed;left:14px;top:14px;z-index:9999;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:rgba(6,10,16,.82);backdrop-filter:blur(14px);color:#fff;font:900 20px system-ui;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.25)';
  b.onclick=()=>{if(window.parent!==window){try{parent.postMessage({type:"uadav:navigate",href:parents[path]},location.origin);return}catch{}}if(window.history.length>1)window.history.back();else location.href=parents[path]};
  document.body.appendChild(b);
})();
