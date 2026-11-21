const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../admin.html'),'utf8');
const handler=source.slice(source.indexOf('window.saveJob=async i=>{'),source.indexOf('\nwindow.toggleJobVisibility='));

function setup(){
  let resolve,reject;
  const pending=new Promise((a,b)=>{resolve=a;reject=b});
  const values={jTitle:'Oferta QA',jDesc:'Descripción ficticia',jContact:'qa@example.invalid',jActive:'true',jDeadline:'2026-10-23'};
  const fields={};
  const field=id=>fields[id]||(fields[id]={value:values[id]||'',disabled:false,textContent:'',focus(){this.focused=true}});
  const title=field('jTitle'),locked=field('jType'),button=field('jSaveButton');locked.disabled=true;
  fields.modalBody={querySelectorAll:()=>[title,locked]};
  fields.modalFoot={querySelectorAll:()=>[button]};
  const original={id:'JOB-QA-11760',titulo:'Original'},calls=[];
  const c={window:{},crypto:{randomUUID:()=> '01234567-89ab-cdef-0123-456789abcdef'},S:{view:'jobs',cache:{jobs:[original]}},$:field,arr:x=>Array.isArray(x)?x:[],
    api:async(...args)=>{calls.push(['api',...args]);return pending},
    closeModal:()=>calls.push(['close']),toast:(...args)=>calls.push(['toast',...args]),
    go:async(...args)=>calls.push(['go',...args])};
  vm.runInNewContext("let jobSavePending=false,jobDraftRequestId='';"+handler,c);
  return {c,calls,fields,title,locked,button,original,resolve,reject};
}
const writes=x=>x.calls.filter(v=>v[0]==='api');
test('double click writes once, confirms the exact offer, and restores disabled controls',async()=>{
  const x=setup(),first=x.c.window.saveJob(0);await x.c.window.saveJob(0);
  assert.equal(writes(x).length,1);assert.equal(writes(x)[0][2].method,'PUT');
  assert.equal(writes(x)[0][2].body.id,x.original.id);assert.equal(x.title.disabled,true);
  assert.equal(x.button.textContent,'Guardando…');
  x.resolve({success:true,item:{id:x.original.id}});await first;
  assert.equal(x.title.disabled,false);assert.equal(x.locked.disabled,true);
  assert.equal(x.button.textContent,'Guardar');assert.equal(x.c.S.cache.jobs,undefined);
  assert.equal(x.calls.filter(v=>v[0]==='close').length,1);
  assert.equal(x.calls.filter(v=>v[0]==='go').length,1);
});
test('expired deadline rejection remains visible and retains the form and cached offer',async()=>{
  const x=setup(),first=x.c.window.saveJob(0);x.reject(Error('Fecha de caducidad inválida o vencida'));await first;
  assert.match(x.fields.jSaveStatus.textContent,/Fecha de caducidad inválida o vencida/);
  assert.match(x.fields.jSaveStatus.textContent,/Tus datos siguen en este formulario/);
  assert.equal(x.fields.jDeadline.value,'2026-10-23');assert.equal(x.title.value,'Oferta QA');
  assert.equal(x.c.S.cache.jobs[0],x.original);assert.equal(x.title.disabled,false);
  assert.equal(x.calls.filter(v=>v[0]==='close'||v[0]==='go').length,0);
  assert.equal(writes(x).length,1);
});
test('uncertain network response never retries automatically and offers a check before retrying',async()=>{
  const x=setup(),first=x.c.window.saveJob(-1);x.reject(Error('Sin conexión'));await first;
  assert.equal(writes(x).length,1);assert.equal(writes(x)[0][2].method,'POST');
  assert.match(x.fields.jSaveStatus.textContent,/comprobá la lista/);
  assert.equal(x.c.S.cache.jobs[0],x.original);
});
test('mismatched or incomplete server replies cannot close the form or invalidate cache',async()=>{
  for(const reply of [{success:true},{success:true,item:{id:'JOB-OTHER'}},{success:false,item:{id:'JOB-QA-11760'}}]){
    const x=setup(),first=x.c.window.saveJob(0);x.resolve(reply);await first;
    assert.match(x.fields.jSaveStatus.textContent,/no confirmó la oportunidad/);
    assert.equal(x.c.S.cache.jobs[0],x.original);assert.equal(x.calls.filter(v=>v[0]==='close').length,0);
  }
});
test('a successful late reply cannot close another editor or navigate away from another section',async()=>{
  for(const moved of ['editor','section']){
    const x=setup(),first=x.c.window.saveJob(0);
    if(moved==='editor')x.fields.jTitle={value:'Otro editor'};else x.c.S.view='radios';
    x.resolve({success:true,item:{id:x.original.id}});await first;
    assert.equal(x.calls.filter(v=>v[0]==='close'||v[0]==='go').length,0);
    assert.equal(x.c.S.cache.jobs,undefined);
  }
});
test('missing fields and stale indexes give feedback without a write',async()=>{
  const x=setup();x.title.value=' ';
  await x.c.window.saveJob(0);assert.equal(x.title.focused,true);assert.match(x.fields.jSaveStatus.textContent,/obligatorios/);
  await x.c.window.saveJob(3);assert.match(x.fields.jSaveStatus.textContent,/ya no está en esta lista/);
  assert.equal(writes(x).length,0);assert.equal(x.title.disabled,false);
});
test('new offer success requires a valid returned identifier and refreshes only after confirmation',async()=>{
  const x=setup(),first=x.c.window.saveJob(-1);
  assert.equal(writes(x)[0][2].body.id,undefined);
  assert.equal(writes(x)[0][2].body.request_id,'01234567-89ab-cdef-0123-456789abcdef');
  x.resolve({success:true,item:{id:'JOB-NEW-11760'}});await first;
  assert.equal(x.calls.filter(v=>v[0]==='close').length,1);assert.equal(x.c.S.cache.jobs,undefined);
});

test('an explicit retry of one creation draft keeps the same idempotency ID',async()=>{
  const x=setup(),first=x.c.window.saveJob(-1);x.reject(Error('Sin conexión'));await first;
  await x.c.window.saveJob(-1);
  assert.equal(writes(x).length,2);assert.equal(writes(x)[0][2].body.request_id,writes(x)[1][2].body.request_id);
  assert.match(source,/window\.editJob=i=>\{jobDraftRequestId=i<0\?crypto\.randomUUID\(\):''/);
});
