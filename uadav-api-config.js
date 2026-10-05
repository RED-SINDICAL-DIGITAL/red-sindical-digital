// ★ UADAV STREAM · API centralizada
// Fuente única de API para plataforma, Admin y vistas V11.7.
window.UADAV_API_BASE = window.UADAV_API_BASE || 'https://uadav-api.uadavstream.workers.dev/api/';
window.UADAV_USE_LOCAL_API = window.UADAV_USE_LOCAL_API === true;

// V11.7 Config Bridge
// Consume endpoints reales del Worker sin romper configuraciones anteriores.
(function(){
  'use strict';
  const API=window.UADAV_API_BASE;
  const json=async path=>{
    try{
      const r=await fetch(API+path+(path.includes('?')?'&':'?')+'_='+Date.now(),{cache:'no-store'});
      if(!r.ok) return null;
      return await r.json();
    }catch(_){return null}
  };
  const unwrap=x=>x&&typeof x==='object'?(x.data||x.config||x):{};
  const first=(o,keys)=>{for(const k of keys){const v=o?.[k];if(v!==undefined&&v!==null&&String(v).trim()!=='')return v}return null};

  window.UADAV_CONFIG={
    async siteState(){return unwrap(await json('estado_sitio'))},
    async landing(){return unwrap(await json('landing_config'))},
    async layout(){return unwrap(await json('home_layout'))},
    async visibility(){return unwrap(await json('web_visibility'))},
    async all(){
      const [site,landing,layout,visibility]=await Promise.all([
        this.siteState(),this.landing(),this.layout(),this.visibility()
      ]);
      return {site,landing,layout,visibility};
    }
  };

  // Compatibilidad V11.7: el Home anterior leía /public/landing.
  // Este bridge aplica primero landing_config (Admin) y deja el código antiguo como fallback.
  document.addEventListener('DOMContentLoaded',async()=>{
    const isHome=/\/index-v117\.html$/i.test(location.pathname);
    if(!isHome) return;
    const cfg=await window.UADAV_CONFIG.landing();
    if(!cfg||!Object.keys(cfg).length) return;
    const title=first(cfg,['brand_hero_title','home_title','hero_title','title']);
    const text=first(cfg,['brand_hero_description','home_description','hero_description','description']);
    const image=first(cfg,['brand_hero_image','home_image','hero_image','image']);
    const t=document.getElementById('heroTitle'),p=document.getElementById('heroText'),b=document.getElementById('back');
    if(t&&title)t.textContent=String(title);
    if(p&&text)p.textContent=String(text);
    if(b&&image){
      const safe=String(image).replace(/["'()]/g,'');
      b.style.backgroundImage='linear-gradient(90deg,#02050af2 5%,#02050ab8 45%,#02050a33 72%),linear-gradient(0deg,#03070d 0%,transparent 50%),url("'+safe+'")';
    }
  });
})();
