const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const source=readFileSync(join(__dirname,'..','uadav-api-config.js'),'utf8');
const bootstrap=source.split('(function(){')[0];
const stagingAPI='https://uadav-api-staging.uadavstream.workers.dev/api/';
const productionAPI='https://uadav-api.uadavstream.workers.dev/api/';
function configure(hostname,override){
 const window={PLATFORM_API_BASE:override};const location={hostname};
 vm.runInNewContext(bootstrap,{window,location});
 return window;
}
test('canonical staging Pages uses staging API despite production override',()=>{
 const x=configure('uadav-stream-staging.pages.dev',productionAPI);
 assert.equal(x.PLATFORM_API_BASE,stagingAPI);
 assert.equal(x.UADAV_API_BASE,stagingAPI);
});
test('Cloudflare preview branch Pages uses staging API',()=>{
 const x=configure('feature-demo.pages.dev',productionAPI);
 assert.equal(x.PLATFORM_API_BASE,stagingAPI);
 assert.equal(x.UADAV_API_BASE,stagingAPI);
});
test('Cloudflare nested preview Pages uses staging API',()=>{
 const x=configure('feature.branch.pages.dev',productionAPI);
 assert.equal(x.PLATFORM_API_BASE,stagingAPI);
});
test('production domain preserves configured API base',()=>{
 const x=configure('uadavstream.com.ar',productionAPI);
 assert.equal(x.PLATFORM_API_BASE,productionAPI);
 assert.equal(x.UADAV_API_BASE,productionAPI);
});
test('lookalike and attacker hostname is not treated as Pages staging',()=>{
 const x=configure('feature-demo.pages.dev.attacker.invalid',productionAPI);
 assert.equal(x.PLATFORM_API_BASE,productionAPI);
});
