const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','admin.html'),'utf8');

test('Admin lists unique application ID separately from parent job ID',()=>{
 assert.match(html,/\['Postulación \/ oportunidad','Artista','Contacto','Fecha','Estado','Gestión'\]/);
 assert.match(html,/\$\{esc\(a\.id\|\|'—'\)\}/);
 assert.match(html,/Oferta: \$\{esc\(a\.job_id\|\|'—'\)\}/);
 assert.match(html,/white-space:nowrap[^\x60]*manageJobApplication/);
});
test('Admin status dialog displays both IDs and keeps server update keyed to application',()=>{
 const at=html.indexOf('window.manageJobApplication=i=>');
 const end=html.indexOf('let jobSavePending=',at);
 assert(at>=0&&end>at);
 const part=html.slice(at,end);
 assert.match(part,/Postulación:<\/strong> \$\{esc\(item\.id\|\|'—'\)\}/);
 assert.match(part,/Oferta:<\/strong> \$\{esc\(item\.job_id\|\|'—'\)\}/);
 assert.match(part,/body:\{id:item\.id,estado\}/);
 assert.doesNotMatch(part,/body:\{id:item\.job_id,estado\}/);
});
