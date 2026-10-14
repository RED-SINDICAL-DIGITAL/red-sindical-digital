import assert from 'node:assert/strict';
const base=new URL(process.env.UADAV_STAGING_API||'');
assert.equal(base.protocol,'https:');
assert.match(base.hostname,/^uadav-api-staging\.[a-z0-9-]+\.workers\.dev$/i,'Only the isolated staging Worker is permitted');
assert.equal(base.pathname,'/api/');
assert.equal(base.search,'');assert.equal(base.hash,'');
assert.equal(base.username,'');assert.equal(base.password,'');
const get=async path=>{
 const response=await fetch(new URL(path,base),{redirect:'error',signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});
 const body=await response.json();return {response,body};
};
const health=await get('health');assert.equal(health.response.status,200);assert.equal(health.body.kv,true);assert.equal(health.body.d1,true);
const config=await get('signal-onboarding/config');assert.equal(config.response.status,200);
assert.equal(config.body.enabled,false);assert.equal(config.body.radio,false);assert.equal(config.body.tv,false);
for(const route of ['signal-onboarding/applications','signal_onboarding_applications','ticket_orders','marketplace_requests','postulaciones_trabajo','new_private_key_not_previously_known','custom-owner-token']){
 const {response}=await get(route);assert.equal(response.status,401,route);
}
console.log('PASS: isolated remote staging health, enrollment closed, anonymous access denied; no writes performed');
