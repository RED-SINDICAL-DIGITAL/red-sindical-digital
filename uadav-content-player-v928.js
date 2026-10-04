(()=>{
'use strict';
const API='https://uadav-api.uadavstream.workers.dev/api/';
function normalize(item={}){
 const n={...item};
 n.url=n.url||n.href||n.link||'';
 n.external_id=n.external_id||n.youtube_id||n.videoId||n.id||'';
 if(!n.provider){
  if(/youtu(?:be\.com|\.be)/i.test(n.url)||/^[A-Za-z0-9_-]{11}$/.test(String(n.external_id||'')))n.provider='youtube';
  else if(/spotify\.com/i.test(n.url))n.provider='spotify';
  else if(/\.(mp4|webm)(?:[?#]|$)/i.test(n.url))n.provider='video';
 }
 return n;
}
function youtubeId(n){
 let id=String(n.external_id||n.youtube_id||n.videoId||'').trim();
 if(/^[A-Za-z0-9_-]{11}$/.test(id))return id;
 const u=String(n.url||'');
 const m=u.match(/[?&]v=([A-Za-z0-9_-]{11})/)||u.match(/youtu\.be\/([A-Za-z0-9_-]{11})/)||u.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/);
 return m?.[1]||'';
}
function source(item){return normalize(item).url||''}
function embed(item={}){
 const n=normalize(item),id=youtubeId(n),u=n.url||'';
 if(id)return '<iframe src="https://www.youtube.com/embed/'+encodeURIComponent(id)+'?autoplay=1&playsinline=1&rel=0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>';
 const sp=u.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([^?]+)/i);
 if(sp)return '<iframe src="https://open.spotify.com/embed/'+sp[1]+'/'+encodeURIComponent(sp[2])+'" allow="autoplay; encrypted-media"></iframe>';
 if(/\.(mp4|webm)(?:[?#]|$)/i.test(u))return '<video src="'+String(u).replace(/"/g,'&quot;')+'" controls autoplay playsinline></video>';
 return '';
}
function host(){try{return window.parent?.UADAVShellHost||window.parent?.UADAV_APP||null}catch{return null}}
async function resolveYoutube(n){
 const id=youtubeId(n);if(!id)return n;
 try{
  const r=await fetch(API+'playback/youtube?id='+encodeURIComponent(id),{cache:'no-store'});
  if(!r.ok)return n;
  const d=await r.json();
  return {...n,external_id:id,youtube_id:id,playback:d};
 }catch{return n}
}
async function open(item={}){
 let n=normalize(item);n=await resolveYoutube(n);
 const h=host();
 if(h?.playContent){h.playContent(n);return true}
 try{
  if(window.parent!==window){window.parent.postMessage({type:'uadav:content-play',item:n},location.origin);return true}
 }catch{}
 const id=youtubeId(n),p=n.playback||{};
 let html='';
 if(p.direct_url)html='<video src="'+String(p.direct_url).replace(/"/g,'&quot;')+'" controls autoplay playsinline></video>';
 else if(p.embed_url)html='<iframe src="'+String(p.embed_url).replace(/"/g,'&quot;')+'" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>';
 else html=embed(n);
 const frame=document.getElementById('playerFrame'),modal=document.getElementById('playerModal');
 if(frame)frame.innerHTML=html||'<div class="empty">Contenido no disponible.</div>';
 if(document.getElementById('playerTitle'))document.getElementById('playerTitle').textContent=n.titulo||n.nombre||'Contenido';
 if(document.getElementById('playerMeta'))document.getElementById('playerMeta').textContent=n.descripcion||n.categoria||'';
 if(document.getElementById('playerProvider'))document.getElementById('playerProvider').textContent=String(n.provider||'contenido').toUpperCase();
 if(modal){modal.classList.add('active');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
 return !!html;
}
function close(){
 const h=host();if(h?.closeContent){h.closeContent();return true}
 try{if(window.parent!==window){window.parent.postMessage({type:'uadav:content-close'},location.origin);return true}}catch{}
 const frame=document.getElementById('playerFrame'),modal=document.getElementById('playerModal');if(frame)frame.innerHTML='';if(modal){modal.classList.remove('active');modal.setAttribute('aria-hidden','true')}document.body.style.overflow='';return true;
}
window.UADAVContentPlayer={normalize,source,embed,open,close,youtubeId};
})();
