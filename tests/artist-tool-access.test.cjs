const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function client(fetch){
 const values=new Map([['uadav_account_access_v1','account-A'],['uadav_artist_access_token_v1','old-session'],['uadav_artist_account_session_v1','artist-A']]);
 const localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 const context={localStorage,fetch,Headers,AbortController,DOMException,URLSearchParams,setTimeout,clearTimeout,location:{search:''},document:{readyState:'loading',addEventListener(){}},addEventListener(){},UADAV_API_BASE:'https://staging.example/api/'};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../uadav-artist-account-v142.js'),'utf8'),context);
 return {api:context.UADAVArtistAccount,localStorage};
}
test('concurrent tools renew once and keep their original artist identity',async()=>{
 let renewals=0;const auth=[];
 const {api,localStorage}=client(async(url,opt)=>{
  if(url.endsWith('account/artist-session')){renewals++;assert.equal(JSON.parse(opt.body).artist_id,'artist-A');await new Promise(r=>setTimeout(r,5));return {ok:true,json:async()=>({token:'new-session'})};}
  auth.push(opt.headers.get('Authorization'));return {status:opt.headers.get('Authorization')==='Bearer old-session'?401:200};
 });
 const first=api.requester('old-session'),second=api.requester('old-session');
 localStorage.setItem('uadav_artist_account_session_v1','artist-B');
 const results=await Promise.all([first('https://staging.example/api/tool'),second('https://staging.example/api/tool')]);
 assert.equal(renewals,1);assert.deepEqual(results.map(r=>r.status),[200,200]);assert.equal(auth.filter(a=>a==='Bearer new-session').length,2);
});
test('revocation does not renew or retry a forbidden tool request',async()=>{
 let calls=0;const {api}=client(async()=>{calls++;return {status:403};});
 assert.equal((await api.requester('old-session')('https://staging.example/api/tool')).status,403);assert.equal(calls,1);
});
test('account switch during renewal prevents storing or retrying the old session',async()=>{
 let calls=0;let storage;const {api,localStorage}=client(async(url)=>{
  calls++;if(url.endsWith('account/artist-session')){storage.setItem('uadav_account_access_v1','account-B');return {ok:true,json:async()=>({token:'wrong-session'})};}return {status:401};
 });storage=localStorage;
 await assert.rejects(api.requester('old-session')('https://staging.example/api/tool'),/La cuenta cambió/);
 assert.equal(calls,2);assert.equal(localStorage.getItem('uadav_artist_access_token_v1'),'old-session');
});
test('cancelled request does not retry after session renewal',async()=>{
 const controller=new AbortController();let calls=0;const {api}=client(async(url)=>{
  calls++;if(url.endsWith('account/artist-session')){controller.abort();return {ok:true,json:async()=>({token:'new-session'})};}return {status:401};
 });
 await assert.rejects(api.requester('old-session')('https://staging.example/api/tool',{signal:controller.signal}),{name:'AbortError'});assert.equal(calls,2);
});
