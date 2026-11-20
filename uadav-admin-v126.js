(()=>{'use strict';
const byId=id=>document.getElementById(id);let menuOrigin=null;
function setMenu(open){const side=byId('sidebar'),menu=byId('mobileMenu'),back=byId('mobileBackdrop');if(!side||!menu)return;const mobile=matchMedia('(max-width:1024px)').matches;open=Boolean(open&&mobile);if(open&&!side.classList.contains('open'))menuOrigin=document.activeElement;side.classList.toggle('open',open);back?.classList.toggle('show',open);document.body.classList.toggle('admin-menu-open',open);menu.setAttribute('aria-expanded',String(open));side.inert=mobile&&!open;const workspace=document.querySelector('.workspace');if(workspace)workspace.inert=mobile&&open;if(open)requestAnimationFrame(()=>{if(side.classList.contains('open'))(byId('adminMenuClose')||side.querySelector('button,input'))?.focus()});else if(mobile&&side.contains(document.activeElement))(menuOrigin?.isConnected?menuOrigin:menu).focus()}
function pick(rect,candidates,key){const axis=key==='ArrowLeft'||key==='ArrowRight'?'x':'y',sign=key==='ArrowLeft'||key==='ArrowUp'?-1:1,other=axis==='x'?'y':'x';let best=null,score=Infinity;for(const c of candidates){const distance=(c[axis]-rect[axis])*sign;if(distance<=1)continue;const cross=Math.abs(c[other]-rect[other]);const weight=distance+cross*2+Math.max(0,cross-distance)*4;if(weight<score){score=weight;best=c}}return best}
window.UADAVAdminLayout={setMenu,next:pick};
function init(){if(document.body?.dataset.page!=='admin')return;
if(['integration-staging-preserve.uadav-stream-staging.pages.dev','uadavstream.com.ar','www.uadavstream.com.ar'].includes(location.hostname) && byId('logoutSide')){
  const demoActions=document.createElement('div');
  demoActions.className='admin-demo-actions';
  demoActions.setAttribute('role','group');
  demoActions.setAttribute('aria-label','Acceso a la plataforma');
  byId('logoutSide').closest('.sidebar-user').before(demoActions);
  const manage=document.createElement('button');
  manage.className='btn btn-ghost';
  manage.type='button';
  manage.textContent='Acceso a la plataforma';
  demoActions.append(manage);
  manage.onclick=async()=>{
    const key=await new Promise(resolve=>{
      const gate=document.createElement('dialog'),form=document.createElement('form');
      gate.className='demo-owner-panel';form.method='dialog';
      const label=document.createElement('label'),input=document.createElement('input');
      label.textContent='Clave privada del propietario';input.type='password';input.required=true;label.append(input);
      const enter=document.createElement('button'),cancel=document.createElement('button');
      enter.textContent='Ingresar';cancel.textContent='Cancelar';cancel.type='button';cancel.onclick=()=>gate.close();
      form.append(label,enter,cancel);gate.append(form);document.body.append(gate);
      form.onsubmit=e=>{e.preventDefault();gate.close('ok')};
      gate.onclose=()=>{resolve(gate.returnValue==='ok'?input.value:'');gate.remove()};
      gate.showModal();input.focus();
    });
    if(!key)return;
    const dialog=document.createElement('dialog');dialog.className='demo-owner-panel';
    const heading=document.createElement('h2');heading.textContent='Acceso a la plataforma';
    const status=document.createElement('p');status.setAttribute('role','status');
    dialog.append(heading,status);
    const action=(label,callback,parent=dialog)=>{
      const control=document.createElement('button');control.textContent=label;control.type='button';control.className='btn btn-ghost';parent.append(control);
      control.onclick=async()=>{control.disabled=true;try{await callback()}catch{status.textContent='No se pudo conectar.'}finally{control.disabled=false}};
    };
    const call=async(name,body)=>{
      const response=await fetch('/demo/admin/'+name,{method:'POST',headers:{Authorization:'Bearer '+sessionStorage.getItem('uadav_admin_v8'),'X-Demo-Owner':key},body});
      const type=response.headers.get('Content-Type')?.split(';')[0].trim();
      if((type==='text/plain' && response.headers.get('X-UADAV-Response')==='demo-v1'))return response;
      const ray=response.headers.get('cf-ray');
      return new Response('Cloudflare no pudo completar la operación.'+(ray?' Referencia: '+ray:''),{status:502});
    };
    action('Cerrar',()=>dialog.close());
    document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
    try{
      const result=await call('estado');status.textContent=await result.text();if(!result.ok)return;
    for(const [label,route] of [['Pausar acceso','pausar'],['Reabrir acceso','reabrir']]){
      action(label,async()=>{if(!window.confirm(label+' a la plataforma?'))return;status.textContent=await (await call(route)).text()});
    }
    }catch{status.textContent='No se pudo consultar el estado de la plataforma.'}
  };
}
const tv=byId('adminTV'),storageKey=document.body.dataset.adminPreview?'uadav_admin_preview_tv_v1':'uadav_admin_tv_v1';const setTV=enabled=>{document.body.dataset.adminTv=String(enabled);tv?.setAttribute('aria-pressed',String(enabled));tv?.setAttribute('aria-label',enabled?'Desactivar vista para TV':'Activar vista para TV');try{localStorage.setItem(storageKey,String(enabled))}catch{}};
let saved=false;try{saved=localStorage.getItem(storageKey)==='true'}catch{}setTV(saved);tv?.addEventListener('click',()=>setTV(document.body.dataset.adminTv!=='true'));
byId('adminMenuClose')?.addEventListener('click',()=>setMenu(false));byId('sidebar')?.addEventListener('transitionend',event=>{const side=byId('sidebar');if(event.propertyName==='transform'&&side.classList.contains('open')&&!side.contains(document.activeElement))byId('adminMenuClose')?.focus()});setMenu(false);window.addEventListener('resize',()=>{if(!matchMedia('(max-width:1024px)').matches)setMenu(false)});
document.addEventListener('keydown',event=>{const focused=document.activeElement,side=byId('sidebar');if(event.key==='Escape'&&side?.classList.contains('open')&&!byId('modal')?.open){event.preventDefault();setMenu(false);return}
if(event.key==='Tab'&&side?.classList.contains('open')&&!byId('modal')?.open){const nodes=[...side.querySelectorAll('button,input,summary,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);const first=nodes[0],last=nodes[nodes.length-1];if(!side.contains(focused)){event.preventDefault();first?.focus();return}if(event.shiftKey&&focused===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&focused===last){event.preventDefault();first?.focus()}return}
if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)||event.altKey||event.ctrlKey||event.metaKey||!focused||focused.isContentEditable||focused.matches('input,textarea,select'))return;
if(!focused.matches('button,a[href],summary,[tabindex]'))return;const dialog=byId('modal'),root=dialog?.open?dialog:side?.classList.contains('open')?side:byId('app');if(!root)return;
const rect=el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,el}};
const candidates=[...root.querySelectorAll('button,a[href],summary,input,select,textarea,[tabindex]')].filter(el=>el!==focused&&!el.disabled&&!el.closest('[inert]')&&el.getAttribute('tabindex')!=='-1'&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(rect);const target=pick(rect(focused),candidates,event.key);if(target){event.preventDefault();target.el.focus();target.el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'})}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
