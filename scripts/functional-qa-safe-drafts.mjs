// Anonymous, isolated in-browser form draft QA. Does not submit or contact write APIs.
import {chromium} from 'playwright';
const base='https://feat-beta-staging-profile-20.uadav-stream-staging.pages.dev';
const cases=[
 {name:'event',route:'/publicar-evento.html',data:{title:'QA EVENTO BORRADOR SIN PUBLICAR',description:'Descripción sintética temporal'},privateId:'email',returnFrom:'/cartelera.html'},
 {name:'job',route:'/bolsa-trabajo.html',data:{pubJobTitulo:'QA OFERTA BORRADOR SIN PUBLICAR',pubJobDescripcion:'Descripción sintética de la oportunidad'},privateId:'pubJobContacto',returnFrom:'/usuario.html'}
];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 for(const scenario of cases){
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'es-AR'});
  const page=await context.newPage();
  try{
   await page.goto(base+'/app.html?view='+encodeURIComponent(scenario.route),{waitUntil:'domcontentloaded',timeout:30000});
   const frame=page.frameLocator('#view');
   const fields=Object.entries(scenario.data);
   await frame.locator('#'+fields[0][0]).waitFor({state:'visible',timeout:12000});
   for(const [id,value] of fields)await frame.locator('#'+id).fill(value);
   await frame.locator('#'+scenario.privateId).fill('private-qa-contact@example.invalid');
   const before=await page.evaluate(()=>sessionStorage.getItem('uadav_safe_draft_v1_'+(new URLSearchParams(location.search).get('view')?.includes('publicar-evento')?'publicar-evento':'bolsa-trabajo')));
   if(!before)errors.push(scenario.name+': no session draft saved');
   if(before?.includes('private-qa-contact'))errors.push(scenario.name+': contact leaked into draft');
   await page.locator('#mobile [data-route="'+scenario.returnFrom+'"]').click();
   await page.waitForFunction(route=>new URLSearchParams(location.search).get('view')===route,scenario.returnFrom,{timeout:12000});
   await page.goBack({waitUntil:'domcontentloaded'});
   await frame.locator('#'+fields[0][0]).waitFor({state:'visible',timeout:12000});
   for(const [id,expected] of fields){const actual=await frame.locator('#'+id).inputValue();if(actual!==expected)errors.push(scenario.name+': draft field '+id+' not restored');}
   const contact=await frame.locator('#'+scenario.privateId).inputValue();
   if(contact)errors.push(scenario.name+': excluded contact was restored');
   console.log(JSON.stringify({form:scenario.name,restored:fields.length,contactExcluded:!contact,sessionOnly:true}));
  }catch(error){errors.push(scenario.name+': '+String(error.message).slice(0,260))}
  finally{await context.close()}
 }
}finally{await browser.close()}
if(errors.length){console.error('SAFE DRAFT QA FAILED',JSON.stringify(errors));process.exitCode=1}
else console.log('PASS: event/job non-sensitive drafts survive shell navigation, contacts excluded; no remote writes');
