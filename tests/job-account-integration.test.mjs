import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto,randomUUID} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
import {loadWorker} from './load-worker.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker,uadavJobMigration,uadavJobRedeemRecovery}=await loadWorker();
const origin='https://uadav-stream-staging.pages.dev',a='UAC-'+'a'.repeat(64),b='UAC-'+'b'.repeat(64);
const digest=async value=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))).toString('hex');
async function fixture({schema=true}={}){
  const DB=sqliteD1(),kv=new Map(),env={DB,ADMIN_KEY:'synthetic-admin-only',ACCOUNT_ALLOWED_ORIGINS:origin,UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>{kv.set(k,v)}}};
  await DB.prepare('PRAGMA foreign_keys=ON').run();
  const call=async(route,method='GET',body,credential='',requestOrigin=origin)=>{
    const headers={'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.20',...(credential?{Authorization:'Bearer '+credential}:{}),...(requestOrigin?{Origin:requestOrigin}:{})};
    const response=await worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/'+route,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})}),env,{});
    return {status:response.status,data:await response.json(),headers:response.headers};
  };
  for(const credential of [a,b])assert.equal((await call('account','POST',{data:{uadav_user_v11:{name:'Persona ficticia'}}},credential)).status,200);
  const install=async file=>{const sql=await readFile(new URL('../migrations/staging/'+file,import.meta.url),'utf8');for(const statement of sql.replace(/--[^\n]*/g,'').split(';').filter(s=>s.trim()))await DB.prepare(statement).run()};
  for(const file of ['20261023_job_owner_credentials.sql','20261024_job_store.sql'])await install(file);
  if(schema)await install('20261024_job_accounts.sql');
  env.JOB_STORE_MAINTENANCE='true';const preview=await uadavJobMigration(env);await uadavJobMigration(env,{dry_run:false,confirm:'MIGRAR_BOLSA_STAGING',fingerprint:preview.fingerprint});env.JOB_STORE_D1='true';env.JOB_STORE_MAINTENANCE='false';
  const count=async table=>(await DB.prepare('SELECT COUNT(*) AS n FROM '+table).first()).n;
  return {DB,env,kv,call,install,count,close:()=>DB.close()};
}
const offer=(extra={})=>({titulo:'QA ficticia',descripcion:'No es una oferta real.',contacto:'qa@example.invalid',request_id:randomUUID(),...extra});
const application=(job_id,extra={})=>({job_id,nombre:'Persona ficticia',email:'qa@example.invalid',request_id:randomUUID(),consent_scope:'job_application_v1',consent_at:new Date().toISOString(),shared_fields:['nombre','email'],...extra});
const proof=(job,extra={})=>({tipo:'oferta',id:job.item.id,clave:job.clave_contratante,confirm:'VINCULAR_A_MI_CUENTA',...extra});

test('saving requires a real account and boolean choice; caller IDs and matching emails never determine the owner',async()=>{
  const f=await fixture();try{
    assert.equal((await f.call('bolsa_trabajo','POST',offer({save_to_account:true}))).status,401);
    assert.equal((await f.call('bolsa_trabajo','POST',offer({save_to_account:'true'}),a)).status,400);
    assert.equal(await f.count('job_store_records'),0);
    const created=await f.call('bolsa_trabajo','POST',offer({save_to_account:true,account_id:await digest(b)}),a);assert.equal(created.status,200);assert.equal(created.data.account_saved,true);
    const mine=await f.call('bolsa_trabajo/cuenta','GET',undefined,a),other=await f.call('bolsa_trabajo/cuenta','GET',undefined,b);
    assert.equal(mine.data.items.length,1);assert.equal(other.data.items.length,0);assert.equal(mine.headers.get('Cache-Control'),'no-store');
    for(const value of [created.data.clave_contratante,'qa@example.invalid',await digest(a),await digest(b)])assert(!JSON.stringify(mine.data).includes(value));
    assert.equal((await f.call('bolsa_trabajo/cuenta','GET',undefined,a,'https://untrusted.invalid')).status,403);
    assert.equal((await f.call('bolsa_trabajo/cuenta')).status,401);
  }finally{f.close()}
});

test('missing account schema preserves anonymous publication but cannot report an account save',async()=>{
  const f=await fixture({schema:false});try{
    assert.equal((await f.call('bolsa_trabajo','POST',offer())).status,200);
    assert.equal((await f.call('bolsa_trabajo','POST',offer({save_to_account:true}),a)).status,503);
    assert.equal(await f.count('job_store_records'),1);await f.install('20261024_job_accounts.sql');
    assert.equal((await f.call('bolsa_trabajo/cuenta','GET',undefined,a)).status,200);
  }finally{f.close()}
});

