const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const source=fs.readFileSync('app.html','utf8').match(/function openRadioSection\(section\)\{[\s\S]*?return true\}/)[0];
function setup(radio){const routes=[],ctx={currentRadio:radio,platformModules:{},nav:v=>routes.push(v)};vm.createContext(ctx);vm.runInContext(source,ctx);return {ctx,routes}}
test('player participation routes to the selected station and requested section',()=>{const {ctx,routes}=setup({id:'RAD/A ?'});assert.equal(ctx.openRadioSection('requestsSection'),true);assert.equal(routes[0],'/radio.html?id=RAD%2FA%20%3F#requestsSection');ctx.openRadioSection('chatSection');assert.ok(routes[1].endsWith('#chatSection'))});
test('no station or unrecognized section cannot navigate',()=>{let {ctx,routes}=setup(null);assert.equal(ctx.openRadioSection('chatSection'),false);assert.deepEqual(routes,[]);({ctx,routes}=setup({id:'A'}));assert.equal(ctx.openRadioSection('https://other.test'),false);assert.deepEqual(routes,[])});
test('station change uses current identity instead of a stale destination',()=>{const {ctx,routes}=setup({id:'A'});ctx.openRadioSection('chatSection');ctx.currentRadio={id:'B'};ctx.openRadioSection('requestsSection');assert.ok(routes[1].includes('id=B#'));ctx.currentRadio=null;assert.equal(ctx.openRadioSection('chatSection'),false)});

test('disabled radio participation cannot navigate through the player',()=>{const {ctx,routes}=setup({id:'A'});ctx.platformModules.radio_requests=false;assert.equal(ctx.openRadioSection('requestsSection'),false);assert.equal(ctx.openRadioSection('chatSection'),true);ctx.platformModules.radio=false;assert.equal(ctx.openRadioSection('chatSection'),false);assert.equal(routes.length,1)});

const radioSource=fs.readFileSync('radio.html','utf8');
test('radio favorites persist before notifying this frame and the same-origin shell',()=>{
 const start=radioSource.indexOf("const RADIO_FAV_KEY="),end=radioSource.indexOf('function radioLibraryReturn(',start),data=new Map(),events=[],button={classList:{toggle(){}},setAttribute(k,v){this[k]=v}},ctx={radio:{id:'station-1',nombre:'Radio Uno',programa:'Programa Uno',ubicacion:'Rosario',logo:'logo',stream_url:'https://example.test/live'},document:{getElementById:()=>button},localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},CustomEvent:class{constructor(type){this.type=type}},location:{origin:'https://example.test'}};
 ctx.window={dispatchEvent:e=>{assert(data.has('uadav_radio_favorites_v1'));events.push('frame:'+e.type)},parent:{location:{origin:ctx.location.origin},CustomEvent:ctx.CustomEvent,dispatchEvent:e=>{assert(data.has('uadav_radio_favorites_v1'));events.push('shell:'+e.type)}}};
 vm.runInNewContext(radioSource.slice(start,end),ctx);ctx.toggleRadioFav();const saved=JSON.parse(data.get('uadav_radio_favorites_v1'));assert.equal(saved[0].programa,'Programa Uno');assert.equal(saved[0].ubicacion,'Rosario');assert.equal(button['aria-pressed'],'true');assert.match(button['aria-label'],/Quitar/);ctx.toggleRadioFav();assert.equal(JSON.parse(data.get('uadav_radio_favorites_v1')).length,0);assert.equal(button['aria-pressed'],'false');assert.deepEqual(events,['frame:uadav:local-change','shell:uadav:local-change','frame:uadav:local-change','shell:uadav:local-change']);
});
test('failed storage never reports a favorite saved or emits sync notifications',()=>{
 const start=radioSource.indexOf('function toggleRadioFav(){'),end=radioSource.indexOf('function radioLibraryReturn(',start);let notified=0;const ctx={radio:{id:'station'},radioFavs:()=>[],radioFavKey:x=>x.id,RADIO_FAV_KEY:'fav',localStorage:{setItem(){throw Error('Quota')}},window:{dispatchEvent(){notified++}},document:{getElementById:()=>null},refreshRadioFav(){notified++}};
 vm.runInNewContext(radioSource.slice(start,end),ctx);ctx.toggleRadioFav();assert.equal(notified,0);
});
test('radio library destination preserves only a same-origin radio-favorites query',()=>{
 const start=radioSource.indexOf('function radioLibraryReturn('),end=radioSource.indexOf('function openLibrary()',start),ctx={URL,location:{origin:'https://example.test'}};vm.runInNewContext(radioSource.slice(start,end),ctx);
 assert.equal(ctx.radioLibraryReturn('/biblioteca.html?tab=radios&q=Rosario'),'/biblioteca.html?tab=radios&q=Rosario');
 for(const url of ['',null,'/biblioteca.html?tab=following','/admin.html','https://evil.test/biblioteca.html?tab=radios','/biblioteca.html?tab=radios&redirect=evil'])assert.equal(ctx.radioLibraryReturn(url),'/biblioteca.html?tab=radios');
});
test('radio library button navigates back to its validated filtered favorites',()=>{
 const start=radioSource.indexOf('function radioLibraryReturn('),end=radioSource.indexOf("window.addEventListener('uadav:account-data'",start),routes=[],ctx={URL,location:{origin:'https://example.test'},params:new URLSearchParams('from=%2Fbiblioteca.html%3Ftab%3Dradios%26q%3DRosario'),shellRadio:()=>({navigate:href=>routes.push(href)})};
 vm.runInNewContext(radioSource.slice(start,end),ctx);ctx.openLibrary();assert.deepEqual(routes,['/biblioteca.html?tab=radios&q=Rosario']);
});

test('saved radio without a catalog ID reopens by its stream reference',async()=>{
 const source=fs.readFileSync('radio.html','utf8'),start=source.indexOf('async function load(){'),end=source.indexOf('async function applyRadioSiteConfig()',start),station={nombre:'Radio sin ID',stream_url:'https://example.test/live'},ctx={wanted:station.stream_url,radio:null,apiJson:async()=>[station],app:{innerHTML:''},render(){ctx.rendered=ctx.radio},renderRadioHub(){throw Error('Wrong hub')},esc:String};
 vm.runInNewContext(source.slice(start,end),ctx);await ctx.load();assert.equal(ctx.rendered.nombre,station.nombre);assert.equal(ctx.app.innerHTML,'');
});
