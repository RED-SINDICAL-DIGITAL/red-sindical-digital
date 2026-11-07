const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'..','usuario.html'),'utf8');
const css=readFileSync(join(__dirname,'..','design/uadav-profile-native-v3.css'),'utf8');
const js=readFileSync(join(__dirname,'..','design/uadav-profile-native-mount-v4.js'),'utf8');
const app=readFileSync(join(__dirname,'..','app.html'),'utf8');
function simulate(view='home',options={}){
 const listeners={};
 function container(extra={}){
   return {children:[],...extra,appendChild(e){if(e.parentNode){const prev=e.parentNode.children;prev.splice(prev.indexOf(e),1)}this.children.push(e);e.parentNode=this},insertBefore(e,next){if(e.parentNode){const prev=e.parentNode.children;prev.splice(prev.indexOf(e),1)}const i=this.children.indexOf(next);this.children.splice(i<0?this.children.length:i,0,e);e.parentNode=this}};
 }
 const sections={hero:{id:'hero'},tasks:{id:'profileTasks'},recent:{id:'recent'},notices:{id:'accountNotices'}};
 const header={hidden:true},heading={textContent:''},settings={open:false};
 const home={hidden:true},original=container({hidden:false,querySelector(selector){return selector==='.hero'?sections.hero:selector==='.profile-continue'?(options.noRecent?null:sections.recent):null}});
 const grid=container();
 original.appendChild(sections.hero);original.appendChild(grid);
 for(const x of [sections.tasks,sections.recent,sections.notices])grid.appendChild(x);
 const target=container();
 const body={dataset:{profileView:view},classList:{values:new Set(),contains(v){return this.values.has(v)},add(v){this.values.add(v)},remove(v){this.values.delete(v)}}};
 const document={body,readyState:'complete',title:'Mi Perfil',getElementById(id){
  return ({profileNativeHome:home,profileLegacyViews:original,nativeHomeSections:target,profileViewHeader:header,profileViewTitle:heading,profileSettings:settings,profileTasks:sections.tasks,accountNotices:options.noNotices?null:sections.notices})[id]||null;
 }};
 const window={addEventListener(name,fn){listeners[name]=fn}};
 const location={search:view==='home'?'':'?vista='+view,hash:''};
 vm.runInNewContext(js,{document,window,location,URLSearchParams,MutationObserver:undefined});
 return{home,original,target,body,document,sections,listeners,location,grid,header,heading,settings};
}

test('native home mounts only existing interactive nodes, without copying data or listeners',()=>{
 const x=simulate();assert.equal(x.home.hidden,false);assert.equal(x.original.hidden,true);
 assert.deepEqual(x.target.children.map(e=>e.id),['hero','profileTasks','recent','accountNotices']);
 assert.equal(x.body.dataset.profileMount,'profile-native-mount-v5');
 assert(x.body.classList.values.has('profile-native-mounted'));
});
test('optional notices never prevent mounting of actual home',()=>{
 const x=simulate('home',{noNotices:true});assert.equal(x.home.hidden,false);
 assert.deepEqual(x.target.children.map(e=>e.id),['hero','profileTasks','recent']);
});
test('artist, jobs and account subviews keep the original functional UI',()=>{
 for(const view of ['artista','trabajos','account']){const x=simulate(view);assert(x.home.hidden);assert.equal(x.original.hidden,false);assert.equal(x.target.children.length,0)}
});
test('missing essential content safely retains legacy UI',()=>{
 const x=simulate('home',{noRecent:true});assert.equal(x.home.hidden,true);assert.equal(x.original.hidden,false);
 assert.equal(x.body.dataset.profileMount,'missing-required-content');
});
test('mounted page supports pageshow without duplicating UI',()=>{
 const x=simulate();x.listeners.pageshow();assert.equal(x.target.children.length,4);assert.equal(x.original.hidden,true);
});
test('new mount loads independently and preserves CSS and account hookups',()=>{
 assert.match(html,/id="profileNativeInlineJS"/);
 assert.match(html,/id="profileNativeInlineCSS"/);
 assert(html.includes(js),'inline JS must match the maintained source');
 assert(html.includes(css),'inline CSS must match the maintained source');
 assert.match(html,/data-ui-revision="profile-native-v4-inline"/);
 assert.match(css,/#profileLegacyViews\[hidden\],#profileNativeHome\[hidden\]\{display:none!important\}/);
 for(const id of ['avatar','name','edit','profileTasks','recent','mi-artista','mis-trabajos','profileSettings','accountDevices','recoverAccount','profileJobLookup'])assert(html.includes('id="'+id+'"'),id);
 assert.match(html,/openRecent\(a\[Number\(el\.dataset\.i\)\]\)/);
 new vm.Script(js);
});
test('the PWA uses the canonical profile path with a fresh iframe revision',()=>{
 assert.match(app,/if\(p==='\/usuario'\|\|p==='\/usuario\/'\)p='\/usuario\.html'/);
 assert.match(app,/frameURL\.searchParams\.set\('rev',routePath\(to\)==='\/usuario\.html'/);
});

test('fragment navigation restores original live controls and remounts without clones',()=>{
 const x=simulate();
 x.location.hash='#profileSettings';
 x.listeners.hashchange();
 assert.equal(x.home.hidden,true);
 assert.equal(x.original.hidden,false);
 assert.equal(x.target.children.length,0);
 assert.deepEqual(x.grid.children.map(e=>e.id),['profileTasks','recent','accountNotices']);
 assert.equal(x.original.children[0],x.sections.hero);
 assert.equal(x.body.classList.contains('profile-native-mounted'),false);
 x.location.hash='';
 x.listeners.hashchange();
 assert.equal(x.home.hidden,false);
 assert.equal(x.original.hidden,true);
 assert.deepEqual(x.target.children.map(e=>e.id),['hero','profileTasks','recent','accountNotices']);
});
test('history navigation to account view and back preserves interactive node identity',()=>{
 const x=simulate();
 x.location.search='?vista=cuenta';
 x.listeners.popstate();
 assert.equal(x.target.children.length,0);
 assert.equal(x.original.hidden,false);
 x.location.search='';
 x.listeners.popstate();
 assert.equal(x.target.children[0],x.sections.hero);
 assert.equal(x.target.children[1],x.sections.tasks);
 assert.equal(x.original.hidden,true);
});

test('history-driven account heading and settings restore and clear when returning home',()=>{
 const x=simulate();
 assert.equal(x.header.hidden,true);
 x.location.search='?vista=cuenta';
 x.listeners.popstate();
 assert.equal(x.header.hidden,false);
 assert.equal(x.heading.textContent,'Cuenta y seguridad');
 assert.equal(x.settings.open,true);
 assert.equal(x.body.dataset.profileView,'account');
 x.location.search='';
 x.listeners.popstate();
 assert.equal(x.header.hidden,true);
 assert.equal(x.body.dataset.profileView,'home');
 assert.equal(x.document.title,'Mi espacio · UADAV STREAM');
});
