const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createController}=require('../uadav-native-media-session.js');
class Media extends EventTarget {
 constructor(){super();this.paused=true;this.duration=100;this.currentTime=20;this.playbackRate=1}
 play(){this.paused=false;this.dispatchEvent(new Event('play'));return Promise.resolve()}
 pause(){this.paused=true;this.dispatchEvent(new Event('pause'))}
}
function setup(){const handlers={};const session={setActionHandler:(k,v)=>handlers[k]=v,setPositionState(v){this.position=v}};
 return {session,handlers,controller:createController(session,class {constructor(v){Object.assign(this,v)}})}}
test('native audio reports actual state and handles system play/pause',async()=>{
 const {session,handlers,controller}=setup(),el=new Media();
 controller.attach(el,{info:()=>({title:'Programa',artist:'Emisora'})});
 assert.equal(session.playbackState,'paused');await handlers.play();assert.equal(session.playbackState,'playing');
 assert.equal(session.metadata.title,'Programa');handlers.pause();assert.equal(el.paused,true);
});
test('recorded media seeks within bounds; live radio does not expose seeking',()=>{
 const {session,handlers,controller}=setup(),el=new Media();
 controller.attach(el);handlers.seekto({seekTime:150});assert.equal(el.currentTime,100);
 handlers.seekbackward({seekOffset:200});assert.equal(el.currentTime,0);
 controller.attach(new Media(),{live:true});assert.equal(handlers.seekto,null);assert.equal(session.position,undefined);
});
test('switching or closing removes stale controls and event listeners',()=>{
 const {session,handlers,controller}=setup(),old=new Media(),next=new Media();
 controller.attach(old);controller.attach(next,{info:()=>({title:'Nuevo'})});old.play();
 assert.equal(session.playbackState,'paused');assert.equal(session.metadata.title,'Nuevo');
 controller.clear();next.play();assert.equal(session.playbackState,'none');assert.equal(session.metadata,null);
 assert.ok(Object.values(handlers).every(v=>v===null));
});
test('stop closes active player; unsupported actions and absent APIs are tolerated',()=>{
 const {session,handlers,controller}=setup();let stopped=0;
 controller.attach(new Media(),{stop:()=>stopped++});handlers.stop();
 assert.equal(stopped,1);assert.equal(controller.element,null);
 const minimal=createController({setActionHandler(){throw Error('unsupported')}},null);
 assert.doesNotThrow(()=>minimal.attach(new Media()));assert.doesNotThrow(()=>minimal.clear());
});

test('official embedded media supports system controls, tracks observed state and releases old listeners',()=>{
 const {createYouTubeAdapter}=require('../uadav-native-media-session.js');
 const {controller,session,handlers}=setup();let plays=0,pauses=0,seek;
 const player={getDuration:()=>200,getCurrentTime:()=>30,getPlaybackRate:()=>1,playVideo(){plays++},pauseVideo(){pauses++},seekTo(t){seek=t}};
 const adapter=createYouTubeAdapter(player);adapter.update(1);controller.attach(adapter,{info:()=>({title:'Video'})});
 assert.equal(session.playbackState,'playing');handlers.pause();assert.equal(pauses,1);
 // Commands alone cannot claim a state change or force a paused video to resume.
 assert.equal(session.playbackState,'playing');adapter.update(2);assert.equal(session.playbackState,'paused');
 handlers.play();assert.equal(plays,1);assert.equal(session.playbackState,'paused');adapter.update(1);assert.equal(session.playbackState,'playing');
 handlers.seekto({seekTime:250});assert.equal(seek,200);
 controller.clear();adapter.update(1);assert.equal(session.playbackState,'none');
});
test('navigation and minimization preserve the existing player and never pause on page visibility',()=>{
 const fs=require('node:fs'),html=fs.readFileSync('app.html','utf8');
 const nav=html.slice(html.indexOf('function nav('),html.indexOf('function yid('));
 const mode=html.slice(html.indexOf('function setMediaMode('),html.indexOf('let toastTimer'));
 for(const body of [nav,mode])assert.doesNotMatch(body,/stage\.replaceChildren|pauseVideo|stopVideo|closeContent\(/);
 const source=fs.readFileSync('uadav-native-media-session.js','utf8');assert.doesNotMatch(source,/visibilitychange|document.hidden|setInterval/);
});
