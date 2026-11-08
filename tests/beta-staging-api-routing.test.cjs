const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const shell=fs.readFileSync(new URL('../app.html','file://'+__filename),'utf8');
const stagingHost='uadav-stream-staging.pages.dev',stagingApi='https://uadav-api-staging.uadavstream.workers.dev/api/',prodApi='https://uadav-api.uadavstream.workers.dev/api/';
test('staging shell resolves platform status, modules and branding to staging',()=>{
 const resolver="(location.hostname==='"+stagingHost+"'?'"+stagingApi+"':'"+prodApi+"')";
 assert.equal(shell.split(resolver).length-1,3,'Status, modules and branding must each resolve by hostname');
 assert(shell.includes("fetch("+resolver+"+'estado_sitio?_='"));
 assert(shell.includes('window.PLATFORM_API_BASE||window.UADAV_API_BASE||'+resolver));
 assert.equal(shell.includes("fetch('"+prodApi+"estado_sitio?_='"),false,'No unconditional production redirect status check');
});
test('production still has its existing API fallback',()=>{
 assert(shell.includes("'"+prodApi+"'"));
 assert(shell.includes("'"+stagingApi+"'"));
});
