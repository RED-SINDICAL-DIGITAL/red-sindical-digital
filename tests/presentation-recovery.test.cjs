const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const workspace=fs.readFileSync(new URL('../mi-espacio-artista.html','file://'+__filename),'utf8'),page=fs.readFileSync(new URL('../presskit.html','file://'+__filename),'utf8');
function health(fetch){const timers=new Map();let seq=0;const ctx={API:'https://isolated.example/api/',workerReady:null,fetch,AbortController,setTimeout:f=>{timers.set(++seq,f);return seq},clearTimeout:id=>timers.delete(id)};vm.createContext(ctx);vm.runInContext(workspace.slice(workspace.indexOf('function checkWorkspaceWorker('),workspace.indexOf('async function call('))+';this.check=checkWorkspaceWorker',ctx);return{ctx,timers}}
test('workspace health deadline fails clearly, clears pending state and can retry',async()=>{
 let attempts=0;const h=health((url,{signal})=>{attempts++;if(attempts>1)return Promise.resolve({ok:true,json:async()=>({build:'11753'})});return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Object.assign(Error('aborted'),{name:'AbortError'}))))});
 const first=h.ctx.check();[...h.timers.values()][0]();await assert.rejects(first,/demoró demasiado/);assert.equal(h.ctx.workerReady,null);assert.equal(await h.ctx.check(),true);assert.equal(attempts,2);assert.equal(h.timers.size,0);
});
test('health success shares request but malformed build cannot unlock writes',async()=>{
 let calls=0;const h=health(async()=>{calls++;return{ok:true,json:async()=>({build:'11753'})}});const a=h.ctx.check(),b=h.ctx.check();assert.equal(a,b);await a;assert.equal(await h.ctx.check(),true);assert.equal(calls,1);
 for(const build of [undefined,'unknown','11700']){const x=health(async()=>({ok:true,json:async()=>({build})}));await assert.rejects(x.ctx.check(),/Actualizá/);assert.equal(x.ctx.workerReady,null)}
});
function publicPage(fetch,query='?artist_id=ART-QA'){
 const nodes={};for(const id of ['profile','retry','print','share','status','app'])nodes[id]={hidden:true,disabled:false,textContent:'',innerHTML:'',querySelectorAll:()=>[]};
 let renders=0,prepared=0;const c={URLSearchParams,AbortController,setTimeout,clearTimeout,location:{search:query},document:{title:'',getElementById:id=>nodes[id]},window:{UADAV_API_BASE:'https://isolated.example/api/',print(){}},fetch,UADAVPressKit:{render:()=>{renders++;return'<div>Public presentation</div>'}},UADAVShare:{prepare(){prepared++},open(){}}};
 vm.createContext(c);let source=page.slice(page.indexOf('const $=id=>'),page.indexOf('</script></body>')).trim().replace(/loadPresentation\(\);$/,'');vm.runInContext(source+';this.start=loadPresentation',c);return{c,nodes,renders:()=>renders,prepared:()=>prepared};
}
test('public kit load failure enables retry, keeps print/share hidden and then recovers',async()=>{
 let attempt=0;const h=publicPage(async()=>{attempt++;if(attempt===1)throw Error('Sin conexión');return{ok:true,json:async()=>({kit:{name:'QA Artist'},shows:[]})}});
 await h.c.start();assert.equal(h.nodes.retry.hidden,false);assert.equal(h.nodes.print.hidden,true);assert.equal(h.nodes.share.hidden,true);assert.equal(h.renders(),0);
 await h.nodes.retry.onclick();assert.equal(h.nodes.retry.hidden,true);assert.equal(h.nodes.print.hidden,false);assert.equal(h.nodes.share.hidden,false);assert.equal(h.renders(),1);assert.equal(h.prepared(),1);assert.equal(h.c.document.title,'QA Artist · Presentación artística');
});
test('overlapping retries issue one request and malformed success cannot expose share tools',async()=>{
 let resolve,calls=0;const h=publicPage(()=>{calls++;return new Promise(r=>resolve=r)});const pending=h.c.start();await h.c.start();assert.equal(calls,1);resolve({ok:true,json:async()=>({kit:null})});await pending;assert.equal(h.renders(),0);assert.equal(h.nodes.share.hidden,true);assert.equal(h.nodes.retry.hidden,false);assert.match(h.nodes.status.textContent,/incompleta/);
});
test('missing artist never requests data or offers unusable retry',async()=>{
 let calls=0;const h=publicPage(async()=>{calls++},'');await h.c.start();assert.equal(calls,0);assert.equal(h.nodes.retry.hidden,true);assert.equal(h.nodes.print.hidden,true);assert.match(h.nodes.status.textContent,/Elegí un artista/);
});
