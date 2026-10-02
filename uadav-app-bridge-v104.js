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

  // V10.5.6 · Radio: metadata visible inmediatamente + carátula Deezer en segundo paso.
  if((document.querySelector('meta[name="site-page"]')?.content||'')==='radio'){
    const API='https://uadav-api.uadavstream.workers.dev/api/';
    let lastKey='',timer=0;
    const css=document.createElement('style');
    css.textContent='@media(max-width:700px){body.radio-playing .now,body .now{background:linear-gradient(180deg,#21171b 0%,#100d12 60%,#07090d 100%)!important;border:0!important;box-shadow:none!important}body.radio-playing .now-art{width:min(84vw,390px)!important;border-radius:16px!important}body.radio-playing .now-main{text-align:left!important;padding:8px 4px!important}body.radio-playing .now-label{opacity:.72}body.radio-playing .now-title{font-size:27px!important;line-height:1.08!important}body.radio-playing .now-artist{font-size:15px!important;margin-top:7px!important}.radio-tabs{scrollbar-width:none}.radio-tabs::-webkit-scrollbar{display:none}}';
    document.head.appendChild(css);
    async function getJSON(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
    function radioId(){const qs=new URLSearchParams(location.search);const q=qs.get('id');if(q)return q;return 'beat-digital'}
    function stationFallback(){return document.querySelector('.side-logo')?.src||document.querySelector('#nowArt')?.src||'/radio-fallback.svg'}
    function setText(title,artist){const t=document.getElementById('nowTitle'),a=document.getElementById('nowArtist');if(t)t.textContent=title||'Radio en vivo';if(a)a.textContent=artist||'BEAT DIGITAL RADIO'}
    function setArt(art){if(!art)return;const img=document.getElementById('nowArt');if(img){img.onerror=()=>{img.onerror=null;img.src=stationFallback()};img.src=art}}
    function notify(title,artist,art){try{window.parent.postMessage({type:'uadav:radio-meta',radio_id:radioId(),title,artist,artwork:art||stationFallback()},location.origin)}catch{}}
    async function poll(){
      try{
        const rid=radioId();
        const d=await getJSON(API+'radio/metadata?radio_id='+encodeURIComponent(rid)+'&_='+Date.now());
        const m=d?.data||d||{};
        let artist=String(m.artist||'').trim(),title=String(m.title||'').trim(),streamTitle=String(m.streamTitle||'').trim();
        if((!artist||!title)&&streamTitle.includes(' - ')){const p=streamTitle.split(' - ');if(!artist)artist=p.shift().trim();if(!title)title=p.join(' - ').trim()}
        if(!title)title=streamTitle||'Radio en vivo';
        setText(title,artist); // No esperar a Deezer para mostrar tema/artista.
        const key=(artist+'|'+title).toLowerCase();
        if(key!==lastKey){
          lastKey=key;
          notify(title,artist,stationFallback());
          try{
            const cover=await getJSON(API+'radio/cover?artist='+encodeURIComponent(artist)+'&title='+encodeURIComponent(title)+'&fallback='+encodeURIComponent(stationFallback())+'&_='+Date.now());
            const art=cover?.artwork||cover?.cover||cover?.image||stationFallback();
            setArt(art);notify(title,artist,art);
          }catch{notify(title,artist,stationFallback())}
        }
      }catch(e){console.warn('[UADAV Radio metadata]',e)}
    }
    const boot=()=>{clearInterval(timer);poll();timer=setInterval(poll,12000)};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300));else setTimeout(boot,300);
  }
})();