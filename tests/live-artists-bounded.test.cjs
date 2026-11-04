const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('worker.js','utf8');
const start=source.indexOf("if(path==='/api/public/live-artists'"),end=source.indexOf("if(path==='/api/public/live-argentina'",start),route=source.slice(start,end);
test('live detection starts all four channels before awaiting and isolates a failed source',async()=>{
 const releases=[],calls=[],writes=[];const artists=Array.from({length:5},(_,i)=>({id:String(i),canal:'channel'+i,nombre:'Artist '+i}));
 const ctx={path:'/api/public/live-artists',request:{method:'GET'},allCanonicalArtists:async()=>artists,publicArtistFromItem:a=>a,env:{UADAV_DB:{get:async()=>0,put:async(...args)=>writes.push(args)}},invidiousChannelInfo:(id,options)=>{calls.push({id,options});return new Promise((resolve,reject)=>releases.push({resolve,reject}));},isoNow:()=>new Date().toISOString(),getArray:async()=>[],putJSON:async()=>{},json:x=>x,Date};
 vm.createContext(ctx);const pending=vm.runInContext('(async()=>{'+route+'})()',ctx);
 await new Promise(setImmediate);assert.equal(calls.length,4);assert.ok(calls.every(x=>x.options.liveOnly===true));
 releases[0].resolve({latestVideos:[{videoId:'abcdefghijk',liveNow:true}]});releases[1].reject(Error('offline'));releases[2].resolve({latestVideos:[{videoId:'recorded123',liveNow:false}]});releases[3].resolve(null);
 const result=await pending;assert.equal(result.length,1);assert.equal(result[0].is_live,true);assert.equal(result[0].video_id,'abcdefghijk');assert.equal(writes[0][1],'4');
});
test('live-only channel lookup stops after timed provider failures without official metadata fallback',async()=>{
 const a=source.indexOf('async function invidiousChannelInfo('),b=source.indexOf('async function invidiousVideoInfo(',a);let fallback=0,fetches=0;
 const ctx={AbortController,setTimeout,clearTimeout,encodeURIComponent,INVIDIOUS_INSTANCES:['https://one.invalid','https://two.invalid'],fetch:async()=>{fetches++;throw Error('offline')},officialDiscoveryChannelInfo:async()=>{fallback++;return {source:'youtube'}}};vm.createContext(ctx);vm.runInContext(source.slice(a,b),ctx);
 assert.equal(await ctx.invidiousChannelInfo('UCtest',{liveOnly:true}),null);assert.equal(fallback,0);assert.equal(fetches,2);
 assert.equal((await ctx.invidiousChannelInfo('UCtest')).source,'youtube');assert.equal(fallback,1);
});
