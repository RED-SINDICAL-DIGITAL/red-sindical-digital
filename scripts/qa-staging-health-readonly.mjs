// Read-only public health preflight. Never reads private data, sends credentials or writes.
// This runs in GitHub Actions; the target is an allowlisted staging endpoint, not production.
const STAGING_HEALTH='https://uadav-api-staging.uadavstream.workers.dev/api/health';
export function evaluateHealth(data){
 const failures=[];
 if(!data||typeof data!=='object'||Array.isArray(data))return {ok:false,failures:['Invalid health document']};
 if(data.ok!==true&&data.success!==true)failures.push('Health endpoint did not confirm availability');
 if(data.kv!==true)failures.push('KV reported unavailable');
 if(data.d1!==true)failures.push('D1 reported unavailable');
 if(!data.build&&!data.version)failures.push('Missing API build/version');
 return {ok:failures.length===0,failures,build:String(data.build||data.version||'unknown').slice(0,60)};
}
export async function checkStagingHealth(fetcher=fetch){
 const url=new URL(STAGING_HEALTH);
 if(url.protocol!=='https:'||url.hostname!=='uadav-api-staging.uadavstream.workers.dev'||url.pathname!=='/api/health')throw Error('Unsafe health endpoint');
 const response=await fetcher(url.toString(),{method:'GET',headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(12000),redirect:'error'});
 if(!response.ok)throw Error('Staging health HTTP '+response.status);
 return evaluateHealth(await response.json());
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 try{
  const result=await checkStagingHealth();
  console.log(JSON.stringify(result));
  if(!result.ok)process.exitCode=1;
 }catch(e){console.error('Staging health preflight failed: '+String(e.message||e).slice(0,130));process.exitCode=1}
}
