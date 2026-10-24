const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../uadav-jobs-migration-admin.js'),'utf8');
const context={window:{}};vm.runInNewContext(source,context);
const {controller}=context.window.UADAVJobsMigration;
const ORIGIN='https://uadav-stream-staging.pages.dev',API='https://uadav-api-staging.uadavstream.workers.dev/api/';
const tables=['job_store_meta','job_store_records','job_store_rates','job_owner_credentials','job_owner_recovery_tokens','job_owner_recovery_v2'];
const fingerprint='f'.repeat(64);
function fixture({offers=3,applications=2,missing=false,complete=true,source='kv',post}={}){
  const backup={generated_at:new Date().toISOString(),job_storage:source,backup_integrity:{complete},kv:{bolsa_trabajo:Array.from({length:offers},()=>({contacto_email:'private@example.invalid',owner_access_hash:'never-log-this-hash'})),postulaciones_trabajo:Array.from({length:applications},()=>({nombre:'Persona privada'}))},tables:Object.fromEntries((missing?tables.slice(1):tables).map(t=>[t,[]]))};
  const preview={success:true,dry_run:true,fingerprint,counts:{bolsa_trabajo:offers,postulaciones_trabajo:applications}};
  const calls=[],downloads=[];let alive=true;
  const request=async(route,options)=>{
    calls.push({route,options});
    if(options.method==='GET')return route==='v7/export'?backup:preview;
    if(post)return post(route,options);
    const offset=options.body.offset,total=offers+applications,processed=Math.min(3,total-offset),next=offset+processed;
    return {success:true,dry_run:false,fingerprint,processed,complete:next===total,next_offset:next===total?null:next};
  };
  const flow=controller({origin:ORIGIN,apiBase:API,request,download:async x=>downloads.push(x),alive:()=>alive});
  const confirm=()=>{for(const key of ['backup','isolation','maintenance'])flow.confirm(key,true)};
  return {flow,calls,downloads,backup,preview,confirm,leave:()=>alive=false};
}

test('origins other than exact staging and arbitrary API bases are rejected before any request',()=>{
  for(const origin of ['https://uadavstream.com.ar','https://uadav-stream-staging.pages.dev.evil.test','http://uadav-stream-staging.pages.dev'])assert.throws(()=>controller({origin,apiBase:API}),/staging/);
  for(const apiBase of ['https://uadav-api.uadavstream.workers.dev/api/','https://other.example/api/'])assert.throws(()=>controller({origin:ORIGIN,apiBase}),/staging/);
});

test('analysis only reads and generates a verified backup; copying requires three explicit confirmations',async()=>{
  const x=fixture();await x.flow.prepare();assert.equal(x.downloads.length,1);assert.equal(x.flow.getState().phase,'ready');
  await x.flow.run();assert.equal(x.calls.filter(c=>c.options.method==='POST').length,0);
  x.flow.confirm('backup',true);x.flow.confirm('isolation',true);await x.flow.run();assert.equal(x.calls.filter(c=>c.options.method==='POST').length,0);
  x.flow.confirm('maintenance',true);await x.flow.run();assert.equal(x.flow.getState().complete,true);assert.equal(x.flow.getState().offset,5);
  assert.deepEqual(x.calls.filter(c=>c.options.method==='POST').map(c=>c.options.body.offset),[0,3]);
  assert(x.calls.every(c=>!JSON.stringify(c.options).includes('JOB_STORE_D1')));
});

test('missing tables or incomplete backup block the copy',async()=>{
  for(const config of [{missing:true},{complete:false}]){
    const x=fixture(config);await x.flow.prepare();x.confirm();await x.flow.run();
    assert.equal(x.calls.filter(c=>c.options.method==='POST').length,0);
    assert.equal(x.downloads.length,config.complete===false?0:1);
    assert.equal(x.flow.getState().phase,config.missing?'missing-schema':'error');
  }
});

