const {test}=require('node:test');
const assert=require('node:assert/strict');
const delivery=require('../uadav-commercial-delivery.js');

const now=Date.parse('2026-11-07T12:00:00-03:00');
function ad(overrides={}) {
  return {
    id:'PUB-QA-1',label:'Publicidad',placement:'infeed',entity_type:'brand',
    entity_id:'BRAND-QA',starts_at:'2026-11-01',ends_at:'2026-11-30',
    banner_slot:'top',creative_image_url:'https://example.invalid/creative.webp',
    creative_target_url:'https://example.invalid/destination',...overrides
  };
}

test('one advertiser can use two separately contracted banner slots',()=>{
 const entries=[ad(),ad({id:'PUB-QA-2',banner_slot:'footer'})];
 const valid=delivery.campaigns(entries,'',now);
 assert.equal(valid.length,2);
 const banners=delivery.banners(entries,now);
 assert.equal(banners.top.active,true);
 assert.equal(banners.footer.active,true);
});
test('an advertiser may use infeed and a section sponsorship independently',()=>{
 const entries=[ad(),ad({id:'PUB-QA-3',placement:'section_sponsor',section_id:'cartelera',creative_title:'Marca QA'})];
 assert.equal(delivery.campaigns(entries,'',now).length,2);
});
test('repeated identical placement is deduplicated but distinct slots are not',()=>{
 const entries=[ad(),ad({id:'PUB-QA-DUP'}),ad({id:'PUB-QA-OTHER',banner_slot:'infeed'})];
 const valid=delivery.campaigns(entries,'',now);
 assert.equal(valid.length,2);
 assert.deepEqual(valid.map(x=>x.banner_slot),['top','infeed']);
});
test('expired and future ads remain excluded',()=>{
 assert.equal(delivery.campaigns([ad({ends_at:'2026-11-06'}),ad({starts_at:'2026-11-08'})],'',now).length,0);
});
test('invalid destinations cannot be mounted as banners',()=>{
 const rows=[ad({creative_target_url:'javascript:alert(1)'})];
 assert.deepEqual(delivery.banners(rows,now),{});
});
