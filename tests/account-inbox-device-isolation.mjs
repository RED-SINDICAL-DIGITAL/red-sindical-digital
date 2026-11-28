import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,init={})=>String(input)==='https://challenges.cloudflare.com/turnstile/v0/siteverify'
 ?new Response(JSON.stringify({success:['account-create-qa','artist-claim-qa'].includes(JSON.parse(init.body||'{}').response),action:JSON.parse(init.body||'{}').response==='account-create-qa'?'account_create':'artist_claim',hostname:'isolated.example'}),{status:200})
 :originalFetch(input,init);
const DB=sqliteD1(),kv=new Map(),first='UAC-'+'5'.repeat(64),other='UAC-'+'6'.repeat(64);
const env={DB,TURNSTILE_SITE_KEY:'synthetic-site',TURNSTILE_SECRET_KEY:'synthetic-secret',TURNSTILE_ALLOWED_HOSTNAMES:'isolated.example',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
async function api(secret,route,method='GET',body){
 const request=new Request('https://isolated.example/api/'+route,{method,headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},...(body?{body:JSON.stringify({...(route==='account'&&method==='POST'?{turnstile_token:'account-create-qa'}:route==='artista/claim'&&method==='POST'?{turnstile_token:'artist-claim-qa'}:{}),...body})}:{})});
 const response=await worker.fetch(request,env,{});return {status:response.status,data:await response.json()};
}
try{
 for(const token of [first,other])assert.equal((await api(token,'account','POST',{data:{uadav_user_v11:{name:'Synthetic inbox'}}})).status,200);
 const claim=await api(first,'artista/claim','POST',{new_profile:true,artist_name:'Synthetic notifications owner',rubro:'Música',name:'Synthetic',email:'owner@example.invalid'});
 assert.equal(claim.status,200);assert.equal(claim.data.status,'published');
 const id=claim.data.artist_id;
 kv.set('contrataciones',JSON.stringify([{id:'QA-INQUIRY-RECOVERY',artist_id:id,estado:'pendiente',creado:new Date().toISOString()}]));
 const initial=await api(first,'account/notifications');
 assert.equal(initial.status,200);
 assert.ok(initial.data.items.some(item=>item.id==='inquiry:QA-INQUIRY-RECOVERY'),'owner receives inquiry notification');
 const outsider=await api(other,'account/notifications');
 assert.equal(outsider.status,200);
 assert.ok(outsider.data.items.every(item=>item.id!=='inquiry:QA-INQUIRY-RECOVERY'),'other account cannot read inquiry');
 const linkedDevice=await api(first,'account/devices','POST',{name:'Replacement phone'});
 assert.equal(linkedDevice.status,200);
 const sameAccount=await api(linkedDevice.data.secret,'account/notifications');
 assert.equal(sameAccount.status,200);
 assert.ok(sameAccount.data.items.some(item=>item.id==='inquiry:QA-INQUIRY-RECOVERY'),'new device of same account sees inquiry');
 assert.equal((await api(linkedDevice.data.secret,'account/notifications','PATCH',{keys:['inquiry:QA-INQUIRY-RECOVERY']})).status,200);
 const readOnOriginal=await api(first,'account/notifications');
 assert.ok(readOnOriginal.data.items.some(item=>item.id==='inquiry:QA-INQUIRY-RECOVERY'&&item.read===true),'read state follows account across devices');
 const stillPrivate=await api(other,'account/notifications');
 assert.ok(stillPrivate.data.items.every(item=>item.id!=='inquiry:QA-INQUIRY-RECOVERY'));
 console.log('PASS: isolated Worker/SQLite: artist inquiry and read-state follow original account to linked device, never to another account.');
}finally{globalThis.fetch=originalFetch;DB.close()}
