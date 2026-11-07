const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','bolsa-trabajo.html'),'utf8');
const start=html.indexOf('function updateArtistAttachAvailability()');
const end=html.indexOf('function updateApplyPreview()',start);
assert(start>0&&end>start);
const source=html.slice(start,end);
function run(token){
 const control={checked:true,disabled:false};
 const message={textContent:'',children:[],appendChild(a){this.children.push(a)}};
 const nodes={applyAttachProfile:control,applyArtistAvailability:message};
 const document={getElementById:id=>nodes[id],createElement:()=>({href:'',textContent:''})};
 const localStorage={getItem:()=>token};
 const context={document,localStorage};
 vm.runInNewContext(source+'\nupdateArtistAttachAvailability();',context);
 return {control,message};
}
test('unlinked applicant sees explanation, link to Mi Perfil and no false selection',()=>{
 const x=run(null);
 assert.equal(x.control.disabled,true);
 assert.equal(x.control.checked,false);
 assert.match(x.message.textContent,/Podés postularte sin adjuntarlo/);
 assert.equal(x.message.children[0].href,'/usuario.html');
});
test('linked artist can opt in to attach their managed profile',()=>{
 const x=run('synthetic-artist-token');
 assert.equal(x.control.disabled,false);
 assert.equal(x.control.checked,true);
 assert.match(x.message.textContent,/voluntariamente/);
 assert.equal(x.message.children.length,0);
});
test('public job form keeps profile attachment optional',()=>{
 assert.match(html,/id="applyAttachProfile"/);
 assert.match(html,/id="applyArtistAvailability"/);
 assert.match(html,/updateArtistAttachAvailability\(\);for\(const id of \['shareWa'/);
 assert.match(html,/artist_token:document\.getElementById\('applyAttachProfile'\)\.checked/);
});