test('new offer, hashed credential and account association roll back together on failure',async()=>{
  const f=await fixture();try{
    const batch=f.DB.batch;f.DB.batch=statements=>batch([...statements,f.DB.prepare("INSERT INTO job_store_checks(id,valid) VALUES('injected-failure',0)")]);
    const result=await f.call('bolsa_trabajo','POST',offer({save_to_account:true}),a);
    assert.equal(result.status,409);for(const table of ['job_store_records','job_owner_credentials','job_account_links'])assert.equal(await f.count(table),0);
    assert(!JSON.stringify(result.data).includes('CHECK'));assert(!JSON.stringify(result.data).includes('INSERT'));
  }finally{f.close()}
});

test('revocation or account deletion between authentication and commit prevents the saved publication',async()=>{
  for(const scenario of ['device','recovery','deleted']){
    const f=await fixture();try{
      const device=scenario==='device'?(await f.call('account/devices','POST',{name:'QA device'},a)).data.secret:a;
      const batch=f.DB.batch;let injected=false;
      f.DB.batch=async statements=>{
        if(!injected&&statements.some(s=>s.sql.startsWith('INSERT INTO job_store_records'))){
          injected=true;
          if(scenario==='device')await f.DB.prepare('UPDATE audience_devices SET revoked_at=? WHERE credential_hash=?').bind(Date.now(),await digest(device)).run();
          if(scenario==='recovery')await f.DB.prepare('INSERT INTO audience_recovery_keys(credential_hash,account_id,revoked_at) VALUES(?,?,?)').bind(await digest(a),await digest(a),Date.now()).run();
          if(scenario==='deleted'){await f.DB.prepare('INSERT INTO audience_deletions(account_id,deleted_at) VALUES(?,?)').bind(await digest(a),Date.now()).run();await f.DB.prepare('DELETE FROM audience_accounts WHERE id=?').bind(await digest(a)).run()}
        }
        return batch(statements);
      };
      const result=await f.call('bolsa_trabajo','POST',offer({save_to_account:true}),device);assert.equal(result.status,409,scenario);
      for(const table of ['job_store_records','job_owner_credentials','job_account_links'])assert.equal(await f.count(table),0,scenario+': '+table);
    }finally{f.close()}
  }
});

test('importing a receipt requires proof, is idempotent and cannot silently transfer an existing association',async()=>{
  const f=await fixture();try{
    const job=(await f.call('bolsa_trabajo','POST',offer())).data;
    assert.equal((await f.call('bolsa_trabajo/cuenta/vincular','POST',proof(job,{clave:'0'.repeat(64)}),a)).status,404);
    assert.equal((await f.call('bolsa_trabajo/cuenta/vincular','POST',proof(job,{confirm:''}),a)).status,400);
    for(let i=0;i<2;i++)assert.equal((await f.call('bolsa_trabajo/cuenta/vincular','POST',proof(job),a)).status,200);
    assert.equal((await f.call('bolsa_trabajo/cuenta/vincular','POST',proof(job),b)).status,409);assert.equal(await f.count('job_account_links'),1);
    assert.equal((await f.call('bolsa_trabajo/cuenta/quitar','POST',{tipo:'oferta',id:job.item.id,confirm:'QUITAR_DE_MI_CUENTA'},b)).status,200);assert.equal(await f.count('job_account_links'),1);
    assert.equal((await f.call('bolsa_trabajo/cuenta/quitar','POST',{tipo:'oferta',id:job.item.id,confirm:'QUITAR_DE_MI_CUENTA'},a)).status,200);
    assert.equal((await f.call('bolsa_trabajo/cuenta/vincular','POST',proof(job),b)).status,200);
    assert.equal((await f.call('bolsa_trabajo/mis-postulantes','POST',{job_id:job.item.id,clave:job.clave_contratante})).status,200,'original private proof remains valid');
  }finally{f.close()}
});

test('two accounts concurrently importing one receipt produce exactly one association',async()=>{
  const f=await fixture();try{
    const job=(await f.call('bolsa_trabajo','POST',offer())).data;
    const race=await Promise.all([a,b].map(credential=>f.call('bolsa_trabajo/cuenta/vincular','POST',proof(job),credential)));
    assert.deepEqual(race.map(x=>x.status).sort(),[200,409]);assert.equal(await f.count('job_account_links'),1);
  }finally{f.close()}
});

