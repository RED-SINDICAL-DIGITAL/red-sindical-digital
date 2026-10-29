import test from 'node:test';import assert from 'node:assert/strict';import {webcrypto,randomUUID} from 'node:crypto';import {loadWorker} from './load-worker.mjs';import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;const {default:worker}=await loadWorker();
function fixture(){const DB=sqliteD1(),kv=new Map(),env={DB,EVENT_ATOMIC_STAGING:'true',ADMIN_KEY:'test-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};const call=async body=>{const r=await worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/eventos',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer test-admin'},body:JSON.stringify(body)}),env,{});return{status:r.status,body:await r.json()}};return{DB,kv,env,call}}
const event=()=>({request_id:randomUUID(),titulo:'Evento sintético',descripcion:'Prueba local',fecha:'2028-02-29',fecha_inicio:'2028-02-29',hora:'20:00',funciones:[{fecha:'2028-02-29',hora:'20:00'}],lugar:'Sala',ciudad:'Rosario',es_gratuito:true});
test('real worker commits one event for concurrent identical sends',async()=>{const f=fixture();try{const body=event(),[a,b]=await Promise.all([f.call(body),f.call(body)]);assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(a.body.id,b.body.id);const rows=await f.DB.prepare('SELECT id FROM events WHERE title=?').bind(body.titulo).all();assert.equal(rows.results.length,1);assert.equal((await f.call({...body,titulo:'Otro'})).status,409)}finally{f.DB.close()}});
test('real worker retries same reference after interrupted KV write',async()=>{const f=fixture();try{const body=event(),put=f.env.UADAV_DB.put;let failed=false;f.env.UADAV_DB.put=async(k,v)=>{if(k.startsWith('event-publication-snapshot:v1:')&&!failed){failed=true;throw Error('interruption')}return put(k,v)};const a=await f.call(body);assert.equal(a.status,503);const b=await f.call(body);assert.equal(b.status,200);const rows=await f.DB.prepare('SELECT id FROM events WHERE title=?').bind(body.titulo).all();assert.equal(rows.results.length,1);assert.equal([...f.kv.keys()].filter(x=>x.startsWith('event-publication-snapshot:v1:')).length,1)}finally{f.DB.close()}});
test('moderated event carries the reference through approval and repeated public submission',async()=>{const f=fixture();try{f.kv.set('moderation_config',JSON.stringify({enabled:true,provider:'none'}));const body=event();const post=async()=>{const r=await worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/eventos',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.20'},body:JSON.stringify(body)}),f.env,{});return {status:r.status,body:await r.json()}};const a=await post(),b=await post();assert.equal(a.status,202);assert.equal(a.body.moderation_id,b.body.moderation_id);const reviewed=await worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/admin/moderation/review',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer test-admin'},body:JSON.stringify({id:a.body.moderation_id,decision:'approve'})}),f.env,{});const result=await reviewed.json();assert.equal(reviewed.status,200,JSON.stringify(result));const again=await post();assert.equal(again.body.id,result.result.id);assert.equal((await f.DB.prepare('SELECT COUNT(*) n FROM events WHERE title=?').bind(body.titulo).first()).n,1)}finally{f.DB.close()}});

test('worker keeps one queued notice even when a KV projection fails',async()=>{const f=fixture();try{const body=event(),put=f.env.UADAV_DB.put;let failed=false;f.env.UADAV_DB.put=async(k,v)=>{if(k.startsWith('event-publication-snapshot:v1:')&&!failed){failed=true;throw Error('interruption')}return put(k,v)};assert.equal((await f.call(body)).status,503);const notices=()=>f.DB.prepare("SELECT COUNT(*) n FROM notifications WHERE template='event_published'").first();assert.equal((await notices()).n,1);assert.equal((await f.call(body)).status,200);assert.equal((await notices()).n,1)}finally{f.DB.close()}});

