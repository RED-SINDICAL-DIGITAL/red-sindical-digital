const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'..','usuario.html'),'utf8');
test('artist is a dedicated accessible screen with current authorization and recovery controls',()=>{
 for(const id of ['mi-artista','profileArtistTitle','linkedArtists','artistAccountStatus','artistAccessRetry','artistProfile','artistInquiries','artistPublic','artistKit','artistTools'])
  assert(html.includes('id="'+id+'"'),id);
 assert.match(html,/id="mi-artista" aria-labelledby="profileArtistTitle"/);
 assert.match(html,/href="\/soy-artista\.html"/);
 assert.match(html,/href="\/gestionar-artista\.html\?tab=consultas"/);
 assert.match(html,/Para adjuntarlo a un trabajo, primero vinculalo acá/);
});
test('jobs separates applications and offers and preserves receipt privacy',()=>{
 for(const id of ['profileJobsApplications','profileJobsOffers','profileJobImportBtn','profileJobImportFile','profileJobImportStatus','profileJobLookup','profileJobId','profileJobSecret','profileJobResult'])
  assert(html.includes('id="'+id+'"'),id);
 assert.match(html,/id="profileJobSecret" required type="password"/);
 assert.match(html,/id="profileJobsTabApplications" data-profile-jobs-tab="applications"/);
 assert.match(html,/data-profile-jobs-tab="offers" tabindex="-1"/);
 assert.match(html,/href="\/bolsa-trabajo\.html#ownerInbox"/);
 assert.match(html,/href="\/bolsa-trabajo\.html#buscar-oportunidades"/);
});
test('a11y tabs isolate panes, respond to clicks and arrow keys',()=>{
 const match=html.match(/<script id="profileJobsTabsScript">([\s\S]*?)<\/script>/);
 assert(match,'missing local job tab initialization');
 const js=match[1];new vm.Script(js);
 const tab=(name)=>({dataset:{profileJobsTab:name},attrs:{},tabIndex:0,listeners:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,fn){this.listeners[k]=fn},focus(){this.focused=true}});
 const t1=tab('applications'),t2=tab('offers');
 const panes={profileJobsApplications:{hidden:false},profileJobsOffers:{hidden:true}};
 const root={querySelectorAll:()=>[t1,t2]};
 const document={getElementById:id=>id==='mis-trabajos'?root:panes[id]||null};
 vm.runInNewContext(js,{document});
 assert.equal(t1.attrs['aria-selected'],'true');
 t2.listeners.click();
 assert.equal(t1.attrs['aria-selected'],'false');
 assert.equal(t2.attrs['aria-selected'],'true');
 assert.equal(panes.profileJobsApplications.hidden,true);
 assert.equal(panes.profileJobsOffers.hidden,false);
 t2.listeners.keydown({key:'ArrowRight',preventDefault(){}});
 assert.equal(t1.attrs['aria-selected'],'true');
 assert.equal(t1.focused,true);
});
test('detail pages are scoped blue and cyan mobile-first; no global CSS changes',()=>{
 assert.match(html,/<style id="u2-profile-detail-v1">/);
 assert.match(html,/body\[data-page="usuario"\]\.uadav-ui-v2 \.u2-work-form/);
 assert.match(html,/body\[data-page="usuario"\]\.uadav-ui-v2 \[role="tabpanel"\]\[hidden\]/);
 assert.match(html,/@media\(min-width:760px\)/);
});
test('all inline scripts parse without syntax errors',()=>{
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
});
