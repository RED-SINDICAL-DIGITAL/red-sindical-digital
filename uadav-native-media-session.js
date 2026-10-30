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
function createYouTubeAdapter(player){
 const listeners=new Map();let state=-1;
 const emit=type=>{for(const fn of listeners.get(type)||[])fn()};
 return {player,
  get paused(){return state!==1},get ended(){return state===0},get error(){return false},
  get duration(){return Number(player.getDuration?.())||0},
  get currentTime(){return Number(player.getCurrentTime?.())||0},
  set currentTime(value){player.seekTo?.(value,true)},
  get playbackRate(){return Number(player.getPlaybackRate?.())||1},
  play(){player.playVideo?.()},pause(){player.pauseVideo?.()},
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn)},
  removeEventListener(type,fn){listeners.get(type)?.delete(fn)},
  update(value){state=Number(value);emit(state===1?'play':state===0?'ended':'pause')}
 };
}
if(typeof module==='object'&&module.exports)module.exports={createController,createYouTubeAdapter};
if(!root.document||!root.navigator?.mediaSession)return;
const doc=root.document,controller=createController(root.navigator.mediaSession,root.MediaMetadata);
let embedded=null;
root.UADAVMediaSession={
 youtube(player,state){
  if(!player)return;
  // Only actual playback takes ownership; ready/loading never interrupts radio.
  if(embedded?.player!==player){if(Number(state)!==1)return;embedded=createYouTubeAdapter(player)}
  embedded.update(state);
  if(Number(state)===1)controller.attach(embedded,{info:()=>({title:doc.getElementById('mediaTitle')?.textContent,artist:doc.getElementById('mediaMeta')?.textContent}),stop:()=>root.UADAVShellHost?.closeContent?.()});
  else if(controller.element===embedded)controller.sync();
 },
 release(player){if(embedded?.player!==player)return;if(controller.element===embedded)controller.clear();embedded=null}
};

root.addEventListener('message',event=>{
 if(!embedded||controller.element!==embedded||!['https://www.youtube.com','https://www.youtube-nocookie.com'].includes(event.origin))return;
 const frame=doc.getElementById('mediaStage')?.querySelector('iframe');if(!frame||event.source!==frame.contentWindow)return;
 let data=event.data;try{if(typeof data==='string')data=JSON.parse(data)}catch{return}
 if(data?.event==='infoDelivery')controller.sync();
});
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
  if(el.player){if(!doc.getElementById('mediaStage')?.querySelector('iframe')){controller.clear();embedded=null}else controller.sync()}
  else if(!el.isConnected||!el.getAttribute('src'))controller.clear();
  else controller.sync();
});
for(const id of ['mediaStage','radioAudio','radioName','radioMeta','mediaTitle','mediaMeta']){
  const el=doc.getElementById(id);if(el)observer.observe(el,{childList:true,subtree:true,attributes:id==='radioAudio',attributeFilter:id==='radioAudio'?['src']:undefined});
}
})(typeof window==='object'?window:globalThis);