test('a source already using D1 is never copied again from old KV',async()=>{
  const x=fixture({source:'d1'});await x.flow.prepare();x.confirm();await x.flow.run();assert.equal(x.flow.getState().phase,'already-d1');assert.equal(x.calls.length,1);assert.equal(x.downloads.length,0);
});

test('mismatched counts or invalid fingerprints do not generate a misleading backup',async()=>{
  for(const mutate of [x=>x.preview.counts.bolsa_trabajo++,x=>x.preview.fingerprint='bad']){
    const x=fixture();mutate(x);await x.flow.prepare();x.confirm();await x.flow.run();assert.equal(x.downloads.length,0);assert.equal(x.flow.getState().phase,'error');assert(x.calls.every(c=>c.options.method==='GET'));
  }
});

test('double click is serialized; pausing finishes one batch and resuming uses the confirmed cursor',async()=>{
  let release;const x=fixture({post:async(_route,options)=>new Promise(resolve=>release=()=>resolve({success:true,dry_run:false,fingerprint,processed:options.body.offset===0?3:2,complete:options.body.offset===3,next_offset:options.body.offset===0?3:null}))});
  await x.flow.prepare();x.confirm();const first=x.flow.run();await x.flow.run();assert.equal(x.calls.filter(c=>c.options.method==='POST').length,1);
  x.flow.pause();release();await first;assert.equal(x.flow.getState().phase,'paused');assert.equal(x.flow.getState().offset,3);
  const next=x.flow.run();assert.equal(x.calls.filter(c=>c.options.method==='POST')[1].options.body.offset,3);release();await next;assert.equal(x.flow.getState().complete,true);
});

test('an ambiguous or invalid reply stops and retains the last confirmed cursor for an explicit retry',async()=>{
  const x=fixture({post:async()=>({success:true,dry_run:false,fingerprint,processed:3,complete:false,next_offset:0})});await x.flow.prepare();x.confirm();await x.flow.run();assert.equal(x.flow.getState().phase,'error');assert.equal(x.flow.getState().offset,0);assert.equal(x.calls.filter(c=>c.options.method==='POST').length,1);
  await x.flow.run();assert.equal(x.calls.filter(c=>c.options.method==='POST')[1].options.body.offset,0);
});

test('leaving the Admin view prevents additional batches',async()=>{
  let release;const x=fixture({post:async()=>new Promise(resolve=>release=()=>resolve({success:true,dry_run:false,fingerprint,processed:3,complete:false,next_offset:3}))});
  await x.flow.prepare();x.confirm();const pending=x.flow.run();x.leave();release();await pending;
  assert.equal(x.calls.filter(c=>c.options.method==='POST').length,1);assert.equal(x.flow.getState().phase,'paused');
});

test('the shareable report excludes personal information, credentials and fingerprints',async()=>{
  const x=fixture();await x.flow.prepare();x.confirm();await x.flow.run();const report=x.flow.report();
  for(const privateValue of ['private@example.invalid','Persona privada','never-log-this-hash',fingerprint])assert(!report.includes(privateValue));
  assert.match(report,/Comparación final: confirmada/);assert.match(report,/no realizada/);
});

test('an empty but valid source can finish with a verified zero-record response',async()=>{
  const x=fixture({offers:0,applications:0});await x.flow.prepare();x.confirm();await x.flow.run();assert.equal(x.flow.getState().complete,true);assert.equal(x.calls.filter(c=>c.options.method==='POST').length,1);
});

test('Admin loads and mounts the preparation panel inside its existing private audit view',()=>{
  const admin=fs.readFileSync(path.join(__dirname,'../admin.html'),'utf8');
  assert.match(admin,/<script src="\/uadav-jobs-migration-admin\.js/);
  assert.match(admin,/id="jobsD1Preparation"/);
  assert.match(admin,/UADAVJobsMigration\?\.mount/);
  for(const script of admin.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
});
