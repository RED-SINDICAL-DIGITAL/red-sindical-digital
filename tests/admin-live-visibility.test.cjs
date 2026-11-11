const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync('admin.html','utf8'),code=html.slice(html.indexOf('function renderLive(){'),html.indexOf('window.configureModules='));
function render(signals){const node={innerHTML:''};const stats={};const ctx={S:{cache:{live:signals,config:{modules:{iptv:true,podcasts:true}}}},arr:x=>x,obj:x=>x,effectiveModules:x=>x.modules,$:()=>node,head:()=>'',table:()=>'',esc:String,stat:(icon,label,value)=>{stats[label]=value;return ''}};vm.runInNewContext(code,ctx);ctx.renderLive();return{html:node.innerHTML,stats};}
test('hidden manual signals remain stored and Admin explains why the public catalog is empty',()=>{
 const data=[{nombre:'Beat TV',activa:false},{nombre:'QA',activa:false}];const out=render(data);
 assert.equal(out.stats['Señales visibles'],'0 de 2');assert.match(out.html,/Todas las señales guardadas están ocultas/);
 assert.equal(data.every(x=>x.activa===false),true);
});
test('admin counts public signals without counting hidden or disabled sources',()=>{
 const out=render([{nombre:'Publicada',activa:true},{nombre:'Oculta',activa:false},{nombre:'Retirada',estado:'hidden'}]);
 assert.equal(out.stats['Señales visibles'],'1 de 3');assert.doesNotMatch(out.html,/Todas las señales guardadas están ocultas/);
});
