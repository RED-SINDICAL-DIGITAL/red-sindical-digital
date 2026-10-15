import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {webcrypto} from 'node:crypto';import {sqliteD1} from './sqlite-d1.mjs';globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map(),a='ART-inquiry-A-123456789',b='ART-inquiry-B-123456789';const env={DB,ADMIN_KEY:'local-inquiries-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
kv.set('artistas',JSON.stringify([{id:'QA-A',nombre:'Free artist A',visible:true},{id:'QA-B',nombre:'Free artist B',visible:true},{id:'QA-SUSPENDED',nombre:'Suspended',visible:true,estado:'suspendido'}]));
for(const [token,id] of [[a,'QA-A'],[b,'QA-B']])kv.set('artist_access_'+token,JSON.stringify({artist_id:id,expires:Date.now()+3600000}));
async function call(route,method='GET',body,token=''){const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})}),env,{});return {status:r.status,data:await r.json(),cache:r.headers.get('Cache-Control')};}
try{
 const submitted=await call('contrataciones','POST',{artist_id:'QA-A',nombre:'Synthetic client',email:'client@example.invalid',evento:'Synthetic event',detalles:'Private inquiry details',acepta_contrato:true});assert.equal(submitted.status,200);const id=submitted.data.item.id;
 assert.equal((await call('contrataciones')).status,401);assert.equal((await call('artist/inquiries')).status,401);
 const received=await call('artist/inquiries','GET',null,a);assert.equal(received.status,200);assert.equal(received.cache,'no-store');assert.equal(received.data.items[0].id,id);assert.equal(received.data.items[0].email,'client@example.invalid');
 assert.equal((await call('artist/inquiries','GET',null,b)).data.items.length,0);
 assert.equal((await call('artist/inquiries','PATCH',{id,estado:'leida'},b)).status,404);
 const accountA='UAC-'+'e'.repeat(64),accountB='UAC-'+'f'.repeat(64);
 for(const [credential,artist] of [[accountA,'QA-A'],[accountB,'QA-B']]){
  assert.equal((await call('account','POST',{data:{uadav_user_v11:{name:'Synthetic inquiry account'}}},credential)).status,200);
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(credential)))).map(v=>v.toString(16).padStart(2,'0')).join('');
  await DB.prepare('INSERT INTO audience_artist_links(account_id,artist_id,claim_id,expires_at,created_at) VALUES(?,?,NULL,0,?)').bind(hash,artist,Date.now()).run();
 }
 assert.ok((await call('account/notifications','GET',null,accountA)).data.items.some(n=>n.id==='inquiry:'+id));
 assert.equal((await call('account/notifications','GET',null,accountB)).data.items.some(n=>n.id==='inquiry:'+id),false);
 assert.equal((await call('artist/inquiries','PATCH',{id,estado:'leida'},a)).status,200);
 assert.equal((await call('account/notifications','GET',null,accountA)).data.items.some(n=>n.id==='inquiry:'+id),false);
 assert.equal((await call('artist/inquiries','GET',null,a)).data.items[0].estado,'leida');
 for(const estado of ['respondida','cerrada','pendiente']){const result=await call('artist/inquiries','PATCH',{id,estado},a);assert.equal(result.status,200);assert.equal((await call('artist/inquiries','GET',null,a)).data.items[0].estado,estado);assert.equal((await call('artist/inquiries','GET',null,b)).data.items.length,0)}
 assert.ok((await call('account/notifications','GET',null,accountA)).data.items.some(n=>n.id==='inquiry:'+id),'reopened inquiry restores its unread notification');
 assert.equal((await call('artist/inquiries','PATCH',{id,estado:'invalid'},a)).status,400);
 await DB.prepare("INSERT INTO artist_owners(id,artist_id,claim_id,contact_email,role,status,verification_level,created_at,updated_at) VALUES('QA-OWNER','QA-A','new-owner-claim','owner@example.invalid','owner','active','admin_approved',?,?)").bind(new Date().toISOString(),new Date().toISOString()).run();
 assert.equal((await call('artist/inquiries','GET',null,a)).status,401,'ownerless legacy token must not bypass an active owner');
 assert.equal((await call('artist/inquiries','PATCH',{id,estado:'cerrada'},a)).status,401,'old ownerless token cannot change private inquiry states');
 assert.equal((await call('contrataciones','POST',{artist_id:'QA-SUSPENDED',nombre:'Synthetic',email:'client@example.invalid',acepta_contrato:true})).status,403);
 const read=env.UADAV_DB.get;let reads=0,release;const gate=new Promise(resolve=>release=resolve);let racing=true;
 env.UADAV_DB.get=async key=>{const snapshot=await read(key);if(key==='contrataciones'&&racing){reads++;if(reads===2){racing=false;release()}await gate}return snapshot};
 const concurrent=await Promise.all(['First concurrent inquiry','Second concurrent inquiry'].map(evento=>call('contrataciones','POST',{artist_id:'QA-B',nombre:'Synthetic',email:'client@example.invalid',evento,acepta_contrato:true})));
 env.UADAV_DB.get=read;assert.ok(concurrent.every(r=>r.status===200));
 const inbox=await call('artist/inquiries','GET',null,b);assert.equal(inbox.data.items.length,2,'concurrent submissions must both remain in the recipient inbox');
 const notices=await call('account/notifications','GET',null,accountB);assert.equal(notices.data.items.filter(n=>n.kind==='inquiry').length,2);
 const legacy=[{id:'QA-LEGACY-INQUIRY',artist_id:'QA-B',nombre:'Legacy synthetic client',email:'legacy@example.invalid',creado:'2026-01-01T00:00:00Z',estado:'pendiente'},{...concurrent[0].data.item,artist_id:'QA-A',evento:'STALE KV COPY'}];
 kv.set('contrataciones',JSON.stringify(legacy));const before=kv.get('contrataciones');
 const merged=await call('artist/inquiries','GET',null,b);assert.equal(merged.data.items.length,3);assert.ok(merged.data.items.some(x=>x.id==='QA-LEGACY-INQUIRY'));assert.equal(merged.data.items.some(x=>x.evento==='STALE KV COPY'),false);
 assert.equal((await call('artist/inquiries','PATCH',{id:'QA-LEGACY-INQUIRY',estado:'cerrada'},b)).status,200);assert.equal(kv.get('contrataciones'),before,'legacy records must not be overwritten');
 await DB.prepare("CREATE TRIGGER fail_inquiry BEFORE INSERT ON contracts BEGIN SELECT RAISE(ABORT,'Synthetic inquiry interruption'); END").run();
 const failed=await call('contrataciones','POST',{artist_id:'QA-B',nombre:'Synthetic',email:'client@example.invalid',acepta_contrato:true});assert.equal(failed.status,503);assert.equal(failed.data.code,'INQUIRY_SAVE_FAILED');
 await DB.prepare('DROP TRIGGER fail_inquiry').run();assert.equal((await call('artist/inquiries','GET',null,b)).data.items.length,3);
 const retryBody={request_id:'QA-REQUEST-1234567890123456',artist_id:'QA-B',nombre:'Retry synthetic client',email:'retry@example.invalid',evento:'Idempotent request',acepta_contrato:true};
 const attempts=await Promise.all([call('contrataciones','POST',retryBody),call('contrataciones','POST',retryBody)]);assert.ok(attempts.every(r=>r.status===200));assert.equal(attempts[0].data.item.id,attempts[1].data.item.id,'same submission key must create only one inquiry');
 assert.equal((await call('contrataciones','POST',{...retryBody,evento:'Changed payload'})).status,409);
 assert.equal((await call('contrataciones','POST',{...retryBody,request_id:'short'})).status,400);
 const finalInbox=await call('artist/inquiries','GET',null,b);assert.equal(finalInbox.data.items.filter(x=>x.evento==='Idempotent request').length,1);
 console.log('PASS: actual Worker + SQLite free inquiry delivery, private recipient-only access, state persistence, invalid state denial and active-owner/suspended profile safeguards.');
}finally{DB.close()}
