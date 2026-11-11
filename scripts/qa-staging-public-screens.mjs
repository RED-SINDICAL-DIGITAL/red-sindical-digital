// Responsive public-screen acceptance, isolated local mock API. No external writes or real identities.
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const origin='http://127.0.0.1:8765',out='artifacts/staging-integration-visual';
await mkdir(out,{recursive:true});
const event={id:'EV-QA-RESPONSIVE',titulo:'Encuentro de artistas · Prueba local',descripcion:'Contenido sintético para comprobar la ficha sin modificar datos.',categoria:'Música',ciudad:'Rosario',lugar:'Espacio de pruebas',fecha:'2099-12-01',hora:'20:00',estado:'published',visible:true,entrada_gratuita:true};
const screens=[
 ['cartelera','/cartelera.html'],['trabajo','/bolsa-trabajo.html'],['en-vivo','/en-vivo.html'],
 ['publicar-evento','/publicar-evento.html'],['evento','/evento.html?id='+event.id],
 ['biblioteca','/biblioteca.html'],['artistas','/artistas.html'],['publicidad','/consultar-publicidad.html'],
 ['buscar','/buscar.html'],['radio','/radio.html'],['radio-studio','/radio-studio.html'],
 ['playlists','/playlists.html'],['podcasts','/podcasts.html'],['cine','/peliculas-series.html']
];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
try{
 for(const viewport of [{name:'mobile-320',width:320,height:700},{name:'mobile-390',width:390,height:844},{name:'desktop-1365',width:1365,height:768}]){
  const context=await browser.newContext({viewport,locale:'es-AR',serviceWorkers:'block'});
  const writes=[];
  await context.addInitScript(()=>{window.UADAV_ENV='staging';window.PLATFORM_ENV='staging'});
  await context.route('**/*',route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin===origin&&!url.pathname.startsWith('/api/'))return route.continue();
   if(!['GET','HEAD','OPTIONS'].includes(req.method())){writes.push(url.pathname);return route.abort();}
   if(!url.pathname.startsWith('/api/'))return route.abort();
   const path=url.pathname.slice(5);
   let status=200,data=[];
   if(path==='config')data={branding:{name:'UADAV STREAM'},modules:{artists:true,events:true,jobs:true,radio:true,iptv:true}};
   else if(path==='health')data={ok:true,kv:true,d1:true};
   else if(path==='evento')data=event;
   else if(path==='cartelera'||path==='eventos')data=[event];
   else if(path.startsWith('account/')||path.startsWith('radio-studio')){status=401;data={error:'Sin sesión de prueba'};}
   else if(path.includes('bolsa')||path.includes('jobs'))data={items:[],success:true};
   else if(path.includes('config')||path.includes('layout')||path.includes('visibility'))data={};
   return route.fulfill({status,contentType:'application/json',body:JSON.stringify(data),headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'}});
  });
  const page=await context.newPage();
  try{
   for(const [name,path] of screens){
    try{
     await page.goto(origin+'/app.html?view='+encodeURIComponent(path),{waitUntil:'domcontentloaded'});
     const frame=page.frameLocator('#view');
     await frame.locator('body').waitFor({timeout:15000});
     // Wait for local CSS, never infer the layout from unloaded markup.
     await page.waitForFunction(()=>{
      const d=document.querySelector('#view')?.contentDocument;
      return d?.readyState==='complete'&&Array.from(d.styleSheets).some(s=>s.href?.includes('/uadav-stream-2026.css'));
     },null,{timeout:15000});
     if(name==='trabajo'){
      await frame.getByRole('link',{name:'Ofrecer trabajo',exact:true}).click();
      await frame.locator('#pubJobTitulo').waitFor({state:'visible',timeout:8000});
     }
     const state=await frame.locator('body').evaluate(body=>{
      const d=body.ownerDocument,w=d.defaultView;
      const forms=Array.from(d.querySelectorAll('form')).length;
      const fields=Array.from(d.querySelectorAll('input,select,textarea')).filter(n=>n.getClientRects().length);
      return {page:body.dataset.page,forms,fields:fields.length,overflow:d.documentElement.scrollWidth>w.innerWidth+3,
       overflowingFields:fields.filter(n=>n.getBoundingClientRect().right>w.innerWidth+3||n.getBoundingClientRect().left< -3).length,
       mainVisible:body.innerText.trim().length>30};
     });
     await page.screenshot({path:out+'/public-'+name+'-'+viewport.name+'.png',fullPage:true});
     console.log('PUBLIC_SCREEN',JSON.stringify({viewport:viewport.name,name,...state}));
     if(!state.page||state.overflow||state.overflowingFields||!state.mainVisible)failures.push(viewport.name+'/'+name+': '+JSON.stringify(state));
    }catch(error){failures.push(viewport.name+'/'+name+': '+String(error.message).slice(0,180));}
   }
   if(writes.length)failures.push(viewport.name+': public read-only inspection attempted writes: '+writes.join(','));
  }finally{await context.close();}
 }
}finally{await browser.close();}
if(failures.length){console.error('PUBLIC_SCREENS_FAIL',JSON.stringify(failures));process.exitCode=1;}
else console.log('PASS: public screens and visible form fields fit mobile and desktop; zero external writes.');
