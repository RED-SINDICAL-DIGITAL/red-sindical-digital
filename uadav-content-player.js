(()=>{
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const pick=(...vals)=>{for(const v of vals){if(v!==undefined&&v!==null&&String(v).trim()!=='')return String(v).trim()}return''};
  const API=()=>window.UADAV_API_BASE||'https://uadav-api.uadavstream.workers.dev/api/';
  let openSeq=0;

  function normalize(raw={}){
    let x={...(raw||{})};
    if(typeof x.data_json==='string'){try{const j=JSON.parse(x.data_json);if(j&&typeof j==='object')x={...j,...x}}catch{}}
    let provider=pick(x.provider,x.source,x.plataforma).toLowerCase();
    let url=pick(x.url,x.href,x.link,x.source_url,x.video_url,x.youtube_url,x.url_video,x.embed_url,x.watch_url);
    let external=pick(x.external_id,x.youtube_id,x.videoId,x.video_id,x.yt_id);
    let type=pick(x.content_type,x.tipo,x.kind).toLowerCase();
    const id=pick(x.id);
    if(provider==='invidious')provider='youtube';
    if(/\/watch\?v=|\/embed\/|\/shorts\/|\/live\//i.test(url)&&/invid|yewtu|youtube|youtu\.be/i.test(url))provider='youtube';
    if(!external){const m=url.match(/[?&]v=([A-Za-z0-9_-]{11})/)||url.match(/\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/)||url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);if(m)external=m[1]}
    if(!external){const thumb=pick(x.thumbnail,x.imagen,x.image);const m=thumb.match(/(?:i\.ytimg\.com|img\.youtube\.com)\/vi(?:_webp)?\/([A-Za-z0-9_-]{11})\//i);if(m)external=m[1]}
    if(!external&&/^[A-Za-z0-9_-]{11}$/.test(id)&&(!provider||provider==='youtube'))external=id;
    if(!provider&&external)provider='youtube';
    if(!url&&external&&provider==='youtube')url='https://www.youtube.com/watch?v='+external;
    if(!provider){if(/youtu\.be|youtube\.com|youtube-nocookie\.com|invid|yewtu/i.test(url))provider='youtube';else if(/spotify\.com/i.test(url))provider='spotify';else if(/vimeo\.com/i.test(url))provider='vimeo';else if(/soundcloud\.com/i.test(url))provider='soundcloud';else if(/drive\.google\.com/i.test(url))provider='drive';else if(/ok\.ru/i.test(url))provider='okru';}
    if(!type)type=provider==='youtube'?'video':'link';
    return {...x,provider,url,external_id:external,content_type:type,tipo:x.tipo||type,titulo:pick(x.titulo,x.title,x.nombre,'Contenido'),descripcion:pick(x.descripcion,x.description,x.author,x.channel_name,x.channelTitle),thumbnail:pick(x.thumbnail,x.imagen,x.image,x.foto)};
  }

  function source(raw){const m=normalize(raw);return m.url||(m.provider==='youtube'&&m.external_id?'https://www.youtube.com/watch?v='+m.external_id:'')}
  function youtubeId(m,u){return m.external_id||(u?.hostname?.includes('youtu.be')?u.pathname.slice(1):(u?.searchParams?.get('v')||(/\/(?:shorts|embed|live)\/([^/?]+)/.exec(u?.pathname||'')||[])[1]||''))}
  function youtubeFallback(id){return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&controls=1&rel=0&playsinline=1`}

  function embed(raw){
    const m=normalize(raw);let u=null;try{if(m.url)u=new URL(m.url)}catch{}
    if(m.provider==='youtube'){
      const list=(u?.searchParams?.get('list')||((m.content_type==='playlist')?m.external_id:'')||'').trim();
      const vid=youtubeId(m,u);
      if(list)return `<iframe title="YouTube playlist" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen src="https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}&autoplay=1&rel=0&playsinline=1"></iframe>`;
      if(vid)return `<iframe title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen src="${youtubeFallback(vid)}"></iframe>`;
    }
    if(m.provider==='spotify'){const z=m.url.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([^?]+)/);if(z)return `<iframe title="Spotify" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" src="https://open.spotify.com/embed/${z[1]}/${z[2]}"></iframe>`}
    if(m.provider==='vimeo'&&u){const id=(u.pathname.match(/\/(\d+)/)||[])[1];if(id)return `<iframe title="Vimeo" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen src="https://player.vimeo.com/video/${id}?autoplay=1"></iframe>`}
    if(m.provider==='soundcloud'&&m.url)return `<iframe title="SoundCloud" height="166" allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(m.url)}&auto_play=true"></iframe>`;
    if(m.provider==='drive'&&m.url){const id=(m.url.match(/\/d\/([^/]+)/)||[])[1]||u?.searchParams?.get('id');if(id)return `<iframe title="Google Drive" allow="autoplay" src="https://drive.google.com/file/d/${encodeURIComponent(id)}/preview"></iframe>`}
    if(m.provider==='okru'&&m.url){const id=(m.url.match(/video\/(?:embed\/)?([^/?]+)/)||[])[1];if(id)return `<iframe title="OK.ru" allow="autoplay" allowfullscreen src="https://ok.ru/videoembed/${encodeURIComponent(id)}"></iframe>`}
    if(/\.(mp3|aac|m4a)(\?|$)/i.test(m.url))return `<audio controls autoplay src="${esc(m.url)}"></audio>`;
    if(/\.(mp4|webm)(\?|$)/i.test(m.url))return `<video controls autoplay playsinline src="${esc(m.url)}"></video>`;
    return '';
  }

  function ensure(){
    let root=document.getElementById('uadavUniversalPlayer');if(root)return root;
    root=document.createElement('div');root.id='uadavUniversalPlayer';root.setAttribute('aria-hidden','true');
    root.innerHTML=`<div class="uadav-up-card"><div class="uadav-up-tools"><button class="uadav-up-mini" type="button" aria-label="Minimizar reproductor">⌄</button><button class="uadav-up-close" type="button" aria-label="Cerrar">✕</button></div><div class="uadav-up-frame"></div><div class="uadav-up-copy"><div><strong class="uadav-up-title">Contenido</strong><div class="uadav-up-meta"></div></div><a class="uadav-up-source" target="_blank" rel="noopener">Abrir fuente</a></div></div>`;
    const st=document.createElement('style');
    st.textContent=`#uadavUniversalPlayer{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.94);display:none;align-items:center;justify-content:center;padding:18px}#uadavUniversalPlayer.active{display:flex}#uadavUniversalPlayer.mini{pointer-events:none;background:transparent;align-items:flex-end;justify-content:flex-end;padding:14px}.uadav-up-card{position:relative;width:min(1120px,97vw);max-height:95vh;overflow:auto;background:#080d14;border:1px solid rgba(255,255,255,.12);border-radius:24px;box-shadow:0 30px 100px #000b}.uadav-up-frame{aspect-ratio:16/9;background:#000;display:grid;place-items:center;overflow:hidden;border-radius:24px 24px 0 0}.uadav-up-frame iframe,.uadav-up-frame video{width:100%;height:100%;border:0}.uadav-up-frame audio{width:min(760px,90%)}.uadav-up-copy{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:16px 18px}.uadav-up-title{font-size:18px}.uadav-up-meta{color:#94a3b7;font-size:12px;margin-top:4px}.uadav-up-source{border:1px solid rgba(255,255,255,.12);padding:9px 12px;border-radius:11px;color:#fff;text-decoration:none;font-weight:800;white-space:nowrap}.uadav-up-tools{position:absolute;right:12px;top:12px;z-index:3;display:flex;gap:7px}.uadav-up-close,.uadav-up-mini{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:#101722;color:#fff;cursor:pointer;font-weight:900}.uadav-up-empty,.uadav-up-loading{color:#c9d4df;text-align:center;padding:40px}.uadav-up-empty h3{margin:0 0 8px}#uadavUniversalPlayer.mini .uadav-up-card{pointer-events:auto;width:min(430px,94vw);max-height:none;border-radius:17px}#uadavUniversalPlayer.mini .uadav-up-frame{border-radius:17px 17px 0 0}#uadavUniversalPlayer.mini .uadav-up-copy{padding:9px 12px}#uadavUniversalPlayer.mini .uadav-up-meta,#uadavUniversalPlayer.mini .uadav-up-source{display:none}#uadavUniversalPlayer.mini .uadav-up-mini{transform:rotate(180deg)}@media(max-width:650px){.uadav-up-copy{align-items:flex-start;flex-direction:column}.uadav-up-source{width:100%;text-align:center}#uadavUniversalPlayer.mini{padding:8px}#uadavUniversalPlayer.mini .uadav-up-card{width:96vw}}`;
    document.head.appendChild(st);document.body.appendChild(root);
    root.querySelector('.uadav-up-close').onclick=()=>api.close();
    root.querySelector('.uadav-up-mini').onclick=()=>api.toggleMini();
    root.addEventListener('click',e=>{if(e.target===root&&!root.classList.contains('mini'))api.close()});
    return root;
  }

  function iframe(src,title='Contenido'){
    const f=document.createElement('iframe');f.title=title;f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.referrerPolicy='strict-origin-when-cross-origin';f.allowFullscreen=true;f.src=src;return f;
  }
  function setEmpty(frame,src,msg='Este proveedor no ofrece reproducción embebida para este contenido.'){
    frame.innerHTML=`<div class="uadav-up-empty"><h3>No se puede reproducir dentro de UADAV STREAM</h3><p>${esc(src?msg:'Falta la URL o el identificador del contenido.')}</p></div>`;
  }
  async function resolveYoutube(id){
    if(!id)return null;
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),6500);
    try{
      const r=await fetch(API()+'playback/youtube?id='+encodeURIComponent(id)+'&_='+Date.now(),{cache:'no-store',signal:ctl.signal});
      if(!r.ok)return null;const d=await r.json();return d&&typeof d==='object'?d:null;
    }catch{return null}finally{clearTimeout(timer)}
  }
  async function renderYoutube(frame,n,seq){
    let u=null;try{if(n.url)u=new URL(n.url)}catch{}
    const list=(u?.searchParams?.get('list')||((n.content_type==='playlist')?n.external_id:'')||'').trim();
    if(list){frame.replaceChildren(iframe(`https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}&autoplay=1&rel=0&playsinline=1`,'YouTube playlist'));return true}
    const id=youtubeId(n,u);if(!id){setEmpty(frame,source(n));return false}
    frame.innerHTML='<div class="uadav-up-loading">Preparando reproducción segura…</div>';
    const resolved=await resolveYoutube(id);if(seq!==openSeq)return false;
    if(resolved?.direct_url){
      const v=document.createElement('video');v.controls=true;v.autoplay=true;v.playsInline=true;v.preload='metadata';v.src=resolved.direct_url;
      let failed=false;v.addEventListener('error',()=>{if(failed||seq!==openSeq)return;failed=true;frame.replaceChildren(iframe(resolved.embed_url||youtubeFallback(id),'YouTube video'))},{once:true});
      frame.replaceChildren(v);v.play().catch(()=>{});return true;
    }
    frame.replaceChildren(iframe(resolved?.embed_url||youtubeFallback(id),'YouTube video'));return true;
  }
  function renderBasic(frame,n){const html=embed(n);if(html){frame.innerHTML=html;return true}setEmpty(frame,source(n));return false}

  const api={
    normalize,source,embed,
    async open(item={},opts={}){
      const n=normalize(item);
      if(window.parent!==window&&opts.local!==true){
        try{window.parent.postMessage({type:'uadav:content-play',item:n},location.origin);return true}catch{}
      }
      const seq=++openSeq,root=ensure(),frame=root.querySelector('.uadav-up-frame'),src=source(n);
      root.classList.add('active');root.classList.remove('mini');root.setAttribute('aria-hidden','false');
      root.querySelector('.uadav-up-title').textContent=n.titulo||'Contenido';
      root.querySelector('.uadav-up-meta').textContent=[n.provider,n.categoria,n.descripcion].filter(Boolean).join(' · ');
      const a=root.querySelector('.uadav-up-source');a.href=src||'#';a.hidden=!src;
      document.body.style.overflow='hidden';
      if(n.provider==='youtube')return renderYoutube(frame,n,seq);
      return renderBasic(frame,n);
    },
    close(){openSeq++;const root=document.getElementById('uadavUniversalPlayer');if(!root)return;const media=root.querySelector('video,audio');try{media?.pause?.()}catch{}root.querySelector('.uadav-up-frame').innerHTML='';root.classList.remove('active','mini');root.setAttribute('aria-hidden','true');document.body.style.overflow=''},
    toggleMini(){const root=document.getElementById('uadavUniversalPlayer');if(!root?.classList.contains('active'))return;const mini=root.classList.toggle('mini');document.body.style.overflow=mini?'':'hidden'}
  };
  window.UADAVContentPlayer=api;
  document.addEventListener('keydown',e=>{if(e.key==='Escape')api.close()});
})();
