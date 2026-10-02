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

  const API='https://uadav-api.uadavstream.workers.dev/api/';
  let jsonpSeq=0;
  function splitStreamTitle(raw){let artist='',title=String(raw||'').trim();if(title.includes(' - ')){const p=title.split(' - ');artist=p.shift().trim();title=p.join(' - ').trim()}return{artist,title}}
  function parseMeta(meta){
    const src=meta?.data||meta?.metadata||meta?.now_playing||meta||{};
    const streamTitle=String(src?.streamTitle||src?.stream_title||'').trim();
    let artist=String(src?.artist||src?.author||src?.artistName||src?.artist_name||'').trim();
    let title=String(src?.title||src?.song||src?.track||src?.songtitle||src?.currentSong||'').trim();
    if((!artist||!title)&&streamTitle){const s=splitStreamTitle(streamTitle);artist=artist||s.artist;title=title||s.title}
    return{artist,title:title||streamTitle};
  }
  function deezerCover(artist,title){
    return new Promise(resolve=>{
      if(!title){resolve('');return}
      const cb='uadavDeezer_'+Date.now()+'_'+(++jsonpSeq),script=document.createElement('script');let finished=false;
      const done=art=>{if(finished)return;finished=true;clearTimeout(timer);try{delete window[cb]}catch{};script.remove();resolve(art||'')};
      const timer=setTimeout(()=>done(''),6500);
      window[cb]=data=>{const hit=data?.data?.[0];done(hit?.album?.cover_xl||hit?.album?.cover_big||hit?.album?.cover_medium||'')};
      script.onerror=()=>done('');
      script.src='https://api.deezer.com/search?q='+encodeURIComponent((artist+' '+title).trim())+'&output=jsonp&callback='+encodeURIComponent(cb);
      document.body.appendChild(script);
    });
  }
  async function getJSON(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}

  // V10.5.8 · HOME: la tarjeta oficial no depende de que el usuario pulse Sintonizar.
  // Lee el endpoint del Worker ya validado y actualiza tarjeta + shell/miniplayer.
  if(location.pathname==='/'||/\/index\.html$/i.test(location.pathname)){
    let homeTimer=0,homeLastKey='';
    async function homeRadioTick(){
      try{
        const radios=await getJSON(API+'radios?_='+Date.now());
        const list=Array.isArray(radios)?radios:[];
        const radio=list.find(r=>r?.es_oficial===true)||list.find(r=>String(r?.id||'')==='beat-digital')||list[0];
        if(!radio)return;
        const rid=String(radio.id||radio.nombre||'beat-digital');
        const payload=await getJSON(API+'radio/metadata?radio_id='+encodeURIComponent(rid)+'&_='+Date.now());
        const m=parseMeta(payload);
        if(!m.title)return;
        const titleEl=document.getElementById('radio-main-song');
        const artistEl=document.getElementById('radio-main-artist');
        if(titleEl)titleEl.textContent=m.title;
        if(artistEl)artistEl.textContent=m.artist||radio.nombre||'En vivo';
        const mini=document.getElementById('radio-mini-song-'+rid);if(mini)mini.textContent=[m.artist,m.title].filter(Boolean).join(' - ');
        const key=(m.artist+'|'+m.title).toLowerCase();
        let art=radio.logo||radio.imagen||radio.portada||'/radio-fallback.svg';
        if(key!==homeLastKey){homeLastKey=key;const found=await deezerCover(m.artist,m.title);if(found)art=found}
        const card=document.getElementById('radio-card-'+rid);const cardImg=card?.querySelector('img');if(cardImg&&art)cardImg.src=art;
        try{window.parent.postMessage({type:'uadav:radio-meta',radio_id:rid,stream_url:radio.stream_url||radio.url||'',title:m.title,artist:m.artist,artwork:art,station:radio.nombre||'Radio'},location.origin)}catch{}
      }catch(e){console.warn('[UADAV Home radio metadata]',e)}
    }
    const startHome=()=>{homeRadioTick();clearInterval(homeTimer);homeTimer=setInterval(homeRadioTick,12000)};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(startHome,700),{once:true});else setTimeout(startHome,700);
    window.addEventListener('beforeunload',()=>clearInterval(homeTimer));
  }

  // RADIO PROFILE: Worker primero; Zeno SSE como actualización inmediata cuando está disponible.
  if((document.querySelector('meta[name="site-page"]')?.content||'')==='radio'){
    let es=null,fallbackTimer=0,lastKey='';
    const css=document.createElement('style');
    css.textContent='@media(max-width:700px){body.radio-playing .now,body .now{background:linear-gradient(180deg,#21171b 0%,#100d12 60%,#07090d 100%)!important;border:0!important;box-shadow:none!important}body.radio-playing .now-art{width:min(84vw,390px)!important;border-radius:16px!important}body.radio-playing .now-main{text-align:left!important;padding:8px 4px!important}body.radio-playing .now-label{opacity:.72}body.radio-playing .now-title{font-size:27px!important;line-height:1.08!important}body.radio-playing .now-artist{font-size:15px!important;margin-top:7px!important}.radio-tabs{scrollbar-width:none}.radio-tabs::-webkit-scrollbar{display:none}}';
    document.head.appendChild(css);
    const rid=()=>new URLSearchParams(location.search).get('id')||new URLSearchParams(location.search).get('radio')||'beat-digital';
    const fallbackArt=()=>document.querySelector('.side-logo')?.src||document.querySelector('#nowArt')?.src||'/radio-fallback.svg';
    function setText(title,artist){const t=document.getElementById('nowTitle'),a=document.getElementById('nowArtist');if(t)t.textContent=title||'Radio en vivo';if(a)a.textContent=artist||'BEAT DIGITAL RADIO';document.title=(title||'Radio en vivo')+' - '+(artist||'BEAT DIGITAL RADIO')+' · UADAV STREAM'}
    function setArt(art){if(!art)return;const img=document.getElementById('nowArt');if(img){img.onerror=()=>{img.onerror=null;img.src=fallbackArt()};img.src=art}}
    function notify(title,artist,art){try{window.parent.postMessage({type:'uadav:radio-meta',radio_id:rid(),title,artist,artwork:art||fallbackArt()},location.origin)}catch{}}
    async function applyMeta(meta){const m=parseMeta(meta);if(!m.title)return;setText(m.title,m.artist);const key=(m.artist+'|'+m.title).toLowerCase();if(key===lastKey)return;lastKey=key;const fb=fallbackArt();notify(m.title,m.artist,fb);const art=await deezerCover(m.artist,m.title);if(art){setArt(art);notify(m.title,m.artist,art)}}
    async function workerFallback(){try{const d=await getJSON(API+'radio/metadata?radio_id='+encodeURIComponent(rid())+'&_='+Date.now());applyMeta(d)}catch{}}
    async function bootRadioMeta(){
      workerFallback();
      let metaUrl='';
      try{const list=await getJSON(API+'radios?_='+Date.now());const radio=Array.isArray(list)?list.find(x=>String(x.id)===String(rid())):null;metaUrl=String(radio?.metadata_url||radio?.meta_url||'')}catch{}
      if(!metaUrl&&rid()==='beat-digital')metaUrl='https://api.zeno.fm/mounts/metadata/subscribe/9s7nnwmknkhvv';
      if(metaUrl&&window.EventSource){try{es?.close();es=new EventSource(metaUrl);es.onmessage=e=>{try{applyMeta(JSON.parse(e.data||'{}'))}catch{}};es.onerror=()=>workerFallback()}catch{}}
      clearInterval(fallbackTimer);fallbackTimer=setInterval(workerFallback,12000);
    }
    const start=()=>setTimeout(bootRadioMeta,350);
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
    window.addEventListener('beforeunload',()=>{try{es?.close()}catch{};clearInterval(fallbackTimer)});
  }
})();