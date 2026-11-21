const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('app.html','utf8'),library=fs.readFileSync('biblioteca.html','utf8');
function fixture(raw='[]',fail=false){let value=raw,events=0,refresh=0;const notices=[],ctx={localStorage:{getItem:()=>value,setItem(k,v){if(fail)throw Error('quota');value=v}},mediaKey:x=>String(x?.id||''),refreshLibraryButtons(){refresh++},toast:x=>notices.push(x),window:{dispatchEvent(){events++}},CustomEvent:class{}};vm.runInNewContext(app.slice(app.indexOf('function libToggle('),app.indexOf('function refreshLibraryButtons(')),ctx);return{ctx,notices,get value(){return value},get events(){return events},get refresh(){return refresh}}}
test('failed favorite persistence preserves saved data and does not announce success or sync',()=>{
for(const [raw,fail]of [['[{"id":"old"}]',true],['{bad',false],['{}',false]]){const h=fixture(raw,fail);assert.equal(h.ctx.libToggle('fav',{id:'new'}),null);assert.equal(h.value,raw);assert.equal(h.events,0);assert.equal(h.refresh,0);assert.match(h.notices[0],/No pudimos guardar/)}
for(const key of ['FAV_KEY','LATER_KEY'])assert.ok(app.includes('libToggle('+key+',currentMedia);if(on===null)return;toast('));
});
test('successful favorite add/remove persists before refreshing UI and dispatching sync',()=>{
const h=fixture('[null,2,{"id":"old"}]');assert.equal(h.ctx.libToggle('fav',{id:'new'}),true);assert.deepEqual(JSON.parse(h.value).map(x=>x.id),['new','old']);assert.equal(h.events,1);assert.equal(h.refresh,1);assert.equal(h.ctx.libToggle('fav',{id:'new'}),false);assert.deepEqual(JSON.parse(h.value).map(x=>x.id),['old']);
});
test('direct library opens inside shell with selected tab, search and fragment; embedded library stays put',()=>{
const src=library.match(/<script id="library-app-entry">([\s\S]*?)<\/script>/)[1];
for(const embedded of [false,true]){const urls=[],window={};window.parent=embedded?{}:window;vm.runInNewContext(src,{window,encodeURIComponent,location:{pathname:'/biblioteca',search:'?tab=favorites&q=musica',hash:'#grid',replace:u=>urls.push(u)}});if(embedded)assert.equal(urls.length,0);else assert.equal(new URL(urls[0],'https://staging.example').searchParams.get('view'),'/biblioteca?tab=favorites&q=musica#grid')}
const play=library.slice(library.indexOf('function play('),library.indexOf('function img('));assert.doesNotMatch(play,/window.open/);
});
