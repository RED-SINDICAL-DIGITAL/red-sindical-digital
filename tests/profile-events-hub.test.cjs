const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'..','usuario.html'),'utf8');
const workerInfo=readFileSync(join(__dirname,'..','docs/MI-PERFIL-2-BLUEPRINT-MOBILE-FIRST-20261107.md'),'utf8');

test('My Events is a dedicated personal navigation destination',()=>{
 assert.match(html,/href="\/usuario\.html\?vista=eventos"/);
 assert.match(html,/id="mis-eventos" aria-labelledby="profileEventsTitle"/);
 assert.match(html,/const allowed=\['account','artista','trabajos','eventos'\]/);
 assert.match(html,/eventos:'Mis eventos'/);
 assert.match(html,/\[data-profile-view="eventos"\] \.grid>:not\(#mis-eventos\)/);
});
test('only real publishing and promotion actions are provided',()=>{
 const content=html.split('id="mis-eventos"')[1].split('</section><section class="panel wide" id="radioStudioEntry"')[0];
 for(const url of ['/publicar-evento.html','/cartelera.html','/consultar-publicidad.html'])
  assert(content.includes('href="'+url+'"'),url);
 assert.match(content,/gestión privada de eventos propios todavía no está habilitada/);
 assert(!content.includes('Editar evento'));
 assert(!content.includes('Eliminar evento'));
 assert(!content.includes('Reactivar evento'));
});
test('event controls are isolated from private jobs and artist identity',()=>{
 for(const id of ['profileJobLookup','linkedArtists','artistProfile','profileSettings','recoverAccount'])assert(html.includes('id="'+id+'"'),id);
 assert.match(html,/\[data-profile-view="eventos"\] \.profile-settings\{display:none!important\}/);
});
test('all scripts remain syntactically valid',()=>{
 for(const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
});
test('events roadmap does not assert nonexistent private list capability',()=>{
 assert.match(workerInfo,/endpoint\/credencial/);
});
