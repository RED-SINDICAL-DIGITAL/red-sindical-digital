import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../uadav-update-v149.js',import.meta.url),'utf8');
function run(shared=new Map(),blocked=false,build=12059){
 const nodes=new Map(),events={};let reload='';
 const el=tag=>({tag,dataset:{},events:{},append(...children){this.children=(this.children||[]).concat(children);for(const c of children)if(c.id)nodes.set(c.id,c)},setAttribute(){},addEventListener(k,v){this.events[k]=v},remove(){nodes.delete(this.id)}});
 const storage=map=>({getItem(k){if(blocked)throw Error('blocked');return map.get(k)||null},setItem(k,v){if(blocked)throw Error('blocked');map.set(k,v)}});
 const document={body:el('body'),head:el('head'),hidden:false,createElement:el,getElementById:id=>nodes.get(id),addEventListener(k,v){events[k]=v}};
 const window={addEventListener(k,v){events[k]=v}};window.parent=window;
 const context={window,document,localStorage:storage(shared),sessionStorage:storage(new Map()),location:{href:'https://example.invalid/app.html',replace:u=>reload=u},URL,Date,setInterval(){},fetch:async()=>({ok:true,json:async()=>({build})})};
 vm.runInNewContext(source,context);
 return {nodes,events,shared,get reload(){return reload}};
}
const settle=()=>new Promise(r=>setImmediate(r));
test('installed version does not offer itself',async()=>{const x=run(new Map(),false,12058);await settle();assert.equal(x.nodes.size,0)});
test('update attempt suppresses same build in another tab but permits newer build',async()=>{
 const shared=new Map(),a=run(shared);await settle();const box=a.nodes.get('uadav-update-notice');assert(box);
 box.children[2].children[0].events.click();assert.match(a.reload,/uadav_build=12059/);
 const b=run(shared);await settle();assert.equal(b.nodes.size,0);
 const c=run(shared,false,12060);await settle();assert(c.nodes.has('uadav-update-notice'));
});
test('later suppression survives opening another tab',async()=>{
 const shared=new Map(),a=run(shared);await settle();a.nodes.get('uadav-update-notice').children[2].children[1].events.click();
 const b=run(shared);await settle();assert.equal(b.nodes.size,0);
});
test('blocked storage still remembers later within current page',async()=>{
 const a=run(new Map(),true);await settle();a.nodes.get('uadav-update-notice').children[2].children[1].events.click();await a.events.focus();assert.equal(a.nodes.size,0);
});
