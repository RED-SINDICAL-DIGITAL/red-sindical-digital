const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../admin.html'),'utf8'),clientSource=fs.readFileSync(path.join(__dirname,'../uadav-jobs-import.js'),'utf8');
const sandbox={window:{},URL,Intl,Date};vm.runInNewContext(clientSource,sandbox);const client=sandbox.window.UADAVJobsImport;
const origin='https://uadav-stream-staging.pages.dev',sourceUrl='https://fuente.example/Convocatoria',reply={success:true,kind:'job',item:{titulo:'QA externa',descripcion:'Ficticia',source_url:sourceUrl,fecha_limite:'2099-12-31',source:'fuente.example'}};

test('review accepts only the requested confirmed kind, strips private metadata and replaces unscoped external IDs',()=>{
  const review=client.prepareReview({...reply,item:{...reply.item,external_id:'123',owner_access_hash:'secret',email:'private@example.invalid'}},'job',{id:'qa-source',name:'Fuente QA'});
  assert.equal(review.item.external_id,sourceUrl);assert.equal(review.item.application_url,sourceUrl);assert.equal(review.item.owner_access_hash,undefined);assert.equal(review.item.email,undefined);
  assert.equal(review.item.source_id,'qa-source');assert.equal(review.item.source_auto_sync,true);
  for(const data of [{},{...reply,success:false},{...reply,kind:'event'},{...reply,item:{...reply.item,source_url:'javascript:alert(1)'}}])assert.throws(()=>client.prepareReview(data,'job'));
});
test('explicit review requires title, description and a valid Argentina-calendar deadline after UTC midnight',()=>{
  const review=client.prepareReview(reply,'job'),now=Date.parse('2026-10-25T01:00:00Z');
  const item=client.reviewedItem(review,{title:'Revisada',description:'Descripción',deadline:'2026-10-24'},now);
  assert.equal(item.fecha_limite,'2026-10-24');assert.equal(item.revisado_por_admin,true);
  for(const values of [{title:'',description:'x',deadline:'2026-10-24'},{title:'x',description:'',deadline:'2026-10-24'},{title:'x',description:'x',deadline:'2026-11-31'},{title:'x',description:'x',deadline:'2026-10-23'}])assert.throws(()=>client.reviewedItem(review,values,now));
});
test('reviewed writes are staging-only, require exact result counts and never retry automatically',async()=>{
  let calls=0;const item=client.reviewedItem(client.prepareReview(reply,'job'),{title:'QA',description:'Ficticia',deadline:'2099-12-31'});
  await assert.rejects(client.sendReviewed('job',item,{origin:'https://uadavstream.com.ar',request:async()=>{calls++}}),/staging/);assert.equal(calls,0);
  for(const result of [{},{success:true,kind:'job',imported:0,updated:0},{success:true,kind:'event',imported:1,updated:0}])await assert.rejects(client.sendReviewed('job',item,{origin,request:async()=>{calls++;return result}}),/no se confirmó/i);
  assert.equal(calls,3);await client.sendReviewed('job',item,{origin,request:async()=>({success:true,kind:'job',imported:0,updated:1})});
});

