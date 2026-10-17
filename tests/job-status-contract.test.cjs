const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const worker=fs.readFileSync(require('node:path').join(__dirname,'../worker.js'),'utf8');
const page=fs.readFileSync(require('node:path').join(__dirname,'../bolsa-trabajo.html'),'utf8');
test('el Worker tiene consulta privada con clave y hash',()=>{
 assert.match(worker,/\/api\/bolsa_trabajo\/mi-postulacion/);
 assert.match(worker,/consulta_hash===digest/);
 assert.match(worker,/uadavDigest\(secret\)/);
});
test('la respuesta de consulta no expone datos personales',()=>{
 const start=worker.indexOf("if (path === '/api/bolsa_trabajo/mi-postulacion'");
 const end=worker.indexOf("if (path === '/api/bolsa_trabajo/postular'",start);
 assert.ok(start>=0&&end>start);
 const route=worker.slice(start,end);
 assert.match(route,/estado:item\.estado/);
 assert.doesNotMatch(route,/email:item\.email|nombre:item\.nombre|consulta_hash:item\.consulta_hash/);
 assert.match(route,/429/);
});
test('la lista administrativa omite hash y requiere autorización',()=>{
 assert.match(worker,/items\.map\(\(\{consulta_hash,\.\.\.item\}\)=>item\)/);
});
test('el formulario de consulta usa el endpoint privado',()=>{
 assert.match(page,/id="jobStatusForm"/);
 assert.match(page,/bolsa_trabajo\/mi-postulacion/);
 assert.match(page,/id="applyReceiptKey"/);
});
