(()=>{'use strict';
const ALLOWED=['https://uadav-stream-staging.pages.dev','https://integration-staging-preserve.uadav-stream-staging.pages.dev'];
if(!ALLOWED.includes(location.origin))return;
const tasks=document.getElementById('profileTasks'),settings=document.querySelector('#profileSettings .settings-grid');
if(!tasks||!settings)return;
const panel=document.createElement('section');panel.className='panel wide';panel.hidden=true;
panel.id='emailFirstAccount';panel.setAttribute('aria-labelledby','emailFirstTitle');
panel.style.cssText='border:1px solid #7bb7ff66;background:linear-gradient(135deg,#123254,#0d1523);padding:20px;border-radius:18px;display:block';
const title=document.createElement('h2');title.id='emailFirstTitle';title.textContent='Entrá con tu correo';
const info=document.createElement('p');info.className='muted';
info.textContent='Te enviamos un enlace para entrar. Sin contraseñas ni códigos que copiar.';
const action=document.createElement('a');action.className='chip';action.href='/entrar-correo.html';action.target='_top';action.textContent='Entrar con mi correo';
action.style.cssText='display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:12px 18px;font-weight:800';
panel.append(title,info,action);
tasks.before(panel);
const note=document.createElement('p');note.className='muted';note.textContent='Si tu cuenta es anterior, conservá tu acceso actual hasta confirmar el correo. Tus favoritos, trabajos y permisos artísticos deben mantenerse.';
panel.append(note);
function paint(){const linked=Boolean(window.UADAVAccount?.state?.().linked);title.textContent=linked?'Protegé tu cuenta con correo':'Entrá con tu correo';action.textContent=linked?'Agregar o consultar mi correo':'Entrar con mi correo';info.textContent=linked?'Agregá tu correo para entrar también desde otros dispositivos.':'Recibí un enlace para entrar. Sin contraseñas ni códigos que copiar.';}
paint();
fetch('https://uadav-api-staging.uadavstream.workers.dev/api/access/email/status',{cache:'no-store',credentials:'omit'})
.then(async response=>{if(!response.ok)return;const status=await response.json();
if(!status?.installed)return;
if(status.enabled===true){panel.hidden=false;settings.prepend(panel);tasks.before(panel);}
else{panel.hidden=false;title.textContent='Acceso por correo temporalmente no disponible';info.textContent='Podés seguir usando el acceso actual. No pierdas tus datos ni vuelvas a registrarte.';action.hidden=true;note.textContent='El servicio de correo se encuentra pausado en este entorno de pruebas.';}
}).catch(()=>{});
addEventListener('uadav:account',paint);
})();
