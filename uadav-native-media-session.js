/* Native media controls only; embedded providers retain their official players. */
(function(root){
'use strict';
function createController(session, Metadata){
  let active=null, listeners=[];
  const actions=['play','pause','stop','seekto','seekbackward','seekforward'];
  const handle=(name,fn)=>{try{session.setActionHandler(name,fn)}catch{}};
  function clear(){
    listeners.forEach(([el,type,fn])=>el.removeEventListener(type,fn));listeners=[];
    active=null;actions.forEach(a=>handle(a,null));
    try{session.metadata=null;session.playbackState='none';session.setPositionState?.()}catch{}
  }
  function position(){
    if(!active)return;
    const el=active.element, duration=el.duration;
    try{if(!active.live&&Number.isFinite(duration)&&duration>0)
      session.setPositionState?.({duration,playbackRate:el.playbackRate||1,position:Math.max(0,Math.min(duration,el.currentTime||0))});
    else session.setPositionState?.()}catch{}
  }
  function metadata(){
    if(!active)return;
    const info=active.info()||{};
    try{if(Metadata)session.metadata=new Metadata({title:info.title||'UADAV STREAM',artist:info.artist||'',album:'UADAV STREAM'})}catch{}
  }
  function sync(){
    if(!active)return;
    try{session.playbackState=active.element.paused||active.element.ended||active.element.error?'paused':'playing'}catch{}
    metadata();position();
    const el=active.element, seekable=!active.live&&Number.isFinite(el.duration)&&el.duration>0;
    const seek=value=>{if(Number.isFinite(value))el.currentTime=Math.max(0,Math.min(el.duration,value));position()};
    handle('seekto',seekable?d=>seek(d.seekTime):null);
    handle('seekbackward',seekable?d=>seek(el.currentTime-(d.seekOffset||10)):null);
    handle('seekforward',seekable?d=>seek(el.currentTime+(d.seekOffset||10)):null);
  }
  function attach(element,options={}){
    if(active?.element===element){sync();return}
    clear();active={element,live:!!options.live,info:options.info||(()=>({}))};
    for(const type of ['play','pause','ended','error','loadedmetadata','durationchange','timeupdate','ratechange']){
      element.addEventListener(type,sync);listeners.push([element,type,sync]);
    }
    handle('play',()=>{try{Promise.resolve(options.resume?options.resume():element.play()).catch(sync)}catch{sync()}});
    handle('pause',()=>element.pause());
    handle('stop',()=>{element.pause();options.stop?.();clear()});
    sync();
  }
  return {attach,clear,sync,get element(){return active?.element||null}};
}
if(typeof module==='object'&&module.exports)module.exports={createController};
if(!root.document||!root.navigator?.mediaSession)return;
const doc=root.document,controller=createController(root.navigator.mediaSession,root.MediaMetadata);
function relevant(el){return el?.matches?.('#radioAudio, #mediaStage audio, #mediaStage video')}
doc.addEventListener('play',event=>{
  const el=event.target;if(!relevant(el))return;
  const radio=el.id==='radioAudio';
  controller.attach(el,{
    live:radio,
    info:()=>({title:doc.getElementById(radio?'radioName':'mediaTitle')?.textContent,
      artist:doc.getElementById(radio?'radioMeta':'mediaMeta')?.textContent}),
    resume:radio?()=>{if(el.paused||el.error||el.ended)doc.getElementById('radioPlay')?.click()}:undefined,
    stop:()=>root.UADAVShellHost?.[radio?'closeRadio':'closeContent']?.()
  });
},true);
const observer=new MutationObserver(()=>{
  const el=controller.element;
  if(!el)return;
  if(!el.isConnected||!el.getAttribute('src'))controller.clear();
  else controller.sync();
});
for(const id of ['mediaStage','radioAudio','radioName','radioMeta','mediaTitle','mediaMeta']){
  const el=doc.getElementById(id);if(el)observer.observe(el,{childList:true,subtree:true,attributes:id==='radioAudio',attributeFilter:id==='radioAudio'?['src']:undefined});
}
})(typeof window==='object'?window:globalThis);
