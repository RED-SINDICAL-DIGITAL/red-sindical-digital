import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../contratar-artista.html',import.meta.url),'utf8');
const guard=source.slice(source.indexOf('let artistReady='),source.indexOf("document.getElementById('f').prepend"));
assert(guard.includes('async function verifyBookingArtist'));
function client(result,id='ART-QA'){
 const fields=[{disabled:false},{disabled:false}],nodes={status:{},retryArtist:{},f:{querySelectorAll:()=>fields}},heading={};let calls=0;
 const ctx={artist:id,document:{getElementById:k=>nodes[k],querySelector:()=>heading},AbortController,setTimeout,clearTimeout,encodeURIComponent,apiFetch:async(path,opt)=>{calls++;assert.equal(path,'public/artista?id='+encodeURIComponent(id));assert(opt.signal);if(result instanceof Error)throw result;return result}};
 vm.createContext(ctx);vm.runInContext(guard,ctx);return {ctx,fields,nodes,heading,get calls(){return calls}};
}
test('visible FREE artist enables consultation without PRO and escapes name through textContent',async()=>{
 const x=client({id:'ART-QA',nombre:'<Artista>',visible:true,marketplace_enabled:true,pro_active:false});
 assert.equal(await x.ctx.verifyBookingArtist(),true);assert(x.fields.every(f=>!f.disabled));assert.equal(x.heading.textContent,'Consultar a <Artista>');assert.equal(x.nodes.retryArtist.hidden,true);
});
for(const [label,result] of [['hidden',{id:'ART-QA',visible:false}],['disabled booking',{id:'ART-QA',marketplace_enabled:false}],['malformed',{}],['not found',Object.assign(Error('404'),{status:404})],['network failure',Error('offline')]]){
 test(label+' keeps personal fields and submission disabled',async()=>{const x=client(result);assert.equal(await x.ctx.verifyBookingArtist(),false);assert(x.fields.every(f=>f.disabled));assert.equal(x.nodes.retryArtist.hidden,false);assert(x.nodes.status.textContent)});
}
test('missing artist never requests API and cannot enable fields',async()=>{const x=client({},'');assert.equal(await x.ctx.verifyBookingArtist(),false);assert.equal(x.calls,0);assert(x.fields.every(f=>f.disabled))});
test('availability retry can recover after a transient error',async()=>{const x=client(Error('offline'));await x.ctx.verifyBookingArtist();x.ctx.apiFetch=async()=>({id:'ART-QA',visible:true});assert.equal(await x.ctx.verifyBookingArtist(),true);assert(x.fields.every(f=>!f.disabled))});
