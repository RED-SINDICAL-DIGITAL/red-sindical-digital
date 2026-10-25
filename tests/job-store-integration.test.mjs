import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto,randomUUID} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
import {loadWorker} from './load-worker.mjs';
const {default:worker,uadavJobStore,uadavJobMigration,uadavJobRedeemRecovery,uadavJobRate,uadavJobMaintenance}=await loadWorker();
const digest=async value=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))).toString('hex');
const secret='a'.repeat(64),otherSecret='b'.repeat(64),oldHash=await digest(secret);
async function fixture(legacy={bolsa_trabajo:[],postulaciones_trabajo:[]}){
  const DB=sqliteD1(),kv=new Map(Object.entries(legacy).map(([k,v])=>[k,JSON.stringify(v)]));
  const env={DB,ADMIN_KEY:'local-synthetic-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>{kv.set(k,v)}}};
  for(const file of ['20261023_job_owner_credentials.sql','20261024_job_store.sql']){
    const schema=await readFile(new URL('../migrations/staging/'+file,import.meta.url),'utf8');
    for(const sql of schema.replace(/--[^\n]*/g,'').split(';').filter(x=>x.trim()))await DB.prepare(sql).run();
  }
  const call=async(route,method='GET',body,admin=false,host='uadav-api-staging.uadavstream.workers.dev')=>{
    const headers={'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.10'};
    if(admin)headers.Authorization='Bearer '+env.ADMIN_KEY;
    const r=await worker.fetch(new Request('https://'+host+'/api/'+route,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})}),env,{});
    return {status:r.status,data:await r.json(),headers:r.headers};
  };
  async function migrate(){
    env.JOB_STORE_MAINTENANCE='true';
    const preview=await uadavJobMigration(env);
    let offset=0,result;
    do{result=await uadavJobMigration(env,{dry_run:false,fingerprint:preview.fingerprint,confirm:'MIGRAR_BOLSA_STAGING',offset});offset=result.next_offset}while(offset!==null);
    env.JOB_STORE_MAINTENANCE='false';env.JOB_STORE_D1='true';return result;
  }
  return {DB,env,kv,call,migrate,close:()=>DB.close()};
}
const offer=(extra={})=>({titulo:'DEMO QA · Convocatoria ficticia',descripcion:'No es una oferta real.',contacto:'qa@example.invalid',request_id:randomUUID(),...extra});
const application=(job_id,extra={})=>({job_id,nombre:'QA',email:'qa@example.invalid',consent_scope:'job_application_v1',consent_at:new Date().toISOString(),shared_fields:['nombre','email'],request_id:randomUUID(),...extra});

test('migración: autorización, simulación, idempotencia, comparación completa y acceso legado',async()=>{
  const legacy={bolsa_trabajo:[{id:'JOB-LEGACY',titulo:'Legado',activo:true,owner_access_hash:oldHash,fecha_limite:'2099-12-31'}],postulaciones_trabajo:[]};
  const f=await fixture(legacy);
  try{
    assert.equal((await f.call('admin/jobs/migration')).status,401);
    const preview=await f.call('admin/jobs/migration','GET',undefined,true);assert.equal(preview.data.dry_run,true);
    assert(!JSON.stringify(preview.data).includes(oldHash));
    assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM job_store_records').first()).n,0);
    await assert.rejects(uadavJobMigration(f.env,{dry_run:false}),{jobCode:'JOB_MAINTENANCE_REQUIRED'});
    await f.migrate();
    assert.equal((await f.call('bolsa_trabajo/mis-postulantes','POST',{job_id:'JOB-LEGACY',clave:secret})).status,200);
    assert.equal((await f.call('bolsa_trabajo/mis-postulantes','POST',{job_id:'JOB-LEGACY',clave:otherSecret})).status,404);
    assert.equal(f.kv.get('bolsa_trabajo'),JSON.stringify(legacy.bolsa_trabajo));
    f.env.JOB_STORE_D1='false';await f.migrate();assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM job_store_records').first()).n,1);
    f.env.JOB_STORE_D1='false';f.env.JOB_STORE_MAINTENANCE='true';
    assert.equal((await f.call('bolsa_trabajo','POST',offer())).status,423);
    f.kv.set('bolsa_trabajo',JSON.stringify([...legacy.bolsa_trabajo,{id:'JOB-LATER'}]));
    const changed=await uadavJobMigration(f.env);
    await assert.rejects(uadavJobMigration(f.env,{dry_run:false,confirm:'MIGRAR_BOLSA_STAGING',fingerprint:changed.fingerprint}),{jobCode:'JOB_SOURCE_CHANGED'});
  }finally{f.close()}
});

