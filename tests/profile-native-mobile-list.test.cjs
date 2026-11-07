const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const html=readFileSync(join(__dirname,'..','usuario.html'),'utf8');
const css=readFileSync(join(__dirname,'..','design/uadav-profile-home-v2.css'),'utf8');
test('profile home is a compact action list on small screens, not a four-card dashboard',()=>{
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/#profileTasks \.profile-tasks\{display:flex!important;flex-direction:column!important/);
 assert.match(css,/#profileTasks \.profile-task\{display:grid!important;grid-template-columns:44px minmax\(0,1fr\) 18px!important/);
 assert.match(css, /min-height:67px!important/);
 assert.match(css, /#profileTasks \.profile-task::after\{content:"›"/);
});
test('primary actions retain working targets and are ordered by user need',()=>{
 const content=html.split('id="profileTasks"')[1].split('</section>')[0];
 const paths=['/usuario.html?vista=artista','/usuario.html?vista=trabajos','/biblioteca.html','/publicar-evento.html'];
 let prev=-1;
 for(const p of paths){const idx=content.indexOf('href="'+p+'"');assert(idx>prev,p);prev=idx}
 assert.equal((content.match(/class="profile-task"/g)||[]).length,4);
});
test('recovery remains immediately visible; secondary actions are progressively disclosed',()=>{
 const content=html.split('id="profileTasks"')[1].split('</section>')[0];
 assert.match(content,/<details class="profile-more"><summary>Más opciones<\/summary>/);
 assert.match(content,/<\/details><a href="\/usuario\.html\?vista=cuenta" class="profile-account-link profile-account-shortcut"/);
 assert.match(content,/href="\/manual\.html"/);
 assert.match(content,/href="\/artistas\.html"/);
});
test('account, artist, jobs and player wiring is unchanged',()=>{
 for(const id of ['profileSettings','recoverAccount','accountDevices','artistProfile','linkedArtists','mis-trabajos','profileJobLookup','recent'])assert(html.includes('id="'+id+'"'),id);
 assert.match(html,/openRecent\(a\[Number\(el\.dataset\.i\)\]\)/);
 assert.match(html,/uadav-account-sync\.js/);
});
test('cache revision identifies this substantial redesign',()=>{
 assert.match(html,/data-ui-revision="native-navigation-20261107"/);
 assert.match(html,/uadav-profile-home-v2\.css\?v=20261107-native-navigation/);
});
