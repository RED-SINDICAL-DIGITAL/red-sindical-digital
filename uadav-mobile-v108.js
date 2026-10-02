(()=>{
'use strict';
let P=window,D=document,shell,mediaDock,mediaCard,radioDock,radioExpand,historyDock;
try{shell=D.getElementById('shell');mediaDock=D.getElementById('mediaDock');mediaCard=D.getElementById('mediaCard');radioDock=D.getElementById('radioDock');radioExpand=D.getElementById('radioExpand');historyDock=D.getElementById('historyDock')}catch{return}
if(!shell||D.getElementById('uadav-mobile-v108-style'))return;
const css=D.createElement('style');css.id='uadav-mobile-v108-style';css.textContent=`
@media(max-width:720px){
:root{--uadav-nav-h:64px;--uadav-mini-h:66px}
#viewWrap{margin-bottom:var(--uadav-nav-h)!important}
#mobileNav{z-index:1500!important}
#radioDock{left:8px!important;right:8px!important;bottom:calc(var(--uadav-nav-h) + 8px + env(safe-area-inset-bottom))!important;transform:none!important;width:auto!important;height:var(--uadav-mini-h)!important;min-height:var(--uadav-mini-h)!important;padding:7px 9px!important;border-radius:14px!important;background:rgba(10,14,20,.96)!important;border:1px solid #ffffff1c!important;box-shadow:0 10px 35px #000b!important;backdrop-filter:blur(24px)!important}
#radioDock.active{display:flex!important;align-items:center!important}
#radioDock .radio-left{min-width:0!important;flex:1!important;cursor:pointer!important}
#radioArt{width:50px!important;height:50px!important;border-radius:9px!important}
#radioInfo{min-width:0!important;flex:1!important}
#radioName{font-size:13px!important;line-height:1.15!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#radioMeta{font-size:10px!important;margin-top:4px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#radioDock .radio-center{flex:none!important;gap:4px!important}
#radioHistory{display:none!important}
#radioPlay{width:42px!important;height:42px!important}
#radioDock .radio-controls,#radioDiscover{display:none!important}
#radioExpand{z-index:1600!important;padding:42px 18px calc(82px + env(safe-area-inset-bottom))!important;background:radial-gradient(circle at 50% 22%,rgba(25,216,242,.17),transparent 35%),linear-gradient(180deg,#111a25 0%,#070a0f 68%)!important;overflow:auto!important}
#radioExpand.active{display:flex!important;align-items:flex-start!important}
.radio-expanded-inner{display:flex!important;flex-direction:column!important;width:100%!important;max-width:520px!important;gap:16px!important;text-align:left!important;margin:auto!important}
.radio-expanded-cover{width:min(76vw,340px)!important;align-self:center!important;border-radius:18px!important;box-shadow:0 28px 75px #000b!important}
.radio-expanded-copy{width:100%!important}
.radio-expanded-copy h2{font-size:28px!important;line-height:1.04!important;margin:0 0 7px!important;letter-spacing:-.035em!important}
.radio-expanded-copy p{font-size:15px!important;margin:0 0 22px!important}
.radio-expanded-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:9px!important}
.radio-expanded-actions .primary{grid-column:1/-1!important;min-height:54px!important;font-size:15px!important}
.radio-expanded-actions button{min-height:48px!important;padding:10px 12px!important}
.radio-expanded-close{top:12px!important;right:12px!important;width:42px!important;height:42px!important;z-index:2!important}
#historyDock{z-index:1700!important;left:0!important;right:0!important;bottom:0!important;transform:none!important;width:100%!important;max-height:78dvh!important;border-radius:24px 24px 0 0!important;padding:18px 14px calc(22px + env(safe-area-inset-bottom))!important;background:#090d13fc!important}
#historyDock .history-list{grid-template-columns:1fr!important;gap:7px!important}
#historyDock .history-item{min-height:62px!important;border-radius:12px!important;padding:8px 10px!important;display:grid!important;grid-template-columns:48px minmax(0,1fr)!important;grid-template-rows:auto auto!important;column-gap:12px!important;align-items:center!important}
#historyDock .history-item img{width:48px!important;height:48px!important;grid-row:1/3!important;border-radius:9px!important}
#historyDock .history-item strong,#historyDock .history-item b{display:block!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;line-height:1.15!important}
#historyDock .history-item span,#historyDock .history-item small{display:block!important;min-width:0!important;color:#929db1!important;font-size:12px!important;line-height:1.2!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
#historyDock .history-close{width:40px!important;height:40px!important;border-radius:50%!important;background:#111827!important;color:#fff!important;border:1px solid #ffffff20!important}
#shell.media-expanded #mediaDock{z-index:1600!important;inset:0!important;padding:max(54px,env(safe-area-inset-top)) 0 calc(18px + env(safe-area-inset-bottom))!important;background:linear-gradient(180deg,#071019 0%,#05080d 72%)!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;overflow:auto!important}
#shell.media-expanded #mediaCard{width:100%!important;max-height:none!important;min-height:0!important;border:0!important;border-radius:0!important;background:transparent!important;padding:0!important;display:flex!important;flex-direction:column!important}
#shell.media-expanded #mediaStage{width:100%!important;height:auto!important;max-height:min(56dvh,430px)!important;aspect-ratio:16/9!important;flex:none!important;background:#000!important}
#shell.media-expanded #mediaCopy{padding:18px 18px 22px!important;border:0!important;background:linear-gradient(180deg,#081019,#05080d)!important;min-height:0!important}
#shell.media-expanded #mediaTitle{display:block!important;font-size:20px!important;line-height:1.18!important;letter-spacing:-.02em!important}
#shell.media-expanded #mediaMeta{font-size:12px!important;line-height:1.35!important;margin-top:7px!important;color:#9aa6ba!important}
#shell.media-expanded .media-tools{top:max(8px,env(safe-area-inset-top))!important;right:8px!important}
#shell.media-expanded .media-tools button{width:40px!important;height:40px!important;background:#111827e8!important}
#shell.media-mini #mediaDock{z-index:1450!important;left:8px!important;right:8px!important;bottom:calc(var(--uadav-nav-h) + 8px + env(safe-area-inset-bottom))!important;width:auto!important}
#shell.media-mini #mediaCard{height:var(--uadav-mini-h)!important;display:grid!important;grid-template-columns:92px minmax(0,1fr)!important;grid-template-rows:1fr!important;border-radius:14px!important;background:#0a0e14f7!important;border:1px solid #ffffff1c!important;overflow:hidden!important}
#shell.media-mini #mediaStage{grid-column:1!important;grid-row:1!important;width:92px!important;height:var(--uadav-mini-h)!important;aspect-ratio:auto!important;pointer-events:none!important}
#shell.media-mini #mediaCopy{grid-column:2!important;grid-row:1!important;min-width:0!important;padding:10px 82px 8px 12px!important;border:0!important;display:flex!important;flex-direction:column!important;justify-content:center!important}
#shell.media-mini #mediaTitle{font-size:12px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#shell.media-mini #mediaMeta{font-size:9px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#shell.media-mini .media-tools{top:12px!important;right:8px!important;gap:4px!important}
#shell.media-mini .media-tools button{width:34px!important;height:34px!important;font-size:14px!important}
body.uadav-mobile-player-open{overflow:hidden!important}
}
`;D.head.appendChild(css);
function mobile(){return P.innerWidth<=720}
function sync(){if(!mobile())return;const mini=shell.classList.contains('media-mini'),expanded=shell.classList.contains('media-expanded');D.body.classList.toggle('uadav-mobile-player-open',expanded||radioExpand?.classList.contains('active'));const b=D.getElementById('mediaExpand');if(b){b.textContent=mini?'⌃':'⌄';b.title=mini?'Abrir reproductor':'Minimizar reproductor';b.setAttribute('aria-label',b.title)}}
function minimizeVideo(){if(!mobile()||!shell.classList.contains('media-expanded'))return;shell.classList.remove('media-expanded');shell.classList.add('media-mini');sync()}
function expandVideo(){if(!mobile()||!shell.classList.contains('media-mini'))return;shell.classList.remove('media-mini');shell.classList.add('media-expanded');sync()}
if(mediaDock){mediaDock.addEventListener('click',e=>{if(!mobile()||!shell.classList.contains('media-mini'))return;if(e.target.closest('.media-tools'))return;expandVideo()});let vsy=0,vcy=0,vdrag=false;mediaDock.addEventListener('touchstart',e=>{if(!mobile()||!shell.classList.contains('media-expanded')||e.touches.length!==1||e.target.closest('iframe,video'))return;vsy=vcy=e.touches[0].clientY;vdrag=true},{passive:true});mediaDock.addEventListener('touchmove',e=>{if(!vdrag||!e.touches.length)return;vcy=e.touches[0].clientY},{passive:true});mediaDock.addEventListener('touchend',()=>{if(!vdrag)return;vdrag=false;if(vcy-vsy>64)minimizeVideo()},{passive:true})}
const expandBtn=D.getElementById('mediaExpand');if(expandBtn)expandBtn.addEventListener('click',()=>setTimeout(sync,0));
if(radioDock){radioDock.addEventListener('click',e=>{if(!mobile()||e.target.closest('button,input'))return;if(radioExpand){radioExpand.classList.add('active');sync()}})}
const radioPlay=D.getElementById('radioPlay');if(radioPlay)radioPlay.addEventListener('click',()=>{if(!mobile())return;setTimeout(()=>{if(!radioExpand?.classList.contains('active')){radioExpand?.classList.add('active');sync()}},80)});
if(radioExpand){let sy=0,cy=0,drag=false;const minimizeRadio=()=>{radioExpand.classList.remove('active');historyDock?.classList.remove('active');sync()};const close=D.getElementById('radioExpandClose');if(close){close.title='Minimizar';close.setAttribute('aria-label','Minimizar reproductor');close.addEventListener('click',()=>setTimeout(minimizeRadio,0))}radioExpand.addEventListener('touchstart',e=>{if(!mobile()||!radioExpand.classList.contains('active')||e.touches.length!==1)return;sy=cy=e.touches[0].clientY;drag=true},{passive:true});radioExpand.addEventListener('touchmove',e=>{if(!drag||!e.touches.length)return;cy=e.touches[0].clientY},{passive:true});radioExpand.addEventListener('touchend',()=>{if(!drag)return;drag=false;if(cy-sy>72)minimizeRadio()},{passive:true});new MutationObserver(sync).observe(radioExpand,{attributes:true,attributeFilter:['class']})}
function enhanceEmbeddedSearch(){
 const view=D.getElementById('view');if(!view)return;
 const apply=()=>{try{
  const doc=view.contentDocument,win=view.contentWindow;if(!doc||!doc.head||doc.getElementById('uadav-search-mode-style'))return;
  const s=doc.createElement('style');s.id='uadav-search-mode-style';s.textContent='@media(max-width:767px){html.uadav-search-mode header+section{display:none!important}html.uadav-search-mode header.sticky>nav{display:none!important}html.uadav-search-mode body>section:not(#gridViewSection),html.uadav-search-mode main>section:not(#gridViewSection){display:none!important}html.uadav-search-mode header.sticky>div:first-child{height:58px!important;border-bottom:1px solid rgba(255,255,255,.07)!important}html.uadav-search-mode #gridViewSection{padding:12px 12px 92px!important;min-height:calc(100dvh - 58px)!important}html.uadav-search-mode #gridViewSection>div:first-child{margin:0 0 14px!important;padding:8px 2px 14px!important;gap:10px!important;align-items:flex-start!important}html.uadav-search-mode #gridTitle{font-size:24px!important;line-height:1.08!important;letter-spacing:-.035em!important;max-width:78%!important;text-transform:none!important}html.uadav-search-mode #gridViewSection button{flex:none!important;padding:8px 11px!important;font-size:0!important;min-width:40px!important;min-height:40px!important;display:grid!important;place-items:center!important}html.uadav-search-mode #gridViewSection button i{font-size:16px!important;margin:0!important}html.uadav-search-mode #gridContainer{gap:12px!important}html.uadav-search-mode #gridContainer>*{border-radius:14px!important}}';doc.head.appendChild(s);
  const grid=doc.getElementById('gridViewSection'),input=doc.getElementById('searchInput');if(!grid)return;
  const syncSearch=()=>{const active=!grid.classList.contains('hidden')&&!!(input?.value||'').trim();doc.documentElement.classList.toggle('uadav-search-mode',active);if(active)requestAnimationFrame(()=>{try{grid.scrollIntoView({block:'start',behavior:'auto'});win.scrollBy(0,-58)}catch{win.scrollTo({top:0,behavior:'auto'})}})};
  new MutationObserver(syncSearch).observe(grid,{attributes:true,attributeFilter:['class']});input?.addEventListener('input',syncSearch,{passive:true});doc.addEventListener('click',()=>setTimeout(syncSearch,40),{passive:true});syncSearch();
 }catch{}};
 view.addEventListener('load',()=>setTimeout(apply,40));apply();
}
new MutationObserver(sync).observe(shell,{attributes:true,attributeFilter:['class']});
P.addEventListener('resize',sync,{passive:true});
enhanceEmbeddedSearch();
sync();
})();