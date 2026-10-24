import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
import {loadWorker} from './load-worker.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker,uadavJobExpiryReview,uadavJobExpiryKind,uadavJobToday,uadavJobMaintenance}=await loadWorker();
const A='UAC-'+'a'.repeat(64),B='UAC-'+'b'.repeat(64),origin='https://uadav-stream-staging.pages.dev',NOW=Date.parse('2026-10-24T12:00:00Z');
const digest=async value=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))).toString('hex');
async function fixture({expiry=true}={}){
  const DB=sqliteD1(),kv=new Map(),env={DB,ADMIN_KEY:'synthetic-admin',ACCOUNT_ALLOWED_ORIGINS:origin,UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>{kv.set(k,v)}}};
  await DB.prepare('PRAGMA foreign_keys=ON').run();
  const call=async(route,method='GET',body,credential=env.ADMIN_KEY,host='uadav-api-staging.uadavstream.workers.dev')=>{
    const response=await worker.fetch(new Request('https://'+host+'/api/'+route,{method,headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.61',...(credential?{Authorization:'Bearer '+credential}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),env,{});
    return {status:response.status,data:await response.json(),headers:response.headers};
  };
  for(const credential of [A,B])assert.equal((await call('account','POST',{data:{uadav_user_v11:{name:'Cuenta ficticia'}}},credential)).status,200);
  for(const file of ['20261023_job_owner_credentials.sql','20261024_job_store.sql','20261024_job_accounts.sql',...(expiry?['20261024_job_expiry_notices.sql']:[])]){
    const sql=await readFile(new URL('../migrations/staging/'+file,import.meta.url),'utf8');for(const statement of sql.replace(/--[^\n]*/g,'').split(';').filter(x=>x.trim()))await DB.prepare(statement).run();
  }
  await DB.prepare("INSERT INTO job_store_meta(key,value) VALUES('migration_ready','true')").run();env.JOB_STORE_D1='true';
  await DB.prepare('CREATE TABLE notifications(id TEXT PRIMARY KEY,status TEXT)').run();
  const seed=async(id,{account=A,link=true,...extra}={})=>{
    const job={id,titulo:'QA ficticia privada',activo:true,fecha_limite:'2026-10-27',contacto_email:'private@example.invalid',...extra};
    await DB.prepare('INSERT INTO job_store_records(collection,id,data_json,updated_at) VALUES(?,?,?,?)').bind('bolsa_trabajo',id,JSON.stringify(job),new Date(NOW).toISOString()).run();
    if(link)await DB.prepare("INSERT INTO job_account_links(collection,record_id,account_id,linked_at) VALUES('bolsa_trabajo',?,?,?)").bind(id,await digest(account),new Date(NOW).toISOString()).run();return job;
  };
  const change=async(id,patch)=>{const row=await DB.prepare("SELECT data_json FROM job_store_records WHERE collection='bolsa_trabajo' AND id=?").bind(id).first();await DB.prepare("UPDATE job_store_records SET data_json=?,revision=revision+1 WHERE collection='bolsa_trabajo' AND id=?").bind(JSON.stringify({...JSON.parse(row.data_json),...patch}),id).run()};
  const review=options=>uadavJobExpiryReview(env,{now:NOW,...options});
  const count=async table=>(await DB.prepare('SELECT COUNT(*) AS n FROM '+table).first()).n;
  return {DB,env,call,seed,change,review,count,close:()=>DB.close()};
}

test('expiry preview and emission are private, staging-only, schema-gated and never enable email recovery',async()=>{
  const f=await fixture({expiry:false});try{
    assert.equal((await f.call('admin/jobs/expiry-notices','GET',undefined,'')).status,401);
    assert.equal((await f.call('admin/jobs/expiry-notices')).status,503);
    f.env.JOB_STORE_D1='false';assert.equal((await f.call('admin/jobs/expiry-notices')).status,503);
    assert.equal((await f.call('admin/jobs/expiry-notices','GET',undefined,f.env.ADMIN_KEY,'uadav-api.uadavstream.workers.dev')).status,403);
    f.env.JOB_STORE_D1='true';
    for(const route of ['acceso/solicitar','acceso/restablecer'])assert.equal((await f.call('bolsa_trabajo/'+route,'POST',{},'')).status,503);
  }finally{f.close()}
  const ready=await fixture();try{
    const preview=await ready.call('admin/jobs/expiry-notices');assert.equal(preview.status,200);assert.equal(preview.data.dry_run,true);assert.equal(preview.headers.get('Cache-Control'),'no-store');
    assert.equal((await ready.call('admin/jobs/expiry-notices','POST',{fingerprint:preview.data.fingerprint})).status,412);
    ready.env.JOB_STORE_MAINTENANCE='true';assert.equal((await ready.call('admin/jobs/expiry-notices','POST',{confirm:'EMITIR_AVISOS_VENCIMIENTO_STAGING',fingerprint:preview.data.fingerprint})).status,423);
    assert.equal(await ready.count('audience_announcements'),0);
  }finally{ready.close()}
});

test('classification respects Argentina midnight, calendar dates, explicit closures and stale external offers',()=>{
  assert.equal(uadavJobToday(Date.parse('2026-10-25T02:59:59Z')),'2026-10-24');assert.equal(uadavJobToday(Date.parse('2026-10-25T03:00:00Z')),'2026-10-25');
  const classify=patch=>uadavJobExpiryKind({activo:true,fecha_limite:'2026-10-27',...patch},'2026-10-24','2026-10-27',NOW);
  assert.equal(classify({}),'soon');assert.equal(classify({fecha_limite:'2026-10-24'}),'soon');assert.equal(classify({fecha_limite:'2026-10-28'}),null);
  assert.equal(classify({fecha_limite:'2026-10-23'}),'expired');assert.equal(classify({fecha_limite:'2026-10-23',activo:false,estado:'vencida'}),'expired');
  for(const patch of [{fecha_limite:'2026-02-30'},{fecha_limite:''},{activo:false},{activo:0},{estado:'cerrada_por_contratante'},{status:'hidden'},{estado:'pendiente_revision'},{origen:'externo',source_auto_sync:true,last_seen_at:'2026-10-01T00:00:00Z'}])assert.equal(classify(patch),null,JSON.stringify(patch));
});

test('preview is read-only and emits one private reminder per account, deadline and kind',async()=>{
  const f=await fixture();try{
    await f.seed('JOB-EXPIRY-SOON');await f.seed('JOB-EXPIRY-OLD',{account:B,fecha_limite:'2026-10-23'});await f.seed('JOB-EXPIRY-ANON',{link:false});await f.seed('JOB-EXPIRY-CLOSED',{activo:false,estado:'cerrada_por_contratante'});
    const preview=await f.review();assert.equal(preview.pending,2);assert.equal(await f.count('job_expiry_notices'),0);assert.equal(await f.count('audience_announcements'),0);
    const wire=JSON.stringify(preview);for(const privateValue of [A,B,await digest(A),await digest(B),'private@example.invalid'])assert(!wire.includes(privateValue));
    const sent=await f.review({dryRun:false,fingerprint:preview.fingerprint});assert.equal(sent.emitted,2);assert.equal(sent.recorded,2);assert.equal((await f.review()).pending,0);
    for(const credential of [A,B]){const notices=await f.call('account/notifications','GET',undefined,credential);assert.equal(notices.data.items.length,1);const text=JSON.stringify(notices.data.items);assert(!text.includes('private@example.invalid'));assert(!text.includes('QA ficticia privada'));}
    assert.equal(await f.count('notifications'),0,'email outbox is untouched');
  }finally{f.close()}
});

test('simultaneous processing is idempotent and deleting a visible reminder cannot make it reappear',async()=>{
  const f=await fixture();try{
    await f.seed('JOB-EXPIRY-RACE');const results=await Promise.all([f.review({dryRun:false}),f.review({dryRun:false})]);assert.equal(results.reduce((n,x)=>n+x.emitted,0),1);assert.equal(await f.count('job_expiry_notices'),1);assert.equal(await f.count('audience_announcements'),1);
    await f.DB.prepare('DELETE FROM audience_announcements').run();assert.equal((await f.review({dryRun:false})).emitted,0);
    await f.change('JOB-EXPIRY-RACE',{fecha_limite:'2026-10-26'});assert.equal((await f.review({dryRun:false})).emitted,1);assert.equal(await f.count('job_expiry_notices'),2);
  }finally{f.close()}
});

test('a failed notice rolls back its ledger; retry sends it once and stale confirmation is rejected',async()=>{
  const f=await fixture();try{
    await f.seed('JOB-EXPIRY-ROLLBACK');const preview=await f.review(),batch=f.DB.batch;
    f.DB.batch=statements=>batch(statements.map(s=>s.sql.startsWith('INSERT OR IGNORE INTO audience_announcements')?f.DB.prepare("INSERT INTO job_store_checks(id,valid) VALUES('notice-error',0)"):s));
    await assert.rejects(()=>f.review({dryRun:false}),e=>e.jobCode==='JOB_EXPIRY_CONFLICT'&&!e.message.includes('CHECK'));
    assert.equal(await f.count('job_expiry_notices'),0);assert.equal(await f.count('audience_announcements'),0);f.DB.batch=batch;
    await f.change('JOB-EXPIRY-ROLLBACK',{fecha_limite:'2026-10-25'});await assert.rejects(()=>f.review({dryRun:false,fingerprint:preview.fingerprint}),e=>e.jobCode==='JOB_EXPIRY_CHANGED');
    assert.equal((await f.review({dryRun:false})).emitted,1);
  }finally{f.close()}
});

test('renewal, closure, changed ownership or deletion immediately before commit cancels every notice in that batch',async()=>{
  for(const scenario of ['renew','close','owner','delete']){
    const f=await fixture();try{
      await f.seed('JOB-EXPIRY-A');await f.seed('JOB-EXPIRY-B');const batch=f.DB.batch;let injected=false;
      f.DB.batch=async statements=>{
        if(!injected&&statements.some(s=>s.sql.startsWith('INSERT OR IGNORE INTO job_expiry_notices'))){injected=true;
          if(scenario==='renew')await f.change('JOB-EXPIRY-A',{fecha_limite:'2027-01-01'});
          if(scenario==='close')await f.change('JOB-EXPIRY-A',{activo:false,estado:'cerrada_por_contratante'});
          if(scenario==='owner')await f.DB.prepare("UPDATE job_account_links SET account_id=? WHERE record_id='JOB-EXPIRY-A'").bind(await digest(B)).run();
          if(scenario==='delete')await f.DB.prepare('DELETE FROM audience_accounts WHERE id=?').bind(await digest(A)).run();
        }return batch(statements);
      };
      await assert.rejects(()=>f.review({dryRun:false}),e=>e.jobCode==='JOB_EXPIRY_CONFLICT',scenario);assert.equal(await f.count('job_expiry_notices'),0);assert.equal(await f.count('audience_announcements'),0);
    }finally{f.close()}
  }
});

test('bounded batches progress past invalid dates, never replay notices and stay within the D1 request budget',async()=>{
  const f=await fixture();try{
    const statements=[],accountId=await digest(A);
    for(let i=0;i<2000;i++){const id='JOB-EXPIRY-PAGE-'+String(i).padStart(4,'0'),job={id,titulo:'QA',activo:true,fecha_limite:i<260?'2026-02-30':'2026-10-27'};statements.push(f.DB.prepare('INSERT INTO job_store_records(collection,id,data_json,updated_at) VALUES(?,?,?,?)').bind('bolsa_trabajo',id,JSON.stringify(job),new Date(NOW).toISOString()),f.DB.prepare("INSERT INTO job_account_links(collection,record_id,account_id,linked_at) VALUES('bolsa_trabajo',?,?,?)").bind(id,accountId,new Date(NOW).toISOString()));}
    for(let i=0;i<statements.length;i+=40)await f.DB.batch(statements.slice(i,i+40));
    const prepare=f.DB.prepare,batch=f.DB.batch;let requests=0;f.DB.prepare=sql=>{const s=prepare(sql);for(const method of ['run','all','first']){const original=s[method];s[method]=function(...args){requests++;return original.apply(this,args)}}return s};f.DB.batch=s=>{requests++;return batch(s)};
    const result=await f.review({dryRun:false});assert.equal(result.pending,1740);assert.equal(result.emitted,5);assert.equal(result.more_pending,true);assert(requests<=50,'D1 requests: '+requests);
    f.DB.prepare=prepare;f.DB.batch=batch;assert.equal((await f.review()).pending,1735);assert.equal((await f.review({dryRun:false})).emitted,5);assert.equal(await f.count('job_expiry_notices'),10);
  }finally{f.close()}
});

test('maintenance closes expired offers before creating notices and preserves candidates',async()=>{
  const f=await fixture();try{
    const yesterday=new Date(Date.parse(uadavJobToday()+'T12:00:00Z')-86400000).toISOString().slice(0,10);await f.seed('JOB-EXPIRY-CRON',{fecha_limite:yesterday});
    const before=await f.call('bolsa_trabajo/cuenta','GET',undefined,A);assert.equal(before.data.items[0].estado,'vencida','Mi Perfil reflects an elapsed deadline before maintenance runs');assert.equal(before.data.items[0].recibe_postulaciones,false);
    await f.DB.prepare('INSERT INTO job_store_records(collection,id,data_json,updated_at) VALUES(?,?,?,?)').bind('postulaciones_trabajo','POST-EXPIRY-CRON',JSON.stringify({id:'POST-EXPIRY-CRON',job_id:'JOB-EXPIRY-CRON',estado:'recibida'}),new Date().toISOString()).run();
    const result=await uadavJobMaintenance(f.env);assert.equal(result.processed,1);assert.equal(result.notices.emitted,1);assert.equal((await f.call('bolsa_trabajo','GET',undefined,'')).data.length,0);assert.equal(await f.count('job_store_records'),2);assert.equal((await uadavJobMaintenance(f.env)).notices.emitted,0);
  }finally{f.close()}
});

test('backup and missing-only restoration retain reminder deduplication without sending historical messages',async()=>{
  const f=await fixture();try{
    await f.seed('JOB-EXPIRY-RESTORE');await f.review({dryRun:false});const backup=(await f.call('v7/export')).data;assert.equal(backup.job_expiry_notices_available,true);assert.equal(backup.tables.job_expiry_notices.length,1);
    await f.DB.prepare('DELETE FROM job_store_records').run();await f.DB.prepare('DELETE FROM job_expiry_notices').run();await f.DB.prepare('DELETE FROM audience_announcements').run();f.env.ENABLE_JOB_D1_RESTORE='staging-tested';
    const body={confirm:'RECUPERAR FALTANTES',confirm_second:'APLICAR RECUPERACION',external_backup_confirmed:true,dry_run:false,restore_account_links:true,backup};
    const result=await f.call('admin/backup/jobs/restore-missing','POST',body);assert.equal(result.status,200);assert.equal(result.data.expiry_notices_restored,1);assert.equal(await f.count('audience_announcements'),0);assert.equal((await f.review()).pending,0);
    assert.equal((await f.call('admin/backup/jobs/restore-missing','POST',body)).data.expiry_notices_restored,0);
    await f.DB.prepare('DELETE FROM job_store_records').run();await f.DB.prepare('DELETE FROM job_expiry_notices').run();const malformed=structuredClone(body);malformed.backup.tables.job_expiry_notices[0].notice_id='forged';assert.equal((await f.call('admin/backup/jobs/restore-missing','POST',malformed)).status,400);assert.equal(await f.count('job_store_records'),0);
    const batch=f.DB.batch;f.DB.batch=s=>batch(s.map(x=>x.sql.startsWith('INSERT OR IGNORE INTO job_expiry_notices')?f.DB.prepare("INSERT INTO job_store_checks(id,valid) VALUES('restore-notice-error',0)"):x));assert.equal((await f.call('admin/backup/jobs/restore-missing','POST',body)).status,409);assert.equal(await f.count('job_store_records'),0);assert.equal(await f.count('job_account_links'),0);assert.equal(await f.count('job_expiry_notices'),0);
    f.DB.batch=batch;await f.DB.prepare('DELETE FROM audience_accounts WHERE id=?').bind(await digest(A)).run();const deleted=await f.call('admin/backup/jobs/restore-missing','POST',body);assert.equal(deleted.status,200);assert.equal(deleted.data.expiry_notices_restored,0);assert.equal(deleted.data.expiry_notices_skipped,1);
  }finally{f.close()}
});
