const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const file=readFileSync(require('node:path').join(__dirname,'../uadav-api-config.js'),'utf8');
const setup=file.slice(0,file.indexOf('(function(){'));
assert.ok(setup.length>200,'Expected API setup block');
function resolve(hostname, overrides={}){
 const context={location:{hostname},window:{...overrides}};
 vm.runInNewContext(setup,context,{timeout:1000});
 return context.window;
}
for(const hostname of [
 'uadav-stream-staging.pages.dev',
 'feat-beta-staging-profile-20.uadav-stream-staging.pages.dev',
 'integration-staging-preserve-beta-20261109.uadav-stream-staging.pages.dev'
]){
 test(hostname+' cannot select production or local API',()=>{
  const state=resolve(hostname,{PLATFORM_API_BASE:'https://uadav-api.uadavstream.workers.dev/api/',UADAV_USE_LOCAL_API:true});
  assert.equal(state.PLATFORM_API_BASE,'https://uadav-api-staging.uadavstream.workers.dev/api/');
  assert.equal(state.UADAV_API_BASE,state.PLATFORM_API_BASE);
  assert.equal(state.UADAV_USE_LOCAL_API,false);
  assert.equal(state.PLATFORM_USE_LOCAL_API,false);
 });
}
test('explicit staging environment routes to staging',()=>{
 const state=resolve('localhost',{UADAV_ENV:'staging',PLATFORM_API_BASE:'https://uadav-api.uadavstream.workers.dev/api/'});
 assert.equal(state.PLATFORM_API_BASE,'https://uadav-api-staging.uadavstream.workers.dev/api/');
});
test('production hostname retains preconfigured API',()=>{
 const state=resolve('uadavstream.com.ar',{PLATFORM_API_BASE:'https://custom.example/api/',PLATFORM_USE_LOCAL_API:true});
 assert.equal(state.PLATFORM_API_BASE,'https://custom.example/api/');
 assert.equal(state.PLATFORM_USE_LOCAL_API,true);
});
test('production hostname defaults to production API',()=>{
 assert.equal(resolve('uadavstream.com.ar').PLATFORM_API_BASE,'https://uadav-api.uadavstream.workers.dev/api/');
});
