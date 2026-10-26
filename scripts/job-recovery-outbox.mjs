/* Preparatory STAGING-only engine. Not imported/embedded by worker.js.
 * No HTTP endpoint, timer, provider, secret or remote database is configured here.
 * A pending token exists only as an encrypted outbox payload plus a hash. The
 * existing redemption table receives it atomically AFTER provider acceptance.
 * Provider acceptance is not a delivery/read receipt. Live email QA is required.
 */
const TTL=15*60000,LEASE=30000,ATTEMPTS=5;
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
const bytes=value=>Uint8Array.from(value.match(/../g)||[],x=>parseInt(x,16));
const hash=async value=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
const fail=(code,status=503)=>Object.assign(Error(code),{code,status});
const safeCodes=new Set(['JOB_RECOVERY_CONFIGURATION','JOB_RECOVERY_PROVIDER','JOB_RECOVERY_INPUT','JOB_RECOVERY_CLOCK','JOB_RECOVERY_STORAGE','JOB_RECOVERY_PAYLOAD','JOB_RECOVERY_SEND','JOB_RECOVERY_RECEIPT','JOB_RECOVERY_COMMIT']);
const safeCode=error=>safeCodes.has(error?.code)?error.code:'JOB_RECOVERY_STORAGE';
const need=(condition,code,status)=>{if(!condition)throw fail(code,status)};
const email=value=>typeof value==='string'&&value.length<=160&&/^[^\s@<>\x00-\x1f]{1,64}@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value.trim())?value.trim().toLowerCase():'';
const current="EXISTS(SELECT 1 FROM job_owner_credentials c JOIN job_store_records r ON r.collection='bolsa_trabajo' AND r.id=c.job_id WHERE c.job_id=job_recovery_outbox.job_id AND c.revision=job_recovery_outbox.credential_revision AND r.revision=job_recovery_outbox.record_revision)";
function guard(db,condition,args=[]){const id=crypto.randomUUID();return [db.prepare('INSERT INTO job_store_checks(id,valid) SELECT ?,CASE WHEN '+condition+' THEN 1 ELSE 0 END').bind(id,...args),db.prepare('DELETE FROM job_store_checks WHERE id=?').bind(id)]}
function aad(row){return new TextEncoder().encode(['job-recovery-v1',row.id,row.job_id,row.record_revision,row.credential_revision,row.recipient_hash,row.token_hash,row.expires_at].join('|'))}
async function encrypt(key,row,payload){
 const iv=crypto.getRandomValues(new Uint8Array(12)),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(row)},key,new TextEncoder().encode(JSON.stringify(payload)));
 return JSON.stringify({v:1,iv:hex(iv),cipher:hex(cipher)});
}
async function decrypt(key,row){
 const sealed=JSON.parse(row.sealed_payload);need(sealed.v===1&&/^[a-f0-9]{24}$/.test(sealed.iv||'')&&/^[a-f0-9]{32,16384}$/.test(sealed.cipher||'')&&sealed.cipher.length%2===0,'JOB_RECOVERY_PAYLOAD');
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(sealed.iv),additionalData:aad(row)},key,bytes(sealed.cipher)),payload=JSON.parse(new TextDecoder().decode(plain));
 need(payload.job_id===row.job_id&&payload.credential_revision===row.credential_revision&&payload.expires_at===row.expires_at&&/^[a-f0-9]{64}$/.test(payload.token||'')&&await hash(payload.token)===row.token_hash&&email(payload.to)===payload.to&&await hash(payload.to)===row.recipient_hash,'JOB_RECOVERY_PAYLOAD');
 return payload;
}
export function createJobRecoveryOutbox({db,encryptionKey,mode,clock=Date.now,timeoutMs=5000}){
 need(mode==='staging-only'&&db&&/^[a-f0-9]{64}$/.test(encryptionKey||'')&&typeof clock==='function'&&Number.isInteger(timeoutMs)&&timeoutMs>=1&&timeoutMs<=5000,'JOB_RECOVERY_CONFIGURATION');
 db=typeof db.withSession==='function'?db.withSession('first-primary'):db;
 const key=crypto.subtle.importKey('raw',bytes(encryptionKey),'AES-GCM',false,['encrypt','decrypt']);
 const accepted=()=>({accepted:true});
 async function sweep(now){
  await db.batch([
   db.prepare("UPDATE job_recovery_outbox SET state='expired',sealed_payload=NULL,lease_owner=NULL,lease_until=0 WHERE state IN ('queued','sending','accepted') AND expires_at<=?").bind(now),
   db.prepare("UPDATE job_recovery_outbox SET state='cancelled',sealed_payload=NULL,lease_owner=NULL,lease_until=0 WHERE state IN ('queued','sending') AND NOT "+current)
  ]);
 }
 async function rate(bucket,limit,windowMs,now){
  const r=await db.prepare('INSERT INTO job_store_rates(bucket,hits,resets_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN resets_at<=? THEN 1 ELSE hits+1 END,resets_at=CASE WHEN resets_at<=? THEN excluded.resets_at ELSE resets_at END RETURNING hits').bind(bucket,now+windowMs,now,now).first();return r.hits<=limit;
 }
 async function enqueue({jobId,recipient,requestId,actorHash}){
  need(/^JOB-[A-Z0-9-]{3,80}$/.test(jobId||'')&&email(recipient)&&/^[a-f0-9-]{36}$/i.test(requestId||'')&&/^[a-f0-9]{64}$/.test(actorHash||''),'JOB_RECOVERY_INPUT',400);
  const now=clock();need(Number.isSafeInteger(now)&&now>0,'JOB_RECOVERY_CLOCK');
  try{
   if(!await rate('recovery-actor:'+actorHash,5,10*60000,now))return accepted();
   const source=await db.prepare("SELECT r.revision AS record_revision,r.data_json,c.revision AS credential_revision FROM job_store_records r JOIN job_owner_credentials c ON c.job_id=r.id WHERE r.collection='bolsa_trabajo' AND r.id=?").bind(jobId).first();
   if(!source)return accepted();
   const item=JSON.parse(source.data_json),to=email(item.contacto_email||item.email||item.contacto);
   if(!to||to!==email(recipient))return accepted();
   await sweep(now);
   const recipientHash=await hash(to),prior=await db.prepare('SELECT id FROM job_recovery_outbox WHERE request_id=?').bind(requestId).first();if(prior)return accepted();
   const active=await db.prepare("SELECT id FROM job_recovery_outbox WHERE job_id=? AND credential_revision=? AND state IN ('queued','sending','accepted')").bind(jobId,source.credential_revision).first();if(active)return accepted();
   const bucket='recovery-job:'+jobId,limit=await db.prepare('SELECT hits,resets_at FROM job_store_rates WHERE bucket=?').bind(bucket).first();if(limit&&limit.resets_at>now&&limit.hits>=3)return accepted();
   const token=hex(crypto.getRandomValues(new Uint8Array(32))),row={id:crypto.randomUUID(),job_id:jobId,record_revision:source.record_revision,credential_revision:source.credential_revision,recipient_hash:recipientHash,token_hash:await hash(token),expires_at:now+TTL};
   const sealed=await encrypt(await key,row,{job_id:jobId,to,token,credential_revision:row.credential_revision,expires_at:row.expires_at});
   const statements=[
    db.prepare('INSERT INTO job_store_rates(bucket,hits,resets_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN resets_at<=? THEN 1 ELSE hits+1 END,resets_at=CASE WHEN resets_at<=? THEN excluded.resets_at ELSE resets_at END').bind(bucket,now+3600000,now,now),
    ...guard(db,'EXISTS(SELECT 1 FROM job_store_rates WHERE bucket=? AND hits<=3)',[bucket]),
    ...guard(db,"EXISTS(SELECT 1 FROM job_owner_credentials c JOIN job_store_records r ON r.collection='bolsa_trabajo' AND r.id=c.job_id WHERE c.job_id=? AND c.revision=? AND r.revision=?)",[jobId,row.credential_revision,row.record_revision]),
    ...guard(db,"(SELECT COUNT(*) FROM job_recovery_outbox WHERE state IN ('queued','sending','accepted'))<1000"),
    db.prepare("INSERT INTO job_recovery_outbox(id,request_id,job_id,record_revision,credential_revision,recipient_hash,token_hash,sealed_payload,created_at,expires_at,next_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(row.id,requestId,jobId,row.record_revision,row.credential_revision,recipientHash,row.token_hash,sealed,now,row.expires_at,now)
   ];
   try{await db.batch(statements)}catch{
    const saved=await db.prepare("SELECT id FROM job_recovery_outbox WHERE request_id=? OR (job_id=? AND credential_revision=? AND state IN ('queued','sending','accepted')) LIMIT 1").bind(requestId,jobId,row.credential_revision).first();if(saved)return accepted();
    const live=await db.prepare("SELECT c.revision AS credential_revision,r.revision AS record_revision FROM job_owner_credentials c JOIN job_store_records r ON r.collection='bolsa_trabajo' AND r.id=c.job_id WHERE c.job_id=?").bind(jobId).first(),rate=await db.prepare('SELECT hits,resets_at FROM job_store_rates WHERE bucket=?').bind(bucket).first();
    if(!live||live.credential_revision!==row.credential_revision||live.record_revision!==row.record_revision||rate?.resets_at>now&&rate.hits>=3)return accepted();
    throw fail('JOB_RECOVERY_STORAGE');
   }
   return accepted();
  }catch(error){throw fail(safeCode(error))}
 }
 async function dispatch(adapter){
  need(adapter&&typeof adapter.send==='function'&&Number.isFinite(adapter.idempotencyWindowMs)&&adapter.idempotencyWindowMs>=3600000,'JOB_RECOVERY_PROVIDER');
  let row,owner;
  try{
   const now=clock();await sweep(now);
   row=await db.prepare("SELECT * FROM job_recovery_outbox WHERE state IN ('queued','sending') AND expires_at>? AND next_at<=? AND lease_until<=? AND attempts<? ORDER BY created_at,id LIMIT 1").bind(now,now,now,ATTEMPTS).first();if(!row)return {state:'idle'};
   owner=crypto.randomUUID();const claimed=await db.prepare("UPDATE job_recovery_outbox SET state='sending',attempts=attempts+1,lease_until=?,lease_owner=? WHERE id=? AND state IN ('queued','sending') AND lease_until<=? AND next_at<=? AND expires_at>? AND attempts<? AND "+current).bind(now+LEASE,owner,row.id,now,now,now,ATTEMPTS).run();
   if(claimed.meta?.changes!==1)return {state:'busy'};
   row={...row,attempts:row.attempts+1};let payload;try{payload=await decrypt(await key,row)}catch{throw fail('JOB_RECOVERY_PAYLOAD')}
   const controller=new AbortController();let timer,receipt;
   try{receipt=await Promise.race([Promise.resolve().then(()=>adapter.send({idempotencyKey:'uadav-job-recovery/'+row.id,payload,signal:controller.signal})),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(fail('JOB_RECOVERY_SEND'))},timeoutMs)})])}catch{throw fail('JOB_RECOVERY_SEND')}finally{clearTimeout(timer)}
   need(receipt&&typeof receipt.id==='string'&&/^[A-Za-z0-9_.:-]{1,160}$/.test(receipt.id),'JOB_RECOVERY_RECEIPT');
   const finished=clock();
   const statements=[...guard(db,"EXISTS(SELECT 1 FROM job_recovery_outbox WHERE id=? AND state='sending' AND lease_owner=? AND lease_until>? AND expires_at>? AND "+current+')',[row.id,owner,finished,finished]),
    db.prepare('UPDATE job_owner_recovery_v2 SET consumed_at=? WHERE job_id=? AND consumed_at IS NULL').bind(finished,row.job_id),
    db.prepare('INSERT INTO job_owner_recovery_v2(token_hash,job_id,credential_revision,expires_at,created_at) VALUES(?,?,?,?,?)').bind(row.token_hash,row.job_id,row.credential_revision,row.expires_at,row.created_at),
    db.prepare("UPDATE job_recovery_outbox SET state='accepted',provider_id=?,accepted_at=?,sealed_payload=NULL,lease_owner=NULL,lease_until=0,last_error=NULL WHERE id=? AND state='sending' AND lease_owner=?").bind(receipt.id,finished,row.id,owner)
   ];
   try{await db.batch(statements)}catch{
    const committed=await db.prepare('SELECT state,provider_id FROM job_recovery_outbox WHERE id=?').bind(row.id).first();if(committed?.state==='accepted'&&committed.provider_id===receipt.id)return {state:'accepted'};
    throw fail('JOB_RECOVERY_COMMIT');
   }
   return {state:'accepted'};
  }catch(error){
   const code=safeCode(error);
   if(!row||!owner)throw fail(code);
   const now=clock(),terminal=row.attempts>=ATTEMPTS,expired=row.expires_at<=now;
   try{await db.prepare("UPDATE job_recovery_outbox SET state=?,sealed_payload=CASE WHEN ? THEN NULL ELSE sealed_payload END,next_at=?,lease_owner=NULL,lease_until=0,last_error=? WHERE id=? AND state='sending' AND lease_owner=?").bind(expired?'expired':terminal?'failed':'queued',expired||terminal?1:0,Math.min(row.expires_at,now+Math.min(60000,1000*2**row.attempts)),code,row.id,owner).run()}catch{throw fail('JOB_RECOVERY_STORAGE')}
   return {state:'unconfirmed',error:code};
  }
 }
 return {enqueue,dispatch};
}
