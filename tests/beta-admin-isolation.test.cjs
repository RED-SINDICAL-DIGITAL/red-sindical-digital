const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const config=readFileSync('uadav-api-config.js','utf8');
const preamble=config.split('(function(){')[0];
const admin=readFileSync('admin.html','utf8');
const policy=require('../uadav-module-policy.js');
function run(hostname,previous={}){
 const window={...previous};
 const ctx={window,location:{hostname},document:{addEventListener(){}},console};
 vm.runInNewContext(preamble,ctx,{timeout:1000});
 return window;
}
test('main staging and branch previews always use only staging API even if legacy globals contain production',()=>{
 for(const hostname of ['uadav-stream-staging.pages.dev','feat-beta-staging-profile-20.uadav-stream-staging.pages.dev','01b1f9de.uadav-stream-staging.pages.dev']){
  const w=run(hostname,{PLATFORM_API_BASE:'https://uadav-api.uadavstream.workers.dev/api/',UADAV_API_BASE:'https://uadav-api.uadavstream.workers.dev/api/',PLATFORM_USE_LOCAL_API:true});
  assert.equal(w.PLATFORM_API_BASE,'https://uadav-api-staging.uadavstream.workers.dev/api/');
  assert.equal(w.UADAV_API_BASE,w.PLATFORM_API_BASE);
  assert.equal(w.PLATFORM_USE_LOCAL_API,false);
 }
});
test('non-staging names preserve explicit API selection and production fallback',()=>{
 assert.equal(run('uadavstream.com.ar').PLATFORM_API_BASE,'https://uadav-api.uadavstream.workers.dev/api/');
 assert.equal(run('example.com',{PLATFORM_API_BASE:'https://other.invalid/api/'}).PLATFORM_API_BASE,'https://other.invalid/api/');
 assert.equal(run('uadav-stream-staging.pages.dev.evil.example').PLATFORM_API_BASE,'https://uadav-api.uadavstream.workers.dev/api/');
});
test('Admin reads shared API config before using authenticated requests',()=>{
 const configScript=admin.indexOf('<script src="/uadav-api-config.js"></script>');
 const adminCore=admin.indexOf('const API_REMOTE=window.PLATFORM_API_BASE');
 assert(configScript>0&&adminCore>configScript);
 assert(admin.includes("const bases=[...new Set([API_ACTIVE,API_REMOTE"));
});
test('retired PRO is disabled across public policy and Admin module settings',()=>{
 assert.equal(policy.defaults.pro,false);
 assert.equal(policy.flags({pro:true}).pro,false);
 assert.equal(policy.disabled('/planes-artistas.html',{pro:true}),'pro');
 assert.match(admin,/out\.pro=false;return out/);
 assert.match(admin,/values\.pro=false;return values/);
 assert.equal((admin.match(/Object\.entries\(window\.UADAVModulePolicy\.labels\)\.filter\(\(\[k\]\)=>k!=='pro'\)/g)||[]).length,2);
});
