
document.addEventListener('DOMContentLoaded',()=>{
  try{
    const tv=new URLSearchParams(location.search).get('tv')==='1';
    if(!tv)return;
    document.body.classList.add('uadav-tv-mode');
    const makeFocusable=()=>{
      const selectors=['.nav a','.nav button','.nav input','.hero button','.row-more','.card','.radio-card','.artist-card-v28','.artist-card-v29','.hero-editorial-card','.search-entity-card','.result-chip','.chat-close','.chat-send button','.info-close'];
      document.querySelectorAll(selectors.join(',')).forEach(el=>{
        if(el.getAttribute('tabindex')===null) el.setAttribute('tabindex','0');
      });
    };
    makeFocusable();
    new MutationObserver(makeFocusable).observe(document.body,{subtree:true,childList:true});
    document.addEventListener('DOMContentLoaded',()=>{
      $('radioPlayerToggle')?.addEventListener('click',()=>{if(window.parent!==window){const isPlaying=$('radioPlayerToggle')?.textContent==='❚❚';try{window.parent.postMessage({type:isPlaying?'uadav:radio-pause':'uadav:radio-play',radio:currentRadiosCache.find(x=>String(x.stream_url||x.url||'')===String(activeRadio||''))},location.origin)}catch{};return}const a=$('radioAudio');if(!a)return;if(a.paused)a.play().catch(()=>{});else pausarRadio()});$('radioPlayerClose')?.addEventListener('click',()=>{if(window.parent!==window){try{window.parent.postMessage({type:'uadav:radio-close'},location.origin)}catch{};activeRadio=null}else pausarRadio();const d=$('radioPlayerDock');if(d)d.hidden=true});$('radioPlayerMute')?.addEventListener('click',()=>{if(window.parent!==window){try{window.parent.postMessage({type:'uadav:radio-mute'},location.origin)}catch{};return}const a=$('radioAudio');if(!a)return;a.muted=!a.muted;$('radioPlayerMute').textContent=a.muted?'🔇':'🔊'});$('radioPlayerOpen')?.addEventListener('click',()=>{const r=currentRadiosCache.find(x=>String(x.stream_url||x.url||'')===String(activeRadio||''));if(r){const href='/radio.html?id='+encodeURIComponent(r.id||r.nombre||'');if(window.parent!==window)window.parent.postMessage({type:'uadav:navigate',href},location.origin);else location.href=href}});$('radioPlayerDiscover')?.addEventListener('click',()=>{const r=currentRadiosCache.find(x=>String(x.stream_url||x.url||'')===String(activeRadio||''));const st=r?radioTrackState.get(r.nombre||r.stream_url||''):null;if(r&&st)descubrirTemaRadio(r,st)});$('radioPlayerVolume')?.addEventListener('input',e=>{const v=Math.max(0,Math.min(1,Number(e.target.value)));if(window.parent!==window){try{window.parent.postMessage({type:'uadav:radio-volume',value:v},location.origin)}catch{};return}const a=$('radioAudio');if(a){a.volume=v;a.muted=false;if($('radioPlayerMute'))$('radioPlayerMute').textContent='🔊'}});$('radioPlayerVolume')?.addEventListener('change',e=>{const a=$('radioAudio');if(a)a.volume=Number(e.target.value)});$('radioAudio')?.addEventListener('play',()=>{if($('radioPlayerToggle'))$('radioPlayerToggle').textContent='❚❚';if($('radioPlayerStatus'))$('radioPlayerStatus').innerHTML='<span class="live-dot"></span>REPRODUCIENDO'});$('radioAudio')?.addEventListener('pause',()=>{if($('radioPlayerToggle'))$('radioPlayerToggle').textContent='▶';if($('radioPlayerStatus'))$('radioPlayerStatus').innerHTML='<span class="live-dot"></span>PAUSADO'});
    });
    document.addEventListener('keydown',e=>{
      if(!document.body.classList.contains('uadav-tv-mode'))return;
      const active=document.activeElement;
      if(['INPUT','TEXTAREA'].includes(active?.tagName)){
        if(e.key==='Escape'){active.blur();return;}
        if(e.key!=='ArrowDown'&&e.key!=='ArrowUp'&&e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
      }
      const container=active?.closest('.rail,.search-group-grid,.nav-links,.hero-actions,.nav-actions');
      const items=container?[...container.querySelectorAll('a,button,input,.card,.radio-card,.artist-card-v28,.artist-card-v29,.hero-editorial-card,.search-entity-card,.result-chip')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&!el.disabled}):[];
      const index=items.indexOf(active);
      if((e.key==='ArrowRight'||e.key==='ArrowLeft')&&items.length>1&&index>=0){
        e.preventDefault();
        const next=e.key==='ArrowRight'?index+1:index-1;
        items[(next+items.length)%items.length].focus({preventScroll:false});
        return;
      }
      if((e.key==='ArrowDown'||e.key==='ArrowUp')&&active){
        e.preventDefault();
        const rows=[...document.querySelectorAll('#heroSection,.row,.search-wrap,.features,.cta,footer')].filter(el=>{const r=el.getBoundingClientRect();return r.height>0});
        if(!rows.length)return;
        const y=window.scrollY+active.getBoundingClientRect().top;
        let target=-1;
        if(e.key==='ArrowDown') target=rows.findIndex(el=>el.offsetTop>y+40);
        else {for(let i=rows.length-1;i>=0;i--){if(rows[i].offsetTop<y-40){target=i;break;}}}
        if(target>=0){rows[target].scrollIntoView({behavior:'smooth',block:'center'});}
        return;
      }
      if(e.key==='Home'){e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});document.querySelector('.brand')?.focus();}
      if(e.key==='End'){e.preventDefault();window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'});}
      if(e.key==='Enter'&&active && !['INPUT','TEXTAREA'].includes(active.tagName)){active.click();}
    });
  }catch(err){console.warn('TV navigation init',err)}
});




    const API_REMOTE = window.UADAV_API_BASE || 'https://uadav-api.uadavstream.workers.dev/api/';
    const API_LOCAL = location.origin + '/api/';
    const API_URL = window.UADAV_USE_LOCAL_API===true ? API_LOCAL : API_REMOTE;
    const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&q=80';
    const STORAGE_KEY = 'uadavstream_discovery_v1';
    let config = {};
    let footerConfigPublic = {};
    function renderDynamicFooterLinks(){ const box=$('footerLinks'); if(!box)return; const base=(footerConfigPublic?.links||[]); const defaults=[{label:'Explorar',url:'/index.html'},{label:'Artistas',url:'#artists'},{label:'Cartelera',url:'/cartelera.html'},{label:'Sumate como artista',url:'/sumate-artista.html'},{label:'Bolsa de trabajo',url:'/bolsa-trabajo.html'}]; const links=base.length?base:defaults; if(footerConfigPublic?.mostrar_links===false){box.innerHTML='';return;} box.innerHTML=links.filter(x=>x&&x.visible!==false).map(x=>{const u=String(x.url||'#');const onclick=u==='#artists'?" onclick=\"irASeccion('artists');return false\"":'';return '<a href=\"'+safe(u)+'\"'+onclick+'>'+safe(x.label||'Enlace')+'</a>'}).join(''); }
    let allVideos = [];
    let allArtists = [];
    let webVisibility = {hero:true,search:true,banners:true,continue:true,saved:true,featured:true,recommended:true,live:true,radios:true,artists:true,shorts:true,jobs:true,cartelera:true,discover:true,features:true,cta:true,newsletter:true,footer:true};
    const DEFAULT_HOME_ORDER=['continueRow','savedRow','featuredRow','adminSectionsContainer','recommendedRow','liveRow','radiosRow','artists','shortsRow','jobsRow','cartelera','discoverRow'];
    let homeLayout={order:[...DEFAULT_HOME_ORDER]};
    let activeRadio = null;
    let selectedRadioHub = null;
    const radioTrackState = new Map();
    const RADIO_COVER_CACHE_TTL = 6 * 60 * 60 * 1000;
    const radioMetaSources=new Map();
    const RADIO_HISTORY_KEY='uadavstream_radio_history_v1';
    const RADIO_HISTORY_LIMIT=12;

    const $ = id => document.getElementById(id);
    const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

    function getDiscovery(){
      try{
        const d=JSON.parse(localStorage.getItem(STORAGE_KEY))||{};
        d.history=Array.isArray(d.history)?d.history:[];
        d.saved=Array.isArray(d.saved)?d.saved:[];
        d.categories=d.categories&&typeof d.categories==='object'?d.categories:{};
        return d;
      }catch{return {history:[],saved:[],categories:{}}}
    }
    function setDiscovery(d){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(d))}catch{}}
    const STOPWORDS=new Set(['para','como','desde','sobre','este','esta','esto','con','una','uno','los','las','del','por','que','muy','más','mas','the','and','you','your','video','official','oficial']);
    const TOPIC_GROUPS={
      musica:['musica','music','cancion','canciones','videoclip','cover','sintetizador','banda','album','dj'],
      teatro:['teatro','obra','actor','actriz','escena','monologo'],
      circo:['circo','acrobacia','malabares','trapecio','payaso'],
      humor:['humor','comedia','comico','stand up','standup'],
      magia:['magia','mago','ilusionismo','mentalismo'],
      danza:['danza','baile','ballet','coreografia'],
      variedades:['variedades','show','espectaculo','espectáculo','variete','varieté'],
      podcast:['podcast','entrevista','radio','streaming'],
      infantil:['infantil','niños','ninos','familia']
    };
    function normText(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
    function tokenize(v){return normText(v).split(/[^a-z0-9áéíóúüñ]+/i).filter(w=>w.length>=4&&!STOPWORDS.has(w)).slice(0,40)}
    function detectTopics(v){
      const text=normText([v?.titulo,v?.descripcion,v?.categoria,v?.author,v?.channelTitle].filter(Boolean).join(' '));
      const out=[];
      for(const [topic,words] of Object.entries(TOPIC_GROUPS)){if(words.some(w=>text.includes(normText(w))))out.push(topic)}
      if(v?.categoria&&normText(v.categoria)!=='resultado')out.push(normText(v.categoria));
      return [...new Set(out)];
    }
    function ensureDiscoveryShape(d){
      d.history=Array.isArray(d.history)?d.history:[];
      d.saved=Array.isArray(d.saved)?d.saved:[];
      d.categories=d.categories&&typeof d.categories==='object'?d.categories:{};
      d.terms=d.terms&&typeof d.terms==='object'?d.terms:{};
      d.topics=d.topics&&typeof d.topics==='object'?d.topics:{};
      d.creators=d.creators&&typeof d.creators==='object'?d.creators:{};
      d.searches=Array.isArray(d.searches)?d.searches:[];
      d.visitorId=d.visitorId||((crypto?.randomUUID)?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2));
      return d;
    }
    // Compatibilidad de API interna: todas las funciones de descubrimiento usan este normalizador.
    function ensureDiscovery(d){
      return ensureDiscoveryShape(d || {});
    }
    function registerInterest(v,weight=1){
      uadavSendMetric('media_play',{content_id:v.id,title:v.titulo||'',author:v.author||v.channelTitle||'',media_type:'video',category:v.categoria||''});
      const d=ensureDiscovery(getDiscovery());
      for(const t of tokenize([v?.titulo,v?.descripcion,v?.categoria].filter(Boolean).join(' ')))d.terms[t]=(d.terms[t]||0)+weight;
      for(const topic of detectTopics(v))d.topics[topic]=(d.topics[topic]||0)+weight*2;
      const creator=String(v?.author||v?.channelTitle||'').trim();
      if(creator)d.creators[creator]=(d.creators[creator]||0)+weight;
      setDiscovery(d);
    }

    // ============================================================
    // UADAV STREAM V29 — Analytics + métricas internas
    // ============================================================
    let uadavAnalyticsLoaded=false;
    async function uadavSendMetric(type,data={}){
      try{await fetch(API_URL+'metrics/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,...data})});}catch{}
    }
    async function uadavLoadAnalytics(){
      try{
        await uadavSendMetric('page_view',{content_id:location.pathname});
        const cfg=await api('analytics/config');
        if(!cfg?.enabled||!cfg?.measurement_id)return;
        const consentOk=cfg.consent_required!==true || localStorage.getItem('uadav_analytics_consent')==='granted';
        if(!consentOk)return;
        if(window.__uadavGA4Loaded)return;
        window.__uadavGA4Loaded=true;
        const mid=String(cfg.measurement_id).trim();
        const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(mid);document.head.appendChild(s);
        window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',mid,{send_page_view:true});uadavAnalyticsLoaded=true;
      }catch{}
    }
    function rememberVideo(v){
      if(!v?.id)return;
      const d=ensureDiscovery(getDiscovery());
      d.history=[{
        id:v.id,titulo:v.titulo||'Video',
        descripcion:v.descripcion||v.categoria||'Contenido',
        thumbnail:v.thumbnail||obtenerCaratula(v.id),
        categoria:v.categoria||'Contenido',
        author:v.author||v.channelTitle||'',
        topics:detectTopics(v),ts:Date.now()
      },...d.history.filter(x=>x.id!==v.id)].slice(0,40);
      const cat=normText(v.categoria||'Contenido');
      if(cat) d.categories[cat]=(d.categories[cat]||0)+1;
      registerInterest(v,Math.max(1,Number(v.watchWeight||1)));
      setDiscovery(d);renderContinue();try{renderRecommendations(v)}catch(e){console.warn('Recomendaciones:',e)}renderSaved();
    }
    function registerSearchInterest(q){
      const s=String(q||'').trim();if(!s)return;
      const d=ensureDiscovery(getDiscovery());
      d.searches=[{q:s,ts:Date.now()},...d.searches.filter(x=>normText(x.q)!==normText(s))].slice(0,20);
      for(const t of tokenize(s))d.terms[t]=(d.terms[t]||0)+2;
      for(const topic of detectTopics({titulo:s,categoria:s}))d.topics[topic]=(d.topics[topic]||0)+3;
      setDiscovery(d);
    }
    function savedIds(){
      return getDiscovery().saved.map(x=>typeof x==='string'?x:x?.id).filter(Boolean);
    }
    function isSaved(id){return savedIds().includes(id)}
    function toggleSaved(v){
      const d=getDiscovery();
      const id=v?.id;
      if(!id)return false;
      if(isSaved(id)) d.saved=d.saved.filter(x=>(typeof x==='string'?x:x?.id)!==id);
      else d.saved.unshift({
        id,titulo:v.titulo||'Video',
        descripcion:v.descripcion||'Contenido',
        thumbnail:v.thumbnail||obtenerCaratula(id),
        categoria:v.categoria||'Contenido',ts:Date.now()
      });
      setDiscovery(d);renderSaved();
      return isSaved(id);
    }

    async function api(path, options={}){
      const suffix=(path.includes('?')?'&':'?')+'_='+Date.now();
      const bases=[API_REMOTE,...(window.UADAV_USE_LOCAL_API===true?[API_LOCAL]:[])];
      let lastError=null;
      for(const base of [...new Set(bases)]){
        try{
          const res=await fetch(base+path+suffix,{cache:'no-store',...options});
          const ct=(res.headers.get('content-type')||'').toLowerCase();
          if(!res.ok){lastError=new Error('API '+res.status);continue;}
          if(!ct.includes('json')){lastError=new Error('Respuesta API no JSON');continue;}
          return await res.json();
        }catch(e){lastError=e;}
      }
      throw lastError||new Error('API no disponible');
    }

    async function cargarEstadoSitio(){
      try{
        const estado=await api('estado_sitio');
        const modo=String(estado?.modo||'normal');
        if(modo==='mantenimiento'){
          $('maintenanceTitle').textContent=estado.titulo||'UADAV STREAM';
          $('maintenanceMessage').textContent=estado.mensaje||'Estamos realizando tareas de actualización. Volvemos enseguida.';
          $('publicMaintenance').hidden=false;
          document.body.classList.add('public-maintenance-active');
          return 'mantenimiento';
        }
        if(modo==='landing'){
          const target=estado.landing_url||'/landing.html';
          if(target && target!==location.pathname){ location.replace(target); return 'landing'; }
        }
        $('publicMaintenance').hidden=true;
        return 'normal';
      }catch(e){
        console.warn('[UADAV] No se pudo leer estado_sitio:',e);
        $('publicMaintenance').hidden=true;
        return 'normal';
      }
    }

    async function cargarBannersPublicos(){
      try{
        try{const p=JSON.parse(localStorage.getItem('uadavstream_audience_profile_v1')||'{}'); if(p.premium&&p.premium.expires&&Date.now()<Date.parse(p.premium.expires)){ ['bannerTopContainer','bannerInfeedContainer','bannerFooterContainer'].forEach(id=>{if($(id)){ $(id).innerHTML=''; $(id).hidden=true; }}); return; }}catch{}
        const data=await api('banners');
        const slots=[
          ['top','bannerTopContainer','Superior'],
          ['infeed','bannerInfeedContainer','Contenido patrocinado'],
          ['footer','bannerFooterContainer','Publicidad']
        ];
        slots.forEach(([slot,id,label])=>{
          const el=$(id), cfg=data?.[slot];
          if(!el)return;
          const html=String(cfg?.html||'').trim();
          const activo=cfg && cfg.activo!==false && html;
          if(activo){
            el.innerHTML=`<div class="public-banner-shell"><div class="public-banner-label"><i class="fa-solid fa-rectangle-ad"></i>${label}</div><div class="public-banner-content">${html}</div></div>`;
            el.hidden=false;
          }else{
            el.innerHTML='';
            el.hidden=true;
          }
        });
      }catch(e){
        console.warn('[UADAV] Banners no disponibles:',e);
      }
    }

    async function cargarConfig(){
      try{
        const results=await Promise.all([api('landing_config'),api('footer_config')]);
        config=results[0]||{}; footerConfigPublic=results[1]||{}; aplicarConfig(); aplicarFooterConfig(footerConfigPublic);
      }catch(e){console.warn('No se pudo cargar configuración',e)}
    }

    function normalizarWhatsApp(v){
      const raw=String(v||'').trim(); if(!raw)return '';
      if(/^https?:\/\//i.test(raw))return raw;
      const digits=raw.replace(/[^0-9]/g,''); return digits?'https://wa.me/'+digits:'';
    }
    function aplicarFooterConfig(f){
      const cfg=f||{};
      const set=(id,v)=>{const el=$(id);if(el)el.textContent=v??''};
      set('footerTexto',cfg.titulo||'UADAV STREAM');
      set('footerContacto',cfg.subtitulo||'La plataforma audiovisual de los artistas de variedades.');
      const extra=[]; if(cfg.contacto)extra.push(cfg.contacto); if(cfg.whatsapp_texto)extra.push('WhatsApp: '+cfg.whatsapp_texto); set('footerContactoExtra',extra.join(' · '));
      const logo=$('footerLogo'); if(logo){if(cfg.logo_url){logo.src=cfg.logo_url;logo.style.display='block'}else{logo.removeAttribute('src');logo.style.display='none'}}
      const socials=$('footerSocials'); if(socials){socials.innerHTML=''; const links=[['instagram',cfg.instagram,'fa-instagram'],['facebook',cfg.facebook,'fa-facebook-f'],['twitter',cfg.twitter,'fa-x-twitter'],['youtube',cfg.youtube,'fa-youtube'],['tiktok',cfg.tiktok,'fa-tiktok']]; if(cfg.mostrar_redes!==false){for(const [key,url,icon] of links){if(url) socials.innerHTML+=`<a href="${String(url).replace(/"/g,'%22')}" target="_blank" rel="noopener" aria-label="${key}"><i class="fa-brands ${icon}"></i></a>`} const wa=normalizarWhatsApp(cfg.whatsapp||cfg.whatsapp_url||cfg.whatsapp_texto); if(wa)socials.innerHTML+=`<a href="${wa}" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>`; } socials.hidden=cfg.mostrar_redes===false || !socials.innerHTML;}
      const linksBox=$('footerLinks'); if(linksBox)linksBox.hidden=cfg.mostrar_links===false;
      const copy=$('footerCopyright'); if(copy)copy.textContent=cfg.copyright||('© '+new Date().getFullYear()+' ★ UADAV STREAM · Todos los derechos reservados.');
      const legalOn=cfg.mostrar_legales!==false;
      const privacy=$('footerPrivacy'),terms=$('footerTerms');
      if(privacy){privacy.href=cfg.privacy_url||'/privacidad.html';privacy.hidden=!legalOn;}
      if(terms){terms.href=cfg.terms_url||'/terminos.html';terms.hidden=!legalOn;}
    }
    let heroSpotlights=[];
    let heroSpotlightIndex=0;
    let heroRotationTimer=null;
    let heroRotationPaused=false;

    function aplicarConfig(){
      const c=config||{};
      const setText=(id,v)=>{const el=$(id);if(el)el.textContent=v??''};
      const setHTML=(id,v)=>{const el=$(id);if(el)el.innerHTML=v??''};
      setText('mensajeEspera',c.mensaje_espera||'Mostrá tu trabajo, sumate a UADAV STREAM y ayudá a que tu público te encuentre.');
      setHTML('btnCaptador','<i class="fa-solid fa-bell"></i> '+(c.texto_boton_captador||'Avisarme'));
      setText('footerTexto',c.footer_texto||'UADAV STREAM');
      setText('footerContacto',c.footer_contacto||'La plataforma audiovisual de los artistas de variedades.');
      document.documentElement.style.setProperty('--bg',c.color_fondo||'#070707');document.documentElement.style.setProperty('--accent',c.color_acento||'#00e5ff');document.documentElement.style.setProperty('--surface',c.color_tarjetas||'#111114');document.documentElement.style.setProperty('--text',c.color_texto_principal||'#fff');document.documentElement.style.setProperty('--muted',c.color_texto_secundario||'#a4a4ad');
      const hero=$('heroSection');if(c.hero_imagen&&hero)hero.style.setProperty('--hero-image',`url("${String(c.hero_imagen).replace(/"/g,'%22')}")`);
      aplicarHeroMedia(c);
      if(c.nombre_app)setText('brandName',c.nombre_app);
      const logo=c.branding?.logo_url||'';
      if(logo){const img=$('heroBadgeIcon');const media=$('heroBadgeMedia'),star=$('heroBadgeStar');if(img){img.src=logo;if(media)media.classList.add('has-image');if(star)star.style.display='none';}const brand=$('brandLogo'),fallback=$('brandLogoFallback');if(brand){brand.src=logo;brand.style.display='block';if(fallback)fallback.style.display='none';}}
      const incoming=Array.isArray(c.hero_spotlights)?c.hero_spotlights:[c.hero_spotlight].filter(Boolean);
      heroSpotlights=incoming.filter(h=>h&&h.active!==false&&((h.title||h.description||h.image||h.gif_url)));
      if(!heroSpotlights.length)heroSpotlights=[{active:true,category:'UADAV STREAM',kicker:'UADAV STREAM',title:'El arte escénico al alcance de todos.',description:'Descubrí artistas, videos, espectáculos, transmisiones y mucho más en un solo lugar.',action_type:'section',action_target:'contenido'}];
      heroSpotlightIndex=Math.min(heroSpotlightIndex,heroSpotlights.length-1);
      iniciarHeroRotacion();renderHeroEditorial();aplicarHeroSpotlight();
    }

    function aplicarHeroMedia(h){
      const hero=document.getElementById('heroSection'); if(!hero)return;
      const src=h?.hero_gif||h?.hero_imagen||'';
      let img=document.getElementById('heroVisualMedia');
      if(!src){if(img)img.hidden=true;hero.classList.remove('has-visual-media');return;}
      if(!img){img=document.createElement('img');img.id='heroVisualMedia';img.alt='';img.className='hero-visual-media';hero.insertBefore(img,hero.firstChild);}
      img.src=src; img.hidden=false;
      hero.classList.add('has-visual-media');
    }
    function renderHeroDots(){
      const wrap=$('heroRotation'),dots=$('heroDots');if(!wrap||!dots)return;
      if(heroSpotlights.length<=1){wrap.hidden=true;dots.innerHTML='';return;}
      wrap.hidden=false;
      dots.innerHTML=heroSpotlights.map((_,i)=>`<button class="hero-dot${i===heroSpotlightIndex?' active':''}" type="button" aria-label="Destacado ${i+1}" data-hero-dot="${i}"></button>`).join('');
      dots.querySelectorAll('[data-hero-dot]').forEach(b=>b.addEventListener('click',()=>{heroSpotlightIndex=Number(b.dataset.heroDot)||0;aplicarHeroSpotlight();reiniciarHeroTimer()}));
    }
    function cambiarHero(delta){if(heroSpotlights.length<=1)return;heroSpotlightIndex=(heroSpotlightIndex+delta+heroSpotlights.length)%heroSpotlights.length;aplicarHeroSpotlight();reiniciarHeroTimer()}
    function reiniciarHeroTimer(){clearInterval(heroRotationTimer);heroRotationTimer=null;if(heroSpotlights.length<=1||heroRotationPaused||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;heroRotationTimer=setInterval(()=>cambiarHero(1),7000)}
    function iniciarHeroRotacion(){
      const hero=$('heroSection');if(!hero)return;
      hero.onmouseenter=()=>{heroRotationPaused=true;clearInterval(heroRotationTimer);heroRotationTimer=null};
      hero.onmouseleave=()=>{heroRotationPaused=false;reiniciarHeroTimer()};
      hero.onfocusin=()=>{heroRotationPaused=true;clearInterval(heroRotationTimer);heroRotationTimer=null};
      hero.onfocusout=()=>{heroRotationPaused=false;reiniciarHeroTimer()};
      if(hero.dataset.rotationReady!=='1'){ $('heroPrevBtn')?.addEventListener('click',()=>cambiarHero(-1)); $('heroNextBtn')?.addEventListener('click',()=>cambiarHero(1)); hero.dataset.rotationReady='1'; }
    }
    function renderHeroEditorial(){
      const row=$('heroEditorialRow'),rail=$('heroEditorialRail');if(!row||!rail)return;
      const items=heroSpotlights.slice(1);
      if(items.length<2){row.hidden=true;rail.innerHTML='';return;}
      row.hidden=false;
      rail.innerHTML=items.map((h,i)=>{
        const title=safe(h.title||'Destacado'),meta=safe(h.category||h.kicker||'UADAV STREAM'),img=safe(h.image||h.hero_imagen||h.gif_url||FALLBACK_THUMB);
        return `<article class="hero-editorial-card" data-hero-editorial="${i+1}"><img src="${img}" alt="${title}" loading="lazy" onerror="this.src='${FALLBACK_THUMB}'"><div class="hero-editorial-copy"><div class="hero-editorial-kicker">${meta}</div><div class="hero-editorial-title">${title}</div><div class="hero-editorial-meta">${safe(h.description||'Descubrilo en UADAV STREAM')}</div></div></article>`;
      }).join('');
      rail.querySelectorAll('[data-hero-editorial]').forEach(el=>el.addEventListener('click',()=>{heroSpotlightIndex=Number(el.dataset.heroEditorial)||0;aplicarHeroSpotlight();reiniciarHeroTimer();$('heroSection')?.scrollIntoView({behavior:'smooth',block:'start'})}));
    }
    function heroKind(h={}){
      const t=String(h.action_type||h.type||h.tipo||'section').toLowerCase();
      if(['event','evento'].includes(t))return 'event';
      if(['artist','artista'].includes(t))return 'artist';
      if(['radio'].includes(t))return 'radio';
      if(['video','youtube'].includes(t))return 'video';
      if(['live','en_vivo'].includes(t))return 'live';
      return t||'section';
    }
    function aplicarHeroSpotlight(){
      const h=heroSpotlights[heroSpotlightIndex]||{};
      heroSpotlight=h;
      const active=h.active!==false && (h.title||h.description||h.image);
      const kind=heroKind(h);
      $('heroCategoria').textContent=h.category||({event:'EVENTO',artist:'ARTISTA',radio:'RADIO',video:'VIDEO',live:'EN VIVO'}[kind]||'UADAV STREAM');
      $('heroKicker').textContent=h.kicker||'★ UADAV STREAM';
      $('heroTitulo').textContent=active?h.title:'El arte escénico al alcance de todos.';
      let desc=h.description||'';
      if(kind==='event' && desc.length>180)desc=desc.slice(0,177).trim()+'…';
      $('heroSubtitulo').textContent=active?desc:'Descubrí artistas, videos, espectáculos, transmisiones y mucho más en un solo lugar.';
      if(h.image)$('heroSection').style.setProperty('--hero-image',`url("${String(h.image).replace(/"/g,'%22')}")`);
      const play=$('heroPlayBtn'),more=$('heroMoreBtn');
      const labels={
        event:['<i class="fa-solid fa-calendar-days"></i> Ver evento', h.action_url||h.ticket_url||h.link_compra?'<i class="fa-solid fa-ticket"></i> Entradas':'<i class="fa-solid fa-circle-info"></i> Detalles'],
        artist:['<i class="fa-solid fa-user"></i> Ver perfil','<i class="fa-solid fa-handshake"></i> Contratar'],
        radio:['<i class="fa-solid fa-play"></i> Escuchar','<i class="fa-solid fa-radio"></i> Ver radio'],
        live:['<i class="fa-solid fa-play"></i> Ver en vivo','<i class="fa-solid fa-circle-info"></i> Más información'],
        video:['<i class="fa-solid fa-play"></i> Reproducir','<i class="fa-solid fa-circle-info"></i> Más información']
      };
      const pair=labels[kind]||['<i class="fa-solid fa-arrow-right"></i> Abrir','<i class="fa-solid fa-circle-info"></i> Más información'];
      if(play){play.innerHTML=pair[0];play.onclick=()=>ejecutarHeroAction();}
      if(more){more.innerHTML=pair[1];more.onclick=()=>ejecutarHeroSecondary();}
      const badge=$('heroBadgeMedia');
      if(h.icon_url){$('heroBadgeIcon').src=h.icon_url;badge.classList.add('has-image');$('heroBadgeStar').style.display='none'}
      aplicarHeroMedia(h);
      renderHeroDots();
    }

    function ejecutarHeroAction(){
      const h=heroSpotlight||{};
      const type=heroKind(h);
      if(type==='video'&&h.action_id)return reproducirVideo(h.action_id,h.title,h.description,{id:h.action_id,titulo:h.title,descripcion:h.description,thumbnail:h.image,categoria:h.category||'Destacado'});
      if(type==='live'){const s=currentLiveCache.find(x=>String(x.id)===String(h.action_id)||String(x.youtube_id)===String(h.action_id));if(s)return reproducirSenal(s)}
      if(type==='radio'){const r=currentRadiosCache.find(x=>String(x.id)===String(h.action_id)||String(x.nombre)===String(h.action_id));if(r){abrirRadioHub(r);return} if(h.action_id)location.href='/radio.html?id='+encodeURIComponent(h.action_id);return;}
      if(type==='event'){const id=h.action_id||h.event_id;if(id){location.href='/evento.html?id='+encodeURIComponent(id);return;} if(h.action_url){location.href=h.action_url;return;}}
      if(type==='artist'){const id=h.action_id||h.artist_id;if(id){location.href='/artista.html?id='+encodeURIComponent(id);return;} if(h.action_url){location.href=h.action_url;return;}}
      if(type==='section'&&(h.action_id||h.action_target))return irASeccion(h.action_id||h.action_target);
      if(type==='url'&&h.action_url)window.open(h.action_url,'_blank','noopener');
      abrirInfoOverlay();
    }
    function ejecutarHeroSecondary(){
      const h=heroSpotlight||{},type=heroKind(h);
      if(type==='event'){
        const ticket=h.ticket_url||h.link_compra||h.action_url_secondary||h.action_url;
        if(ticket){window.open(ticket,'_blank','noopener');return;}
      }
      if(type==='artist'){
        const id=h.action_id||h.artist_id;if(id){location.href='/contratar-artista.html?artist='+encodeURIComponent(id);return;}
      }
      if(type==='radio'){
        const id=h.action_id||h.radio_id;if(id){location.href='/radio.html?id='+encodeURIComponent(id);return;}
      }
      abrirInfoOverlay();
    }

    function abrirInfoOverlay(){
      const h=heroSpotlight||{};
      $('infoKicker').textContent=h.category||'UADAV STREAM';
      $('infoTitle').textContent=h.title||'Contenido UADAV STREAM';
      $('infoDescription').textContent=h.description||'Contenido disponible en UADAV STREAM.';
      const img=$('infoMedia');
      if(h.image){img.src=h.image;img.classList.add('has-media')}else{img.removeAttribute('src');img.classList.remove('has-media')}
      $('infoPlayBtn').onclick=()=>{cerrarInfoOverlay();ejecutarHeroAction()};
      $('infoOverlay').classList.add('active');$('infoOverlay').setAttribute('aria-hidden','false');
    }
    function cerrarInfoOverlay(){ $('infoOverlay').classList.remove('active');$('infoOverlay').setAttribute('aria-hidden','true'); }

    function obtenerCaratula(id){return id&&id.length===11?`https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`:FALLBACK_THUMB}
    const SEARCH_INSTANCES = [
      'https://inv.nadeko.net',
      'https://inv.nadeko.net',
      'https://invidious.nerdvpn.de',
      'https://yt.chocolatemoo53.com',
      'https://yewtu.be',
      'https://invidious.tiekoetter.com'
    ];

    function decodeEntities(v){
      const txt=document.createElement('textarea');txt.innerHTML=String(v??'');return txt.value;
    }
    function normalizarResultados(data){
      const arr = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : (Array.isArray(data?.items) ? data.items : []));
      return arr.map(v => {
        const id = String(v?.id || v?.videoId || v?.video_id || v?.youtube_id || '').trim();
        if(!id) return null;
        const thumbs = Array.isArray(v?.videoThumbnails) ? v.videoThumbnails : (Array.isArray(v?.thumbnails) ? v.thumbnails : []);
        const thumb = v?.thumbnail || v?.thumbnailUrl || v?.thumbnails?.high?.url || v?.thumbnails?.medium?.url || v?.thumbnails?.default?.url || thumbs.find(t=>t?.quality==='high')?.url || thumbs.find(t=>t?.quality==='medium')?.url || thumbs[0]?.url || obtenerCaratula(id);
        const secs = Number(v?.lengthSeconds || v?.duration || 0) || 0;
        return {
          ...v, id,
          titulo: decodeEntities(v?.titulo || v?.title || 'Contenido audiovisual'),
          descripcion: decodeEntities(v?.descripcion || v?.author || v?.channelTitle || v?.channel || 'YouTube'),
          categoria: v?.categoria || 'Resultado',
          duracion: v?.duracion || (secs ? `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}` : 'HD'),
          thumbnail: thumb,
          tipo: secs && secs <= 60 ? 'short' : 'video'
        };
      }).filter(Boolean);
    }

    async function buscarDirectoInvidious(query){
      const encoded = encodeURIComponent(query);
      for(const base of SEARCH_INSTANCES){
        const controller = new AbortController();
        const timer = setTimeout(()=>controller.abort(), 5000);
        try{
          const r = await fetch(`${base}/api/v1/search?q=${encoded}&type=video&page=1`, {signal:controller.signal, headers:{Accept:'application/json'}});
          if(!r.ok) continue;
          const items = normalizarResultados(await r.json());
          if(items.length) return items.slice(0,24);
        }catch(e){} finally{clearTimeout(timer);}
      }
      return [];
    }

    async function obtenerVideos(query){
      const q = String(query || '').trim();
      if(!q) return [];
      try{
        const data = await api('youtube/search?q='+encodeURIComponent(q));
        const items = normalizarResultados(data);
        if(items.length) return items.slice(0,24);
      }catch(e){ console.warn('[UADAV] Worker search:', e); }
      // Fallback conservado con las instancias que venían funcionando.
      try{
        const direct = await buscarDirectoInvidious(q);
        if(direct.length) return direct;
      }catch(e){}
      return [];
    }

    function cardHTML(v, portrait=false){
      const id=v.id||v.youtube_id||v.videoId; if(!id)return '';
      const thumb=v.thumbnail||v.foto||obtenerCaratula(id);
      const title=v.titulo||v.nombre_artistico||v.nombre||'Contenido';
      const meta=v.descripcion||v.categoria||v.rubro||'UADAV STREAM';
      return `<article class="card ${portrait?'portrait-card':''}" data-id="${safe(id)}"><img class="thumb" src="${safe(thumb)}" alt="${safe(title)}" loading="lazy" onerror="this.src='${FALLBACK_THUMB}'">${v.en_vivo?'<span class="badge live">● En vivo</span>':''}${v.verificado?'<span class="badge verify">✓ Verificado</span>':''}<span class="play-overlay"><i class="fa-solid fa-play"></i></span><div class="card-body"><div class="card-title">${safe(title)}</div><div class="card-meta">${safe(meta)}</div></div></article>`;
    }
    function bindCards(container,items){
      if(!container)return;
      container.querySelectorAll('.card').forEach((el,index)=>{
        let sx=0,sy=0,moved=false;
        el.addEventListener('pointerdown',e=>{
          sx=e.clientX;sy=e.clientY;moved=false;
        },{passive:true});
        el.addEventListener('pointermove',e=>{
          if(Math.hypot(e.clientX-sx,e.clientY-sy)>9)moved=true;
        },{passive:true});
        el.addEventListener('click',e=>{
          if(moved){
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          const v=items[index];
          if(!v)return;
          if(v.isLiveSignal && v.liveUrl){
            reproducirSenal(v);
            return;
          }
          if(v.eventData){const eid=v.eventData.id||v.eventData.event_id;if(eid){location.href='/evento.html?id='+encodeURIComponent(eid);return;}}
          if(v.radioData){const rid=v.radioData.id||v.radioData.nombre||v.id;if(rid){location.href='/radio.html?id='+encodeURIComponent(rid);return;}}
          if(v.artistData){const aid=v.artistData.id||v.artistData.artist_id||v.id;if(aid){location.href='/artista.html?id='+encodeURIComponent(aid);return;}}
          if(v.externalUrl){window.open(v.externalUrl,'_blank','noopener');return;}
          const id=v.id||v.youtube_id||v.videoId;
          if(!id)return;
          reproducirVideo(
            id,
            v.titulo||v.title||v.nombre||'Video',
            v.descripcion||v.author||v.channelTitle||'Contenido',
            v
          );
        });
      });
    }

    function enableRailDrag(rail){
      if(!rail || rail.classList.contains('results-rail')) return;
      if(rail.dataset.dragReady==='1') return;
      rail.dataset.dragReady='1';

      let down=false,dragging=false;
      let sx=0,sy=0,scrollStart=0,pointerId=null;

      function stop(){
        down=false;
        dragging=false;
        rail.classList.remove('dragging');
        if(pointerId!==null){
          try{rail.releasePointerCapture(pointerId)}catch{}
        }
        pointerId=null;
      }

      rail.addEventListener('pointerdown',e=>{
        if(e.pointerType==='mouse' && e.button!==0)return;
        if(rail.scrollWidth<=rail.clientWidth)return;
        down=true;
        dragging=false;
        pointerId=e.pointerId;
        sx=e.clientX;
        sy=e.clientY;
        scrollStart=rail.scrollLeft;
      },{passive:true});

      rail.addEventListener('pointermove',e=>{
        if(!down)return;
        const dx=e.clientX-sx;
        const dy=e.clientY-sy;

        if(!dragging){
          if(Math.abs(dx)<7 && Math.abs(dy)<7)return;

          // Vertical gesture: let the page handle it.
          if(Math.abs(dy)>Math.abs(dx)){
            stop();
            return;
          }

          // Horizontal gesture: take control of the rail.
          dragging=true;
          rail.classList.add('dragging');
          try{rail.setPointerCapture(e.pointerId)}catch{}
        }

        if(dragging){
          e.preventDefault();
          rail.scrollLeft=scrollStart-dx;
        }
      },{passive:false});

      rail.addEventListener('pointerup',stop,{passive:true});
      rail.addEventListener('pointercancel',stop,{passive:true});
      rail.addEventListener('lostpointercapture',()=>{
        down=false;dragging=false;rail.classList.remove('dragging');
        pointerId=null;
      },{passive:true});

      // Wheel: vertical wheel over a rail becomes horizontal navigation.
      rail.addEventListener('wheel',e=>{
        if(rail.scrollWidth<=rail.clientWidth)return;
        const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
        if(!delta)return;
        e.preventDefault();
        rail.scrollLeft += delta;
      },{passive:false});
    }

    function prepararRailWrappers(){
      document.querySelectorAll('.rail:not(.results-rail)').forEach(rail=>{
        if(rail.parentElement?.classList.contains('rail-wrap'))return;
        const wrap=document.createElement('div');
        wrap.className='rail-wrap';
        rail.parentNode.insertBefore(wrap,rail);
        wrap.appendChild(rail);
      });
    }

    function activarArrastreCarruseles(){document.querySelectorAll('.rail:not(.results-rail)').forEach(enableRailDrag)}
    function renderRail(id,items,portrait=false){
      const el=$(id); if(!el)return;
      const valid=(items||[]).filter(v=>v&&(v.id||v.youtube_id||v.videoId));
      el.innerHTML=valid.length?valid.map(v=>cardHTML(v,portrait)).join(''):'<div style="padding:22px;color:#777">Todavía no hay contenido disponible.</div>';
      bindCards(el,valid);

      if(!el.classList.contains('results-rail')){
        const wrap=el.closest('.rail-wrap');
        if(wrap){
          wrap.querySelectorAll('.rail-arrow').forEach(x=>x.remove());
          const left=document.createElement('button');
          left.className='rail-arrow left';left.type='button';left.setAttribute('aria-label','Anterior');
          left.innerHTML='<i class="fa-solid fa-chevron-left"></i>';
          left.onclick=()=>el.scrollBy({left:-Math.max(el.clientWidth*.72,320),behavior:'smooth'});
          const right=document.createElement('button');
          right.className='rail-arrow right';right.type='button';right.setAttribute('aria-label','Siguiente');
          right.innerHTML='<i class="fa-solid fa-chevron-right"></i>';
          right.onclick=()=>el.scrollBy({left:Math.max(el.clientWidth*.72,320),behavior:'smooth'});
          wrap.append(left,right);
        }
      }
      enableRailDrag(el);
    }

    function normalizarVideoId(valor){
      const s=String(valor||'').trim();
      if(!s)return '';
      if(/^[A-Za-z0-9_-]{11}$/.test(s))return s;
      try{
        const u=new URL(s);
        if(u.hostname.includes('youtu.be'))return (u.pathname.split('/').filter(Boolean)[0]||'');
        const q=u.searchParams.get('v');if(q)return q;
        const parts=u.pathname.split('/').filter(Boolean);
        const i=parts.findIndex(x=>['shorts','embed','live'].includes(x));
        if(i>=0&&parts[i+1])return parts[i+1];
      }catch{}
      return '';
    }

    function normalizarSeccionItem(item,sec){
      if(!item)return null;
      const tipo=String(item.tipo||item.content_type||sec?.tipo_contenido||'videos').toLowerCase();
      if(tipo==='artista'||tipo==='artist'||sec?.tipo_contenido==='perfiles'){
        const id=item.id||item.channel_id||item.youtube_id||item.canal||('artist-'+Math.random().toString(36).slice(2));
        return {id,titulo:item.nombre_artistico||item.nombre||item.titulo||'Artista',descripcion:item.rubro||item.bio||item.descripcion||'Artista UADAV',thumbnail:item.foto||item.imagen||item.thumbnail||FALLBACK_THUMB,categoria:sec?.nombre||'Artistas',verificado:item.verificado||item.afiliado_verificado===true,artistData:item};
      }
      if(tipo==='radio'||sec?.tipo_contenido==='radios'){
        const id=item.id||item.nombre||item.stream_url||('radio-'+Math.random().toString(36).slice(2));
        return {id,titulo:item.nombre||'Radio',descripcion:[item.ciudad,item.provincia,item.pais].filter(Boolean).join(' · ')||item.descripcion||'Radio en vivo',thumbnail:item.logo||item.imagen||FALLBACK_THUMB,categoria:sec?.nombre||'Radios',radioData:item};
      }
      if(tipo==='evento'||tipo==='event'||sec?.tipo_contenido==='eventos'){
        const yt=normalizarVideoId(item.trailer||item.youtube_id||item.video_id||item.url_video||'');
        return {id:yt||('event-'+String(item.id||item.nombre||Date.now())),titulo:item.nombre||item.titulo||'Evento',descripcion:[item.fecha_inicio||item.fecha,item.lugar,item.ciudad].filter(Boolean).join(' · ')||item.descripcion_corta||item.descripcion||'Evento',thumbnail:item.imagen||item.poster||(yt?obtenerCaratula(yt):FALLBACK_THUMB),categoria:sec?.nombre||'Eventos',eventData:item};
      }
      const rawUrl=String(item.url||item.link||'').trim();
      const id=normalizarVideoId(rawUrl||item.id||item.videoId||item.youtube_id);
      if(id)return {id,titulo:item.titulo||item.title||'Contenido',descripcion:item.descripcion||item.author||sec?.nombre||'Contenido',thumbnail:item.imagen||item.thumbnail||item.thumbnailUrl||obtenerCaratula(id),categoria:sec?.nombre||item.categoria||'Contenido',provider:item.provider||'youtube'};
      if(rawUrl){
        const provider=String(item.provider||'externo').toLowerCase();
        return {id:item.id||('ext-'+Math.random().toString(36).slice(2)),titulo:item.titulo||item.title||'Contenido',descripcion:item.descripcion||sec?.nombre||provider,thumbnail:item.imagen||item.thumbnail||item.thumbnailUrl||FALLBACK_THUMB,categoria:sec?.nombre||item.categoria||'Contenido',provider,externalUrl:rawUrl,external:true};
      }
      return null;
    }

    async function obtenerItemsSeccion(sec){
      const max=Math.max(1,Number(sec.max_items||sec.max||18));
      const mode=String(sec.modo||'manual').toLowerCase();
      const kind=String(sec.tipo_contenido||'videos').toLowerCase();
      let manual=Array.isArray(sec.items)?sec.items.map(x=>normalizarSeccionItem(x,sec)).filter(Boolean):[];
      if(sec.collection_id){try{const [cols,lib]=await Promise.all([api('collections'),api('content')]);const col=(Array.isArray(cols)?cols:[]).find(c=>String(c.id)===String(sec.collection_id));if(col){const byId=new Map((Array.isArray(lib)?lib:[]).map(x=>[String(x.id),x]));const fromCol=(Array.isArray(col.items)?col.items:[]).map(ref=>typeof ref==='string'?(byId.get(String(ref))||(/^https?:/i.test(ref)?{url:ref,titulo:ref}:null)):ref).map(x=>normalizarSeccionItem(x,sec)).filter(Boolean);manual=[...manual,...fromCol]}}catch{}}
      if(mode==='manual')return manual.slice(0,max);
      const q=String(sec.query||sec.nombre||'').trim(), nq=q.toLowerCase();
      let automatic=[];
      try{
        if(kind==='perfiles'||kind==='artistas'){
          const list=await api('artistas');automatic=(Array.isArray(list)?list:[]).filter(x=>!nq||[x.nombre_artistico,x.nombre,x.rubro,x.ciudad,x.provincia].join(' ').toLowerCase().includes(nq)).map(x=>normalizarSeccionItem({...x,tipo:'artista'},sec)).filter(Boolean);
        }else if(kind==='eventos'){
          const list=await api('cartelera'+(q?'?q='+encodeURIComponent(q):''));automatic=(Array.isArray(list)?list:[]).map(x=>normalizarSeccionItem({...x,tipo:'evento'},sec)).filter(Boolean);
        }else if(kind==='radios'){
          const list=await api('radios');automatic=(Array.isArray(list)?list:[]).filter(x=>!nq||[x.nombre,x.descripcion,x.ciudad,x.provincia,x.pais].join(' ').toLowerCase().includes(nq)).map(x=>normalizarSeccionItem({...x,tipo:'radio'},sec)).filter(Boolean);
        }else if(kind==='contenido'||kind==='universal'){
          const list=await api('content');automatic=(Array.isArray(list)?list:[]).filter(x=>!nq||[x.titulo,x.descripcion,x.categoria,x.provider].join(' ').toLowerCase().includes(nq)).map(x=>normalizarSeccionItem(x,sec)).filter(Boolean);
        }else{
          automatic=(await obtenerVideos(q)||[]).map(v=>({...v,categoria:sec.nombre||v.categoria||'Contenido'}));
          if(kind==='mixto'){
            try{const lib=await api('content');automatic=[...(Array.isArray(lib)?lib.map(x=>normalizarSeccionItem(x,sec)).filter(Boolean):[]),...automatic]}catch{}
          }
        }
      }catch{automatic=[]}
      if(mode==='auto')return automatic.slice(0,max);
      const out=[],seen=new Set();
      for(const x of [...manual,...automatic]){const key=String(x.externalUrl||x.id||x.titulo||'').toLowerCase();if(!key||seen.has(key))continue;seen.add(key);out.push(x);if(out.length>=max)break;}
      return out;
    }

    function renderDynamicSectionRow(sec,index,items){
      const id='adminSec_'+String(sec.id||index).replace(/[^A-Za-z0-9_-]/g,'_');
      const portrait=sec.tipo_contenido==='perfiles';
      let row=document.getElementById(id);
      if(!row){
        row=document.createElement('div');
        row.className='row admin-dynamic-row';
        row.id=id;
        document.getElementById('adminSectionsContainer')?.appendChild(row);
      }
      row.innerHTML=`<div class="row-head"><div><div class="row-title">${sec.icon_url?`<img class="section-icon-image" src="${safe(sec.icon_url)}" alt="">`:`<i class="fa-solid ${safe(sec.icono||'fa-layer-group')}"></i>`}${safe(sec.nombre||'Sección')}</div><div class="row-subtitle">${safe(sec.descripcion||'Contenido seleccionado por UADAV STREAM')}</div></div></div><div class="rail" id="${id}_rail"></div>`;
      renderRail(`${id}_rail`,items,portrait);
    }

    async function cargarSeccionesAdministradas(){
      const container=$('adminSectionsContainer');
      if(!container)return;
      container.innerHTML='<div class="admin-section-empty">Cargando secciones del Admin…</div>';
      let data=[];
      try{data=await api('secciones')}catch(e){container.innerHTML='';return}
      if(!Array.isArray(data)){container.innerHTML='';return}
      const reserved=new Set(['radios','artistas','cartelera','senales','senales_oficiales','en_vivo','live','featured','destacados','recommended','recomendados','contenido']);
      const active=data.filter(s=>s&&s.activa!==false&&!reserved.has(String(s.id||'').toLowerCase())&&s.visible!==false);
      container.innerHTML='';
      const nav=$('dynamicSectionsNav');if(nav)nav.innerHTML='';
      for(let i=0;i<active.length;i++){
        const sec=active[i];
        const items=await obtenerItemsSeccion(sec);
        renderDynamicSectionRow(sec,i,items);
        if(nav){
          const a=document.createElement('a');
          const target='adminSec_'+String(sec.id||i).replace(/[^A-Za-z0-9_-]/g,'_');
          a.href='#'+target;a.textContent=sec.nombre||'Sección';a.onclick=ev=>{ev.preventDefault();irASeccion(target)};
          nav.appendChild(a);
        }
      }
    }

    async function cargarDestacados(refresh=false){
      const rail=$('featuredRail');rail.innerHTML='<div style="padding:25px;color:#888"><i class="fa-solid fa-circle-notch fa-spin"></i> Descubriendo contenido...</div>';
      let pool=[];
      const limite=Number(config.limite_destacados||16);
      if(Array.isArray(config.videos_destacados_ids)&&config.videos_destacados_ids.length){pool.push(...config.videos_destacados_ids.map(id=>({id,titulo:'Contenido destacado',categoria:'Destacado',thumbnail:obtenerCaratula(id)})))}
      const queries=(config.palabras_clave_destacados||'artistas de variedades,teatro,circo,humor,música').split(',').map(x=>x.trim()).filter(Boolean).slice(0,4);
      if(!pool.length||refresh){for(const q of queries){const r=await obtenerVideos(q);pool.push(...r.slice(0,5).map(v=>({...v,categoria:v.categoria&&v.categoria!=='Resultado'?v.categoria:q})))} }
      const seen=new Set();allVideos=pool.filter(v=>v.id&&!seen.has(v.id)&&(seen.add(v.id))).slice(0,limite);
      $('featuredTitle').textContent=config.titulo_destacados||'🔥 Destacados';renderRail('featuredRail',allVideos);try{renderRecommendations()}catch(e){console.warn('Recomendaciones:',e)}
    }

    async function cargarDiscover(){
      const queries=['teatro','circo','humor','música','magia','podcast','entretenimiento'];const pool=[];
      for(const q of queries){const r=await obtenerVideos(q);pool.push(...r.slice(0,3).map(v=>({...v,categoria:q})))}
      const seen=new Set();renderRail('discoverRail',pool.filter(v=>v.id&&!seen.has(v.id)&&(seen.add(v.id))).slice(0,18));
    }

    function renderContinue(){const d=getDiscovery();const items=d.history||[];if(!items.length){$('continueRow').hidden=true;return}$('continueRow').hidden=false;renderRail('continueRail',items.slice(0,12))}
    function renderSaved(){
      const row=$('savedRow'),rail=$('savedRail');
      if(!row||!rail)return;
      const raw=getDiscovery().saved||[];
      const items=raw.map(x=>typeof x==='string'?{
        id:x,titulo:'Video guardado',descripcion:'Contenido guardado',
        thumbnail:obtenerCaratula(x),categoria:'Mi lista'
      }:x).filter(x=>x&&x.id);
      if(!items.length){row.hidden=true;rail.innerHTML='';return}
      row.hidden=false;renderRail('savedRail',items.slice(0,30));
    }

    async function renderRecommendations(contextItem=null){
      const d=ensureDiscovery(getDiscovery());
      const row=$('recommendedRow'),rail=$('recommendedRail');
      if(!row||!rail)return;

      const watched=new Set((d.history||[]).slice(0,24).map(x=>x.id));
      const saved=new Set((d.saved||[]).map(x=>typeof x==='string'?x:x?.id).filter(Boolean));
      const topicRank=Object.entries(d.topics||{}).sort((a,b)=>b[1]-a[1]).slice(0,4);
      const termRank=Object.entries(d.terms||{}).sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>x[0]);
      const contextTopics=detectTopics(contextItem||d.history?.[0]||{});
      const queryList=[...new Set([
        ...contextTopics,
        ...topicRank.map(x=>x[0]),
        ...(termRank.length?[termRank.slice(0,4).join(' ')]:[])
      ])].filter(Boolean).slice(0,4);

      if(!queryList.length){row.hidden=true;rail.innerHTML='';return}

      let candidates=[];
      for(const q of queryList){
        try{
          const items=await obtenerVideos(q);
          candidates.push(...(items||[]).map(x=>({...x,__sourceQuery:q})));
        }catch{}
        if(candidates.length>=36)break;
      }

      const seen=new Set();
      candidates=candidates.filter(x=>{
        if(!x?.id||seen.has(x.id)||watched.has(x.id))return false;
        seen.add(x.id);return true;
      });

      const scoreCandidate=(x)=>{
        const topics=detectTopics(x);
        const text=normText([x.titulo,x.descripcion,x.categoria,x.author,x.channelTitle].filter(Boolean).join(' '));
        const terms=tokenize(text);
        let score=0;
        for(const t of topics){score+=(d.topics[t]||0)*5; if(contextTopics.includes(t))score+=12}
        for(const t of terms){score+=(d.terms[t]||0)*1.4}
        if(saved.has(x.id))score-=18;
        if(x.__sourceQuery&&contextTopics.includes(normText(x.__sourceQuery)))score+=5;
        // Small novelty/diversity bonus; never based on IP/location.
        if(!watched.has(x.id))score+=3;
        return score;
      };

      candidates.sort((a,b)=>scoreCandidate(b)-scoreCandidate(a));
      const final=[];const seenTopics=new Set();
      for(const x of candidates){
        const xt=detectTopics(x);
        const overlap=xt.some(t=>seenTopics.has(t));
        if(final.length>=12)break;
        if(overlap && final.length<6)continue;
        final.push(x);xt.forEach(t=>seenTopics.add(t));
      }
      const fallback=candidates.slice(0,12);
      const items=final.length?final:fallback;
      if(!items.length){row.hidden=true;rail.innerHTML='';return}

      row.hidden=false;
      const lead=contextTopics[0]||topicRank[0]?.[0];
      const title=$('recommendedTitle');
      if(title)title.textContent=lead?`✨ Para vos · ${lead.charAt(0).toUpperCase()+lead.slice(1)}`:'✨ Para vos';
      renderRail('recommendedRail',items.slice(0,12));
    }

    async function cargarHomeLayout(){
      try{
        const raw=await api('home_layout');
        if(raw && !Array.isArray(raw) && Array.isArray(raw.order)) homeLayout={...homeLayout,order:[...raw.order]};
      }catch(e){console.warn('[UADAV] Home layout no disponible:',e)}
      applyHomeLayout();
    }
    function applyHomeLayout(){
      const content=$('contenido'); if(!content)return;
      const allowed=new Set(DEFAULT_HOME_ORDER);
      const order=[...homeLayout.order.filter(id=>allowed.has(id)),...DEFAULT_HOME_ORDER.filter(id=>!homeLayout.order.includes(id))];
      const nodes=new Map();
      order.forEach(id=>{const el=$(id);if(el)nodes.set(id,el)});
      order.forEach(id=>{const el=nodes.get(id);if(el)content.appendChild(el)});
    }

    async function cargarWebVisibility(){
      try{
        const raw=await api('web_visibility');
        if(raw && typeof raw==='object' && !Array.isArray(raw)) webVisibility={...webVisibility,...raw};
      }catch(e){console.warn('[UADAV] Visibilidad no disponible:',e)}
      applyWebVisibility();
    }
    function applyWebVisibility(){
      const map={
        hero:'heroSection', search:'searchModule', banners:'bannerTopContainer', continue:'continueRow', saved:'savedRow', featured:'featuredRow', recommended:'recommendedRow',
        live:'liveRow', radios:'radiosRow', artists:'artists', cartelera:'cartelera', media:'mediaRow', playlists:'playlistsRow', podcasts:'podcastsRow', discover:'discoverRow', shorts:'shortsRow', jobs:'jobsRow',
        features:'en-vivo', cta:'sumate', newsletter:'avisos', footer:'siteFooter', info:'en-vivo'
      };
      Object.entries(map).forEach(([key,id])=>{
        const el=$(id); if(el) el.classList.toggle('visibility-off',webVisibility[key]===false);
      });
      const navMap={radios:'navRadiosLink',artists:'navArtistsLink',live:'navLiveLink',cartelera:'navCarteleraLink',media:'navMediaLink'};
      Object.entries(navMap).forEach(([key,id])=>$(id)?.classList.toggle('visibility-off',webVisibility[key]===false));
    }


    function radioHistoryKey(r){
      return String(r?.nombre||r?.stream_url||r?.url||'radio').trim().toLowerCase().replace(/[^a-z0-9_-]+/gi,'_').slice(0,80);
    }
    function getRadioHistory(){
      try{
        const raw=JSON.parse(localStorage.getItem(RADIO_HISTORY_KEY)||'{}');
        return raw&&typeof raw==='object'?raw:{};
      }catch{return {}}
    }
    function saveRadioHistory(data){try{localStorage.setItem(RADIO_HISTORY_KEY,JSON.stringify(data))}catch{}}
    function getRadioHistoryFor(r){
      const all=getRadioHistory(),key=radioHistoryKey(r);
      return Array.isArray(all[key])?all[key]:[];
    }
    function addRadioHistory(r,title,artist,artwork){
      const t=String(title||'').trim(),a=String(artist||'').trim();
      if(!t||/^radio en vivo$/i.test(t)||/^seleccion[aá] para escuchar$/i.test(t))return;
      const all=getRadioHistory(),key=radioHistoryKey(r),list=Array.isArray(all[key])?all[key]:[];
      const sig=(a+'|'+t).toLowerCase();
      all[key]=[{title:t,artist:a,artwork:artwork||r?.logo||r?.imagen||FALLBACK_THUMB,station:r?.nombre||'Radio',ts:Date.now()},
        ...list.filter(x=>(String(x?.artist||'')+'|'+String(x?.title||'')).toLowerCase()!==sig)].slice(0,RADIO_HISTORY_LIMIT);
      saveRadioHistory(all);
      renderRadioHistory(r);
      if(window.parent!==window){try{window.parent.postMessage({type:'uadav:radio-meta',title,artist,artwork:art,station:r.nombre||'Radio'},location.origin)}catch{}}
      if(selectedRadioHub && obtenerRadioHubId(selectedRadioHub)===obtenerRadioHubId(r)) renderRadioHub(r);
    }
    function renderRadioHistory(r){
      const row=$('radioHistoryRow'),listEl=$('radioHistoryList'),sub=$('radioHistorySubtitle');
      if(!row||!listEl)return;
      const items=getRadioHistoryFor(r);
      if(!items.length){row.hidden=true;listEl.innerHTML='';return}
      row.hidden=false;
      if(sub)sub.textContent=`Últimos ${items.length} temas · ${r?.nombre||'Radio'}`;
      listEl.innerHTML=items.map((x,i)=>{
        const art=safe(x.artwork||r?.logo||r?.imagen||FALLBACK_THUMB);
        const title=safe(x.title||'Tema'),artist=safe(x.artist||'—'),station=safe(x.station||r?.nombre||'Radio');
        return `<article class="radio-history-item" data-radio-history-index="${i}" title="Descubrir ${title} ${artist}">
          <img class="radio-history-art" src="${art}" alt="${title}" loading="lazy" onerror="this.src='${FALLBACK_THUMB}'">
          <div class="radio-history-copy"><div class="radio-history-track">${title}</div><div class="radio-history-artist">${artist}</div><div class="radio-history-station">${station}</div></div>
          <button class="radio-history-open" type="button" aria-label="Descubrir tema"><i class="fa-solid fa-magnifying-glass"></i></button>
        </article>`;
      }).join('');
      listEl.querySelectorAll('.radio-history-item').forEach((el,i)=>{
        el.addEventListener('click',()=>descubrirTemaRadio(r,items[i]));
        el.querySelector('.radio-history-open')?.addEventListener('click',ev=>{ev.stopPropagation();descubrirTemaRadio(r,items[i])});
      });
    }
    function descubrirTemaRadio(r,item){
      const q=[item?.artist,item?.title].filter(Boolean).join(' ').trim();
      if(!q)return;
      if(typeof ejecutarBusqueda==='function'){
        ejecutarBusqueda(q);
        setTimeout(()=>document.getElementById('resultsRow')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
      }else{
        window.open('https://www.youtube.com/results?search_query='+encodeURIComponent(q),'_blank','noopener');
      }
    }

    function setRadioMediaMetadata(r,meta){
      const title=meta?.title||meta?.streamTitle||meta?.name||'Radio en vivo';
      const artist=meta?.artist||meta?.creator||'';
      const art=meta?.artwork||r.logo||r.imagen||FALLBACK_THUMB;
      const stateKey=r.nombre||r.stream_url||'';
      const previous=radioTrackState.get(stateKey);
      radioTrackState.set(stateKey,{title,artist,artwork:art});
      if(!previous||previous.title!==title||previous.artist!==artist)addRadioHistory(r,title,artist,art);
      const now=$('radioNowPlaying');if(now)now.hidden=false;
      if($('radioNowStation'))$('radioNowStation').textContent=r.nombre||'Radio UADAV STREAM';
      if($('radioNowTitle'))$('radioNowTitle').textContent=title;
      if($('radioNowArtist'))$('radioNowArtist').textContent=artist||'En vivo';
      if($('radioNowArt'))$('radioNowArt').src=art;
      if($('radioNowDiscover'))$('radioNowDiscover').onclick=()=>descubrirTemaRadio(r,{title,artist,artwork:art});
      const dock=$('radioPlayerDock');if(dock){dock.hidden=false;$('radioPlayerCover').src=art;$('radioPlayerTitle').textContent=title;$('radioPlayerArtist').textContent=artist||r.nombre||'Radio en vivo';}
      const cards=[...document.querySelectorAll('.radio-card')],idx=cards.findIndex(c=>c.dataset.radioName===String(r.nombre||''));
      if(idx>=0){
        const card=cards[idx];card.classList.add('is-active');
        const a=card.querySelector('.radio-track-art');if(a)a.src=art;
        const t=card.querySelector('.radio-track-title');if(t)t.textContent=title;
        const ar=card.querySelector('.radio-track-artist');if(ar)ar.textContent=artist||'En vivo';
      }
      if('mediaSession'in navigator){try{
        navigator.mediaSession.metadata=new MediaMetadata({title,artist:artist||r.nombre||'UADAV STREAM',album:r.nombre||'Radio en vivo',artwork:[{src:art,sizes:'512x512',type:'image/jpeg'}]});
        navigator.mediaSession.playbackState='playing';
        navigator.mediaSession.setActionHandler?.('play',()=>{try{$('radioAudio')?.play()}catch{}});
        navigator.mediaSession.setActionHandler?.('pause',()=>{try{$('radioAudio')?.pause()}catch{}});
      }catch{}}
      if(selectedRadioHub && obtenerRadioHubId(selectedRadioHub)===obtenerRadioHubId(r)) renderRadioHub(r);
    }
    function parseRadioTitle(meta,r){
      const src=meta?.data||meta?.metadata||meta?.now_playing||meta||{};
      const raw=String(src?.streamTitle||src?.title||src?.song||src?.track||src?.songtitle||src?.currentSong||'').trim();
      let title=raw,artist=String(src?.artist||src?.author||src?.artistName||src?.artist_name||'').trim();
      if(!artist && raw.includes(' - ')){const p=raw.split(' - ');artist=p.shift().trim();title=p.join(' - ').trim();}
      const artwork=String(src?.artwork||src?.cover||src?.album_art||src?.image||'').trim();
      return {title:title||r.nombre||'Radio en vivo',artist,artwork};
    }
    function deezerJsonp(url, timeoutMs=6500){
      return new Promise((resolve,reject)=>{
        const cb='uadavDeezer_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
        const script=document.createElement('script');
        let finished=false;
        const cleanup=()=>{try{script.remove()}catch{};try{delete window[cb]}catch{window[cb]=undefined}};
        const timer=setTimeout(()=>{if(finished)return;finished=true;cleanup();reject(new Error('Deezer timeout'))},timeoutMs);
        window[cb]=(data)=>{if(finished)return;finished=true;clearTimeout(timer);cleanup();resolve(data)};
        script.onerror=()=>{if(finished)return;finished=true;clearTimeout(timer);cleanup();reject(new Error('Deezer JSONP error'))};
        script.src=url+(url.includes('?')?'&':'?')+'output=jsonp&callback='+encodeURIComponent(cb);
        document.body.appendChild(script);
      });
    }

    async function buscarCaratulaTema(artist,title,fallback){
      const cleanTitle=String(title||'').trim(),cleanArtist=String(artist||'').trim();if(!cleanTitle)return fallback;
      const cacheKey='uadav_cover_v85_'+(cleanArtist+'|'+cleanTitle).toLowerCase();
      try{const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');if(cached?.cover&&Date.now()-Number(cached.ts||0)<RADIO_COVER_CACHE_TTL)return cached.cover}catch{}
      let cover=fallback||'';
      try{const d=await api('radio/cover?artist='+encodeURIComponent(cleanArtist)+'&title='+encodeURIComponent(cleanTitle)+'&fallback='+encodeURIComponent(fallback||''));cover=d?.artwork||cover}catch{}
      try{localStorage.setItem(cacheKey,JSON.stringify({cover,ts:Date.now()}))}catch{}
      return cover;
    }
    function normalizarMetaUrl(r){
      if(r.metadata_url)return String(r.metadata_url).trim();
      const s=String(r.stream_url||r.url||'').trim();
      const z=s.match(/stream\.zeno\.fm\/([^/?#]+)/i);
      if(z)return `https://api.zeno.fm/mounts/metadata/subscribe/${encodeURIComponent(z[1].replace(/\/source$/i,''))}`;
      return '';
    }
    function detenerRadioMetadata(){
      for(const src of radioMetaSources.values()){try{src.close?.()}catch{};try{clearInterval(src)}catch{}}
      radioMetaSources.clear();
      const now=$('radioNowPlaying');if(now)now.hidden=true;
    }
    function iniciarRadioMetadata(r){
      detenerRadioMetadata();
      const metaUrl=normalizarMetaUrl(r);
      const applyMeta=async(raw)=>{
        const parsed=parseRadioTitle(raw,r);
        const art=parsed.artwork||await buscarCaratulaTema(parsed.artist,parsed.title,r.logo||r.imagen||FALLBACK_THUMB);
        setRadioMediaMetadata(r,{title:parsed.title,artist:parsed.artist,artwork:art});
      };
      if(!metaUrl){setRadioMediaMetadata(r,{title:'Radio en vivo',artist:'',artwork:r.logo||r.imagen||FALLBACK_THUMB});return}
      if(/^https:\/\/api\.zeno\.fm\/mounts\/metadata\/subscribe\//i.test(metaUrl)&&typeof EventSource!=='undefined'){
        try{
          const es=new EventSource(metaUrl);
          es.onmessage=ev=>{try{applyMeta(JSON.parse(ev.data||'{}'))}catch{}};
          es.onerror=()=>{};
          radioMetaSources.set(r.nombre||metaUrl,es);
          return;
        }catch{}
      }
      const poll=async()=>{try{
        const res=await fetch(metaUrl,{cache:'no-store'});
        const raw=await res.json();await applyMeta(raw);
      }catch{
        const cached=radioTrackState.get(r.nombre||r.stream_url||'');
        if(!cached)setRadioMediaMetadata(r,{title:'Radio en vivo',artist:'',artwork:r.logo||r.imagen||FALLBACK_THUMB});
      }};
      poll();
      const timer=setInterval(poll,15000);
      radioMetaSources.set(r.nombre||metaUrl,timer);
    }
    function renderRadiosPublicos(items){
      const row=$('radiosRow'),rail=$('radiosRail');
      if(!row||!rail)return;
      const valid=(items||[]).filter(r=>r&&r.activa!==false&&String(r.stream_url||r.url||'').trim());
      if(!valid.length){row.hidden=true;rail.innerHTML='';return}
      row.hidden=false;
      rail.innerHTML=valid.map((r,i)=>{
        const name=safe(r.nombre||'Radio UADAV STREAM'),key=r.nombre||r.stream_url||'';
        const saved=radioTrackState.get(key),logo=safe(saved?.artwork||r.logo||r.imagen||FALLBACK_THUMB);
        const title=safe(saved?.title||'Seleccioná para escuchar'),artist=safe(saved?.artist||'Radio en vivo');
        const isActive=activeRadio===String(r.stream_url||r.url||'');
        return `<article class="radio-card${isActive?' is-active':''}" data-radio-index="${i}" data-radio-name="${name}" tabindex="0"><img class="radio-logo" src="${logo}" alt="${name}" loading="lazy" onerror="this.src='${FALLBACK_THUMB}'"><button type="button" class="radio-play" aria-label="${isActive?'Pausar':'Reproducir'} ${name}"><i class="fa-solid fa-${isActive?'pause':'play'}"></i></button><div class="radio-copy"><div class="radio-name">${name}</div><div class="radio-status">${isActive?'● Escuchando ahora':'● EN VIVO'}</div><div class="radio-track"><img class="radio-track-art" src="${logo}" alt="" loading="lazy" onerror="this.src='${FALLBACK_THUMB}'"><div class="radio-track-text"><div class="radio-track-title">${title}</div><div class="radio-track-artist">${artist}</div></div></div></div></article>`;
      }).join('');
      rail.querySelectorAll('.radio-card').forEach((el,i)=>{
        el.addEventListener('click',()=>abrirRadioHub(valid[i]));
        el.querySelector('.radio-play')?.addEventListener('click',ev=>{ev.stopPropagation();reproducirRadio(valid[i])});
      });
    }
    function obtenerRadioHubId(r){return String(r?.id||r?.nombre||r?.stream_url||r?.url||'radio').trim()}

    function abrirRadioHub(r){
      if(!r)return;
      selectedRadioHub=r;
      renderRadioHub(r);
      const overlay=$('radioHubOverlay');
      if(overlay){overlay.classList.add('active');overlay.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
    }

    function cerrarRadioHub(){
      const overlay=$('radioHubOverlay');
      if(overlay){overlay.classList.remove('active');overlay.setAttribute('aria-hidden','true');}
      if(!$('videoModal')?.classList.contains('active'))document.body.style.overflow='';
      selectedRadioHub=null;
    }

    function renderRadioHub(r){
      if(!r)return;
      selectedRadioHub=r;
      const state=radioTrackState.get(r.nombre||r.stream_url||'')||{};
      const logo=state.artwork||r.logo||r.imagen||FALLBACK_THUMB;
      const title=state.title||'Seleccioná para escuchar';
      const artist=state.artist||'Radio en vivo';
      const isActive=activeRadio===String(r.stream_url||r.url||'');
      if($('radioHubLogo'))$('radioHubLogo').src=logo;
      if($('radioHubTitle'))$('radioHubTitle').textContent=r.nombre||'Radio UADAV STREAM';
      if($('radioHubStatus'))$('radioHubStatus').textContent=isActive?'● Escuchando ahora':'● Radio disponible';
      if($('radioHubNowArt'))$('radioHubNowArt').src=logo;
      if($('radioHubNowTitle'))$('radioHubNowTitle').textContent=title;
      if($('radioHubNowArtist'))$('radioHubNowArtist').textContent=artist;
      const play=$('radioHubPlay');
      if(play){play.textContent=isActive?'⏸ Pausar':'▶ Escuchar';play.onclick=()=>{if(activeRadio===String(r.stream_url||r.url||'') && $('radioAudio') && !$('radioAudio').paused)pausarRadio();else reproducirRadio(r);renderRadioHub(r)}}
      const discover=$('radioHubNowDiscover');
      if(discover)discover.onclick=()=>descubrirTemaRadio(r,{title,artist,artwork:logo});
      const chat=$('radioHubChat');if(chat)chat.onclick=()=>abrirChat('radio:'+obtenerRadioHubId(r),r.nombre||'Radio UADAV STREAM','Chat y pedidos de la emisora');
      const donate=$('radioHubDonate');const donationUrl=String(r.donation_url||r.donacion_url||'').trim();const canDonate=r.afiliado_verificado===true&&r.donacion_activa===true&&/^https?:\/\//i.test(donationUrl);if(donate){donate.hidden=!canDonate;donate.onclick=()=>{if(canDonate)window.open(donationUrl,'_blank','noopener')}}
      const metaBox=$('radioHubMeta');const metaValues=[r.programa,r.locutor,r.horario,r.descripcion].filter(Boolean);if(metaBox){metaBox.hidden=!metaValues.length;if($('radioHubProgram'))$('radioHubProgram').textContent=r.programa||'—';if($('radioHubHost'))$('radioHubHost').textContent=r.locutor||'—';if($('radioHubSchedule'))$('radioHubSchedule').textContent=r.horario||'—';if($('radioHubDescription'))$('radioHubDescription').textContent=r.descripcion||'—'}
      const socials=$('radioHubSocials');if(socials){const links=Object.assign({},r.redes||{},{web:r.web});socials.innerHTML=Object.entries(links).filter(([k,v])=>/^https?:\/\//i.test(String(v||''))).map(([k,v])=>`<a href="${safe(v)}" target="_blank" rel="noopener">${safe(k==='web'?'Web':k)}</a>`).join('')}
      const profile=$('radioHubProfile');if(profile)profile.onclick=()=>{location.href='/radio.html?id='+encodeURIComponent(obtenerRadioHubId(r))};
      const share=$('radioHubShare');
      if(share)share.onclick=async()=>{
        const shareUrl=location.origin+location.pathname+'?radio='+encodeURIComponent(obtenerRadioHubId(r));
        try{if(navigator.share){await navigator.share({title:r.nombre||'Radio UADAV STREAM',text:'Escuchá '+(r.nombre||'esta radio')+' en UADAV STREAM',url:shareUrl});return}}catch{}
        try{await navigator.clipboard.writeText(shareUrl);share.textContent='✓ Copiado';setTimeout(()=>share.textContent='↗ Compartir',1400)}catch{window.open(shareUrl,'_blank','noopener')}
      };
      const items=getRadioHistoryFor(r);
      const list=$('radioHubHistory');
      if(list){
        if(!items.length){list.innerHTML='<div class="radio-hub-empty">Todavía no hay temas registrados de esta emisora en este dispositivo.</div>'}
        else list.innerHTML=items.map((x,i)=>{
          const art=safe(x.artwork||logo),t=safe(x.title||'Tema'),a=safe(x.artist||'—');
          return `<article class="radio-hub-track" data-hub-index="${i}" title="Descubrir ${t} ${a}"><img src="${art}" alt="${t}" loading="lazy" onerror="this.src='${FALLBACK_THUMB}'"><div><div class="radio-hub-track-title">${t}</div><div class="radio-hub-track-artist">${a}</div></div><button type="button" aria-label="Buscar tema"><i class="fa-solid fa-magnifying-glass"></i></button></article>`
        }).join('');
        list.querySelectorAll('.radio-hub-track').forEach((el,i)=>el.addEventListener('click',()=>descubrirTemaRadio(r,items[i])));
      }
    }

    async function cargarRadios(){let data=[];try{data=await api('radios')}catch{}if(!Array.isArray(data))data=[];currentRadiosCache=data;renderRadiosPublicos(data);const p=$('radioNowPause');if(p)p.onclick=()=>pausarRadio();const active=data.find(r=>String(r.stream_url||r.url||'')===String(activeRadio||''));if(active)renderRadioHistory(active);else{const latest=data.find(r=>getRadioHistoryFor(r).length);if(latest)renderRadioHistory(latest);}}
    let currentRadiosCache=[];
    function pausarRadio(){
      if(window.parent!==window){try{window.parent.postMessage({type:'uadav:radio-pause'},location.origin)}catch{};activeRadio=null;renderRadiosPublicos(currentRadiosCache);return}
      const audio=$('radioAudio');
      if(audio){try{audio.pause()}catch{}audio.removeAttribute('src');audio.load?.();}
      detenerRadioMetadata();activeRadio=null;
      document.querySelectorAll('.radio-card').forEach(c=>c.classList.remove('is-active'));
      document.querySelectorAll('.radio-play').forEach(b=>{b.innerHTML='<i class="fa-solid fa-play"></i>';b.setAttribute('aria-label','Reproducir radio')});
      if('mediaSession'in navigator){try{navigator.mediaSession.metadata=null;navigator.mediaSession.playbackState='none'}catch{}}
      const now=$('radioNowPlaying');if(now)now.hidden=true;const dock=$('radioPlayerDock');if(dock)dock.hidden=true;
      renderRadiosPublicos(currentRadiosCache);
      const latest=currentRadiosCache.find(r=>getRadioHistoryFor(r).length);
      if(latest)renderRadioHistory(latest);
    }
    function reproducirRadio(r){
      uadavSendMetric('radio_play',{radio_id:r?.id||r?.nombre||'',title:r?.nombre||'Radio'});
      if(!r)return;
      const url=String(r.stream_url||r.url||'').trim();if(!url)return;
      if(window.parent!==window){activeRadio=url;try{window.parent.postMessage({type:'uadav:radio-play',radio:{id:r.id||r.nombre||url,name:r.nombre||'Radio',stream_url:url,logo:r.logo||r.imagen||'',metadata_url:r.metadata_url||r.meta_url||''}},location.origin)}catch{};renderRadiosPublicos(currentRadiosCache);iniciarRadioMetadata(r);return}
      const audio=$('radioAudio');if(!audio)return;
      if(activeRadio===url&&!audio.paused){pausarRadio();return}

      if($('videoModal')?.classList.contains('active'))cerrarModal();
      document.querySelectorAll('.radio-card').forEach(c=>c.classList.remove('is-active'));
      document.querySelectorAll('.radio-play').forEach(b=>{b.innerHTML='<i class="fa-solid fa-play"></i>'});
      audio.src=url;audio.autoplay=true;audio.play().catch(()=>{});
      activeRadio=url;
      const cards=[...document.querySelectorAll('.radio-card')],idx=cards.findIndex(c=>c.dataset.radioName===String(r.nombre||''));
      if(idx>=0){cards[idx].classList.add('is-active');const btn=cards[idx].querySelector('.radio-play');if(btn)btn.innerHTML='<i class="fa-solid fa-pause"></i>'}
      if($('radioNowPause'))$('radioNowPause').onclick=()=>pausarRadio();const dock=$('radioPlayerDock');if(dock){dock.hidden=false;$('radioPlayerToggle').textContent='❚❚';$('radioPlayerStatus').innerHTML='<span class="live-dot"></span>REPRODUCIENDO';}renderRadioHistory(r);iniciarRadioMetadata(r);
    }
    async function cargarArtistas(){
      let base=[];
      try{base=await api('artistas')}catch{}
      if(!Array.isArray(base))base=[];
      try{
        const secs=await api('secciones');
        if(Array.isArray(secs)){
          for(const sec of secs){
            const isProfile=sec?.tipo_contenido==='perfiles';
            if(!isProfile)continue;
            for(const item of (sec.items||[])){
              const n=normalizarSeccionItem(item,sec); if(n)base.push(n);
            }
          }
        }
      }catch{}
      const uniq=new Map();
      for(const a of base){
        const key=String(a.canal||a.id||a.titulo||'').toLowerCase();
        if(!key)continue;
        const blocked=['suspendido','bloqueado'].includes(String(a.estado||''));
        const publicable=!blocked && (a.visible!==false || a.afiliado_verificado===true || a.estado==='aprobado');
        if(!publicable)continue;
        if(!uniq.has(key))uniq.set(key,a);
      }
      allArtists=[...uniq.values()];
      const row=$('artists'),rail=$('artistsRail');
      if(!row||!rail)return;
      row.hidden=allArtists.length===0;
      if(!allArtists.length){rail.innerHTML='';return;}
      rail.innerHTML=allArtists.slice(0,24).map((a,i)=>{
        const photo=safe(a.thumbnail||a.foto||a.imagen||FALLBACK_THUMB),name=safe(decodeEntities(a.titulo||a.nombre||a.nombre_artistico||'Artista')),rubro=safe(decodeEntities(a.rubro||a.categoria||'Artista de variedades'));
        const verified=a.afiliado_verificado===true||a.verificado===true;
        return `<article class="artist-card-v28" data-artist-index="${i}"><img src="${photo}" alt="${name}" loading="lazy" onerror="this.src='${FALLBACK_THUMB}'"><div class="artist-card-name">${name}</div><div class="artist-card-rubro">${rubro}</div>${verified?'<div class="artist-card-benefit">✓ Afiliado UADAV</div>':'<div class="artist-card-discovery">✨ Descubrimiento</div>'}</article>`;
      }).join('');
      rail.querySelectorAll('.artist-card-v28').forEach((el,i)=>el.addEventListener('click',()=>{const a=allArtists[i];const id=a?.id||a?.canal||a?.nombre||'';if(id)location.href='/artista.html?id='+encodeURIComponent(id);}));
    }
    async function abrirArtistHub(a){
      if(!a)return;
      uadavSendMetric('artist_view',{artist_id:a?.id||a?.token||a?.canal||a?.nombre||'',title:a?.nombre||a?.nombre_artistico||''});
      const overlay=$('artistHubOverlay');if(!overlay)return;
      const name=a.nombre||a.nombre_artistico||'Artista';const photo=a.foto||a.imagen||a.thumbnail||FALLBACK_THUMB;const verified=a.afiliado_verificado===true||a.sindicalizado===true;
      $('artistHubKicker').textContent=verified?'✓ ARTISTA AFILIADO UADAV':'✨ ARTISTA EN UADAV STREAM';$('artistHubTitle').textContent=name;
      $('artistHubBio').textContent=a.bio||a.descripcion||'Perfil artístico en UADAV STREAM.';
      const media=$('artistHubMedia');media.src=photo;media.classList.add('has-media');
      const badges=$('artistHubBadges');badges.innerHTML='';if(a.rubro)badges.innerHTML+=`<span class="artist-verified-badge">${safe(a.rubro)}</span>`;if(a.ciudad)badges.innerHTML+=`<span class="artist-verified-badge">📍 ${safe(a.ciudad)}</span>`;if(verified)badges.innerHTML+='<span class="artist-verified-badge">✓ Afiliado verificado</span>';
      const actions=$('artistHubActions');actions.innerHTML='';
      const publicUrl=`${location.origin}${location.pathname}?artist=${encodeURIComponent(a.canal||a.id||name)}`;
      const share=document.createElement('button');share.className='btn btn-secondary';share.innerHTML='↗ Compartir';share.onclick=async()=>{try{if(navigator.share)await navigator.share({title:name,text:`Perfil de ${name} en UADAV STREAM`,url:publicUrl});else{await navigator.clipboard.writeText(publicUrl);mostrarToastPublico('Enlace copiado');}}catch{}};actions.appendChild(share);
      const live=a.live_url||a.youtube_live_url||a.transmision_url||'';if(verified&&live){const b=document.createElement('button');b.className='btn btn-primary';b.innerHTML='<i class="fa-solid fa-tower-broadcast"></i> Ver transmisión';b.onclick=()=>{const yt=normalizarIdYoutube(live);if(yt)reproducirVideo(yt,name+' · En vivo',a.bio||'Transmisión del artista',{id:yt,categoria:'Artista en vivo',isLiveSignal:true});else window.open(live,'_blank','noopener')};actions.appendChild(b)}
      if(verified&&(a.donation_url||a.donacion_url)){const b=document.createElement('button');b.className='btn btn-secondary';b.innerHTML='💛 Apoyar';b.onclick=()=>window.open(a.donation_url||a.donacion_url,'_blank','noopener');actions.appendChild(b)}
      if(a.booking_url||a.contacto||a.whatsapp){const b=document.createElement('button');b.className='btn btn-secondary';b.innerHTML='📅 Contratar';b.onclick=()=>window.open(a.booking_url||a.contacto||('https://wa.me/'+String(a.whatsapp||'').replace(/\D/g,'')),'_blank','noopener');actions.appendChild(b)}
      if(verified){const b=document.createElement('button');b.className='btn btn-secondary';b.innerHTML='💬 Chat';b.onclick=()=>abrirChat('artist:'+String(a.id||a.canal||name),name,'Chat del artista');actions.appendChild(b)}
      const content=$('artistHubContent');
      if(content){content.innerHTML='<div class="artist-profile-empty">Cargando contenido…</div>';try{const q=String(a.nombre||a.nombre_artistico||'').trim();const results=q?await obtenerVideos(q):[];content.innerHTML=results.length?results.slice(0,12).map(v=>`<article class="card" data-artist-content-id="${safe(v.id)}" style="min-width:220px;flex:0 0 220px"><img class="thumb" src="${safe(v.thumbnail||obtenerCaratula(v.id))}" alt="${safe(v.titulo||'Contenido')}" loading="lazy" onerror="this.src='${FALLBACK_THUMB}'"><div class="card-body"><div class="card-title">${safe(v.titulo||'Contenido')}</div><div class="card-meta">${safe(v.descripcion||'YouTube')}</div></div></article>`).join(''):'<div class="artist-profile-empty">Todavía no encontramos contenido público asociado.</div>';content.querySelectorAll('[data-artist-content-id]').forEach((el,i)=>el.addEventListener('click',()=>{const cards=content.querySelectorAll('[data-artist-content-id]');const id=cards[i]?.dataset.artistContentId;if(id)reproducirVideo(id,name+' · Contenido',a.bio||'',{id,categoria:'Artista'});}));}catch{content.innerHTML='<div class="artist-profile-empty">No pudimos cargar contenido en este momento.</div>';}}
      overlay.classList.add('active');overlay.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
    }
    function cerrarArtistHub(){const overlay=$('artistHubOverlay');if(overlay){overlay.classList.remove('active');overlay.setAttribute('aria-hidden','true')}if(!$('videoModal')?.classList.contains('active')&&!$('radioHubOverlay')?.classList.contains('active'))document.body.style.overflow=''}

    function normalizarIdYoutube(valor){
      const s=String(valor||'').trim();
      if(!s)return '';
      if(/^[A-Za-z0-9_-]{11}$/.test(s))return s;
      try{
        const u=new URL(s);
        if(u.hostname.includes('youtu.be')) return (u.pathname.split('/').filter(Boolean)[0]||'');
        const q=u.searchParams.get('v'); if(q)return q;
        const parts=u.pathname.split('/').filter(Boolean);
        const i=parts.findIndex(x=>x==='shorts'||x==='embed'||x==='live');
        if(i>=0&&parts[i+1])return parts[i+1];
      }catch{}
      return '';
    }

    function renderSimpleMediaRail(items,railId,rowId,kind){
      const rail=$(railId),row=$(rowId);if(!rail||!row)return;const list=(items||[]).filter(Boolean).slice(0,16);if(!list.length){row.hidden=true;rail.innerHTML='';return}row.hidden=false;
      rail.innerHTML=list.map(x=>{const img=safe(x.poster||x.thumbnail||x.imagen||FALLBACK_THUMB),title=safe(x.titulo||x.title||'Contenido'),meta=safe(kind==='media'?[x.media_type==='series'?'Serie':'Película',x.year].filter(Boolean).join(' · '):(x.provider||x.categoria||''));const href=kind==='media'?'/media.html?id='+encodeURIComponent(x.id):(x.url||'#');return `<article class="card" tabindex="0"><a href="${safe(href)}" ${kind==='media'?'':'target="_blank" rel="noopener"'}><img src="${img}" alt="${title}" loading="lazy" onerror="this.src='${FALLBACK_THUMB}'"><div class="card-body"><div class="card-title">${title}</div><div class="card-meta">${meta}</div></div></a></article>`}).join('');
    }
    async function cargarMedia(){try{const a=await api('media');renderSimpleMediaRail(Array.isArray(a)?a:[],'mediaRail','mediaRow','media')}catch{const r=$('mediaRow');if(r)r.hidden=true}}
    async function cargarPlaylists(){try{const a=await api('content');renderSimpleMediaRail((Array.isArray(a)?a:[]).filter(x=>String(x.content_type||x.tipo||'').toLowerCase()==='playlist'),'playlistsRail','playlistsRow','playlist')}catch{const r=$('playlistsRow');if(r)r.hidden=true}}
    async function cargarPodcasts(){try{const a=await api('content');renderSimpleMediaRail((Array.isArray(a)?a:[]).filter(x=>/podcast|episode|rss/i.test(String(x.content_type||x.tipo||x.categoria||''))),'podcastsRail','podcastsRow','podcast')}catch{const r=$('podcastsRow');if(r)r.hidden=true}}

    async function cargarEventos(){
      let data=[];try{data=await api('cartelera')}catch{}
      if(!Array.isArray(data))data=[];
      const items=data.filter(x=>x&&x.estado!=='cancelado').slice(0,18).map(e=>{
        const yt=normalizarIdYoutube(e.youtube_id||e.youtube||e.video_id||e.videoUrl||e.url_video);
        return {id:yt||('event-'+String(e.id||Date.now())),titulo:e.titulo||e.nombre||'Evento',descripcion:[e.fecha,e.lugar,e.ciudad].filter(Boolean).join(' · ')||e.descripcion||'Próximo espectáculo',thumbnail:e.imagen||e.poster||(yt?obtenerCaratula(yt):FALLBACK_THUMB),categoria:'Evento',eventData:e,isEvent:true};
      });
      const row=$('cartelera');if(row)row.hidden=!items.length; const rail=$('eventsRail');if(!rail)return;
      if(!items.length){rail.innerHTML='';return}
      rail.innerHTML=items.map((v,i)=>`<article class="card event-card-v31" data-event-index="${i}" style="cursor:pointer"><div class="card-media"><img class="thumb" src="${safe(v.thumbnail)}" alt="${safe(v.titulo)}" loading="lazy" onerror="this.src='${FALLBACK_THUMB}'">${v.eventData?.destacado_pagado?'<span class="badge live">★ DESTACADO</span>':''}</div><div class="card-body"><div class="card-title">${safe(v.titulo)}</div><div class="card-meta">${safe(v.descripcion)}</div></div></article>`).join('');
      rail.querySelectorAll('.event-card-v31').forEach((el,i)=>el.addEventListener('click',()=>abrirEventoDetalle(items[i]?.eventData||{})));
      const now=Date.now();const paid=data.filter(e=>{if(!e||e.estado==='cancelado'||e.destacado_pagado!==true)return false;const until=e.destacado_hasta?Date.parse(e.destacado_hasta):NaN;return !Number.isFinite(until)||until>=now}).slice(0,5);
      if(paid.length){const additions=paid.map(e=>({active:true,category:'★ EVENTO DESTACADO',kicker:[e.categoria,e.ciudad].filter(Boolean).join(' · ')||'CARTELERA',title:e.titulo||e.nombre||'Evento destacado',description:e.descripcion_corta||[e.fecha_inicio||e.fecha,e.lugar,e.ciudad].filter(Boolean).join(' · '),image:e.portada||e.imagen||e.poster||'',action_type:'event',action_id:e.id,event_id:e.id,ticket_url:e.ticket_url||e.link_compra||'',evento_id:e.id}));const existingIds=new Set(heroSpotlights.map(h=>String(h.evento_id||h.event_id||'')).filter(Boolean));heroSpotlights=[...additions.filter(h=>!existingIds.has(String(h.evento_id))),...heroSpotlights];heroSpotlightIndex=Math.min(heroSpotlightIndex,heroSpotlights.length-1);renderHeroEditorial();aplicarHeroSpotlight();reiniciarHeroTimer()}
    }
    function abrirEventoDetalle(e){
      $('infoKicker').textContent='📅 CARTELERA UADAV STREAM';$('infoTitle').textContent=e.titulo||e.nombre||'Evento';$('infoDescription').textContent=[e.fecha,e.lugar,e.ciudad,e.precio?('Entrada: '+e.precio):'',e.descripcion].filter(Boolean).join('\n\n')||'Información del evento.';
      const img=$('infoMedia'),src=e.imagen||e.poster||'';if(src){img.src=src;img.classList.add('has-media')}else{img.removeAttribute('src');img.classList.remove('has-media')}
      const b=$('infoPlayBtn');b.textContent='🎟 Ver entradas / información';b.onclick=()=>{if(e.link_compra)window.open(e.link_compra,'_blank','noopener');else cerrarInfoOverlay()};$('infoOverlay').classList.add('active');$('infoOverlay').setAttribute('aria-hidden','false');
    }

    async function cargarLive(){
      let data=[];try{data=await api('senales')}catch{}if(!Array.isArray(data)||!data.length){try{data=await api('senales_oficiales')}catch{data=[]}}if(!Array.isArray(data))data=[];
      const live=data.filter(x=>x&&x.activa!==false&&String(x.url||x.stream_url||x.youtube_id||'').trim()).slice(0,18).map((x,i)=>{const yt=normalizarIdYoutube(x.youtube_id||x.url||x.stream_url);return {...x,id:yt||('signal-'+String(x.id||i)),youtube_id:yt||x.youtube_id||'',titulo:x.nombre||x.titulo||'Señal en vivo',descripcion:x.descripcion||x.subtitulo_banner||'Transmisión en vivo',thumbnail: x.thumbnail||x.imagen||(yt?`https://i.ytimg.com/vi/${encodeURIComponent(yt)}/hqdefault.jpg`:FALLBACK_THUMB),en_vivo:true,isLiveSignal:true,liveUrl:String(x.url||x.stream_url||'').trim(),tipo:String(x.tipo||'').toLowerCase()||'generic'}});
      currentLiveCache=live;const row=$('liveRow');if(row)row.hidden=!live.length;const link=row?.querySelector('.row-more');if(link)link.hidden=!live.length;const rail=$('liveRail');if(!rail)return;
      if(!live.length){rail.innerHTML='';return}
      rail.innerHTML=live.map((s,i)=>`<article class="card live-card-v28" data-live-index="${i}" style="cursor:pointer"><div class="card-media"><img src="${safe(s.thumbnail)}" alt="${safe(s.titulo)}" loading="lazy" onerror="this.src='${FALLBACK_THUMB}'"><span class="live-badge">● EN VIVO</span></div><div class="card-title">${safe(s.titulo)}</div><div class="card-desc">${safe(s.descripcion)}</div></article>`).join('');
      rail.querySelectorAll('.live-card-v28').forEach((el,i)=>el.addEventListener('click',()=>reproducirSenal(live[i])));
    }

    async function reproducirSenal(s){
      uadavSendMetric('live_view',{content_id:s?.id||s?.youtube_id||s?.url||'',title:s?.titulo||s?.nombre||'Señal en vivo',media_type:'live'});
      const yt=normalizarIdYoutube(s?.youtube_id||s?.liveUrl||s?.url||s?.stream_url);
      if(yt){
        pausarRadio();
        reproducirVideo(yt,s.titulo||'Señal en vivo',s.descripcion||'Transmisión en vivo',{...s,id:yt,en_vivo:true,categoria:'En vivo'});
        return;
      }
      const url=String(s?.liveUrl||s?.url||s?.stream_url||'').trim(); if(!url)return;
      pausarRadio();

      const modal=$('videoModal'),host=$('playerFrame');
      if(!modal||!host)return;
      modal.classList.add('active');modal.classList.remove('pip-mode');
      $('modalTitle').textContent=s.titulo||'Señal en vivo';$('modalDesc').textContent=s.descripcion||'Transmisión en vivo';
      host.innerHTML='';currentVideoData=s;
      const type=String(s.tipo||'').toLowerCase();
      if(type==='mp4'){
        const v=document.createElement('video');v.controls=true;v.autoplay=true;v.playsInline=true;v.style.cssText='width:100%;height:100%;object-fit:contain;background:#000';v.src=url;host.appendChild(v);v.play().catch(()=>{});return;
      }
      if(type==='m3u8'){
        const v=document.createElement('video');v.controls=true;v.autoplay=true;v.playsInline=true;v.style.cssText='width:100%;height:100%;object-fit:contain;background:#000';host.appendChild(v);
        if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=url;v.play().catch(()=>{});return;}
        if(window.Hls&&window.Hls.isSupported()){const h=new Hls();h.loadSource(url);h.attachMedia(v);h.on(Hls.Events.MANIFEST_PARSED,()=>v.play().catch(()=>{}));return;}
        const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';script.onload=()=>{if(window.Hls&&window.Hls.isSupported()){const h=new Hls();h.loadSource(url);h.attachMedia(v);h.on(Hls.Events.MANIFEST_PARSED,()=>v.play().catch(()=>{}));}else{host.innerHTML='<div style="display:grid;place-items:center;height:100%;padding:20px;text-align:center;color:#fff">Este dispositivo no puede reproducir esta señal M3U8 directamente.</div>';}};document.head.appendChild(script);return;
      }
      host.innerHTML=`<iframe src="${safe(url)}" title="${safe(s.titulo||'Señal en vivo')}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>`;
    }


    async function cargarChatContext(){
      $('chatTitle').textContent=chatContext.title||'Chat UADAV STREAM';
      $('chatSubtitle').textContent=chatContext.subtitle||'Conversación en vivo';
      $('chatMessages').innerHTML='<div style="padding:25px;text-align:center;color:#777">Cargando conversación…</div>';
      try{
        const data=await api('chat?id_stream='+encodeURIComponent(chatContext.id));
        renderChatMessages(Array.isArray(data)?data:[]);
      }catch(e){
        $('chatMessages').innerHTML='<div style="padding:25px;text-align:center;color:#888">El chat todavía no está habilitado para este contenido.</div>';
      }
    }
    function renderChatMessages(items){
      const box=$('chatMessages');if(!box)return;
      if(!items.length){box.innerHTML='<div style="padding:35px;text-align:center;color:#777">Todavía no hay mensajes. Sé el primero.</div>';return}
      box.innerHTML=items.slice(-40).map(m=>`<div class="chat-msg${m.moderado||m.tipo==='pedido'?' is-request':''}"><div class="chat-msg-meta">${safe(m.alias||'Espectador')} · ${m.tipo==='pedido'?'Pedido':'Mensaje'}</div><div class="chat-msg-text">${safe(m.mensaje||'')}</div></div>`).join('');
      box.scrollTop=box.scrollHeight;
    }
    async function enviarMensajeChat(){
      const text=String($('chatText')?.value||'').trim();if(!text)return;
      const alias=String($('chatAlias')?.value||'Espectador').trim().slice(0,30)||'Espectador';
      const kind=$('chatKind')?.value||'chat';
      $('chatSendBtn').disabled=true;$('chatStatus').textContent='Enviando…';
      try{
        const body={mensaje:kind==='pedido'?'[PEDIDO] '+text:text,id_stream:chatContext.id,alias};
        const res=await fetch(API_URL+'moderar_chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        if(!res.ok)throw new Error('HTTP '+res.status);
        $('chatText').value='';$('chatStatus').textContent=kind==='pedido'?'Pedido enviado.':'Mensaje enviado.';
        await cargarChatContext();
      }catch(e){$('chatStatus').textContent='El chat no está disponible en este momento.'}
      finally{$('chatSendBtn').disabled=false}
    }
    function abrirChat(id,title,subtitle){
      chatContext={id:id||'general',title:title||'Chat UADAV STREAM',subtitle:subtitle||'Conversación en vivo'};
      $('chatOverlay').classList.add('active');$('chatOverlay').setAttribute('aria-hidden','false');
      cargarChatContext();
      clearInterval(chatTimer);chatTimer=setInterval(cargarChatContext,7000);
    }
    function cerrarChat(){clearInterval(chatTimer);chatTimer=null;$('chatOverlay').classList.remove('active');$('chatOverlay').setAttribute('aria-hidden','true')}

    function coincideBusquedaLocal(text,q){
      const hay=normText(text),query=normText(q);
      if(!query)return true;
      if(hay.includes(query))return true;
      const terms=tokenize(q);
      return terms.length?terms.every(t=>hay.includes(normText(t))):false;
    }
    function construirEntidadBusqueda(tipo,item){
      const isArtist=tipo==='artist', isRadio=tipo==='radio';
      const id=safe(item?.id||item?.nombre||item?.stream_url||'');
      const title=safe(item?.nombre||item?.titulo||'Sin nombre');
      const meta=safe(isArtist?(item?.rubro||item?.categoria||'Artista'):(item?.programa||item?.horario||'Radio en vivo'));
      const img=safe(isArtist?(item?.foto||item?.imagen||item?.thumbnail||FALLBACK_THUMB):(item?.logo||item?.imagen||FALLBACK_THUMB));
      return `<article class="search-entity-card ${isArtist?'artist':'radio'}" data-search-entity="${tipo}" data-search-id="${id}"><img src="${img}" alt="${title}" loading="lazy" onerror="this.src='${FALLBACK_THUMB}'"><div class="search-entity-body"><div class="search-entity-title">${title}</div><div class="search-entity-meta">${meta}</div></div></article>`;
    }
    function pintarResultadosCatalogo(q,videos,artists,radios){
      const rail=$('resultsRail');if(!rail)return;
      const total=artists.length+radios.length+videos.length;
      const groups=[];
      groups.push(`<div class="search-catalog-toolbar"><div><div class="search-catalog-title">Resultados para “${safe(q)}”</div><div class="search-catalog-sub">Catálogo UADAV STREAM + fuentes de video disponibles</div></div><div class="search-catalog-filters"><button class="search-catalog-filter active" data-filter="all">Todos <span class="search-catalog-count">${total}</span></button><button class="search-catalog-filter" data-filter="video">Videos <span class="search-catalog-count">${videos.length}</span></button><button class="search-catalog-filter" data-filter="artist">Artistas <span class="search-catalog-count">${artists.length}</span></button><button class="search-catalog-filter" data-filter="radio">Radios <span class="search-catalog-count">${radios.length}</span></button></div></div>`);
      if(artists.length)groups.push(`<section class="search-group" data-search-group="artist"><h3>🎭 Artistas</h3><div class="search-group-sub">Perfiles encontrados en UADAV STREAM</div><div class="search-group-grid">${artists.slice(0,8).map(x=>construirEntidadBusqueda('artist',x)).join('')}</div></section>`);
      if(radios.length)groups.push(`<section class="search-group" data-search-group="radio"><h3>📻 Radios</h3><div class="search-group-sub">Emisoras disponibles para escuchar ahora</div><div class="search-group-grid">${radios.slice(0,8).map(x=>construirEntidadBusqueda('radio',x)).join('')}</div></section>`);
      if(videos.length)groups.push(`<section class="search-group" data-search-group="video"><h3>🎬 Videos</h3><div class="search-group-sub">Resultados de video encontrados en las fuentes disponibles</div><div id="searchVideosRail" class="search-group-grid"></div></section>`);
      rail.innerHTML=groups.length>1?groups.join(''):`<div class="search-results-empty"><div style="font-size:30px;margin-bottom:8px">🔎</div><div style="font-weight:800;color:#fff">No encontramos resultados</div><div style="margin-top:6px">Probamos el catálogo de UADAV STREAM y las fuentes de video disponibles.</div><button class="row-more" style="margin-top:12px" onclick="ejecutarBusqueda(document.getElementById('searchInput').value)">Reintentar</button></div>`;
      rail.querySelectorAll('.search-catalog-filter').forEach(btn=>btn.addEventListener('click',()=>filtrarResultadosCatalogo(btn.dataset.filter)));

      const videoRail=$('searchVideosRail');
      if(videoRail){videoRail.innerHTML=videos.map(v=>cardHTML(v,false)).join('');bindCards(videoRail,videos);}
      rail.querySelectorAll('[data-search-entity]').forEach(el=>el.addEventListener('click',()=>{
        const type=el.dataset.searchEntity,id=el.dataset.searchId;
        if(type==='artist'){const a=artists.find(x=>String(x.id||x.nombre)===String(id));if(a)abrirArtistHub(a);}
        if(type==='radio'){const r=radios.find(x=>String(x.id||x.nombre||x.stream_url)===String(id));if(r)abrirRadioHub(r);}
      }));
    }

    function filtrarResultadosCatalogo(filter){
      document.querySelectorAll('.search-catalog-filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));
      document.querySelectorAll('#resultsRail [data-search-group]').forEach(g=>{g.classList.toggle('search-filter-hidden',filter!=='all'&&g.dataset.searchGroup!==filter)});
    }
    async function ejecutarBusqueda(value){
      const q=String(value||'').trim();
      if(!q){volverInicio();return;}
      registerSearchInterest(q);
      $('searchInput').value=q;$('navSearchInput').value=q;
      $('searchStatus').innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Buscando...';
      ['featuredRow','heroEditorialRow','recommendedRow','liveRow','artists','cartelera'].forEach(id=>{if($(id))$(id).hidden=true});
      $('resultsRow').hidden=false;
      const rail=$('resultsRail');
      rail.innerHTML='<div class="search-results-empty"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando resultados...</div>';
      try{
        const [videos] = await Promise.all([obtenerVideos(q)]);
        const nq=normText(q);
        const artists=(allArtists||[]).filter(a=>coincideBusquedaLocal([a.nombre,a.nombre_artistico,a.rubro,a.ciudad,a.bio,a.titulo].filter(Boolean).join(' '),q)).slice(0,8);
        const radios=(currentRadiosCache||[]).filter(r=>r&&r.activa!==false&&coincideBusquedaLocal([r.nombre,r.descripcion,r.programa,r.locutor,r.horario].filter(Boolean).join(' '),q)).slice(0,8);
        pintarResultadosCatalogo(q,videos,artists,radios);
        const total=artists.length+radios.length+videos.length;
        $('resultsTitle').textContent='Resultados para “'+q+'”';
        $('searchStatus').textContent=total?total+' resultados encontrados':'No encontramos resultados en las fuentes disponibles';
        $('resultsRow').hidden=false;
        requestAnimationFrame(()=>irASeccion('resultsRow'));
      }catch(e){
        console.error('[UADAV] búsqueda fatal:',e);
        $('searchStatus').textContent='Error al buscar';
        rail.innerHTML='<div class="search-results-empty" style="color:#ff7777">No pudimos cargar los resultados. Revisá la conexión con la API.</div>';
      }
    }
    function irASeccion(id){
      const el=$(id);if(!el)return;
      const hadResults=id!=='resultsRow'&&$('resultsRow')&&!$('resultsRow').hidden;
      if(hadResults)cerrarResultadosSinScroll();
      setTimeout(()=>{const offset=(document.getElementById('nav')?.offsetHeight||70)+18;const y=window.scrollY+el.getBoundingClientRect().top-offset;window.scrollTo({top:Math.max(0,y),behavior:'smooth'});},hadResults?120:20);
    }
    function cerrarResultadosSinScroll(){
      if($('resultsRow'))$('resultsRow').hidden=true;if($('featuredRow'))$('featuredRow').hidden=false;if($('heroEditorialRow'))$('heroEditorialRow').hidden=heroSpotlights.length<3;['liveRow','radiosRow','artists','cartelera','shortsRow','jobsRow','discoverRow','recommendedRow'].forEach(id=>{if($(id))$(id).hidden=false});renderContinue();renderSaved();renderRecommendations().catch(()=>{});if($('searchStatus'))$('searchStatus').textContent='';if($('searchInput'))$('searchInput').value='';if($('navSearchInput'))$('navSearchInput').value='';
    }
    function volverInicio(){
      if($('featuredRow'))$('featuredRow').hidden=false;
      if($('heroEditorialRow')){renderHeroEditorial();$('heroEditorialRow').hidden=heroSpotlights.length<3;}
      if($('discoverRail')?.parentElement?.parentElement)$('discoverRail').parentElement.parentElement.hidden=false;
      if($('resultsRow'))$('resultsRow').hidden=true;
      renderContinue();renderSaved();renderRecommendations().catch(()=>{});
      if($('searchStatus'))$('searchStatus').textContent='';
      if($('searchInput'))$('searchInput').value='';
      if($('navSearchInput'))$('navSearchInput').value='';
      window.scrollTo({top:0,behavior:'smooth'});
    }

    let ytPlayer=null;
    let currentQueue=[];
    let currentQueueIndex=0;
    let currentVideoData=null;
    let currentLiveCache=[];
    let heroSpotlight={active:false};
    let chatContext={id:'general',title:'Chat UADAV STREAM',subtitle:'Conversación en vivo'};
    let chatTimer=null;

    function cargarPlayerYouTube(id){
      if(!id)return;
      const host=$('playerFrame');
      if(!host)return;
      host.innerHTML=`<iframe
        src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&controls=1&rel=0&playsinline=1"
        title="Reproductor UADAV STREAM"
        allow="autoplay; encrypted-media; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen></iframe>`;
    }

    function crearOActualizarPlayer(id){cargarPlayerYouTube(id);}

    function prepararCola(video){
      const base=(allVideos||[]).filter(v=>v&&v.id);
      const pool=base.some(v=>v.id===video?.id)?base:[video,...base.filter(v=>v.id!==video?.id)];
      currentQueue=pool;
      currentQueueIndex=Math.max(0,currentQueue.findIndex(v=>v.id===video?.id));
    }

    function reproducirSiguiente(){
      if(!currentQueue.length)return;
      const next=(currentQueueIndex+1)%currentQueue.length;
      currentQueueIndex=next;
      const v=currentQueue[next];
      if(!v)return;
      currentVideoData=v;
      rememberVideo(v);
      $('modalTitle').textContent=v.titulo||'Video';
      $('modalDesc').textContent=v.descripcion||'Contenido audiovisual';
      actualizarBotonesPlayer(v);
      cargarPlayerYouTube(v.id);
    }

    function actualizarBotonesPlayer(v){
      $('modalSaveBtn').innerHTML=`<i class="fa-${isSaved(v.id)?'solid':'regular'} fa-bookmark"></i> ${isSaved(v.id)?'Guardado':'Mi lista'}`;
      $('modalSaveBtn').onclick=()=>{
        const now=toggleSaved(v);
        $('modalSaveBtn').innerHTML=`<i class="fa-${now?'solid':'regular'} fa-bookmark"></i> ${now?'Guardado':'Mi lista'}`;
      };
      $('modalShareBtn').onclick=async()=>{
        const url=`${location.origin}${location.pathname}?video=${encodeURIComponent(v.id)}`;
        if(navigator.share){
          try{await navigator.share({title:v.titulo||'UADAV STREAM',text:v.descripcion||'Mirá este contenido en UADAV STREAM',url});return}catch{}
        }
        try{
          await navigator.clipboard.writeText(url);
          $('modalShareBtn').innerHTML='<i class="fa-solid fa-check"></i> Copiado';
          setTimeout(()=>{$('modalShareBtn').innerHTML='<i class="fa-solid fa-share-nodes"></i> Compartir'},1600);
        }catch{window.open(url,'_blank','noopener')}
      };
    }

    function reproducirVideo(id,titulo,desc,video){
      pausarRadio();
      if(!id||String(id).startsWith('event-')){
        if(video?.eventData){
          const e=video.eventData;
          const link=e.link_pago||e.url||e.link||e.whatsapp;
          if(link)window.open(link,'_blank','noopener');
        }
        return;
      }

      const v={
        ...(video||{}),
        id,
        titulo:titulo||video?.titulo||'Video',
        descripcion:desc||video?.descripcion||'Contenido audiovisual',
        thumbnail:video?.thumbnail||obtenerCaratula(id),
        categoria:video?.categoria||'Contenido'
      };

      prepararCola(v);
      currentVideoData=v;
      rememberVideo(v);
      $('modalTitle').textContent=v.titulo;
      $('modalDesc').textContent=v.descripcion;
      $('videoModal').classList.add('active');
      $('videoModal').classList.remove('pip-mode');
      document.body.style.overflow='';
      const chatBtn=$('modalChatBtn');if(chatBtn){const isLive=!!v.isLiveSignal||v.categoria==='En vivo';chatBtn.style.display=isLive?'inline-flex':'none';chatBtn.onclick=()=>abrirChat('signal:'+String(v.id),v.titulo||'Señal en vivo','Chat y pedidos de la transmisión');}
      actualizarBotonesPlayer(v);
      cargarPlayerYouTube(id);
    }

    function cerrarModal(e){
      if(e&&e.target!==e.currentTarget)return;
      $('videoModal').classList.remove('active','pip-mode');

      const media=$('playerFrame')?.querySelector('video'); if(media){try{media.pause()}catch{} }
      pendingVideoId=null;
      document.body.style.overflow='';
      currentVideoData=null;
    }

    $('btnCaptador').addEventListener('click',async()=>{const email=$('emailInput').value.trim();if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ $('mensajeCaptador').style.color='#ff7b7b';$('mensajeCaptador').textContent='Ingresá un email válido.';return}try{const res=await fetch(API_URL+'suscriptores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});if(!res.ok)throw new Error();$('emailInput').value='';$('mensajeCaptador').style.color='#78f0a2';$('mensajeCaptador').textContent='✓ Listo. Te avisaremos de las novedades.'}catch{$('mensajeCaptador').style.color='#ff7b7b';$('mensajeCaptador').textContent='No pudimos registrar el email. Intentá nuevamente.'}});

    function mostrarMiniPlayer(){
      const modal=$('videoModal');
      if(!modal?.classList.contains('active'))return;
      modal.classList.add('pip-mode');
      document.body.style.overflow='';
    }
    function restaurarPlayer(){
      const modal=$('videoModal');
      if(!modal?.classList.contains('active'))return;
      modal.classList.remove('pip-mode');
    }
    function cerrarMiniPlayer(){ cerrarModal(); }

    function actualizarMiniPlayer(){
      const modal=$('videoModal');
      if(!modal||!modal.classList.contains('active'))return;
      modal.classList.toggle('pip-mode',window.scrollY>180);
    }
    window.addEventListener('scroll',actualizarMiniPlayer,{passive:true});
    window.addEventListener('scroll',()=>{$('nav').classList.toggle('scrolled',window.scrollY>30)});
    document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if($('chatOverlay')?.classList.contains('active')){cerrarChat();return}if($('infoOverlay')?.classList.contains('active')){cerrarInfoOverlay();return}if($('radioHubOverlay')?.classList.contains('active')){cerrarRadioHub();return}cerrarModal()});
    $('footerYear').textContent=new Date().getFullYear();

    $('chatSendBtn')?.addEventListener('click',enviarMensajeChat);
    $('chatText')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviarMensajeChat()}});

    function applyPublicExperience(cfg){try{const p=cfg?.public_experience||{};document.body.classList.toggle('uadav-mode-landing',p.mode==='landing');document.body.classList.toggle('uadav-density-compact',p.density==='compact');document.body.classList.toggle('uadav-density-cinematic',p.density==='cinematic');document.body.classList.toggle('uadav-nav-complete',p.nav==='complete'); const ap=document.getElementById('navAudienceProfile'); if(ap) ap.hidden=p.audience_profile===false;}catch{}}
    async function init(){
      // First paint: only load what is needed to draw the shell and primary rows.
      uadavLoadAnalytics().catch(()=>{});
      const modo=await cargarEstadoSitio();
      const cfgTasks=[cargarConfig(),cargarWebVisibility(),cargarHomeLayout(),cargarBannersPublicos()];
      await Promise.allSettled(cfgTasks);
      if(modo==='mantenimiento') return;
      prepararRailWrappers();
      renderContinue();
      await Promise.allSettled([cargarDestacados(),cargarArtistas(),cargarEventos(),cargarLive(),cargarRadios(),cargarMedia()]);
      applyWebVisibility();
      try{renderRecommendations()}catch(e){console.warn('Recomendaciones:',e)}
      prepararRailWrappers();
      activarArrastreCarruseles();

      // Secondary discovery never blocks Home. This is important when an
      // Invidious instance is slow or unavailable.
      const deferred=()=>{
        cargarSeccionesAdministradas().then(()=>{applyWebVisibility();prepararRailWrappers();activarArrastreCarruseles()}).catch(()=>{});
        cargarDiscover().catch(()=>{});
        cargarPlaylists().catch(()=>{});
        cargarPodcasts().catch(()=>{});
      };
      if('requestIdleCallback' in window) requestIdleCallback(deferred,{timeout:1400});
      else setTimeout(deferred,500);

      if('serviceWorker' in navigator){try{
        const SW_VERSION='uadavstream-v85';
        if(localStorage.getItem('uadav_sw_version')!==SW_VERSION){
          const regs=await navigator.serviceWorker.getRegistrations();
          for(const reg of regs){try{await reg.unregister()}catch{}}
          if(window.caches){const names=await caches.keys();for(const name of names){try{await caches.delete(name)}catch{}}}
          localStorage.setItem('uadav_sw_version',SW_VERSION);
        }
        const reg=await navigator.serviceWorker.register('/service-worker.js?v=85',{updateViaCache:'none'});
        await reg.update().catch(()=>{});
      }catch(e){console.warn('SW',e)}}
    }
    init().then(()=>{
      try{
        const params=new URLSearchParams(location.search); const rid=params.get('radio'); const aid=params.get('artist');
        if(aid && allArtists.length){ const key=decodeURIComponent(aid).toLowerCase(); const a=allArtists.find(x=>String(x.canal||x.id||x.titulo||'').toLowerCase()===key || String(x.titulo||x.nombre||'').toLowerCase()===key); if(a)abrirArtistHub(a); }
        if(rid && currentRadiosCache.length){
          const r=currentRadiosCache.find(x=>obtenerRadioHubId(x)===rid||String(x.nombre||'')===rid);
          if(r)abrirRadioHub(r);
        }
      }catch{}
    });
  document.addEventListener('keydown',e=>{
      if(e.key!=='Escape')return;
      if($('videoModal')?.classList.contains('active'))cerrarModal();
      else if($('resultsRow')&&!$('resultsRow').hidden)volverInicio();
    });


(function(){
  const $=id=>document.getElementById(id);
  async function publicApi(path,opt={}){const res=await fetch(API_URL+path+(path.includes('?')?'&':'?')+'_='+Date.now(),opt);const d=await res.json().catch(()=>({}));if(!res.ok)throw new Error(d.error||('HTTP '+res.status));return d;}
  window.enviarPostulacionArtista=async function(){const body={nombre:($('artistApplyName')?.value||'').trim(),rubro:$('artistApplyRubro')?.value||'',ciudad:($('artistApplyCity')?.value||'').trim(),email:($('artistApplyEmail')?.value||'').trim(),whatsapp:($('artistApplyWhatsapp')?.value||'').trim(),youtube:($('artistApplyYoutube')?.value||'').trim(),foto:($('artistApplyPhoto')?.value||'').trim(),bio:($('artistApplyBio')?.value||'').trim()};const st=$('artistApplyStatus');if(!body.nombre||!body.email){if(st)st.textContent='Completá nombre y email.';return}try{await publicApi('postulaciones_artista',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(st)st.innerHTML='<span style="color:#71e1a5">✓ Recibimos tu postulación. UADAV STREAM la revisará.</span>';['artistApplyName','artistApplyCity','artistApplyEmail','artistApplyWhatsapp','artistApplyYoutube','artistApplyPhoto','artistApplyBio'].forEach(id=>{if($(id))$(id).value=''})}catch(e){if(st)st.innerHTML='<span style="color:#ff9393">No pudimos enviar la postulación. Intentá nuevamente.</span>';}};
  window.cargarShorts=async function(){const row=$('shortsRow'),rail=$('shortsRail');if(!rail)return;try{const arr=await publicApi('shorts');const list=Array.isArray(arr)?arr:[];row.hidden=false;rail.innerHTML=list.length?list.slice(0,18).map((v,i)=>`<article class="short-card-v31" data-short-id="${safe(v.id||v.youtube_id||'')}"><img class="short-thumb" src="${safe(v.thumbnail||obtenerCaratula(v.id||v.youtube_id||''))}" alt="${safe(v.titulo||'Short')}" loading="lazy" onerror="this.src='${FALLBACK_THUMB}'"><div class="short-title">${safe(v.titulo||'Short')}</div><div class="short-meta">${safe(v.artista||v.descripcion||'UADAV STREAM')}</div></article>`).join(''):'<div class="artist-section-empty">Todavía no hay Shorts publicados.</div>';rail.querySelectorAll('[data-short-id]').forEach((el,i)=>el.onclick=()=>{const v=list[i];if(v?.id||v?.youtube_id)reproducirVideo(v.id||v.youtube_id,v.titulo||'Short',v.descripcion||v.artista||'UADAV STREAM',{...v,tipo:'short',categoria:'Shorts'})});}catch{row.hidden=false;rail.innerHTML='<div class="artist-section-empty">Shorts no disponibles en este momento.</div>';}};
  window.cargarOfertasPublicas=async function(){const row=$('jobsRow'),rail=$('jobsRail');if(!rail)return;try{const list=await publicApi('bolsa_trabajo');row.hidden=false;rail.innerHTML=Array.isArray(list)&&list.length?list.filter(x=>x.activo!==false).slice(0,16).map((x,i)=>`<article class="job-card-v31"><div class="job-kicker">💼 ${safe(x.rubro||'Oportunidad')}</div><h3>${safe(x.titulo||'Oportunidad')}</h3><p>${safe(x.descripcion||'')}</p><div class="job-meta">${safe(x.ciudad||'')} ${x.fecha?'· '+safe(x.fecha):''}</div><button class="btn btn-secondary btn-sm" type="button" style="margin-top:10px" onclick='abrirJobApply(${JSON.stringify(x).replace(/</g,'\u003c')})'>Postularme</button></article>`).join(''):'<div class="artist-section-empty">Todavía no hay ofertas en la bolsa de trabajo.</div>';}catch{row.hidden=false;rail.innerHTML='<div class="artist-section-empty">Bolsa de trabajo no disponible.</div>';}};
  window.abrirJobApply=function(job){$('jobApplyTitle').textContent=job.titulo||'Postularme';$('jobApplyDesc').textContent=[job.rubro,job.ciudad,job.descripcion].filter(Boolean).join(' · ');window.__jobApply=job;$('jobApplyOverlay').classList.add('active');$('jobApplyOverlay').setAttribute('aria-hidden','false');document.body.style.overflow='hidden'};
  window.cerrarJobApply=function(){$('jobApplyOverlay').classList.remove('active');$('jobApplyOverlay').setAttribute('aria-hidden','true');document.body.style.overflow=''};
  window.enviarPostulacionTrabajo=async function(){const j=window.__jobApply||{};const body={job_id:j.id,nombre:($('jobApplyName')?.value||'').trim(),email:($('jobApplyEmail')?.value||'').trim(),whatsapp:($('jobApplyWhatsapp')?.value||'').trim(),mensaje:($('jobApplyMessage')?.value||'').trim()};if(!body.nombre||!body.email){$('jobApplyStatus').textContent='Completá nombre y email.';return}try{await publicApi('bolsa_trabajo/postular',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});$('jobApplyStatus').innerHTML='<span style="color:#71e1a5">✓ Postulación enviada.</span>';setTimeout(cerrarJobApply,1200)}catch(e){$('jobApplyStatus').textContent='No pudimos enviar la postulación.'}};
  const oldInit=window.init;
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{window.cargarShorts();window.cargarOfertasPublicas();},900));
})();


(function(){
 const $=id=>document.getElementById(id);
 async function loadPublicArtistFromApi(){const p=new URLSearchParams(location.search);const id=p.get('artist');if(!id)return;try{const res=await fetch(API_URL+'public/artista?id='+encodeURIComponent(id));if(!res.ok)return;const a=await res.json();if(typeof abrirArtistHub==='function')abrirArtistHub({...a,titulo:a.nombre});}catch{}}
 window.openArtistPublic=function(id){location.href='/artista.html?id='+encodeURIComponent(id)};
 loadPublicArtistFromApi();
})();


