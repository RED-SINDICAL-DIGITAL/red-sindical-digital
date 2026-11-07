const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const worker=readFileSync(join(__dirname,'..','worker.js'),'utf8');
const start=worker.indexOf('const uadavAdvertisingPolicy='),end=worker.indexOf('const uadavAtomicEventLab=',start);
assert(start>0&&end>start,'Advertising policy source missing');
const policy=vm.runInNewContext(worker.slice(start,end)+'\nuadavAdvertisingPolicy',{Date});
const begin=worker.indexOf("if(path==='/api/monetization/campaigns')"),after=worker.indexOf("const validateActive=item=>",begin);
const route=worker.slice(begin,after);
const base={status:'active',payment_status:'paid',delivery_verified:true,starts_at:'2026-11-06',ends_at:'2026-11-10',target_scope:'province',target_country:'AR',target_province:'Santa Fe',target_city:''};
const today=Date.parse('2026-11-07T14:00:00-03:00');
test('province-specific ads appear in Santa Fe but never in Córdoba or unknown region',()=>{
 assert.equal(policy.eligible(base,{country:'AR',province:'Santa Fe'},today),true);
 assert.equal(policy.eligible(base,{country:'AR',province:'Córdoba'},today),false);
 assert.equal(policy.eligible(base,{country:'AR',province:''},today),false);
 assert.equal(policy.eligible(base,{country:'UY',province:'Santa Fe'},today),false);
});
test('national advertising covers all Argentine provinces but not another country',()=>{
 const c={...base,target_scope:'national'};
 assert.equal(policy.eligible(c,{country:'AR',province:'Santa Fe'},today),true);
 assert.equal(policy.eligible(c,{country:'AR',province:'Córdoba'},today),true);
 assert.equal(policy.eligible(c,{country:'CL',province:''},today),false);
});
test('payment, expiry and verification remain mandatory',()=>{
 assert.equal(policy.eligible({...base,payment_status:'pending'},{country:'AR',province:'Santa Fe'},today),false);
 assert.equal(policy.eligible({...base,delivery_verified:false},{country:'AR',province:'Santa Fe'},today),false);
 assert.equal(policy.eligible({...base,ends_at:'2026-11-06'},{country:'AR',province:'Santa Fe'},today),false);
});
test('public request cannot spoof province via query arguments, admins retain preview',()=>{
 assert.match(route,/const manual=isAdmin\(\)&&\['country','province','city'\]\.some\(k=>url\.searchParams\.has\(k\)\)/);
 assert.match(route,/request\.cf\?\.region\|\|''/);
 assert.match(route,/uadavAdvertisingPolicy\.eligible\(x,viewer\)/);
 assert.match(route,/response\.headers\.set\('Cache-Control','private, no-store'\)/);
});
