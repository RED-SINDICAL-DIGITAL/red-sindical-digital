import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const app=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8');
const radio=fs.readFileSync(new URL('../radio.html',import.meta.url),'utf8');
const volume=app.slice(app.indexOf('try{const saved='),app.indexOf('window.UADAVShellHost='));
for(const [saved,expected] of [[null,.85],['',.85],['0',0],['0.4',.4],['oops',.85]]){
 const ra={};const control={};vm.runInNewContext(volume,{ra,localStorage:{getItem:()=>saved},$:()=>control});assert.equal(ra.volume,expected);assert.equal(Number(control.value),expected);
}
const play=app.slice(app.indexOf('function playRadio('),app.indexOf("$('favMedia')?.addEventListener"));
let closed=0,emitted=0;const nodes=new Map();const $=id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id)};
const ra={muted:true,play:()=>Promise.resolve()};const c=vm.createContext({ra,$,rd:{classList:{add(){}}},closeContent:()=>closed++,emitRadioState:()=>emitted++,toast(){}});
vm.runInContext(play,c);assert.equal(c.playRadio({id:'test',stream_url:'https://stream.example/radio',nombre:'Radio real'}),true);await Promise.resolve();assert.equal(ra.src,'https://stream.example/radio');assert.equal(ra.muted,false);assert.equal(closed,1);assert.equal(emitted,1);
assert.equal(c.playRadio({nombre:'Sin señal'}),false);
// Exercise the actual hub handlers: open must not call the former undefined shellNavigate.
const hub=radio.slice(radio.indexOf('function renderRadioHub('),radio.indexOf('\nasync function load()'));
const link={dataset:{radioId:'test'}},button={dataset:{radioPlay:'test'},getAttribute:()=>null,setAttribute(){}};
const controls=new Map();const node=id=>{if(!controls.has(id))controls.set(id,{});return controls.get(id)};const messages=[];let opened='';
const window={parent:{},addEventListener(){}};const ctx=vm.createContext({window,document:{getElementById:node},app:{innerHTML:'',querySelectorAll:s=>s==='[data-radio-id]'?[link]:s==='[data-radio-play]'?[button]:[]},esc:String,FALLBACK_ART:'/fallback.svg',openRadio:id=>opened=id,postShell:p=>messages.push(p)});
vm.runInContext(hub,ctx);ctx.renderRadioHub([{id:'test',nombre:'Radio real',stream_url:'https://stream.example/radio'}]);link.onclick({preventDefault(){}});assert.equal(opened,'test');button.onclick();assert.equal(messages.at(-1).type,'uadav:radio-play');assert.equal(messages.at(-1).radio.stream_url,'https://stream.example/radio');
console.log('PASS: audible default volume, explicit saved mute, shell playback, real hub open/play handlers');
