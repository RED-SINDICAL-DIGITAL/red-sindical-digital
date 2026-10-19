const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../gestionar-artista.html'),'utf8');
const renew=html.match(/async function renewArtistSession\(\)\{[^\n]+\}/)[0];
const content=html.match(/async function artistContentFetch\(opt=\{\}\)\{[^\n]+\}/)[0];
function runtime(status=401,changeAccount=false){
 const values=new Map([['uadav_account_access_v1','account-A']]);let minted=[],requests=0,restores=0;
 const context={localStorage:{getItem:k=>values.get(k)||'',setItem:(k,v)=>values.set(k,v)},window:{UADAVArtistAccount:{session:async id=>{minted.push(id);if(changeAccount)values.set('uadav_account_access_v1','account-B');return 'new-token-for-'+id},restore:async()=>{restores++;return 'WRONG-ARTIST'}}},apiFetch:async(path,opt)=>{requests++;if(requests===1)throw Object.assign(Error('access failure'),{status});return {path,authorization:opt.headers.Authorization}}};
 vm.createContext(context);vm.runInContext("const ACCESS_KEY='artist-key';let token='old';let artist={id:'artist-A'};"+renew+'\n'+content,context);
 return {context,values,get minted(){return minted},get requests(){return requests},get restores(){return restores}};
}
test('expired content request renews the open artist, not another selected profile',async()=>{
 const r=runtime();const result=await r.context.artistContentFetch();assert.deepEqual(r.minted,['artist-A']);assert.equal(r.restores,0);assert.equal(result.authorization,'Bearer new-token-for-artist-A');assert.equal(r.values.get('artist-key'),'new-token-for-artist-A');assert.equal(r.requests,2);
});
test('revoked permission is not retried or renewed',async()=>{
 const r=runtime(403);await assert.rejects(r.context.artistContentFetch(),e=>e.status===403);assert.equal(r.minted.length,0);assert.equal(r.requests,1);
});
test('account change during renewal blocks retry and local token overwrite',async()=>{
 const r=runtime(401,true);await assert.rejects(r.context.artistContentFetch(),/La cuenta cambió/);assert.equal(r.requests,1);assert.equal(r.values.has('artist-key'),false);
});