test('publicaciones y postulaciones simultáneas: sin duplicados, pérdidas ni secretos públicos',async()=>{
  const f=await fixture();
  try{
    await f.migrate();
    const body=offer();const race=await Promise.all([f.call('bolsa_trabajo','POST',body),f.call('bolsa_trabajo','POST',body)]);
    assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);
    const first=race.find(r=>r.status===200);assert.match(first.data.clave_contratante,/^[a-f0-9]{64}$/);
    const fresh=await Promise.all([f.call('bolsa_trabajo','POST',offer()),f.call('bolsa_trabajo','POST',offer())]);assert(fresh.every(r=>r.status===200));
    const list=await f.call('bolsa_trabajo');assert.equal(list.data.length,3);assert.equal(list.headers.get('Cache-Control'),'no-store');
    for(const job of list.data)for(const key of ['owner_access_hash','request_id','contacto','contacto_email'])assert(!Object.hasOwn(job,key));
    assert.equal(JSON.parse(f.kv.get('bolsa_trabajo')).length,0,'KV is never rewritten after cutover');
    const jobId=first.data.item.id;
    const missingConsent=await f.call('bolsa_trabajo/postular','POST',{job_id:jobId,nombre:'QA',email:'qa@example.invalid'});assert.equal(missingConsent.status,400);
    const app=application(jobId);
    const applications=await Promise.all([f.call('bolsa_trabajo/postular','POST',app),f.call('bolsa_trabajo/postular','POST',app)]);
    assert.deepEqual(applications.map(r=>r.status).sort(),[200,409]);
    const accepted=applications.find(r=>r.status===200);assert.equal(accepted.data.item.estado,'recibida');
    const state=await f.call('bolsa_trabajo/mi-postulacion','POST',{id:accepted.data.item.id,clave:accepted.data.clave_consulta});assert.equal(state.status,200);assert.equal(state.data.email,undefined);
    assert.equal((await f.call('bolsa_trabajo/mis-postulantes','POST',{job_id:jobId,clave:fresh[0].data.clave_contratante})).status,404);
    const inbox=await f.call('bolsa_trabajo/mis-postulantes','POST',{job_id:jobId,clave:first.data.clave_contratante});assert.equal(inbox.data.items.length,1);
    assert.equal((await f.call('bolsa_trabajo/mi-oferta/gestionar','POST',{job_id:jobId,clave:first.data.clave_contratante,accion:'cerrar'})).status,200);
    assert.equal((await f.call('bolsa_trabajo/postular','POST',application(jobId))).status,404);
    assert.equal((await f.call('bolsa_trabajo')).data.length,2);
    assert.equal((await f.call('bolsa_trabajo/mi-oferta/gestionar','POST',{job_id:jobId,clave:first.data.clave_contratante,accion:'renovar',dias:30})).status,200);
    assert.equal((await f.call('bolsa_trabajo')).data.length,3);
    assert.equal((await f.call('bolsa_trabajo/acceso/solicitar','POST',{})).status,503);
    assert.equal((await f.call('bolsa_trabajo/acceso/restablecer','POST',{})).status,503);
    assert.equal((await f.call('bolsa_trabajo','GET',undefined,false,'uadav-api.uadavstream.workers.dev')).status,503);
  }finally{f.close()}
});

