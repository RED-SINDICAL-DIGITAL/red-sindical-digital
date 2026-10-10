import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||=webcrypto;
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const DB=sqliteD1(),env={DB},root='UAC-'+'a'.repeat(64),other='UAC-'+'b'.repeat(64),target='UAD-'+'c'.repeat(64);
let ipSerial=0;
async function send(path,method='GET',body=null,secret=root,ip='ip-'+(++ipSerial),origin='https://uadavstream.com.ar'){
 const r=await worker.fetch(new Request('https://worker.invalid/api/account'+path,{method,headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json','CF-Connecting-IP':ip,Origin:origin},...(body?{body:JSON.stringify(body)}:{})}),env,{});return{status:r.status,headers:r.headers,data:await r.json()};
}
try{
 assert.equal((await send('', 'POST',{data:{uadav_user_v11:{name:'Marcos'}}})).status,200);
 await send('','POST',{data:{}},other);
 assert.equal((await send('', 'PATCH',null,root)).status,405); // Unsupported method; DELETE is reserved for confirmed account removal.
 assert.equal((await send('','GET',null,root,undefined,'https://evil.invalid')).status,403);
 const migration=await send('/devices','POST',{name:'Mi PC'});assert.equal(migration.status,200);assert.match(migration.data.secret,/^UAD-[a-f0-9]{64}$/);
 const invitation=await send('/pair','POST',{action:'create'},migration.data.secret);assert.equal(invitation.status,200);assert.match(invitation.data.code,/^\d{6}$/);assert.match(invitation.data.proof,/^[a-f0-9]{64}$/);
 assert.equal(invitation.data.secret,undefined);
 const joined=await send('/pair/join','POST',{proof:invitation.data.proof,name:'Mi celular'},target);assert.equal(joined.status,200);assert.match(joined.data.verification,/^\d{4}$/);
 assert.equal((await send('','GET',null,target)).status,401);
 assert.equal((await send('/pair/status?id='+joined.data.id,'GET',null,target)).data.state,'requested');
 assert.equal((await send('/pair','POST',{action:'approve',id:joined.data.id,verification:joined.data.verification},other)).status,409);
 assert.equal((await send('/pair','POST',{action:'approve',id:joined.data.id,verification:'wrong'})).status,409);
 const approvals=await Promise.all([send('/pair','POST',{action:'approve',id:joined.data.id,verification:joined.data.verification}),send('/pair','POST',{action:'approve',id:joined.data.id,verification:joined.data.verification})]);assert.deepEqual(approvals.map(r=>r.status).sort(),[200,409]);
 assert.equal((await send('/pair/status?id='+joined.data.id,'GET',null,target)).data.state,'approved');assert.equal((await send('','GET',null,target)).data.data.uadav_user_v11.name,'Marcos');
 assert.equal((await send('/pair/join','POST',{code:invitation.data.code,name:'Replay'},'UAD-'+'d'.repeat(64))).status,400);
 const devices=await send('/devices','GET',null,target);assert.equal(devices.data.devices.length,2);assert.equal(devices.data.devices.filter(x=>x.current).length,1);assert.equal(JSON.stringify(devices.data).includes('credential_hash'),false);
 const id=devices.data.devices.find(x=>x.current).id;
 assert.equal((await send('/devices','POST',{action:'revoke',id},other)).status,404);
 assert.equal((await send('/devices','POST',{action:'revoke',id})).status,200);assert.equal((await send('','GET',null,target)).status,401);
 const expired=await send('/pair','POST',{action:'create'});await DB.prepare('UPDATE audience_pairings SET expires_at=0 WHERE id=?').bind(expired.data.id).run();assert.equal((await send('/pair/join','POST',{code:expired.data.code},'UAD-'+'e'.repeat(64))).status,400);
 const cancelled=await send('/pair','POST',{action:'create'});await send('/pair','POST',{action:'cancel',id:cancelled.data.id});assert.equal((await send('/pair/join','POST',{code:cancelled.data.code},'UAD-'+'f'.repeat(64))).status,400);
 for(let i=0;i<8;i++)assert.equal((await send('/pair/join','POST',{code:'invalid'},target,'blocked-ip')).status,400);
 assert.equal((await send('/pair/join','POST',{code:'invalid'},target,'blocked-ip')).status,429);
 const rows=await DB.prepare('SELECT * FROM audience_pairings').all();assert.equal(JSON.stringify(rows).includes(invitation.data.proof),false);assert.equal(JSON.stringify(rows).includes(invitation.data.code),false);
 assert.equal((await send('','PUT',{revision:1,data:{uadav_favorites_v1:[{url:'javascript:alert(1)'}]}})).status,400);
 assert.equal((await send('/pair','POST',{action:'create',padding:'x'.repeat(6000)})).status,413);
 assert.equal((await send('/pair','POST',{action:'create',padding:'😀'.repeat(2000)})).status,413);
 const current=await send('');const saves=await Promise.all([send('','PUT',{revision:current.data.revision,data:current.data.data}),send('','PUT',{revision:current.data.revision,data:current.data.data})]);assert.deepEqual(saves.map(r=>r.status).sort(),[200,409]);
 const rotated=await send('/recovery','POST',{},migration.data.secret);assert.equal(rotated.status,200);assert.equal((await send('','GET',null,root)).status,401);assert.equal((await send('','GET',null,rotated.data.secret)).status,200);assert.equal((await send('','GET',null,migration.data.secret)).status,200);
 console.log('PASS: real SQLite transactions, QR/code, approval, expiry, replay, revocation, account isolation, rate limits, origin restrictions and CAS');
}finally{DB.close()}
