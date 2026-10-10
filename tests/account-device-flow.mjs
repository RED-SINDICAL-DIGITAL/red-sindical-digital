import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||=webcrypto;
const workerSource=await readFile(new URL('../worker.js',import.meta.url),'utf8'),clientSource=await readFile(new URL('../uadav-account-sync.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(workerSource).toString('base64'));
const DB=sqliteD1();
function device(name){
 const storage=new Map(),win={addEventListener(){},dispatchEvent(){},parent:null};win.parent=win;
 const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 const context={window:win,localStorage,navigator:{userAgent:name},document:{hidden:false,readyState:'complete',querySelector:()=>null,getElementById:()=>null,addEventListener(){}},location:{href:'https://uadavstream.com.ar/app.html'},crypto:webcrypto,AbortController,CustomEvent:class{},StorageEvent:class{},setTimeout:()=>1,clearTimeout(){},setInterval(){},fetch:async(url,opt)=>worker.fetch(new Request(url,{...opt,headers:{...opt.headers,Origin:'https://uadavstream.com.ar','CF-Connecting-IP':name}}),{DB},{})};
 vm.runInNewContext(clientSource,context);return{service:win.UADAVAccount,storage,localStorage};
}
try{
 const pc=device('Desktop'),phone=device('Android');pc.localStorage.setItem('uadav_user_v11',JSON.stringify({name:'Marcos'}));pc.localStorage.setItem('uadav_favorites_v1',JSON.stringify([{id:'PC-video'}]));
 const root=await pc.service.create(),pair=await pc.service.pairingCreate();assert.match(pc.service.code(),/^UAD-/);assert.equal(pc.service.recovery(),root);
 const credential=phone.service.newDeviceSecret(),joined=await phone.service.join({code:pair.code,name:'Mi celular'},credential);
 assert.equal((await phone.service.joinStatus(joined.id,credential)).state,'requested');assert.equal(phone.service.state().linked,false);
 await pc.service.pairingApprove(joined.id,joined.verification);assert.equal((await phone.service.joinStatus(joined.id,credential)).state,'approved');await phone.service.connect(credential);
 const deviceHash=Array.from(new Uint8Array(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(credential))),x=>x.toString(16).padStart(2,'0')).join('');
 assert.equal((await DB.prepare('SELECT expires_at FROM audience_devices WHERE credential_hash=?').bind(deviceHash).first()).expires_at,0,'approved device has no expiry');
 const realNow=Date.now;Date.now=()=>realNow()+366*86400000;
 try{await phone.service.sync();assert.equal(phone.service.state().linked,true,'device stays signed in beyond one year');assert.equal((await DB.prepare('SELECT expires_at FROM audience_devices WHERE credential_hash=?').bind(deviceHash).first()).expires_at,0,'persistent device remains non-expiring')}finally{Date.now=realNow}
 assert.equal(JSON.parse(phone.localStorage.getItem('uadav_user_v11')).name,'Marcos');assert.equal(phone.service.recovery(),'');assert.equal(phone.service.code().includes(root),false);
 phone.localStorage.setItem('uadav_following_v1',JSON.stringify([{id:'artist-phone'}]));pc.localStorage.setItem('uadav_favorites_v1',JSON.stringify([{id:'PC-new'}]));await phone.service.sync();await pc.service.sync();await phone.service.sync();assert.equal(JSON.parse(pc.localStorage.getItem('uadav_following_v1'))[0].id,'artist-phone');assert.equal(JSON.parse(phone.localStorage.getItem('uadav_favorites_v1'))[0].id,'PC-new');
 const devices=await pc.service.devices(),other=devices.devices.find(d=>!d.current);assert.ok(other);await pc.service.revoke(other.id);await phone.service.sync();assert.match(phone.service.state().message,/perdió su acceso/);assert.equal(JSON.parse(phone.localStorage.getItem('uadav_user_v11')).name,'Marcos');
 const newRoot=await pc.service.rotateRecovery();assert.notEqual(newRoot,root);assert.equal(pc.service.recovery(),newRoot);assert.match(pc.service.code(),/^UAD-/);
 console.log('PASS: two independent browser stores, complete approval, independent device credentials, cross-device merge, revocation and recovery rotation through actual Worker + SQLite');
}finally{DB.close()}