test('account access is isolated, shared by its approved devices, and respects applicant consent',async()=>{
  const f=await fixture();try{
    const job=(await f.call('bolsa_trabajo','POST',offer({save_to_account:true}),a)).data;
    const app=await f.call('bolsa_trabajo/postular','POST',application(job.item.id,{save_to_account:true}),b);assert.equal(app.status,200);assert.equal(app.data.account_saved,true);
    assert.equal((await f.call('bolsa_trabajo/mis-postulantes','POST',{job_id:job.item.id,cuenta:true},b)).status,404);
    const inbox=await f.call('bolsa_trabajo/mis-postulantes','POST',{job_id:job.item.id,cuenta:true},a);assert.equal(inbox.status,200);assert.equal(inbox.data.items.length,1);assert.equal(inbox.data.items[0].whatsapp,'');
    assert.equal((await f.call('bolsa_trabajo/mi-oferta/gestionar','POST',{job_id:job.item.id,cuenta:true,accion:'cerrar'},b)).status,404);
    assert.equal((await f.call('bolsa_trabajo/mi-oferta/gestionar','POST',{job_id:job.item.id,cuenta:true,accion:'cerrar'},a)).status,200);
    assert.equal((await f.call('bolsa_trabajo','GET')).data.length,0);
    assert.equal((await f.call('bolsa_trabajo/mi-oferta/gestionar','POST',{job_id:job.item.id,cuenta:true,accion:'renovar'},a)).status,200);
    const device=(await f.call('account/devices','POST',{name:'Dispositivo de QA'},a)).data.secret;
    assert.equal((await f.call('bolsa_trabajo/cuenta','GET',undefined,device)).data.items[0].id,job.item.id);
    const mine=await f.call('bolsa_trabajo/cuenta','GET',undefined,b);assert.equal(mine.data.items[0].id,app.data.item.id);assert.equal(mine.data.items[0].titulo,'QA ficticia');
    assert(!JSON.stringify(mine.data).includes(app.data.clave_consulta));
  }finally{f.close()}
});

test('application receipt can be linked later; account and record deletions cascade only their associations',async()=>{
  const f=await fixture();try{
    const job=(await f.call('bolsa_trabajo','POST',offer())).data,app=(await f.call('bolsa_trabajo/postular','POST',application(job.item.id))).data;
    assert.equal((await f.call('bolsa_trabajo/cuenta/vincular','POST',{tipo:'postulacion',id:app.item.id,clave:app.clave_consulta,confirm:'VINCULAR_A_MI_CUENTA'},a)).status,200);
    await f.DB.prepare('DELETE FROM audience_accounts WHERE id=?').bind(await digest(a)).run();assert.equal(await f.count('job_account_links'),0);assert.equal(await f.count('job_store_records'),2);
    await f.call('bolsa_trabajo/cuenta/vincular','POST',proof(job),b);assert.equal(await f.count('job_account_links'),1);
    await f.DB.prepare("DELETE FROM job_store_records WHERE collection='bolsa_trabajo' AND id=?").bind(job.item.id).run();assert.equal(await f.count('job_account_links'),0);assert.equal(await f.count('job_store_records'),1);
  }finally{f.close()}
});

test('new applications and status changes create atomic, private, idempotent account notices',async()=>{
  const f=await fixture();try{
    const job=(await f.call('bolsa_trabajo','POST',offer({save_to_account:true}),a)).data;
    const body=application(job.item.id,{save_to_account:true}),race=await Promise.all([f.call('bolsa_trabajo/postular','POST',body,b),f.call('bolsa_trabajo/postular','POST',body,b)]);
    assert.deepEqual(race.map(x=>x.status).sort(),[200,409]);const app=race.find(x=>x.status===200).data;
    let notices=(await f.DB.prepare('SELECT * FROM audience_announcements').all()).results;assert.equal(notices.length,1);assert.equal(notices[0].account_id,await digest(a));assert(!notices[0].message.includes('qa@example.invalid'));
    const update={id:app.item.id,estado:'en_revision'};assert.equal((await f.call('bolsa_trabajo/postulaciones/estado','POST',update,f.env.ADMIN_KEY)).status,200);
    await f.call('bolsa_trabajo/postulaciones/estado','POST',update,f.env.ADMIN_KEY);notices=(await f.DB.prepare('SELECT * FROM audience_announcements').all()).results;assert.equal(notices.length,2);assert.equal(notices.filter(x=>x.account_id===accountB).length,1);
    const ownerNotices=await f.call('account/notifications','GET',undefined,a),applicantNotices=await f.call('account/notifications','GET',undefined,b);
    assert.equal(ownerNotices.status,200);assert.equal(applicantNotices.status,200);assert.equal(ownerNotices.data.items.length,1);assert.equal(applicantNotices.data.items.length,1);
    const notice=applicantNotices.data.items[0];assert.equal(notice.read,false);assert.equal((await f.call('account/notifications','PATCH',{keys:[notice.id]},b)).status,200);assert.equal((await f.call('account/notifications','GET',undefined,b)).data.items[0].read,true);
  }finally{f.close()}
});
const accountB=await digest(b);

