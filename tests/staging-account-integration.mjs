import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
const base=new URL(process.env.UADAV_STAGING_API||'');
assert.equal(base.protocol,'https:');assert.match(base.hostname,/^uadav-api-staging\.[a-z0-9-]+\.workers\.dev$/i);
assert.equal(base.pathname,'/api/');assert.equal(base.search,'');assert.equal(base.hash,'');assert.equal(base.username,'');assert.equal(base.password,'');
const credential='UAC-'+randomBytes(32).toString('hex');
async function call(method,body,authorized=true){
 const response=await fetch(new URL('account',base),{method,redirect:'error',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json',...(authorized?{Authorization:'Bearer '+credential}:{})},...(body?{body:JSON.stringify(body)}:{})});
 return {status:response.status,body:await response.json()};
}
const config=await fetch(new URL('signal-onboarding/config',base),{redirect:'error',signal:AbortSignal.timeout(15000)}).then(r=>r.json());
assert.equal(config.enabled,false,'enrollment must remain closed');
assert.equal((await call('GET',null,false)).status,401);
const created=await call('POST',{data:{uadav_user_v11:{name:'PRUEBA STAGING · SIN DATOS PERSONALES',avatar:'T'},uadav_favorites_v1:[]}});
assert.equal(created.status,200);assert.equal(created.body.revision,1);
const read=await call('GET');assert.equal(read.status,200);assert.equal(read.body.data.uadav_user_v11.name,'PRUEBA STAGING · SIN DATOS PERSONALES');
const changed=await call('PUT',{revision:read.body.revision,data:{...read.body.data,uadav_favorites_v1:[{id:'staging-synthetic-content',title:'Prueba de sincronización'}]}});
assert.equal(changed.status,200);assert.equal(changed.body.revision,2);
const stale=await call('PUT',{revision:1,data:read.body.data});assert.equal(stale.status,409);assert.equal(stale.body.code,'REVISION_CONFLICT');
const final=await call('GET');assert.equal(final.body.revision,2);assert.equal(final.body.data.uadav_favorites_v1[0].id,'staging-synthetic-content');
console.log('PASS: remote staging D1 schema, synthetic account create/read/update, denied anonymous access, stale revision conflict and persisted state. One synthetic test account retained; no existing data deleted; credentials not logged.');
