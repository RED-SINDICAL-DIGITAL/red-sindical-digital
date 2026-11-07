const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'..','usuario.html'),'utf8');
const publish=readFileSync(join(__dirname,'..','publicar-evento.html'),'utf8');
test('publisher associates staging account even without optional email notices',()=>{
 assert.match(publish,/body\.email_notice_consent\|\|credential&&location\.hostname==='uadav-stream-staging\.pages\.dev'/);
 assert.match(publish,/Authorization:'Bearer '\+credential/);
 assert.match(publish,/credential!==\(localStorage\.getItem\('uadav_account_access_v1'\)/);
});
test('verified owner UI never derives permission from a locally saved reference',()=>{
 const section=html.split('id="mis-eventos"')[1].split('</section><section class="panel wide" id="radioStudioEntry"')[0];
 assert.match(section,/id="profileOwnedEventsList"/);
 assert.match(section,/id="profileLocalEventsList"/);
 assert.match(section,/publicaciones vinculadas a tu cuenta/);
 assert.match(section,/referencias locales no otorgan permisos/i);
 const js=html.match(/<script id="profileOwnerEventsScript">([\s\S]*?)<\/script>/)?.[1];
 assert(js);assert.match(js,/Authorization:'Bearer '\+credential/);
 assert.match(js,/data\.success!==true/);
 assert.match(js,/\.dataset\.profileView!=='eventos'/);
 assert.match(js,/location\.hostname!=='uadav-stream-staging\.pages\.dev'/);
 assert.match(js,/\['published','hidden'\]\.includes\(item\.estado\)/);
 assert.match(js,/confirm\(/);
 assert.match(js,/action:item\.estado==='hidden'\?'publish':'hide'/);
 assert(!js.includes('UADAVLocalEventReceipts'));
});
test('owner list only renders safe DOM text and escaped public IDs',()=>{
 const js=html.match(/<script id="profileOwnerEventsScript">([\s\S]*?)<\/script>/)[1];
 assert.match(js,/title\.textContent=/);
 assert.match(js,/status\.textContent=/);
 assert.match(js,/encodeURIComponent\(item\.id\)/);
 assert(!js.includes('innerHTML'));
 new vm.Script(js);
});
test('profile retains existing artist, job, receipt, password and account screens',()=>{
 for(const id of ['mi-artista','mis-trabajos','profileJobSecret','profileLocalEvents','recoverAccount','profileSettings'])assert(html.includes('id="'+id+'"'),id);
 for(const page of [html,publish])for(const m of page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});

test('verified event editor sends only whitelisted text fields to authenticated Worker',()=>{
 const js=html.match(/<script id="profileOwnerEventsScript">([\s\S]*?)<\/script>/)[1];
 assert.match(html,/id="profileOwnedEventEditor" class="u2-event-editor"/);
 assert.match(html,/id="profileOwnedEventForm"/);
 assert.match(js,/action:'edit',patch/);
 assert.match(js,/for\(const key of \['titulo','descripcion_corta','lugar','ciudad','fecha','hora'\]\)/);
 assert.match(js,/!patch\.titulo\|\|!patch\.fecha/);
 assert(!js.includes('patch.destacado_pagado'));
 assert(!js.includes('patch.created_by_account_id'));
});
