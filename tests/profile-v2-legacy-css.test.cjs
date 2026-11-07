const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const html=readFileSync(join(__dirname,'..','usuario.html'),'utf8');
const css=readFileSync(join(__dirname,'..','design/uadav-profile-home-v2.css'),'utf8');
const legacy=readFileSync(join(__dirname,'..','uadav-responsive-v120.css'),'utf8');
test('new visual styles are versioned and limited to usuario v2',()=>{
 assert.match(html,/class="uadav-ui-v2" data-ui-revision="native-navigation-20261107"/);
 assert.match(html,/uadav-profile-home-v2\.css\?v=20261107-native-navigation/);
 assert.match(css,/body\[data-page="usuario"\]\.uadav-ui-v2/);
});
test('compatibility layer explicitly overrides legacy important properties only for new profile',()=>{
 for(const frag of ['.wrap{padding:12px 12px calc(','.hero{display:flex!important','.hero h1{font-size:clamp(','.hero>.edit{width:44px!important','.grid{margin-top:0!important','#recent .item{flex:0 0 min(54vw,214px)!important;max-width:none!important}']){
   assert(css.includes(frag),frag);
 }
 assert.match(legacy,/body\[data-page="usuario"\] \.item\{flex:0 0 150px!important/);
 assert.match(css,/@media\(max-width:1024px\)/);
});
test('all existing account, artist, jobs and player hooks remain attached',()=>{
 for(const id of ['name','avatar','edit','photo','profileTasks','mis-trabajos','mi-artista','recent','profileSettings','linkedArtists','accountDevices','recoverAccount','profileJobLookup'])assert(html.includes('id="'+id+'"'),id);
 assert.match(html,/openRecent\(a\[Number\(el\.dataset\.i\)\]\)/);
});
