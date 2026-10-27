/* Disposable namespace on the already isolated uadav-restore-qa Worker.
 * The exported entrypoint exposes no operational platform routes or sends.
 * All backup SQL is server-owned; uploaded values are bound, never executed. */
const FR_PREFIX='restore11769_',FR_PURPOSE='BOLSA_ACCOUNT_REHEARSAL_11769';
function frRequire(ok,code='RESTORE_QA_INVALID',status=409){if(!ok)throw Object.assign(Error(code),{frCode:code,status})}
const frCanonical=x=>JSON.stringify(x,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const frRows=rows=>rows.map(frCanonical).sort();
async function frAuth(request,env){const key=env.QA_RESTORE_KEY,header=request.headers.get('Authorization')||'';frRequire(typeof key==='string'&&key.length>=32&&key.length<=256&&header.startsWith('Bearer '),'RESTORE_QA_AUTH',401);const [a,b]=await Promise.all([uadavDigest(key),uadavDigest(header.slice(7))]);let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);frRequire(difference===0,'RESTORE_QA_AUTH',401);return a}
async function frBinding(db,keyHash){
 const rows=(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND substr(name,1,7)<>'sqlite_' AND substr(name,1,4)<>'_cf_'").all()).results.map(x=>x.name),foreign=rows.filter(n=>!n.startsWith(FR_PREFIX));
 frRequire(foreign.every(n=>FR_LEGACY_TABLES.includes(n))&&foreign.includes('qa_restore_guard'),'RESTORE_QA_FOREIGN_DATABASE',423);const old=await db.prepare('SELECT purpose,secret_hash,phase FROM qa_restore_guard LIMIT 1').first();frRequire(old?.purpose==='UADAV_BOLSA_DISPOSABLE_RESTORE_11762'&&old.secret_hash===keyHash&&old.phase===6,'RESTORE_QA_FOREIGN_DATABASE',423);
 const own=rows.filter(n=>n.startsWith(FR_PREFIX));frRequire(own.every(n=>FR_TABLES.includes(n.slice(FR_PREFIX.length))||['guard','kv'].includes(n.slice(FR_PREFIX.length))),'RESTORE_QA_FOREIGN_NAMESPACE',423);
 if(own.length){frRequire(own.includes(FR_PREFIX+'guard'),'RESTORE_QA_FOREIGN_NAMESPACE',423);const g=await db.prepare('SELECT * FROM '+FR_PREFIX+'guard WHERE id=1').first();frRequire(g?.purpose===FR_PURPOSE&&g.key_hash===keyHash&&g.schema_hash===FR_SCHEMA_HASH,'RESTORE_QA_FOREIGN_NAMESPACE',423);return g}return null;
}
function frDB(native){
 const names=new Set(FR_TABLES),pattern=new RegExp('\\b('+FR_TABLES.join('|')+')\\b','g');
 function transform(sql){
  frRequire(typeof sql==='string'&&!/;|--|\/\*|\b(?:ATTACH|DETACH|DROP|ALTER|VACUUM)\b/i.test(sql),'RESTORE_QA_SQL',423);
  for(const match of sql.matchAll(/\b(?:FROM|JOIN|INTO|REFERENCES)\s+([a-z_][a-z0-9_]*)/gi))frRequire(names.has(match[1])||match[1]==='sqlite_master','RESTORE_QA_SQL',423);
  frRequire(!/\b(?:FROM|JOIN|INTO|REFERENCES)\s+[\"'\[]/.test(sql),'RESTORE_QA_SQL',423);
  if(/sqlite_master/.test(sql)){frRequire(/^SELECT\b/i.test(sql.trim()),'RESTORE_QA_SQL',423);return sql.replace(/\bsqlite_master\b/g,"(SELECT type,substr(name,14) AS name,tbl_name,rootpage,sql FROM sqlite_master WHERE substr(name,1,13)='restore11769_')")}
  if(/^PRAGMA\b/i.test(sql.trim()))frRequire(/^PRAGMA (?:table_info|foreign_key_list|foreign_key_check)\([a-z_][a-z0-9_]*\)$/i.test(sql.trim()),'RESTORE_QA_SQL',423);
  const writes=sql.match(/^(?:INSERT(?: OR (?:IGNORE|REPLACE))? INTO|UPDATE|DELETE FROM|CREATE TABLE(?: IF NOT EXISTS)?)\s+([a-z_][a-z0-9_]*)/i);if(writes)frRequire(names.has(writes[1]),'RESTORE_QA_SQL',423);
  if(/^PRAGMA/.test(sql))frRequire(names.has(sql.match(/\(([a-z_][a-z0-9_]*)\)/i)?.[1]),'RESTORE_QA_SQL',423);
  const rewritten=sql.replace(pattern,n=>FR_PREFIX+n);return rewritten.replace(/^(CREATE(?: UNIQUE)? INDEX(?: IF NOT EXISTS)? )([a-z_][a-z0-9_]*)/i,(_x,p,n)=>p+FR_PREFIX+n);
 }
 function statement(sql,args=[]){const rewritten=transform(sql),s=native.prepare(rewritten).bind(...args);return{sql,args,_native:s,bind(...values){return statement(sql,values)},run:()=>s.run(),all:()=>s.all(),first:()=>s.first()}}
 return{prepare:sql=>statement(sql),batch:items=>native.batch(items.map(x=>x._native))};
}
async function frParse(backup){
 frRequire(backup&&backup.job_storage==='d1'&&backup.backup_integrity?.complete===true&&backup.job_snapshot_integrity?.d1_atomic_snapshot===true,'RESTORE_QA_BACKUP',400);
 let check;try{check=await frVerifyDigest(backup)}catch{frRequire(false,'RESTORE_QA_CHECKSUM',400)}frRequire(check.verified,'RESTORE_QA_CHECKSUM',400);
 for(const name of ['audience_accounts','audience_deletions','audience_devices','audience_recovery_keys','audience_artist_links','audience_artist_claims','audience_announcements','audience_notification_reads','job_store_records','job_owner_credentials','job_account_links','job_expiry_notices'])frRequire(Array.isArray(backup.tables?.[name]),'RESTORE_QA_MISSING_CONTEXT',400);
 const arrays=Object.fromEntries(FR_DATA_TABLES.map(t=>[t,backup.tables?.[t]||[]]));let total=0;
 for(const[name,rows]of Object.entries(arrays)){frRequire(Array.isArray(rows)&&rows.length<=10000,'RESTORE_QA_ROWS',400);total+=rows.length;frRequire(total<=20000,'RESTORE_QA_ROWS',400);for(const r of rows)frRequire(r&&typeof r==='object'&&!Array.isArray(r)&&Object.keys(r).length<=80&&Object.values(r).every(v=>v===null||typeof v==='string'||typeof v==='number'&&Number.isFinite(v)),'RESTORE_QA_VALUES',400)}
 const gone=new Set(arrays.audience_deletions.map(x=>x.account_id));frRequire(arrays.audience_accounts.every(x=>!gone.has(x.id)),'RESTORE_QA_DELETED_ACCOUNT',400);
 for(const name of ['bolsa_trabajo','postulaciones_trabajo'])frRequire(Array.isArray(backup.kv?.[name])&&backup.kv[name].length<=2000,'RESTORE_QA_JOBS',400);
 const kv=FR_KV_KEYS.filter(k=>Object.hasOwn(backup.kv||{},k)).map(key=>({key,value:JSON.stringify(backup.kv[key])}));
 return{hash:check.sha256,arrays,kv};
}
async function frInitialize(native,keyHash,parsed){
 const current=await frBinding(native,keyHash);if(current){frRequire(current.backup_hash===parsed.hash,'RESTORE_QA_OTHER_BACKUP',409);return current}
 const db=frDB(native),statements=[native.prepare('CREATE TABLE '+FR_PREFIX+'guard(id INTEGER PRIMARY KEY CHECK(id=1),purpose TEXT,key_hash TEXT,schema_hash TEXT,backup_hash TEXT,phase INTEGER NOT NULL,rollback_tested INTEGER NOT NULL,complete INTEGER NOT NULL,lease_owner TEXT,lease_until INTEGER NOT NULL DEFAULT 0)'),native.prepare('CREATE TABLE '+FR_PREFIX+'kv(key TEXT PRIMARY KEY,value TEXT NOT NULL)'),...FR_SCHEMA.map(sql=>db.prepare(sql)._native),native.prepare('INSERT INTO '+FR_PREFIX+'guard(id,purpose,key_hash,schema_hash,backup_hash,phase,rollback_tested,complete) VALUES(1,?,?,?,?,0,0,0)').bind(FR_PURPOSE,keyHash,FR_SCHEMA_HASH,parsed.hash)];
 await native.batch(statements);return frBinding(native,keyHash);
}
function frBatches(parsed){const batches=[];for(const name of FR_DATA_TABLES){const rows=parsed.arrays[name];for(let offset=0;offset<rows.length;offset+=25)batches.push({name,rows:rows.slice(offset,offset+25)})}for(let offset=0;offset<parsed.kv.length;offset+=25)batches.push({name:'kv',rows:parsed.kv.slice(offset,offset+25)});return batches}
async function frInsert(db,batch,native){
 const target=batch.name==='kv'?native:db,table=batch.name==='kv'?FR_PREFIX+'kv':batch.name,columns=(await (batch.name==='kv'?native.prepare('PRAGMA table_info('+FR_PREFIX+'kv)'):db.prepare('PRAGMA table_info('+table+')')).all()).results.map(r=>r.name);
 return batch.rows.map(row=>{const keys=Object.keys(row);frRequire(keys.length&&keys.every(k=>columns.includes(k)),'RESTORE_QA_COLUMNS',400);return target.prepare('INSERT OR IGNORE INTO '+table+'('+keys.join(',')+') VALUES('+keys.map(()=>'?').join(',')+')').bind(...keys.map(k=>row[k]===undefined?null:row[k]))});
}
async function frCompare(native,db,parsed){
 for(const name of FR_DATA_TABLES){const actual=(await db.prepare('SELECT * FROM '+name).all()).results;frRequire(frCanonical(frRows(actual))===frCanonical(frRows(parsed.arrays[name])),'RESTORE_QA_COMPARISON')}
 const actualKV=(await native.prepare('SELECT * FROM '+FR_PREFIX+'kv').all()).results;frRequire(frCanonical(frRows(actualKV))===frCanonical(frRows(parsed.kv)),'RESTORE_QA_KV_COMPARISON');
 const env={DB:db,JOB_STORE_D1:'true'},store=uadavJobStore(env);await db.prepare("INSERT OR REPLACE INTO job_store_meta(key,value) VALUES('migration_ready','true')").run();
 for(const name of ['bolsa_trabajo','postulaciones_trabajo'])frRequire(frCanonical(frRows(await store.read(name)))===frCanonical(frRows(JSON.parse(parsed.kv.find(x=>x.key===name).value))),'RESTORE_QA_PROJECTION');
 for(const name of ['job_account_links','job_expiry_notices','access_email_identities'])frRequire((await db.prepare('PRAGMA foreign_key_check('+name+')').all()).results.length===0,'RESTORE_QA_REFERENCES');
}
async function frPhase(native,keyHash,backup,phase){
 const parsed=await frParse(backup),state=await frInitialize(native,keyHash,parsed),db=frDB(native),batches=frBatches(parsed);frRequire(Number.isInteger(phase)&&phase>=0&&phase<=batches.length,'RESTORE_QA_PHASE',400);
 if(phase<state.phase&&state.complete)return{...await frPhase(native,keyHash,backup,batches.length),replayed:true};
 if(phase<state.phase)return{phase:state.phase,phases:batches.length,complete:!!state.complete,replayed:true,rollback_tested:!!state.rollback_tested};
 frRequire(phase===state.phase,'RESTORE_QA_ORDER');
 const owner=crypto.randomUUID(),claim=await native.prepare('UPDATE '+FR_PREFIX+'guard SET lease_owner=?,lease_until=? WHERE id=1 AND lease_until<=? AND phase=?').bind(owner,Date.now()+60000,Date.now(),phase).run();frRequire(claim.meta?.changes===1,'RESTORE_QA_BUSY');
 try{
  if(phase===batches.length){await frCompare(native,db,parsed);await native.prepare('UPDATE '+FR_PREFIX+'guard SET complete=1,lease_owner=NULL,lease_until=0 WHERE id=1 AND lease_owner=?').bind(owner).run();return{phase,phases:batches.length,complete:true,rollback_tested:!!state.rollback_tested,counts:{offers:backup.kv.bolsa_trabajo.length,applications:backup.kv.postulaciones_trabajo.length,accounts:parsed.arrays.audience_accounts.length,devices:parsed.arrays.audience_devices.length,artist_links:parsed.arrays.audience_artist_links.length,notices:parsed.arrays.job_expiry_notices.length,messages:parsed.arrays.audience_announcements.length,verified_email_identities:parsed.arrays.access_email_identities.length,kv_keys:parsed.kv.length},backup_content_sha256:parsed.hash,temporary_authentication_restored:false,operational_restore_enabled:false,whole_platform_restore:false}}
  const batch=batches[phase],items=await frInsert(db,batch,native),natives=batch.name==='kv'?items:items.map(x=>x._native);
  if(!state.rollback_tested){const countSQL='SELECT COUNT(*) n FROM '+(batch.name==='kv'?FR_PREFIX+'kv':FR_PREFIX+batch.name),before=(await native.prepare(countSQL).first()).n;let rejected=false;try{await native.batch([...natives,db.prepare('INSERT INTO job_store_checks(id,valid) VALUES(?,0)').bind(crypto.randomUUID())._native])}catch{rejected=true}frRequire(rejected&&(await native.prepare(countSQL).first()).n===before,'RESTORE_QA_ROLLBACK');}
  const guardId=crypto.randomUUID();const preconditions=[native.prepare('INSERT INTO '+FR_PREFIX+'job_store_checks(id,valid) SELECT ?,CASE WHEN EXISTS(SELECT 1 FROM '+FR_PREFIX+'guard WHERE id=1 AND phase=? AND lease_owner=? AND lease_until>?) THEN 1 ELSE 0 END').bind(guardId,phase,owner,Date.now()),native.prepare('DELETE FROM '+FR_PREFIX+'job_store_checks WHERE id=?').bind(guardId)];
  await native.batch([...preconditions,...natives,native.prepare('UPDATE '+FR_PREFIX+'guard SET phase=phase+1,rollback_tested=1,lease_owner=NULL,lease_until=0 WHERE id=1 AND phase=? AND lease_owner=?').bind(phase,owner)]);return{phase:phase+1,phases:batches.length,complete:false,rollback_tested:true};
 }catch(error){await native.prepare('UPDATE '+FR_PREFIX+'guard SET lease_owner=NULL,lease_until=0 WHERE id=1 AND lease_owner=?').bind(owner).run();throw error}
}
async function uadavFullRestoreQA(request,env){
 const url=new URL(request.url),headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'},reply=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers});
 try{
  frRequire(url.origin==='https://uadav-restore-qa.uadavstream.workers.dev'&&!url.search,'RESTORE_QA_HOST',403);
  if(request.method==='GET'&&url.pathname==='/health')return reply({ok:true,version:'11769-account-restore',purpose:'isolated-bolsa-account-rehearsal',enabled:env.QA_RESTORE_ONLY==='true',database_bound:!!env.DB});
  if(request.method==='GET'&&url.pathname==='/'){const nonce=crypto.randomUUID().replaceAll('-','');return new Response(FR_HTML.replaceAll('%%NONCE%%',nonce),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'nonce-"+nonce+"'; style-src 'nonce-"+nonce+"'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}})}
  frRequire(!request.headers.get('Origin')||request.headers.get('Origin')===url.origin,'RESTORE_QA_ORIGIN',403);frRequire(env.QA_RESTORE_ONLY==='true'&&env.DB,'RESTORE_QA_DISABLED',503);const keyHash=await frAuth(request,env);frRequire(request.method==='POST'&&['/rehearse','/purge'].includes(url.pathname),'RESTORE_QA_ROUTE',405);
  if(url.pathname==='/purge'){const body=await uadavSecurityJSON(request,1000);frRequire(body?.confirm==='BORRAR COPIA AISLADA11769'&&Object.keys(body).length===1,'RESTORE_QA_CONFIRM',400);const state=await frBinding(env.DB,keyHash);if(state){const names=[...FR_TABLES].reverse().concat(['kv','guard']);await env.DB.batch(names.map(n=>env.DB.prepare('DROP TABLE '+FR_PREFIX+n)))}return reply({scope:'bolsa-account-restore-staging',result:'purged',operational_data_touched:false})}
  const b=await uadavSecurityJSON(request,3500000);frRequire(b&&Object.keys(b).length===3&&b.confirm==='ENSAYAR RESPALDO EN BASE AISLADA','RESTORE_QA_CONFIRM',400);const result=await frPhase(env.DB,keyHash,b.backup,b.phase);return reply({scope:'bolsa-account-restore-staging',version:'11769-account-restore',checked_at:new Date().toISOString(),result:result.complete?'complete':'running',...result});
 }catch(error){return reply({error:'No se confirmó el ensayo. No se modificó la plataforma operativa.',code:error.frCode||'RESTORE_QA_UNCONFIRMED'},[400,401,403,409,423].includes(error.status)?error.status:503)}
}
