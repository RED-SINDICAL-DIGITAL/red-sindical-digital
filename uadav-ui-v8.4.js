(()=>{
  function enhanceRail(el){
    if(!el||el.dataset.u84Enhanced)return;el.dataset.u84Enhanced='1';
    let down=false,startX=0,left=0,moved=false;
    el.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,a,input,select,textarea'))return;down=true;moved=false;startX=e.clientX;left=el.scrollLeft;el.setPointerCapture?.(e.pointerId);el.classList.add('u84-dragging')});
    el.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-startX;if(Math.abs(dx)>4)moved=true;el.scrollLeft=left-dx});
    const end=()=>{down=false;el.classList.remove('u84-dragging')};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('pointerleave',()=>{if(down)end()});
    el.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)&&el.scrollWidth>el.clientWidth){e.preventDefault();el.scrollBy({left:e.deltaY*1.15,behavior:'auto'})}},{passive:false});
    el.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);
  }
  function boot(){document.querySelectorAll('.rail,.premium-rail,.artist-profile-rail').forEach(enhanceRail);const obs=new MutationObserver(()=>document.querySelectorAll('.rail,.premium-rail,.artist-profile-rail').forEach(enhanceRail));obs.observe(document.body,{childList:true,subtree:true});
    if(new URLSearchParams(location.search).get('tv')==='1')document.body.classList.add('uadav-tv-mode');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.uadavEnhanceRails=()=>document.querySelectorAll('.rail,.premium-rail,.artist-profile-rail').forEach(enhanceRail);
})();
