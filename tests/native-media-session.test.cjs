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
