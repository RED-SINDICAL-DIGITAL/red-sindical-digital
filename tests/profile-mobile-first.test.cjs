const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'..','usuario.html'),'utf8');
const routeMatch=html.match(/<script>\s*\/\* One canonical profile:[\s\S]*?<\/script>/);
assert(routeMatch,'missing account view router');
const route=routeMatch[0].replace(/^<script>/,'').replace(/<\/script>$/,'');
function navigate(search,hash=''){
 const settings={open:false},body={dataset:{}},loc={search,hash};const context={window:{},document:{body,title:'Mi Perfil',getElementById:id=>id==='profileSettings'?settings:null},location:loc,URLSearchParams};
 vm.runInNewContext(route,context);return{settings,body,title:context.document.title};
}
test('main profile is compact and exposes common actions without opening security',()=>{
 const x=navigate('');assert.equal(x.body.dataset.profileView,'home');assert.equal(x.settings.open,false);
 for(const label of ['Mis trabajos','Mi artista','Favoritos','Publicar evento','Publicar oferta','Explorar artistas']){
   assert(html.includes(label),label);
 }
 assert.match(html,/body\[data-page="usuario"\]\[data-profile-view="home"\] \.profile-settings\{display:none\}/);
});
test('account security view uses the same recovery and device controls',()=>{
 const x=navigate('?vista=cuenta');assert.equal(x.body.dataset.profileView,'account');assert.equal(x.settings.open,true);
 assert.match(x.title,/Cuenta y seguridad/);
 for(const id of ['showRecovery','recoverAccount','accountDevices','syncNow','unlinkAccount','deleteAccount','profileSettings']){
   assert(html.includes('id="'+id+'"'),id);
 }
 assert.match(html,/href="\/usuario\.html" class="profile-back"/);
 assert.match(html,/href="\/usuario\.html\?vista=cuenta"/);
});
test('legacy deep link to settings still opens security mode',()=>{
 const x=navigate('','#profileSettings');assert.equal(x.body.dataset.profileView,'account');assert.equal(x.settings.open,true);
});
test('mobile first actions fit in compact 2 by 2 grid',()=>{
 assert.match(html,/#profileTasks \.profile-task\{min-height:94px;padding:11px 12px/);
 assert.match(html,/#profileTasks \.profile-tasks\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(html,/\.wrap\{padding:9px 12px calc\(125px \+ env\(safe-area-inset-bottom\)\)\}/);
});
test('jobs, artist, notices, radio and Netflix-style continue rail retain IDs and playback',()=>{
 const ids=['mis-trabajos','mi-artista','accountNotices','radioStudioEntry','recent'];
 for(const id of ids)assert(html.includes('id="'+id+'"'),id);
 assert.match(html,/el\.onclick=\(\)=>openRecent\(a\[Number\(el\.dataset\.i\)\]\)/);
 const p=id=>html.indexOf('id="'+id+'"');
 assert(p('recent')<p('mis-trabajos')&&p('mis-trabajos')<p('mi-artista')&&p('mi-artista')<p('radioStudioEntry'));
});
test('all inline scripts still parse',()=>{
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
});
