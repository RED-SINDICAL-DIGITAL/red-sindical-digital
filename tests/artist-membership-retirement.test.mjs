import test from 'node:test';import assert from 'node:assert/strict';import {loadWorker} from './load-worker.mjs';
const {default:worker}=await loadWorker();
const paths=[['/api/pro/payment-orders','POST'],['/api/pro/payment-orders/report','POST'],['/api/pro/bank-confirmation','POST'],['/api/admin/pro-payment-orders/review','POST'],['/api/admin/artist-plan','PUT'],['/api/admin/pro-payment-settings','PUT'],['/api/artist/pro-benefits','GET'],['/api/admin/pro-features','POST']];
for(const [path,method] of paths)test(`retired membership ${method} ${path} cannot write`,async()=>{
 const inaccessible=()=>{throw Error('Storage must not be accessed')};const env={ADMIN_KEY:'local-admin',DB:{prepare:inaccessible,batch:inaccessible},UADAV_DB:{get:inaccessible,put:inaccessible}};
 const r=await worker.fetch(new Request('https://isolated.invalid'+path,{method,headers:{Authorization:'Bearer local-admin'}}),env,{});
 assert.equal(r.status,410);assert.equal((await r.json()).code,'ARTIST_MEMBERSHIP_RETIRED');
});
for(const path of ['/api/pro/payment-settings','/api/pro/payment-destination'])test(`retired checkout ${path} never exposes bank details`,async()=>{
 const r=await worker.fetch(new Request('https://isolated.invalid'+path),{},{});assert.equal(r.status,200);assert.deepEqual(await r.json(),{enabled:false,retired:true});
});
