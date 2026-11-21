import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateHealth,checkStagingHealth} from '../scripts/qa-staging-health-readonly.mjs';
const healthy={ok:true,success:true,build:'11770',kv:true,d1:true};
test('staging health requires explicit KV and D1 readiness',()=>{
 assert.equal(evaluateHealth(healthy).ok,true);
 for(const field of ['kv','d1']){const broken={...healthy,[field]:false};assert.equal(evaluateHealth(broken).ok,false)}
 assert.equal(evaluateHealth({...healthy,ok:false,success:false}).ok,false);
});
test('health read uses GET with no authorization or payload',async()=>{
 let calls=0;
 const result=await checkStagingHealth(async(url,options)=>{
  calls++;
  assert.equal(url,'https://uadav-api-staging.uadavstream.workers.dev/api/health');
  assert.equal(options.method,'GET');
  assert.equal(options.headers.Authorization,undefined);
  assert.equal(options.body,undefined);
  return {ok:true,json:async()=>healthy};
 });
 assert.equal(calls,1);
 assert.equal(result.ok,true);
 assert.equal(result.build,'11770');
});
test('reject non-2xx health responses',async()=>{
 await assert.rejects(checkStagingHealth(async()=>({ok:false,status:503})),/HTTP 503/);
});
