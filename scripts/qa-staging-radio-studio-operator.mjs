// Radio Studio operator workflow against an isolated mock API. No external calls, credentials or writes.
import {chromium} from 'playwright';
const base='http://127.0.0.1:8765';
const apiHost='https://uadav-api-staging.uadavstream.workers.dev';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 for(const device of [{name:'mobile',width:390,height:844},{name:'desktop',width:1365,height:768}]){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},locale:'es-AR'});
  const mock={mode:'manual',rejectNext:false,denyNext:false,noStations:false,failList:false,settingsWrites:[],requests:[]};
  await context.addInitScript(()=>{
   window.UADAV_ENV='staging';window.PLATFORM_ENV='staging';
   window.UADAVAccount={code:()=> 'QA-FAKE-LOCAL-CREDENTIAL'};
  });
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin===base)return route.continue();
   if(url.origin!==apiHost)return route.abort();
   const path=url.pathname;
   if(!path.startsWith('/api/radio-studio'))return route.fulfill({status:404,contentType:'application/json',body:'{}'});
   const headers=req.headers();
   if(headers.authorization!=='Bearer QA-FAKE-LOCAL-CREDENTIAL')return route.fulfill({status:401,contentType:'application/json',body:'{"error":"missing token"}'});
   mock.requests.push({method:req.method(),path});
   let status=200,data={success:true,radio_id:'qa-station'};
   if(mock.denyNext){mock.denyNext=false;status=403;data={success:false,error:'forbidden'};}
   else if(path==='/api/radio-studio'){
    if(mock.failList){status=503;data={success:false,error:'Lista temporalmente no disponible'};}
    else data={success:true,items:mock.noStations?[]:[{id:'qa-station',name:'Emisora QA local'}]};
   }
   else if(path==='/api/radio-studio/requests')data={success:true,radio_id:'qa-station',items:[]};
   else if(path==='/api/radio-studio/settings'){
    if(req.method()==='PUT'){
     const body=JSON.parse(req.postData()||'{}');
     mock.settingsWrites.push(body.mode);
     if(mock.rejectNext){mock.rejectNext=false;status=500;data={success:false,error:'Rechazo simulado'};}
     else if(['manual','automatic','paused'].includes(body.mode))mock.mode=body.mode;
     else {status=400;data={success:false,error:'Modo inválido'};}
    }
    if(status===200)data={success:true,radio_id:'qa-station',mode:mock.mode};
   }
   else if(path==='/api/radio-studio/moderation')data={success:true,radio_id:'qa-station',items:[],has_more:false,next_cursor:null};
   else if(path==='/api/radio-studio/chat')data={success:true,radio_id:'qa-station',items:[]};
   else {status=404;data={success:false,error:'unknown route'};}
   return route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  });
  const page=await context.newPage();
  page.on('dialog',dialog=>dialog.accept());
  try{
   await page.goto(base+'/radio-studio.html',{waitUntil:'domcontentloaded'});
   await page.locator('#studio').waitFor({state:'visible',timeout:12000});
   await page.waitForFunction(()=>document.getElementById('modeSelect')?.value==='manual'&&document.getElementById('modeStatus')?.textContent.includes('Modo actual'),null,{timeout:12000});
   const visual=await page.evaluate(()=>({
    styleLoaded:[...document.styleSheets].some(sheet=>sheet.href?.includes('/uadav-radio-studio-2026.css')),
    cardRadius:getComputedStyle(document.querySelector('#studio>.card')).borderRadius,
    statusVisible:!!document.getElementById('status'),
    overflow:document.documentElement.scrollWidth>innerWidth+3,
    formColumns:getComputedStyle(document.querySelector('#studio>.toolbar')).gridTemplateColumns
   }));
   if(!visual.styleLoaded||visual.cardRadius!=='14px'||visual.overflow)errors.push(device.name+': approved Radio Studio visual/layout contract failed '+JSON.stringify(visual));
   console.log(JSON.stringify({device:device.name,studioVisual:visual}));
   for(const mode of ['automatic','paused','manual']){
    await page.locator('#modeSelect').selectOption(mode);
    await page.locator('#saveMode').click();
    await page.waitForFunction(expected=>document.getElementById('modeStatus')?.textContent.includes('Configuración guardada: '+expected),mode,{timeout:12000});
    if(mock.mode!==mode)errors.push(device.name+': mode not persisted '+mode);
   }
   mock.rejectNext=true;
   await page.locator('#modeSelect').selectOption('paused');
   await page.locator('#saveMode').click();
   await page.waitForFunction(()=>document.getElementById('modeStatus')?.textContent.includes('Rechazo simulado'),null,{timeout:12000});
   const rollback=await page.locator('#modeSelect').inputValue();
   if(rollback!=='manual'||mock.mode!=='manual')errors.push(device.name+': rejected mode not rolled back');
   // A successful empty list and a failed refresh must both discard private drafts.
   for(const failure of ['noStations','failList']){
    await page.locator('#chatMessage').fill('Borrador privado del operador QA');
    mock[failure]=true;
    await page.locator('#refresh').click();
    await page.waitForFunction(()=>document.getElementById('studio')?.hidden===true,null,{timeout:12000});
    const cleared=await page.evaluate(()=>({
     draft:document.getElementById('chatMessage').value,
     stations:document.getElementById('station').options.length,
     requests:document.getElementById('requests').children.length,
     chat:document.getElementById('chatMessages').children.length,
     moderation:document.getElementById('moderationItems').children.length
    }));
    if(Object.values(cleared).some(Boolean))errors.push(device.name+': '+failure+' retained private state');
    mock[failure]=false;
    await page.locator('#refresh').click();
    await page.waitForFunction(()=>document.getElementById('modeStatus')?.textContent.includes('Modo actual')&&!document.getElementById('refresh').disabled&&!document.getElementById('studio').hidden,null,{timeout:12000});
   }
   // Account isolation: swapping credentials must immediately hide the previous station.
   await page.evaluate(()=>{
    window.UADAVAccount={code:()=> 'QA-OTHER-ACCOUNT-UNAUTHORIZED'};
    window.dispatchEvent(new Event('uadav:account'));
   });
   await page.waitForFunction(()=>document.getElementById('studio')?.hidden===true,null,{timeout:12000});
   const accountSwitch=await page.evaluate(()=>({
    hidden:document.getElementById('studio').hidden,
    stations:document.getElementById('station').options.length,
    privateRequests:document.getElementById('requests').children.length,
    privateChat:document.getElementById('chatMessages').children.length
   }));
   if(!accountSwitch.hidden||accountSwitch.stations||accountSwitch.privateRequests||accountSwitch.privateChat)errors.push(device.name+': account switch leaked previous operator state');
   await page.locator('#refresh').click();
   await page.waitForFunction(()=>document.getElementById('status')?.textContent.includes('Tu sesión ya no es válida'),null,{timeout:12000});
   if(!await page.locator('#studio').isHidden())errors.push(device.name+': unauthorized second account exposed studio');
   // Restore local test identity to exercise explicit API revocation after account switch.
   await page.evaluate(()=>{
    window.UADAVAccount={code:()=> 'QA-FAKE-LOCAL-CREDENTIAL'};
    window.dispatchEvent(new Event('uadav:account'));
   });
   await page.locator('#refresh').click();
   await page.locator('#studio').waitFor({state:'visible',timeout:12000});
   // Unauthorized operator: API returns 403; private studio must be hidden.
   mock.denyNext=true;
   await page.locator('#refresh').click();
   await page.waitForFunction(()=>document.getElementById('studio')?.hidden===true&&document.getElementById('status')?.textContent.includes('permiso'),null,{timeout:12000});
   const state=await page.evaluate(()=>({studioHidden:document.getElementById('studio').hidden,status:document.getElementById('status').textContent}));
   if(!state.studioHidden||!state.status.includes('permiso'))errors.push(device.name+': revocation did not hide private controls');
   console.log(JSON.stringify({device:device.name,verifiedModes:mock.settingsWrites,rollback,permissionGate:state.studioHidden,accountSwitchIsolated:accountSwitch.hidden,mockRequests:mock.requests.length}));
  }catch(e){errors.push(device.name+': '+String(e.message).slice(0,240));}
  finally{await context.close();}
 }
}finally{await browser.close();}
if(errors.length){console.error('Radio Studio mock QA FAIL',JSON.stringify(errors));process.exitCode=1;}
else console.log('PASS: Radio Studio mode transitions, failed update rollback and operator authorization guard (mock API only).');
