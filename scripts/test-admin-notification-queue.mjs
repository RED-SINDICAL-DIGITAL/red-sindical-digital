#!/usr/bin/env node
// Static regression checks for known notification queue pitfalls.
// Run: node scripts/test-admin-notification-queue.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../qa/admin-v2/worker.js',import.meta.url),'utf8');
const count=x=>code.split(x).length-1;
assert.ok(code.includes("id: 'N-'+crypto.randomUUID()"), 'Notification IDs must be unique even in the same millisecond');
assert.equal(count('{notification_id:row.id,...payload}'),0,'Queue IDs can be overwritten by user payloads');
assert.equal(count('{notification_id:item.id,...payload}'),0,'New notification IDs can be overwritten by payloads');
assert.equal(count('{...payload,notification_id:row.id}'),2,'Both queue-flush paths must set a trusted notification ID');
assert.ok(code.includes("if (ctx?.waitUntil) ctx.waitUntil(send());"),'Background send must track completion');
const span=code.slice(code.indexOf('async function emitNotification(payload)'),code.indexOf('async function flushQueuedNotifications('));
assert.ok(span.includes('const result=await deliverNotification('),'Send must await webhook response');
assert.ok(span.includes("if(result.sent && hasD1()) await env.DB.prepare("),'Successful webhook acceptance must update the record');
assert.ok(span.includes("else await send();"),'Non-background fallback must have same semantics');
console.log('OK: queue IDs, trusted notification ID and background status updates.');
