const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const root=join(__dirname,'..');
const js=readFileSync(join(root,'uadav-event-local-receipts.js'),'utf8');
const publish=readFileSync(join(root,'publicar-evento.html'),'utf8');
const profile=readFileSync(join(root,'usuario.html'),'utf8');
function setup(withStorage=true){
 const m=new Map(),events=[],w={};
 if(withStorage)w.localStorage={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};
 w.dispatchEvent=e=>events.push(e.type);
 vm.runInNewContext(js,{window:w,CustomEvent:class{constructor(type){this.type=type}},Date,JSON,Set,Number,Array,String,Object});
 return {api:w.UADAVLocalEventReceipts,store:m,events};
}
test('only valid published public IDs can be persisted',()=>{
 const x=setup();
 assert.equal(x.api.save({id:'EV-D98A8A70-98CC-4300-B861-E214803B6E79',title:'Concierto'}),true);
 assert.equal(x.api.list()[0].title,'Concierto');
 assert.equal(x.api.save({id:'../admin?token=123',title:'Unsafe'}),false);
 assert.equal(x.api.list().length,1);
 assert.equal(x.api.remove('../admin'),false);
});
test('deduplicates references, enforces cap and never writes private keys',()=>{
 const x=setup();
 for(let i=0;i<40;i++)x.api.save({id:'EV-'+i,title:'Evento '+i,private_token:'SECRET'});
 assert.equal(x.api.list().length,30);
 assert.equal(x.api.list()[0].id,'EV-39');
 assert(![...x.store.values()].join('').includes('SECRET'));
 assert.equal(x.api.save({id:'EV-20',title:'Nuevo título'}),true);
 assert.equal(x.api.list().filter(e=>e.id==='EV-20').length,1);
 assert.equal(x.api.remove('EV-20'),true);
 assert.equal(x.api.list().some(e=>e.id==='EV-20'),false);
});
test('malformed storage and disabled storage fail safely',()=>{
 const x=setup();x.store.set('uadav_event_public_receipts_local_v1','invalid json');assert.equal(x.api.list().length,0);
 const y=setup(false);assert.equal(y.api.save({id:'EV-OK'}),false);assert.equal(y.api.list().length,0);
});
test('publisher saves only after acknowledged publication or receipt confirmation',()=>{
 assert.match(publish,/if\(!d\.moderation_pending\)window\.UADAVLocalEventReceipts\?\.save\(\{id:d\.id,title:body\.titulo\}\)/);
 assert.match(publish,/if\(result\.confirmed!==true\|\|typeof result\.id!=='string'/);
 assert.match(publish,/window\.UADAVLocalEventReceipts\?\.save\(\{id:result\.id,title:body\.titulo\}\)/);
 assert.match(publish,/uadav-event-local-receipts\.js\?v=20261107/);
});
test('Mi Perfil presents only local references and never owner controls',()=>{
 const section=profile.split('id="mis-eventos"')[1].split('</section><section class="panel wide" id="radioStudioEntry"')[0];
 assert.match(section,/Publicados desde este dispositivo/);
 assert.match(section,/No demuestra quién es el propietario/);
 assert.match(profile,/id="profileLocalEventsScript"/);
 assert.match(profile,/Quitar de este equipo/);
 assert.match(profile,/El evento seguirá publicado/);
 assert(!section.includes('Administrar evento sin verificar'));
 assert(!section.includes('Eliminar publicación'));
});
test('HTML inline scripts parse and do not duplicate account/auth stores',()=>{
 for(const html of [publish,profile]){
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 }
 assert(!js.includes('uadav_account_access_v1'));
 assert(!js.includes('Authorization'));
});
