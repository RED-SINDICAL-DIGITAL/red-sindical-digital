const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../uadav-jobs-expiry-admin.js'),'utf8');
const context={window:{}};vm.runInNewContext(source,context);const {controller,validPreview}=context.window.UADAVJobsExpiry;
const ORIGIN='https://uadav-stream-staging.pages.dev',API='https://uadav-api-staging.uadavstream.workers.dev/api/';
const preview=()=>({success:true,dry_run:true,day:'2026-10-24',advance_days:3,pending:1,batch_size:1,more_pending:false,fingerprint:'f'.repeat(64),items:[{job_id:'JOB-EXPIRY-UI',title:'Oferta ficticia',deadline:'2026-10-27',kind:'soon'}]});
function fixture({read,write}={}){
  const calls=[];let alive=true;
  const request=async(route,options)=>{calls.push({route,options});return options.method==='GET'?(read?read():preview()):(write?write():{success:true,dry_run:false,fingerprint:'f'.repeat(64),emitted:1,recorded:1,more_pending:false})};
  const flow=controller({origin:ORIGIN,apiBase:API,request,alive:()=>alive});return {flow,calls,leave:()=>alive=false};
}
test('expiry tools reject production and lookalike origins before sending any request',()=>{
  for(const origin of ['https://uadavstream.com.ar',ORIGIN+'.evil.invalid','http://uadav-stream-staging.pages.dev'])assert.throws(()=>controller({origin,apiBase:API}),/staging/);
  for(const apiBase of ['https://uadav-api.uadavstream.workers.dev/api/',API+'extra/'])assert.throws(()=>controller({origin:ORIGIN,apiBase}),/staging/);
});
test('review is read-only, requires explicit consent and a confirmed result requires another review',async()=>{
  const x=fixture();await x.flow.send();assert.equal(x.calls.length,0);await x.flow.review();assert.equal(x.flow.canSend(),false);await x.flow.send();assert.equal(x.calls.length,1);
  x.flow.confirm(true);assert.equal(x.flow.canSend(),true);await x.flow.send();assert.equal(x.calls.length,2);assert.match(x.flow.getState().message,/1 aviso privado/);assert.equal(x.flow.canSend(),false);await x.flow.send();assert.equal(x.calls.length,2);
  assert.deepEqual(JSON.parse(JSON.stringify(x.calls[1])),{route:'admin/jobs/expiry-notices',options:{method:'POST',body:{confirm:'EMITIR_AVISOS_VENCIMIENTO_STAGING',fingerprint:'f'.repeat(64)}}});
});
test('duplicate clicks cannot overlap a review or emission',async()=>{
  let finish;const x=fixture({read:()=>new Promise(resolve=>finish=resolve)}),pending=x.flow.review();await x.flow.review();assert.equal(x.calls.length,1);finish(preview());await pending;
  let sent;const y=fixture({write:()=>new Promise(resolve=>sent=resolve)});await y.flow.review();y.flow.confirm(true);const sending=y.flow.send();await y.flow.send();await y.flow.review();assert.equal(y.calls.length,2);sent({success:true,dry_run:false,fingerprint:'f'.repeat(64),emitted:1,recorded:1,more_pending:false});await sending;
});
test('empty, malformed or stale previews never enable emission',async()=>{
  const mutations=[p=>p.items.pop(),p=>p.items[0].deadline='2026-02-30',p=>p.items[0].deadline='2026-10-28',p=>p.items[0].kind='expired',p=>p.pending=2001,p=>p.fingerprint='wrong',p=>p.batch_size=0,p=>p.items[0].job_id='other',p=>p.more_pending=true];
  for(const mutate of mutations){const p=preview();mutate(p);assert.equal(validPreview(p),false);const x=fixture({read:()=>p});await x.flow.review();x.flow.confirm(true);await x.flow.send();assert.equal(x.calls.length,1);assert.equal(x.flow.canSend(),false);}
  const x=fixture({read:()=>({...preview(),pending:0,batch_size:0,items:[]})});await x.flow.review();x.flow.confirm(true);await x.flow.send();assert.match(x.flow.getState().message,/No hay avisos/);assert.equal(x.calls.length,1);
});
test('uncertain or unconfirmed writes are never retried and always require a fresh review',async()=>{
  for(const write of [()=>{throw Error('Respuesta de red perdida')},()=>({success:true,dry_run:false,fingerprint:'f'.repeat(64),emitted:2,recorded:2,more_pending:false}),()=>({success:false})]){
    const x=fixture({write});await x.flow.review();x.flow.confirm(true);await x.flow.send();assert.equal(x.flow.getState().preview,null);assert.equal(x.flow.canSend(),false);await x.flow.send();assert.equal(x.calls.filter(x=>x.options.method==='POST').length,1);assert.match(x.flow.getState().message,/revis/i);
  }
});
test('an older Worker gives an actionable fallback and detached views ignore late private responses',async()=>{
  const older=fixture({read:()=>{throw Object.assign(Error('Ruta no encontrada'),{status:404})}});await older.flow.review();assert.match(older.flow.getState().message,/todavía no están preparados/);assert.equal(older.flow.canSend(),false);
  let finish;const x=fixture({read:()=>new Promise(resolve=>finish=resolve)}),pending=x.flow.review();x.leave();finish(preview());await pending;assert.equal(x.flow.getState().preview,null);x.flow.confirm(true);await x.flow.send();assert.equal(x.calls.length,1);
});
test('Admin mounts the expiry tools inside its private audit view',()=>{
  const html=fs.readFileSync(require('node:path').join(__dirname,'../admin.html'),'utf8');assert.match(html,/src="\/uadav-jobs-expiry-admin\.js\?v=11760"/);assert.match(html,/id="jobsExpiryReview"/);assert.match(html,/UADAVJobsExpiry\?\.mount\(\$\('jobsExpiryReview'\),\{request:api,apiBase:API_REMOTE\}\)/);
});
