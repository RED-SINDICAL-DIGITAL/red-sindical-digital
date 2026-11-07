const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','usuario.html'),'utf8');
const at=html.lastIndexOf('<script>\n/* Progressive disclosure:');
const end=html.indexOf('</script>',at);
assert(at>0&&end>at);
const source=html.slice(at+8,end);

test('Mi Perfil keeps all business-critical hooks and private account controls',()=>{
 for(const id of ['profileTasks','mis-trabajos','mi-artista','linkedArtists','profileJobLookup','profileJobImportBtn','recent','librarySummary','profileSettings','createAccount','accountDevices','showRecovery','recoverAccount','profileForm','photo','avatar','deleteAccount','clear']){
  assert.match(html,new RegExp('id="'+id+'"'),id);
 }
 assert.match(html,/href="\/entrar-correo\.html"|uadav-profile-email\.js/);
 assert.match(html,/uadav-account-sync\.js/);
 assert.match(html,/uadav-jobs-account\.js/);
});
test('simple hero has four clear primary choices and concise secondary actions',()=>{
 const section=html.split('<section class="panel wide" id="profileTasks"')[1].split('</section>')[0];
 assert.equal((section.match(/class="profile-task"/g)||[]).length,4);
 for(const label of ['Mis trabajos','Mi artista','Favoritos','Publicar evento','Cuenta y seguridad','Ayuda'])assert(section.includes(label),label);
 assert.doesNotMatch(section,/Elegí qué querés hacer/);
});
test('mobile layout uses compact two-column actions and full-width shortcuts',()=>{
 assert.match(html,/#profileTasks \.profile-tasks\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(html,/\.profile-shortcuts\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
test('collapsible sections open with task links and keep their IDs and contents',()=>{
 const changes={};
 function panel(id){const tokens=new Set(),button={textContent:'',attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,v){this.click=v}},heading={textContent:id,insertAdjacentElement(where,el){this.button=el}},x={id,button,heading,classList:{add:v=>tokens.add(v),contains:v=>tokens.has(v),toggle(v,force){if(force)tokens.add(v);else tokens.delete(v)}},querySelector:q=>q==='h2'?heading:q==='.profile-fold-toggle'?button:null};changes[id]=x;return x}
 const parts={'mis-trabajos':panel('mis-trabajos'),'mi-artista':panel('mi-artista')};const handlers={},links=[{getAttribute:()=> '#mis-trabajos',addEventListener(k,f){this.onclick=f}}];
 const context={location:{hash:''},document:{getElementById:id=>parts[id]||null,createElement:()=>({setAttribute(){},addEventListener(k,f){this.onclick=f}}),querySelectorAll:()=>links},window:{addEventListener(k,f){handlers[k]=f}},decodeURIComponent};
 vm.runInNewContext(source,context);
 assert.equal(parts['mis-trabajos'].classList.contains('is-collapsed'),true);
 links[0].onclick();
 assert.equal(parts['mis-trabajos'].classList.contains('is-collapsed'),false);
 context.location.hash='#mi-artista';handlers.hashchange();
 assert.equal(parts['mi-artista'].classList.contains('is-collapsed'),false);
});
