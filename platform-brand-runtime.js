// White-label runtime · CORE compatible with legacy UADAV globals.
(()=>{'use strict';
const API=window.UADAV_API_BASE||window.PLATFORM_API_BASE||'https://uadav-api.uadavstream.workers.dev/api/';
const up=(sel,attr,val)=>{if(!val)return;document.querySelectorAll(sel).forEach(el=>attr?el.setAttribute(attr,val):el.textContent=val)};
const meta=(name,val,prop=false)=>{if(!val)return;let el=document.head.querySelector(`meta[${prop?'property':'name'}="${name}"]`);if(!el){el=document.createElement('meta');el.setAttribute(prop?'property':'name',name);document.head.appendChild(el)}el.content=val};
const link=(rel,href)=>{if(!href)return;let el=document.head.querySelector('link[rel="'+rel+'"]');if(!el){el=document.createElement('link');el.rel=rel;document.head.appendChild(el)}el.href=href};
async function boot(){try{const [rh,rc]=await Promise.all([fetch(API+'seo/head?_='+Date.now(),{cache:'no-store'}),fetch(API+'config?_='+Date.now(),{cache:'no-store'}).catch(()=>null)]);if(!rh.ok)return;const c=await rh.json(),cfg=rc&&rc.ok?await rc.json():{},b=c.brand||{},seo=c.seo||{},brand={name:b.name||'UADAV STREAM',icon:b.icon||'★',logo_url:b.logo_url||'',favicon_url:b.favicon_url||'',tagline:b.tagline||'',seo};
window.PlatformBrand=brand;window.UADAVBrand=window.UADAVBrand||brand;
up('[data-brand-name]',null,brand.name);up('[data-brand-icon]',null,brand.icon);up('[data-brand-full]',null,(brand.icon?brand.icon+' ':'')+brand.name);up('[data-brand-logo]','src',brand.logo_url);
if(seo.title)document.title=seo.title;meta('description',seo.description);meta('keywords',seo.keywords);meta('google-site-verification',seo.google_site_verification);meta('msvalidate.01',seo.msvalidate_01);meta('og:title',seo.title,true);meta('og:description',seo.description,true);meta('og:image',seo.og_image,true);link('icon',brand.favicon_url);
const origin=String(seo.canonical_origin||'').replace(/\/$/,'');if(origin)link('canonical',origin+location.pathname+(location.search||''));
window.PlatformModules={artists:true,radio:true,podcasts:true,iptv:true,events:true,jobs:true,marketplace:true,pro:true,ads:true,...(cfg.modules||{})};document.dispatchEvent(new CustomEvent('platformbrand',{detail:brand}));document.dispatchEvent(new CustomEvent('platformmodules',{detail:window.PlatformModules}));
}catch(_){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();