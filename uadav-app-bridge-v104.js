(()=>{
  'use strict';
  if(window.top===window.self){
    const qs=new URLSearchParams(location.search);
    if(qs.get('standalone')!=='1'){
      const here=location.pathname+location.search+location.hash;
      location.replace('/app.html?build=104&view='+encodeURIComponent(here));
    }
    return;
  }
  document.documentElement.classList.add('uadav-app-embedded');
  const sameOrigin=(url)=>{try{return new URL(url,location.href).origin===location.origin}catch{return false}};
  const normalizeHref=(href)=>{const u=new URL(href,location.href);if(u.origin!==location.origin)return '';return u.pathname+u.search+u.hash};
  function host(){try{return window.parent.UADAVShellHost||window.parent.UADAV_APP||null}catch{return null}}
  function navigate(href,opts={}){const h=host(),to=normalizeHref(href);if(!to)return false;if(h?.navigate){h.navigate(to,opts);return true}try{window.parent.postMessage({type:'uadav:navigate',href:to,replace:!!opts.replace},location.origin);return true}catch{return false}}
  function playContent(item){const h=host();if(h?.playContent)return h.playContent(item);try{window.parent.postMessage({type:'uadav:content-play',item},location.origin);return true}catch{return false}}
  document.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const a=e.target.closest?.('a[href]');if(!a||a.target==='_blank'||a.hasAttribute('download'))return;const href=a.getAttribute('href')||'';if(!href||href.startsWith('#')||href.startsWith('javascript:')||href.startsWith('mailto:')||href.startsWith('tel:'))return;if(!sameOrigin(href))return;if(navigate(href)){e.preventDefault();e.stopPropagation()}},true);
  window.UADAVAppBridge={navigate,playContent,host};

  // V10.5.7 · Radio: mismo método probado por Beat Digital Radio.
  // Zeno SSE directo para metadata + Deezer JSONP para carátula. Worker queda como fallback.
  if((document.querySelector('meta[name="site-page"]')?.content||'')==='radio'){
    const API='https://uadav-api.uadavstream.workers.dev/api/';
    let es=null,fallbackTimer=0,lastKey='',jsonpSeq=0;
    const css=document.createElement('style');
    css.textContent='@media(max-width:700px){body.radio-playing .now,body .now{background:linear-gradient(180deg,#21171b 0%,#100d12 60%,#07090d 100%)!important;border:0!important;box-shadow:none!important}body.radio-playing .now-art{width:min(84vw,390px)!important;border-radius:16px!important}body.radio-playing .now-main{text-align:left!important;padding:8px 4px!important}body.radio-playing .now-label{opacity:.72}body.radio-playing .now-title{font-size:27px!important;line-height:1.08!important}body.radio-playing .now-artist{font-size:15px!important;margin-top:7px!important}.radio-tabs{scrollbar-width:none}.radio-tabs::-webkit-scrollbar{display:none}}';
    document.head.appendChild(css);

    const rid=()=>new URLSearchParams(location.search).get('id')||new URLSearchParams(location.search).get('radio')||'beat-digital';
    const fallbackArt=()=>document.querySelector('.side-logo')?.src||document.querySelector('#nowArt')?.src||'/radio-fallback.svg';
    function setText(title,artist){const t=document.getElementById('nowTitle'),a=document.getElementById('nowArtist');if(t)t.textContent=title||'Radio en vivo';if(a)a.textContent=artist||'BEAT DIGITAL RADIO';document.title=(title||'Radio en vivo')+' - '+(artist||'BEAT DIGITAL RADIO')+' · UADAV STREAM'}
    function setArt(art){if(!art)return;const img=document.getElementById('nowArt');if(img){img.onerror=()=>{img.onerror=null;img.src=fallbackArt()};img.src=art}}
    function notify(title,artist,art){try{window.parent.postMessage({type:'uadav:radio-meta',radio_id:rid(),title,artist,artwork:art||fallbackArt()},location.origin)}catch{}}
    function splitStreamTitle(raw){let artist='',title=String(raw||'').trim();if(title.includes(' - ')){const p=title.split(' - ');artist=p.shift().trim();title=p.join(' - ').trim()}return{artist,title}}
    function deezerCover(artist,title){
      return new Promise(resolve=>{
        const cb='uadavDeezer_'+Date.now()+'_'+(++jsonpSeq),script=document.createElement('script');
        const done=art=>{try{delete window[cb]}catch{};script.remove();resolve(art||'')};
        const timeout=setTimeout(()=>done(''),6500);
        window[cb]=data=>{clearTimeout(timeout);const hit=data?.data?.[0];done(hit?.album?.cover_xl||hit?.album?.cover_big||hit?.album?.cover_medium||'')};
        script.onerror=()=>{clearTimeout(timeout);done('')};
        script.src='https://api.deezer.com/search?q='+encodeURIComponent((artist+' '+title).trim())+'&output=jsonp&callback='+encodeURIComponent(cb);
        document.body.appendChild(script);
      });
    }
    async function applyMeta(meta){
      const streamTitle=String(meta?.streamTitle||meta?.stream_title||'').trim();
      let artist=String(meta?.artist||'').trim(),title=String(meta?.title||meta?.song||meta?.track||'').trim();
      if((!artist||!title)&&streamTitle){const s=splitStreamTitle(streamTitle);artist=artist||s.artist;title=title||s.title}
      if(!title)return;
      setText(title,artist); // visible inmediatamente, antes de buscar portada
      const key=(artist+'|'+title).toLowerCase();if(key===lastKey)return;lastKey=key;
      const fb=fallbackArt();notify(title,artist,fb);
      const art=await deezerCover(artist,title);if(art){setArt(art);notify(title,artist,art)}
    }
    async function workerFallback(){try{const r=await fetch(API+'radio/metadata?radio_id='+encodeURIComponent(rid())+'&_='+Date.now(),{cache:'no-store'});if(r.ok){const d=await r.json();applyMeta(d?.data||d)}}catch{}}
    async function bootRadioMeta(){
      let metaUrl='';
      try{const r=await fetch(API+'radios?_='+Date.now(),{cache:'no-store'});if(r.ok){const list=await r.json();const radio=Array.isArray(list)?list.find(x=>String(x.id)===String(rid())):null;metaUrl=String(radio?.metadata_url||radio?.meta_url||'')}}catch{}
      // Beat Digital y cualquier radio Zeno pueden derivar metadata desde el stream/mount.
      if(!metaUrl&&rid()==='beat-digital')metaUrl='https://api.zeno.fm/mounts/metadata/subscribe/9s7nnwmknkhvv';
      if(metaUrl&&window.EventSource){
        try{es?.close();es=new EventSource(metaUrl);es.onmessage=e=>{try{const d=JSON.parse(e.data||'{}');if(d?.streamTitle||d?.artist||d?.title)applyMeta(d)}catch{}};es.onerror=()=>{workerFallback()}}catch{workerFallback()}
      }else workerFallback();
      clearInterval(fallbackTimer);fallbackTimer=setInterval(workerFallback,15000);
    }
    const start=()=>setTimeout(bootRadioMeta,350);
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
    window.addEventListener('beforeunload',()=>{try{es?.close()}catch{};clearInterval(fallbackTimer)});
  }
})();