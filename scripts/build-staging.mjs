import {readdir,readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const API='https://uadav-api-staging.uadavstream.workers.dev/api/';
export function stagingOrigin(value){
  const u=new URL(value);
  if(u.protocol!=='https:'||u.hostname!=='uadav-stream-staging.pages.dev'||u.port||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw Error('Only https://uadav-stream-staging.pages.dev is permitted');
  return u.origin;
}
export function transform(source,origin){
  const host=new URL(stagingOrigin(origin)).hostname;
  return source.replaceAll('uadav-api.uadavstream.workers.dev',new URL(API).hostname).replaceAll('www.uadavstream.com.ar',host).replaceAll('uadavstream.com.ar',host);
}
export function stagingRuntime(origin,api){
  'use strict';
  if(location.origin!==origin)throw Error('Staging origin mismatch');
  window.PLATFORM_API_BASE=window.UADAV_API_BASE=api;
  window.PLATFORM_USE_LOCAL_API=window.UADAV_USE_LOCAL_API=false;
  const nativeFetch=window.fetch.bind(window);
  window.fetch=(input,init)=>{
    const target=new URL(input instanceof Request?input.url:String(input),location.href);
    if(/^(?:www\.)?uadavstream\.com\.ar$|^uadav-api\.uadavstream\.workers\.dev$/i.test(target.hostname))return Promise.reject(new Error('Production request blocked in staging'));
    if(target.origin===origin&&target.pathname.startsWith('/api/')){
      const destination=api+target.pathname.slice(5)+target.search;
      return nativeFetch(input instanceof Request?new Request(destination,input):destination,init);
    }
    return nativeFetch(input,init);
  };
  document.addEventListener('DOMContentLoaded',()=>{if(window.top!==window.self)return;document.documentElement.classList.add('uadav-staging-top');const b=document.createElement('div');b.id='uadav-staging-banner';b.textContent='PRUEBAS · Datos ficticios · No realizar pagos';b.setAttribute('role','status');document.body.appendChild(b);});
}
export async function build(root=ROOT,origin=process.env.UADAV_STAGING_ORIGIN){
  origin=stagingOrigin(origin);
  const out=path.join(root,'dist-staging');
  try{await lstat(out);throw Error('dist-staging already exists; use a clean checkout/output directory');}catch(e){if(e.code!=='ENOENT')throw e;}
  const files=[];
  async function collect(dir='',nested=false){
    for(const e of await readdir(path.join(root,dir),{withFileTypes:true})){
      const rel=path.posix.join(dir,e.name);
      if(e.isSymbolicLink())throw Error('Symlink not permitted: '+rel);
      if(e.isDirectory()){
        if((!dir&&['assets','vendor'].includes(e.name))||nested)await collect(rel,true);
      }else if(e.isFile()&&(nested||/\.(html|js|css|json|svg|webmanifest|png|jpe?g|webp|ico|woff2?)$/i.test(e.name))){
        if(!dir&&(e.name==='worker.js'||e.name.startsWith('_')))continue;
        files.push(rel);
      }
    }
  }
  await collect();
  // Only these explicit synthetic diagnostics are published by the isolated staging build.
  // Never traverse the tests directory or expose its other fixtures/scripts.
  for(const diagnostic of ['tests/staging-signals-diagnostic.html','tests/staging-presskit-diagnostic.html','tests/staging-job-source.html']){
    const diagnosticInfo=await lstat(path.join(root,diagnostic));
    if(!diagnosticInfo.isFile()||diagnosticInfo.isSymbolicLink())throw Error('Invalid staging diagnostic');
    files.push(diagnostic);
  }
  for(const needed of ['index.html','app.html','usuario.html','gestionar-artista.html','uadav-account-sync.js'])if(!files.includes(needed))throw Error('Missing frontend file: '+needed);
  const output=new Map();
  for(const rel of files){
    const bytes=await readFile(path.join(root,rel));
    if(/\.(html|js|css|json|svg|webmanifest)$/i.test(rel)){
      let s=transform(bytes.toString('utf8'),origin);
      if(/uadavstream\.com\.ar|uadav-api\.uadavstream\.workers\.dev/i.test(s))throw Error('Production URL remains: '+rel);
      if(/\.html$/i.test(rel)){
        if(!/<head\b[^>]*>/i.test(s))throw Error('HTML has no head: '+rel);
        // The mail receiver clears the fragment before any external resource.
        // Never put the general staging bootstrap or banner ahead of it.
        if(rel!=='acceso-correo.html')s=s.replace(/<head\b[^>]*>/i,m=>m+'<meta name="robots" content="noindex,nofollow,noarchive"><script src="/staging-bootstrap.js"></script><link rel="stylesheet" href="/staging-banner.css">');
        else if(!s.includes('<script id="emailIntentBootstrap">'))throw Error('Missing private email bootstrap');
      }
      output.set(rel,Buffer.from(s));
    }else output.set(rel,bytes);
  }
  output.set('staging-bootstrap.js',Buffer.from('('+stagingRuntime.toString()+')('+JSON.stringify(origin)+','+JSON.stringify(API)+');'));
  output.set('staging-banner.css',Buffer.from('#uadav-staging-banner{position:fixed;top:0;left:0;right:0;z-index:2147483647;text-align:center;background:#ffe082;color:#171717;padding:4px 8px;font:700 11px/16px system-ui;pointer-events:none}.uadav-staging-top body{padding-top:24px!important}.uadav-staging-top body[data-page="admin"] :is(.sidebar,.topbar){top:24px!important}.uadav-staging-top body[data-page="admin"] .sidebar{height:calc(100dvh - 24px)!important}'));
  output.set('robots.txt',Buffer.from('User-agent: *\nDisallow: /\n'));
  const csp="default-src 'self'; connect-src 'self' https://uadav-api-staging.uadavstream.workers.dev https://www.googleapis.com https://youtube.googleapis.com https://www.youtube.com https://api.zeno.fm https://stream.zeno.fm; script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com https://challenges.cloudflare.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' blob: https:; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";
  let privateHeaders='';
  if(output.has('acceso-correo.html')){
    const page=output.get('acceso-correo.html').toString('utf8'),bootstrap=page.match(/<script id="emailIntentBootstrap">([\s\S]*?)<\/script>/)?.[1];
    if(!bootstrap)throw Error('Missing private email bootstrap');
    const bootstrapHash=createHash('sha256').update(bootstrap).digest('base64');
    const policy="default-src 'none'; script-src 'self' 'sha256-"+bootstrapHash+"'; style-src 'self'; connect-src https://uadav-api-staging.uadavstream.workers.dev; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";
    for(const route of ['/acceso-correo.html','/acceso-correo'])privateHeaders+=route+'\n  Referrer-Policy: no-referrer\n  Cache-Control: no-store\n  X-Content-Type-Options: nosniff\n  Content-Security-Policy: '+policy+'\n';
  }
  output.set('_headers',Buffer.from('/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: no-store\n  Referrer-Policy: strict-origin-when-cross-origin\n  Content-Security-Policy: '+csp+'\n'+privateHeaders));
  const manifest={environment:'staging',origin,api:API,sourceCommit:process.env.CF_PAGES_COMMIT_SHA||process.env.UADAV_SOURCE_COMMIT||'not-specified',files:[...output].map(([name,data])=>({name,sha256:createHash('sha256').update(data).digest('hex')}))};
  output.set('staging-build.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n'));
  for(const [rel,data] of output){await mkdir(path.dirname(path.join(out,rel)),{recursive:true});await writeFile(path.join(out,rel),data);}
  return {out,files:output.size,manifest};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=await build();console.log('Staging frontend prepared: '+result.files+' files in '+result.out+'; no deployment performed');
}