test('CAS: cambios en ofertas diferentes se conservan; conflictos en la misma oferta revierten todo el lote',async()=>{
  const f=await fixture();
  try{
    await f.migrate();
    const a=await f.call('bolsa_trabajo','POST',offer()),b=await f.call('bolsa_trabajo','POST',offer());
    const one=uadavJobStore(f.env),two=uadavJobStore(f.env);
    const left=await one.read('bolsa_trabajo'),right=await two.read('bolsa_trabajo');
    left.find(x=>x.id===a.data.item.id).titulo='Cambio A';right.find(x=>x.id===b.data.item.id).titulo='Cambio B';
    await Promise.all([one.write('bolsa_trabajo',left),two.write('bolsa_trabajo',right)]);
    const live=await uadavJobStore(f.env).read('bolsa_trabajo');assert(live.some(x=>x.titulo==='Cambio A'));assert(live.some(x=>x.titulo==='Cambio B'));
    const stale=uadavJobStore(f.env),winning=uadavJobStore(f.env);const old=await stale.read('bolsa_trabajo'),newer=await winning.read('bolsa_trabajo');
    newer[0].titulo='Más reciente';await winning.write('bolsa_trabajo',newer);
    old[0].titulo='Obsoleto';old[1].titulo='No debe guardarse';
    await assert.rejects(stale.write('bolsa_trabajo',old),{jobCode:'JOB_WRITE_CONFLICT'});
    const final=await uadavJobStore(f.env).read('bolsa_trabajo');assert.equal(final[0].titulo,'Más reciente');assert.notEqual(final[1].titulo,'No debe guardarse');
    assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM job_store_checks').first()).n,0);
  }finally{f.close()}
});

test('recuperación: un solo canje, revocación de clave anterior y rollback ante fallo SQL',async()=>{
  const f=await fixture({bolsa_trabajo:[{id:'JOB-RECOVERY',titulo:'QA',owner_access_hash:oldHash,activo:true}],postulaciones_trabajo:[]});
  try{
    await f.migrate();const tokenHash='c'.repeat(64),nextHash=await digest(otherSecret),now=Date.now();
    await f.DB.prepare('INSERT INTO job_owner_recovery_v2(token_hash,job_id,credential_revision,expires_at,created_at) VALUES(?,?,1,?,?)').bind(tokenHash,'JOB-RECOVERY',now+60000,now).run();
    const redeem=()=>uadavJobRedeemRecovery(f.DB,{jobId:'JOB-RECOVERY',tokenHash,newSecretHash:nextHash});
    const attempts=await Promise.allSettled([redeem(),redeem()]);assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);
    assert.equal((await f.call('bolsa_trabajo/mis-postulantes','POST',{job_id:'JOB-RECOVERY',clave:secret})).status,404);
    assert.equal((await f.call('bolsa_trabajo/mis-postulantes','POST',{job_id:'JOB-RECOVERY',clave:otherSecret})).status,200);
    const failToken='d'.repeat(64);
    await f.DB.prepare('INSERT INTO job_owner_recovery_v2(token_hash,job_id,credential_revision,expires_at,created_at) VALUES(?,?,2,?,?)').bind(failToken,'JOB-RECOVERY',now+60000,now).run();
    await f.DB.prepare("CREATE TRIGGER injected_rotation_failure BEFORE UPDATE ON job_owner_credentials BEGIN SELECT RAISE(ABORT,'synthetic failure'); END").run();
    await assert.rejects(uadavJobRedeemRecovery(f.DB,{jobId:'JOB-RECOVERY',tokenHash:failToken,newSecretHash:oldHash}));
    assert.equal((await f.DB.prepare('SELECT consumed_at FROM job_owner_recovery_v2 WHERE token_hash=?').bind(failToken).first()).consumed_at,null);
    assert.equal((await f.DB.prepare('SELECT secret_hash FROM job_owner_credentials WHERE job_id=?').bind('JOB-RECOVERY').first()).secret_hash,nextHash);
    await f.DB.prepare('DROP TRIGGER injected_rotation_failure').run();
    await uadavJobRedeemRecovery(f.DB,{jobId:'JOB-RECOVERY',tokenHash:failToken,newSecretHash:oldHash});
    await assert.rejects(redeem());
  }finally{f.close()}
});

