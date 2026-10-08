import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
globalThis.crypto ||= webcrypto;
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const rows=new Map();
const db={prepare(sql){
  const statement={run:async()=>({meta:{changes:0}})};
  statement.bind=(...args)=>({
    first:async()=>rows.get(args[0])||null,
    run:async()=>{
      if(sql.startsWith('INSERT')){
        if(rows.has(args[0]))return{meta:{changes:0}};
        rows.set(args[0],{id:args[0],data_json:args[1],revision:args[2]});return{meta:{changes:1}};
      }
      if(sql.startsWith('UPDATE')){
        const row=rows.get(args[3]);if(!row||row.revision!==args[4])return{meta:{changes:0}};
        rows.set(args[3],{...row,data_json:args[0],revision:args[1]});return{meta:{changes:1}};
      }
      return{meta:{changes:0}};
    }
  });return statement;
}};
const secret='UAC-'+'a'.repeat(64),env={DB:db};
async function send(method,body,code=secret,bindings=env){const r=await worker.fetch(new Request('https://example.invalid/api/account',{method,headers:{Authorization:'Bearer '+code},...(body?{body:JSON.stringify(body)}:{})}),bindings,{});return{status:r.status,headers:r.headers,data:await r.json()}}
assert.equal((await send('GET',null,'guess')).status,401);
assert.equal((await send('GET',null,secret,{})).status,503);
assert.equal((await send('GET')).status,404);
assert.equal((await send('POST',{data:{uadav_artist_access_token_v1:'secret'}})).status,400);
assert.equal((await send('POST',{data:{uadav_user_v11:{photo:'javascript:alert(1)'}}})).status,400);
const created=await send('POST',{data:{uadav_user_v11:{name:'Marcos'},uadav_favorites_v1:[{id:'video1'}]}});assert.equal(created.status,200);assert.equal(created.data.revision,1);assert.equal(created.headers.get('cache-control'),'no-store');assert.equal([...rows.keys()].some(k=>k.includes(secret)),false);
assert.equal((await send('POST',{data:{}})).status,409);
assert.equal((await send('GET',null,'UAC-'+'b'.repeat(64))).status,404);
const body={revision:1,data:created.data.data};const results=await Promise.all([send('PUT',body),send('PUT',body)]);assert.deepEqual(results.map(x=>x.status).sort(),[200,409]);assert.equal((await send('PUT',body)).status,409);
// Client: independent keys merge; overlapping edits pause; edits during network save stay local.
const clientSource=await readFile(new URL('../uadav-account-sync.js',import.meta.url),'utf8');let remote={revision:1,data:created.data.data};const storage=new Map();let hook=null;
const win={addEventListener(){},dispatchEvent(){},parent:null};win.parent=win;
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
const context={window:win,localStorage,document:{hidden:false,querySelector:()=>null,getElementById:()=>null,addEventListener(){}},location:{href:'https://example.invalid/app.html'},crypto:webcrypto,AbortController,CustomEvent:class{},StorageEvent:class{},setTimeout:()=>1,clearTimeout(){},setInterval(){},fetch:async(_url,opt)=>{if(opt.method==='GET')return{ok:true,json:async()=>structuredClone(remote)};const b=JSON.parse(opt.body);if(b.revision!==remote.revision)return{ok:false,status:409,json:async()=>({error:'conflict'})};remote={revision:remote.revision+1,data:b.data};if(hook){hook();hook=null}return{ok:true,json:async()=>structuredClone(remote)}}};vm.runInNewContext(clientSource,context);
await win.UADAVAccount.connect(secret);localStorage.setItem('uadav_user_v11',JSON.stringify({name:'PC'}));remote.data.uadav_favorites_v1=[{id:'phone'}];remote.revision++;await win.UADAVAccount.sync();assert.equal(remote.data.uadav_user_v11.name,'PC');assert.equal(JSON.parse(localStorage.getItem('uadav_favorites_v1'))[0].id,'phone');
localStorage.setItem('uadav_user_v11',JSON.stringify({name:'PC2'}));remote.data.uadav_user_v11={name:'Phone2'};remote.revision++;await win.UADAVAccount.sync();assert.equal(win.UADAVAccount.state().conflict,true);assert.equal(remote.data.uadav_user_v11.name,'Phone2');await win.UADAVAccount.resolve('cloud');assert.equal(JSON.parse(localStorage.getItem('uadav_user_v11')).name,'Phone2');
localStorage.setItem('uadav_favorites_v1',JSON.stringify([{id:'before'}]));hook=()=>localStorage.setItem('uadav_favorites_v1',JSON.stringify([{id:'during'}]));await win.UADAVAccount.sync();assert.equal(JSON.parse(localStorage.getItem('uadav_favorites_v1'))[0].id,'during');await win.UADAVAccount.sync();assert.equal(remote.data.uadav_favorites_v1[0].id,'during');win.UADAVAccount.disconnect();assert.equal(localStorage.getItem('uadav_account_access_v1'),null);assert.ok(localStorage.getItem('uadav_user_v11'));
console.log('PASS: private account isolation, hashed secret, validation, concurrent CAS, client merge, conflict choice and in-flight preservation');
