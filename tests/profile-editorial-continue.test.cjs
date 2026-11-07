const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','usuario.html'),'utf8');
test('profile preserves its functional account and management anchors',()=>{
 for(const id of ['name','avatar','edit','photo','profileTasks','mis-trabajos','mi-artista','linkedArtists','recent','recentStatus','librarySummary','profileSettings','createAccount','showRecovery','accountDevices','profileJobLookup','profileJobImportBtn','deleteAccount']){
  assert.match(html,new RegExp('id="'+id+'"'),id);
 }
 assert.match(html,/uadav-account-sync\.js/);
 assert.match(html,/uadav-jobs-account\.js/);
 assert.match(html,/uadav-profile-email\.js/);
});
test('continue watching rail has a real playback action and no invented progress',()=>{
 assert.match(html,/id="continueTitle">Seguir viendo y escuchando/);
 assert.match(html,/id="recent" class="rail" aria-label="Contenido reciente, desplazamiento horizontal"/);
 assert.match(html,/class="profile-cover"/);
 assert.match(html,/class="profile-play"/);
 assert.match(html,/el\.onclick=\(\)=>openRecent\(a\[Number\(el\.dataset\.i\)\]\)/);
 assert.doesNotMatch(html,/class="profile-progress"/);
});
test('mobile cards remain landscape and scroll horizontally',()=>{
 assert.match(html,/#recent\.rail\{display:flex;gap:13px;overflow-x:auto/);
 assert.match(html,/scroll-snap-type:x proximity/);
 assert.match(html,/aspect-ratio:16\/9/);
 assert.match(html,/#recent \.item\{flex-basis:min\(57vw,220px\)\}/);
});
test('music-app profile hero remains accessible and exposes account actions',()=>{
 assert.match(html,/class="profile-identity"/);
 assert.match(html,/aria-label="Cambiar foto de perfil"/);
 assert.match(html,/aria-label="Editar perfil"/);
 assert.match(html,/href="/usuario.html?vista=cuenta"[\s\S]*?<span>Cuenta y seguridad<\/span>/);
});
test('all inline scripts retain valid JavaScript syntax',()=>{
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
   new vm.Script(match[1]);
 }
});
