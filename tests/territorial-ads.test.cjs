const test=require('node:test');
const assert=require('node:assert/strict');
const ads=require('../uadav-territorial-ads.js');
const now=Date.parse('2026-10-11T18:00:00Z');
const make=(id,scope,slot='home')=>({id,title:id,destination:'https://example.com',slot,status:'active',approved:true,published:true,starts_at:'2026-10-10T00:00:00Z',ends_at:'2026-10-20T00:00:00Z',targeting:scope,priority:1});
const sf={country:'AR',province:'Santa Fe',city:'Rosario'};
const cordoba={country:'AR',province:'Córdoba',city:'Córdoba'};
test('restringe campaña provincial a la provincia correspondiente',()=>{
 const c=make('sf',{scope:'province',countries:['AR'],provinces:['Santa Fe']});
 assert.equal(ads.select([c],sf,'home',now)?.id,'sf');
 assert.equal(ads.select([c],cordoba,'home',now),null);
});
test('ciudad no equivale a provincia',()=>{
 const c=make('rosario',{scope:'city',countries:['AR'],provinces:['Santa Fe'],cities:['Rosario']});
 assert.ok(ads.eligible(c,sf,'home',now));
 assert.equal(ads.eligible(c,{country:'AR',province:'Santa Fe',city:'Santa Fe'},'home',now),null);
});
test('coexisten local, nacional e internacional y se prioriza coincidencia local',()=>{
 const all=[make('global',{scope:'global'}),make('national',{scope:'country',countries:['AR']}),make('local',{scope:'province',countries:['Argentina'],provinces:['Santa Fe']})];
 assert.equal(ads.select(all,sf,'home',now).id,'local');
 assert.equal(ads.select(all,cordoba,'home',now).id,'national');
 assert.equal(ads.select(all,{country:'UY'},'home',now).id,'global');
});
test('no muestra campañas pendientes, vencidas ni sin publicación',()=>{
 const c=make('a',{scope:'global'});assert.equal(ads.eligible({...c,approved:false},sf,'home',now),null);
 assert.equal(ads.eligible({...c,published:false},sf,'home',now),null);
 assert.equal(ads.eligible({...c,ends_at:'2026-10-11T17:00:00Z'},sf,'home',now),null);
});
test('solo tres emplazamientos, URL HTTPS, no ubicación específica por defecto',()=>{
 const c=make('a',{scope:'global'});assert.equal(ads.select([c],sf,'player',now),null);
 assert.equal(ads.eligible({...c,destination:'javascript:alert(1)'},sf,'home',now),null);
 assert.equal(ads.select([make('sf',{scope:'province',countries:['AR'],provinces:['Santa Fe']})],{},'home',now),null);
});

test('rechaza campañas sin alcance territorial explícito',()=>{
 const c=make('missing',undefined);
 assert.equal(ads.eligible(c,sf,'home',now),null);
 assert.equal(ads.eligible({...c,targeting:{}},sf,'home',now),null);
 assert.equal(ads.eligible({...c,targeting:{scope:'global'}},sf,'home',now)?.id,'missing');
});
test('rechaza alcance desconocido y filtros globales contradictorios',()=>{
 const c=make('bad',{scope:'planet'});
 assert.equal(ads.eligible(c,sf,'home',now),null);
 assert.equal(ads.eligible({...c,targeting:{scope:'global',countries:['AR']}},sf,'home',now),null);
});
