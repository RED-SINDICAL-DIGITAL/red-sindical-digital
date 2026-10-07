// ★ UADAV STREAM · API centralizada
// Fuente única de API para plataforma, Admin y vistas V11.7.
window.PLATFORM_API_BASE = window.PLATFORM_API_BASE || window.UADAV_API_BASE || 'https://uadav-api.uadavstream.workers.dev/api/';
window.UADAV_API_BASE = window.UADAV_API_BASE || window.PLATFORM_API_BASE;
window.UADAV_USE_LOCAL_API = window.UADAV_USE_LOCAL_API === true;

(function(){
  'use strict';
  const API=window.UADAV_API_BASE;
  const json=async path=>{
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),10000);
    try{
      const r=await fetch(API+path+(path.includes('?')?'&':'?')+'_='+Date.now(),{cache:'no-store',signal:ctl.signal});
      if(!r.ok)return null;
      return await r.json();
    }catch(_){return null}finally{clearTimeout(timer)}
  };
  const unwrap=x=>x&&typeof x==='object'?(x.data||x.config||x):{};
  const first=(o,keys)=>{for(const k of keys){const v=o?.[k];if(v!==undefined&&v!==null&&String(v).trim()!=='')return v}return null};
  const videoId=x=>{
    const explicit=x?.videoId||x?.video_id||x?.external_id||x?.youtube_id||'';
    if(/^[A-Za-z0-9_-]{11}$/.test(String(explicit)))return String(explicit);
    const provider=String(x?.provider||'').toLowerCase();
    if(provider==='youtube'&&/^[A-Za-z0-9_-]{11}$/.test(String(x?.id||'')))return String(x.id);
    const u=String(x?.url||x?.href||x?.youtube_url||x?.webpage_url||x?.source_url||x?.media_url||x?.embed_url||x?.stream_url||x?.link||'');
    const m=u.match(/[?&]v=([A-Za-z0-9_-]{11})/)||u.match(/youtu\.be\/([A-Za-z0-9_-]{11})/)||u.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/);
    return m?.[1]||'';
  };
  const source=x=>String(x?.url||x?.href||x?.youtube_url||x?.webpage_url||x?.source_url||x?.media_url||x?.embed_url||x?.stream_url||x?.link||'');
  const mediaKey=x=>videoId(x)||source(x)||String(x?.titulo||x?.title||x?.nombre||'').trim().toLowerCase();
  const richness=x=>Object.values(x||{}).filter(v=>v!==null&&v!==undefined&&String(v)!=='').length;
  const normalizeRecent=list=>{
    const map=new Map();
    for(const raw of Array.isArray(list)?list:[]){
      if(!raw||typeof raw!=='object')continue;
      const id=videoId(raw),key=mediaKey(raw); if(!key)continue;
      const item={...raw};
      if(!item.url&&source(raw))item.url=source(raw);
      if(id){item.videoId=id;item.video_id=id;item.external_id=id;item.youtube_id=id;if(!item.url)item.url='https://www.youtube.com/watch?v='+id}
      item.title=item.title||item.titulo||item.nombre||'Contenido';
      item.titulo=item.titulo||item.title;
      const old=map.get(key);
      if(!old)map.set(key,item);
      else map.set(key,richness(item)>richness(old)?{...old,...item}:{...item,...old});
    }
    return [...map.values()].sort((a,b)=>(Number(b.ts)||0)-(Number(a.ts)||0)).slice(0,30);
  };

  // Unifica el esquema de Continuar viendo incluso cuando una vista antigua guarda un objeto reducido.
  try{
    const nativeSet=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){
      if(k==='uadav_recent_v11'){
        try{v=JSON.stringify(normalizeRecent(JSON.parse(v||'[]')))}catch(_){}
      }
      return nativeSet.call(this,k,v);
    };
    const current=JSON.parse(localStorage.getItem('uadav_recent_v11')||'[]');
    nativeSet.call(localStorage,'uadav_recent_v11',JSON.stringify(normalizeRecent(current)));
  }catch(_){}

  window.UADAV_CONFIG={
    async siteState(){return unwrap(await json('estado_sitio'))},
    async landing(){return unwrap(await json('landing_config'))},
    async layout(){return unwrap(await json('home_layout'))},
    async visibility(){return unwrap(await json('web_visibility'))},
    async all(){const [site,landing,layout,visibility]=await Promise.all([this.siteState(),this.landing(),this.layout(),this.visibility()]);return{site,landing,layout,visibility}}
  };

  // Home V11.7: Admin/landing_config manda; /public/landing queda como fallback del código heredado.
  document.addEventListener('DOMContentLoaded',async()=>{
    if(!/\/index-v117\.html$/i.test(location.pathname))return;
    const cfg=await window.UADAV_CONFIG.landing();
    if(!cfg||!Object.keys(cfg).length)return;
    const title=first(cfg,['brand_hero_title','home_title','hero_title','title']);
    const text=first(cfg,['brand_hero_description','home_description','hero_description','description']);
    const image=first(cfg,['brand_hero_image','home_image','hero_image','image']);
    const t=document.getElementById('heroTitle'),p=document.getElementById('heroText'),b=document.getElementById('back');
    if(t&&title)t.textContent=String(title);
    if(p&&text)p.textContent=String(text);
    if(b&&image){const safe=String(image).replace(/["'()]/g,'');b.style.backgroundImage='linear-gradient(90deg,#02050af2 5%,#02050ab8 45%,#02050a33 72%),linear-gradient(0deg,#03070d 0%,transparent 50%),url("'+safe+'")'}
  });
})();