test('different concurrent events remain visible and editable when legacy arrays are stale',async()=>{
 const f=fixture();try{
  const bodies=[{...event(),titulo:'Simultáneo A'},{...event(),titulo:'Simultáneo B'}];
  const published=await Promise.all(bodies.map(b=>f.call(b)));
  for(const result of published)assert.equal(result.status,200);
  assert.equal([...f.kv.keys()].filter(k=>k.startsWith('event-publication-snapshot:v1:')).length,2);
  const request=async(path,method='GET',body)=>worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev'+path,{method,headers:{Authorization:'Bearer test-admin','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),f.env,{});
  f.kv.set('cartelera_aprobada',JSON.stringify([published[0].body.item]));
  for(const path of ['/api/cartelera','/api/cartelera_aprobada','/api/eventos_publicados']){
   const response=await request(path);assert.equal(response.status,200);
   assert.deepEqual(new Set((await response.json()).map(e=>e.id)),new Set(published.map(e=>e.body.id)));
  }
  const id=published[1].body.id;
  const edit=await request('/api/cartelera','PUT',{id,titulo:'Editado desde Admin'});assert.equal(edit.status,200);
  const detail=await request('/api/evento?id='+id);assert.equal((await detail.json()).titulo,'Editado desde Admin');
  // A stale legacy copy must never resurrect an event deleted in D1.
  f.kv.set('eventos_publicados',JSON.stringify(published.map(e=>e.body.item)));
  assert.equal((await request('/api/cartelera','DELETE',{id})).status,200);
  assert.equal((await request('/api/evento?id='+id)).status,404);
  assert.equal((await f.call(bodies[1])).status,200);
  assert.equal((await request('/api/evento?id='+id)).status,404);
 }finally{f.DB.close()}
});

const adminRequest=(f,method,body)=>worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/cartelera',{method,headers:{Authorization:'Bearer test-admin','Content-Type':'application/json'},body:JSON.stringify(body)}),f.env,{});
for(const method of ['PUT','DELETE'])test(`admin ${method} rolls back history and event when its transaction fails`,async()=>{
 const f=fixture();try{
  const published=await f.call(event()),id=published.body.id;
  const original=await f.DB.prepare('SELECT data_json,status FROM events WHERE id=?').bind(id).first();
  const batch=f.DB.batch.bind(f.DB);
  f.DB.batch=statements=>statements.some(s=>s.sql.includes('UPDATE events SET'))?batch([...statements,f.DB.prepare('INSERT INTO missing_rollback_probe VALUES(1)')]):batch(statements);
  const response=await adminRequest(f,method,{id,titulo:'No debe guardarse'});assert.equal(response.status,503);
  assert.deepEqual(await f.DB.prepare('SELECT data_json,status FROM events WHERE id=?').bind(id).first(),original);
  assert.equal((await f.DB.prepare("SELECT COUNT(*) n FROM entity_versions WHERE entity_type='event' AND entity_id=?").bind(id).first()).n,0);
  f.DB.batch=batch;
  assert.equal((await adminRequest(f,method,{id,titulo:'Guardado al reintentar'})).status,200);
  assert.equal((await f.DB.prepare("SELECT COUNT(*) n FROM entity_versions WHERE entity_type='event' AND entity_id=?").bind(id).first()).n,1);
 }finally{f.DB.close()}
});
test('concurrent admin edits reject the stale mutation and keep one history entry',async()=>{
 const f=fixture();try{
  const id=(await f.call(event())).body.id;
  const responses=await Promise.all(['Primera','Segunda'].map(titulo=>adminRequest(f,'PUT',{id,titulo})));
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
  assert.equal((await f.DB.prepare("SELECT COUNT(*) n FROM entity_versions WHERE entity_type='event' AND entity_id=?").bind(id).first()).n,1);
 }finally{f.DB.close()}
});

