/* Source for the single-file Worker job storage block. Embedded by
 * scripts/embed-job-store.mjs; never deployed separately. STAGING ONLY. */
const UADAV_JOB_COLLECTIONS = ['bolsa_trabajo','postulaciones_trabajo'];
const UADAV_JOB_CLOSED_STATES = new Set(['closed','cerrado','cerrada','cancelled','cancelado','cancelada','deleted','eliminado','eliminada','expired','vencido','vencida','hidden','oculto','oculta','paused','pausado','pausada','cerrada_por_contratante','cerrado_por_contratante','archivada','archivado','rejected','rechazada','rechazado','no_confirmada','pendiente_revision','pending_review','pending']);
function uadavJobToday(now=Date.now()){
  return new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Argentina/Buenos_Aires'}).format(new Date(now));
}
function uadavJobDeadlineAfter(days=30,now=Date.now()){
  return new Date(Date.parse(uadavJobToday(now)+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);
}
function uadavJobValidDate(value){
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value))&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
}
function uadavJobIsPublic(job){
  return !!job&&job.activo!==false&&job.activo!==0&&![job.estado,job.status].some(x=>UADAV_JOB_CLOSED_STATES.has(String(x||'').trim().toLowerCase()))&&(!job.fecha_limite||(uadavJobValidDate(job.fecha_limite)&&job.fecha_limite>=uadavJobToday()));
}
function uadavJobError(code, message, status=503) {
  return Object.assign(new Error(message), {jobCode:code, status});
}
function uadavJobDB(env) {
  if(!env.DB)throw uadavJobError('JOB_DB_UNAVAILABLE','La gestión laboral no está disponible. Intentá más tarde.');
  return typeof env.DB.withSession==='function'?env.DB.withSession('first-primary'):env.DB;
}
function uadavJobPayload(item) {
  const {owner_access_hash,...value}=item;
  return JSON.stringify(value);
}
function uadavJobGuard(db, condition, args=[]) {
  const id=crypto.randomUUID();
  return [db.prepare('INSERT INTO job_store_checks(id,valid) SELECT ?, CASE WHEN '+condition+' THEN 1 ELSE 0 END').bind(id,...args),
    db.prepare('DELETE FROM job_store_checks WHERE id=?').bind(id)];
}
async function uadavJobRows(db, collection) {
  const records=[];
  for(let offset=0;;offset+=250){
    const page=await db.prepare('SELECT r.*,c.secret_hash FROM job_store_records r LEFT JOIN job_owner_credentials c ON r.collection=\'bolsa_trabajo\' AND c.job_id=r.id WHERE r.collection=? ORDER BY r.id LIMIT 251 OFFSET ?').bind(collection,offset).all();
    const rows=page.results||[];records.push(...rows.slice(0,250));
    if(records.length>2000||records.length===2000&&rows.length>250)throw uadavJobError('JOB_CAPACITY','La colección requiere revisión administrativa.');
    if(rows.length<=250)break;
  }
  return records;
}
function uadavJobStore(env) {
  const db=uadavJobDB(env),snapshots=new Map();let ready;
  async function checkReady(){
    if(ready)return;
    const state=await db.prepare("SELECT value FROM job_store_meta WHERE key='migration_ready'").first();
    if(state?.value!=='true')throw uadavJobError('JOB_MIGRATION_REQUIRED','La migración laboral todavía no está validada.');
    ready=true;
  }
  async function read(collection){
    await checkReady();
    const rows=await uadavJobRows(db,collection);
    snapshots.set(collection,new Map(rows.map(r=>[r.id,{...r}])));
    return rows.map(r=>({...JSON.parse(r.data_json),...(r.secret_hash?{owner_access_hash:r.secret_hash}:{})}));
  }
  async function writeCollections(collections,{restoring=false,accountLink=null,accountAuthorization=null,restoreAccountLinks=[],restoreExpiryNotices=[]}={}){
    await checkReady();
    const statements=[];
    const accountFeatures=await uadavJobAccountFeatures(db);
    for(const link of [accountLink,accountAuthorization].filter(Boolean)){
      if(!accountFeatures)throw uadavJobError('JOB_ACCOUNT_SCHEMA_REQUIRED','Mis trabajos todavía no está preparado.',503);
      if(!UADAV_JOB_COLLECTIONS.includes(link.collection)||!collections[link.collection]?.some(item=>item.id===link.recordId))throw uadavJobError('JOB_ACCOUNT_RECORD','Gestión de cuenta inválida.',400);
      statements.push(...uadavJobAccountGuards(db,link.identity));
      if(link===accountAuthorization)statements.push(...uadavJobAccountMembershipGuard(db,link.identity,link.collection,link.recordId));
    }
    for(const [collection,values] of Object.entries(collections)){
      if(!UADAV_JOB_COLLECTIONS.includes(collection)||!Array.isArray(values))throw uadavJobError('JOB_INVALID_COLLECTION','Colección inválida.',400);
      const before=snapshots.get(collection);
      if(!before)throw uadavJobError('JOB_SNAPSHOT_REQUIRED','Volvé a cargar los datos antes de guardar.',409);
      const ids=new Set();
      for(const item of values){
        if(!item||typeof item.id!=='string'||ids.has(item.id))throw uadavJobError('JOB_DUPLICATE_ID','El envío contiene identificadores duplicados.',409);
        ids.add(item.id);
        const old=before.get(item.id),data=uadavJobPayload(item),requestId=String(item.request_id||'')||null;
        if(old?.data_json===data)continue;
        if(old){
          statements.push(...uadavJobGuard(db,'EXISTS(SELECT 1 FROM job_store_records WHERE collection=? AND id=? AND revision=?)',[collection,item.id,old.revision]));
          statements.push(db.prepare('UPDATE job_store_records SET data_json=?,request_id=?,revision=revision+1,updated_at=? WHERE collection=? AND id=?').bind(data,requestId,new Date().toISOString(),collection,item.id));
          if(accountFeatures&&collection==='postulaciones_trabajo'&&JSON.parse(old.data_json).estado!==item.estado)statements.push(uadavJobAccountNotice(db,{id:'job-status:'+item.id+':'+(old.revision+1),collection,recordId:item.id,title:'Cambió el estado de tu postulación',message:'Tu postulación tiene una actualización. Abrí Mis trabajos en Mi Perfil para consultar el estado.'}));
        }else{
          statements.push(...uadavJobGuard(db,'(SELECT COUNT(*) FROM job_store_records WHERE collection=?) < 2000',[collection]));
          if(collection==='postulaciones_trabajo'){
            const parent=snapshots.get('bolsa_trabajo')?.get(String(item.job_id));
            if(!restoring){
              if(!parent)throw uadavJobError('JOB_PARENT_SNAPSHOT_REQUIRED','Volvé a cargar la oportunidad antes de postularte.',409);
              if(!uadavJobIsPublic(JSON.parse(parent.data_json)))throw uadavJobError('JOB_UNAVAILABLE','Esta oportunidad ya no recibe postulaciones.',409);
              statements.push(...uadavJobGuard(db,"EXISTS(SELECT 1 FROM job_store_records WHERE collection='bolsa_trabajo' AND id=? AND revision=?)",[String(item.job_id),parent.revision]));
            }
            // Recheck availability inside the same transaction as the application.
            statements.push(...uadavJobGuard(db,"EXISTS(SELECT 1 FROM job_store_records WHERE collection='bolsa_trabajo' AND id=?)",[String(item.job_id)]));
          }
          statements.push(db.prepare('INSERT INTO job_store_records(collection,id,data_json,request_id,updated_at) VALUES(?,?,?,?,?)').bind(collection,item.id,data,requestId,new Date().toISOString()));
          if(collection==='bolsa_trabajo'&&item.owner_access_hash){
            if(!/^[a-f0-9]{64}$/.test(item.owner_access_hash))throw uadavJobError('JOB_INVALID_CREDENTIAL','Credencial inválida.',400);
            statements.push(...uadavJobGuard(db,'NOT EXISTS(SELECT 1 FROM job_owner_credentials WHERE job_id=? AND secret_hash<>?)',[item.id,item.owner_access_hash]));
            statements.push(db.prepare('INSERT OR IGNORE INTO job_owner_credentials(job_id,secret_hash,revision,updated_at) VALUES(?,?,1,?)').bind(item.id,item.owner_access_hash,new Date().toISOString()));
          }
          if(accountLink?.collection===collection&&accountLink.recordId===item.id)statements.push(db.prepare('INSERT INTO job_account_links(collection,record_id,account_id,linked_at) VALUES(?,?,?,?)').bind(collection,item.id,accountLink.identity.accountId,new Date().toISOString()));
          if(accountFeatures&&!restoring&&collection==='postulaciones_trabajo')statements.push(uadavJobAccountNotice(db,{id:'job-application:'+item.id,collection:'bolsa_trabajo',recordId:String(item.job_id),title:'Tu oferta recibió una postulación',message:'Tenés una nueva postulación. Abrí Mis trabajos en Mi Perfil para revisar los datos autorizados.'}));
        }
      }
      for(const [id,old] of before)if(!ids.has(id)){
        statements.push(...uadavJobGuard(db,'EXISTS(SELECT 1 FROM job_store_records WHERE collection=? AND id=? AND revision=?)',[collection,id,old.revision]));
        statements.push(db.prepare('DELETE FROM job_store_records WHERE collection=? AND id=?').bind(collection,id));
        // Preserve credentials and applications for audit/explicit restoration.
      }
    }
    if(restoring){const ids=(collections.bolsa_trabajo||[]).filter(item=>!snapshots.get('bolsa_trabajo')?.has(item.id)).map(item=>item.id);statements.push(...await uadavJobRestoredRecoveryStatements(db,ids));}
    const restoredIndices=[];
    if(restoreAccountLinks.length){
      if(!restoring||!accountFeatures||restoreAccountLinks.length>5)throw uadavJobError('JOB_ACCOUNT_RESTORE','No se preparó la restauración de vínculos de cuenta.',400);
      for(const link of restoreAccountLinks){
        if(snapshots.get(link.collection)?.has(link.record_id)||!collections[link.collection]?.some(item=>item.id===link.record_id))throw uadavJobError('JOB_ACCOUNT_RESTORE','Solo se pueden recuperar vínculos junto con sus registros faltantes.',409);
        statements.push(...uadavJobGuard(db,'NOT EXISTS(SELECT 1 FROM job_account_links WHERE collection=? AND record_id=? AND account_id<>?)',[link.collection,link.record_id,link.account_id]));
        restoredIndices.push(statements.length);
        statements.push(db.prepare('INSERT OR IGNORE INTO job_account_links(collection,record_id,account_id,linked_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM audience_accounts WHERE id=?) AND NOT EXISTS(SELECT 1 FROM audience_deletions WHERE account_id=?)').bind(link.collection,link.record_id,link.account_id,link.linked_at,link.account_id,link.account_id));
      }
    }
    const expiryIndices=[];
    if(restoreExpiryNotices.length){
      if(!restoring||!await uadavJobExpiryAvailable(db)||restoreExpiryNotices.length>100)throw uadavJobError('JOB_EXPIRY_RESTORE','No se preparó la recuperación del historial de avisos.',400);
      for(const row of restoreExpiryNotices){
        if(snapshots.get('bolsa_trabajo')?.has(row.job_id)||!collections.bolsa_trabajo?.some(item=>item.id===row.job_id))throw uadavJobError('JOB_EXPIRY_RESTORE','Solo se recupera el historial junto con sus ofertas faltantes.',409);
        expiryIndices.push(statements.length);
        statements.push(db.prepare('INSERT OR IGNORE INTO job_expiry_notices(notice_id,job_id,deadline,kind,account_id,run_id,created_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM audience_accounts WHERE id=?) AND NOT EXISTS(SELECT 1 FROM audience_deletions WHERE account_id=?)').bind(row.notice_id,row.job_id,row.deadline,row.kind,row.account_id,row.run_id,row.created_at,row.account_id,row.account_id));
      }
    }
    if(!statements.length)return {account_links_restored:0,expiry_notices_restored:0};
    let results;
    try{results=await db.batch(statements)}catch(e){
      if(String(e?.message||'').includes('job_store_records.collection, job_store_records.request_id'))throw uadavJobError('JOB_REQUEST_EXISTS','Esta solicitud ya fue recibida. No vuelvas a enviarla.',409);
      throw uadavJobError('JOB_WRITE_CONFLICT','No se confirmó el guardado. Los datos pudieron cambiar; recargá antes de volver a intentar.',409);
    }
    for(const collection of Object.keys(collections))await read(collection);
    return {account_links_restored:restoredIndices.reduce((sum,index)=>sum+Number(results[index]?.meta?.changes||0),0),expiry_notices_restored:expiryIndices.reduce((sum,index)=>sum+Number(results[index]?.meta?.changes||0),0)};
  }
  return {read,write:(collection,values,options)=>writeCollections({[collection]:values},options),writeCollections};
}
async function uadavJobRate(env, bucket, limit, windowMs) {
  const db=uadavJobDB(env),now=Date.now();
  const row=await db.prepare('INSERT INTO job_store_rates(bucket,hits,resets_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN resets_at<=? THEN 1 ELSE hits+1 END,resets_at=CASE WHEN resets_at<=? THEN excluded.resets_at ELSE resets_at END RETURNING hits').bind(bucket,now+windowMs,now,now).first();
  return Number(row?.hits)<=limit;
}
async function uadavJobMaintenance(env){
  if(env.JOB_STORE_D1!=='true'||env.JOB_STORE_MAINTENANCE==='true')return {processed:0};
  const store=uadavJobStore(env),jobs=await store.read('bolsa_trabajo'),today=uadavJobToday(),now=Date.now();let processed=0;
  for(const job of jobs){
    const expired=uadavJobValidDate(job.fecha_limite)&&job.fecha_limite<today;
    const explicitlyClosed=[job.estado,job.status].some(value=>{const state=String(value||'').trim().toLowerCase();return UADAV_JOB_CLOSED_STATES.has(state)&&!UADAV_JOB_EXPIRED_STATES.has(state)});
    const stale=job.origen==='externo'&&job.managed!==true&&job.claimed!==true&&job.source_auto_sync===true&&now-Date.parse(job.last_seen_at||job.actualizado||job.importado_en||0)>72*3600000;
    if(job.activo!==false&&job.activo!==0&&!explicitlyClosed&&(expired||stale)&&processed<5){job.activo=false;job.estado=expired?'vencida':'no_confirmada';job.actualizado=new Date().toISOString();processed++}
  }
  if(processed)await store.write('bolsa_trabajo',jobs);
  await uadavJobDB(env).batch([
    uadavJobDB(env).prepare('DELETE FROM job_store_rates WHERE resets_at<?').bind(now-86400000),
    uadavJobDB(env).prepare('DELETE FROM job_owner_recovery_v2 WHERE expires_at<?').bind(now-86400000)
  ]);
  const notices=await uadavJobExpiryAvailable(uadavJobDB(env))?await uadavJobExpiryReview(env,{dryRun:false}):{available:false};
  return {processed,notices};
}
// Not exposed by an HTTP route. Email recovery remains disabled until remote QA.
async function uadavJobRedeemRecovery(db, {jobId,tokenHash,newSecretHash,now=Date.now()}) {
  if(!/^JOB-[A-Z0-9-]{3,80}$/.test(jobId)||!/^[a-f0-9]{64}$/.test(tokenHash)||!/^[a-f0-9]{64}$/.test(newSecretHash))throw uadavJobError('JOB_RECOVERY_INVALID','Enlace inválido o vencido.',400);
  const row=await db.prepare('SELECT t.credential_revision FROM job_owner_recovery_v2 t JOIN job_owner_credentials c ON c.job_id=t.job_id AND c.revision=t.credential_revision WHERE t.token_hash=? AND t.job_id=? AND t.consumed_at IS NULL AND t.expires_at>?').bind(tokenHash,jobId,now).first();
  if(!row)throw uadavJobError('JOB_RECOVERY_INVALID','Enlace inválido o vencido.',400);
  const statements=[...uadavJobGuard(db,'EXISTS(SELECT 1 FROM job_owner_recovery_v2 t JOIN job_owner_credentials c ON c.job_id=t.job_id AND c.revision=t.credential_revision WHERE t.token_hash=? AND t.job_id=? AND t.consumed_at IS NULL AND t.expires_at>? AND c.revision=?)',[tokenHash,jobId,now,row.credential_revision]),
    db.prepare('UPDATE job_owner_recovery_v2 SET consumed_at=? WHERE token_hash=?').bind(now,tokenHash),
    db.prepare('UPDATE job_owner_credentials SET secret_hash=?,revision=revision+1,updated_at=? WHERE job_id=?').bind(newSecretHash,new Date(now).toISOString(),jobId)];
  if(await uadavJobAccountFeatures(db))statements.push(db.prepare("DELETE FROM job_account_links WHERE collection='bolsa_trabajo' AND record_id=?").bind(jobId));
  try{await db.batch(statements)}catch{throw uadavJobError('JOB_RECOVERY_INVALID','No se confirmó la recuperación. El enlace pudo ser utilizado.',409)}
  return {job_id:jobId,revision:row.credential_revision+1};
}
async function uadavJobMigration(env,body={}) {
  const db=uadavJobDB(env),collections={};
  for(const collection of UADAV_JOB_COLLECTIONS){
    const raw=await env.UADAV_DB.get(collection);let rows;
    try{rows=raw?JSON.parse(raw):[]}catch{throw uadavJobError('JOB_SOURCE_INVALID','El origen KV no pudo validarse.',409)}
    if(!Array.isArray(rows)||rows.length>2000)throw uadavJobError('JOB_SOURCE_INVALID','El origen KV requiere revisión.',409);
    collections[collection]=rows;
  }
  const all=Object.entries(collections).flatMap(([collection,rows])=>rows.map(item=>({collection,item}))),seen=new Set(),requests=new Set(),jobIds=new Set(collections.bolsa_trabajo.map(x=>String(x?.id)));
  for(const {collection,item} of all){
    const pattern=collection==='bolsa_trabajo'?/^JOB-[A-Z0-9-]{3,80}$/i:/^POST-[A-Z0-9-]{5,80}$/i;
    if(!item||!pattern.test(item.id)||seen.has(collection+'|'+item.id))throw uadavJobError('JOB_SOURCE_INVALID','IDs inválidos o duplicados en el origen.',409);
    seen.add(collection+'|'+item.id);
    if(item.request_id){if(requests.has(collection+'|'+item.request_id))throw uadavJobError('JOB_SOURCE_INVALID','Solicitudes duplicadas en el origen.',409);requests.add(collection+'|'+item.request_id)}
    if(item.owner_access_hash&&!/^[a-f0-9]{64}$/.test(item.owner_access_hash))throw uadavJobError('JOB_SOURCE_INVALID','Credenciales inválidas en el origen.',409);
    if(collection==='postulaciones_trabajo'&&!jobIds.has(String(item.job_id)))throw uadavJobError('JOB_SOURCE_INVALID','Hay postulaciones sin oferta asociada.',409);
  }
  const fingerprint=await uadavDigest(JSON.stringify(collections));
  if(body.dry_run!==false)return {success:true,dry_run:true,counts:Object.fromEntries(Object.entries(collections).map(([k,v])=>[k,v.length])),fingerprint};
  if(env.JOB_STORE_MAINTENANCE!=='true'||env.JOB_STORE_D1==='true')throw uadavJobError('JOB_MAINTENANCE_REQUIRED','Pausá las escrituras de Bolsa en staging antes de migrar.',423);
  if(body.confirm!=='MIGRAR_BOLSA_STAGING'||body.fingerprint!==fingerprint)throw uadavJobError('JOB_SOURCE_CHANGED','Repetí la simulación y confirmá su huella actual.',409);
  const offset=Number(body.offset||0);if(!Number.isInteger(offset)||offset<0||offset>all.length)throw uadavJobError('JOB_OFFSET_INVALID','Lote inválido.',400);
  await db.prepare("INSERT OR IGNORE INTO job_store_meta(key,value) VALUES('migration_source',?)").bind(fingerprint).run();
  const source=await db.prepare("SELECT value FROM job_store_meta WHERE key='migration_source'").first();
  if(source?.value!==fingerprint)throw uadavJobError('JOB_SOURCE_CHANGED','El origen cambió después de iniciar la migración.',409);
  const statements=[];
  for(const {collection,item} of all.slice(offset,offset+3)){
    const data=uadavJobPayload(item);
    statements.push(...uadavJobGuard(db,'NOT EXISTS(SELECT 1 FROM job_store_records WHERE collection=? AND id=? AND data_json<>?)',[collection,item.id,data]));
    statements.push(db.prepare('INSERT OR IGNORE INTO job_store_records(collection,id,data_json,request_id,updated_at) VALUES(?,?,?,?,?)').bind(collection,item.id,data,String(item.request_id||'')||null,new Date().toISOString()));
    if(collection==='bolsa_trabajo'&&item.owner_access_hash){
      statements.push(...uadavJobGuard(db,'NOT EXISTS(SELECT 1 FROM job_owner_credentials WHERE job_id=? AND secret_hash<>?)',[item.id,item.owner_access_hash]));
      statements.push(db.prepare('INSERT OR IGNORE INTO job_owner_credentials(job_id,secret_hash,revision,updated_at) VALUES(?,?,1,?)').bind(item.id,item.owner_access_hash,new Date().toISOString()));
    }
  }
  if(statements.length)await db.batch(statements);
  const next=Math.min(offset+3,all.length);let complete=false;
  if(next===all.length){
    for(const collection of UADAV_JOB_COLLECTIONS){
      const migrated=await uadavJobRows(db,collection),expected=new Map(collections[collection].map(x=>[x.id,x]));
      if(migrated.length!==expected.size||migrated.some(r=>!expected.has(r.id)||r.data_json!==uadavJobPayload(expected.get(r.id))||(expected.get(r.id).owner_access_hash&&r.secret_hash!==expected.get(r.id).owner_access_hash)))throw uadavJobError('JOB_MIGRATION_MISMATCH','La comparación completa no coincide; no activar D1.',409);
    }
    await db.prepare("INSERT INTO job_store_meta(key,value) VALUES('migration_ready','true') ON CONFLICT(key) DO UPDATE SET value='true'").run();complete=true;
  }
  return {success:true,dry_run:false,processed:next-offset,next_offset:complete?null:next,complete,fingerprint};
}
