import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectEmailReadiness,validateTarget} from '../scripts/qa-email-readonly.mjs';
const json=data=>({status:200,headers:new Headers({'Content-Type':'application/json'}),json:async()=>data});
const html=body=>({status:200,headers:new Headers({'Content-Type':'text/html; charset=utf-8'}),text:async()=>body});
test('only declared staging and QA endpoints are accepted',()=>{
 assert.throws(()=>validateTarget('production'),/Only staging or isolated qa/);
 assert.throws(()=>validateTarget('https://example.invalid'),/Only staging or isolated qa/);
});
test('probe never sends credentials, redirects, requests with bodies or writes',async()=>{
 const urls=[];
 const result=await inspectEmailReadiness('staging',async(url,opts)=>{
  urls.push(url);
  assert.equal(opts.method,'GET');assert.equal(opts.credentials,'omit');assert.equal(opts.redirect,'manual');
  assert.equal(opts.body,undefined);assert.equal(opts.headers.Authorization,undefined);
  if(url.endsWith('/api/health'))return json({ok:true,kv:true,d1:true,build:'QA-123'});
  if(url.endsWith('/api/access/email/status'))return json({installed:true,enabled:true,identity:{email:'must-not-leak@example.invalid'}});
  return html('<script id="accountEmailBootstrap"></script><button id="confirmEmail"></button>');
 });
 assert.deepEqual(urls,[
 'https://uadav-api-staging.uadavstream.workers.dev/api/health',
 'https://uadav-api-staging.uadavstream.workers.dev/api/access/email/status',
 'https://uadav-stream-staging.pages.dev/entrar-correo.html'
 ]);
 assert.equal(result.api_ready,true);assert.equal(result.email_installed,true);assert.equal(result.email_enabled,true);assert.equal(result.page_ready,true);
 assert.equal(result.release_authorized,false);assert.equal(result.remote_mail_delivery_verified,false);assert.equal(result.artist_ownership_verified,false);
 assert.equal(JSON.stringify(result).includes('must-not-leak'),false,'never report private status payload');
});
test('Access-protected or missing Pages/Worker must not be declared available',async()=>{
 const result=await inspectEmailReadiness('qa',async(url)=>{
  if(url.endsWith('/api/health'))return {status:302};
  if(url.endsWith('/api/access/email/status'))return {status:403};
  return {status:404};
 });
 assert.equal(result.api_ready,false);assert.equal(result.email_enabled,false);assert.equal(result.page_ready,false);
 assert.equal(result.observations.email.blocked,'access_or_auth');
 assert.equal(result.observations.health.blocked,'redirect');
 assert.equal(result.findings.length,4);
});
test('HTTP 200 with HTML instead of JSON is not valid email status',async()=>{
 const result=await inspectEmailReadiness('staging',async(url)=>{
  if(url.endsWith('/api/health'))return json({success:true,kv:true,d1:true,build:'2026'});
  if(url.endsWith('/api/access/email/status'))return html('<html>Login wall</html>');
  return html('<html>Wrong frontend</html>');
 });
 assert.equal(result.api_ready,true);assert.equal(result.email_installed,false);assert.equal(result.email_enabled,false);assert.equal(result.page_ready,false);
});
