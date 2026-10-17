(function(g){'use strict';const mounts=new WeakMap();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),states=[['pendiente','Nueva'],['leida','Leída'],['respondida','Respondida'],['cerrada','Cerrada']];
function date(v){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v||''));return m?m[3]+'/'+m[2]+'/'+m[1]:String(v||'Fecha a definir')}
function phone(v){const s=String(v||'').trim(),n=s.replace(/\D/g,'');return /^[+\d\s().-]+$/.test(s)&&n.length>=10&&n.length<=15?'https://wa.me/'+n:''}
function budget(v){const s=String(v||'').trim();return /^\d{1,15}$/.test(s)?Number(s).toLocaleString('es-AR'):s}
function select(items,q,state){q=String(q||'').trim().toLocaleLowerCase('es');return items.filter(x=>(state==='all'||x.estado===state)&&(!q||[x.id,x.nombre,x.empresa,x.evento,x.ciudad].join(' ').toLocaleLowerCase('es').includes(q)))}
g.UADAVArtistInquiries={date,phone,budget,select,async mount(host,token){
 mounts.get(host)?.abort();
 host.innerHTML='<h1>Consultas recibidas</h1><p>Las propuestas para tus eventos, en un solo lugar. Recibir y responder consultas es gratuito.</p><div class="inquiry-filters"><label for="inquirySearch">Buscar consulta<input id="inquirySearch" type="search" placeholder="Nombre, evento, ciudad o referencia"></label><label for="inquiryFilter">Mostrar<select id="inquiryFilter"><option value="all">Todas</option>'+states.map(([k,l])=>'<option value="'+k+'">'+l+'</option>').join('')+'</select></label><button class="btn" id="inquiryRefresh" type="button">Actualizar</button></div><p id="inquirySummary"></p><p role="status" aria-live="polite" id="inquiryStatus">Cargando consultas…</p><div id="inquiryList"></div><p class="small">Una consulta no confirma contratación ni pago. Abrir email o WhatsApp no envía mensajes automáticamente.</p>';
 const artistFetch=g.UADAVArtistAccount?.requester?.(token)||fetch;
 const status=host.querySelector('#inquiryStatus'),list=host.querySelector('#inquiryList'),search=host.querySelector('#inquirySearch'),filter=host.querySelector('#inquiryFilter'),refresh=host.querySelector('#inquiryRefresh'),summary=host.querySelector('#inquirySummary');let items=[],limit=30,busy=false,ready=false;
 const accountCredential=localStorage.getItem('uadav_account_access_v1')||'';
 const accountEvents=new AbortController();
 function active(){if(accountEvents.signal.aborted)return false;if(!host.isConnected||host.querySelector('#inquiryList')!==list){dispose();return false}return true}
 function dispose(){accountEvents.abort();items=[];ready=false}
 mounts.set(host,{abort:dispose});
 const observer=new MutationObserver(()=>{if(!active())dispose()});observer.observe(host,{childList:true});
 accountEvents.signal.addEventListener('abort',()=>observer.disconnect(),{once:true});
 function sameAccount(){if(!active())return false;if(accountCredential===(localStorage.getItem('uadav_account_access_v1')||''))return true;items=[];ready=false;list.replaceChildren();summary.textContent='';status.textContent='La cuenta cambió. Volvé a Mi perfil para abrir las consultas correctas.';dispose();return false}
 const checkAccount=()=>{if(!active()){dispose();return}sameAccount()};g.addEventListener('uadav:account',checkAccount,{signal:accountEvents.signal});g.addEventListener('storage',checkAccount,{signal:accountEvents.signal});
 async function request(method='GET',body){
  if(!sameAccount())throw Error('La cuenta cambió. Volvé a Mi perfil.');
  const c=new AbortController(),t=setTimeout(()=>c.abort(),15000),stop=()=>c.abort();
  accountEvents.signal.addEventListener('abort',stop,{once:true});
  try{
   const r=await artistFetch((g.PLATFORM_API_BASE||g.UADAV_API_BASE||'https://uadav-api.uadavstream.workers.dev/api/')+'artist/inquiries',{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},cache:'no-store',signal:c.signal,...(body?{body:JSON.stringify(body)}:{})});
   let d;try{d=await r.json()}catch{throw Error('No pudimos leer la respuesta. Pulsá Actualizar para volver a intentarlo.')}
   if(!sameAccount())throw Error('La cuenta cambió. Volvé a Mi perfil.');
   if(!r.ok)throw Error(r.status===404?'Falta actualizar el servidor para ver las consultas.':d?.error||'No pudimos completar la solicitud.');
   return d;
  }finally{clearTimeout(t);accountEvents.signal.removeEventListener('abort',stop)}
 }
 function lock(value){busy=value;if(!active())return;refresh.disabled=value;search.disabled=value;filter.disabled=value;list.querySelectorAll('select,button').forEach(el=>el.disabled=value)}
 function render(){if(!sameAccount())return;const q=search.value.trim().toLocaleLowerCase('es'),found=select(items,q,filter.value),shown=found.slice(0,limit);const unread=items.filter(x=>x.estado==='pendiente').length;summary.textContent=items.length+' '+(items.length===1?'consulta recibida':'consultas recibidas')+' · '+unread+' '+(unread===1?'nueva':'nuevas');
 list.innerHTML=shown.length?shown.map(x=>{const wa=phone(x.whatsapp),email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(x.email||''));return `<article class="section inquiry-card"><div class="inquiry-card-top"><h2>${esc(x.evento||'Consulta de contratación')}</h2><span class="inquiry-state">${esc(states.find(([k])=>k===x.estado)?.[1]||x.estado||'Nueva')}</span></div><p><strong>${esc(x.nombre)}</strong>${x.empresa?' · '+esc(x.empresa):''}</p><p class="inquiry-meta">${esc(date(x.fecha))}${x.ciudad?' · '+esc(x.ciudad):''}</p>${x.detalles?`<p class="inquiry-text">${esc(x.detalles)}</p>`:''}${x.honorario?`<p>Presupuesto informado: <strong>${esc(budget(x.honorario))}</strong></p>`:''}<p class="inquiry-text">${x.email?'Email: '+esc(x.email):''}${x.whatsapp?'<br>WhatsApp: '+esc(x.whatsapp):''}</p><div class="actions">${email?`<a class="btn" href="mailto:${encodeURIComponent(x.email)}">Responder por email</a>`:''}${wa?`<a class="btn" href="${wa}" target="_blank" rel="noopener noreferrer">Abrir WhatsApp ↗</a>`:''}</div><label class="inquiry-state-field">Estado de la consulta<select data-id="${esc(x.id)}">${states.map(([k,l])=>`<option value="${k}" ${x.estado===k?'selected':''}>${l}</option>`).join('')}</select></label><small class="inquiry-reference">Referencia: ${esc(x.id)}</small></article>`}).join(''):`<p class="section">${ready?(items.length?'No hay consultas con estos filtros.':'Todavía no recibiste consultas para este artista.'):'Las consultas aparecerán cuando se complete la carga.'}</p>`;
 if(shown.length<found.length){const more=document.createElement('button');more.className='btn';more.textContent='Cargar más consultas · '+shown.length+' de '+found.length;more.onclick=()=>{limit+=30;render()};list.appendChild(more)}
 list.querySelectorAll('select[data-id]').forEach(el=>{el.onchange=async()=>{if(busy||!sameAccount())return;const item=items.find(x=>String(x.id)===el.dataset.id);if(!item)return;const previous=item.estado,next=el.value;lock(true);try{await request('PATCH',{id:item.id,estado:next});item.estado=next;status.textContent='Estado guardado. No se envió ningún mensaje.';render()}catch(e){if(active()){el.value=previous;status.textContent=e.message}}finally{lock(false)}}});
 }
 async function load(){if(busy||!active())return;lock(true);status.textContent='Actualizando consultas…';try{const d=await request();if(!d||!Array.isArray(d.items)||d.items.some(x=>!x||typeof x!=='object'||Array.isArray(x)||typeof x.id!=='string'||!x.id.trim()||(x.estado!=null&&!states.some(([key])=>key===x.estado))))throw Error('La respuesta llegó incompleta. Conservamos las consultas cargadas; pulsá Actualizar para reintentar.');items=d.items.map(x=>({...x,estado:x.estado||'pendiente'}));ready=true;render();status.textContent='Consultas actualizadas.'}catch(e){if(!active())return;status.textContent=e.name==='AbortError'?'La carga demoró demasiado. Pulsá Actualizar para volver a intentarlo.':e.message}finally{lock(false)}}
 search.oninput=()=>{limit=30;render()};filter.onchange=()=>{limit=30;render()};refresh.onclick=load;await load();
}};
})(globalThis);
