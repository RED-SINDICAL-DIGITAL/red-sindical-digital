const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../uadav-artist-onboarding-v145.js'),'utf8');
function setup(create,linked=false){
 const values=new Map(linked?[['uadav_account_access_v1','SYNTHETIC']]:[]),elements=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{hidden:false,disabled:false,value:'',textContent:'',replaceChildren(){},focus(){this.focused=true}});return elements.get(id)};
 const ctx={document:{getElementById:element},localStorage:{getItem:k=>values.get(k)||null},location:{search:''},URLSearchParams,addEventListener(){},UADAVAccount:{create:()=>create(values)}};
 vm.runInNewContext(source,ctx);return {element,values};
}
test('first-time artist can create account in place; repeated clicks cannot duplicate creation',async()=>{
 let complete,calls=0;const h=setup(values=>{calls++;return new Promise(resolve=>{complete=()=>{values.set('uadav_account_access_v1','SYNTHETIC');resolve()}})});
 assert.equal(h.element('needAccount').hidden,false);const pending=h.element('startArtistAccount').onclick();await h.element('startArtistAccount').onclick();assert.equal(calls,1);assert.equal(h.element('startArtistAccount').disabled,true);complete();await pending;
 assert.equal(h.element('needAccount').hidden,true);assert.equal(h.element('choose').hidden,false);assert.equal(h.element('searchName').focused,true);
});
test('failed creation retains the form and provides a retry without claiming success',async()=>{
 const h=setup(async()=>{throw Error('Conexión interrumpida')});await h.element('startArtistAccount').onclick();assert.equal(h.element('needAccount').hidden,false);assert.equal(h.element('choose').hidden,true);assert.equal(h.element('startArtistAccount').disabled,false);assert.match(h.element('accountStartStatus').textContent,/Conexión interrumpida/);
});
test('existing account is preserved without creating a second identity',async()=>{
 let calls=0;const h=setup(async()=>{calls++},true);await h.element('startArtistAccount').onclick();assert.equal(calls,0);assert.equal(h.values.get('uadav_account_access_v1'),'SYNTHETIC');assert.equal(h.element('choose').hidden,false);
});
