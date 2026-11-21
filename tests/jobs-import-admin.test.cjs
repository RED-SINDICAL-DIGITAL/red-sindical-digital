const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../uadav-jobs-import.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../admin.html'),'utf8');
const context={window:{},URL,Intl,Date};vm.runInNewContext(source,context);
const jobs=context.window.UADAVJobsImport,origin='https://uadav-stream-staging.pages.dev';
const XLSX=require('../vendor/xlsx-0.20.3.full.min.js');
const now=Date.parse('2026-10-25T01:30:00Z');
const raw={titulo:'Oferta externa QA',descripcion:'Prueba de importación',source_url:'https://fuente.example/convocatoria/uno',fecha_limite:'2026-10-24'};
const normalize=(row=raw,options={})=>jobs.normalize(row,{now,...options});
test('a native exported job without a source explains the difference between external import and backup',()=>{
  assert.throws(()=>normalize({...raw,id:'JOB-NATIVE',source_url:''}),error=>/ofertas externas/.test(error.message)&&/Respaldo avanzado/.test(error.message));
});
const batch=rows=>({entity:'jobs',sheet:'CSV',rows});

test('new hidden jobs remain unapproved, retain their external origin, and discard spreadsheet credentials and native IDs',()=>{
  const x=normalize({...raw,id:'JOB-NATIVE',owner_access_hash:'secret',email:'private@example.invalid'});
  assert.equal(x.revisado_por_admin,false);assert.equal(x.origen,'externo');assert.equal(x.application_mode,'external_url');
  assert.equal(x.source_url,raw.source_url);assert.equal(x.external_id,raw.source_url);
  assert.equal(x.id,undefined);assert.equal(x.owner_access_hash,undefined);assert.equal(x.email,undefined);
});
test('publication requires an explicit current calendar deadline, using Argentina day rather than UTC',()=>{
  assert.equal(jobs.today(now),'2026-10-24');assert.equal(normalize(raw,{visible:true}).revisado_por_admin,true);
  for(const date of ['', '2026-10-23','2026-02-30','2026-13-01','24/10/2026'])assert.throws(()=>normalize({...raw,fecha_limite:date},{visible:true}),/fecha límite|Fecha límite/);
  assert.equal(normalize({...raw,fecha_limite:''}).fecha_limite,'');
});
test('titles and descriptions are mandatory; an incomplete row never becomes an invented opportunity',()=>{
  for(const row of [{...raw,titulo:''},{...raw,descripcion:''},null,[]])assert.throws(()=>normalize(row),/necesita|formato/);
});
test('unsafe source and application URLs are rejected before any import',()=>{
  for(const url of ['javascript:alert(1)','http://fuente.example/jobs','https://user:pass@fuente.example/jobs','https://localhost/jobs','https://127.0.0.1/jobs','https://[::1]/jobs','https://intranet.internal/jobs','https://fuente.example:8443/jobs']){
    assert.throws(()=>normalize({...raw,source_url:url}),/HTTPS|dominio público/);
    assert.throws(()=>normalize({...raw,application_url:url}),/HTTPS|dominio público/);
  }
});
test('canonical source URLs retain query identity and ignore anchors and optional file IDs',()=>{
  const first=normalize({...raw,source_url:'https://FUENTE.example/convocatoria/uno?q=1#detalle',id:'JOB-ONE'});
  const second=normalize({...raw,source_url:'https://fuente.example/convocatoria/uno?q=1#formulario',id:'JOB-TWO'});
  assert.equal(first.external_id,second.external_id);assert.match(first.external_id,/\?q=1$/);
});
test('the complete preview rejects duplicate source URLs, including duplicates in different sheets',()=>{
  assert.throws(()=>jobs.splitBatches([batch([normalize()]),batch([normalize()])]),/repite una URL/);
  assert.throws(()=>jobs.splitBatches([batch([normalize(),normalize({...raw,source_url:raw.source_url.replace('fuente.example','FUENTE.example.')})])]),/repite una URL/);
});
test('CSV identity preserves case-sensitive paths and queries while normalizing host, dot and fragment',()=>{
  const urls=['https://FUENTE.example./Casting?q=Uno#form','https://fuente.example/casting?q=Uno','https://fuente.example/Casting?q=uno'];
  const rows=urls.map(source_url=>normalize({...raw,source_url}));
  assert.equal(rows[0].source_url,'https://fuente.example/Casting?q=Uno');
  assert.equal(jobs.splitBatches([batch(rows)])[0].rows.length,3);
  assert.throws(()=>jobs.splitBatches([batch([rows[0],normalize({...raw,source_url:'https://fuente.example/Casting?q=Uno#otra'})])]),/repite una URL/);
});
test('malformed domain labels are rejected during review before a source request or import',()=>{
  for(const host of ['foo_bar.example','-foo.example','foo-.example','a'.repeat(64)+'.example'])assert.throws(()=>normalize({...raw,source_url:'https://'+host+'/qa'}),/dominio público/);
});
test('job rows split into transactions of at most five while other entity batches remain unchanged',()=>{
  const rows=Array.from({length:12},(_,i)=>normalize({...raw,source_url:'https://fuente.example/jobs/'+i}));
  const other={entity:'artists',rows:[{nombre:'QA'}]};
  const result=jobs.splitBatches([other,batch(rows)]);
  assert.equal(result[0],other);assert.deepEqual(Array.from(result.slice(1),x=>x.rows.length),[5,5,2]);
});
test('job writes use only the staging external-import endpoint and require exact confirmed counts',async()=>{
  const calls=[];const request=async(...args)=>{calls.push(args);return {success:true,kind:'job',imported:1,updated:0}};
  await jobs.sendBatch(batch([normalize()]),{origin,request});
  assert.equal(calls[0][0],'admin/federated/import');assert.equal(calls[0][1].body.kind,'job');
  assert.equal(calls[0][1].body.items[0].revisado_por_admin,false);
  for(const badOrigin of ['https://uadavstream.com.ar',origin+'.evil','http://uadav-stream-staging.pages.dev'])await assert.rejects(jobs.sendBatch(batch([normalize()]),{origin:badOrigin,request}),/staging/);
  assert.equal(calls.length,1);
});
test('empty, oversized, incomplete and uncertain operations never report success or retry automatically',async()=>{
  let calls=0;
  for(const rows of [[],Array(6).fill(normalize())])await assert.rejects(jobs.sendBatch(batch(rows),{origin,request:async()=>{calls++}}),/hasta cinco/);
  for(const result of [{},{success:true,kind:'job',imported:0,updated:0},{success:true,kind:'event',imported:1,updated:0},{success:true,kind:'job',imported:1}]){
    await assert.rejects(jobs.sendBatch(batch([normalize()]),{origin,request:async()=>{calls++;return result}}),/no confirmó/);
  }
  await assert.rejects(jobs.sendBatch(batch([normalize()]),{origin,request:async()=>{calls++;throw Error('Sin conexión')}}),/Sin conexión/);
  assert.equal(calls,5);
});

