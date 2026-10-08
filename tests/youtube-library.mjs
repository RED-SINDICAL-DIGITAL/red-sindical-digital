import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../worker.js',import.meta.url),'utf8');const {uadavYouTubeLibrary}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const channel='UCabcdefghijklmnopqrstuv',kv=new Map();let calls=[];const oldFetch=globalThis.fetch;
globalThis.fetch=async url=>{calls.push(String(url));const u=new URL(url);if(u.hostname==='iv.example')return new Response('{}',{status:503});if(u.pathname.endsWith('/channels'))return Response.json({items:[{id:channel,snippet:{title:'Canal real',description:'Bio completa',thumbnails:{high:{url:'https://image.example/a.jpg'}}},contentDetails:{relatedPlaylists:{uploads:'UUabcdefghijklmnopqrstuv'}}}]});if(u.pathname.endsWith('/playlistItems'))return Response.json({items:[{contentDetails:{videoId:'abcdefghijk'},snippet:{title:'Video real',channelTitle:'Canal real'}}],...(u.searchParams.get('pageToken')?{}:{nextPageToken:'page-two'})});if(u.pathname.endsWith('/playlists'))return Response.json({items:[{id:'PLabcdefghijklmnop',snippet:{title:'Playlist real'},contentDetails:{itemCount:4}}]});throw Error('Unexpected URL '+url)};
const env={YOUTUBE_API_KEY:'test-only-key',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};const req=async query=>{const r=await uadavYouTubeLibrary(new URL('https://test.example/api/youtube/channel_library?'+query),env,['https://iv.example']);return{status:r.status,data:await r.json()}};
try{
 const info=await req('id=@artist&kind=info');assert.equal(info.status,200);assert.equal(info.data.channelId,channel);
 const first=await req('id='+channel);assert.equal(first.status,200);assert.equal(first.data.items[0].external_id,'abcdefghijk');assert.ok(first.data.next_cursor);
 const second=await req('id='+channel+'&cursor='+encodeURIComponent(first.data.next_cursor));assert.equal(second.data.has_more,false);
 assert.equal((await req('id='+channel+'&kind=playlists&cursor='+encodeURIComponent(first.data.next_cursor))).status,400);
 assert.equal((await req('id=https://evil.example/channel/'+channel)).status,400);
 const lists=await req('id='+channel+'&kind=playlists');assert.equal(lists.data.items[0].playlist_id,'PLabcdefghijklmnop');const before=calls.length;await req('id='+channel+'&kind=playlists');assert.equal(calls.length,before,'cached public page avoids upstream work');
 for(const file of ['admin.html','artista.html','app.html']){const html=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(match[1].trim())new vm.Script(match[1])}
 new vm.Script(fs.readFileSync(new URL('../uadav-artist-library-v124.js',import.meta.url),'utf8'));
 console.log('PASS: official fallback supplies uploads, playlists, bound pagination cursors, fixed provider hosts and cache');
}finally{globalThis.fetch=oldFetch}