test('account list pages have explicit cursors and backups include the private association table',async()=>{
  const f=await fixture();try{
    assert.equal((await f.call('bolsa_trabajo/cuenta?offset=-1','GET',undefined,a)).status,400);
    const job=(await f.call('bolsa_trabajo','POST',offer({save_to_account:true}),a)).data;
    const backup=await f.call('v7/export','GET',undefined,f.env.ADMIN_KEY);assert.equal(backup.status,200);assert.equal(backup.data.job_accounts_available,true);assert.equal(backup.data.tables.job_account_links.length,1);assert(!JSON.stringify(backup.data.tables.job_account_links).includes(job.clave_contratante));
    await f.install('20261024_job_accounts.sql');assert.equal(await f.count('job_account_links'),1,'installer is idempotent');
    for(let i=0;i<51;i++){
      const id='JOB-PAGE-'+i;await f.DB.prepare('INSERT INTO job_store_records(collection,id,data_json,updated_at) VALUES(?,?,?,?)').bind('bolsa_trabajo',id,JSON.stringify({id,titulo:'QA '+i,activo:true}),new Date().toISOString()).run();
      await f.DB.prepare('INSERT INTO job_account_links(collection,record_id,account_id,linked_at) VALUES(?,?,?,?)').bind('bolsa_trabajo',id,await digest(a),new Date().toISOString()).run();
    }
    const first=await f.call('bolsa_trabajo/cuenta','GET',undefined,a),second=await f.call('bolsa_trabajo/cuenta?offset='+first.data.next_offset,'GET',undefined,a);
    assert.equal(first.data.items.length,50);assert.equal(second.data.items.length,2);assert.equal(second.data.next_offset,null);assert.equal(new Set([...first.data.items,...second.data.items].map(x=>x.id)).size,52);
  }finally{f.close()}
});

test('notice failure rolls back the application and its account association rather than losing the notice',async()=>{
  const f=await fixture();try{
    const job=(await f.call('bolsa_trabajo','POST',offer({save_to_account:true}),a)).data,batch=f.DB.batch;
    f.DB.batch=statements=>batch(statements.map(statement=>statement.sql.startsWith('INSERT OR IGNORE INTO audience_announcements')?f.DB.prepare("INSERT INTO job_store_checks(id,valid) VALUES('notice-failure',0)"):statement));
    const app=await f.call('bolsa_trabajo/postular','POST',application(job.item.id,{save_to_account:true}),b);assert.equal(app.status,409);assert.equal(await f.count('job_store_records'),1);assert.equal(await f.count('job_account_links'),1);assert.equal(await f.count('audience_announcements'),0);
  }finally{f.close()}
});

test('an artist proof from another account or a legacy unbound proof cannot be saved as this account application',async()=>{
  const f=await fixture();try{
    const job=(await f.call('bolsa_trabajo','POST',offer({save_to_account:true}),a)).data;
    const accountA=await digest(a),accountB=await digest(b);
    await f.DB.prepare('INSERT INTO audience_artist_links(account_id,artist_id,claim_id,expires_at,created_at) VALUES(?,?,NULL,0,?)').bind(accountA,'ART-OWNER-A',Date.now()).run();
    f.kv.set('artistas',JSON.stringify([{id:'ART-OWNER-A',nombre:'Artista ficticio A',claimed:true}]));
    f.kv.set('artist_access_qa_other_artist',JSON.stringify({artist_id:'ART-OWNER-A',account_id:accountA,account_credential_hash:accountA,expires:Date.now()+600000}));
    f.kv.set('artist_access_qa_legacy_artist',JSON.stringify({artist_id:'ART-OWNER-A',expires:Date.now()+600000}));
    const body=extra=>application(job.item.id,{save_to_account:true,artist_token:'qa_other_artist',shared_fields:['nombre','email','artist_profile'],...extra});
    for(const artist_token of ['qa_other_artist','qa_legacy_artist']){
      const r=await f.call('bolsa_trabajo/postular','POST',body({artist_token,account_id:accountA}),b);assert.equal(r.status,403);assert(!JSON.stringify(r.data).includes(accountA));assert(!JSON.stringify(r.data).includes(accountB));
    }
    assert.equal((await f.DB.prepare("SELECT COUNT(*) AS n FROM job_store_records WHERE collection='postulaciones_trabajo'").first()).n,0);
    assert.equal(await f.count('job_account_links'),1);assert.equal(await f.count('audience_announcements'),0);
    const own=await f.call('bolsa_trabajo/postular','POST',body({}),a);assert.equal(own.status,200);assert.equal(own.data.account_saved,true);
    const publicResult=await f.call('bolsa_trabajo/postular','POST',body({save_to_account:false,artist_token:'qa_legacy_artist'}));assert.equal(publicResult.status,200);assert.equal(publicResult.data.account_saved,false);
  }finally{f.close()}
});

