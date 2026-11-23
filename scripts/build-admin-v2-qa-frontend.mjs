#!/usr/bin/env node
// Build an isolated STATIC QA frontend artifact; never writes into source or triggers a deployment.
import {readdir,mkdir,readFile,writeFile,copyFile,rm} from 'node:fs/promises';
import {join,resolve,dirname,basename,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(process.argv[2]||join(root,'dist-admin-v2-qa'));
if(dirname(out)!==root||!/^dist-admin-v2-qa(?:-test-[0-9]+)?$/.test(basename(out)))throw Error('Unsafe output path: only dedicated QA dist inside repository');
const NAME='uadav-admin-v2-qa.pages.dev';
const qaApi='https://uadav-api-admin-v2-qa.uadavstream.workers.dev';
const oldApis=['https://uadav-api.uadavstream.workers.dev','https://uadav-api-staging.uadavstream.workers.dev'];
const oldSites=['https://uadav-stream-staging.pages.dev','https://uadavstream.com.ar','https://www.uadavstream.com.ar'];
const qaSite='https://'+NAME;
const textExt=new Set(['.html','.js','.css','.json','.svg','.txt','.xml','.webmanifest']);
const binExt=new Set(['.png','.jpg','.jpeg','.webp','.ico','.gif','.woff','.woff2','.avif','.mp4','.webm']);
const dirs=new Set(['assets','img','content','design','vendor']);
const allowedVendor=new Set(['qrcode.js','xlsx-0.20.3.full.min.js','qrcode-LICENSE.txt','xlsx-LICENSE.txt']);
// Public QA assets only: never include repository audit fixtures or old staging/demo pages.
const denyRoot=new Set(['ejemplos-editoriales-staging.html','qa-responsive-staging.html','staging-preflight.html','vivo-prueba.html','vivo-prueba.js','vivo-prueba.css','publicidad-demo.html','AUDIT-V9.1.txt','SHA256SUMS-V9.2.3.txt']);
const allowedRootJson=new Set(['manifest.json','version.json','account-email-version.json','email-access-version.json','platform-instance.json','uadav-business-model-v1.json']);
const deny=new Set(['worker.js','worker-demo.js','worker-demo-staging.js','service-worker.js','uadav-push-sw.js','CNAME','AGENTS.md','_routes.json']);
const ext=name=>{let i=name.lastIndexOf('.');return i<0?'':name.slice(i).toLowerCase()};
let copied=0,rewritten=0;
async function walk(folder,depth=0){
 for(const item of await readdir(join(root,folder),{withFileTypes:true})){
  const rel=folder?folder+'/'+item.name:item.name;
  if(rel==='dist-admin-v2-qa'||rel.startsWith('dist-admin-v2-qa/'))continue;
  if(item.isDirectory()){if(depth===0&&dirs.has(item.name))await walk(rel,depth+1);else if(depth>0)await walk(rel,depth+1);continue;}
  if(!item.isFile()||deny.has(item.name)||item.name.startsWith('_'))continue;
  if(folder==='vendor'&&!allowedVendor.has(item.name))continue;
  if(!folder&&(denyRoot.has(item.name)||(ext(item.name)==='.json'&&!allowedRootJson.has(item.name))||ext(item.name)==='.txt'))continue;
  const kind=ext(item.name);
  if(!textExt.has(kind)&&!binExt.has(kind)&&!(folder==='vendor'&&kind==='.txt')&&rel!=='assets/comercial/UADAV_Stream_Media_Kit.pdf')continue;
  const dest=join(out,rel);
  await mkdir(dirname(dest),{recursive:true});
  if(textExt.has(kind)){
   let source=await readFile(join(root,rel),'utf8'),text=source;
   for(const old of oldApis)text=text.replaceAll(old,qaApi);
   for(const old of oldSites)text=text.replaceAll(old,qaSite);
   if(rel==='uadav-push-ui-v150.js'){
    text="// Admin 2.0 QA: no PushManager subscription, service worker registration or notification prompts.\n";
   }
   if(rel==='uadav-api-config.js'){
    const guard=`// Isolated Admin 2.0 QA frontend: reject any non-QA Pages origin.\nif (!/^(?:[a-z0-9-]+\\.)?uadav-admin-v2-qa\\.pages\\.dev$/i.test(location.hostname)) throw Error('Admin 2.0 QA: invalid Pages origin');\n`;
    text=guard+text;
    if(!text.includes(qaApi+'/api/'))throw Error('Missing QA API base');
   }
   if(oldApis.some(old=>text.includes(old))||oldSites.some(old=>text.includes(old)))throw Error('Non-QA application destination remained in '+rel);
   if(text!==source)rewritten++;
   await writeFile(dest,text,'utf8');
  }else await copyFile(join(root,rel),dest);
  copied++;
 }
}
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
await walk('');
const policy=[
  '/*',
  '  Content-Security-Policy: default-src \'self\' https: data: blob:; connect-src \'self\' '+qaApi+' https://challenges.cloudflare.com; form-action \'self\'; object-src \'none\'; base-uri \'self\'; worker-src \'self\';',
  '  Referrer-Policy: no-referrer',
  '  X-Robots-Tag: noindex, nofollow, noarchive',
  '  X-Content-Type-Options: nosniff',
  ''
].join('\n');
await writeFile(join(out,'_headers'),policy,'utf8');
await writeFile(join(out,'robots.txt'),'User-agent: *\nDisallow: /\n','utf8');
for(const required of ['index.html','admin.html','app.html','usuario.html','uadav-api-config.js','vendor/qrcode.js','vendor/xlsx-0.20.3.full.min.js']){
 const content=await readFile(join(out,required),'utf8');
 if(!content)throw Error('Missing required QA page '+required);
}
console.log(JSON.stringify({ok:true,output:relative(root,out)||out,copied,rewritten,qaHost:NAME,qaApi}));
