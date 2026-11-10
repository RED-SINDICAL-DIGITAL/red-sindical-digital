// Offline Chromium test: actual synthesized WAV playback through page navigation.
// Never accesses external media, contacts a real API, logs in, or modifies Cloudflare.
import {chromium} from 'playwright';
const base='http://127.0.0.1:8765';
const mediaUrl='https://qa-audio.invalid/continuous-test.wav';
function syntheticWav(){
 const rate=16000,seconds=7,samples=rate*seconds;
 const bytes=Buffer.alloc(44+samples*2);
 bytes.write('RIFF',0);bytes.writeUInt32LE(bytes.length-8,4);
 bytes.write('WAVE',8);bytes.write('fmt ',12);bytes.writeUInt32LE(16,16);
 bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(rate,24);
 bytes.writeUInt32LE(rate*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);
 bytes.write('data',36);bytes.writeUInt32LE(samples*2,40);
 for(let n=0;n<samples;n++)bytes.writeInt16LE(Math.round(240*Math.sin(2*Math.PI*440*n/rate)),44+n*2);
 return bytes;
}
const wav=syntheticWav();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const failures=[];
try{
 for(const viewport of [{name:'mobile-390',width:390,height:844},{name:'desktop-1365',width:1365,height:768}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},locale:'es-AR'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  await context.route(mediaUrl,route=>route.fulfill({status:200,contentType:'audio/wav',body:wav,headers:{'Access-Control-Allow-Origin':'*'}}));
  const page=await context.newPage();
  await page.addInitScript(()=>{window.UADAV_ENV='staging';window.PLATFORM_ENV='staging'});
  try{
   await page.goto(base+'/app.html?view=%2Fusuario.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.UADAVShellHost?.playContent,null,{timeout:15000});
   const started=await page.evaluate(url=>window.UADAVShellHost.playContent({title:'Audio QA sintético',provider:'local-qa',url}),mediaUrl);
   if(!started){failures.push(viewport.name+': media host rejected synthetic audio');continue;}
   await page.waitForFunction(()=>{
    const audio=document.querySelector('#mediaStage audio');
    return !!audio&&!audio.paused&&audio.currentTime>0.12;
   },null,{timeout:10000});
   const before=await page.evaluate(()=>{
    const audio=document.querySelector('#mediaStage audio');
    window.__qaPlayingAudio=audio;
    return {time:audio.currentTime,paused:audio.paused,source:audio.currentSrc};
   });
   await page.locator('#mobile [data-route="/cartelera.html"]').evaluate(el=>el.click());
   await page.waitForFunction(()=>new URLSearchParams(location.search).get('view')==='/cartelera.html',null,{timeout:10000});
   await page.waitForTimeout(1000);
   const after=await page.evaluate(()=>{
    const audio=document.querySelector('#mediaStage audio');
    return {same:audio===window.__qaPlayingAudio,paused:audio?.paused??true,time:audio?.currentTime??0};
   });
   console.log(JSON.stringify({viewport:viewport.name,initial:before.time,after:after.time,same:after.same,paused:after.paused,synthetic:true}));
   if(!after.same||after.paused||after.time<before.time+0.3)failures.push(viewport.name+': synthetic audio interrupted by navigation');
   await page.evaluate(()=>window.UADAVShellHost.closeContent());
  }catch(e){failures.push(viewport.name+': '+String(e?.message||e).slice(0,220));}
  finally{await context.close();}
 }
}finally{await browser.close();}
if(failures.length){console.error('FAIL: synthetic playback',JSON.stringify(failures));process.exitCode=1;}
else console.log('PASS: synthesized audio remains playing across navigation on mobile and desktop.');
