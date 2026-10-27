import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map(),root='UAC-'+'a'.repeat(64),fresh='UAC-'+'b'.repeat(64),owner='UAC-'+'c'.repeat(64);
const env={DB,ADMIN_KEY:'isolated-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
async function call(secret,route='account',method='GET',body){
 const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.42'},...(body?{body:JSON.stringify(body)}:{})}),env,{});
 return {status:r.status,data:await r.json()};
}
try{
 assert.equal((await call(root,'account','POST',{data:{uadav_user_v11:{name:'Isolated account'},uadav_favorites_v1:[{id:'private-before-delete'}]}})).status,200);
 const devices=[];
 for(const name of ['Desktop','Mobile']){
  const d=await call(root,'account/devices','POST',{name});assert.equal(d.status,200);devices.push(d.data.secret);
 }
 const rotated=await call(devices[0],'account/recovery/atomic','POST',{request_id:crypto.randomUUID(),expected_version:(await call(devices[0],'account/identity')).data.recovery_version,new_secret:'UAC-'+Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('')});assert.equal(rotated.status,200);
 assert.match(rotated.data.secret,/^UAC-[a-f0-9]{64}$/);
 assert.equal((await call(root)).data.code,'RECOVERY_REVOKED');
 assert.equal((await call(rotated.data.secret)).status,200);
 for(const device of devices)assert.equal((await call(device)).status,200,'recovery rotation must retain approved devices');
 const rotatedAgain=await call(rotated.data.secret,'account/recovery/atomic','POST',{request_id:crypto.randomUUID(),expected_version:(await call(devices[0],'account/identity')).data.recovery_version,new_secret:'UAC-'+Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('')});assert.equal(rotatedAgain.status,200);
 assert.equal((await call(rotated.data.secret)).data.code,'RECOVERY_REVOKED');
 assert.equal((await call(rotatedAgain.data.secret)).status,200);
 assert.equal((await call(devices[0],'account','DELETE',{confirm:'ELIMINAR',revision:0})).status,409);
 assert.equal((await call(devices[0],'account','DELETE',{confirm:'',revision:1})).status,409);
 assert.equal((await call(devices[0])).status,200);
 await DB.prepare("CREATE TRIGGER interrupt_account_delete BEFORE DELETE ON audience_accounts BEGIN SELECT RAISE(ABORT,'Synthetic deletion interruption'); END").run();
 const interrupted=await call(devices[0],'account','DELETE',{confirm:'ELIMINAR',revision:1});assert.equal(interrupted.status,503);
 assert.equal((await DB.prepare('SELECT COUNT(*) n FROM audience_deletions').first()).n,0,'interrupted deletion must roll back its marker');
 for(const device of devices)assert.equal((await call(device)).status,200,'interrupted deletion must retain device access');
 await DB.prepare('DROP TRIGGER interrupt_account_delete').run();
 const deleted=await call(devices[0],'account','DELETE',{confirm:'ELIMINAR',revision:1});assert.equal(deleted.status,200);assert.equal(deleted.data.deleted,true);
 for(const secret of [root,rotated.data.secret,rotatedAgain.data.secret,...devices]){
  const denied=await call(secret);assert.equal(denied.status,401);assert.equal(denied.data.code,'ACCOUNT_DELETED');
  assert.equal((await call(secret,'account','POST',{data:{uadav_user_v11:{name:'Must not revive'}}})).status,401);
 }
 assert.equal((await DB.prepare('SELECT COUNT(*) n FROM audience_accounts').first()).n,0);
 assert.equal((await call(fresh,'account','POST',{data:{uadav_user_v11:{name:'New account same IP'}}})).status,200);
 const recreated=await call(fresh);assert.equal(recreated.status,200);assert.equal(recreated.data.data.uadav_favorites_v1,null,'new account cannot inherit deleted library');
 assert.equal((await call(owner,'account','POST',{data:{uadav_user_v11:{name:'Verified artist owner'}}})).status,200);
 const claim=await call(owner,'artista/claim','POST',{new_profile:true,artist_name:'Isolated owner guard',rubro:'Magia',name:'Ficticio',email:'owner@example.invalid'});assert.equal(claim.status,200);
 const approval=await call(env.ADMIN_KEY,'admin/artist-claims','PUT',{id:claim.data.id,status:'approved',review_note:'Synthetic verified owner'});assert.equal(approval.status,200);
 const blocked=await call(owner,'account','DELETE',{confirm:'ELIMINAR',revision:1});assert.equal(blocked.status,409);assert.equal(blocked.data.code,'ARTISTS_REQUIRE_ACTION');
 assert.equal((await call(owner)).status,200,'blocked deletion must retain account');
 assert.equal((await call(owner,'account/artist-session','POST',{artist_id:claim.data.artist_id})).status,200,'blocked deletion must retain artist access');
 console.log('PASS: Worker + SQLite recovery rotation invalidates previous backups and preserves devices; deletion requires current revision and explicit confirmation; interrupted deletion rolls back; completed deletion revokes all old credentials; same-IP new account allowed without inherited data; verified artist ownership blocks accidental account deletion.');
}finally{DB.close();}
