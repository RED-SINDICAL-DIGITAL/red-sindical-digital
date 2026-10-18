import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../app.html',import.meta.url),'utf8');
const resume=source.match(/function resumeRadio\(\)\{[\s\S]*?(?=function closeRadio)/)?.[0];
assert(resume);
for(const failed of ['error','ended','paused']){
 test('radio retry '+failed+' preserves original source and paused resume',async()=>{
  let loads=0,plays=0;
  const ra={error:failed==='error'?{code:2}:null,ended:failed==='ended',src:'old',load(){loads++},play(){plays++;return Promise.resolve()}};
  const context={ra,currentRadio:{stream_url:'https://stream.zeno.fm/9s7nnwmknkhvv'}};
  vm.createContext(context);vm.runInContext(resume,context);await context.resumeRadio();
  assert.equal(plays,1);assert.equal(loads,failed==='paused'?0:1);
  if(failed!=='paused')assert.equal(ra.src,context.currentRadio.stream_url);
 });
}
test('radio without selection never starts audio',async()=>{
 const context={ra:{play(){throw Error('unexpected play')}},currentRadio:null};
 vm.createContext(context);vm.runInContext(resume,context);assert.equal(await context.resumeRadio(),false);
});
test('stream error pauses audio and reports a retry state',()=>{
 const body=source.match(/ra.onerror=\(\)=>\{([\s\S]*?)\};ra.onended/)?.[1];assert(body);
 const nodes={radioPlay:{textContent:'❚❚'},radioMeta:{textContent:'En vivo'}};let paused=false,emitted=0;
 vm.runInNewContext(body,{ra:{pause(){paused=true}},$:id=>nodes[id],toast(){},emitRadioState(){emitted++}});
 assert(paused);assert.equal(nodes.radioPlay.textContent,'▶');assert.match(nodes.radioMeta.textContent,/Sin conexión/);assert.equal(emitted,1);
});
test('error and ended audio cannot be reported as playing',()=>{
 assert(source.includes('playing:!!currentRadio&&!ra.paused&&!ra.error&&!ra.ended'));
});

test('radio metadata does not duplicate an artist already included in title',()=>{
 const body=source.slice(source.indexOf('function radioMetadataLabel('),source.indexOf('function clean('));
 const ctx={};vm.createContext(ctx);vm.runInContext(body,ctx);
 for(const title of ['Cyndi Lauper - Girls','CYNDI LAUPER — Girls','Cyndi Lauper – Girls','Cyndi Lauper: Girls','Cyndi Lauper'])assert.equal(ctx.radioMetadataLabel('Cyndi Lauper',title),title);
 assert.equal(ctx.radioMetadataLabel('Cyndi Lauper','Girls'),'Cyndi Lauper — Girls');
 assert.equal(ctx.radioMetadataLabel('','Girls'),'Girls');
 assert.equal(ctx.radioMetadataLabel('Cyndi Lauper',''),'Cyndi Lauper');
 assert.equal(ctx.radioMetadataLabel('Air','Airborne'),'Air — Airborne');
});
test('legacy radios entry preserves station query and hash with local destination',async()=>{
 const html=await readFile(new URL('../radios.html',import.meta.url),'utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 const link={};let destination;vm.runInNewContext(script,{location:{search:'?id=RAD-TEST',hash:'#history',replace:value=>destination=value},document:{getElementById:()=>link}});
 assert.equal(destination,'/radio.html?id=RAD-TEST#history');assert.equal(link.href,destination);
});
