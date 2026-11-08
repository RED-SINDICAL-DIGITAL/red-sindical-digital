import {lookup} from 'node:dns/promises';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
try{
  const records=await lookup('uadav-stream-staging.pages.dev',{all:true});
  console.log(JSON.stringify({name:'pages-dns',addresses:records.map(x=>x.address),count:records.length}));
}catch(error){
  console.log(JSON.stringify({name:'pages-dns',error:String(error?.code||error?.message||error)}));
}
// Read-only staging deployment inventory. Never sends credentials or personal data.
const targets=[
  ['pages-profile','https://uadav-stream-staging.pages.dev/usuario.html'],
  ['pages-shell','https://uadav-stream-staging.pages.dev/app.html'],
  ['worker-health','https://uadav-api-staging.uadavstream.workers.dev/api/health']
];
let failures=0;
for(const [name,address] of targets){
  try{
    const redirects=[];let nextAddress=address,response;
    for(let n=0;n<4;n++){
      response=await fetch(nextAddress,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000),redirect:'manual'});
      if(response.status<300||response.status>=400)break;
      const location=response.headers.get('location');
      if(!location)break;
      const dest=new URL(location,nextAddress),from=new URL(address);
      redirects.push({status:response.status,hostname:dest.hostname,path:dest.pathname});
      if(dest.origin!==from.origin||dest.protocol!=='https:'||n===3)break;
      nextAddress=dest.href;
    }
    const body=await response.text();
    const facts={name,status:response.status,bytes:body.length,redirects};
    if(name==='pages-profile'||name==='pages-shell'){
      const filename=name==='pages-profile'?'usuario.html':'app.html';
      const local=readFileSync(new URL('../'+filename,import.meta.url),'utf8');
      const sha=text=>createHash('sha256').update(text).digest('hex').slice(0,16);
      facts.deployed_sha16=sha(body);
      facts.candidate_sha16=sha(local);
      facts.matches_candidate=sha(body)===sha(local);
      facts.candidate_bytes=local.length;
    }
    if(name==='pages-profile'){
      facts.native_profile=body.includes('id="profileNativeHome"');
      facts.legacy_view=body.includes('id="profileLegacyViews"');
      facts.has_account_ui=body.includes('uadav-account-ui.js');
      facts.profile_rev=body.includes('profile-native-v4-inline');
    }else if(name==='pages-shell'){
      facts.native_profile_iframe=body.includes('profile-native-v4-inline-20261107');
      facts.staging_api_resolver=body.includes("location.hostname==='uadav-stream-staging.pages.dev'");
      facts.staging_api_refs=body.split('https://uadav-api-staging.uadavstream.workers.dev/api/').length-1;
      facts.production_api_refs=body.split('https://uadav-api.uadavstream.workers.dev/api/').length-1;
    }else{
      try{
        const health=JSON.parse(body);
        facts.ok=health.ok===true;
        facts.build=health.build??null;
        facts.event_owner_revision=health.event_owner_revision??null;
        facts.kv=health.kv===true;
        facts.d1=health.d1===true;
      }catch{facts.valid_json=false}
    }
    console.log(JSON.stringify(facts));
    if(!response.ok)failures++;
  }catch(error){
    failures++;
    console.log(JSON.stringify({name,error:String(error?.message??error).slice(0,160),cause:String(error?.cause?.code||error?.cause?.message||'').slice(0,160)}));
  }
}
console.log('probe_status='+ (failures?'HTTP_CHECK_FAILED':'HTTP_READ_OK'));
