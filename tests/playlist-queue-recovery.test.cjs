const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../uadav-playlist-player-v136.js'),'utf8');
function setup(page){const window={},played=[],notices=[],changes=[];let alive=true;vm.runInNewContext(source,{window,document:{getElementById:()=>null}});const queue=window.UADAVPlaylistPlayer.createQueue({page,play:x=>played.push(x.id),notify:x=>notices.push(x),change:s=>changes.push({error:s.error,busy:s.busy}),alive:()=>alive});return{queue,played,notices,changes,close:()=>alive=false};}
const item=(id,position=0,availability='available')=>({id,position,availability,titulo:id});
const A='aaaaaaaaaaa',B='bbbbbbbbbbb',C='ccccccccccc';
const settle=()=>new Promise(setImmediate);
test('malformed first page can retry without poisoning seen cursors',async()=>{
 let calls=0;const h=setup(async()=>++calls===1?{items:[null]}:{items:[item(A)],next_cursor:null});
 assert.equal(await h.queue.init(),false);assert.equal(h.queue.state.loaded,false);assert.equal(await h.queue.init(),true);assert.deepEqual(h.played,[A]);assert.equal(calls,2);
});
test('duplicate rows are removed while intentional repeated song at another position is retained',async()=>{
 const h=setup(async()=>({items:[item(A,0),item(A,0),item(A,1)],next_cursor:null}));await h.queue.init();assert.equal(h.queue.state.items.length,2);assert.deepEqual(Array.from(h.queue.state.items,x=>x.position),[0,1]);
});
test('non-embeddable song automatically advances and marks only the failed song',async()=>{
 const h=setup(async()=>({items:[item(A),item(B,1)],next_cursor:null}));await h.queue.init();h.queue.error(150,A);await settle();assert.deepEqual(h.played,[A,B]);assert.equal(h.queue.state.items[0].availability,'failed');
});
test('old player error or ended event cannot skip the current song',async()=>{
 const h=setup(async()=>({items:[item(A),item(B,1),item(C,2)]}));await h.queue.init();await h.queue.step(1);h.queue.error(150,A);h.queue.ended(A);await settle();assert.deepEqual(h.played,[A,B]);assert.equal(h.queue.state.index,1);
});
test('transient player failure exposes retry state and clears it when retrying current song',async()=>{
 const h=setup(async()=>({items:[item(A)]}));await h.queue.init();h.queue.error(5,A);assert.match(h.queue.state.error,/no pudo iniciar/);assert.match(h.changes.at(-1).error,/no pudo iniciar/);await h.queue.select(0);assert.equal(h.queue.state.error,'');assert.deepEqual(h.played,[A,A]);
});
test('unavailable page continues to next page and stops cleanly at end',async()=>{
 const cursors=[];const h=setup(async cursor=>{cursors.push(cursor);return cursor?{items:[item(B,1)],next_cursor:null}:{items:[item(A,0,'unavailable')],next_cursor:'next'}});
 assert.equal(await h.queue.init(),true);assert.deepEqual(h.played,[B]);assert.deepEqual(cursors,[null,'next']);assert.equal(await h.queue.step(1),false);assert.match(h.notices.at(-1),/final/);
});
test('closing playlist during pending request prevents late playback and list writes',async()=>{
 let complete;const h=setup(()=>new Promise(r=>complete=r));const pending=h.queue.init();h.close();complete({items:[item(A)]});assert.equal(await pending,false);assert.equal(h.played.length,0);assert.equal(h.queue.state.items.length,0);
});
test('malformed next cursor preserves a retryable initial queue',async()=>{
 let calls=0;const h=setup(async()=>({items:[item(A)],next_cursor:++calls===1?42:null}));assert.equal(await h.queue.init(),false);assert.equal(h.queue.state.loaded,false);assert.equal(await h.queue.init(),true);
});
