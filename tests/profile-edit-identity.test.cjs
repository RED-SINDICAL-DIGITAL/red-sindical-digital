const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const page=fs.readFileSync(path.join(__dirname,'../usuario.html'),'utf8');
const code=page.slice(page.indexOf('// Profile edit identity and asynchronous photo protection.'),page.indexOf('// End profile edit identity protection.'));
function setup(){
 let identity='device-A',writes=0,paints=0;const readers=[],images=[],alerts=[],events={},nodes={photo:{files:[{size:100}],value:'file'},profileName:{value:''},profileDialog:{showModal(){this.open=true},close(){this.open=false}}};
 const ctx={window:{UADAVAccount:{code:()=>identity},addEventListener:(name,fn)=>events[name]=fn},$:id=>nodes[id],user:{name:'Account A',photo:'original'},save(next){writes++;ctx.user=next;return true},paint(){paints++},alert:message=>alerts.push(message),document:{createElement:()=>({getContext:()=>({drawImage(){}}),toDataURL:()=> 'new-photo'})},FileReader:class{constructor(){readers.push(this)}readAsDataURL(){this.result='read-data'}},Image:class{constructor(){images.push(this);this.width=this.height=100}}};
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

const profileHelpers=page.slice(page.indexOf('function normalizeProfile('),page.indexOf('let user=readProfile();'));
test('optional damaged profile fields cannot break the profile view',()=>{
 const ctx={};vm.runInNewContext(profileHelpers,ctx);
 for(const raw of [null,[],false,'text']){const result=ctx.normalizeProfile(raw);assert.equal(result.name,'Mi cuenta');assert.equal(result.photo,'');assert.equal(result.preferences.length,0)}
 const result=ctx.normalizeProfile({name:' Name ',avatar:{},photo:12,preferences:['Música',null,' Música ','Radio'],email:'synthetic@example.invalid'});
 assert.equal(result.name,'Name');assert.equal(result.avatar,'Na');assert.equal(result.photo,'');assert.deepEqual(Array.from(result.preferences),['Música','Radio']);assert.equal(result.email,'synthetic@example.invalid');
});
test('profile history ignores malformed records without losing valid media',()=>{
 const ctx={localStorage:{getItem:()=>JSON.stringify([null,12,[],{}, {title:'Valid audio',url:'https://example.test/audio.mp3'}])}};vm.runInNewContext(page.slice(page.indexOf('function recent(){'),page.indexOf('function openRecent(')),ctx);assert.equal(ctx.recent().length,1);assert.equal(ctx.recent()[0].title,'Valid audio');
});
test('profile data refresh updates changed identity and preserves unchanged editing state',()=>{
 const storage=new Map([['user',JSON.stringify({name:'First'})]]),ctx={KEY:'user',photoEditVersion:0,localStorage:{getItem:k=>storage.get(k)||null},paints:0};vm.createContext(ctx);vm.runInContext(profileHelpers,ctx);ctx.user=ctx.readProfile();ctx.paint=()=>{ctx.paints++;vm.runInContext('profilePaintSignature=profileViewSignature(user)',ctx)};
 ctx.refreshProfileView();ctx.refreshProfileView();assert.equal(ctx.paints,1);assert.equal(ctx.photoEditVersion,0);
 storage.set('user',JSON.stringify({name:'Second'}));ctx.refreshProfileView();assert.equal(ctx.user.name,'Second');assert.equal(ctx.photoEditVersion,1);assert.equal(ctx.paints,2);
 storage.set('uadav_radio_favorites_v1','[{"id":"radio"}]');ctx.refreshProfileView();assert.equal(ctx.paints,3);assert.equal(ctx.photoEditVersion,1);
});
test('profile recent playback can use the supported alternate shell and retains media kind',()=>{
 const item={provider:'audio',content_type:'podcast',url:'https://example.test/audio.mp3'},played=[],ctx={window:{parent:{UADAV_APP:{playContent:x=>played.push(x)}}}};vm.runInNewContext(page.slice(page.indexOf('function openRecent('),page.indexOf('function paint(')),ctx);ctx.openRecent(item);assert.equal(played[0].provider,'audio');assert.equal(played[0].content_type,'podcast');
});
test('profile recent playback falls back to the same-origin shell bridge',()=>{
 const sent=[],ctx={window:{parent:{postMessage:(data,origin)=>sent.push({data,origin})}},location:{origin:'https://example.test'}};vm.runInNewContext(page.slice(page.indexOf('function openRecent('),page.indexOf('function paint(')),ctx);ctx.openRecent({title:'Audio'});assert.equal(sent[0].data.type,'uadav:content-play');assert.equal(sent[0].origin,'https://example.test');
});
test('profile has complete history access and no optimistic legacy artist-session link',()=>{
 assert.match(page,/href="\/biblioteca.html\?tab=recent"/);assert.doesNotMatch(page,/try\{const token=localStorage.getItem\('uadav_artist_access_token_v1'\)/);
});

test('failed name save preserves the previous profile and leaves its edit dialog open',()=>{const h=setup();h.ctx.save=()=>false;h.ctx.beginProfileEdit();h.nodes.profileName.value='Not saved';h.ctx.submitProfileEdit({preventDefault(){}});assert.equal(h.ctx.user.name,'Account A');assert.equal(h.nodes.profileDialog.open,true)});
test('failed photo save and removal do not change the displayed photo',()=>{const h=setup();h.ctx.save=()=>false;h.ctx.removeProfilePhoto();assert.equal(h.ctx.user.photo,'original');h.ctx.loadProfilePhoto();h.readers[0].onload();h.images[0].onload();assert.equal(h.ctx.user.photo,'original')});
test('storage failure cannot publish a profile sync event or replace current state',()=>{let events=0;const c={user:{name:'Old'},KEY:'profile',localStorage:{setItem(){throw Error('Quota')}},window:{dispatchEvent(){events++}},CustomEvent:class{},alert(){}};vm.runInNewContext(page.slice(page.indexOf('function save('),page.indexOf('function recent(')),c);assert.equal(c.save({name:'New'}),false);assert.equal(c.user.name,'Old');assert.equal(events,0)});
