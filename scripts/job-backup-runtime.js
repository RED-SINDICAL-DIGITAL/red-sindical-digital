/* Staging-only backup and read-only closure diagnostics. Temporary recovery
 * proofs are deliberately excluded. No email, restore, secret rotation or DDL. */
const JOB_BACKUP_SITE='https://uadav-api-staging.uadavstream.workers.dev';
const JOB_BACKUP_PAGES='https://uadav-stream-staging.pages.dev';
const JOB_BACKUP_KV=['config_global','apariencia','secciones','web_visibility','home_layout','landing_config','footer_config','site_pages','estado_sitio','radios','senales_oficiales','artistas','artistas_prospectos','cartelera','eventos','bolsa_trabajo','postulaciones_trabajo','federated_sources','federated_source_state','content_items','collections','banners'];
const JOB_BACKUP_TABLES=['job_expiry_notices','job_account_links','job_store_meta','job_store_records','job_owner_credentials','sources','artists','producers','events','radios','jobs','job_applications','contracts','campaigns','notifications','audit_log','settings','artist_workspaces','artist_profile_drafts','artist_handles','artist_current_handles','artist_ai_usage','pro_payment_orders','pro_payment_fulfillments','artist_plan_state','artist_deletions','artist_deletion_accounts','audience_deletions','audience_notification_reads','audience_announcements','artist_owners','artist_ownership_transfers','artist_claim_evidence','audience_accounts','audience_artist_links','audience_artist_claims','audience_devices','audience_recovery_keys','pro_feature_credits','moderation_queue','moderation_usage','moderation_submissions','community_messages','artist_claims','venues','event_occurrences','search_restrictions','prospecting_runs','prospecting_results','content_items','collections','collection_items','sections_v2','entity_versions','radio_tracks','radio_requests','media_titles','media_seasons','media_episodes','artist_audience_messages','ticket_orders','marketplace_requests','monetization_products','monetization_campaigns','cct_scales','cct_assessments','cct_contract_records'];
const JOB_BACKUP_TEMP=['job_owner_recovery_tokens','job_owner_recovery_v2','job_recovery_outbox','job_mail_live_qa','job_store_rates','job_store_checks','audience_pairings'];
const JOB_BACKUP_META_PREFIXES=['brevo:','mail:','cron:lease'];
const JOB_CLOSURE_QA={job:'JOB-MVPJ9WRW-439D4126D9AE',application:'POST-MVPJCNGX-E7683EC0',deadline:'2026-10-26'};
const jobBackupError=(code,status=503)=>Object.assign(Error(code),{jobCode:code,status});
function jobBackupReadDB(native){
 // Both export and diagnostics must remain read-only even if a future query is
 // accidentally added here. No pragmas, extra statements or write CTEs.
 const check=sql=>{if(typeof sql!=='string'||!/^SELECT\b/i.test(sql.trim())||/;|--|\/\*/.test(sql))throw jobBackupError('JOB_BACKUP_READ_ONLY')};
 return{prepare(sql){check(sql);return native.prepare(sql)},batch(statements){return native.batch(statements)}};
}
const jobBackupInventory=db=>db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().then(x=>x.results.map(r=>r.name));
async function uadavJobBackupSnapshot(env){
 const native=uadavJobDB(env),db=jobBackupReadDB(native),before=await jobBackupInventory(db),existing=new Set(before);
 const selected=JOB_BACKUP_TABLES.filter(t=>existing.has(t)),sql=selected.map(t=>t==='job_store_meta'?"SELECT * FROM job_store_meta WHERE key NOT LIKE 'brevo:%' AND key NOT LIKE 'mail:%' AND key<>'cron:lease'":'SELECT * FROM '+t);
 const results=await db.batch([db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"),...sql.map(s=>db.prepare(s))]);
 const current=results[0]?.results?.map(x=>x.name);
 if(JSON.stringify(before)!==JSON.stringify(current))throw jobBackupError('JOB_BACKUP_SCHEMA_CHANGED');
 if(results.length!==selected.length+1||results.some(x=>x.success===false||!Array.isArray(x.results)))throw jobBackupError('JOB_BACKUP_D1_SNAPSHOT');
 const tables=Object.fromEntries(selected.map((name,i)=>[name,results[i+1].results])),kv={bolsa_trabajo:[],postulaciones_trabajo:[]};
 const ready=tables.job_store_meta?.some(r=>r.key==='migration_ready'&&r.value==='true');
 const credentials=new Map((tables.job_owner_credentials||[]).map(x=>[x.job_id,x.secret_hash]));let valid=!!ready&&Array.isArray(tables.job_store_records)&&Array.isArray(tables.job_owner_credentials);
 const seen=new Set();
 for(const row of tables.job_store_records||[]){
  if(!UADAV_JOB_COLLECTIONS.includes(row.collection)){valid=false;continue}
  let item;try{item=JSON.parse(row.data_json)}catch{valid=false;continue}
  if(!item||typeof item!=='object'||Array.isArray(item)||item.id!==row.id||seen.has(row.collection+'|'+row.id)){valid=false;continue}
  seen.add(row.collection+'|'+row.id);const {owner_access_hash,...payload}=item;
  const authority=row.collection==='bolsa_trabajo'?credentials.get(row.id):null;
  if(authority&&!/^[a-f0-9]{64}$/.test(authority)){valid=false;continue}
  kv[row.collection].push({...payload,...(authority?{owner_access_hash:authority}:{})});
 }
 if(UADAV_JOB_COLLECTIONS.some(k=>kv[k].length>2000))valid=false;
 const accounts=UADAV_JOB_ACCOUNT_TABLES.every(t=>existing.has(t)),notices=existing.has('job_expiry_notices');
 return{tables,kv,existing,missing:JOB_BACKUP_TABLES.filter(t=>!existing.has(t)),accounts,notices,
  integrity:{version:1,complete:valid,d1_atomic_snapshot:true,projection_matches_tables:valid,offers:kv.bolsa_trabajo.length,applications:kv.postulaciones_trabajo.length,credentials:(tables.job_owner_credentials||[]).length,account_links:(tables.job_account_links||[]).length,expiry_notices:(tables.job_expiry_notices||[]).length},
  policy:{version:1,temporary_authentication_excluded:true,excluded_tables:JOB_BACKUP_TEMP,excluded_metadata_prefixes:JOB_BACKUP_META_PREFIXES,d1_atomic_snapshot:true,kv_and_d1_distributed_snapshot:false,temporary_recovery_intents_restorable:false}};
}
async function uadavJobBackupDocument(env){
 const out={generated_at:new Date().toISOString(),service:'★ UADAV STREAM',version:VERSION,build:BUILD,job_storage:'d1',kv:{},tables:{}};
 for(const key of JOB_BACKUP_KV){if(UADAV_JOB_COLLECTIONS.includes(key))continue;try{const raw=await env.UADAV_DB.get(key);if(raw===null||raw===undefined)out.kv[key]=null;else{try{out.kv[key]=JSON.parse(raw)}catch{out.kv[key]=raw}}}catch{out.kv[key]={error:'BACKUP_KV_READ'}}}
 try{
  const snapshot=await uadavJobBackupSnapshot(env);Object.assign(out.kv,snapshot.kv);out.tables=snapshot.tables;out.job_accounts_available=snapshot.accounts;out.job_expiry_notices_available=snapshot.notices;out.missing_schema_tables=snapshot.missing;out.job_snapshot_integrity=snapshot.integrity;out.backup_policy=snapshot.policy;
 }catch{out.table_inventory_error='BACKUP_D1_SNAPSHOT';out.job_snapshot_integrity={version:1,complete:false,d1_atomic_snapshot:false,projection_matches_tables:false};for(const key of UADAV_JOB_COLLECTIONS)out.kv[key]={error:'BACKUP_D1_SNAPSHOT'}}
 const errors={kv_errors:Object.entries(out.kv).filter(([,x])=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===1&&Object.hasOwn(x,'error')).map(([k])=>k),table_errors:[],missing_critical_kv:UADAV_JOB_COLLECTIONS.filter(k=>!Array.isArray(out.kv[k])),d1_configured:true,missing_schema_tables:out.missing_schema_tables||[],inventory_error:out.table_inventory_error||null};
 out.backup_integrity={...errors,complete:!!out.job_snapshot_integrity?.complete&&!errors.kv_errors.length&&!errors.inventory_error&&!errors.missing_critical_kv.length};
 out.backup_digest={algorithm:'SHA-256',format:'json-stringify-without-backup_digest-v1',value:await uadavDigest(JSON.stringify(out))};return out;
}
async function uadavJobRecoveryMaintenance(env){
 if(env.JOB_STORE_D1!=='true'||!env.DB)return{available:false,expired:0,pruned:0,metadata_pruned:0};
 const db=uadavJobDB(env),inventory=new Set(await jobBackupInventory(db));
 if(!inventory.has('job_recovery_outbox'))return{available:false,expired:0,pruned:0,metadata_pruned:0};
 const marker=await db.prepare("SELECT value FROM job_store_meta WHERE key='mail:live:schema:11767'").first();let identity;try{identity=JSON.parse(marker?.value)}catch{}
 if(identity?.version!==1||identity.schema_sha256!==UADAV_LIVE_MAIL_SCHEMA_SHA)throw jobBackupError('JOB_MAIL_RETENTION_SCHEMA');
 const now=Date.now(),cutoff=now-7*86400000;
 const batch=await db.batch([
  db.prepare("UPDATE job_recovery_outbox SET state='expired',sealed_payload=NULL,lease_owner=NULL,lease_until=0 WHERE id IN (SELECT id FROM job_recovery_outbox WHERE state IN ('queued','sending','accepted','failed') AND expires_at<=? ORDER BY expires_at,id LIMIT 25)").bind(now),
  db.prepare("DELETE FROM job_recovery_outbox WHERE id IN (SELECT id FROM job_recovery_outbox WHERE state IN ('expired','cancelled','failed','redeemed') AND expires_at<? ORDER BY expires_at,id LIMIT 25)").bind(cutoff),
  db.prepare("DELETE FROM job_store_meta WHERE key IN (SELECT key FROM job_store_meta WHERE key LIKE 'brevo:%' AND json_valid(value) AND json_type(value,'$.created_at')='integer' AND json_extract(value,'$.created_at')<? ORDER BY key LIMIT 25)").bind(cutoff)
 ]);
 return{available:true,expired:Number(batch[0]?.meta?.changes||0),pruned:Number(batch[1]?.meta?.changes||0),metadata_pruned:Number(batch[2]?.meta?.changes||0)};
}
async function uadavJobClosureSnapshot(env){
 const db=jobBackupReadDB(uadavJobDB(env)),inventory=new Set(await jobBackupInventory(db));
 const needed=['job_store_records','job_owner_credentials','job_store_meta','job_account_links','job_expiry_notices','audience_announcements','audience_accounts','audience_deletions'];
 if(needed.some(t=>!inventory.has(t)))throw jobBackupError('JOB_CLOSURE_SCHEMA');
 const q=JOB_CLOSURE_QA,statements=[
  db.prepare("SELECT data_json FROM job_store_records WHERE collection='bolsa_trabajo' AND id=?").bind(q.job),
  db.prepare("SELECT data_json FROM job_store_records WHERE collection='postulaciones_trabajo' AND id=?").bind(q.application),
  db.prepare("SELECT n.kind,n.account_id,n.deadline,COUNT(a.id) AS message_count FROM job_expiry_notices n LEFT JOIN audience_announcements a ON a.id=n.notice_id AND a.account_id=n.account_id WHERE n.job_id=? GROUP BY n.notice_id").bind(q.job),
  db.prepare("SELECT l.account_id FROM job_account_links l JOIN audience_accounts a ON a.id=l.account_id WHERE l.collection='bolsa_trabajo' AND l.record_id=? AND NOT EXISTS(SELECT 1 FROM audience_deletions d WHERE d.account_id=l.account_id)").bind(q.job),
  db.prepare("SELECT key,value FROM job_store_meta WHERE key IN ('migration_ready','cron:last_success','cron:last_run')"),
  ...(inventory.has('job_mail_live_qa')?[db.prepare("SELECT COUNT(*) AS n FROM job_mail_live_qa q JOIN job_recovery_outbox o ON o.job_id=q.job_id AND o.request_id=q.id JOIN job_owner_credentials c ON c.job_id=q.job_id WHERE q.completed_at IS NOT NULL AND o.state='redeemed' AND c.revision=2 AND c.secret_hash=q.new_hash AND o.redeemed_secret_hash=c.secret_hash AND o.credential_revision+1=c.revision")]:[])
 ];
 const rows=await db.batch(statements);let offer,app;try{offer=rows[0].results[0]&&JSON.parse(rows[0].results[0].data_json);app=rows[1].results[0]&&JSON.parse(rows[1].results[0].data_json)}catch{throw jobBackupError('JOB_CLOSURE_RECORD')}
 const notices=rows[2].results,accounts=rows[3].results.map(x=>x.account_id),meta=new Map(rows[4].results.map(x=>[x.key,x.value]));let success,lastRun;try{success=meta.has('cron:last_success')?uadavJobCronRecord(JSON.parse(meta.get('cron:last_success'))):null;lastRun=meta.has('cron:last_run')?uadavJobCronRecord(JSON.parse(meta.get('cron:last_run'))):null}catch{}
 const expired=notices.filter(x=>x.kind==='expired'&&x.deadline===q.deadline),sameRecipient=accounts.length===1&&expired.every(x=>x.account_id===accounts[0]);
 const checks={deadline_unchanged:offer?.fecha_limite===q.deadline,deadline_passed:uadavJobToday()>q.deadline,public_offer_hidden:!!offer&&!uadavJobIsPublic(offer),stored_as_expired:!!offer&&offer.activo===false&&offer.estado==='vencida',application_preserved:app?.id===q.application&&app.job_id===q.job&&app.consent_scope==='job_application_v1',one_expiry_notice:expired.length===1,one_matching_private_message:expired.length===1&&Number(expired[0].message_count)===1,notice_for_current_account:sameRecipient&&expired.length===1,cron_after_expiry:lastRun?.status==='success'&&lastRun.scheduled_time===success?.scheduled_time&&success?.status==='success'&&success.scheduled_time>=Date.parse('2026-10-27T03:00:00Z')&&success.scheduled_time<=Date.now()};
 return{result:'status',scope:'bolsa-closure-staging',build:BUILD,checked_at:new Date().toISOString(),recovery_enabled:false,read_only:true,ready:meta.get('migration_ready')==='true',real_mail_qa_completed:Number(rows[5]?.results?.[0]?.n||0)>0,expiry:{checks,all_passed:Object.values(checks).every(Boolean),notice_count:expired.length},cron:{enabled:env.JOB_STAGING_CRON==='bolsa-only',scheduled_time:success?.scheduled_time||null,status:lastRun?.status||null},temporary_auth_excluded_from_new_backups:true};
}
async function uadavJobBackupRoute(request,env){
 const url=new URL(request.url),origin=request.headers.get('Origin'),site=JOB_BACKUP_SITE,allowed=[site,JOB_BACKUP_PAGES];
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',Vary:'Origin',...(allowed.includes(origin)?{'Access-Control-Allow-Origin':origin}:{})};
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 try{
  if(url.origin!==site)return reply({error:'Operación exclusiva de staging'},403);
  if(url.pathname==='/qa/bolsa-cierre'){
   if(request.method!=='GET'||url.search)return reply({error:'Solicitud inválida'},400);const nonce=crypto.randomUUID().replaceAll('-','');return new Response(UADAV_JOB_CLOSURE_HTML.replaceAll('%%NONCE%%',nonce),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; script-src 'nonce-"+nonce+"'; style-src 'nonce-"+nonce+"'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
  }
  if(request.method==='OPTIONS'){
   if(!allowed.includes(origin))return reply({error:'Origen no permitido'},403);
   return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Max-Age':'0'}});
  }
  if(!env.ADMIN_KEY||request.headers.get('Authorization')!=='Bearer '+String(env.ADMIN_KEY).trim())return reply({error:'No autorizado'},401);
  if(origin&&!allowed.includes(origin))return reply({error:'Origen no permitido'},403);
  if(request.method!=='GET'||url.search)return reply({error:'Solo consulta'},405);
  if(url.pathname==='/api/v7/export'&&env.JOB_STORE_D1!=='true')return uadavWorker.fetch(request,env,{});
  if(env.JOB_STORE_D1!=='true'||!env.DB)throw jobBackupError('JOB_BACKUP_D1_REQUIRED');
  if(url.pathname==='/api/v7/export')return reply(await uadavJobBackupDocument(env));
  if(url.pathname==='/api/admin/jobs/closure-check')return reply(await uadavJobClosureSnapshot(env));
  return reply({error:'No encontrado'},404);
 }catch{return reply({error:'No se pudo confirmar la consulta. Los datos actuales se conservan.',code:'JOB_BACKUP_UNAVAILABLE'},503)}
}
// Used only inside the existing guarded restore batch. A restored offer must
// not revive an old email link whose revisions happen to match again.
async function uadavJobRestoredRecoveryStatements(db,ids){
 if(!ids.length)return[];
 const tables=new Set(await jobBackupInventory(db)),statements=[],now=Date.now();
 if(tables.has('job_recovery_outbox')){
  const marker=await db.prepare("SELECT value FROM job_store_meta WHERE key='mail:live:schema:11767'").first();let identity;try{identity=JSON.parse(marker?.value)}catch{}
  if(identity?.version!==1||identity.schema_sha256!==UADAV_LIVE_MAIL_SCHEMA_SHA)throw uadavJobError('JOB_RESTORE_RECOVERY_SCHEMA','Revisá el esquema de recuperación antes de restaurar. No se aplicaron cambios.',423);
 }
 for(const id of ids){
  if(tables.has('job_recovery_outbox'))statements.push(db.prepare("UPDATE job_recovery_outbox SET state='cancelled',sealed_payload=NULL,lease_owner=NULL,lease_until=0 WHERE job_id=?").bind(id));
  for(const table of ['job_owner_recovery_tokens','job_owner_recovery_v2'])if(tables.has(table))statements.push(db.prepare('UPDATE '+table+' SET consumed_at=? WHERE job_id=? AND consumed_at IS NULL').bind(now,id));
 }
 return statements;
}
