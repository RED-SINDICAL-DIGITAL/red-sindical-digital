import {lookup} from 'node:dns/promises';
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
    const response=await fetch(address,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000),redirect:'error'});
    const body=await response.text();
    const facts={name,status:response.status,bytes:body.length};
    if(name==='pages-profile'){
      facts.native_profile=body.includes('id="profileNativeHome"');
      facts.legacy_view=body.includes('id="profileLegacyViews"');
      facts.has_account_ui=body.includes('uadav-account-ui.js');
      facts.profile_rev=body.includes('profile-native-v4-inline');
    }else if(name==='pages-shell'){
      facts.native_profile_iframe=body.includes('profile-native-v4-inline-20261107');
      facts.staging_api_resolver=body.includes("location.hostname==='uadav-stream-staging.pages.dev'");
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
