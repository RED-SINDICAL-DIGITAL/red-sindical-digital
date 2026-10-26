const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../uadav-jobs-expiry-admin.js'),'utf8');
const context={window:{}};vm.runInNewContext(source,context);const {controller,validPreview,cronController,validCron}=context.window.UADAVJobsExpiry;
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
  for(const reply of [null,{},[]]){const legacy=fixture({read:()=>reply});await legacy.flow.review();assert.match(legacy.flow.getState().message,/no están disponibles/);legacy.flow.confirm(true);await legacy.flow.send();assert.equal(legacy.calls.length,1);assert.equal(legacy.flow.canSend(),false);}
  let finish;const x=fixture({read:()=>new Promise(resolve=>finish=resolve)}),pending=x.flow.review();x.leave();finish(preview());await pending;assert.equal(x.flow.getState().preview,null);x.flow.confirm(true);await x.flow.send();assert.equal(x.calls.length,1);
});
test('Admin mounts the expiry tools inside its private audit view',()=>{
  const html=fs.readFileSync(require('node:path').join(__dirname,'../admin.html'),'utf8');assert.match(html,/src="\/uadav-jobs-expiry-admin\.js\?v=11763\.1"/);assert.match(html,/id="jobsExpiryReview"/);assert.match(html,/UADAVJobsExpiry\?\.mount\(\$\('jobsExpiryReview'\),\{request:api,apiBase:API_REMOTE\}\)/);
});

const cronState=patch=>({success:true,scope:'bolsa-staging',enabled:false,paused:false,ready:true,schedule:'*/15 * * * *',running:false,interrupted:false,attempt_started_at:null,last_run:null,last_success:null,...patch});
const cronRun=patch=>({version:1,status:'success',scheduled_time:Date.parse('2026-10-25T22:00:00Z'),started_at:'2026-10-25T22:00:01.000Z',completed_at:'2026-10-25T22:00:02.000Z',processed:2,emitted:1,recorded:1,...patch});
test('automatic status uses only a private GET and never activates or sends a reminder',async()=>{
  const calls=[],flow=cronController({origin:ORIGIN,apiBase:API,request:async(route,options)=>{calls.push({route,options});return cronState()}});
  await flow.refresh();assert.match(flow.getState().message,/desactivada/);assert.deepEqual(JSON.parse(JSON.stringify(calls)),[{route:'admin/jobs/cron',options:{method:'GET'}}]);
  assert.throws(()=>cronController({origin:'https://uadavstream.com.ar',apiBase:API}),/staging/);
  assert.throws(()=>cronController({origin:ORIGIN,apiBase:'https://uadav-api.uadavstream.workers.dev/api/'}),/staging/);
});
test('automatic status distinguishes unprepared, paused, running, interrupted, successful and failed runs',async()=>{
  const cases=[[cronState({ready:false}),/aún no está preparada/],[cronState({paused:true}),/mantenimiento/],[cronState({enabled:true,running:true,attempt_started_at:'2026-10-25T22:00:01.000Z'}),/en curso/],[cronState({enabled:true,interrupted:true,attempt_started_at:'2026-10-25T22:00:01.000Z'}),/sin confirmar/],[cronState({enabled:true,last_run:cronRun(),last_success:cronRun()}),/2 ofertas y se generó 1 aviso privado/],[cronState({enabled:true,last_run:cronRun({status:'error'}),last_success:cronRun()}),/No se confirmó/]];
  for(const [data,expected] of cases){const flow=cronController({origin:ORIGIN,apiBase:API,request:async()=>data});await flow.refresh();assert.match(flow.getState().message,expected);if(data.last_run)assert.match(flow.getState().message,/19:00.*Argentina/)}
});
test('malformed automatic responses and older Workers cannot produce a false success message',async()=>{
  const bad=[null,{},cronState({scope:'production'}),cronState({enabled:'true'}),cronState({last_run:cronRun({emitted:10})}),cronState({last_run:cronRun({completed_at:'invalid'})}),cronState({last_success:cronRun({status:'error'})}),cronState({running:true,interrupted:true})];
  for(const reply of bad){assert.equal(validCron(reply),false);const flow=cronController({origin:ORIGIN,apiBase:API,request:async()=>reply});await flow.refresh();assert.match(flow.getState().message,/No se pudo comprobar/)}
  const old=cronController({origin:ORIGIN,apiBase:API,request:async()=>{throw Object.assign(Error('Private backend detail'),{status:404})}});await old.refresh();assert.match(old.getState().message,/todavía no está disponible/);assert(!old.getState().message.includes('Private'));
});
test('automatic status suppresses duplicate clicks, late responses and arbitrary server fields',async()=>{
  let finish,calls=0,alive=true;const changes=[];
  const flow=cronController({origin:ORIGIN,apiBase:API,alive:()=>alive,onChange:state=>changes.push(state),request:()=>{calls++;return new Promise(resolve=>finish=resolve)}}),pending=flow.refresh();await flow.refresh();assert.equal(calls,1);alive=false;const before=changes.length;finish(cronState({last_run:cronRun(),private:'must-not-leak'}));await pending;assert.equal(changes.length,before);assert(!flow.getState().message.includes('ofertas'));
  const visible=cronController({origin:ORIGIN,apiBase:API,request:async()=>cronState({last_run:cronRun(),private:'must-not-leak'})});await visible.refresh();assert(!JSON.stringify(visible.getState()).includes('must-not-leak'));
});
