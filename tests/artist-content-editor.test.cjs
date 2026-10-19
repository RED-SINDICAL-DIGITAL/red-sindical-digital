const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync(new URL('../gestionar-artista.html','file://'+__filename),'utf8');
function setup(){
 const handlers={},fields=[{disabled:false},{disabled:true}],status={},cancel={hidden:true},box={isConnected:true,querySelectorAll:()=>[]};
 const form={isConnected:true,resets:0,entries:[['id',''],['titulo','QA'],['url','https://example.org/media.mp4']],elements:{},addEventListener:(n,f)=>handlers[n]=f,querySelectorAll:()=>fields,reset(){this.resets++},scrollIntoView(){}};
 const nodes={contentForm:form,contentStatus:status,cancelContentEdit:cancel,contentList:box},pending=[],storage=new Map([['uadav_account_access_v1','account-A']]);
 const c={document:{getElementById:id=>nodes[id]},localStorage:{getItem:k=>storage.get(k)||null},artist:{id:'ART-A'},token:'test-session',profileDirty:false,FormData:class{constructor(f){return f.entries[Symbol.iterator]()}},artistContentFetch:opt=>new Promise((resolve,reject)=>pending.push({opt,resolve,reject})),loadContent:()=>{c.reloads++},reloads:0};
 vm.createContext(c);vm.runInContext(html.slice(html.indexOf('function bindContentEditor('),html.indexOf('let contentLoadTurn='))+';this.bind=bindContentEditor',c);c.bind(form);
 return {c,form,fields,status,cancel,box,nodes,handlers,pending,storage};
}
const event={preventDefault(){}};
test('duplicate submission sends once, blocks controls and restores previous disabled states',async()=>{
 const h=setup();h.handlers.input();const first=h.form.onsubmit(event);await h.form.onsubmit(event);assert.equal(h.pending.length,1);assert.equal(h.fields[0].disabled,true);h.pending[0].resolve({});await first;
 assert.equal(h.form.resets,1);assert.equal(h.c.profileDirty,false);assert.equal(h.c.reloads,1);assert.deepEqual(h.fields.map(x=>x.disabled),[false,true]);assert.match(h.status.textContent,/enviado a revisión/);
});
test('failed send preserves fields and dirty state and allows intentional retry',async()=>{
 const h=setup();h.handlers.input();const first=h.form.onsubmit(event);h.pending[0].reject(Error('Sin conexión'));await first;assert.equal(h.form.resets,0);assert.equal(h.c.profileDirty,true);assert.equal(h.fields[0].disabled,false);
 const retry=h.form.onsubmit(event);assert.equal(h.pending.length,2);h.pending[1].resolve({});await retry;assert.equal(h.form.resets,1);
});
test('account switch, artist switch or detached form rejects late completion',async()=>{
 for(const mode of ['account','artist','form']){const h=setup(),first=h.form.onsubmit(event);if(mode==='account')h.storage.set('uadav_account_access_v1','account-B');if(mode==='artist')h.c.artist={id:'ART-B'};if(mode==='form')h.nodes.contentForm={};h.status.textContent='New view';h.pending[0].resolve({});await first;assert.equal(h.status.textContent,'New view');assert.equal(h.form.resets,0);assert.equal(h.c.reloads,0)}
});
test('cancel edit resets only current idle form and clears dirty state',async()=>{
 const h=setup();h.handlers.input();h.cancel.hidden=false;h.cancel.onclick();assert.equal(h.form.resets,1);assert.equal(h.c.profileDirty,false);assert.equal(h.cancel.hidden,true);
 const first=h.form.onsubmit(event);h.cancel.onclick();assert.equal(h.form.resets,1);h.pending[0].resolve({});await first;
});
test('late content list cannot overwrite newer list or another account',async()=>{
 const h=setup();h.c.esc=v=>String(v??'');h.c.myContent=[];vm.runInContext(html.slice(html.indexOf('let contentLoadTurn='),html.indexOf('function inlineForm'))+';this.loadList=loadContent',h.c);
 const first=h.c.loadList(),second=h.c.loadList();h.pending[1].resolve([]);await second;h.pending[0].resolve([{id:'old',titulo:'OLD'}]);await first;assert.equal(h.c.myContent.length,0);assert.doesNotMatch(h.box.innerHTML,/OLD/);
 const third=h.c.loadList();h.storage.set('uadav_account_access_v1','account-B');h.pending[2].reject(Error('OLD ERROR'));await third;assert.notEqual(h.box.textContent,'OLD ERROR');
});
test('invalid successful content response is reported without corrupting existing data',async()=>{
 const h=setup();h.c.esc=String;h.c.myContent=[{id:'kept'}];vm.runInContext(html.slice(html.indexOf('let contentLoadTurn='),html.indexOf('function inlineForm'))+';this.loadList=loadContent',h.c);
 const task=h.c.loadList();h.pending[0].resolve({items:'invalid'});await task;assert.equal(h.c.myContent[0].id,'kept');assert.match(h.box.textContent,/No pudimos leer/);
});
