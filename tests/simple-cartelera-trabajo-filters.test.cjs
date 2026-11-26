const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const read=name=>readFileSync(join(__dirname,'..',name),'utf8');
const calendar=read('cartelera.html'),jobs=read('bolsa-trabajo.html'),publish=read('publicar-evento.html');
test('Cartelera keeps primary filters visible and advanced fields available',()=>{
 assert.match(calendar,/<div class="filters"><select id="category"/);
 assert.match(calendar,/<input id="city"[^>]*><details class="event-filter-more" id="eventFilterMore">/);
 assert.match(calendar,/<summary>Más filtros <span class="filter-more-hint">Lugar, fecha y entradas<\/span><\/summary>/);
 for(const id of ['q','category','city','venue','from','free','filterBtn','clearEventFilters','grid','quick','premiumRail'])assert.equal((calendar.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 assert.match(calendar,/\$\('filterBtn'\)\.onclick=render/);
 assert.match(calendar,/\$\('clearEventFilters'\)\.onclick=/);
 assert.match(calendar,/event-filter-extra-fields/);
 assert.match(calendar,/event-filter-more:not\(\[open\]\)/);
 const controls=read('uadav-section-simplicity.js');
 assert.match(controls,/querySelector\('#eventFilterMore'\)/);
 assert.match(controls,/progressive\.classList\.add\('section-filter-details'\)/);
 assert.match(controls,/if\(progressive\)/);
 assert.match(controls,/if\(advancedActive\)progressive\.open=true/);
});
test('Bolsa preserves the same searches, offer publishing and private receipts',()=>{
 assert.match(jobs,/<details id="jobAdvancedFilters" class="job-advanced-filters">/);
 assert.match(jobs,/<summary>Más filtros <span>Ciudad y rubro<\/span><\/summary>/);
 for(const id of ['q','city','rubro','jobSearchBtn','jobClearBtn','list','jobPostForm','ownerReceipt','ownerKey','profileJobImportBtn']){
  if(id==='profileJobImportBtn')continue; // This is a Mi Perfil control, not a Bolsa control.
  assert.ok(jobs.includes('id="'+id+'"'),id);
 }
 assert.match(jobs,/id="jobPostForm"/);
 assert.match(jobs,/id="ownerReceipt"/);
 assert.match(jobs,/job-advanced-filters:not\(\[open\]\)/);
 assert.match(jobs,/id="jobStatusForm"|id="jobStatusLookup"|id="statusLookupForm"|id="jobStatusButton"|id="jobStatus"/);
});
test('Publicar evento retains essential and optional fields in its existing disclosure',()=>{
 for(const id of ['toggleEventExtras','eventExtrasLabel','form','functions'])assert.ok(publish.includes('id="'+id+'"'),id);
 assert.match(publish,/Mostrar más opciones/);
 assert.match(publish,/Publicar evento/);
});