test('límites de intentos atómicos y esquema/migración ausentes: fallo cerrado',async()=>{
  const f=await fixture();
  try{
    const hits=await Promise.all(Array.from({length:20},()=>uadavJobRate(f.env,'synthetic-bucket',5,60000)));assert.equal(hits.filter(Boolean).length,5);
    f.env.JOB_STORE_D1='true';const notReady=await f.call('bolsa_trabajo');assert.equal(notReady.status,503);assert.equal(notReady.data.code,'JOB_MIGRATION_REQUIRED');
    await f.DB.prepare('DROP TABLE job_store_records').run();const missing=await f.call('bolsa_trabajo');assert.equal(missing.status,503);assert(!JSON.stringify(missing.data).includes('SELECT'));
  }finally{f.close()}
});

test('backup y restauración faltante: origen D1, autorización, idempotencia y rollback entre colecciones',async()=>{
  const f=await fixture();
  try{
    await f.migrate();const offerResult=await f.call('bolsa_trabajo','POST',offer()),jobId=offerResult.data.item.id;
    const appResult=await f.call('bolsa_trabajo/postular','POST',application(jobId));assert.equal(appResult.status,200);
    const exported=await f.call('v7/export','GET',undefined,true);assert.equal(exported.status,200);assert.equal(exported.data.job_storage,'d1');
    assert.equal(exported.data.kv.bolsa_trabajo.length,1);assert.equal(exported.data.kv.postulaciones_trabajo.length,1);assert.equal(exported.data.tables.job_store_records.length,2);
    const body={backup:exported.data,confirm:'RECUPERAR FALTANTES',confirm_second:'APLICAR RECUPERACION',external_backup_confirmed:true,dry_run:false};
    assert.equal((await f.call('admin/backup/jobs/restore-missing','POST',body)).status,401);
    assert.equal((await f.call('admin/backup/jobs/restore-missing','POST',body,true)).status,423);
    await f.DB.prepare('DELETE FROM job_store_records').run();
    f.env.ENABLE_JOB_D1_RESTORE='staging-tested';
    await f.DB.prepare("CREATE TRIGGER injected_restore_failure BEFORE INSERT ON job_store_records WHEN NEW.collection='postulaciones_trabajo' BEGIN SELECT RAISE(ABORT,'synthetic restore failure'); END").run();
    assert.equal((await f.call('admin/backup/jobs/restore-missing','POST',body,true)).status,409);
    assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM job_store_records').first()).n,0,'failed application restore rolls back offer restore');
    await f.DB.prepare('DROP TRIGGER injected_restore_failure').run();
    const restored=await f.call('admin/backup/jobs/restore-missing','POST',body,true);assert.equal(restored.status,200);assert.equal(restored.data.ofertas,1);assert.equal(restored.data.postulaciones,1);
    const replay=await f.call('admin/backup/jobs/restore-missing','POST',body,true);assert.equal(replay.status,200);assert.equal(replay.data.ofertas,0);assert.equal(replay.data.postulaciones,0);
    assert.equal((await f.call('bolsa_trabajo/mis-postulantes','POST',{job_id:jobId,clave:offerResult.data.clave_contratante})).data.items.length,1);
  }finally{f.close()}
});

