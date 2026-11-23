#!/usr/bin/env node
// Fail-closed Admin 2.0 QA preflight: metadata only, no network, deployment or secrets.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const SHA=/^[a-f0-9]{40}$/i;
const id=value=>typeof value==='string'&&/^[a-f0-9]{32}$/i.test(value.replaceAll('-',''));
const requiredBindings={UADAV_DB:'id',DB:'database_id',DEMO_DB:'database_id'};
const qaSite='https://uadav-admin-v2-qa.pages.dev';
function sections(text){
 const result=[],lines=String(text||'').split(/\r?\n/);let section='root',values={};
 const commit=()=>result.push({section,values});
 for(const line of lines){
  const mark=line.match(/^\s*\[\[?([^\]]+)\]\]?\s*$/);
  if(mark){commit();section=mark[1];values={};continue}
  const kv=line.match(/^\s*([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\s]+))/);
  if(kv)values[kv[1]]=kv[2]??kv[3]??kv[4];
 }
 commit();return result;
}
export function qaPreflight(wrangler,evidence){
 const problems=[],blocks=sections(wrangler),root=blocks.find(x=>x.section==='root')?.values||{},vars=blocks.find(x=>x.section==='vars')?.values||{};
 if(root.name!=='uadav-api-admin-v2-qa')problems.push('Incorrect QA Worker name');
 if(root.main!=='worker.js')problems.push('QA must use reviewed worker.js');
 if(root.workers_dev!=='true'||root.preview_urls!=='false')problems.push('Unexpected Worker exposure settings');
 for(const [key,value] of Object.entries({PUBLIC_SITE_URL:qaSite,ACCOUNT_ALLOWED_ORIGINS:qaSite,TURNSTILE_ALLOWED_HOSTNAMES:'uadav-admin-v2-qa.pages.dev'}))if(vars[key]!==value)problems.push('Wrong QA variable '+key);
 const bound={};
 for(const [binding,field] of Object.entries(requiredBindings)){
  const matches=blocks.filter(x=>x.values.binding===binding);
  if(matches.length!==1||!id(matches[0].values[field]))problems.push('Binding has missing, duplicate or invalid QA resource ID: '+binding);
  else bound[binding]=matches[0].values[field].replaceAll('-','').toLowerCase();
 }
 if(new Set(Object.values(bound)).size!==Object.keys(bound).length)problems.push('QA resources must use distinct IDs');
 const forbidden=/^\s*(?:\[\[?(?:queues\.|routes|triggers|dispatch_namespaces|services|r2_buckets|analytics_engine_datasets)|(?:route|routes|crons|account_id|zone_id|send_email|EMAIL_AUTOMATION_URL|EMAIL_AUTOMATION_SECRET|PAYMENT_WEBHOOK_URL)\s*=)/im;
 if(forbidden.test(wrangler))problems.push('Forbidden production-capable Worker binding or trigger');
 if(/uadav-api-staging|uadav-stream-staging|https:\/\/uadavstream\.com\.ar|https:\/\/uadav-api\.uadavstream\.workers\.dev/i.test(wrangler))problems.push('Real staging/production endpoint in QA configuration');
 if(!evidence||typeof evidence!=='object'||Array.isArray(evidence))problems.push('Independent QA evidence missing');
 else{
  if(!SHA.test(evidence.commit_sha||''))problems.push('Immutable candidate SHA missing');
  if(evidence.environment!=='admin-v2-qa')problems.push('QA environment not verified');
  for(const key of ['kv_separate_verified','d1_separate_verified','demo_d1_separate_verified','access_pages_enforced','access_worker_enforced','qa_turnstile_configured','qa_admin_credentials_only','email_payments_disabled','rollback_plan_verified','explicit_qa_deployment_approval'])if(evidence[key]!==true)problems.push('Missing independent verification: '+key);
 }
 return {ready:problems.length===0,problems};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.length!==4){console.error('Usage: node scripts/admin-v2-qa-preflight.mjs /private/qa-wrangler.toml /private/qa-evidence.json');process.exitCode=2}
 else try{
  const config=await readFile(process.argv[2],'utf8'),evidence=JSON.parse(await readFile(process.argv[3],'utf8'));
  const result=qaPreflight(config,evidence);
  console.log(JSON.stringify(result,null,2));
  if(!result.ready)process.exitCode=1;
 }catch{console.error('QA preflight could not inspect metadata. No changes made.');process.exitCode=2}
}