test('maximum collections with verified artist and account save remain below 50 D1 subrequests',async()=>{
  const f=await fixture();try{
    const job=(await f.call('bolsa_trabajo','POST',offer({save_to_account:true}),a)).data;
    const seed=[];
    for(let i=0;i<1999;i++){
      const id='JOB-CAP-'+i;seed.push(f.DB.prepare('INSERT INTO job_store_records(collection,id,data_json,updated_at) VALUES(?,?,?,?)').bind('bolsa_trabajo',id,JSON.stringify({id,titulo:'QA',activo:true}),new Date().toISOString()));
      const appId='POST-CAP-'+i;seed.push(f.DB.prepare('INSERT INTO job_store_records(collection,id,data_json,updated_at) VALUES(?,?,?,?)').bind('postulaciones_trabajo',appId,JSON.stringify({id:appId,job_id:job.item.id,estado:'recibida'}),new Date().toISOString()));
    }
    for(let i=0;i<seed.length;i+=20)await f.DB.batch(seed.slice(i,i+20));
    await f.DB.prepare('INSERT INTO audience_artist_links(account_id,artist_id,claim_id,expires_at,created_at) VALUES(?,?,NULL,0,?)').bind(accountB,'ART-QA',Date.now()).run();
    f.kv.set('artist_access_qa_artist_private_token',JSON.stringify({artist_id:'ART-QA',account_id:accountB,account_credential_hash:accountB,expires:Date.now()+600000}));
    f.kv.set('artistas',JSON.stringify([{id:'ART-QA',nombre:'Artista ficticio',claimed:true}]));
    const prepare=f.DB.prepare,batch=f.DB.batch;let subrequests=0;
    f.DB.prepare=sql=>{const statement=prepare(sql),run=statement.run;statement.run=function(){subrequests++;return run.call(this)};return statement};
    f.DB.batch=statements=>{subrequests++;return batch(statements)};
    const result=await f.call('bolsa_trabajo/postular','POST',application(job.item.id,{save_to_account:true,artist_token:'qa_artist_private_token',shared_fields:['nombre','email','artist_profile']}),b);
    assert.equal(result.status,200);assert(subrequests<=50,'Executed '+subrequests+' D1 subrequests');
    assert.equal((await f.call('bolsa_trabajo/cuenta','GET',undefined,b)).data.items.length,1);
    await f.DB.prepare('INSERT INTO job_store_records(collection,id,data_json,updated_at) VALUES(?,?,?,?)').bind('bolsa_trabajo','JOB-OVER-CAP',JSON.stringify({id:'JOB-OVER-CAP',activo:true}),new Date().toISOString()).run();
    const over=await f.call('bolsa_trabajo');assert.equal(over.status,503);assert.equal(over.data.code,'JOB_CAPACITY','lookahead must reject excess records, not silently truncate them');
  }finally{f.close()}
});

