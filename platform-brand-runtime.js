// White-label runtime · CORE compatible with legacy UADAV globals.
(() => {
  'use strict';
  const API = window.PLATFORM_API_BASE || window.UADAV_API_BASE || '/api/';
  const routes = {
    'artistas.html':['artists'], 'artista.html':['artists'],
    'gestionar-artista.html':['artists'], 'reclamar-artista.html':['artists'],
    'sumate-artista.html':['artists'], 'para-artistas.html':['artists'],
    'radio.html':['radio'], 'en-vivo.html':['iptv'],
    'cartelera.html':['events'], 'evento.html':['events'], 'publicar-evento.html':['events'],
    'trabajo.html':['jobs'], 'bolsa-trabajo.html':['jobs'],
    'marketplace.html':['marketplace'], 'contratar-artista.html':['marketplace'],
    'podcasts.html':['podcasts'], 'planes-artistas.html':['pro']
  };
  const defaults = {artists:true,radio:true,podcasts:true,iptv:true,events:true,jobs:true,marketplace:true,ticketing:true,pro:true,ads:true,union:false};
  const unwrap = value => value && typeof value === 'object' ? (value.data || value.config || value) : {};
  const pageKey = path => path.toLowerCase().split('/').pop();
  const disabled = key => (routes[key] || []).some(module => window.PlatformModules[module] === false);
  const up = (sel, attr, val) => {
    if (val === undefined || val === null) return;
    document.querySelectorAll(sel).forEach(el => attr ? el.setAttribute(attr,val) : el.textContent = val);
  };
  const safeURL = value => {
    if (!value) return '';
    try { const url = new URL(value,location.href); return /^https?:$/.test(url.protocol) ? url.href : ''; }
    catch (_) { return ''; }
  };
  const meta = (name,value,property=false) => {
    if (!value) return;
    let el = document.head.querySelector('meta['+(property?'property':'name')+'="'+name+'"]');
    if (!el) { el=document.createElement('meta'); el.setAttribute(property?'property':'name',name); document.head.appendChild(el); }
    el.content = String(value);
  };
  const link = (rel,value) => {
    const href = value && safeURL(value); if (!href) return;
    let el = document.head.querySelector('link[rel="'+rel+'"]');
    if (!el) { el=document.createElement('link'); el.rel=rel; document.head.appendChild(el); }
    el.href=href;
  };
  async function read(path) {
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),10000);
    try { const r=await fetch(API+path,{cache:'no-store',signal:ctl.signal}); return r.ok?unwrap(await r.json()):{}; }
    catch (_) { return {}; } finally { clearTimeout(timer); }
  }
  function applyNavigation(root=document) {
    root.querySelectorAll('a[href],[data-platform-module]').forEach(el => {
      let off=false;
      const explicit=el.getAttribute('data-platform-module');
      if (explicit) off=window.PlatformModules[explicit]===false;
      if (el.matches('a[href]')) {
        try { const url=new URL(el.getAttribute('href'),location.href); if(url.origin===location.origin) off=off||disabled(pageKey(url.pathname)); } catch (_) {}
      }
      if(off) { el.hidden=true; el.setAttribute('aria-hidden','true'); el.setAttribute('data-platform-disabled','true'); }
      else if(el.hasAttribute('data-platform-disabled')) { el.hidden=false; el.removeAttribute('aria-hidden'); el.removeAttribute('data-platform-disabled'); }
    });
  }
  function unavailable(brand) {
    // Build with DOM APIs: brand names are text, never executable markup.
    const main=document.createElement('main'); main.style.cssText='max-width:560px;margin:15vh auto;padding:28px;text-align:center;color:#fff;font-family:system-ui';
    const title=document.createElement('h1');title.textContent='Módulo no disponible';
    const text=document.createElement('p');text.textContent='Esta función no está habilitada en '+brand.name+'.';
    const back=document.createElement('a');back.href='/app.html';back.textContent='Volver al inicio';back.style.cssText='display:inline-block;padding:11px 16px;border-radius:999px;background:var(--platform-primary);color:white';
    main.append(title,text,back);document.body.replaceChildren(main);document.body.style.background='#050608';
  }
  async function boot() {
    const [head,cfg]=await Promise.all([read('seo/head'),read('config')]);
    const b=head.brand||cfg.branding||cfg.platform||{},seo=head.seo||cfg.seo||{};
    const color=/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(b.primary_color||'')?b.primary_color:'#2f6df6';
    const brand={name:String(b.name||'PLATFORM'),icon:String(b.icon??'★'),logo_url:safeURL(b.logo_url||''),favicon_url:safeURL(b.favicon_url||''),tagline:String(b.tagline||''),primary_color:color,support_email:String(b.support_email||''),seo};
    window.PlatformBrand=brand;window.UADAVBrand=brand;
    window.PlatformModules={...defaults};
    const flags={...(head.modules||{}),...(cfg.modules||{})};
    for(const key of Object.keys(defaults)) if(typeof flags[key]==='boolean') window.PlatformModules[key]=flags[key];
    for(const name of ['--platform-primary','--brand-primary','--accent','--blue']) document.documentElement.style.setProperty(name,color);
    up('[data-brand-name]',null,brand.name);up('[data-brand-icon]',null,brand.icon);up('[data-brand-full]',null,[brand.icon,brand.name].filter(Boolean).join(' '));
    if(brand.logo_url)up('[data-brand-logo]','src',brand.logo_url);
    if(seo.title)document.title=seo.title;
    meta('description',seo.description);meta('keywords',seo.keywords);
    meta('google-site-verification',seo.google_site_verification);meta('msvalidate.01',seo.msvalidate_01);
    meta('og:title',seo.title,true);meta('og:description',seo.description,true);meta('og:image',seo.og_image,true);
    link('icon',brand.favicon_url);
    const origin=seo.canonical_origin&&safeURL(seo.canonical_origin);
    if(origin)link('canonical',new URL(location.pathname+location.search,origin).href);
    document.dispatchEvent(new CustomEvent('platformbrand',{detail:brand}));
    document.dispatchEvent(new CustomEvent('platformmodules',{detail:window.PlatformModules}));
    if(disabled(pageKey(location.pathname))) { unavailable(brand); return; }
    applyNavigation();
    // Views insert links asynchronously. Observe inserted elements, not our own attributes.
    const observer=new MutationObserver(entries => {
      if(entries.some(entry=>entry.addedNodes.length))applyNavigation();
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  window.PlatformBrandReady = document.readyState==='loading'
    ? new Promise(resolve=>document.addEventListener('DOMContentLoaded',()=>resolve(boot()),{once:true}))
    : boot();
})();
