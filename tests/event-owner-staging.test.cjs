const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const worker=fs.readFileSync(path.join(__dirname,'..','worker.js'),'utf8');
const ownerStart=worker.indexOf("if(path==='/api/eventos/mis')");
const ownerEnd=worker.indexOf("if(path==='/api/eventos/receipt'",ownerStart);
const route=worker.slice(ownerStart,ownerEnd);
const publishStart=worker.indexOf("if (path === '/api/eventos') {");
const publishEnd=worker.indexOf("if (path === '/api/cartelera')",publishStart);
const publish=worker.slice(publishStart,publishEnd);
test('events owner route is staging-and-D1-gated, denies unsupported HTTP methods',()=>{
 assert(ownerStart>0&&ownerEnd>ownerStart);
 assert.match(route,/!atomicEventsEnabled\|\|!hasD1\(\)/);
 assert.match(route,/\['GET','POST'\]\.includes\(request\.method\)/);
 assert.match(route,/request\.method==='POST'&&request\.headers\.get\('Origin'\)!=='https:\/\/uadav-stream-staging\.pages\.dev'/);
 assert.match(route,/Cache-Control','no-store'/);
});
test('server authenticates with account identity and never trusts email, event ID or arbitrary token',()=>{
 assert.match(route,/identity=await aeIdentity\(request,env\)/);
 assert.match(publish,/identity=await aeIdentity\(request,env\)/);
 assert.match(publish,/item\.created_by_account_id=identity\.accountId/);
 assert(!route.includes('contacto_email'));
 assert(!route.includes('request_id'));
 assert(!route.includes('artist_token'));
 assert(!route.includes('isAdmin()'));
});
test('private listing and mutations filter by server-associated owner in D1',()=>{
 assert.match(route,/json_extract\(data_json,'\$\.created_by_account_id'\)=\?/);
 assert.match(route,/\.bind\(identity\.accountId\)\.all\(\)/);
 assert.match(route,/\.bind\(b\.id,identity\.accountId\)\.first\(\)/);
 assert.match(route,/current\.created_by_account_id!==identity\.accountId/);
 assert.match(route,/status IN \('published','hidden'\)/);
 assert.match(route,/\['hide','publish'\]\.includes\(b\.action\)/);
 assert.match(route,/await mutateCanonicalEvent\(before,after\)/);
 assert.match(route,/saved\.conflict/);
});
test('owner list does not leak contact email, private keys or authorization credentials',()=>{
 assert.match(route,/SELECT id,title,start_date,status FROM events/);
 assert(!route.includes('SELECT * FROM events'));
 assert(!route.includes('Authorization'));
 assert(!route.includes('secret'));
 assert.match(route,/\.map\(e=>\(\{id:e\.id,titulo:e\.title,fecha:e\.start_date,estado:e\.status\}\)\)/);
});
test('public receipt route never grants ownership and legacy events cannot be auto-claimed',()=>{
 const receipt=worker.slice(worker.indexOf("if(path==='/api/eventos/receipt'"),worker.indexOf("if(path==='/api/eventos/capabilities'"));
 assert(!receipt.includes('created_by_account_id'));
 assert.match(publish,/if\(atomicEventsEnabled&&request\.headers\.get\('Authorization'\)\)/);
 assert(!route.includes('INSERT OR REPLACE'));
 assert(!route.includes('UPDATE events SET created_by_account_id'));
});
