import test from 'node:test';
import assert from 'node:assert/strict';
import {loadWorker} from './load-worker.mjs';
const {default:worker}=await loadWorker();
for(const configured of [false,true])test(`health separates Brevo configuration from legacy automation (${configured})`,async()=>{
 const secret='private-test-value';
 const env={UADAV_DB:{get:async()=>null},...(configured?{BREVO_API_KEY:secret}:{})};
 const r=await worker.fetch(new Request('https://isolated.invalid/api/health'),env,{});
 assert.equal(r.status,200);const body=await r.json();
 assert.equal(body.email_automation,false);assert.equal(body.queue,false);
 assert.equal(body.integrations.brevo_api_key_configured,configured);
 assert.equal(body.integrations.legacy_email_webhook_configured,false);
 assert.equal(body.integrations.notification_queue_binding_configured,false);
 assert.equal(body.diagnostics_revision,'20261105-health-1');
 assert.equal(body.creative_revision,'2026-11-05-creative-1');
 assert.ok(body.advertising_revision);
 assert.equal(JSON.stringify(body).includes(secret),false);
 assert.equal('email_enabled' in body,false);
});
