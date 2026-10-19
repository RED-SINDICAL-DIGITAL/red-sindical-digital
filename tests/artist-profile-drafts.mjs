import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {webcrypto} from 'node:crypto';import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map(),id='QA-PROFILE-DRAFT',token='ART-profile-draft-test';
const env={DB,ADMIN_KEY:'local-draft-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
kv.set('artistas',JSON.stringify([{id,nombre:'Nombre original',bio:'Public original',visible:true}]));kv.set('artist_access_'+token,JSON.stringify({artist_id:id,expires:Date.now()+3600000}));
async function call(route,method='GET',body,admin=false){const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers:{'Content-Type':'application/json',...(admin?{Authorization:'Bearer '+env.ADMIN_KEY}:{})},...(body?{body:JSON.stringify(body)}:{})}),env,{});return {status:r.status,data:await r.json()};}
const access=()=>call('artista/access?token='+token),save=b=>call('artista/access','POST',{token,...b}),review=id=>call('admin/moderation/review','POST',{id,decision:'approve'},true);
try{
 await call('artist/plan?token='+token);
 const first=await access();assert.equal(first.data.draft.revision,0);
 const saved=await save({bio:'PRIVATE-DRAFT-ONE',save_only:true,draft_revision:0});assert.equal(saved.status,200);assert.equal(saved.data.draft_saved,true);assert.equal(saved.data.draft.revision,1);
 assert.equal((await access()).data.artist.bio,'PRIVATE-DRAFT-ONE');assert.equal((await call('public/artista?id='+id)).data.bio,'Public original');
 assert.equal((await save({bio:'STALE',save_only:true,draft_revision:0})).status,409);
 const pending=await save({bio:'PRIVATE-REVIEW-TWO',draft_revision:1});assert.equal(pending.status,202);assert.equal(pending.data.draft.state,'pending');assert.equal((await access()).data.artist.bio,'PRIVATE-REVIEW-TWO');
 await save({bio:'PRIVATE-NEWER-THREE',save_only:true,draft_revision:2});assert.equal((await review(pending.data.moderation_id)).status,409);assert.equal((await call('public/artista?id='+id)).data.bio,'Public original');
 const latest=await save({bio:'APPROVED-FOUR',draft_revision:3});assert.equal((await review(latest.data.moderation_id)).status,200);assert.equal((await call('public/artista?id='+id)).data.bio,'APPROVED-FOUR');assert.equal((await access()).data.draft.state,'applied');
 const concurrent=await Promise.all([save({bio:'CONCURRENT-A',save_only:true,draft_revision:4}),save({bio:'CONCURRENT-B',save_only:true,draft_revision:4})]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
 const revision=(await access()).data.draft.revision;
 await DB.prepare("CREATE TRIGGER fail_draft_queue BEFORE INSERT ON moderation_queue BEGIN SELECT RAISE(ABORT,'synthetic queue failure'); END").run();
 const interrupted=await save({bio:'PRIVATE-RECOVERABLE',draft_revision:revision});assert.equal(interrupted.status,200);assert.equal(interrupted.data.publication_error,true);assert.equal((await access()).data.artist.bio,'PRIVATE-RECOVERABLE');assert.equal((await call('public/artista?id='+id)).data.bio,'APPROVED-FOUR');
 await DB.prepare('DROP TRIGGER fail_draft_queue').run();
 const rejected=await save({bio:'PRIVATE-REJECTED',draft_revision:(await access()).data.draft.revision});
 const rejection=await call('admin/moderation/review','POST',{id:rejected.data.moderation_id,decision:'reject'},true);assert.equal(rejection.status,200);assert.equal((await access()).data.draft.state,'rejected');assert.equal((await access()).data.artist.bio,'PRIVATE-REJECTED');assert.equal((await call('public/artista?id='+id)).data.bio,'APPROVED-FOUR');
 const catalog=JSON.parse(kv.get('artistas'));catalog[0].visible=false;kv.set('artistas',JSON.stringify(catalog));
 const hidden=await save({bio:'PRIVATE-HIDDEN',draft_revision:(await access()).data.draft.revision});assert.equal(hidden.status,202);assert.match(hidden.data.message,/sigue privado/);assert.equal((await call('public/artista?id='+id)).status,404);
 await DB.prepare("INSERT INTO artist_owners(artist_id,claim_id,status,created_at,updated_at) VALUES(?,?,'active',?,?)").bind(id,'OTHER-OWNER',new Date().toISOString(),new Date().toISOString()).run();
 assert.equal((await access()).status,403);assert.equal((await save({bio:'UNAUTHORIZED',save_only:true})).status,403);
 console.log('PASS: private draft save/reopen, public isolation, stale and concurrent write conflicts, superseded review rejection, current approval, queue failure recovery and revoked owner denial.');
}finally{DB.close()}
