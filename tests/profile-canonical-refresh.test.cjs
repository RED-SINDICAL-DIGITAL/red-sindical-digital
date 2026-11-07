const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const source=readFileSync(join(__dirname,'..','uadav-account-ui.js'),'utf8');
function fixture(){
 const events={},nodes=new Map(),timers=new Map();
 let refreshCount=0,paintCount=0;
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,textContent:'',isConnected:true,value:'',addEventListener(){},after(){},showModal(){},close(){},replaceChildren(){}});return nodes.get(id)}
 const state={message:'Sincronizado',linked:true,conflict:false};
 const win={UADAVAccount:{state:()=>state},addEventListener:(type,fn)=>{events[type]=fn}};
 win.parent=win;
 const context={window:win,document:{getElementById:node,createElement:()=>({})},fetch:async()=>({ok:true,json:async()=>({build:'11770',d1:true})}),AbortController,setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},navigator:{},location:{origin:'https://uadav-stream-staging.pages.dev'},console,refreshProfileView:()=>{refreshCount++},paint:()=>{paintCount++}};
 vm.runInNewContext(source,context);
 return{events,node,state,refreshCount:()=>refreshCount,paintCount:()=>paintCount};
}
test('account event delegates rendering to canonical normalized profile view',()=>{
 const x=fixture();x.events['uadav:account-data']();assert.equal(x.refreshCount(),1);assert.equal(x.paintCount(),0);assert.equal(x.node('syncStatus').textContent,'Sincronizado');
});
test('unrelated localStorage updates do not repaint Mi Perfil',()=>{
 const x=fixture();x.events.storage({key:'other-app-cache'});assert.equal(x.refreshCount(),0);
 x.events.storage({key:'uadav_user_v11'});assert.equal(x.refreshCount(),1);
 x.events.storage({key:'uadav_account_access_v1'});assert.equal(x.refreshCount(),2);
});
test('clear storage requests a canonical profile refresh',()=>{
 const x=fixture();x.events.storage({key:null});assert.equal(x.refreshCount(),1);
});

const profileHTML=readFileSync(join(__dirname,'..','usuario.html'),'utf8');
test('Mi Perfil explains managed artist identity before job applications',()=>{
 assert.match(profileHTML,/Tu cuenta personal y un perfil artístico administrado son distintos/);
 assert.match(profileHTML,/Postularte sin artista también está permitido/);
});
test('local deletion clearly excludes library and saved job records',()=>{
 assert.match(profileHTML,/Borrar mi perfil local e historial reciente/);
 assert.match(profileHTML,/No elimina favoritos, playlists, la cuenta sincronizada ni gestiones guardadas/);
 assert.match(profileHTML,/Tus favoritos, playlists y gestiones no se eliminan/);
});
test('saved job and private receipt paths are distinguished',()=>{
 assert.match(profileHTML,/Las gestiones guardadas en tu cuenta aparecen acá automáticamente/);
 assert.match(profileHTML,/Consultar comprobante \(\.txt\)/);
});
