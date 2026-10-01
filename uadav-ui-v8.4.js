(()=>{
  'use strict';
  const TV_SELECTOR='a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const isVisible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>1&&r.height>1&&!el.closest('[hidden],.visibility-off')};
  function enhanceRail(el){
    if(!el||el.dataset.u84Enhanced)return;el.dataset.u84Enhanced='1';
    let down=false,startX=0,left=0,moved=false;
    el.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,a,input,select,textarea'))return;down=true;moved=false;startX=e.clientX;left=el.scrollLeft;el.setPointerCapture?.(e.pointerId);el.classList.add('u84-dragging')});
    el.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-startX;if(Math.abs(dx)>4)moved=true;el.scrollLeft=left-dx});
    const end=()=>{down=false;el.classList.remove('u84-dragging')};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('pointerleave',()=>{if(down)end()});
    el.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)&&el.scrollWidth>el.clientWidth){e.preventDefault();el.scrollBy({left:e.deltaY*1.15,behavior:'auto'})}},{passive:false});
    el.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);
  }
  function tvEnabled(){return new URLSearchParams(location.search).get('tv')==='1'||document.body.classList.contains('uadav-tv-mode')||document.body.classList.contains('tv-mode')}
  function tvItems(){return [...document.querySelectorAll(TV_SELECTOR)].filter(isVisible)}
  function center(el){const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,r}}
  function moveFocus(key){
    const items=tvItems();if(!items.length)return false;
    const active=document.activeElement;
    if(!items.includes(active)){items[0].focus({preventScroll:true});items[0].scrollIntoView({block:'nearest',inline:'nearest'});return true}
    const a=center(active),dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[key];if(!dir)return false;
    let best=null,bestScore=Infinity;
    for(const el of items){if(el===active)continue;const b=center(el),dx=b.x-a.x,dy=b.y-a.y,primary=dir[0]?dx*dir[0]:dy*dir[1];if(primary<=4)continue;const cross=Math.abs(dir[0]?dy:dx);const score=primary+cross*2.15;if(score<bestScore){bestScore=score;best=el}}
    if(!best)return false;best.focus({preventScroll:true});best.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});return true;
  }
  function tvKeys(e){
    if(!tvEnabled()||!/^Arrow(Left|Right|Up|Down)$/.test(e.key))return;
    const tag=(e.target?.tagName||'').toLowerCase(),type=String(e.target?.type||'').toLowerCase();
    if(tag==='textarea'||tag==='select'||(tag==='input'&&!['button','submit','reset','checkbox','radio'].includes(type)))return;
    if(moveFocus(e.key)){e.preventDefault();e.stopPropagation()}
  }
  function boot(){
    document.querySelectorAll('.rail,.premium-rail,.artist-profile-rail').forEach(enhanceRail);
    const obs=new MutationObserver(()=>document.querySelectorAll('.rail,.premium-rail,.artist-profile-rail').forEach(enhanceRail));obs.observe(document.body,{childList:true,subtree:true});
    if(new URLSearchParams(location.search).get('tv')==='1')document.body.classList.add('uadav-tv-mode');
    document.addEventListener('keydown',tvKeys,true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.uadavEnhanceRails=()=>document.querySelectorAll('.rail,.premium-rail,.artist-profile-rail').forEach(enhanceRail);
})();
