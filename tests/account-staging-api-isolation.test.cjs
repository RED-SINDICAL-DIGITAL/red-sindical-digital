const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const source=readFileSync(join(__dirname,'..','uadav-account-sync.js'),'utf8');
const secret='UAC-'+'a'.repeat(64);
const keys=['uadav_user_v11','uadav_favorites_v1','uadav_watch_later_v1','uadav_playlists_v1','uadav_following_v1','uadav_radio_favorites_v1','uadav_recent_v11'];
const data=Object.fromEntries(keys.map(key=>[key,null]));

function fixture(href,configured){
 const memory=new Map(),calls=[],handlers={};
 const win={PLATFORM_API_BASE:configured,addEventListener:(name,cb)=>{handlers[name]=cb},dispatchEvent(){}};win.parent=win;
 const location={href};
 const ctx={window:win,location,localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)},navigator:{userAgent:'QA',onLine:true},document:{hidden:false,readyState:'complete',getElementById:()=>null,querySelector:()=>null,addEventListener(){}},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},AbortController,CustomEvent:class{},StorageEvent:class{},crypto:webcrypto,fetch:async(url)=>{calls.push(String(url));return{ok:true,json:async()=>({data,revision:1})}}};
 vm.runInNewContext(source,ctx);
 return {win,calls};
}
test('Mi Perfil staging ignores an accidental production API override',async()=>{
 const x=fixture('https://uadav-stream-staging.pages.dev/usuario.html','https://uadav-api.uadavstream.workers.dev/api/');
 await x.win.UADAVAccount.connect(secret);
 assert.equal(x.calls.length,1);
 assert.equal(x.calls[0],'https://uadav-api-staging.uadavstream.workers.dev/api/account');
});
test('Mi Perfil production respects the configured production API',async()=>{
 const x=fixture('https://uadavstream.com.ar/usuario.html','https://uadav-api.uadavstream.workers.dev/api/');
 await x.win.UADAVAccount.connect(secret);
 assert.equal(x.calls.length,1);
 assert.equal(x.calls[0],'https://uadav-api.uadavstream.workers.dev/api/account');
});
test('Mi Perfil preview Pages hostname never uses production',async()=>{
 const x=fixture('https://feature-demo.pages.dev/usuario.html','https://uadav-api.uadavstream.workers.dev/api/');
 await x.win.UADAVAccount.connect(secret);
 assert.equal(x.calls[0],'https://uadav-api-staging.uadavstream.workers.dev/api/account');
});
