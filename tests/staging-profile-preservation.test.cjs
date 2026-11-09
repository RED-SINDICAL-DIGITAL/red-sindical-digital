const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const html=fs.readFileSync(path.join(__dirname,'../usuario.html'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'../app.html'),'utf8');
const worker=fs.readFileSync(path.join(__dirname,'../worker.js'),'utf8');
const cssStart='<style id="beta-profile-visual-20261108">';
const start=html.indexOf(cssStart), end=html.indexOf('</style>',start);
test('beta profile polish is isolated to native home',()=>{
 assert.ok(start>=0&&end>start,'Scoped visual style missing');
 assert.equal(html.indexOf(cssStart,start+1),-1,'duplicate styles');
 const css=html.slice(start+cssStart.length,end);
 assert.ok(css.includes('#profileNativeHome'),'must scope to native home');
 assert.ok(!/(?:^|})\\s*(?:\\.panel|\\.hero|body|button|a)\\s*\\{/m.test(css),'unscoped global selector');
 assert.ok(!/@import|url\s*\(/i.test(css),'no external CSS dependencies');
});
test('staging owner events and job tab controls are preserved',()=>{
 for(const id of [
  'profileNativeHome','profileLegacyViews','profileJobsTabApplications','profileJobsTabOffers',
  'profileJobsApplications','profileJobsOffers','profileOwnedEventEditor',
  'profileOwnedEventForm','profileOwnedEventSave','profileOwnedEventsList',
  'profileOwnedEventsRefresh','profileLocalEventsList','profileJobsTabsScript'
 ])assert.ok(html.includes('id="'+id+'"'),'Missing '+id);
 assert.ok(html.includes('/uadav-event-local-receipts.js'),'Local event receipt script missing');
});
test('current player and PWA controls remain intact',()=>{
 for(const id of ['mediaOptions','mediaSecondaryActions']){
  assert.ok(app.includes('id="'+id+'"'),'Missing player control '+id);
 }
 assert.ok(app.includes("getElementById('uadavInstallApp')"),'PWA install logic reference missing');
 for(const asset of ['uadav-personal-playlist.js','uadav-native-media-session.js','uadav-account-sync.js']){
  assert.ok(app.includes(asset),'Missing media integration '+asset);
 }
});
test('Worker has not been swapped with frozen QA artifact',()=>{
 const bytes=Buffer.from(worker,'utf8');
 const actual=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
 assert.equal(actual,'064ac343211dd7d3ed59ca8de5a3e4571c4f5308','Worker differs from functional staging baseline');
});
