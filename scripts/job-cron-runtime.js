/* Scheduled entrypoint for the staging wrapper only. No general maintenance,
 * podcast, email, push or external-source dispatch is called from here. */
const UADAV_JOB_CRON_SCHEDULE='*/15 * * * *';
const UADAV_JOB_CRON_KEYS={lease:'cron:lease',run:'cron:last_run',success:'cron:last_success'};
// Scheduled handlers have a 15-minute lifetime. A longer lease prevents a
// second invocation from entering while an earlier one can still be alive.
const UADAV_JOB_CRON_LEASE_MS=16*60*1000;
function uadavJobCronStamp(value){return typeof value==='string'&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value}
function uadavJobCronTime(value){return Number.isSafeInteger(value)&&value>0&&value<8640000000000000}
function uadavJobCronRecord(value){
  if(!value||value.version!==1||!['success','error'].includes(value.status)||!uadavJobCronTime(value.scheduled_time)||!uadavJobCronStamp(value.started_at)||!uadavJobCronStamp(value.completed_at)||value.completed_at<value.started_at)return null;
  const record={version:1,status:value.status,scheduled_time:value.scheduled_time,started_at:value.started_at,completed_at:value.completed_at};
  if(value.status==='success'){
    if(!['processed','emitted','recorded'].every(key=>Number.isInteger(value[key])&&value[key]>=0&&value[key]<=5)||value.emitted>value.recorded)return null;
    for(const key of ['processed','emitted','recorded'])record[key]=value[key];
    if(value.mail_retention!==undefined){const m=value.mail_retention;if(!m||typeof m.available!=='boolean'||!['expired','pruned','metadata_pruned'].every(k=>Number.isInteger(m[k])&&m[k]>=0&&m[k]<=25))return null;record.mail_retention={available:m.available,expired:m.expired,pruned:m.pruned,metadata_pruned:m.metadata_pruned};}
  }
  return record;
}
async function uadavJobCronSnapshot(db){
  const rows=(await db.prepare('SELECT key,value FROM job_store_meta WHERE key IN (?,?,?,?)').bind('migration_ready',...Object.values(UADAV_JOB_CRON_KEYS)).all()).results||[],values=new Map(rows.map(row=>[row.key,row.value]));
  function read(key){try{return values.has(key)?JSON.parse(values.get(key)):null}catch{throw uadavJobError('JOB_CRON_HISTORY','No se pudo comprobar el historial de la revisión automática.')}}
  const rawLease=read(UADAV_JOB_CRON_KEYS.lease),rawRun=read(UADAV_JOB_CRON_KEYS.run),rawSuccess=read(UADAV_JOB_CRON_KEYS.success);
  const lease=rawLease&&typeof rawLease.owner==='string'&&/^[a-f0-9-]{36}$/.test(rawLease.owner)&&uadavJobCronTime(rawLease.until)&&uadavJobCronTime(rawLease.scheduled_time)&&uadavJobCronStamp(rawLease.started_at)?rawLease:null;
  const lastRun=uadavJobCronRecord(rawRun),lastSuccess=uadavJobCronRecord(rawSuccess);
  if(values.has(UADAV_JOB_CRON_KEYS.lease)&&!lease||values.has(UADAV_JOB_CRON_KEYS.run)&&!lastRun||values.has(UADAV_JOB_CRON_KEYS.success)&&lastSuccess?.status!=='success')throw uadavJobError('JOB_CRON_HISTORY','No se pudo comprobar el historial de la revisión automática.');
  return {ready:values.get('migration_ready')==='true',lease,lastRun,lastSuccess};
}
async function uadavJobCronStatus(env){
  const base={success:true,scope:'bolsa-staging',enabled:env.JOB_STAGING_CRON==='bolsa-only',paused:env.JOB_STORE_MAINTENANCE==='true',ready:false,schedule:UADAV_JOB_CRON_SCHEDULE,running:false,interrupted:false,attempt_started_at:null,last_run:null,last_success:null};
  if(env.JOB_STORE_D1!=='true'||!env.DB)return base;
  try{
    const db=uadavJobDB(env),state=await uadavJobCronSnapshot(db),ready=state.ready&&await uadavJobExpiryAvailable(db);
    return {...base,ready,running:!!state.lease&&state.lease.until>Date.now(),interrupted:!!state.lease&&state.lease.until<=Date.now(),attempt_started_at:state.lease?.started_at||null,last_run:state.lastRun,last_success:state.lastSuccess};
  }catch{throw uadavJobError('JOB_CRON_UNAVAILABLE','No se pudo consultar la revisión automática de Bolsa. Intentá más tarde.')}
}
async function uadavJobScheduled(event,env){
  if(env.JOB_STAGING_CRON!=='bolsa-only')return {executed:false,reason:'disabled'};
  if(event?.cron!==UADAV_JOB_CRON_SCHEDULE)return {executed:false,reason:'schedule'};
  if(!uadavJobCronTime(event.scheduledTime))return {executed:false,reason:'event'};
  if(env.JOB_STORE_D1!=='true')return {executed:false,reason:'storage'};
  if(env.JOB_STORE_MAINTENANCE==='true')return {executed:false,reason:'maintenance'};
  const now=Date.now(),owner=crypto.randomUUID(),startedAt=new Date(now).toISOString();let db,acquired=false;
  const lease={owner,until:now+UADAV_JOB_CRON_LEASE_MS,scheduled_time:event.scheduledTime,started_at:startedAt};
  const release=()=>db.prepare("DELETE FROM job_store_meta WHERE key=? AND json_extract(value,'$.owner')=?").bind(UADAV_JOB_CRON_KEYS.lease,owner).run();
  async function finish(status,result){
    const record={version:1,status,scheduled_time:event.scheduledTime,started_at:startedAt,completed_at:new Date().toISOString(),...(status==='success'?{processed:result.processed,emitted:result.notices.emitted,recorded:result.notices.recorded,...(result.mail_retention?{mail_retention:result.mail_retention}:{})}:{})};
    if(!uadavJobCronRecord(record))throw uadavJobError('JOB_CRON_RESULT','No se pudo confirmar la revisión automática de Bolsa.');
    const put=key=>db.prepare('INSERT INTO job_store_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,JSON.stringify(record));
    await db.batch([...uadavJobGuard(db,"EXISTS(SELECT 1 FROM job_store_meta WHERE key=? AND json_extract(value,'$.owner')=?)",[UADAV_JOB_CRON_KEYS.lease,owner]),put(UADAV_JOB_CRON_KEYS.run),...(status==='success'?[put(UADAV_JOB_CRON_KEYS.success)]:[]),db.prepare("DELETE FROM job_store_meta WHERE key=? AND json_extract(value,'$.owner')=?").bind(UADAV_JOB_CRON_KEYS.lease,owner)]);
    acquired=false;return record;
  }
  try{
    db=uadavJobDB(env);
    const state=await uadavJobCronSnapshot(db);
    if(!state.ready||!await uadavJobExpiryAvailable(db))throw uadavJobError('JOB_CRON_NOT_READY','La revisión automática de Bolsa todavía no está preparada.');
    if(state.lastSuccess?.scheduled_time>=event.scheduledTime)return {executed:false,reason:'completed'};
    const claimed=await db.prepare("INSERT INTO job_store_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE json_extract(job_store_meta.value,'$.until')<=?").bind(UADAV_JOB_CRON_KEYS.lease,JSON.stringify(lease),now).run();
    if(claimed.meta?.changes!==1)return {executed:false,reason:'running'};
    acquired=true;
    // Recheck after acquiring the lease: another invocation may have completed
    // between the initial snapshot and the claim.
    const current=await uadavJobCronSnapshot(db);
    if(current.lastSuccess?.scheduled_time>=event.scheduledTime){await release();acquired=false;return {executed:false,reason:'completed'}}
    const result=await uadavJobMaintenance(env);
    result.mail_retention=await uadavJobRecoveryMaintenance(env);
    await uadavAccountEmailRetention(env);
    const record=await finish('success',result);
    return {executed:true,...record};
  }catch{
    if(acquired){try{await finish('error')}catch{try{await release()}catch{}}}
    throw uadavJobError('JOB_CRON_FAILED','No se confirmó la revisión automática de Bolsa. La siguiente ejecución podrá reintentar lo pendiente.');
  }
}
