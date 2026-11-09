const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'usuario.html'),'utf8');

test('native profile ships every local script and stylesheet it references',()=>{
 const resources=[...source.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)].map(m=>m[1]);
 assert(resources.length>10,'Expected native profile dependencies');
 for(const resource of resources){
  if(!resource.startsWith('/'))continue;
  const pathname=resource.split('?')[0];
  assert(!pathname.includes('..'),'No parent directory references');
  assert(fs.existsSync(path.join(root,pathname.slice(1))),`Missing profile resource: ${pathname}`);
 }
});
test('native layout exposes the home and legacy containers exactly once',()=>{
 for(const id of ['profileNativeHome','profileLegacyViews','nativeHomeSections','profileViewHeader','profileViewTitle','profileTasks','accountNotices']){
  assert.equal((source.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 const js=fs.readFileSync(path.join(root,'design/uadav-profile-native-mount-v4.js'),'utf8').trim();
 assert(source.includes(js),'Inline mount logic must match separately tested source');
});
test('profile is a staging-only integration and does not alter the beta Worker',()=>{
 const worker=fs.readFileSync(path.join(root,'worker.js'),'utf8');
 assert(worker.includes("event_owner_revision:'20261107-owner-verified-v1'"));
 assert(worker.includes("if(path==='/api/eventos/mis')"));
});
