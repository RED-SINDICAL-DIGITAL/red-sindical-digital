import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');const {default:worker,uadavProfileDisplay}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
assert.deepEqual(uadavProfileDisplay(),{videos:true,playlists:true,music:true,clips:true,live:true,events:true});
assert.equal(uadavProfileDisplay({videos:false}).videos,false);assert.throws(()=>uadavProfileDisplay({videos:'false'},true));assert.throws(()=>uadavProfileDisplay({pro_active:true},true));
const rows=[{id:'a1',nombre:'Artista de prueba',pro_active:false,contenido:[{url:'https://example.com/audio',tipo:'audio'}]},{id:'a2',nombre:'Otro artista'}];
const data=new Map([['artist_access_OWNER_TEST',JSON.stringify({artist_id:'a1',expires:Date.now()+60000})],['artistas',JSON.stringify(rows)]]);
const env={UADAV_DB:{get:async k=>data.get(k)||null,put:async(k,v)=>data.set(k,v)}};
async function request(body){const r=await worker.fetch(new Request('https://test.example/api/artista/access',{method:'POST',body:JSON.stringify({token:'OWNER_TEST',...body})}),env,{});return {status:r.status,data:await r.json()}}
const prefs={videos:false,playlists:true,music:true,clips:false,live:false,events:true};
const update=await request({profile_display:prefs,pro_active:true});assert.equal(update.status,200);assert.deepEqual(update.data.artist.profile_display,prefs);assert.equal(update.data.artist.pro_active,false);const stored=JSON.parse(data.get('artistas'));assert.equal(stored[0].contenido.length,1);assert.equal(stored[1].profile_display,undefined);
assert.equal((await request({profile_display:{videos:'false'}})).status,400);assert.deepEqual(JSON.parse(data.get('artistas'))[0].profile_display,prefs);
const r=await worker.fetch(new Request('https://test.example/api/public/artista?id=a1'),env,{});assert.deepEqual((await r.json()).profile_display,prefs);
data.set('artist_access_OWNER_TEST',JSON.stringify({artist_id:'a1',expires:1}));assert.equal((await request({profile_display:{music:false}})).status,401);
const ctx={window:{}};vm.runInNewContext(await readFile(new URL('../uadav-profile-display-v126.js',import.meta.url),'utf8'),ctx);assert.equal(ctx.window.UADAVProfileDisplay.kind({tipo:'live'}),'live');assert.equal(ctx.window.UADAVProfileDisplay.kind({tipo:'audio'}),'music');assert.equal(ctx.window.UADAVProfileDisplay.kind({tipo:'video'}),'videos');assert.equal(ctx.window.UADAVProfileDisplay.normalize({playlists:false}).playlists,false);
console.log('PASS: free artist display preferences, public projection, strict validation, ownership, expiry, PRO isolation and preserved URLs');
