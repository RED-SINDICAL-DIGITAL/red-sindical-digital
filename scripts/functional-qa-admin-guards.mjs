// Read-only staging security smoke: no auth credentials, no writes, no response body logging.
import assert from 'node:assert/strict';
const base='https://uadav-api-staging.uadavstream.workers.dev/api/';
const routes=['admin/d1/status','admin/youtube-provider','admin/audit-log','admin/moderation/settings','admin/artist-analytics?artist_id=qa-nonexistent'];
const results=[];
for(const route of routes){
 const response=await fetch(base+route,{method:'GET',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
 results.push({route:route.split('?')[0],status:response.status});
 assert.equal(response.status,401,'Protected staging Admin API must reject anonymous request: '+route);
 const raw=await response.text();
 assert(raw.length<4000,'Unexpectedly large unauthorized response: '+route);
 assert(!/admin_key|api_key|token_secret|bearer\s+[a-z0-9]/i.test(raw),'Unauthorized response leaked credential-like metadata');
}
console.log(JSON.stringify(results));
console.log('PASS: five protected staging Admin endpoints reject unauthenticated GET without revealing data.');
