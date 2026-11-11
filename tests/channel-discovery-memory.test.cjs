const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){const data=new Map();const ctx={URL,Date,Event:class{},dispatchEvent(){},localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)}};vm.runInNewContext(fs.readFileSync('uadav-artist-discovery-v133.js','utf8'),ctx);return ctx.UADAVArtistDiscovery;}
const id='UC'+'a'.repeat(22);
test('search result with an explicit canonical channel survives navigation without a server write',()=>{
 const d=setup();const p=d.rememberChannel({author:'Artista de prueba',authorId:id});
 assert.equal(p.canal,id);assert.equal(p.discovered,true);assert.equal(d.read().length,1);
 assert.equal(d.merge([])[0].nombre,'Artista de prueba');assert.match(d.profileHref(p),/channel=UC/);
});
test('a name, video ID, foreign channel URL or hidden result cannot invent a channel profile',()=>{
 for(const value of [{author:'Nombre solo'},{author:'Video',videoId:'abcdefghijk'},{author:'Falso',author_url:'https://example.invalid/channel/'+id},{author:'Oculto',authorId:id,visible:false}]){
  const d=setup();assert.equal(d.rememberChannel(value),null);assert.equal(d.read().length,0);
 }
});
test('the admin-enriched canonical profile replaces a locally discovered channel',()=>{
 const d=setup();d.rememberChannel({author:'Descubierto',authorId:id});
 const list=d.merge([{id:'ART-'+id,canal:id,nombre:'Perfil enriquecido',visible:true}]);
 assert.equal(list.length,1);assert.equal(list[0].nombre,'Perfil enriquecido');
});
