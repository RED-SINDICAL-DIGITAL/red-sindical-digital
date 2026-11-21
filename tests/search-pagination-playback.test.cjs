const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('buscar.html','utf8');
test('bare YouTube ID becomes a playable URL while an explicit other provider stays unchanged',()=>{
 const ctx={title:x=>x.title||'',image:()=>'',meta:()=>''};vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function playData('),source.indexOf('function section(')),ctx);
 const item=ctx.playData({id:'dQw4w9WgXcQ',title:'Tema'});assert.equal(item.provider,'youtube');assert.equal(item.videoId,'dQw4w9WgXcQ');assert.equal(item.url,'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
 const other=ctx.playData({id:'dQw4w9WgXcQ',provider:'vimeo',url:'https://vimeo.com/123'});assert.equal(other.provider,'vimeo');assert.equal(other.videoId,'');assert.equal(other.url,'https://vimeo.com/123');
});
function fixture(api){const button={disabled:false,textContent:''},nodes={loadMore:button,status:{textContent:''}},ctx={searchVersion:1,searchState:{q:'Tema',cursor:'page2',hasMore:true,content:[{id:'old'}]},window:{scrollY:10,scrollTo(){}},$:id=>nodes[id],api,arr:x=>x||[],uniqMedia:x=>x,renderSearch(){ctx.renders++},renders:0,console:{warn(){}}};vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('let loadingMore=false;'),source.indexOf('async function search(){')),ctx);return{ctx,nodes,button}}
test('malformed next page preserves content and cursor and offers retry',async()=>{
 for(const data of [null,{}, {content:{}},{content:[],has_more:true,cursor:{}},{content:[],has_more:true,cursor:''}]){const f=fixture(async()=>data);await f.ctx.loadMore();assert.equal(f.ctx.searchState.content[0].id,'old');assert.equal(f.ctx.searchState.cursor,'page2');assert.equal(f.ctx.searchState.hasMore,true);assert.equal(f.ctx.renders,0);assert.equal(f.button.disabled,false);assert.match(f.button.textContent,/Reintentar/);assert.match(f.nodes.status.textContent,/Conservamos/)}
});
test('retry appends a valid next page and a repeated cursor stops pagination',async()=>{
 let broken=true;const f=fixture(async()=>broken?{}:{content:[{id:'new'}],has_more:true,cursor:'page2'});await f.ctx.loadMore();broken=false;await f.ctx.loadMore();assert.equal(f.ctx.searchState.content.length,2);assert.equal(f.ctx.searchState.hasMore,false);assert.equal(f.ctx.renders,1);
});
test('an old pagination response cannot overwrite a newer query',async()=>{
 let resolve;const f=fixture(()=>new Promise(r=>resolve=r)),pending=f.ctx.loadMore();f.ctx.searchVersion++;f.ctx.searchState={q:'Otra',cursor:'other',hasMore:true,content:[{id:'current'}]};resolve({content:[{id:'stale'}],cursor:'next',has_more:true});await pending;assert.equal(f.ctx.searchState.content[0].id,'current');assert.equal(f.ctx.renders,0);
});
