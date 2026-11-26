const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const home=readFileSync(join(__dirname,'..','index-v117.html'),'utf8');
const live=readFileSync(join(__dirname,'..','en-vivo.html'),'utf8');
const app=readFileSync(join(__dirname,'..','app.html'),'utf8');
test('one clear home entry leads to live streams and radio',()=>{
 assert.match(home,/data-world="live"[^>]*data-home-nav="\/en-vivo\.html"[^>]*><b>En vivo y radio<\/b>/);
 assert.doesNotMatch(home,/<button class="world" data-world="radio"/);
 assert.match(live,/<nav class="live-formats"[^>]*>/);
 assert.match(live,/href="#transmisiones"/);
 assert.match(live,/href="#radios"/);
 assert.match(live,/id="liveRadios"/);
});
test('radio remains directly discoverable elsewhere and the shared radio player is untouched',()=>{
 assert.match(home,/id="radioSection"/);
 assert.match(home,/data-home-nav="\/radio\.html"/);
 assert.match(app,/id="radioAudio"/);
 assert.match(app,/id="radioDock"/);
 assert.match(live,/href="\/radio\.html">Ver todas las radios/);
});
test('home history text does not promise resume or device-only storage',()=>{
 assert.match(home,/<h2>Tu historial reciente<\/h2>/);
 assert.doesNotMatch(home,/<h2>Continuar viendo y escuchando<\/h2>/);
 assert.match(home,/function renderContinue\(/);
 assert.match(home,/id="continueRail"/);
});