const handler=html.slice(html.indexOf('window.commitImport=async()=>{'),html.indexOf('\nasync function fetchExportRows'));
function setupCommit(count=2){
  let resolve,reject;const pending=new Promise((a,b)=>{resolve=a;reject=b});const fields={importCommit:{disabled:false,textContent:''},importPreview:{textContent:''}};
  const batches=Array.from({length:count},(_,i)=>batch([normalize({...raw,source_url:'https://fuente.example/jobs/'+i})]));
  const calls=[],S={view:'imports',importBatches:batches,importRows:batches.flatMap(x=>x.rows),cache:{jobs:['old']}};
  const c={window:{UADAVJobsImport:jobs},location:{origin},S,$:id=>fields[id],confirm:()=>true,toast:(...args)=>calls.push(['toast',...args]),
    api:async(...args)=>{calls.push(['api',...args]);return pending}};
  vm.runInNewContext('let importCommitBusy=false;'+handler,c);
  return {c,calls,fields,S,resolve,reject};
}
test('double confirmation cannot start overlapping imports',async()=>{
  const x=setupCommit(1),first=x.c.window.commitImport();await x.c.window.commitImport();
  assert.equal(x.calls.filter(v=>v[0]==='api').length,1);assert.equal(x.fields.importCommit.disabled,true);
  x.resolve({success:true,kind:'job',imported:1,updated:0});await first;
  assert.match(x.fields.importPreview.textContent,/Importación completada/);assert.equal(x.S.importRows.length,0);assert.equal(x.S.cache.jobs,undefined);
});
test('a failed batch stops later writes, retains a reviewable report, and requires a new preview',async()=>{
  const x=setupCommit(),first=x.c.window.commitImport();x.reject(Error('Sin conexión'));await first;
  assert.equal(x.calls.filter(v=>v[0]==='api').length,1);assert.match(x.fields.importPreview.textContent,/Importación detenida/);
  assert.match(x.fields.importPreview.textContent,/Sin conexión/);assert.equal(x.fields.importCommit.disabled,true);
  await x.c.window.commitImport();assert.equal(x.calls.filter(v=>v[0]==='api').length,1);
});
test('leaving the import view or replacing the preview stops later batches without changing the new view',async()=>{
  for(const change of ['section','draft']){
    const x=setupCommit(),first=x.c.window.commitImport();
    if(change==='section')x.S.view='radios';else{x.S.importBatches=[];x.fields.importPreview={textContent:'Nuevo archivo'}};
    x.resolve({success:true,kind:'job',imported:1,updated:0});await first;
    assert.equal(x.calls.filter(v=>v[0]==='api').length,1);assert.equal(x.S.cache.jobs,undefined);
    if(change==='draft')assert.equal(x.fields.importPreview.textContent,'Nuevo archivo');
  }
});
test('Admin loads the shared importer, validates the whole preview, and exposes external-source requirements',()=>{
  assert.match(html,/uadav-jobs-import\.js\?v=11762\.1/);
  assert.match(html,/UADAVJobsImport\.normalize\(r,\{visible,source:origin\}\)/);
  assert.match(html,/UADAVJobsImport\.splitBatches\(batches\)/);
  assert.match(html,/source_url/);assert.match(html,/las existentes conservan su estado/);
});

