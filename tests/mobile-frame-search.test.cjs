const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(new URL('../uadav-mobile-v108.js','file://'+__filename),'utf8');
function harness(){
 const timers=[],pending=[],handlers={},input={value:'First',addEventListener:(n,f)=>handlers['input:'+n]=f};
 const grid={textContent:'0 resultados',innerHTML:'',isConnected:true};
 const form={dataset:{},addEventListener:(n,f)=>handlers['form:'+n]=f};
 const doc={getElementById:id=>({searchForm:form,q:input,grid}[id])};
 const win={location:{pathname:'/artistas.html'},UADAV_API_BASE:'https://isolated-staging.example/api/'};
 const context={W:{},AbortController,URLSearchParams,Map,console,setTimeout:f=>timers.push(f),fetch:(url,options)=>new Promise(resolve=>pending.push({url,options,resolve}))};
 vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('function automaticArtistProfile'),source.indexOf('function enhanceFrame'))+';this.install=automaticArtistProfile',context);
 context.install(doc,win);return {timers,pending,handlers,input,grid};
}
test('early iframe without body does not install rail observer',()=>{
 const context={};vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function installRailUX'),source.indexOf('function hideEmptySections'))+';this.install=installRailUX',context);
 assert.doesNotThrow(()=>context.install({documentElement:{}}));assert.doesNotThrow(()=>context.install(null));
});
test('fallback search uses configured staging API and does not double bind Enter',async()=>{
 const h=harness();h.handlers['form:submit']();const task=h.timers.shift()();assert.equal(h.pending.length,1);assert.equal(h.pending[0].url,'https://isolated-staging.example/api/public/search?q=First');assert.equal(h.handlers['input:keydown'],undefined);
 h.pending[0].resolve({ok:true,json:async()=>({content:[]})});await task;assert.match(h.grid.innerHTML,/No encontramos/);
});
test('changed query aborts and late response cannot replace newer UI',async()=>{
 const h=harness();h.handlers['form:submit']();const task=h.timers.shift()();h.input.value='Second';h.handlers['input:input']();h.grid.innerHTML='Newer results';
 assert.equal(h.pending[0].options.signal.aborted,true);h.pending[0].resolve({ok:true,json:async()=>({content:[]})});await task;assert.equal(h.grid.innerHTML,'Newer results');
});
test('stale timer and detached grid never start network work',async()=>{
 const h=harness();h.handlers['form:submit']();h.input.value='Second';await h.timers.shift()();assert.equal(h.pending.length,0);
 h.handlers['form:submit']();h.grid.isConnected=false;await h.timers.shift()();assert.equal(h.pending.length,0);
});
test('HTTP failure shows retryable failure rather than no-results claim',async()=>{
 const h=harness();h.handlers['form:submit']();const task=h.timers.shift()();h.pending[0].resolve({ok:false});await task;assert.match(h.grid.innerHTML,/No pudimos completar/);assert.doesNotMatch(h.grid.innerHTML,/No encontramos/);
});