const handlers=html.slice(html.indexOf('let urlAnalysisBusy=false'),html.indexOf('\nwindow.smartExport='));
function setup(){
  const fields={},calls=[],pending=[];
  const node=(id,value='')=>fields[id]={value,disabled:false,textContent:'',innerHTML:'',dataset:{}};
  const c={window:{UADAVJobsImport:client},S:{view:'sources',cache:{jobs:['old']},urlImportPreview:null},location:{origin},URL,
    $:id=>fields[id]||null,esc:value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),
    f:(id,label,value)=>{node(id,value);return '<input id="'+id+'">'},ta:(id,label,value)=>{node(id,value);return '<textarea id="'+id+'"></textarea>'},
    sel:(id,label,value)=>{node(id,value);return '<select id="'+id+'"></select>'},
    modal:(title,body,foot)=>{calls.push(['modal',title]);node('urlImportStatus');node('modalFoot');node('urlAnalyzeButton')},
    closeModal:()=>{calls.push(['close']);fields.urlImportStatus=null},toast:(...args)=>calls.push(['toast',...args]),go:async(...args)=>calls.push(['go',...args]),
    api:(...args)=>{calls.push(['api',...args]);if(args[0]==='health')return Promise.resolve({ok:true,success:true,d1:true,build:'11761'});return new Promise((resolve,reject)=>pending.push({resolve,reject}))}};
  vm.runInNewContext(handlers,c);
  const open=()=>c.window.openUrlImport({kind:'job',url:sourceUrl,source:{id:'qa',name:'Fuente QA'}});
  async function analyze(){const task=c.window.analyzeImportUrl();await new Promise(setImmediate);pending.at(-1).resolve(reply);await task;node('urlReviewFeedback');node('urlCommitButton');}
  return {c,fields,calls,pending,node,open,analyze};
}
test('double analysis issues one read and renders a simple editable review without raw JSON',async()=>{
  const x=setup();x.open();const first=x.c.window.analyzeImportUrl();await x.c.window.analyzeImportUrl();assert.equal(x.pending.length,1);
  x.pending[0].resolve(reply);await first;assert.equal(x.fields.urlReviewTitle.value,'QA externa');assert.equal(x.fields.urlReviewDescription.value,'Ficticia');
  assert.match(x.fields.urlImportStatus.innerHTML,/Abrir publicación original/);assert.doesNotMatch(x.fields.urlImportStatus.innerHTML,/<pre|external_id|source_auto_sync/);
  assert.equal(x.fields.urlImportUrl.disabled,true);
});
test('an old analysis cannot replace a newly opened review dialog',async()=>{
  const x=setup();x.open();const first=x.c.window.analyzeImportUrl();await new Promise(setImmediate);x.open();const current=x.fields.urlImportStatus;
  x.pending[0].resolve(reply);await first;assert.equal(x.fields.urlImportStatus,current);assert.equal(x.c.S.urlImportPreview,null);assert.equal(current.innerHTML,'');
});
test('missing data blocks a write; double confirmation sends one reviewed item and closes only on confirmed success',async()=>{
  const x=setup();x.open();await x.analyze();x.fields.urlReviewDescription.value='';await x.c.window.commitUrlImport();assert.equal(x.pending.length,1);assert.match(x.fields.urlReviewFeedback.textContent,/Completá/);
  x.fields.urlReviewDescription.value='Revisada';const sent=x.c.window.commitUrlImport();await x.c.window.commitUrlImport();assert.equal(x.pending.length,2);
  const call=x.calls.filter(row=>row[0]==='api').at(-1);assert.equal(call[1],'admin/federated/import');assert.equal(call[2].body.items[0].source_id,'qa');assert.equal(call[2].body.items[0].revisado_por_admin,true);
  x.pending[1].resolve({success:true,kind:'job',imported:1,updated:0});await sent;
  assert.equal(x.calls.filter(row=>row[0]==='close').length,1);assert.equal(x.c.S.cache.jobs,undefined);
});
test('an uncertain write keeps the typed form and requires a fresh analysis, preserving the draft for the same source',async()=>{
  const x=setup();x.open();await x.analyze();x.fields.urlReviewDescription.value='Mi descripción revisada';const sent=x.c.window.commitUrlImport();x.pending[1].reject(Error('Sin conexión'));await sent;
  assert.equal(x.fields.urlReviewDescription.value,'Mi descripción revisada');assert.equal(x.c.S.urlImportPreview,null);assert.match(x.fields.urlReviewFeedback.textContent,/Tus datos se conservan/);
  await x.c.window.commitUrlImport();assert.equal(x.pending.length,2);
  const again=x.c.window.analyzeImportUrl();await new Promise(setImmediate);x.pending[2].resolve(reply);await again;assert.equal(x.fields.urlReviewDescription.value,'Mi descripción revisada');
});
test('a late confirmed write invalidates the cache but cannot close another dialog',async()=>{
  const x=setup();x.open();await x.analyze();const sent=x.c.window.commitUrlImport();x.open();
  x.pending[1].resolve({success:true,kind:'job',imported:0,updated:1});await sent;
  assert.equal(x.calls.filter(row=>row[0]==='close'||row[0]==='go').length,0);assert.equal(x.c.S.cache.jobs,undefined);assert.equal(x.c.S.urlImportPreview,null);
});
test('server rejection remains visible and cannot leave a stale review publishable',async()=>{
  const x=setup();x.open();const read=x.c.window.analyzeImportUrl();await new Promise(setImmediate);x.pending[0].reject(Error('La fuente no es pública'));await read;
  assert.match(x.fields.urlImportStatus.textContent,/no es pública/);assert.equal(x.fields.urlImportUrl.disabled,false);assert.equal(x.c.S.urlImportPreview,null);
  await x.c.window.commitUrlImport();assert.equal(x.pending.length,1);
});

test('an older or incomplete Worker blocks HTML reads before any source request',async()=>{
  for(const health of [{ok:true,success:true,d1:true,build:'11760'},{ok:true,success:true,d1:false,build:'11761'},{}])assert.throws(()=>client.captureReady(health),/11761/);
  client.captureReady({ok:true,success:true,d1:true,build:'11761'});
  const x=setup();x.open();x.c.api=async route=>{assert.equal(route,'health');return {ok:true,success:true,d1:true,build:'11760'}};
  await x.c.window.analyzeImportUrl();assert.equal(x.pending.length,0);assert.match(x.fields.urlImportStatus.textContent,/11761/);assert.equal(x.c.S.urlImportPreview,null);
});

test('source discovery serializes clicks and reports remaining batches while accepting a legacy read response',async()=>{
  const handler=html.slice(html.indexOf('let sourceSyncBusy=false'),html.indexOf('\nwindow.toggleSource='));
  let resolve;const calls=[],c={window:{},S:{view:'sources',navigationId:1,cache:{}},toast:(...args)=>calls.push(['toast',...args]),go:async(...args)=>calls.push(['go',...args]),api:async()=>{calls.push(['read']);return new Promise(r=>{resolve=r})}};
  vm.runInNewContext(handler,c);const first=c.window.syncAllSources();await c.window.syncAllSources();assert.equal(calls.filter(x=>x[0]==='read').length,1);
  resolve({success:true,results:[{},{}],remaining:3});await first;assert(calls.some(x=>x[0]==='toast'&&x[1].includes('Quedan 3')));
  const second=c.window.syncAllSources();resolve({success:true,results:[]});await second;assert.equal(calls.filter(x=>x[0]==='go').length,2);
});
test('late source discovery cannot redraw another Admin section',async()=>{
  const handler=html.slice(html.indexOf('let sourceSyncBusy=false'),html.indexOf('\nwindow.toggleSource='));
  let resolve;const calls=[],c={window:{},S:{view:'sources',navigationId:1,cache:{federatedSources:['old']}},toast(){},go:async()=>calls.push('go'),api:()=>new Promise(r=>{resolve=r})};
  vm.runInNewContext(handler,c);const first=c.window.syncAllSources();c.S.view='radios';c.S.navigationId=2;resolve({success:true,results:[{}],remaining:0});await first;
  assert.equal(calls.length,0);assert.equal(c.S.cache.federatedSources,undefined);
});
