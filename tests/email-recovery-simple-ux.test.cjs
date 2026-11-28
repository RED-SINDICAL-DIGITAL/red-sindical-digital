const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const page=readFileSync(join(__dirname,'..','entrar-correo.html'),'utf8');
const css=readFileSync(join(__dirname,'..','uadav-account-email.css'),'utf8');
const email=readFileSync(join(__dirname,'..','uadav-account-email.js'),'utf8');
const intro=readFileSync(join(__dirname,'..','uadav-profile-email.js'),'utf8');
test('single-email entry keeps one primary action and optional prior-account help',()=>{
 assert.match(page,/<h1 id="emailTitle">Entrar con mi correo<\/h1>/);
 assert.match(page,/id="requestEmail" type="submit">Enviarme un enlace/);
 assert.match(page,/<details class="email-help"><summary>¿Ya tenías una cuenta\?<\/summary>/);
 assert.match(page,/verificá tu correo desde Mi Perfil/);
 assert.match(page,/No crees otra cuenta esperando que aparezcan tus artistas/);
 assert.match(css,/\.email-help summary\{min-height:44px/);
 assert.match(css,/:focus-visible/);
});
test('existing-account verification is distinct from a new-device access request',()=>{
 assert.match(email,/mode=actor&&!data\.identity\?\.verified\?'verify':'access'/);
 assert.match(email,/access\/email\/'\+\(mode==='verify'\?'verify':'request'\)/);
 assert.match(email,/intent\.purpose==='verify'\?actor:''/);
 assert.match(intro,/linked=Boolean\(window\.UADAVAccount\?\.state\?\.\(\)\?\.linked\)/);
 assert.match(intro,/primero verificá tu correo aquí/);
 assert.match(intro,/panel\.hidden=!installed/);
});
test('email form scripts keep valid syntax',()=>{
 for(const match of page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 new vm.Script(email);new vm.Script(intro);
});
