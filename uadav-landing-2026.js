(function(){'use strict';document.addEventListener('click',event=>{const link=event.target.closest('a[data-enter]');if(link)window.UADAVFirstVisit?.markEntry()});window.addEventListener('beforeinstallprompt',event=>event.preventDefault());
const base=window.PLATFORM_API_BASE||window.UADAV_API_BASE;const reveal=()=>document.documentElement.classList.remove('hero-loading');if(!base){reveal();return;}const destinations={'index-v117':'discover',artistas:'artists','para-artistas':'artists','en-vivo':'live',radio:'radios',cartelera:'cartelera','bolsa-trabajo':'jobs',usuario:'profile',buscar:'search','peliculas-series':'media',podcasts:'podcasts'};
const blocks={discover:'discover',creators:'artists',work:'jobs'};
let visibility={};
function applyVisibility(){
  for(const block of document.querySelectorAll('[data-landing-block]')){
    block.toggleAttribute('data-nav-off',visibility[blocks[block.dataset.landingBlock]]===false);
  }
  for(const link of document.querySelectorAll('a[href]')){
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin)continue;
    const target=url.pathname==='/app.html'?new URL(url.searchParams.get('view')||'/index-v117.html',location.origin):url;
    const key=destinations[target.pathname.split('/').pop().replace(/\.html$/,'')];
    const anchor=url.hash&&document.getElementById(url.hash.slice(1));
    const entry=link.matches('[data-landing-link="header_4_url"],[data-landing-link="hero_4_url"],[data-landing-link="devices_5_url"],[data-landing-link="footer_5_url"]')&&key==='discover';
    link.toggleAttribute('data-nav-off',(!entry&&visibility[key]===false)||!!(anchor&&(anchor.hidden||anchor.hasAttribute('data-nav-off'))));
  }
}
async function refreshVisibility(){
  try{
    const response=await fetch(base+'web_visibility',{cache:'no-store'});
    if(response.ok){const data=await response.json();visibility=data.data||data;applyVisibility()}
  }catch{}
}
refreshVisibility();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshVisibility()});
const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),4000);fetch(base+'landing_config',{cache:'no-store',signal:ctl.signal}).then(r=>r.ok?r.json():{}).then(raw=>{const config=raw?.data||raw||{};if(window.UADAVLandingContent){window.UADAVLandingContent.apply(config,document);return;}const title=document.getElementById('landingTitle'),description=document.getElementById('landingDescription');if(config.promo_title&&title)title.textContent=String(config.promo_title).slice(0,180);if(config.promo_description&&description)description.textContent=String(config.promo_description).slice(0,320);if(config.promo_image){try{const u=new URL(config.promo_image);if(u.protocol==='https:'&&!u.username&&!u.password)document.getElementById('landingArtwork').style.backgroundImage='linear-gradient(90deg,#071019e8,#07101966 60%,transparent),linear-gradient(0deg,#071019,transparent 45%),url("'+u.href.replace(/["\\\n\r]/g,'')+'")'}catch{}}}).catch(()=>{}).finally(()=>{clearTimeout(timer);applyVisibility();reveal()});})();
