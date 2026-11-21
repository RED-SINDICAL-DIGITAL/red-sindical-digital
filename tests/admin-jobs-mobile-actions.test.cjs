const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const admin=readFileSync(join(__dirname,'..','admin.html'),'utf8');
const jobs=admin.slice(admin.indexOf('function renderJobs(){'),admin.indexOf('window.manageJobApplication=',admin.indexOf('function renderJobs(){')));
test('job tables have horizontal scrolling without clipped management actions',()=>{
 assert.match(admin,/\.jobs-table-wrap\{max-width:100%;overflow-x:auto/);
 assert.match(admin,/\.jobs-table-wrap \.table\{min-width:1100px\}/);
 assert.match(admin,/\.jobs-table-wrap \.btn\{flex:0 0 auto;white-space:nowrap!important/);
 assert.match(jobs,/body\.replace\('class="table-wrap"','class="table-wrap jobs-table-wrap" role="region"/);
 assert.match(jobs,/tabindex="0"/);
 assert.match(jobs,/Deslizá la tabla para ver todas las acciones/);
});
test('all current operations and status checks in Bolsa remain available',()=>{
 for(const term of ['manageJobApplication(','saveJobApplicationStatus(','editJob(','toggleJobVisibility(','deleteJob(','bolsa_trabajo/postulaciones/estado']){
  assert(admin.includes(term),term);
 }
 assert.match(admin,/if\(!allowed\.includes\(estado\)\)/);
 assert.match(admin,/result\?\.success!==true\|\|result\.id!==item\.id\|\|result\.estado!==estado/);
});
test('Admin inline scripts parse cleanly',()=>{
 for(const m of admin.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});
