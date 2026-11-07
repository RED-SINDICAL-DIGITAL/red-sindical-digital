const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','usuario.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','design/uadav-profile-native-v3.css'),'utf8');
const match=html.match(/<script>\s*\/\* Isolated home mount:[\s\S]*?<\/script>/);
assert(match,'Isolated home mount script is required');
const script=match[0].replace(/^<script>/,'').replace(/<\/script>$/,'');
function simulate(view,missing=false){
 const sections={hero:{id:'hero'},tasks:{id:'profileTasks'},continue:{id:'continue'},notices:{id:'accountNotices'}};
 const home={hidden:true},orig={hidden:false,querySelector(selector){return selector===':scope > .hero'?sections.hero:selector==='.profile-continue'?(missing?null:sections.continue):null}};
 const target={children:[],appendChild(n){this.children.push(n)}},body={dataset:{profileView:view},classList:{set:new Set(),add(s){this.set.add(s)}}};
 const document={body,title:'Mi Perfil',getElementById(id){return ({profileNativeHome:home,profileLegacyViews:orig,nativeHomeSections:target,profileTasks:sections.tasks,accountNotices:sections.notices})[id]||null}};
 vm.runInNewContext(script,{document});
 return{home,orig,target,body,document,sections};
}
test('home moves the existing actual profile nodes into its own layout exactly once',()=>{
 const x=simulate('home');assert.equal(x.home.hidden,false);assert.equal(x.orig.hidden,true);
 assert.deepEqual(x.target.children.map(c=>c.id),['hero','profileTasks','continue','accountNotices']);
 assert(x.body.classList.set.has('profile-native-mounted'));
});
test('artist, jobs, account subviews keep legacy functional DOM undisturbed',()=>{
 for(const view of ['artista','trabajos','account']){
   const x=simulate(view);assert.equal(x.home.hidden,true);assert.equal(x.orig.hidden,false);assert.equal(x.target.children.length,0);
 }
});
test('mount failure is safe and never discards forms or personal data',()=>{
 const x=simulate('home',true);assert.equal(x.home.hidden,true);assert.equal(x.orig.hidden,false);assert.equal(x.target.children.length,0);
});
test('native home visual layout is completely isolated and visibly different',()=>{
 assert.match(html,/id="profileNativeHome" class="profile-native-home" hidden/);
 assert.match(html,/id="profileLegacyViews"/);
 assert.match(html,/uadav-profile-native-v3\.css\?v=20261107-shell-new/);
 assert.match(css,/#profileLegacyViews\[hidden\],#profileNativeHome\[hidden\]\{display:none!important\}/);
 assert.match(css,/#profileNativeHome #profileTasks \.profile-tasks\{display:flex!important;flex-direction:column!important/);
 assert.match(css,/#profileNativeHome #profileTasks \.profile-task\{display:grid!important;grid-template-columns:48px minmax\(0,1fr\) 20px!important/);
 assert.match(css,/@media\(min-width:960px\)/);
});
test('critical account, artist, job, and player IDs and event hooks are retained',()=>{
 for(const id of ['avatar','name','photo','edit','profileTasks','recent','mis-trabajos','mi-artista','linkedArtists','profileJobLookup','profileSettings','accountDevices','recoverAccount']){
  assert(html.includes('id="'+id+'"'),id);
 }
 assert.match(html,/openRecent\(a\[Number\(el\.dataset\.i\)\]\)/);
});
test('new mount script parses',()=>new vm.Script(script));

const app=fs.readFileSync(path.join(__dirname,'..','app.html'),'utf8');
test('the host PWA iframe uses a new revision for Mi Perfil only',()=>{
 assert.match(app,/frameURL\.searchParams\.set\('rev',routePath\(to\)==='\/usuario\.html'\?'profile-native-shell-routefix-20261107':'12059'\)/);
});

test('PWA canonicalizes /usuario alias before deciding iframe version',()=>{
 const marker="function clean(h){",start=app.indexOf(marker),end=app.indexOf('function routePath(v)',start);
 assert(start>0&&end>start);
 const code=app.slice(start,end);
 const context={location:{origin:'https://uadav-stream-staging.pages.dev'},URL,HOME:'/descubrir.html'};
 vm.runInNewContext(code,context);
 assert.equal(context.clean('/usuario'),'/usuario.html');
 assert.equal(context.clean('/usuario/'),'/usuario.html');
 assert.equal(context.clean('/usuario?vista=artista'),'/usuario.html?vista=artista');
 assert.equal(context.clean('/usuario.html?vista=cuenta'),'/usuario.html?vista=cuenta');
 assert.equal(context.clean('/cartelera.html'),'/cartelera.html');
});
