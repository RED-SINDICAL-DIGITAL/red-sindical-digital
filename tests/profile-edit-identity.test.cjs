const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const page=fs.readFileSync(path.join(__dirname,'../usuario.html'),'utf8');
const code=page.slice(page.indexOf('// Profile edit identity and asynchronous photo protection.'),page.indexOf('// End profile edit identity protection.'));
function setup(){
 let identity='device-A',writes=0,paints=0;const readers=[],images=[],alerts=[],events={},nodes={photo:{files:[{size:100}],value:'file'},profileName:{value:''},profileDialog:{showModal(){this.open=true},close(){this.open=false}}};
 const ctx={window:{UADAVAccount:{code:()=>identity},addEventListener:(name,fn)=>events[name]=fn},$:id=>nodes[id],user:{name:'Account A',photo:'original'},save(){writes++},paint(){paints++},alert:message=>alerts.push(message),document:{createElement:()=>({getContext:()=>({drawImage(){}}),toDataURL:()=> 'new-photo'})},FileReader:class{constructor(){readers.push(this)}readAsDataURL(){this.result='read-data'}},Image:class{constructor(){images.push(this);this.width=this.height=100}}};
 vm.runInNewContext(code,ctx);return {ctx,nodes,readers,images,alerts,change(value){identity=value;events['uadav:account']?.()},writes:()=>writes};
}
test('photo selected in one account cannot be applied after switching accounts',()=>{
 const h=setup();h.ctx.loadProfilePhoto();h.readers[0].onload();h.change('device-B');h.images[0].onload();assert.equal(h.writes(),0);assert.equal(h.ctx.user.photo,'original');
});
test('removing photo prevents a late image load from restoring it',()=>{
 const h=setup();h.ctx.loadProfilePhoto();h.readers[0].onload();h.ctx.removeProfilePhoto();h.images[0].onload();assert.equal(h.ctx.user.photo,'');assert.equal(h.writes(),1);
});
test('only the most recently selected photo can finish saving',()=>{
 const h=setup();h.ctx.loadProfilePhoto();h.readers[0].onload();h.ctx.loadProfilePhoto();h.readers[1].onload();h.images[0].onload();assert.equal(h.writes(),0);h.images[1].onload();assert.equal(h.writes(),1);assert.equal(h.ctx.user.photo,'new-photo');assert.equal(h.nodes.photo.value,'');
});
test('name dialog opened before account switch cannot rename the new account',()=>{
 const h=setup();h.ctx.beginProfileEdit();h.change('device-B');h.nodes.profileName.value='Old dialog name';h.ctx.submitProfileEdit({preventDefault(){}});assert.equal(h.writes(),0);assert.equal(h.ctx.user.name,'Account A');assert.match(h.alerts[0],/cuenta cambió/);assert.equal(h.nodes.profileDialog.open,false);
});
test('same-account name edit remains available',()=>{
 const h=setup();h.ctx.beginProfileEdit();h.nodes.profileName.value='Updated name';h.ctx.submitProfileEdit({preventDefault(){}});assert.equal(h.ctx.user.name,'Updated name');assert.equal(h.writes(),1);
});
test('failed image read preserves existing photo and explains how to retry',()=>{
 const h=setup();h.ctx.loadProfilePhoto();h.readers[0].onerror();assert.equal(h.writes(),0);assert.equal(h.ctx.user.photo,'original');assert.match(h.alerts[0],/otra foto/);
});
