// Real playback check using a generated WAV intercepted locally in Chromium.
// Never fetches external media, submits a form, or writes to Cloudflare.
import {chromium} from 'playwright';
const origin='https://feat-beta-staging-profile-20.uadav-stream-staging.pages.dev';
const mediaUrl='https://qa-audio.invalid/continuous-test.wav';
function createWav(){
 const sampleRate=16000,seconds=7,count=sampleRate*seconds;
 const bytes=Buffer.alloc(44+count*2);
 bytes.write('RIFF',0);bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVE',8);bytes.write('fmt ',12);
 bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(sampleRate,24);
 bytes.writeUInt32LE(sampleRate*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);
 bytes.write('data',36);bytes.writeUInt32LE(count*2,40);
 for(let n=0;n<count;n++)bytes.writeInt16LE(Math.round(250*Math.sin(n*2*Math.PI*440/sampleRate)),44+n*2);
 return bytes;
}
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const wav=createWav(),errors=[];
try{
 for(const viewport of [{name:'mobile',width:390,height:844},{name:'desktop',width:1365,height:768}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},locale:'es-AR'});
  await context.route(mediaUrl,route=>route.fulfill({status:200,contentType:'audio/wav',body:wav,headers:{'Access-Control-Allow-Origin':'*'}}));
  const page=await context.newPage();
  try{
   await page.goto(origin+'/app.html?view=%2Fusuario.html',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>!!window.UADAVShellHost?.playContent,null,{timeout:15000});
   const initiated=await page.evaluate(url=>window.UADAVShellHost.playContent({title:'Sonido sintético de prueba',provider:'local-qa',url}),mediaUrl);
   if(!initiated){errors.push(viewport.name+': player rejected synthetic WAV');continue}
   await page.waitForFunction(()=>{
     const el=document.querySelector('#mediaStage audio');
     return el&&!el.paused&&el.currentTime>0.1;
   },null,{timeout:10000});
   const before=await page.evaluate(()=>{const audio=document.querySelector('#mediaStage audio');window.__qaAudio=audio;return {time:audio.currentTime,paused:audio.paused,src:audio.currentSrc}});
   await page.locator('#mobile [data-route="/cartelera.html"]').evaluate(el=>el.click());
   await page.waitForFunction(()=>new URLSearchParams(location.search).get('view')==='/cartelera.html',null,{timeout:10000});
   await page.waitForTimeout(1200);
   const after=await page.evaluate(()=>{const audio=document.querySelector('#mediaStage audio');return {same:audio===window.__qaAudio,time:audio?.currentTime||0,paused:audio?.paused??true,dockClass:document.querySelector('#mediaDock')?.className||''}});
   if(!after.same||after.paused||after.time<before.time+0.35)errors.push(viewport.name+': playing audio did not continue across navigation');
   console.log(JSON.stringify({viewport:viewport.name,started:before.time,continued:after.time,sameAudioNode:after.same,paused:after.paused,playerMode:after.dockClass}));
   await page.evaluate(()=>window.UADAVShellHost.closeContent());
  }catch(error){errors.push(viewport.name+': '+String(error.message).slice(0,240))}
  finally{await context.close()}
 }
}finally{await browser.close()}
if(errors.length){console.error('SYNTHETIC AUDIO QA FAILED',JSON.stringify(errors));process.exitCode=1}
else console.log('PASS: Synthetic WAV playback remains active after navigating, on mobile and desktop.');
