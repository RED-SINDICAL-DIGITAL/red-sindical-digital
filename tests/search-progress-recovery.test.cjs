const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../buscar.html'),'utf8');
const helpers=source.slice(source.indexOf('function searchStatusText('),source.indexOf('function renderSearch('));
const search=source.slice(source.indexOf('async function search(){'),source.indexOf("$('form').onsubmit"));
function setup(api){
 const snapshots=[],nodes={q:{value:'Masterboy'},status:{textContent:''},results:{innerHTML:''}},ctx={searchVersion:0,searchState:{},$:id=>nodes[id],api,arr:x=>Array.isArray(x)?x:Array.isArray(x?.items)?x.items:[],uniqMedia:x=>x,history:{replaceState(){}},location:{pathname:'/buscar'},UADAVArtistDiscovery:{rememberMatches(){},remember(){}},esc:x=>String(x).replaceAll('<','&lt;'),console:{warn(){}}};
 ctx.renderSearch=()=>snapshots.push(JSON.parse(JSON.stringify(ctx.searchState)));
 vm.runInNewContext(helpers+'\n'+search,ctx);return {ctx,nodes,snapshots};
}
const empty=()=>({content:[],artists:[],events:[],radios:[]});
test('pending empty search stays in searching state rather than claiming zero matches',()=>{
 const h=setup(async()=>[]),s={...empty(),q:'Masterboy',pending:true,failures:0};
 assert.match(h.ctx.searchStatusText(s),/Buscando/);assert.match(h.ctx.searchEmptyHTML(s),/Buscando/);assert.doesNotMatch(h.ctx.searchEmptyHTML(s),/No encontramos/);
});
test('completed available-source search may report no matches after all jobs settle',async()=>{
 const h=setup(async path=>path.startsWith('public/search')?empty():[]);await h.ctx.search();
 assert.equal(h.snapshots[0].pending,true);assert.equal(h.ctx.searchState.pending,false);assert.equal(h.ctx.searchState.failures,0);assert.match(h.ctx.searchEmptyHTML(h.ctx.searchState),/fuentes disponibles/);
});
test('failed sources do not masquerade as a definitive empty result',async()=>{
 const h=setup(async()=>{throw Error('Network failure')});await h.ctx.search();
 assert.equal(h.ctx.searchState.pending,false);assert(h.ctx.searchState.failures>0);assert.match(h.ctx.searchEmptyHTML(h.ctx.searchState),/No pudimos completar/);assert.match(h.ctx.searchStatusText(h.ctx.searchState),/no respondieron/);
});
test('partial source failure retains valid content while reporting incomplete search',async()=>{
 const h=setup(async path=>{if(path.startsWith('public/search'))return{...empty(),content:[{id:'valid',title:'Valid content'}]};throw Error('Temporary source failure')});await h.ctx.search();
 assert.equal(h.ctx.searchState.content.length,1);assert.match(h.ctx.searchStatusText(h.ctx.searchState),/1 resultados.*no respondieron/);
});
test('local Cartelera is still queried when federated feed fails',async()=>{
 const paths=[];const h=setup(async path=>{paths.push(path);if(path.startsWith('public/search'))return empty();if(path.startsWith('public/federated-feed'))throw Error('Feed offline');if(path==='cartelera')return[{id:'event',titulo:'Masterboy en escena'}];return[];});
 await h.ctx.search();assert(paths.includes('cartelera'));assert.equal(h.ctx.searchState.events[0].id,'event');
});
test('late earlier query cannot replace a newer completed search',async()=>{
 let complete;const h=setup(async path=>{if(path==='public/search?q=First')return new Promise(r=>complete=r);if(path.startsWith('public/search'))return{content:[{title:'Second content'}],artists:[{nombre:'Second artist'}],events:[{id:'event'}],radios:[{id:'radio'}]};return[];});
 h.nodes.q.value='First';const old=h.ctx.search();h.nodes.q.value='Second';await h.ctx.search();complete(empty());await old;assert.equal(h.ctx.searchState.q,'Second');assert.equal(h.ctx.searchState.content[0].title,'Second content');assert.equal(h.ctx.searchState.pending,false);
});
