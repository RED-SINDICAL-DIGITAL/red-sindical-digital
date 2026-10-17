const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../uadav-account-sync.js'),'utf8');
function client(fetch){
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 const window={UADAV_API_BASE:'https://isolated.example/api/',addEventListener(){},dispatchEvent(){}};window.parent=window;
 const document={readyState:'loading',addEventListener(){},getElementById:()=>null,querySelector:()=>null};
 vm.runInNewContext(source,{window,document,localStorage:storage,fetch,AbortController,setTimeout:()=>0,clearTimeout(){},setInterval(){},navigator:{onLine:true},CustomEvent:class{},StorageEvent:class{},location:{href:'https://isolated.example/'}});
 storage.setItem('uadav_account_access_v1','UAD-'+'a'.repeat(64));
 return {service:window.UADAVAccount,storage};
}
const reply=data=>({ok:true,json:async()=>data});
const profile=(name,avatar)=>({uadav_user_v11:{name,avatar}});
function seed(storage,data){storage.setItem('uadav_account_base_v1',JSON.stringify({revision:1,data}));for(const [k,v] of Object.entries(data))storage.setItem(k,JSON.stringify(v));}
test('independent name and avatar edits merge without losing either device change',async()=>{
 let sent;const c=client(async(url,opt)=>opt.method==='GET'?reply({revision:2,data:profile('Base','remote-photo')}):(sent=JSON.parse(opt.body),reply({revision:3,data:sent.data})));
 seed(c.storage,profile('Base','old-photo'));c.storage.setItem('uadav_user_v11',JSON.stringify({name:'Local name',avatar:'old-photo'}));
 await c.service.sync();assert.deepEqual(sent.data.uadav_user_v11,{name:'Local name',avatar:'remote-photo'});assert.equal(c.service.state().conflict,false);
 assert.deepEqual(JSON.parse(c.storage.getItem('uadav_user_v11')),sent.data.uadav_user_v11);
});
test('conflicting name edits require choice and cloud choice retains non-conflicting local changes',async()=>{
 let sent,writes=0;const c=client(async(url,opt)=>opt.method==='GET'?reply({revision:2,data:profile('Remote name','old-photo')}):(writes++,sent=JSON.parse(opt.body),reply({revision:3,data:sent.data})));
 seed(c.storage,profile('Base','old-photo'));c.storage.setItem('uadav_user_v11',JSON.stringify({name:'Local name',avatar:'local-photo'}));
 await c.service.sync();assert.equal(c.service.state().conflict,true);assert.equal(writes,0);
 await c.service.resolve('cloud');assert.equal(writes,1);assert.deepEqual(sent.data.uadav_user_v11,{name:'Remote name',avatar:'local-photo'});assert.equal(c.service.state().conflict,false);
});
test('typing during a pending save remains local and is sent on the next synchronization',async()=>{
 let release,started;const pending=new Promise(r=>release=r),ready=new Promise(r=>started=r);let writes=0,remote={revision:1,data:profile('Base','photo')};
 const c=client(async(url,opt)=>{if(opt.method==='GET')return reply(remote);const body=JSON.parse(opt.body);writes++;if(writes===1){started();await pending;}remote={revision:remote.revision+1,data:body.data};return reply(remote);});
 seed(c.storage,remote.data);c.storage.setItem('uadav_user_v11',JSON.stringify({name:'First edit',avatar:'photo'}));
 const saving=c.service.sync();await ready;c.storage.setItem('uadav_user_v11',JSON.stringify({name:'Continued typing',avatar:'photo'}));release();await saving;
 assert.equal(JSON.parse(c.storage.getItem('uadav_user_v11')).name,'Continued typing');assert.equal(remote.data.uadav_user_v11.name,'First edit');
 await c.service.sync();assert.equal(remote.data.uadav_user_v11.name,'Continued typing');assert.equal(writes,2);
});
test('disconnect during a pending read cannot restore the old account or overwrite local edits',async()=>{
 let release;const pending=new Promise(r=>release=r);const c=client(async()=>{await pending;return reply({revision:2,data:profile('Remote old account','photo')});});
 seed(c.storage,profile('Local kept','photo'));const saving=c.service.sync();c.service.disconnect();release();await saving;
 assert.equal(c.service.state().linked,false);assert.equal(JSON.parse(c.storage.getItem('uadav_user_v11')).name,'Local kept');
});