test('vencimiento en D1 y cierre concurrente: no se aceptan postulaciones desde lecturas anteriores',async()=>{
  const f=await fixture({bolsa_trabajo:[{id:'JOB-EXPIRED',titulo:'Vencida',activo:true,fecha_limite:'2000-01-01',owner_access_hash:oldHash}],postulaciones_trabajo:[]});
  try{
    await f.migrate();assert.equal((await f.call('bolsa_trabajo')).data.length,0);
    assert.equal((await f.call('bolsa_trabajo/postular','POST',application('JOB-EXPIRED'))).status,404);
    assert.equal((await uadavJobMaintenance(f.env)).processed,1);
    assert.equal((await uadavJobStore(f.env).read('bolsa_trabajo'))[0].estado,'vencida');
    const published=await f.call('bolsa_trabajo','POST',offer()),id=published.data.item.id;
    const stale=uadavJobStore(f.env);await stale.read('bolsa_trabajo');const apps=await stale.read('postulaciones_trabajo');
    await f.call('bolsa_trabajo/mi-oferta/gestionar','POST',{job_id:id,clave:published.data.clave_contratante,accion:'cerrar'});
    apps.push({id:'POST-RACE-TEST',job_id:id,nombre:'QA',email:'qa@example.invalid'});
    await assert.rejects(stale.write('postulaciones_trabajo',apps),{jobCode:'JOB_WRITE_CONFLICT'});
    assert.equal((await uadavJobStore(f.env).read('postulaciones_trabajo')).length,0);
  }finally{f.close()}
});

test('migración paginada e interrumpida: retoma por lote sin duplicar datos',async()=>{
  const jobs=Array.from({length:7},(_,n)=>({id:'JOB-MIGRATION-'+n,titulo:'QA '+n,activo:true,owner_access_hash:oldHash}));
  const f=await fixture({bolsa_trabajo:jobs,postulaciones_trabajo:[]});
  try{
    f.env.JOB_STORE_MAINTENANCE='true';const dry=await uadavJobMigration(f.env);
    const args={dry_run:false,confirm:'MIGRAR_BOLSA_STAGING',fingerprint:dry.fingerprint,offset:0};
    const first=await uadavJobMigration(f.env,args);assert.equal(first.next_offset,3);assert.equal(first.complete,false);
    await uadavJobMigration(f.env,args);assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM job_store_records').first()).n,3);
    let next=first.next_offset;do{const batch=await uadavJobMigration(f.env,{...args,offset:next});next=batch.next_offset}while(next!==null);
    assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM job_owner_credentials').first()).n,7);
    assert.equal((await f.DB.prepare("SELECT value FROM job_store_meta WHERE key='migration_ready'").first()).value,'true');
    assert.deepEqual(JSON.parse(f.kv.get('bolsa_trabajo')),jobs);
  }finally{f.close()}
});

test('importaciones externas: revisión posterior identificada, origen validado y duplicados atómicos',async()=>{
  const f=await fixture();
  try{
    await f.migrate();
    const external={titulo:'DEMO · Convocatoria externa',descripcion:'Convocatoria ficticia para probar la importación externa.',source:'Fuente QA',source_url:'https://example.org/convocatoria',fecha_limite:'2099-12-31',revisado_por_admin:true};
    assert.equal((await f.call('admin/federated/import','POST',{kind:'job',items:[external]})).status,401);
    const responses=await Promise.all([f.call('admin/federated/import','POST',{kind:'job',items:[external]},true),f.call('admin/federated/import','POST',{kind:'job',items:[external]},true)]);
    assert(responses.some(x=>x.status===200));
    const listed=await f.call('bolsa_trabajo');assert.equal(listed.data.length,1);assert.equal(listed.data[0].origen,'externo');assert.equal(listed.data[0].source,'Fuente QA');
    const pending={...external,source_url:'https://example.org/pending',revisado_por_admin:false};
    assert.equal((await f.call('admin/federated/import','POST',{kind:'job',items:[pending]},true)).status,200);
    assert.equal((await f.call('bolsa_trabajo')).data.length,1,'unreviewed external item is not public');
    assert.equal((await f.call('admin/federated/import','POST',{kind:'job',items:[{...external,source_url:'https://user:password@example.org/private'}]},true)).status,400);
    assert.equal((await f.DB.prepare("SELECT COUNT(*) AS n FROM job_store_records WHERE collection='bolsa_trabajo'").first()).n,2);
  }finally{f.close()}
});
