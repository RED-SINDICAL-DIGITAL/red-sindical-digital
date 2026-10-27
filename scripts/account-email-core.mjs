/* Passwordless account access. No HTTP, live provider, DDL or automatic sends.
 * All mutations that grant authority use one guarded D1 transaction. */
const aeHex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
const aeBytes=s=>Uint8Array.from(s.match(/../g)||[],x=>parseInt(x,16));
const aeHash=async s=>aeHex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
const aeRandom=()=>aeHex(crypto.getRandomValues(new Uint8Array(32)));
const aeUUID=s=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(s);
const aeNeed=(ok,code='ACCESS_INVALID',status=400)=>{if(!ok)throw Object.assign(Error(code),{code,status})};
export const accountEmailAddress=s=>typeof s==='string'&&s.length<=160&&/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9.-]{0,120}[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(s.trim())?s.trim().toLowerCase():'';
export function accountEmailGuard(db,condition,args=[]){const id=crypto.randomUUID();return[db.prepare('INSERT INTO access_email_checks(id,valid) SELECT ?,CASE WHEN '+condition+' THEN 1 ELSE 0 END').bind(id,...args),db.prepare('DELETE FROM access_email_checks WHERE id=?').bind(id)]}
export function accountEmailAuthority(db,{accountId,credentialHash,device},now){
 const condition=device?"EXISTS(SELECT 1 FROM audience_devices WHERE account_id=? AND credential_hash=? AND revoked_at IS NULL AND (expires_at=0 OR expires_at>?))":"(EXISTS(SELECT 1 FROM audience_recovery_keys WHERE account_id=? AND credential_hash=? AND revoked_at IS NULL) OR (?=? AND NOT EXISTS(SELECT 1 FROM audience_recovery_keys WHERE credential_hash=?)))";
 const args=device?[accountId,credentialHash,now]:[accountId,credentialHash,accountId,credentialHash,credentialHash];
 return accountEmailGuard(db,'EXISTS(SELECT 1 FROM audience_accounts WHERE id=?) AND NOT EXISTS(SELECT 1 FROM audience_deletions WHERE account_id=?) AND '+condition,[accountId,accountId,...args]);
}
export function createAccountEmailCore({db,encryptionKey,providerContext,clock=Date.now,prepareMessage,dailyLimit=240}){
 aeNeed(db&&/^[a-f0-9]{64}$/.test(encryptionKey||'')&&/^[a-f0-9]{64}$/.test(providerContext||'')&&typeof prepareMessage==='function'&&Number.isInteger(dailyLimit)&&dailyLimit>=1&&dailyLimit<=240,'ACCESS_CONFIGURATION',503);
 db=typeof db.withSession==='function'?db.withSession('first-primary'):db;
 const aes=crypto.subtle.importKey('raw',aeBytes(encryptionKey),'AES-GCM',false,['encrypt','decrypt']),hmac=crypto.subtle.importKey('raw',aeBytes(encryptionKey),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const keyed=async s=>aeHex(await crypto.subtle.sign('HMAC',await hmac,new TextEncoder().encode(s)));
 const emailHash=email=>keyed('uadav-email-identity-v1:'+email);
 const keyHash=aeHash('uadav-account-email-key-v1:'+encryptionKey);
 const now=()=>{const n=clock();aeNeed(Number.isSafeInteger(n)&&n>0,'ACCESS_CLOCK',503);return n};
 async function seal(value,aad){const iv=crypto.getRandomValues(new Uint8Array(12)),plain=new TextEncoder().encode(JSON.stringify(value));aeNeed(plain.length<=12000,'ACCESS_PAYLOAD',503);return JSON.stringify({v:1,iv:aeHex(iv),cipher:aeHex(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(aad)},await aes,plain))})}
 async function open(value,aad){let s;try{s=JSON.parse(value);aeNeed(s.v===1&&/^[a-f0-9]{24}$/.test(s.iv)&&/^[a-f0-9]{32,24032}$/.test(s.cipher)&&s.cipher.length%2===0);return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:aeBytes(s.iv),additionalData:new TextEncoder().encode(aad)},await aes,aeBytes(s.cipher))))}catch{aeNeed(false,'ACCESS_PAYLOAD',503)}}
 const aad=r=>['uadav-account-email-v1',r.id,r.purpose,r.account_id,r.email_hash,r.identity_revision,r.actor_credential||'',r.expires_at].join('|');
 async function rate(bucket,limit,period){const time=now(),r=await db.prepare('INSERT INTO access_email_rates(bucket,hits,resets_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN resets_at<=? THEN 1 ELSE hits+1 END,resets_at=CASE WHEN resets_at<=? THEN excluded.resets_at ELSE resets_at END RETURNING hits').bind(bucket,time+period,time,time).first();return r.hits<=limit}
 async function request({email,requestId,actorHash,identity=null}){
  email=accountEmailAddress(email);aeNeed(email&&aeUUID(requestId)&&/^[a-f0-9]{64}$/.test(actorHash||''));
  const time=now(),hash=await emailHash(email),purpose=identity?'verify':'access';
  if(!await rate('ip:'+actorHash,5,600000)||!await rate('email:'+hash,3,3600000))return{accepted:true};
  const target=await db.prepare('SELECT * FROM access_email_identities WHERE email_hash=?').bind(hash).first();
  if(identity&&target&&target.account_id!==identity.accountId)return{accepted:true};
  const current=identity?await db.prepare('SELECT * FROM access_email_identities WHERE account_id=?').bind(identity.accountId).first():target;
  if(current&&current.key_hash!==await keyHash)return{accepted:true};
  const accountId=identity?.accountId||target?.account_id||aeRandom(),revision=current?.revision||0;
  await db.prepare("UPDATE access_email_outbox SET state='expired',sealed_payload=NULL,sealed_address=NULL,lease_owner=NULL,lease_until=0 WHERE email_hash=? AND state IN ('queued','sending','accepted') AND expires_at<=?").bind(hash,time).run();
  const prior=await db.prepare("SELECT id FROM access_email_outbox WHERE (actor_hash=? AND request_id=?) OR (email_hash=? AND purpose=? AND state IN ('queued','sending','accepted')) LIMIT 1").bind(actorHash,requestId,hash,purpose).first();if(prior)return{accepted:true};
  const token=aeRandom(),row={id:crypto.randomUUID(),request_id:requestId,actor_hash:actorHash,purpose,account_id:accountId,email_hash:hash,identity_revision:revision,actor_credential:identity?.credentialHash||null,actor_device:identity?.device?1:0,expires_at:time+900000};
  const payload={to:email,token,provider_context:providerContext,body:await prepareMessage({to:email,purpose,token,id:row.id,issuedAt:time,expiresAt:row.expires_at})};
  const sealed=await seal(payload,aad(row)),address=await seal(email,'uadav-account-email-address-v1:'+row.id),day=new Date(time).toISOString().slice(0,10),bucket='dispatch:'+day;
  const statements=[...accountEmailGuard(db,'(SELECT COUNT(*) FROM access_email_outbox WHERE expires_at>? AND state IN (\'queued\',\'sending\',\'accepted\'))<500',[time]),
   db.prepare('INSERT INTO access_email_rates(bucket,hits,resets_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1').bind(bucket,time+172800000),...accountEmailGuard(db,'EXISTS(SELECT 1 FROM access_email_rates WHERE bucket=? AND hits<=?)',[bucket,dailyLimit])];
  if(identity)statements.push(...accountEmailAuthority(db,identity,time),...accountEmailGuard(db,revision?'EXISTS(SELECT 1 FROM access_email_identities WHERE account_id=? AND revision=?)':'NOT EXISTS(SELECT 1 FROM access_email_identities WHERE account_id=?)',revision?[accountId,revision]:[accountId]));
  else if(target)statements.push(...accountEmailGuard(db,'EXISTS(SELECT 1 FROM access_email_identities e JOIN audience_accounts a ON a.id=e.account_id WHERE e.email_hash=? AND e.account_id=? AND e.revision=? AND NOT EXISTS(SELECT 1 FROM audience_deletions d WHERE d.account_id=a.id))',[hash,accountId,revision]));
  else statements.push(...accountEmailGuard(db,'NOT EXISTS(SELECT 1 FROM access_email_identities WHERE email_hash=?)',[hash]));
  statements.push(db.prepare("INSERT INTO access_email_outbox(id,request_id,actor_hash,purpose,account_id,email_hash,identity_revision,actor_credential,actor_device,token_hash,sealed_payload,sealed_address,state,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,'queued',?,?)").bind(row.id,requestId,actorHash,purpose,accountId,hash,revision,row.actor_credential,row.actor_device,await aeHash(token),sealed,address,time,row.expires_at));
  try{await db.batch(statements)}catch{return{accepted:true}}return{accepted:true,dispatchId:row.id};
 }
 async function dispatch(id,send){
  aeNeed(aeUUID(id)&&typeof send==='function');let row=await db.prepare('SELECT * FROM access_email_outbox WHERE id=?').bind(id).first();const time=now();
  if(!row||!['queued','sending'].includes(row.state)||row.expires_at<=time||row.lease_until>time||row.attempts>=3)return{state:'idle'};
  if(row.identity_revision>0){const identity=await db.prepare('SELECT * FROM access_email_identities WHERE account_id=?').bind(row.account_id).first();if(!identity||identity.revision!==row.identity_revision){await db.prepare("UPDATE access_email_outbox SET state='cancelled',sealed_payload=NULL WHERE id=?").bind(id).run();return{state:'cancelled'}}}
  const owner=crypto.randomUUID(),claim=[];
  if(row.purpose==='verify')claim.push(...accountEmailAuthority(db,{accountId:row.account_id,credentialHash:row.actor_credential,device:!!row.actor_device},time));
  if(row.identity_revision)claim.push(...accountEmailGuard(db,'EXISTS(SELECT 1 FROM access_email_identities e JOIN audience_accounts a ON a.id=e.account_id WHERE e.account_id=? AND e.revision=? AND e.key_hash=? AND NOT EXISTS(SELECT 1 FROM audience_deletions WHERE account_id=a.id))',[row.account_id,row.identity_revision,await keyHash]));
  claim.push(db.prepare("UPDATE access_email_outbox SET state='sending',lease_owner=?,lease_until=?,attempts=attempts+1 WHERE id=? AND state IN ('queued','sending') AND lease_until<=? AND expires_at>? AND attempts<3").bind(owner,time+30000,id,time,time));
  let claimed;try{const r=await db.batch(claim);claimed=r[r.length-1]}catch{await db.prepare("UPDATE access_email_outbox SET state='cancelled',sealed_payload=NULL,sealed_address=NULL WHERE id=? AND state IN ('queued','sending','accepted')").bind(id).run();return{state:'cancelled'}}if(claimed.meta?.changes!==1)return{state:'busy'};
  try{const payload=await open(row.sealed_payload,aad(row));aeNeed(payload.provider_context===providerContext&&await emailHash(payload.to)===row.email_hash&&await aeHash(payload.token)===row.token_hash,'ACCESS_PAYLOAD',503);const receipt=await send({id,body:payload.body,expiresAt:row.expires_at});aeNeed(typeof receipt?.id==='string'&&/^[A-Za-z0-9_.:-]{1,160}$/.test(receipt.id),'ACCESS_PROVIDER',503);await db.prepare("UPDATE access_email_outbox SET state='accepted',provider_id=?,sealed_payload=NULL,lease_owner=NULL,lease_until=0 WHERE id=? AND state='sending' AND lease_owner=? AND expires_at>?").bind(receipt.id,id,owner,now()).run();return{state:'accepted'}}
  catch{await db.prepare("UPDATE access_email_outbox SET state=CASE WHEN attempts>=3 THEN 'failed' ELSE 'queued' END,sealed_payload=CASE WHEN attempts>=3 THEN NULL ELSE sealed_payload END,lease_owner=NULL,lease_until=0 WHERE id=? AND state='sending' AND lease_owner=?").bind(id,owner).run();return{state:'unconfirmed'}}
 }
 async function redeem({id,token,newDeviceSecret,deviceName='Mi dispositivo',readerIdentity=null}){
  aeNeed(aeUUID(id)&&/^[a-f0-9]{64}$/.test(token||'')&&/^UAD-[a-f0-9]{64}$/.test(newDeviceSecret||'')&&typeof deviceName==='string'&&deviceName.length<=80);
  const time=now(),tokenHash=await aeHash(token),secretHash=await aeHash(newDeviceSecret),lookup=()=>db.prepare('SELECT * FROM access_email_outbox WHERE id=? AND token_hash=?').bind(id,tokenHash).first();
  const replay=async r=>r?.state==='redeemed'&&r.expires_at>time&&r.redeemed_hash===secretHash&&!!await db.prepare('SELECT d.id FROM audience_devices d JOIN audience_accounts a ON a.id=d.account_id JOIN access_email_identities e ON e.account_id=a.id WHERE d.credential_hash=? AND d.account_id=? AND d.revoked_at IS NULL AND (d.expires_at=0 OR d.expires_at>?) AND e.revision=? AND e.key_hash=? AND NOT EXISTS(SELECT 1 FROM audience_deletions WHERE account_id=a.id)').bind(secretHash,r.redeemed_account,time,r.redeemed_revision,await keyHash).first();
  const row=await lookup();if(row?.purpose==='verify')aeNeed(readerIdentity?.accountId===row.account_id,'ACCESS_AUTH',401);if(await replay(row))return{account_id:row.redeemed_account,verified:true,replayed:true};
  aeNeed(row&&['queued','sending','accepted','failed'].includes(row.state)&&row.attempts>0&&row.expires_at>time);
  let email=null;if(row.purpose==='verify'||!row.identity_revision){
   // Accepted delivery wipes the outbox ciphertext; the encrypted address below
   // is separately retained in the pending proof until its one-time redemption.
   aeNeed(row.sealed_address,'ACCESS_INVALID');email=await open(row.sealed_address,'uadav-account-email-address-v1:'+row.id);aeNeed(accountEmailAddress(email)===email&&await emailHash(email)===row.email_hash);
  }
  const statements=[...accountEmailGuard(db,"EXISTS(SELECT 1 FROM access_email_outbox WHERE id=? AND token_hash=? AND state IN ('queued','sending','accepted','failed') AND attempts>0 AND expires_at>?)",[id,tokenHash,time])];
  if(row.purpose==='verify')statements.push(...accountEmailAuthority(db,readerIdentity,time),...accountEmailAuthority(db,{accountId:row.account_id,credentialHash:row.actor_credential,device:!!row.actor_device},time),...accountEmailGuard(db,row.identity_revision?'EXISTS(SELECT 1 FROM access_email_identities WHERE account_id=? AND revision=?)':'NOT EXISTS(SELECT 1 FROM access_email_identities WHERE account_id=?)',row.identity_revision?[row.account_id,row.identity_revision]:[row.account_id]));
  else if(row.identity_revision)statements.push(...accountEmailGuard(db,'EXISTS(SELECT 1 FROM access_email_identities e JOIN audience_accounts a ON a.id=e.account_id WHERE e.account_id=? AND e.email_hash=? AND e.revision=? AND e.key_hash=? AND NOT EXISTS(SELECT 1 FROM audience_deletions WHERE account_id=a.id))',[row.account_id,row.email_hash,row.identity_revision,await keyHash]));
  else{statements.push(...accountEmailGuard(db,'NOT EXISTS(SELECT 1 FROM access_email_identities WHERE email_hash=?) AND NOT EXISTS(SELECT 1 FROM audience_accounts WHERE id=?) AND NOT EXISTS(SELECT 1 FROM audience_deletions WHERE account_id=?)',[row.email_hash,row.account_id,row.account_id]),db.prepare('INSERT INTO audience_accounts(id,data_json,revision,updated_at) VALUES(?,?,1,?)').bind(row.account_id,JSON.stringify({uadav_user_v11:{name:'Mi cuenta',avatar:'U',photo:'',preferences:[]}}),new Date(time).toISOString()));}
  const revision=row.purpose==='verify'?row.identity_revision+1:row.identity_revision||1;
  if(email){const sealed=await seal(email,'uadav-verified-email-v1:'+row.account_id+':'+revision);statements.push(db.prepare('INSERT INTO access_email_identities(account_id,email_hash,sealed_email,revision,verified_at,consent_at,key_hash) VALUES(?,?,?,?,?,?,?) ON CONFLICT(account_id) DO UPDATE SET email_hash=excluded.email_hash,sealed_email=excluded.sealed_email,revision=excluded.revision,verified_at=excluded.verified_at,consent_at=excluded.consent_at,key_hash=excluded.key_hash').bind(row.account_id,row.email_hash,sealed,revision,time,time,await keyHash));}
  statements.push(db.prepare('INSERT INTO audience_devices(credential_hash,id,account_id,name,created_at,expires_at,revoked_at) VALUES(?,?,?,?,?,0,NULL)').bind(secretHash,crypto.randomUUID(),row.account_id,deviceName||'Mi dispositivo',time),db.prepare("UPDATE access_email_outbox SET state='redeemed',redeemed_hash=?,redeemed_account=?,redeemed_revision=?,sealed_payload=NULL,sealed_address=NULL,lease_owner=NULL,lease_until=0 WHERE id=?").bind(secretHash,row.account_id,revision,id));
  if(row.purpose==='verify')statements.push(db.prepare("UPDATE access_email_outbox SET state='cancelled',sealed_payload=NULL,sealed_address=NULL,lease_owner=NULL,lease_until=0 WHERE account_id=? AND id<>? AND state IN ('queued','sending','accepted')").bind(row.account_id,id));
  try{await db.batch(statements)}catch{const saved=await lookup();if(await replay(saved))return{account_id:saved.redeemed_account,verified:true,replayed:true};aeNeed(false,'ACCESS_INVALID')}
  return{account_id:row.account_id,verified:true,new_account:row.purpose==='access'&&!row.identity_revision};
 }
 async function status(accountId){const r=await db.prepare('SELECT * FROM access_email_identities WHERE account_id=?').bind(accountId).first();if(!r)return{verified:false};aeNeed(r.key_hash===await keyHash,'ACCESS_KEY_CONTEXT',503);const email=await open(r.sealed_email,'uadav-verified-email-v1:'+accountId+':'+r.revision);return{verified:true,email,revision:r.revision}}
 return Object.freeze({request,dispatch,redeem,status,emailHash,keyHash,rate});
}
