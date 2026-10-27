/* Real public-source data, disposable local SQLite/KV only. No remote requests,
 * applicant data, source submissions, email or Cloudflare deployment. The clock
 * is explicitly fixed to the source review date; the original deadline stays. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto,createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {loadWorker} from '../tests/load-worker.mjs';
import {sqliteD1} from '../tests/sqlite-d1.mjs';

globalThis.crypto ||= webcrypto;
// Read the real Pages checkout without copying frontend code into the Worker branch.
const pagesRoot=pathToFileURL(resolve(process.argv[2]||fileURLToPath(new URL('../../uadav-pages/',import.meta.url)))+'/');
const require=createRequire(new URL('admin.html',pagesRoot)),XLSX=require('./vendor/xlsx-0.20.3.full.min.js');
const {default:worker}=await loadWorker();
const originalDate=globalThis.Date,originalFetch=globalThis.fetch;
let clock=originalDate.parse('2026-10-27T19:00:00Z'),attemptedNetwork=0;
class ReviewDate extends originalDate {
 constructor(...args){super(...(args.length?args:[clock]))}
 static now(){return clock}
}
const context={window:{},Intl,URL,Date:ReviewDate};
const reader=await readFile(new URL('uadav-jobs-import.js',pagesRoot),'utf8');
vm.runInNewContext(reader,context);
const jobs=context.window.UADAVJobsImport;
const csvPath='releases/bolsa-fuente-real-colon-20261027.csv';
const csvBytes=await readFile(new URL('../'+csvPath,import.meta.url));
const workbook=await jobs.readWorkbook({name:'real-source.csv',text:async()=>csvBytes.toString('utf8')},XLSX);
const rows=jobs.sheetRows(workbook,workbook.SheetNames[0],'jobs',XLSX);
assert.equal(rows.length,1);
const row=jobs.normalize(rows[0],{visible:true,now:clock});
assert.equal(row.fecha_limite,'2026-11-23');
assert.equal(row.source_url,'https://teatrocolon.org.ar/concurso/concurso-publico-y-abierto-orquesta-estable-del-teatro-colon-4/');
const origin='https://uadav-stream-staging.pages.dev';
const DB=sqliteD1(),kv=new Map();
const env={DB,JOB_STORE_D1:'true',ADMIN_KEY:'synthetic-csv-rehearsal-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,String(v))}};
const checks=[];
async function call(route,method='GET',body,admin=false){
 const response=await worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/'+route,{method,headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.117',...(admin?{Authorization:'Bearer '+env.ADMIN_KEY}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),env,{});
 return {status:response.status,data:await response.json()};
}
const importRow=()=>call('admin/federated/import','POST',{kind:'job',items:[row]},true);
try{
 globalThis.Date=ReviewDate;
 globalThis.fetch=async()=>{attemptedNetwork++;throw Error('Remote network disabled in local rehearsal')};
 await DB.prepare('PRAGMA foreign_keys=ON').run();
 for(const name of ['20261023_job_owner_credentials.sql','20261024_job_store.sql']){
  const sql=await readFile(new URL('../migrations/staging/'+name,import.meta.url),'utf8');
  for(const statement of sql.replace(/--[^\n]*/g,'').split(';').filter(s=>s.trim()))await DB.prepare(statement).run();
 }
 await DB.prepare("INSERT INTO job_store_meta(key,value) VALUES('migration_ready','true')").run();

 const denied=await call('admin/federated/import','POST',{kind:'job',items:[row]});
 assert.equal(denied.status,401);checks.push('Admin authorization required before importing');
 const capture=await call('admin/federated/url-preview','POST',{url:row.source_url,kind:'job'},true);
 assert.equal(capture.status,422);assert.equal(attemptedNetwork,0);
 checks.push('Unapproved direct HTML publisher fails before network; CSV is the supported path');

 let posted;
 await jobs.sendBatch({entity:'jobs',rows:[row]},{origin,request:async(route,options)=>{posted=await call(route,options.method,options.body,true);assert.equal(posted.status,200);return posted.data}});
 assert.equal(posted.data.imported,1);
 const catalog=await call('bolsa_trabajo');assert.equal(catalog.status,200);assert.equal(catalog.data.length,1);
 const id=catalog.data[0].id;
 assert.equal(catalog.data[0].application_mode,'external_url');
 assert.equal(catalog.data[0].application_url,row.source_url);
 assert(!Object.keys(catalog.data[0]).some(k=>/secret|clave|token|hash|password/i.test(k)));
 checks.push('Actual UTF-8 CSV reader, normalization and import produce one public external link locally');

 const repeat=await importRow();assert.equal(repeat.status,200);assert.equal(repeat.data.imported,0);assert.equal(repeat.data.updated,1);
 assert.equal((await call('bolsa_trabajo')).data[0].id,id);
 checks.push('Identical source URL reimport retains one record and its identifier');
 const apply=await call('bolsa_trabajo/postular','POST',{job_id:id,request_id:randomUUID(),nombre:'Synthetic CSV QA',email:'qa@example.invalid',consentimiento:true});
 assert([400,409].includes(apply.status));
 const applications=await DB.prepare("SELECT COUNT(*) n FROM job_store_records WHERE collection='postulaciones_trabajo'").first();assert.equal(applications.n,0);
 checks.push('External opportunity refuses an internal application and stores no applicant');

 assert.equal((await call('bolsa_trabajo','PUT',{id,activo:false},true)).status,200);
 assert.equal((await call('bolsa_trabajo')).data.length,0);
 assert.equal((await importRow()).status,200);assert.equal((await call('bolsa_trabajo')).data.length,0);
 checks.push('Manual withdrawal preserves history and a reimport cannot reopen the offer');

 const invalid=await call('admin/federated/import','POST',{kind:'job',items:[{...row,source_url:'https://127.0.0.1/private'}]},true);
 assert.equal(invalid.status,400);assert.equal((await DB.prepare("SELECT COUNT(*) n FROM job_store_records WHERE collection='bolsa_trabajo'").first()).n,1);
 checks.push('Unsafe source errors leave the existing record intact');
 assert.equal((await call('bolsa_trabajo','PUT',{id,activo:true},true)).status,200);
 assert.equal((await call('bolsa_trabajo')).data.length,1);
 clock=originalDate.parse('2026-11-24T03:00:00Z');
 assert.equal((await call('bolsa_trabajo')).data.length,0);
 assert.throws(()=>jobs.normalize(rows[0],{visible:true,now:clock}),/fecha límite/);
 assert.equal((await DB.prepare("SELECT COUNT(*) n FROM job_store_records WHERE collection='bolsa_trabajo'").first()).n,1);
 checks.push('Original official deadline expires the public listing while preserving its stored history');
 assert.equal(attemptedNetwork,0);
 console.log(JSON.stringify({scope:'real-source-csv-local-rehearsal',source_url:row.source_url,fixture_review_day:'2026-10-27',original_deadline:row.fecha_limite,csv_path:csvPath,csv_sha256:createHash('sha256').update(csvBytes).digest('hex'),reader_sha256:createHash('sha256').update(reader).digest('hex'),result:'complete',passed_checks:checks.length,checks,network_attempts:attemptedNetwork,staging_published:false,source_form_submitted:false,real_applications:false,real_mail_sent:false,production_touched:false},null,2));
}finally{
 globalThis.Date=originalDate;globalThis.fetch=originalFetch;DB.close();
}
