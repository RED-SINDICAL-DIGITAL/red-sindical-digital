const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(new URL('../uadav-artist-inquiries-v130.js','file://'+__filename),'utf8');
function harness(){
 const pending=[],observers=[],listeners=new Set(),storage=new Map([['uadav_account_access_v1','A']]);
 function element(){let html='';return{value:'',disabled:false,textContent:'',selects:[],set innerHTML(v){html=v;this.selects=[...v.matchAll(/<select data-id="([^"]+)"/g)].map(m=>({dataset:{id:m[1]},value:'pendiente',disabled:false}))},get innerHTML(){return html},replaceChildren(){this.innerHTML=''},querySelectorAll(){return this.selects},appendChild(){}}}
 const host={isConnected:true,nodes:{},set innerHTML(v){this.nodes={};for(const id of ['inquiryStatus','inquiryList','inquirySearch','inquiryFilter','inquiryRefresh','inquirySummary'])this.nodes[id]=element();this.nodes.inquiryFilter.value='all'},querySelector(s){return this.nodes[s.slice(1)]}};
 const c={localStorage:{getItem:k=>storage.get(k)||null},AbortController,setTimeout,clearTimeout,document:{createElement:element},MutationObserver:class{constructor(fn){this.fn=fn;this.off=false;observers.push(this)}observe(){}disconnect(){this.off=true}},addEventListener(name,fn,options){const entry={name,fn};listeners.add(entry);options.signal.addEventListener('abort',()=>listeners.delete(entry),{once:true})},fetch:(url,options)=>new Promise((resolve,reject)=>pending.push({url,options,resolve,reject}))};
 vm.createContext(c);vm.runInContext(source,c);
 return{c,host,pending,observers,listeners,storage,mount:()=>c.UADAVArtistInquiries.mount(host,'synthetic-artist-token'),nodes:()=>host.nodes,leave(){host.nodes={};for(const o of observers)if(!o.off)o.fn()}};
}
const item=(id='QA',name='Private client')=>({id,nombre:name,estado:'pendiente',evento:'Synthetic event'});
const response=items=>({ok:true,json:async()=>({items})});
test('remount aborts older load and late response cannot overwrite the new inbox',async()=>{
 const h=harness(),first=h.mount(),old=h.nodes(),second=h.mount(),fresh=h.nodes();assert.equal(h.pending[0].options.signal.aborted,true);assert.equal(h.observers[0].off,true);assert.equal(h.listeners.size,2);
 h.pending[1].resolve(response([item('NEW','NEW CLIENT')]));await second;
 h.pending[0].resolve(response([item('OLD','OLD CLIENT')]));await first;
 assert.match(fresh.inquiryList.innerHTML,/NEW CLIENT/);assert.doesNotMatch(fresh.inquiryList.innerHTML,/OLD CLIENT/);assert.notEqual(old,fresh);
});
test('leaving the host cancels pending work and removes listeners and observer',async()=>{
 const h=harness(),task=h.mount(),old=h.nodes();h.leave();assert.equal(h.pending[0].options.signal.aborted,true);assert.equal(h.listeners.size,0);assert.equal(h.observers[0].off,true);
 h.pending[0].resolve(response([item('LATE','LATE PRIVATE DATA')]));await task;assert.doesNotMatch(old.inquiryList.innerHTML,/LATE PRIVATE DATA/);
});
test('malformed refresh preserves existing private inbox and allows retry',async()=>{
 const h=harness(),first=h.mount();h.pending[0].resolve(response([item()]));await first;const n=h.nodes(),previous=n.inquiryList.innerHTML;
 const bad=n.inquiryRefresh.onclick();h.pending[1].resolve(response([null]));await bad;assert.equal(n.inquiryList.innerHTML,previous);assert.match(n.inquiryStatus.textContent,/incompleta/);assert.equal(n.inquiryRefresh.disabled,false);
 const retry=n.inquiryRefresh.onclick();h.pending[2].resolve(response([]));await retry;assert.match(n.inquiryList.innerHTML,/Todavía no recibiste/);
});
test('refresh duplicate clicks do not overlap and filters stay intact after failure',async()=>{
 const h=harness(),first=h.mount();h.pending[0].resolve(response([item()]));await first;const n=h.nodes();n.inquirySearch.value='Private';const a=n.inquiryRefresh.onclick();await n.inquiryRefresh.onclick();assert.equal(h.pending.length,2);
 h.pending[1].reject(Error('Sin conexión'));await a;assert.equal(n.inquirySearch.value,'Private');assert.equal(n.inquiryRefresh.disabled,false);assert.match(n.inquiryList.innerHTML,/Private client/);
});
test('failed status update restores previous selection; success changes status without sending messages',async()=>{
 const h=harness(),first=h.mount();h.pending[0].resolve(response([item()]));await first;const n=h.nodes(),select=n.inquiryList.selects[0];select.value='respondida';const failed=select.onchange();
 assert.equal(h.pending[1].options.method,'PATCH');assert.deepEqual(JSON.parse(h.pending[1].options.body),{id:'QA',estado:'respondida'});
 h.pending[1].reject(Error('No guardado'));await failed;assert.equal(select.value,'pendiente');assert.match(n.inquiryStatus.textContent,/No guardado/);
 select.value='respondida';const saved=select.onchange();h.pending[2].resolve({ok:true,json:async()=>({success:true,item:{id:'QA',estado:'respondida'}})});await saved;assert.match(n.inquiryStatus.textContent,/No se envió ningún mensaje/);assert.match(n.inquiryList.innerHTML,/Respondida/);assert.equal(h.pending.length,3);
});
test('account change discards data and aborts inbox lifecycle',async()=>{
 const h=harness(),first=h.mount();h.pending[0].resolve(response([item()]));await first;const n=h.nodes();h.storage.set('uadav_account_access_v1','B');for(const entry of [...h.listeners])if(entry.name==='uadav:account')entry.fn();
 assert.equal(n.inquiryList.innerHTML,'');assert.equal(n.inquirySummary.textContent,'');assert.equal(h.listeners.size,0);assert.match(n.inquiryStatus.textContent,/La cuenta cambió/);
});

test('detached host also disposes its listeners when a delayed request finishes',async()=>{
 const h=harness(),task=h.mount(),old=h.nodes();h.host.isConnected=false;h.pending[0].resolve(response([item('LATE','DETACHED PRIVATE DATA')]));await task;
 assert.equal(h.listeners.size,0);assert.equal(h.observers[0].off,true);assert.doesNotMatch(old.inquiryList.innerHTML,/DETACHED PRIVATE DATA/);
});

test('malformed or wrong-inquiry PATCH success cannot report a saved state',async()=>{
 for(const data of [{success:true},{success:true,item:{id:'OTHER',estado:'respondida'}},{success:true,item:{id:'QA',estado:'cerrada'}}]){
 const h=harness(),first=h.mount();h.pending[0].resolve(response([item()]));await first;const n=h.nodes(),select=n.inquiryList.selects[0];select.value='respondida';const update=select.onchange();h.pending[1].resolve({ok:true,json:async()=>data});await update;
 assert.equal(select.value,'pendiente');assert.match(n.inquiryStatus.textContent,/No pudimos confirmar/);assert.doesNotMatch(n.inquiryStatus.textContent,/Estado guardado/);assert.equal(n.inquiryRefresh.disabled,false);
 }
});
