const test=require('node:test'),assert=require('node:assert/strict');
const p=require('../uadav-section-picker.js');
test('picker finds accented names and places with normalized whitespace without mixing types',()=>{
const rows=[{id:'1',entity_kind:'eventos',titulo:'Música en vivo',ciudad:'Córdoba'},{id:'2',entity_kind:'radios',titulo:'Música en vivo'},{id:'3',entity_kind:'eventos',titulo:'Música privada',visible:false}];
assert.deepEqual(p.matchingCatalog(rows,'eventos','  MUSICA   en vivo ').map(x=>x.id),['1']);
assert.deepEqual(p.matchingCatalog(rows,'eventos','cordoba').map(x=>x.id),['1']);
assert.equal(p.matchingCatalog(rows,'eventos','privada').length,0);
});
test('picker distinguishes an empty catalog from an unsuccessful filter and gives relevant guidance',()=>{
assert.match(p.emptyMessage('perfiles',false),/Artistas/);
assert.match(p.emptyMessage('eventos',false),/Cartelera/);
assert.match(p.emptyMessage('radios',false),/Radios/);
assert.match(p.emptyMessage('contenido',false),/Videos y música/);
for(const kind of ['perfiles','eventos','radios','contenido'])assert.match(p.emptyMessage(kind,true),/quitá el filtro/);
});
