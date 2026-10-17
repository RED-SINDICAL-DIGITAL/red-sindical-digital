const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(new URL('../uadav-artist-links-v128.js','file://'+__filename),'utf8');
function setup(values={},fetch=async()=>({ok:false})){
 const handlers={},storage=new Map(Object.entries(values)),nodes={};
 const doc={readyState:'loading',addEventListener:(n,f)=>handlers[n]=f,getElementById:id=>nodes[id]||=({hidden:true,isConnected:true,textContent:'',removeAttribute(n){delete this[n]}})};
 const ctx={document:doc,localStorage:{getItem:k=>storage.get(k)||null},fetch,AbortController,setTimeout,clearTimeout,console};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(source,ctx);return {ctx,storage,nodes,handlers};
}
test('linked account never launches competing legacy access request',async()=>{let calls=0;const h=setup({uadav_account_access_v1:'synthetic-account',uadav_artist_access_token_v1:'synthetic-artist'},async()=>{calls++;return{ok:false}});await h.handlers.DOMContentLoaded();assert.equal(calls,0)});
test('private or failed public profile keeps public link hidden and clears stale URL',async()=>{for(const ok of [false]){const h=setup({},async()=>({ok})),el={href:'/old',hidden:false,isConnected:true,removeAttribute(n){delete this[n]}};await h.ctx.UADAVArtistLinks.showPublic(el,'ART-QA');assert.equal(el.hidden,true);assert.equal(el.href,undefined)}});
test('confirmed public identity enables canonical profile link',async()=>{const h=setup({},async()=>({ok:true,json:async()=>({id:'ART-QA'})})),el={hidden:true,isConnected:true,removeAttribute(){}};await h.ctx.UADAVArtistLinks.showPublic(el,'ART-QA');assert.equal(el.hidden,false);assert.equal(el.href,'/artista.html?id=ART-QA')});
test('stale session, detached element or mismatched response cannot expose link',async()=>{for(const mode of ['stale','detached','wrong-id']){const h=setup({},async()=>({ok:true,json:async()=>({id:mode==='wrong-id'?'OTHER':'ART-QA'})})),el={hidden:true,isConnected:mode!=='detached',removeAttribute(){}};await h.ctx.UADAVArtistLinks.showPublic(el,'ART-QA',()=>mode!=='stale');assert.equal(el.hidden,true)}});

test('independent verified legacy artist enables tools while its private public link stays hidden',async()=>{
 const h=setup({uadav_artist_access_token_v1:'synthetic-artist'},async url=>url.includes('artista/access?')?{ok:true,json:async()=>({artist:{id:'ART-QA',nombre:'Private QA',visible:false}})}:{ok:false});
 await h.handlers.DOMContentLoaded();assert.equal(h.nodes.artistTools.hidden,false);assert.equal(h.nodes.artistTools.textContent,'Press Kit y herramientas');assert.equal(h.nodes.artistPublic.hidden,true);
});
test('failed or account-stale legacy access never enables tools',async()=>{
 const denied=setup({uadav_artist_access_token_v1:'synthetic-artist'},async()=>({ok:false}));await denied.handlers.DOMContentLoaded();assert.equal(denied.ctx.document.getElementById('artistTools').hidden,true);
 let changed;changed=setup({uadav_artist_access_token_v1:'synthetic-artist'},async()=>({ok:true,json:async()=>{changed.storage.set('uadav_account_access_v1','new-account');return{artist:{id:'ART-QA'}}}}));await changed.handlers.DOMContentLoaded();assert.equal(changed.ctx.document.getElementById('artistTools').hidden,true);
});
