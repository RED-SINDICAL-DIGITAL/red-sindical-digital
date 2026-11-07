const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'..','usuario.html'),'utf8');
const css=readFileSync(join(__dirname,'..','design/uadav-profile-home-v2.css'),'utf8');
const script=html.match(/<script>\s*\/\* One canonical profile:[\s\S]*?<\/script>/);
assert(script);
const route=script[0].replace(/^<script>/,'').replace(/<\/script>$/,'');
function simulate(search,hash=''){
 let expanded='none';const toggle={textContent:'Mostrar',setAttribute(k,v){expanded=k+':'+v}},panel={classList:{state:new Set(['is-collapsed']),contains(k){return this.state.has(k)},remove(k){this.state.delete(k)}},querySelector:()=>toggle};
 const settings={open:false},header={hidden:true},title={textContent:''},body={dataset:{}},document={title:'Mi perfil',body,getElementById:id=>({profileSettings:settings,profileViewHeader:header,profileViewTitle:title,'mis-trabajos':panel,'mi-artista':panel})[id]||null};
 vm.runInNewContext(route,{document,location:{search,hash},URLSearchParams});
 return {body,header,title,settings,panel,toggle,document,expanded};
}
test('home hides management panels; no duplicate long HTML on first screen',()=>{
 const a=simulate('');assert.equal(a.body.dataset.profileView,'home');assert.equal(a.header.hidden,true);
 for(const id of ['#mis-trabajos','#mi-artista','#radioStudioEntry','.profile-library-details','.profile-settings'])assert(css.includes('[data-profile-view="home"] '+id),id);
 assert.match(html,/href="\/usuario\.html\?vista=trabajos"/);
 assert.match(html,/href="\/usuario\.html\?vista=artista"/);
});
test('jobs subview opens its own content and provides back navigation',()=>{
 const a=simulate('?vista=trabajos');assert.equal(a.body.dataset.profileView,'trabajos');assert.equal(a.header.hidden,false);assert.equal(a.title.textContent,'Mis trabajos');assert.equal(a.panel.classList.contains('is-collapsed'),false);
 assert.match(css,/\[data-profile-view="trabajos"\] \.grid>:not\(#mis-trabajos\)/);
 assert.match(html,/href="\/usuario\.html" aria-label="Volver a Mi Perfil"/);
});
test('artist subview shows only artist management and retains auth hooks',()=>{
 const a=simulate('?vista=artista');assert.equal(a.body.dataset.profileView,'artista');assert.equal(a.title.textContent,'Mi artista');assert.equal(a.panel.classList.contains('is-collapsed'),false);
 assert.match(css,/\[data-profile-view="artista"\] \.grid>:not\(#mi-artista\)/);
 for(const id of ['linkedArtists','artistProfile','artistAccessRetry','artistInquiries','artistKit'])assert(html.includes('id="'+id+'"'),id);
});
test('account security keeps old route, existing auth code and recovery',()=>{
 for(const arg of [['?vista=cuenta',''],['','#profileSettings']]){
  const a=simulate(...arg);assert.equal(a.body.dataset.profileView,'account');assert.equal(a.settings.open,true);
 }
 for(const id of ['accountDevices','showRecovery','recoverAccount','syncStatus','deleteAccount'])assert(html.includes('id="'+id+'"'),id);
});
test('legacy artist and jobs deep links still work',()=>{
 assert.equal(simulate('','#mis-trabajos').body.dataset.profileView,'trabajos');
 assert.equal(simulate('','#mi-artista').body.dataset.profileView,'artista');
});
test('malformed route never reveals sensitive view',()=>{
 assert.equal(simulate('?vista=unknown').body.dataset.profileView,'home');
});
