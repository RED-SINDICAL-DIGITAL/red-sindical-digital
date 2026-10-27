// OFFLINE ONLY: restores a private Bolsa snapshot into disposable in-memory
// SQLite through the actual Worker routes. This is not a remote D1 proof.
// Requires Node and Python; never prints records, credentials or account IDs.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash,webcrypto} from 'node:crypto';
import {sqliteD1} from '../tests/sqlite-d1.mjs';
import {loadWorker} from '../tests/load-worker.mjs';
import {verifyJobBackupDigest} from './job-backup-digest.mjs';
const input=process.argv[2];
if(!input)throw Error('Uso: node scripts/rehearse-job-restore.mjs RUTA_DEL_RESPALDO_PRIVADO.json');
const bytes=await readFile(resolve(input));
if(bytes.length>3500000)throw Error('El respaldo supera el tamaño permitido para este ensayo.');
let backup;try{backup=JSON.parse(bytes.toString('utf8'))}catch{throw Error('El respaldo no es un JSON válido.')}
const digestCheck=await verifyJobBackupDigest(backup,webcrypto);
// No token/session state from a backup is installed by this offline rehearsal.
const check=(condition,message)=>{if(!condition)throw Error(message)};
check(backup.job_storage==='d1'&&backup.backup_integrity?.complete===true,'Se requiere un respaldo D1 completo.');
for(const name of ['bolsa_trabajo','postulaciones_trabajo'])check(Array.isArray(backup.kv?.[name])&&backup.kv[name].length<=2000,'Colecciones de Bolsa ausentes o excesivas.');
for(const name of ['job_account_links','job_expiry_notices','audience_accounts'])check(Array.isArray(backup.tables?.[name]),'El respaldo no incluye los datos de cuenta/avisos necesarios.');
const {default:worker,uadavJobStore}=await loadWorker();
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{throw Error('Red deshabilitada durante el ensayo local.')};
const origin='https://uadav-stream-staging.pages.dev';
const canonical=value=>JSON.stringify(value,(key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
const sorted=rows=>[...rows].sort((a,b)=>String(a.id||a.notice_id||a.record_id).localeCompare(String(b.id||b.notice_id||b.record_id)));
async function fixture(){
 const DB=sqliteD1(),kv=new Map(),env={DB,ADMIN_KEY:'synthetic-offline-admin',ACCOUNT_ALLOWED_ORIGINS:origin,UADAV_DB:{get:async key=>kv.get(key)||null,put:async(key,value)=>{kv.set(key,value)}}};
 await DB.prepare('PRAGMA foreign_keys=ON').run();
 const call=async(route,body,credential=env.ADMIN_KEY)=>{
  const response=await worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/'+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.62',Authorization:'Bearer '+credential},body:JSON.stringify(body)}),env,{});
  return {status:response.status,data:await response.json()};
 };
 try{
  // Initialize the audience schema using a synthetic account; then preserve only
  // the account parents from the snapshot. Bolsa-only recovery cannot recreate
  // missing personal accounts or revive a deleted account.
  check((await call('account',{data:{uadav_user_v11:{name:'OFFLINE QA'}}},'UAC-'+'e'.repeat(64))).status===200,'No se preparó el esquema local de cuentas.');
  await DB.prepare('DELETE FROM audience_accounts').run();
  for(const name of ['20261023_job_owner_credentials.sql','20261024_job_store.sql','20261024_job_accounts.sql','20261024_job_expiry_notices.sql']){
   const sql=await readFile(new URL('../migrations/staging/'+name,import.meta.url),'utf8');
   for(const statement of sql.replace(/--[^\n]*/g,'').split(';').filter(x=>x.trim()))await DB.prepare(statement).run();
  }
  const parents=new Set([...backup.tables.job_account_links,...backup.tables.job_expiry_notices].map(row=>row.account_id));
  for(const row of backup.tables.audience_accounts.filter(row=>parents.has(row.id)))await DB.prepare('INSERT INTO audience_accounts(id,data_json,revision,updated_at) VALUES(?,?,?,?)').bind(row.id,row.data_json,row.revision,row.updated_at).run();
  for(const row of backup.tables.audience_deletions||[])await DB.prepare('INSERT INTO audience_deletions(account_id,deleted_at) VALUES(?,?)').bind(row.account_id,row.deleted_at).run();
  await DB.prepare("INSERT INTO job_store_meta(key,value) VALUES('migration_ready','true')").run();env.JOB_STORE_D1='true';
  const count=async table=>(await DB.prepare('SELECT COUNT(*) AS n FROM '+table).first()).n;
  return {DB,env,call,count,close:()=>DB.close()};
 }catch(error){DB.close();throw error}
}
const payload=kv=>({confirm:'RECUPERAR FALTANTES',confirm_second:'APLICAR RECUPERACION',external_backup_confirmed:true,restore_account_links:true,dry_run:false,backup:{...backup,kv}});
const route='admin/backup/jobs/restore-missing';
let complete,rollback;
try{
 complete=await fixture();
 const sample={bolsa_trabajo:backup.kv.bolsa_trabajo.slice(0,1),postulaciones_trabajo:[]};
 check((await complete.call(route,payload(sample))).status===423,'La restauración debe permanecer bloqueada por defecto.');
 check(await complete.count('job_store_records')===0,'Una petición bloqueada modificó datos.');
 complete.env.ENABLE_JOB_D1_RESTORE='staging-tested'; // Local fixture only.
 let batches=0;
 for(const collection of ['bolsa_trabajo','postulaciones_trabajo'])for(let offset=0;offset<backup.kv[collection].length;offset+=5){
  const kv={bolsa_trabajo:[],postulaciones_trabajo:[],[collection]:backup.kv[collection].slice(offset,offset+5)};
  const result=await complete.call(route,payload(kv));
  check(result.status===200&&result.data.success===true,'No se confirmó un lote del ensayo local.');batches++;
 }
 for(const collection of ['bolsa_trabajo','postulaciones_trabajo']){
  const restored=await uadavJobStore(complete.env).read(collection);
  check(canonical(sorted(restored))===canonical(sorted(backup.kv[collection])),'Una colección restaurada no coincide íntegramente con el respaldo.');
 }
 const links=(await complete.DB.prepare('SELECT * FROM job_account_links').all()).results;
 check(canonical(sorted(links))===canonical(sorted(backup.tables.job_account_links)),'Los vínculos no coinciden con el respaldo.');
 const notices=(await complete.DB.prepare('SELECT * FROM job_expiry_notices').all()).results;
 check(canonical(sorted(notices))===canonical(sorted(backup.tables.job_expiry_notices)),'El historial de avisos no coincide.');
 const credentials=(await complete.DB.prepare('SELECT job_id,secret_hash FROM job_owner_credentials ORDER BY job_id').all()).results;
 const wanted=backup.kv.bolsa_trabajo.filter(row=>row.owner_access_hash).map(row=>({job_id:row.id,secret_hash:row.owner_access_hash})).sort((a,b)=>a.job_id.localeCompare(b.job_id));
 check(canonical(credentials)===canonical(wanted),'No se conservaron las credenciales del respaldo.');
 const repeated=await complete.call(route,payload({bolsa_trabajo:[],postulaciones_trabajo:[]}));
 check(repeated.status===200&&repeated.data.ofertas===0&&repeated.data.postulaciones===0,'Un reintento vacío no fue idempotente.');
 // Repeat each real batch too: a second run must insert no records or links.
 for(const collection of ['bolsa_trabajo','postulaciones_trabajo'])for(let offset=0;offset<backup.kv[collection].length;offset+=5){
  const repeated=await complete.call(route,payload({bolsa_trabajo:[],postulaciones_trabajo:[],[collection]:backup.kv[collection].slice(offset,offset+5)}));
  check(repeated.status===200&&repeated.data.ofertas===0&&repeated.data.postulaciones===0,'Una segunda ejecución duplicó registros.');
 }
 check((await complete.DB.prepare('PRAGMA foreign_key_check').all()).results.length===0,'Falló la integridad de referencias.');
 check((await complete.DB.prepare('PRAGMA integrity_check').first()).integrity_check==='ok','Falló la integridad SQLite.');
 for(const endpoint of ['acceso/solicitar','acceso/restablecer'])check((await complete.call('bolsa_trabajo/'+endpoint,{})).status===503,'El ensayo no debe habilitar correo.');
 const app=backup.kv.postulaciones_trabajo[0],parent=backup.kv.bolsa_trabajo.find(row=>row.id===app?.job_id);
 check(app&&parent,'El ensayo de interrupción requiere una postulación y su oferta.');
 rollback=await fixture();rollback.env.ENABLE_JOB_D1_RESTORE='staging-tested';
 await rollback.DB.prepare("CREATE TRIGGER offline_injected_failure BEFORE INSERT ON job_store_records WHEN NEW.collection='postulaciones_trabajo' BEGIN SELECT RAISE(ABORT,'offline rollback'); END").run();
 const body=payload({bolsa_trabajo:[parent],postulaciones_trabajo:[app]});
 check((await rollback.call(route,body)).status===409,'No se detectó la interrupción inyectada.');
 for(const table of ['job_store_records','job_owner_credentials','job_account_links','job_expiry_notices'])check(await rollback.count(table)===0,'El lote interrumpido dejó datos parciales.');
 await rollback.DB.prepare('DROP TRIGGER offline_injected_failure').run();
 check((await rollback.call(route,body)).status===200,'No se pudo retomar el lote tras la interrupción.');
 console.log(JSON.stringify({success:true,environment:'offline-sqlite-memory',remote_d1_validated:false,backup_sha256:createHash('sha256').update(bytes).digest('hex'),embedded_checksum_verified:digestCheck.verified,legacy_backup_without_checksum:digestCheck.legacy,offers:backup.kv.bolsa_trabajo.length,applications:backup.kv.postulaciones_trabajo.length,credentials:credentials.length,account_links:links.length,expiry_ledger:notices.length,batches,repeated_without_duplicates:true,interrupted_batch_rolled_back:true,integrity:'ok',mail:'disabled',scope:'Bolsa records with audience parents preserved; no account or whole-platform disaster recovery'},null,2));
}finally{complete?.close();rollback?.close();globalThis.fetch=originalFetch}
