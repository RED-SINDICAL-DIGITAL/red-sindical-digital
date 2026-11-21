const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../uadav-account-ui.js'),'utf8');
function setup(fetch){
 const nodes=new Map(),timers=new Map();let serial=0,connects=0;
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',events:{},isConnected:false,addEventListener(k,fn){this.events[k]=fn},after(n){n.isConnected=true;nodes.set(n.id,n)},showModal(){this.open=true},close(){this.open=false;this.events.close?.()},replaceChildren(){},appendChild(){},select(){}});return nodes.get(id)}
 const service={state:()=>({linked:false,conflict:false,message:'Guardado en este dispositivo'}),recovery:()=>'',connect:async()=>{connects++}};
 const window={UADAVAccount:service,UADAV_API_BASE:'https://isolated.example/api/',addEventListener(){}};window.parent=window;
 vm.runInNewContext(source,{window,document:{getElementById:node,createElement:()=>({})},fetch,AbortController,setTimeout:fn=>{timers.set(++serial,fn);return serial},clearTimeout:id=>timers.delete(id),clearInterval(){},setInterval(){},location:{origin:'https://isolated.example'},navigator:{},console});
 return {node,timers,connects:()=>connects};
}
const health=(ok=true,body={build:'11753',d1:true})=>({ok,json:async()=>body});
const settle=()=>new Promise(setImmediate);
test('failed health check offers retry and enables account controls only after verified success',async()=>{
 let calls=0;const h=setup(async()=>{if(++calls===1)throw Error('Conexión interrumpida');return health()});await settle();
 assert.equal(h.node('createAccount').disabled,true);assert.equal(h.node('retryAccountHealth').hidden,false);
 await h.node('retryAccountHealth').onclick();assert.equal(h.node('createAccount').disabled,false);assert.equal(h.node('retryAccountHealth').hidden,true);assert.equal(calls,2);
});
test('HTTP error with a healthy-looking body cannot enable account actions',async()=>{
 const h=setup(async()=>health(false));await settle();assert.equal(h.node('createAccount').disabled,true);assert.equal(h.node('retryAccountHealth').hidden,false);
});
test('health timeout aborts request and exposes an actionable retry without changing account data',async()=>{
 const h=setup((url,opt)=>new Promise((resolve,reject)=>opt.signal.addEventListener('abort',()=>reject(Object.assign(Error('timeout'),{name:'AbortError'})))));
 assert.equal(h.timers.size,1);[...h.timers.values()][0]();await settle();assert.match(h.node('syncStatus').textContent,/tardó demasiado/);assert.equal(h.node('retryAccountHealth').hidden,false);assert.equal(h.timers.size,0);
});
test('pending health retry cannot issue overlapping requests',async()=>{
 let complete,calls=0;const h=setup(()=>{calls++;return new Promise(resolve=>complete=resolve)});await h.node('retryAccountHealth').onclick();assert.equal(calls,1);complete(health());await settle();assert.equal(h.node('createAccount').disabled,false);
});
test('unsupported backend leaves controls disabled and permits checking again',async()=>{
 const h=setup(async()=>health(true,{build:'11753',d1:false}));await settle();assert.equal(h.node('accountDevices').disabled,true);assert.equal(h.node('retryAccountHealth').hidden,false);assert.match(h.node('syncStatus').textContent,/sincronización todavía/);
});
test('closing recovery clears residual input and format validation explains the correct backup',async()=>{
 const h=setup(async()=>health());await settle();h.node('recoverAccount').onclick();assert.match(h.node('recoveryHelp').textContent,/No es la clave del Admin/);
 h.node('recoveryCode').value='not-a-recovery-code';await h.node('applyRecovery').onclick();assert.equal(h.connects(),0);assert.match(h.node('recoveryStatus').textContent,/respaldo completo/);
 h.node('closeRecovery').onclick();assert.equal(h.node('recoveryCode').value,'');assert.equal(h.node('recoveryStatus').textContent,'');
});
