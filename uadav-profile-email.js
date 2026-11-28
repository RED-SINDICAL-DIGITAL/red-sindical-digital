(()=>{'use strict';
const isPublic=location.origin==='https://uadavstream.com.ar';
const isStaging=location.origin==='https://uadav-stream-staging.pages.dev';
if(!isPublic&&!isStaging)return;
const tasks=document.getElementById('profileTasks');
const recovery=document.getElementById('recoveryDetails');
const host=tasks||recovery;
if(!host)return;
const panel=document.createElement(tasks?'section':'div');
panel.className=tasks?'panel wide':'job-email-access';
panel.hidden=true;
const title=document.createElement('h2');
const description=document.createElement('p');
description.className='muted';
const link=document.createElement('a');
link.className='chip';
link.href='/entrar-correo.html';
link.target='_top';
link.style.minHeight='44px';
const status=document.createElement('p');
status.className='muted';
status.setAttribute('role','status');
status.hidden=true;
panel.append(title,description,link,status);
if(tasks)tasks.before(panel);
else host.prepend(panel);
let enabled=false;
let installed=false;
function paint(){
  if(!installed)return;
  if(!tasks){
    title.textContent='Acceso por correo';
    description.textContent='El correo de contacto público no da acceso a una oferta.';
    link.textContent='Entrar con mi correo';
  }else{
    // "linked" indicates an existing account, not proof that its email is verified.
    let linked=false;
    try{linked=Boolean(window.UADAVAccount?.state?.()?.linked)}catch{}
    title.textContent=linked?'Correo y recuperación':'Entrá con tu correo';
    description.textContent=linked
      ?'Para recuperar esta cuenta en otro celular, primero verificá tu correo aquí. Si ya lo verificaste, entrá con el enlace recibido.'
      :'Entrá con un enlace que llega a tu correo. Si usabas otra cuenta, verificá primero tu correo desde ese dispositivo para conservar sus vínculos.';
    link.textContent=linked?'Configurar o usar mi correo':'Entrar con mi correo';
  }
  link.hidden=!enabled;
  status.hidden=enabled;
  if(!enabled)status.textContent='El ingreso por correo está temporalmente pausado. Podés seguir usando tu cuenta en este dispositivo.';
}
const api=isPublic?'https://uadav-api.uadavstream.workers.dev/api/access/email/status':'https://uadav-api-staging.uadavstream.workers.dev/api/access/email/status';
fetch(api,{cache:'no-store',credentials:'omit'})
.then(async response=>{
  if(!response.ok)return;
  const data=await response.json();
  installed=data?.installed===true;
  enabled=installed&&data?.enabled===true;
  panel.hidden=!installed;
  paint();
}).catch(()=>{});
addEventListener('uadav:account',paint);
})();
