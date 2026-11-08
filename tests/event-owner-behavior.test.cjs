const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const source=readFileSync(join(__dirname,'..','worker.js'),'utf8');
const begin=source.indexOf("if(path==='/api/eventos/mis')"),end=source.indexOf("if(path==='/api/eventos/receipt'",begin);
assert(begin>0&&end>begin,'Owner endpoint must be present');
const ownerRoute=source.slice(begin,end);
function harness({method='GET',owner='A',requestOwner='A',origin='https://uadav-stream-staging.pages.dev',body={},enabled=true,conflict=false}={}){
 const event={id:'EV-123',titulo:'Recital',nombre:'Recital',fecha:'2026-12-10',fecha_inicio:'2026-12-10',hora:'20:00',lugar:'Teatro',ciudad:'Rosario',descripcion_corta:'Evento',estado:'published',created_by_account_id:owner};
 const row={id:event.id,status:event.estado,title:event.titulo,start_date:event.fecha,data_json:JSON.stringify(event)};
 const mutations=[],queries=[];
 const env={DB:{prepare(sql){queries.push(sql);return {bind(...params){
    return {
      async all(){return {results:owner===requestOwner?[row]:[]}},
      async first(){return owner===requestOwner&&params[0]===row.id?row:null}
    };
  }}}}};
 const headers={get(name){if(name==='Origin')return origin;if(name==='Authorization')return requestOwner==='INVALID'?'':'Bearer '+requestOwner;return ''}};
 const request={method,headers,async json(){return body}};
 const context={
  path:'/api/eventos/mis',request,env,atomicEventsEnabled:enabled,hasD1:()=>enabled,
  aeIdentity:async()=>{if(requestOwner==='INVALID')throw Error('not authenticated');return {accountId:requestOwner}},
  json:(data,status=200)=>({body:data,status,headers:{set(){}}}),
  isoNow:()=>new Date('2026-11-07T23:00:00Z').toISOString(),
  mutateCanonicalEvent:async(before,after)=>{mutations.push({before,after});return {conflict}},
  uadavEventScheduleError:()=>null,
  uadavSecurityJSON:async(_request,max)=>{const payload=JSON.stringify(body);if(Buffer.byteLength(payload,'utf8')>max)throw Object.assign(Error('Too large'),{status:413});return JSON.parse(payload)},
  Object,JSON,Array,String
 };
 const script=new vm.Script('(async()=>{'+ownerRoute+'return {status:404};})()');
 return {run:()=>script.runInNewContext(context),mutations,queries};
}
test('authenticated owner lists own events with no private contact fields',async()=>{
 const h=harness(),res=await h.run();
 assert.equal(res.status,200);assert.equal(res.body.success,true);
 assert.equal(res.body.items.length,1);assert.equal(res.body.items[0].titulo,'Recital');
 assert.equal(res.body.items[0].contacto_email,undefined);
 assert(h.queries.some(sql=>sql.includes('created_by_account_id')));
});
test('account B cannot see or mutate account A events',async()=>{
 const other=await harness({requestOwner:'B'}).run();assert.equal(other.status,200);assert.equal(other.body.items.length,0);
 const h=harness({method:'POST',requestOwner:'B',body:{id:'EV-123',action:'hide'}});
 const response=await h.run();assert.equal(response.status,404);assert.equal(h.mutations.length,0);
});
test('invalid credentials, wrong origin and disabled staging are denied',async()=>{
 assert.equal((await harness({requestOwner:'INVALID'}).run()).status,401);
 assert.equal((await harness({method:'POST',origin:'https://example.com',body:{id:'EV-123',action:'hide'}}).run()).status,403);
 assert.equal((await harness({enabled:false}).run()).status,503);
});
test('owner can hide or publish with conflict protection',async()=>{
 const h=harness({method:'POST',body:{id:'EV-123',action:'hide'}});
 const response=await h.run();assert.equal(response.status,200);assert.equal(response.body.estado,'hidden');
 assert.equal(h.mutations.length,1);assert.equal(h.mutations[0].after.estado,'hidden');
 const bad=harness({method:'POST',body:{id:'EV-123',action:'hide'},conflict:true});
 assert.equal((await bad.run()).status,409);
});
test('owned editing accepts text fields without changing owner or payment flags',async()=>{
 const h=harness({method:'POST',body:{id:'EV-123',action:'edit',patch:{titulo:'Nuevo recital',ciudad:'Santa Fe'}}});
 const r=await h.run();assert.equal(r.status,200);assert.equal(h.mutations.length,1);
 assert.equal(h.mutations[0].after.titulo,'Nuevo recital');
 assert.equal(h.mutations[0].after.nombre,'Nuevo recital');
 assert.equal(h.mutations[0].after.created_by_account_id,'A');
 assert.equal(h.mutations[0].after.estado,'published');
});
test('attempts to escalate privileges through edit patch are rejected',async()=>{
 for(const patch of [{created_by_account_id:'B'},{destacado_pagado:'true'},{titulo:''},{precio:'0'},{titulo:123}]){
  const h=harness({method:'POST',body:{id:'EV-123',action:'edit',patch}});
  const res=await h.run();assert.equal(res.status,400,JSON.stringify(patch));assert.equal(h.mutations.length,0);
 }
});

test('owner endpoint rejects oversized edits before querying D1',async()=>{
 const h=harness({method:'POST',body:{id:'EV-123',action:'edit',patch:{titulo:'x'.repeat(5000)}}});
 const result=await h.run();
 assert.equal(result.status,413);assert.equal(h.mutations.length,0);assert.equal(h.queries.length,0);
});
