import assert from 'node:assert/strict';import {randomBytes} from 'node:crypto';
const base=new URL(process.env.UADAV_STAGING_API||'');
assert.equal(base.href,'https://uadav-api-staging.uadavstream.workers.dev/api/');
const origin='https://uadav-stream-staging.pages.dev',secret='UAC-'+randomBytes(32).toString('hex'),suffix=randomBytes(6).toString('hex');
async function call(route,method='GET',body,auth=''){
 const r=await fetch(new URL(route,base),{method,redirect:'error',signal:AbortSignal.timeout(20000),headers:{Origin:origin,'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},...(body?{body:JSON.stringify(body)}:{})});
 assert([origin,'*'].includes(r.headers.get('access-control-allow-origin')),'frontend CORS');
 if(route==='account'||route.startsWith('account/'))assert.equal(r.headers.get('access-control-allow-origin'),origin,'account CORS');
 return {status:r.status,data:await r.json()};
}
assert.equal((await call('pro/payment-settings')).data.enabled,false);
assert.equal((await call('account','POST',{data:{uadav_user_v11:{name:'PRUEBA BORRADOR REMOTO',avatar:'T'}}},secret)).status,200);
const created=await call('artista/claim','POST',{new_profile:true,artist_name:'QA BORRADOR '+suffix,rubro:'Ilusionismo ficticio',name:'Prueba sin datos reales',email:'qa-'+suffix+'@example.invalid',ciudad:'Ciudad ficticia'},secret);
assert.equal(created.status,200);const id=created.data.artist_id;assert(id);
const session=await call('account/artist-session','POST',{artist_id:id},secret);assert.equal(session.status,200);const token=session.data.token;
const access=()=>call('artista/access?token='+encodeURIComponent(token));
const save=data=>call('artista/access','POST',{token,...data});
const initial=await access();assert.equal(initial.status,200);assert.equal(initial.data.draft.revision,0);
const saved=await save({bio:'PRIVATE-REMOTE-DRAFT-'+suffix,save_only:true,draft_revision:0});assert.equal(saved.status,200);assert.equal(saved.data.draft_saved,true);
const reopened=await access();assert.equal(reopened.data.artist.bio,'PRIVATE-REMOTE-DRAFT-'+suffix);assert.equal(reopened.data.draft.state,'saved');assert.equal(reopened.data.draft.revision,1);
assert.equal((await call('public/artista?id='+id)).status,404);
const stale=await save({bio:'SHOULD-NOT-REPLACE',save_only:true,draft_revision:0});assert.equal(stale.status,409);assert.equal(stale.data.code,'DRAFT_REVISION_CONFLICT');
const pending=await save({bio:'PRIVATE-REMOTE-REVIEW-'+suffix,draft_revision:1});assert.equal(pending.status,202);assert.equal(pending.data.moderation_pending,true);assert.match(pending.data.message,/sigue privado/);
const again=await access();assert.equal(again.data.artist.bio,'PRIVATE-REMOTE-REVIEW-'+suffix);assert.equal(again.data.draft.state,'pending');assert.equal(again.data.draft.revision,2);
assert.equal((await call('public/artista?id='+id)).status,404);
assert.equal((await call('account/artists','DELETE',{artist_id:id},secret)).status,200);
assert.equal((await access()).status,401);
console.log('PASS: live staging D1 profile draft save/reopen, frontend CORS, revision conflict, review persistence, public isolation and unlink revocation. Synthetic account and private artist retained; one synthetic moderation item pending; no payments or public publication.');
