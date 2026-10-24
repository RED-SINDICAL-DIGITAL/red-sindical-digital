// Staging regression test: node tests/bolsa-public-policy.test.cjs
// Reads the actual shared policy from worker.js; no network or secrets required.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const worker=fs.readFileSync(require('node:path').join(__dirname,'..','worker.js'),'utf8');
const extract=(name)=>{
  const start=worker.indexOf('const '+name+'=');
  assert.ok(start>=0,'missing '+name);
  const end=worker.indexOf(';',start);
  assert.ok(end>start,'unterminated '+name);
  return worker.slice(start,end+1);
};
const runtime=fs.readFileSync(require('node:path').join(__dirname,'..','scripts/job-store-runtime.js'),'utf8');
const source=[runtime,extract('jobPublicKeys'),extract('jobIsPublic'),extract('publicJob'),
 '({jobIsPublic,publicJob})'].join('\n');
const {jobIsPublic,publicJob}=vm.runInNewContext(source,{Date,Intl,Set,Object,String});
const job={id:'JOB-QA',titulo:'Casting',activo:true,estado:'activa',fecha_limite:'2099-12-31',ciudad:'Rosario',
 contacto:'privado',contacto_email:'privado@example.invalid',owner_access_hash:'secret',request_id:'req',token:'secret',clave_contratante:'secret',email:'private@example.invalid',turnstile_token:'private'};
assert.equal(jobIsPublic(job),true);
for(const state of ['cerrada_por_contratante','cerrada','cerrado','cancelado','vencido','paused','rechazada','archivada']){
 assert.equal(jobIsPublic({...job,estado:state}),false,'must hide '+state);
}
assert.equal(jobIsPublic({...job,activo:false}),false);
assert.equal(jobIsPublic({...job,fecha_limite:'2000-01-01'}),false);
assert.equal(jobIsPublic({...job,estado:'activa',fecha_limite:'not-a-date'}),false);
assert.equal(jobIsPublic({...job,estado:'activa',fecha_limite:''}),true);
assert.equal(jobIsPublic({...job,estado:'activa',activo:true}),true);
assert.equal(jobIsPublic({...job,estado:'cancelada'}),false);
assert.equal(jobIsPublic({...job,estado:'activa',status:'closed'}),false);
assert.equal(jobIsPublic({...job,fecha_limite:'2099-02-31'}),false);
assert.equal(jobIsPublic({...job,estado:'pendiente_revision'}),false);
// El estado real emitido por gestionar/cerrar debe estar oculto, aunque activo fuese true por error.
assert.ok(worker.includes("rows[i].estado='cerrada_por_contratante'"),'missing owner close status');
assert.ok(worker.includes("rows[i].estado='activa'"),'missing owner renew status');
assert.equal(jobIsPublic({...job,estado:'cerrada_por_contratante',activo:true}),false);
assert.equal(jobIsPublic({...job,estado:'activa',activo:true,fecha_limite:'2099-12-31'}),true);
// Las convocatorias externas conservan metadatos públicos indispensables.
const external=publicJob({...job,source:'Organismo público',application_mode:'external_url',region_scope:'international',source_url:'https://example.org/oferta'});
assert.equal(external.source,'Organismo público');
assert.equal(external.application_mode,'external_url');
assert.equal(external.region_scope,'international');
assert.equal(external.source_url,'https://example.org/oferta');
const safe=publicJob(job);
assert.equal(safe.id,'JOB-QA');
assert.equal(safe.ciudad,'Rosario');
for(const privateField of ['contacto','contacto_email','owner_access_hash','request_id','token','clave_contratante','email','turnstile_token']){
 assert.ok(!(privateField in safe),'private field leaked: '+privateField);
}
assert.equal((worker.match(/filter\(jobIsPublic\)/g)||[]).length,2,'catalog and federation must use same visibility policy');
assert.ok(worker.includes('map(publicJob)'),'catalog must use shared projection');
assert.ok(worker.includes('...publicJob(job)'),'federation must use shared projection');
console.log('OK: public policy and private field regression checks');
