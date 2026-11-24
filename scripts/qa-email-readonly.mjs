#!/usr/bin/env node
// Public, read-only email readiness probe. Explicit allowlist; no tokens, forms, mail or mutations.
import {pathToFileURL} from 'node:url';
const TARGETS=Object.freeze({
 staging:Object.freeze({api:'https://uadav-api-staging.uadavstream.workers.dev',pages:'https://uadav-stream-staging.pages.dev'}),
 qa:Object.freeze({api:'https://uadav-api-admin-v2-qa.uadavstream.workers.dev',pages:'https://uadav-admin-v2-qa.pages.dev'})
});
export function validateTarget(kind){
 if(!Object.hasOwn(TARGETS,kind))throw Error('Only staging or isolated qa can be probed');
 return TARGETS[kind];
}
export async function inspectEmailReadiness(kind,fetcher=fetch){
 const target=validateTarget(kind),findings=[];
 async function request(url,accept){
  const response=await fetcher(url,{method:'GET',headers:{Accept:accept},redirect:'manual',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response||typeof response.status!=='number')throw Error('No HTTP response');
  if(response.status>=300&&response.status<400)return {status:response.status,blocked:'redirect'};
  if(response.status!==200)return {status:response.status,blocked:response.status===401||response.status===403?'access_or_auth':'http'};
  const contentType=String(response.headers?.get?.('content-type')||'').toLowerCase();
  if(accept==='application/json'){
   if(!contentType.includes('application/json'))return {status:200,blocked:'unexpected_content_type'};
   try{return {status:200,body:await response.json()}}catch{return {status:200,blocked:'invalid_json'}}
  }
  if(!contentType.includes('text/html'))return {status:200,blocked:'unexpected_content_type'};
  const body=await response.text();return {status:200,valid:body.includes('accountEmailBootstrap')&&body.includes('confirmEmail')};
 }
 const health=await request(target.api+'/api/health','application/json').catch(e=>({blocked:'network',detail:String(e?.name||'error').slice(0,40)}));
 const email=await request(target.api+'/api/access/email/status','application/json').catch(e=>({blocked:'network',detail:String(e?.name||'error').slice(0,40)}));
 const page=await request(target.pages+'/entrar-correo.html','text/html').catch(e=>({blocked:'network',detail:String(e?.name||'error').slice(0,40)}));
 const installed=email.status===200&&email.body?.installed===true;
 const enabled=installed&&email.body.enabled===true;
 const apiReady=health.status===200&&health.body&&(health.body.ok===true||health.body.success===true)&&health.body.kv===true&&health.body.d1===true;
 const pageReady=page.status===200&&page.valid===true;
 if(!apiReady)findings.push('API health unavailable or missing KV/D1 readiness');
 if(!installed)findings.push('Email endpoint not installed or unavailable');
 if(!enabled)findings.push('Email sign-in not enabled for general users');
 if(!pageReady)findings.push('Pages email entry missing, blocked by Access, or not serving expected HTML');
 // Never claim email deliverability, ownership safety or deployed revision from public GETs.
 return {environment:kind,read_only:true,api_ready:!!apiReady,email_installed:!!installed,email_enabled:!!enabled,page_ready:!!pageReady,api_build:apiReady?String(health.body.build||health.body.version||'unknown').slice(0,60):null,
  observations:{health:{status:health.status||null,blocked:health.blocked||null},email:{status:email.status||null,blocked:email.blocked||null},page:{status:page.status||null,blocked:page.blocked||null}},
  findings,remote_mail_delivery_verified:false,artist_ownership_verified:false,release_authorized:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  if(process.argv.length!==3)throw Error('Usage: node scripts/qa-email-readonly.mjs staging|qa');
  console.log(JSON.stringify(await inspectEmailReadiness(process.argv[2]),null,2));
 }catch(e){console.error('Read-only probe failed: '+String(e.message||e).slice(0,150));process.exitCode=1;}
}
