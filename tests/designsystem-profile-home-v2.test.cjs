const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const fs=name=>readFileSync(join(__dirname,'..',name),'utf8');
const html=fs('usuario.html'),tokens=fs('design/uadav-ui-tokens-v2.css'),base=fs('design/uadav-ui-components-v2.css'),profile=fs('design/uadav-profile-home-v2.css');

test('design system is opt-in and only linked by Mi Perfil',()=>{
 assert.match(html,/body data-page="usuario" class="uadav-ui-v2"/);
 for(const name of ['uadav-ui-tokens-v2.css','uadav-ui-components-v2.css','uadav-profile-home-v2.css'])assert(html.includes('/design/'+name));
 assert.match(base,/body\.uadav-ui-v2/);
 assert.match(profile,/body\[data-page="usuario"\]\.uadav-ui-v2/);
 assert.doesNotMatch(profile,/(^|\n)\s*(body|html|\.panel|\.hero)\s*\{/);
});
test('blue cyan tokens match approved mobile visual reference',()=>{
 for(const [token,value] of [['--u-bg','#050A13'],['--u-cyan','#12BCF5'],['--u-blue','#176FF2'],['--u-glass','rgba(11,29,49,.76)']]){
   assert(tokens.includes(token+': '+value),token);
 }
});
test('mobile-first actions are compact, legible and keep current business navigation',()=>{
 assert.match(profile,/#profileTasks \.profile-tasks\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(profile,/#profileTasks \.profile-task\{min-width:0;min-height:83px/);
 for(const action of ['href="/usuario.html?vista=trabajos"','href="/usuario.html?vista=artista"','href="/biblioteca.html"','href="/publicar-evento.html"','href="/usuario.html?vista=cuenta"'])assert(html.includes(action),action);
});
test('all private modules, account scripts and real playback hooks remain intact',()=>{
 for(const id of ['avatar','photo','name','edit','mis-trabajos','mi-artista','recent','profileSettings','accountDevices','recoverAccount','profileJobLookup','linkedArtists'])assert(html.includes('id="'+id+'"'),id);
 assert.match(html,/el\.onclick=\(\)=>openRecent\(a\[Number\(el\.dataset\.i\)\]\)/);
 assert.match(html,/uadav-account-sync\.js/);
 assert.match(html,/uadav-jobs-account\.js/);
});
test('mobile viewport and safe-area offsets are explicitly handled',()=>{
 assert.match(html,/width=device-width,initial-scale=1/);
 assert.match(profile,/safe-area-inset-bottom/);
 assert.match(profile,/@media\(min-width:768px\)/);
 assert.match(profile,/@media\(prefers-reduced-transparency:reduce\)/);
});
