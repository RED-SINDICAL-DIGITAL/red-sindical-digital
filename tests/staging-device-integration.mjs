import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
const base=new URL(process.env.UADAV_STAGING_API||'');
assert.equal(base.protocol,'https:');assert.match(base.hostname,/^uadav-api-staging\.[a-z0-9-]+\.workers\.dev$/i);assert.equal(base.pathname,'/api/');assert.equal(base.search,'');assert.equal(base.hash,'');assert.equal(base.username,'');assert.equal(base.password,'');
const source=await readFile(new URL('../uadav-account-sync.js',import.meta.url),'utf8');
function device(userAgent){
 const values=new Map(),localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const window={UADAV_API_BASE:base.href,addEventListener(){},dispatchEvent(){}};window.parent=window;
 const context={window,localStorage,navigator:{userAgent,onLine:true},document:{hidden:false,readyState:'complete',getElementById:()=>null,querySelector:()=>null,addEventListener(){}},location:{href:base.origin+'/staging-test'},crypto:webcrypto,AbortController,CustomEvent:class{},StorageEvent:class{},setTimeout,clearTimeout,setInterval(){},fetch:async(url,opt)=>{
  const target=new URL(url);assert.equal(target.origin,base.origin);assert(target.pathname.startsWith('/api/'));
  return fetch(target,{...opt,redirect:'error',headers:{...opt.headers,Origin:base.origin}});
 }};
 vm.runInNewContext(source,context);return {service:window.UADAVAccount,localStorage};
}
const pc=device('Staging Desktop'),mobile=device('Staging Android');
pc.localStorage.setItem('uadav_user_v11',JSON.stringify({name:'PRUEBA STAGING · DISPOSITIVOS',avatar:'T'}));
pc.localStorage.setItem('uadav_favorites_v1',JSON.stringify([{id:'synthetic-pc-item'}]));
await pc.service.create();const pairing=await pc.service.pairingCreate();
const secret=mobile.service.newDeviceSecret(),joined=await mobile.service.join({code:pairing.code,name:'Celular ficticio de staging'},secret);
assert.equal((await mobile.service.joinStatus(joined.id,secret)).state,'requested');
await pc.service.pairingApprove(joined.id,joined.verification);
assert.equal((await mobile.service.joinStatus(joined.id,secret)).state,'approved');
await mobile.service.connect(secret);
assert.equal(JSON.parse(mobile.localStorage.getItem('uadav_user_v11')).name,'PRUEBA STAGING · DISPOSITIVOS');
assert.equal(JSON.parse(mobile.localStorage.getItem('uadav_favorites_v1'))[0].id,'synthetic-pc-item');
mobile.localStorage.setItem('uadav_following_v1',JSON.stringify([{id:'synthetic-mobile-artist'}]));
await mobile.service.sync();await pc.service.sync();
assert.equal(JSON.parse(pc.localStorage.getItem('uadav_following_v1'))[0].id,'synthetic-mobile-artist');
const list=await pc.service.devices();assert.equal(list.devices.length,2);assert(list.devices.every(x=>x.expires_at===0));
const other=list.devices.find(x=>!x.current);assert(other);await pc.service.revoke(other.id);
await assert.rejects(mobile.service.devices(),e=>e.status===401&&e.code==='DEVICE_REVOKED');
await mobile.service.sync();assert.equal(mobile.service.state().linked,false,'revoked device must no longer appear linked');assert.match(mobile.service.state().message,/perdió su acceso/);
assert.equal(JSON.parse(mobile.localStorage.getItem('uadav_user_v11')).name,'PRUEBA STAGING · DISPOSITIVOS');
console.log('PASS: actual account client + remote staging D1; device approval, independent credentials, bidirectional synchronization, persistent device grants, revocation and local data preservation. Synthetic account retained; no credentials logged.');
