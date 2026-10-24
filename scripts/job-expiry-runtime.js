/* Internal account reminders only. No email, push dispatch or cron creation. */
const UADAV_JOB_EXPIRY_DAYS=3;
const UADAV_JOB_EXPIRED_STATES=new Set(['expired','vencido','vencida']);
async function uadavJobExpiryAvailable(db){
  const row=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='job_expiry_notices'").first();
  return !!row&&await uadavJobAccountFeatures(db);
}
function uadavJobExpiryKind(job,today,until,now){
  if(!uadavJobValidDate(job?.fecha_limite))return null;
  const states=[job.estado,job.status].map(x=>String(x||'').trim().toLowerCase());
  if(states.some(x=>UADAV_JOB_CLOSED_STATES.has(x)&&!UADAV_JOB_EXPIRED_STATES.has(x)))return null;
  const active=job.activo!==false&&job.activo!==0;
  const stale=job.origen==='externo'&&job.managed!==true&&job.claimed!==true&&job.source_auto_sync===true&&now-Date.parse(job.last_seen_at||job.actualizado||job.importado_en||0)>72*3600000;
  if(stale)return null;
  if(job.fecha_limite<today&&(active||states.some(x=>UADAV_JOB_EXPIRED_STATES.has(x))))return 'expired';
  if(active&&!states.some(x=>UADAV_JOB_EXPIRED_STATES.has(x))&&job.fecha_limite>=today&&job.fecha_limite<=until)return 'soon';
  return null;
}
async function uadavJobExpiryId(jobId,deadline,kind,accountId){
  return 'job-expiry:'+await uadavDigest(JSON.stringify([jobId,deadline,kind,accountId]));
}
async function uadavJobExpiryReview(env,{dryRun=true,now=Date.now(),fingerprint}={}){
  if(env.JOB_STORE_D1!=='true')throw uadavJobError('JOB_EXPIRY_UNAVAILABLE','Los avisos de ofertas todavía no están preparados.',503);
  if(!dryRun&&env.JOB_STORE_MAINTENANCE==='true')throw uadavJobError('JOB_MAINTENANCE','Bolsa está en mantenimiento. No se enviaron avisos.',423);
  const db=uadavJobDB(env);
  if(!await uadavJobExpiryAvailable(db))throw uadavJobError('JOB_EXPIRY_SCHEMA_REQUIRED','Los avisos de ofertas todavía no están preparados en staging.',503);
  const ready=await db.prepare("SELECT value FROM job_store_meta WHERE key='migration_ready'").first();
  if(ready?.value!=='true')throw uadavJobError('JOB_MIGRATION_REQUIRED','La migración laboral todavía no está validada.',503);
  const today=uadavJobToday(now),until=new Date(Date.parse(today+'T12:00:00Z')+UADAV_JOB_EXPIRY_DAYS*86400000).toISOString().slice(0,10),candidates=[];
  for(let offset=0;;offset+=250){
    const result=await db.prepare(`SELECT r.id,r.data_json,r.revision,l.account_id,l.linked_at FROM job_store_records r
      JOIN job_account_links l ON l.collection=r.collection AND l.record_id=r.id
      JOIN audience_accounts a ON a.id=l.account_id
      LEFT JOIN job_expiry_notices n ON n.job_id=r.id AND n.deadline=json_extract(r.data_json,'$.fecha_limite') AND n.account_id=l.account_id
        AND n.kind=CASE WHEN json_extract(r.data_json,'$.fecha_limite')<? THEN 'expired' ELSE 'soon' END
      WHERE r.collection='bolsa_trabajo' AND n.notice_id IS NULL
        AND json_extract(r.data_json,'$.fecha_limite')<=?
        AND NOT EXISTS(SELECT 1 FROM audience_deletions d WHERE d.account_id=a.id)
      ORDER BY json_extract(r.data_json,'$.fecha_limite'),r.id LIMIT 251 OFFSET ?`).bind(today,until,offset).all();
    const rows=result.results||[];
    if(offset+rows.length>2000)throw uadavJobError('JOB_CAPACITY','La colección requiere revisión administrativa.',503);
    for(const row of rows.slice(0,250)){
      const job=JSON.parse(row.data_json),kind=uadavJobExpiryKind(job,today,until,now);
      if(kind)candidates.push({...row,deadline:job.fecha_limite,kind,title:String(job.titulo||'Oportunidad').slice(0,160)});
    }
    if(rows.length<=250)break;
  }
  const expected=await uadavDigest(JSON.stringify([today,until,candidates.map(x=>[x.id,x.revision,x.account_id,x.linked_at,x.deadline,x.kind])]));
  const selected=candidates.slice(0,5),preview={success:true,dry_run:true,day:today,advance_days:UADAV_JOB_EXPIRY_DAYS,pending:candidates.length,batch_size:selected.length,more_pending:candidates.length>5,fingerprint:expected,items:selected.map(x=>({job_id:x.id,title:x.title,deadline:x.deadline,kind:x.kind}))};
  if(dryRun)return preview;
  if(fingerprint!==undefined&&fingerprint!==expected)throw uadavJobError('JOB_EXPIRY_CHANGED','La revisión cambió. Volvé a revisar antes de enviar los avisos.',409);
  if(!selected.length)return {...preview,dry_run:false,emitted:0,recorded:0};
  const statements=[],ledgerIndices=[],noticeIndices=[],runId=crypto.randomUUID(),iso=new Date(now).toISOString(),expires=new Date(now+90*86400000).toISOString();
  for(const item of selected){
    const noticeId=await uadavJobExpiryId(item.id,item.deadline,item.kind,item.account_id);
    statements.push(...uadavJobGuard(db,"EXISTS(SELECT 1 FROM job_store_records WHERE collection='bolsa_trabajo' AND id=? AND revision=?) AND EXISTS(SELECT 1 FROM job_account_links l JOIN audience_accounts a ON a.id=l.account_id WHERE l.collection='bolsa_trabajo' AND l.record_id=? AND l.account_id=? AND l.linked_at=?) AND NOT EXISTS(SELECT 1 FROM audience_deletions WHERE account_id=?)",[item.id,item.revision,item.id,item.account_id,item.linked_at,item.account_id]));
    ledgerIndices.push(statements.length);
    statements.push(db.prepare('INSERT OR IGNORE INTO job_expiry_notices(notice_id,job_id,deadline,kind,account_id,run_id,created_at) VALUES(?,?,?,?,?,?,?)').bind(noticeId,item.id,item.deadline,item.kind,item.account_id,runId,iso));
    noticeIndices.push(statements.length);
    statements.push(db.prepare('INSERT OR IGNORE INTO audience_announcements(id,title,message,account_id,created_at,expires_at) SELECT ?,?,?,account_id,?,? FROM job_expiry_notices WHERE notice_id=? AND run_id=?').bind(noticeId,item.kind==='soon'?'Una de tus ofertas está por vencer':'Una de tus ofertas venció',item.kind==='soon'?'Una de tus ofertas vence el '+item.deadline+'. Abrí Mis trabajos en Mi Perfil para revisarla, cerrarla o renovarla.':'Una de tus ofertas ya no recibe postulaciones. Conservás sus candidaturas. Abrí Mis trabajos en Mi Perfil para consultarla o renovarla.',iso,expires,noticeId,runId));
  }
  let result;try{result=await db.batch(statements)}catch{throw uadavJobError('JOB_EXPIRY_CONFLICT','No se confirmó el envío. Las ofertas o sus cuentas pudieron cambiar. Volvé a revisar.',409)}
  const changes=indices=>indices.reduce((sum,index)=>sum+Number(result[index]?.meta?.changes||0),0);
  return {...preview,dry_run:false,recorded:changes(ledgerIndices),emitted:changes(noticeIndices)};
}
async function uadavJobExpiryRestoreProof(db,backup,additions){
  if(backup.job_expiry_notices_available!==true){
    if(backup.tables?.job_expiry_notices?.length)throw uadavJobError('JOB_EXPIRY_RESTORE','El respaldo no confirma su historial de avisos.',400);
    return [];
  }
  const rows=backup.tables?.job_expiry_notices;
  if(!await uadavJobExpiryAvailable(db)||!Array.isArray(rows)||rows.length>20000)throw uadavJobError('JOB_EXPIRY_RESTORE','No se pudo validar el historial de avisos del respaldo.',400);
  const wanted=new Set(additions.bolsa_trabajo.map(x=>x.id)),seen=new Set(),selected=[];
  for(const row of rows){
    if(!/^JOB-[A-Z0-9-]{3,80}$/i.test(row?.job_id||'')||!uadavJobValidDate(row.deadline)||!['soon','expired'].includes(row.kind)||!/^[a-f0-9]{64}$/.test(row.account_id||'')||typeof row.run_id!=='string'||!row.run_id||row.run_id.length>80||!Number.isFinite(Date.parse(row.created_at||'')))throw uadavJobError('JOB_EXPIRY_RESTORE','El respaldo contiene un historial de avisos inválido.',400);
    const id=await uadavJobExpiryId(row.job_id,row.deadline,row.kind,row.account_id);
    if(row.notice_id!==id||seen.has(id))throw uadavJobError('JOB_EXPIRY_RESTORE','El respaldo contiene avisos inválidos o duplicados.',400);
    seen.add(id);if(wanted.has(row.job_id))selected.push(row);
  }
  if(selected.length>100)throw uadavJobError('JOB_EXPIRY_RESTORE','Recuperá menos ofertas por lote para conservar todo su historial de avisos.',413);
  return selected;
}