function setupPreview(){
  const fields={importPreview:{textContent:''},importCommit:{disabled:true},importEntity:{value:'jobs'},importVisible:{value:'false'},importOrigin:{value:'QA'},importFile:{files:[]}};
  const c={window:{UADAVJobsImport:jobs},S:{view:'imports',importRows:[],importBatches:[]},$:id=>fields[id],toast(){}};
  const functions=html.slice(html.indexOf('function normalizeImportRow('),html.indexOf('\nlet importPreviewTurn=0;'));
  const preview=html.slice(html.indexOf('window.previewImport=async()=>{'),html.indexOf('\nlet importCommitBusy=false;'));
  vm.runInNewContext('let importPreviewTurn=0,importCommitBusy=false;'+functions+'\n'+preview,c);
  function file(title){let resolve;const pending=new Promise(a=>{resolve=a});return {name:'qa.json',size:100,text:()=>pending,finish(){resolve(JSON.stringify({entity:'jobs',rows:[{...raw,titulo:title}]}))}}}
  return {c,fields,file};
}
test('changing options while a file is being read invalidates the pending preview',async()=>{
  const x=setupPreview(),file=x.file('Anterior');x.fields.importFile.files=[file];
  const first=x.c.window.previewImport();x.fields.importVisible.value='true';x.c.window.invalidateImportPreview();file.finish();await first;
  assert.equal(x.c.S.importBatches.length,0);assert.equal(x.fields.importCommit.disabled,true);
  assert.match(x.fields.importPreview.textContent,/Cambiaste el archivo/);
});
test('an older file read cannot replace a newer reviewed file',async()=>{
  const x=setupPreview(),old=x.file('Anterior'),fresh=x.file('Nuevo');x.fields.importFile.files=[old];
  const first=x.c.window.previewImport();x.fields.importFile.files=[fresh];x.c.window.invalidateImportPreview();
  const second=x.c.window.previewImport();fresh.finish();await second;old.finish();await first;
  assert.equal(x.c.S.importRows[0].titulo,'Nuevo');assert.equal(x.fields.importCommit.disabled,false);
  assert.match(x.fields.importPreview.textContent,/Nuevo/);assert.doesNotMatch(x.fields.importPreview.textContent,/Anterior/);
});
test('candidate review delegates to the shared URL editor with its actual source',async()=>{
  const handler=html.slice(html.indexOf('window.publishCandidate=async'),html.indexOf('\nwindow.discardCandidate='));
  const opened=[],reads=[],c={window:{__federatedSources:[{id:'qa',kind:'job',name:'Fuente QA',last_check:{candidates:[{titulo:'Candidata QA',source_url:raw.source_url}]}}]},toast(){}};
  c.window.openUrlImport=options=>opened.push(options);c.window.analyzeImportUrl=async()=>reads.push('read');
  vm.runInNewContext(handler,c);await c.window.publishCandidate('qa',0);
  assert.equal(opened.length,1);assert.equal(opened[0].source.id,'qa');assert.equal(opened[0].url,raw.source_url);assert.equal(reads.length,1);
});
test('the actual CSV fixture retains UTF-8 accents, URLs and calendar dates without automatic numeric conversion',async()=>{
  const content=fs.readFileSync(path.join(__dirname,'fixtures/bolsa-import-11760-oculta.csv'),'utf8');
  const workbook=await jobs.readWorkbook({name:'qa.csv',text:async()=>content},XLSX);
  const rows=jobs.sheetRows(workbook,workbook.SheetNames[0],'jobs',XLSX);
  assert.equal(rows[0].titulo,'QA 11760 · Importación externa oculta · NO CONTRATAR');
  assert.equal(rows[0].fecha_limite,'2026-11-23');assert.equal(rows[0].ciudad,'Rosario · PRUEBA');
  assert.equal(normalize(rows[0]).fecha_limite,'2026-11-23');
});
test('UTF-8 BOM, semicolon delimiters and leading zeros survive CSV parsing; invalid UTF-8 asks for a corrected file',async()=>{
  const content='\uFEFFtitulo;descripcion;source_url;fecha_limite;referencia\r\n"Música; teatro";"Convocatoria, ficticia";https://fuente.example/qa;2026-11-23;00123\r\n';
  const workbook=await jobs.readWorkbook({name:'qa.csv',text:async()=>content},XLSX);
  const row=jobs.sheetRows(workbook,workbook.SheetNames[0],'jobs',XLSX)[0];
  assert.equal(row.titulo,'Música; teatro');assert.equal(row.referencia,'00123');assert.equal(row.fecha_limite,'2026-11-23');
  await assert.rejects(jobs.readWorkbook({name:'qa.csv',text:async()=> 'M\uFFFDsica'},XLSX),/CSV UTF-8/);
});
test('real Excel date cells in both workbook epochs become the same calendar date for jobs',async()=>{
  for(const date1904 of [false,true]){
    const sheet=XLSX.utils.json_to_sheet([{...raw,fecha_limite:date1904?44887:46349}]);
    sheet.D2.z='yyyy-mm-dd';
    const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,sheet,'Bolsa');
    workbook.Workbook={WBProps:{date1904}};
    const bytes=XLSX.write(workbook,{type:'buffer',bookType:'xlsx'});
    const parsed=await jobs.readWorkbook({name:'qa.xlsx',arrayBuffer:async()=>bytes},XLSX);
    const row=jobs.sheetRows(parsed,'Bolsa','jobs',XLSX)[0];
    assert.equal(row.fecha_limite,'2026-11-23');assert.equal(normalize(row).fecha_limite,'2026-11-23');
    assert.equal(typeof jobs.sheetRows(parsed,'Bolsa','artists',XLSX)[0].fecha_limite,'number');
  }
});
test('Admin serves the pinned supported spreadsheet library locally and removes the obsolete npm CDN version',()=>{
  assert.equal(XLSX.version,'0.20.3');assert.match(html,/src="\/vendor\/xlsx-0\.20\.3\.full\.min\.js"/);
  assert.doesNotMatch(html,/xlsx@0\.18\.5/);
});
