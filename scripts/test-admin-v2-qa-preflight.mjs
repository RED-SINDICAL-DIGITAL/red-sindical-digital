import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {qaPreflight} from './admin-v2-qa-preflight.mjs';
const template=await readFile(new URL('../wrangler.admin-v2-qa.toml.example',import.meta.url),'utf8');
const synthetic=template.replace('ADMIN_V2_QA_KV_ID_REQUIRED','a'.repeat(32)).replace('ADMIN_V2_QA_D1_ID_REQUIRED','b'.repeat(32)).replace('ADMIN_V2_QA_DEMO_D1_ID_REQUIRED','c'.repeat(32));
const evidence={commit_sha:'f'.repeat(40),environment:'admin-v2-qa',
 kv_separate_verified:true,d1_separate_verified:true,demo_d1_separate_verified:true,
 access_pages_enforced:true,access_worker_enforced:true,qa_turnstile_configured:true,
 qa_admin_credentials_only:true,email_payments_disabled:true,rollback_plan_verified:true,
 explicit_qa_deployment_approval:true};
const ready=qaPreflight(synthetic,evidence);
assert.equal(ready.ready,true,JSON.stringify(ready));
const fails=(config,record=evidence)=>assert.equal(qaPreflight(config,record).ready,false);
fails(template,evidence);
fails(synthetic,{...evidence,access_pages_enforced:false});
fails(synthetic,{...evidence,access_worker_enforced:false});
fails(synthetic,{...evidence,explicit_qa_deployment_approval:false});
fails(synthetic,{...evidence,d1_separate_verified:false});
fails(synthetic,{...evidence,email_payments_disabled:false});
fails(synthetic,{...evidence,commit_sha:'latest'});
fails(synthetic.replace('b'.repeat(32),'a'.repeat(32)));
fails(synthetic.replace('uadav-api-admin-v2-qa','uadav-api-staging'));
fails(synthetic.replace('uadav-admin-v2-qa.pages.dev','uadav-stream-staging.pages.dev'));
fails(synthetic+'\n[triggers]\ncrons = [\"*/5 * * * *\"]\n');
fails(synthetic+'\n[[routes]]\npattern = \"example.com/*\"\n');
fails(synthetic+'\nEMAIL_AUTOMATION_URL = \"https://example.invalid\"\n');
fails(synthetic,null);
fails(synthetic+'\n[vars]\nPUBLIC_SITE_URL = "https://uadav-admin-v2-qa.pages.dev"\n');
fails(synthetic.replace('name = "uadav-api-admin-v2-qa"','name = "uadav-api-admin-v2-qa"\nname = "uadav-api-admin-v2-qa"'));
fails(synthetic+'\n[[unsafe_binding]]\nbinding = "LIVE"\n');
fails(synthetic.replace('preview_urls = false','preview_urls = false\naccount_id = "unsafe"'));
fails(synthetic.replace('preview_urls = false','preview_urls = false\nrandom_unknown_key = "unsafe"'));
fails(synthetic.replace('database_name = "uadav-admin-v2-qa-db"','database_name = "uadav-staging-db"'));
fails(synthetic.replace('migrations_dir = "migrations/demo"','migrations_dir = "migrations/unknown"'));
fails(synthetic.replace('compatibility_date = "2026-09-28"','compatibility_date = "2027-01-01"'));
fails(synthetic+'\n"routes" = ["production.example/*"]\n');
fails(synthetic+'\nmalformed arbitrary config statement\n');

fails(synthetic.replace('[vars]', '[[vars]]'));
fails(synthetic.replace('[[kv_namespaces]]', '[kv_namespaces]'));
fails(synthetic.replace('workers_dev = true', 'workers_dev = true unexpected'));
fails(synthetic+'\n[constructor]\nx = true\n');
assert.equal(qaPreflight(synthetic.replace('workers_dev = true','workers_dev = true # QA'),evidence).ready,true);

console.log('PASS: fail-closed QA deployment gate rejects missing bindings, reused IDs, real endpoints, triggers, and missing independent sign-off.');
