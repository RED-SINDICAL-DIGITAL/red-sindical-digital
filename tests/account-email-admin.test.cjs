const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{webcrypto,createHash}=require('node:crypto');
const html=fs.readFileSync(path.join(__dirname,'../configurar-correo.html'),'utf8');
const original=fs.readFileSync(path.join(__dirname,'../uadav-account-email-admin.js'),'utf8');
const moduleURL="import('/uadav-backup-digest.js?v=11769.1')";
assert(original.includes(moduleURL));
// Resolve the browser's same-origin module URL using the real, unchanged module.
const source=original.replace(moduleURL,'loadDigest()');
const digestSource=fs.readFileSync(path.join(__dirname,'../uadav-backup-digest.js'),'utf8');
const loadDigest=()=>import('data:text/javascript,'+encodeURIComponent(digestSource));
const endpoint='https://uadav-api-staging.uadavstream.workers.dev/api/admin/access-email';
const status=(extra={})=>({build:'11769',checked_at:'2026-10-27T18:00:00.000Z',scope:'account-email-staging',installed:true,enabled:false,qa_verification:false,qa_login:false,daily_budget:240,...extra});
class Element {constructor(){this.hidden=false;this.disabled=false;this.value='';this.textContent=''}click(){this.clicked=true}}
function page(transport){
 const nodes=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],new Element()])),events={},calls=[],files=[],copies=[];let now=Date.now();
 class Clock extends Date {static now(){return now}}
 vm.runInNewContext(source,{document:{getElementById:id=>nodes[id],createElement:()=>new Element()},Date:Clock,crypto:webcrypto,TextEncoder,Uint8Array,Blob,URL:{createObjectURL(b){files.push(b);return 'blob:synthetic'},revokeObjectURL(){}},AbortController,setTimeout,clearTimeout,loadDigest,addEventListener:(k,f)=>events[k]=f,navigator:{clipboard:{writeText:async s=>copies.push(s)}},fetch:async(route,options)=>{calls.push({route,options});return transport(route,options)}});
 return{nodes,events,calls,files,copies,advance:ms=>now+=ms,login:async()=>{nodes.mailAdminKey.value='synthetic-admin';await nodes.mailAdminLogin.onsubmit({preventDefault(){}})}};
}
async function backup(){
 const b={generated_at:'2026-10-27T18:00:00.000Z',job_storage:'d1',kv:{bolsa_trabajo:[{contacto:'PRIVATE_EMAIL'}]},tables:{access_email_identities:[{sealed_email:'PRIVATE_CIPHERTEXT'}]},job_snapshot_integrity:{complete:true,d1_atomic_snapshot:true,offers:1,applications:0},backup_integrity:{complete:true},backup_policy:{temporary_authentication_excluded:true}};
 return seal(b);
}
function seal(b){delete b.backup_digest;b.backup_digest={algorithm:'SHA-256',format:'json-stringify-without-backup_digest-v1',value:createHash('sha256').update(JSON.stringify(b)).digest('hex')};return b}
test('Admin entry and refresh are read-only; incomplete QA cannot enable general mail',async()=>{
 const p=page(async()=>Response.json(status()));assert.equal(p.calls.length,0);await p.login();await p.nodes.mailAdminRefresh.onclick();assert(p.calls.every(c=>c.route===endpoint&&c.options.method==='GET'));assert.equal(p.nodes.mailAdminKey.value,'');assert.equal(p.nodes.mailEnable.disabled,true);assert.equal(p.files.length,0);await p.nodes.mailReportCopy.onclick();assert.equal(JSON.parse(p.copies[0]).result,'pending');
});
test('both real proofs unlock the actual enable button, then enable and pause use explicit actions',async()=>{
 let enabled=false;const p=page(async(route,o)=>{if(o.method==='POST')enabled=JSON.parse(o.body).action==='enable';return Response.json(status({qa_verification:true,qa_login:true,enabled}))});
 await p.login();assert.equal(p.nodes.mailEnable.disabled,false);assert.equal(p.nodes.mailDisable.disabled,true);await p.nodes.mailEnable.onclick();assert.equal(p.nodes.mailEnable.disabled,true);assert.equal(p.nodes.mailDisable.disabled,false);await p.nodes.mailDisable.onclick();assert.equal(p.nodes.mailEnable.disabled,false);assert.deepEqual(p.calls.filter(c=>c.options.method==='POST').map(c=>JSON.parse(c.options.body)),[{action:'enable',confirm:'HABILITAR CORREO EN STAGING'},{action:'disable',confirm:'PAUSAR CORREO EN STAGING'}]);
});
test('backup is explicit, checks the real checksum module and exposes only safe metadata',async()=>{
 const b=await backup(),p=page(async route=>Response.json(route===endpoint?status():b));await p.login();assert.equal(p.files.length,0);await p.nodes.mailBackup.onclick();assert.equal(p.files.length,1);assert.equal(await p.files[0].text(),JSON.stringify(b,null,2));await p.nodes.mailReportCopy.onclick();const report=JSON.parse(p.copies[0]);assert(!p.copies[0].includes('PRIVATE_'));assert.equal(report.backup.verified_email_identities,1);assert.equal(report.backup.file_sha256,createHash('sha256').update(await p.files[0].text()).digest('hex'));assert.equal(report.backup.content_sha256,b.backup_digest.value);assert(p.calls.every(c=>c.options.headers.Authorization==='Bearer synthetic-admin'));
});
test('altered or incomplete snapshots cannot start a download or leave a successful report',async()=>{
 for(const kind of ['altered','incomplete']){const b=await backup();if(kind==='altered')b.kv.bolsa_trabajo[0].contacto='changed';else{delete b.job_snapshot_integrity;seal(b)}const p=page(async route=>Response.json(route===endpoint?status():b));await p.login();await p.nodes.mailBackup.onclick();assert.equal(p.files.length,0);await p.nodes.mailReportCopy.onclick();assert.equal(JSON.parse(p.copies[0]).backup,null)}
});
test('exit discards late private downloads and session expiry clears Admin before another fetch',async()=>{
 const b=await backup();let resolve;const p=page(async route=>route===endpoint?Response.json(status()):new Promise(r=>resolve=r));await p.login();const pending=p.nodes.mailBackup.onclick();p.events.pagehide();resolve(Response.json(b));await pending;assert.equal(p.files.length,0);assert.equal(p.nodes.mailAdminTools.hidden,true);await p.login();const before=p.calls.length;p.advance(600001);await p.nodes.mailAdminRefresh.onclick();assert.equal(p.calls.length,before);assert.equal(p.nodes.mailAdminTools.hidden,true);assert.equal(p.nodes.mailReport.textContent,'');
});
