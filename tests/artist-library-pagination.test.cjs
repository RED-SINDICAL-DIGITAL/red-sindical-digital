const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../uadav-artist-library-v136.js'),'utf8');
const validate=source.slice(source.indexOf('function validateLibraryPage('),source.indexOf('async function request('));
const load=source.slice(source.indexOf('async function load(kind)'),source.indexOf('\n markPlaying();'));
function setup(request,onVideos=()=>{}){
 const state={loaded:true,loading:false,cursor:'page-2',error:'',items:[{id:'existing'}]},controls=[];
 const ctx={display:{videos:true,playlists:true},s:{videos:{...state},playlists:{...state},onVideos},ref:'@synthetic',artist:{},onVideos,video:{},panel:{},request,controls:(kind,target)=>controls.push({kind,target}),document:{getElementById:()=>({live:true}),querySelector:()=>null},window:{UADAVArtistLibrary:{mount(){}}}};
 vm.runInNewContext(validate+'\n'+load,ctx);return {ctx,controls};
}
test('incomplete page preserves the cursor and existing playlists for retry',async()=>{
 const h=setup(async()=>({next_cursor:'page-3'}));await h.ctx.load('playlists');
 assert.equal(h.ctx.s.playlists.cursor,'page-2');assert.deepEqual(h.ctx.s.playlists.items,[{id:'existing'}]);assert.equal(h.ctx.s.playlists.loading,false);assert.match(h.ctx.s.playlists.error,/reintentar/);
});
test('failed video delivery cannot advance cursor past an unapplied page',async()=>{
 const h=setup(async()=>({items:[{id:'video'}],next_cursor:'page-3'}),()=>{throw Error('Synthetic rendering failure')});await h.ctx.load('videos');
 assert.equal(h.ctx.s.videos.cursor,'page-2');assert.equal(h.ctx.s.videos.loading,false);assert.match(h.ctx.s.videos.error,/reintentar/);
});
test('retry requests same cursor then advances only after videos are delivered',async()=>{
 const cursors=[];let fail=true;const h=setup(async(ref,kind,cursor)=>{cursors.push(cursor);return{items:[{id:'video'}],next_cursor:'page-3'}},()=>{if(fail){fail=false;throw Error('temporary failure')}});
 await h.ctx.load('videos');await h.ctx.load('videos');assert.deepEqual(cursors,['page-2','page-2']);assert.equal(h.ctx.s.videos.cursor,'page-3');assert.equal(h.ctx.s.videos.error,'');assert(h.controls.at(-1).target.live);
});
test('overlapping pagination clicks issue only one request',async()=>{
 let complete,calls=0;const h=setup(()=>{calls++;return new Promise(r=>complete=r)});const pending=h.ctx.load('videos');await h.ctx.load('videos');assert.equal(calls,1);complete({items:[],next_cursor:null});await pending;assert.equal(h.ctx.s.videos.cursor,null);assert.equal(h.ctx.s.videos.loading,false);
});
test('duplicate playlists are merged once and final page removes next cursor',async()=>{
 const h=setup(async()=>({items:[{id:'existing'},{id:'new'},{id:'new'}],next_cursor:null}));await h.ctx.load('playlists');assert.deepEqual(Array.from(h.ctx.s.playlists.items,x=>x.id),['existing','new']);assert.equal(h.ctx.s.playlists.cursor,null);assert.equal(h.ctx.s.playlists.loading,false);
});
test('repeated cursor and malformed playlist identifiers cannot corrupt loaded state',async()=>{
 for(const page of [{items:[{id:'new'}],next_cursor:'page-2'},{items:[null],next_cursor:'page-3'},{items:[{}],next_cursor:'page-3'},{items:[],next_cursor:7}]){
  const h=setup(async()=>page);await h.ctx.load('playlists');assert.equal(h.ctx.s.playlists.cursor,'page-2');assert.equal(h.ctx.s.playlists.items.length,1);assert.match(h.ctx.s.playlists.error,/reintentar/);
 }
});
test('hidden media category never starts a request',async()=>{
 let calls=0;const h=setup(async()=>{calls++;return{items:[]}});h.ctx.display.playlists=false;await h.ctx.load('playlists');assert.equal(calls,0);
});

test('malformed successful response is not stored in the shared public cache',async()=>{
 const cached=new Map();let fetches=0;
 const ctx={window:{UADAV_API_BASE:'https://isolated.example/api/',UADAVPublicCache:{async json(key,loader){if(cached.has(key))return cached.get(key);const data=await loader();cached.set(key,data);return data;}}},fetch:async()=>({ok:true,json:async()=>++fetches===1?{next_cursor:'later'}:{items:[{id:'playlist'}],next_cursor:null}}),AbortController,setTimeout:()=>0,clearTimeout(){}};
 const requestSource=source.slice(source.indexOf('async function request('),source.indexOf('window.UADAVArtistLibrary='));
 vm.runInNewContext(validate+'\n'+requestSource,ctx);
 await assert.rejects(ctx.request('@synthetic','playlists',null),/incompleta/);assert.equal(cached.size,0);
 const data=await ctx.request('@synthetic','playlists',null);assert.equal(data.items[0].id,'playlist');assert.equal(cached.size,1);
 await ctx.request('@synthetic','playlists',null);assert.equal(fetches,2);
});
