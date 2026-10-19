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

test('late video response cannot hydrate a different active channel',async()=>{let complete,active=true,delivered=0;const h=setup(()=>new Promise(r=>complete=r),()=>delivered++);h.ctx.window.UADAVArtistLibrary.isCurrent=()=>active;const pending=h.ctx.load('videos');active=false;complete({items:[{id:'late'}],next_cursor:'page-3'});await pending;assert.equal(delivered,0);assert.equal(h.ctx.s.videos.cursor,'page-2');assert.equal(h.ctx.s.videos.loading,false);assert.equal(h.controls.length,1)});
test('late failure cannot show error controls in another channel',async()=>{let reject,active=true;const h=setup(()=>new Promise((_,r)=>reject=r));h.ctx.window.UADAVArtistLibrary.isCurrent=()=>active;const pending=h.ctx.load('playlists');active=false;reject(Error('late failure'));await pending;assert.equal(h.ctx.s.playlists.error,'');assert.equal(h.ctx.s.playlists.loading,false);assert.equal(h.controls.length,1)});
test('multi-page cursor loop preserves the last accepted page for retry',async()=>{let count=0;const h=setup(async()=>++count===1?{items:[{id:'new'}],next_cursor:'page-3'}:{items:[{id:'repeated'}],next_cursor:'page-2'});await h.ctx.load('playlists');await h.ctx.load('playlists');assert.equal(h.ctx.s.playlists.cursor,'page-3');assert.deepEqual(Array.from(h.ctx.s.playlists.items,x=>x.id),['existing','new']);assert.match(h.ctx.s.playlists.error,/reintentar/)});
test('inactive channel never starts a new library request',async()=>{let requests=0;const h=setup(async()=>{requests++;return{items:[]}});h.ctx.window.UADAVArtistLibrary.isCurrent=()=>false;await h.ctx.load('videos');assert.equal(requests,0);assert.equal(h.controls.length,0)});
test('a channel switched during video rendering receives no old controls',async()=>{let active=true;const h=setup(async()=>({items:[{id:'new'}],next_cursor:'page-3'}),()=>active=false);h.ctx.window.UADAVArtistLibrary.isCurrent=()=>active;await h.ctx.load('videos');assert.equal(h.controls.length,1);assert.equal(h.ctx.s.videos.cursor,'page-2');assert.equal(h.ctx.s.videos.loading,false)});
test('confirmed empty catalogs explain missing videos and playlists',()=>{const controlsSource=source.slice(source.indexOf('const controls=(kind,target)'),source.indexOf('\n let tab='));for(const kind of ['videos','playlists']){let rendered;const ctx={s:{videos:{loaded:true,cursor:null,hasItems:false},playlists:{loaded:true,cursor:null,items:[]}},esc:String,document:{getElementById:()=>null,createElement:()=>({innerHTML:'',querySelector:()=>null})},load(){}};vm.createContext(ctx);vm.runInContext(controlsSource+';globalThis.showControls=controls;',ctx);ctx.showControls(kind,{appendChild:el=>rendered=el});assert.match(rendered.innerHTML,kind==='videos'?/No encontramos videos públicos/:/no tiene playlists públicas/);assert.doesNotMatch(rendered.innerHTML,/Llegaste al final/)}});
