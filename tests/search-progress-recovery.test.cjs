const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../buscar.html'),'utf8');
const helpers=source.slice(source.indexOf('function searchStatusText('),source.indexOf('function renderSearch('));
const search=source.slice(source.indexOf('function syncSearchRoute('),source.indexOf("$('form').onsubmit"));
function setup(api){
 const snapshots=[],nodes={q:{value:'Masterboy'},status:{textContent:''},results:{innerHTML:''}},ctx={API:'https://uadav-api-staging.uadavstream.workers.dev/api/',searchVersion:0,searchState:{},$:id=>nodes[id],api,arr:x=>Array.isArray(x)?x:Array.isArray(x?.items)?x.items:[],uniqMedia:x=>x,history:{replaceState(){}},location:{pathname:'/buscar'},UADAVArtistDiscovery:{rememberMatches(){},remember(){}},esc:x=>String(x).replaceAll('<','&lt;'),console:{warn(){}}};
 ctx.window={};ctx.parent=ctx.window;ctx.renderSearch=()=>snapshots.push(JSON.parse(JSON.stringify(ctx.searchState)));
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

function enableExact(h){
 const g={URL,Event,dispatchEvent(){},localStorage:{getItem:()=>null,setItem(){}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../uadav-artist-discovery-v133.js'),'utf8'),g);
 h.ctx.UADAVArtistDiscovery=g.UADAVArtistDiscovery;
}
test('channel link in general search resolves one exact profile without fuzzy providers',async()=>{
 const calls=[],channel='UC81VD6eeuLLSfyY_D-N8sVw',h=setup(async p=>{calls.push(p);return{channelId:channel,nombre:'Madonna'}});
 enableExact(h);h.nodes.q.value='https://www.youtube.com/@madonna';await h.ctx.search();
 assert.deepEqual(calls,['youtube/channel_library?kind=info&id=%40madonna']);assert.equal(h.ctx.searchState.artists[0].canal,channel);assert.equal(h.ctx.searchState.content.length,0);assert.equal(h.ctx.searchState.hasMore,false);assert.equal(h.ctx.searchState.pending,false);
});
test('failed or mismatched exact channel search never substitutes a name match',async()=>{
 for(const response of [null,{channelId:'UCaaaaaaaaaaaaaaaaaaaaaa',nombre:'Other'}]){
 const calls=[],h=setup(async p=>{calls.push(p);if(!response)throw Error('Offline');return response});enableExact(h);h.nodes.q.value='UC81VD6eeuLLSfyY_D-N8sVw';await h.ctx.search();
 assert.equal(calls.length,1);assert.equal(h.ctx.searchState.artists.length,0);assert.equal(h.ctx.searchState.failures,1);assert.equal(h.ctx.searchState.pending,false);
 }
});
test('late channel response cannot overwrite a newer name search',async()=>{
 let resolve;const h=setup(async p=>p.startsWith('youtube/channel_library')?new Promise(r=>resolve=r):p.startsWith('public/search')?{content:[{title:'Current result'}],artists:[{nombre:'Current artist'}],events:[{id:'event'}],radios:[{id:'radio'}]}:[]);enableExact(h);
 h.nodes.q.value='@madonna';const old=h.ctx.search();h.nodes.q.value='Current';await h.ctx.search();resolve({channelId:'UC81VD6eeuLLSfyY_D-N8sVw',nombre:'Madonna'});await old;
 assert.equal(h.ctx.searchState.q,'Current');assert.equal(h.ctx.searchState.artists[0].nombre,'Current artist');
});