test('admin creation replays one event for concurrent identical references',async()=>{
 const f=fixture();try{const b=event(),responses=await Promise.all([adminRequest(f,'POST',b),adminRequest(f,'POST',b)]);assert.deepEqual(responses.map(r=>r.status),[200,200]);const [a,c]=await Promise.all(responses.map(r=>r.json()));assert.equal(a.item.id,c.item.id);assert.equal((await f.DB.prepare('SELECT COUNT(*) n FROM events WHERE title=?').bind(b.titulo).first()).n,1);assert.equal((await adminRequest(f,'POST',{...b,titulo:'Modificado'})).status,409)}finally{f.DB.close()}
});
test('a legacy KV event can be edited without resurrecting a canonical deletion',async()=>{
 const f=fixture();try{await f.call(event());const legacy={id:'EV-LEGACY',titulo:'Anterior',fecha:'2028-02-29',fecha_inicio:'2028-02-29',lugar:'Sala',estado:'published'};f.kv.set('cartelera_aprobada',JSON.stringify([legacy]));assert.equal((await adminRequest(f,'PUT',{id:legacy.id,titulo:'Migrado y editado'})).status,200);const saved=await f.DB.prepare('SELECT title,status FROM events WHERE id=?').bind(legacy.id).first();assert.equal(saved.title,'Migrado y editado');assert.equal((await adminRequest(f,'DELETE',{id:legacy.id})).status,200);assert.equal((await adminRequest(f,'PUT',{id:legacy.id,titulo:'No resucitar'})).status,404);assert.equal((await f.DB.prepare('SELECT status FROM events WHERE id=?').bind(legacy.id).first()).status,'deleted')}finally{f.DB.close()}
});
test('canonical mode refuses obsolete whole-catalog replacements',async()=>{
 const f=fixture();try{for(const path of ['/api/cartelera_aprobada','/api/eventos_publicados']){const r=await worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev'+path,{method:'PUT',headers:{Authorization:'Bearer test-admin'},body:'[]'}),f.env,{});assert.equal(r.status,405)}}finally{f.DB.close()}
});
test('a lost publication response can be checked without another write or private data disclosure',async()=>{
 const f=fixture();try{const b={...event(),contacto_email:'private@example.invalid'},published=await f.call(b);const get=async id=>worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/eventos/receipt?request_id='+id),f.env,{});const r=await get(b.request_id);assert.deepEqual(await r.json(),{confirmed:true,id:published.body.id});assert.deepEqual(await(await get(randomUUID())).json(),{confirmed:false});assert.equal((await get('bad')).status,400);assert.equal((await f.DB.prepare('SELECT COUNT(*) n FROM events').first()).n,1);assert.equal((await adminRequest(f,'DELETE',{id:published.body.id})).status,200);assert.deepEqual(await(await get(b.request_id)).json(),{confirmed:false})}finally{f.DB.close()}
});
test('canonical paid-feature approval needs a valid future expiry and does not depend on KV arrays',async()=>{const f=fixture();try{const b={...event(),destacado_solicitado:true},id=(await f.call(b)).body.id;const action=async body=>{const r=await worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/eventos',{method:'PUT',headers:{Authorization:'Bearer test-admin','Content-Type':'application/json'},body:JSON.stringify({id,action:'feature_paid',destacado_pagado:true,...body})}),f.env,{});return r};assert.equal((await action({destacado_hasta:'invalid'})).status,400);assert.equal((await action({destacado_hasta:'2000-01-01'})).status,400);assert.equal((await action({destacado_hasta:new Date(Date.now()+86400000).toISOString()})).status,200);const row=await f.DB.prepare('SELECT featured,payment_status,data_json FROM events WHERE id=?').bind(id).first();assert.equal(row.featured,1);assert.equal(row.payment_status,'pagado');assert.equal(JSON.parse(row.data_json).destacado_solicitado,false)}finally{f.DB.close()}});

test('immediate staging publication retains atomic deduplication, feature review and rate limits',async()=>{const f=fixture();try{f.env.CARTELERA_PUBLICATION_STAGING='immediate';const body={...event(),destacado_solicitado:true};const post=async payload=>{const r=await worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/eventos',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.88'},body:JSON.stringify(payload)}),f.env,{});return{status:r.status,body:await r.json()}};const a=await post(body),b=await post(body);assert.equal(a.status,200,JSON.stringify(a.body));assert.equal(b.body.id,a.body.id);assert.equal(a.body.item.destacado_pagado,false);assert.equal(a.body.item.destacado_estado,'pendiente_revision');assert.equal((await post({...body,titulo:'Cambio'})).status,409);for(let n=3;n<12;n++)assert.equal((await post(body)).status,200);assert.equal((await post(body)).status,429);assert.equal((await f.DB.prepare('SELECT COUNT(*) n FROM events WHERE title=?').bind(body.titulo).first()).n,1);assert.equal((await f.DB.prepare('SELECT COUNT(*) n FROM moderation_queue').first()).n,0)}finally{f.DB.close()}});
test('immediate flag cannot change publication on any other hostname',async()=>{const f=fixture();try{f.env.CARTELERA_PUBLICATION_STAGING='immediate';const r=await worker.fetch(new Request('https://isolated.invalid/api/eventos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(event())}),f.env,{});assert.equal(r.status,202);assert.equal((await r.json()).moderation_pending,true)}finally{f.DB.close()}});