test('explicit missing-only restoration recovers associations, skips deleted accounts and sends no historical notices',async()=>{
  const f=await fixture();try{
    const job=(await f.call('bolsa_trabajo','POST',offer({save_to_account:true}),a)).data;
    await f.call('bolsa_trabajo/postular','POST',application(job.item.id,{save_to_account:true}),b);
    const backup=(await f.call('v7/export','GET',undefined,f.env.ADMIN_KEY)).data;
    await f.DB.prepare('DELETE FROM job_store_records').run();await f.DB.prepare('DELETE FROM audience_announcements').run();
    f.env.ENABLE_JOB_D1_RESTORE='staging-tested';
    const body={confirm:'RECUPERAR FALTANTES',confirm_second:'APLICAR RECUPERACION',external_backup_confirmed:true,dry_run:false,restore_account_links:true,backup};
    let result=await f.call('admin/backup/jobs/restore-missing','POST',body,f.env.ADMIN_KEY);
    assert.equal(result.status,200);assert.equal(result.data.account_links_restored,2);assert.equal(await f.count('audience_announcements'),0);assert.equal(await f.count('job_account_links'),2);
    result=await f.call('admin/backup/jobs/restore-missing','POST',body,f.env.ADMIN_KEY);assert.equal(result.data.account_links_restored,0);assert.equal(await f.count('job_account_links'),2);
    await f.DB.prepare('DELETE FROM job_store_records').run();await f.DB.prepare('DELETE FROM audience_accounts WHERE id=?').bind(accountB).run();
    result=await f.call('admin/backup/jobs/restore-missing','POST',body,f.env.ADMIN_KEY);assert.equal(result.status,200);assert.equal(result.data.account_links_restored,1);assert.equal(result.data.account_links_skipped,1);assert.equal(await f.count('job_account_links'),1);assert.equal(await f.count('job_store_records'),2);
  }finally{f.close()}
});

test('restoring associations is opt-in, cannot overwrite existing links, and rolls back with both collections on SQL failure',async()=>{
  const f=await fixture();try{
    const job=(await f.call('bolsa_trabajo','POST',offer({save_to_account:true}),a)).data;await f.call('bolsa_trabajo/postular','POST',application(job.item.id,{save_to_account:true}),b);
    const backup=(await f.call('v7/export','GET',undefined,f.env.ADMIN_KEY)).data;await f.DB.prepare('DELETE FROM job_store_records').run();f.env.ENABLE_JOB_D1_RESTORE='staging-tested';
    const body={confirm:'RECUPERAR FALTANTES',confirm_second:'APLICAR RECUPERACION',external_backup_confirmed:true,dry_run:false,backup};
    assert.equal((await f.call('admin/backup/jobs/restore-missing','POST',body,f.env.ADMIN_KEY)).status,200);assert.equal(await f.count('job_account_links'),0);
    await f.call('bolsa_trabajo/cuenta/vincular','POST',proof(job),b);
    assert.equal((await f.call('admin/backup/jobs/restore-missing','POST',{...body,restore_account_links:true},f.env.ADMIN_KEY)).data.account_links_restored,0);
    assert.equal((await f.DB.prepare("SELECT account_id FROM job_account_links WHERE collection='bolsa_trabajo' AND record_id=?").bind(job.item.id).first()).account_id,accountB);
    await f.DB.prepare('DELETE FROM job_store_records').run();const batch=f.DB.batch;f.DB.batch=statements=>batch(statements.map(statement=>statement.sql.startsWith('INSERT OR IGNORE INTO job_account_links')?f.DB.prepare("INSERT INTO job_store_checks(id,valid) VALUES('restore-link-failure',0)"):statement));
    assert.equal((await f.call('admin/backup/jobs/restore-missing','POST',{...body,restore_account_links:true},f.env.ADMIN_KEY)).status,409);assert.equal(await f.count('job_store_records'),0);assert.equal(await f.count('job_account_links'),0);
  }finally{f.close()}
});

test('the still-unexposed recovery core revokes the old account association in the credential transaction',async()=>{
  const f=await fixture();try{
    const job=(await f.call('bolsa_trabajo','POST',offer({save_to_account:true}),a)).data,tokenHash='c'.repeat(64),newSecretHash='d'.repeat(64);
    await f.DB.prepare('INSERT INTO job_owner_recovery_v2(token_hash,job_id,credential_revision,expires_at,created_at) VALUES(?,?,1,?,?)').bind(tokenHash,job.item.id,Date.now()+600000,Date.now()).run();
    await uadavJobRedeemRecovery(f.DB,{jobId:job.item.id,tokenHash,newSecretHash});assert.equal(await f.count('job_account_links'),0);
    assert.equal((await f.call('bolsa_trabajo/mis-postulantes','POST',{job_id:job.item.id,cuenta:true},a)).status,404);
    for(const route of ['acceso/solicitar','acceso/restablecer'])assert.equal((await f.call('bolsa_trabajo/'+route,'POST',{})).status,503);
  }finally{f.close()}
});
