(function(g){'use strict';const key='uadav_account_access_v1',base=()=>g.PLATFORM_API_BASE||g.UADAV_API_BASE||'https://uadav-api.uadavstream.workers.dev/api/',el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
function mount(){const host=document.getElementById('accountNotices');if(!host)return;const toggle=document.getElementById('noticeToggle'),panel=document.getElementById('noticePanel'),status=document.getElementById('noticeStatus'),list=document.getElementById('noticeList'),refresh=document.getElementById('noticeRefresh'),all=document.getElementById('noticeReadAll');let current='',items=[],busy=false,markingAll=false,turn=0;
async function call(method,body,secret){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const r=await fetch(base()+'account/notifications',{method,headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:controller.signal,keepalive:method==='PATCH'}),d=await r.json();if(secret!==(localStorage.getItem(key)||''))throw Error('La cuenta cambió.');if(!r.ok)throw Error(r.status===404?'Los avisos todavía no están disponibles.':d.error||'No se pudieron cargar los avisos.');return d}finally{clearTimeout(timer)}}
function paint(){list.replaceChildren();const unread=items.filter(x=>!x.read).length;toggle.textContent='🔔 '+(unread?(unread===1?'1 aviso nuevo':unread+' avisos nuevos'):'Sin avisos nuevos');all.disabled=markingAll||!unread;status.textContent=items.length?'Marcar leído sólo cambia el aviso; no confirma pagos ni cierra consultas.':'No hay avisos por ahora.';for(const n of items){const row=el('article');row.style.cssText='padding:14px 0;border-bottom:1px solid #ffffff18;overflow-wrap:anywhere';row.append(el('strong',(n.read?'':'• ')+n.title),el('p',n.message));const when=new Date(n.created_at);if(!Number.isNaN(when.getTime()))row.append(el('small',when.toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires',hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'})+' · hora argentina'));let target;
try{target=new URL(n.path,location.origin)}catch{}
if(target?.origin===location.origin&&['/usuario.html','/gestionar-artista.html','/mi-espacio-artista.html'].includes(target.pathname)){
 const a=el('a','Abrir');a.className='chip';a.href=target.pathname+target.search+target.hash;
 a.onclick=()=>{if(!n.read)call('PATCH',{keys:[n.id]},current).catch(()=>{})};row.append(a);
}
if(!n.read){const read=el('button','Marcar leído');read.className='chip';read.onclick=async()=>{const credential=current;read.disabled=true;try{await call('PATCH',{keys:[n.id]},credential);if(credential===current){n.read=true;paint()}}catch(e){if(credential===current){status.textContent=e.message;read.disabled=false}}};row.append(read)}list.append(row)}}
async function load(){const secret=localStorage.getItem(key)||'';if(secret!==current){current=secret;turn++;busy=false;markingAll=false;items=[];list.replaceChildren();status.textContent='';toggle.textContent='🔔 Avisos';panel.hidden=true;toggle.setAttribute('aria-expanded','false')}host.hidden=!secret;if(!secret||busy)return;const attempt=++turn;busy=true;refresh.disabled=true;try{const d=await call('GET',null,secret);if(attempt!==turn||!host.isConnected)return;if(!Array.isArray(d.items))throw Error('Respuesta de avisos inválida.');items=d.items;paint()}catch(e){if(attempt===turn&&host.isConnected)status.textContent=e.message}finally{if(attempt===turn){busy=false;refresh.disabled=false}}}
toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)load()};refresh.onclick=load;all.onclick=async()=>{
 const secret=current,keys=items.filter(item=>!item.read).map(item=>item.id);
 if(!secret||markingAll||!keys.length)return;
 markingAll=true;all.disabled=true;
 try{
  await call('PATCH',{keys},secret);
  if(secret!==current)return;
  for(const item of items)if(keys.includes(item.id))item.read=true;
  paint();
  // Una lectura iniciada antes de la confirmación puede traer el contador anterior.
  turn++;busy=false;
  await load();
 }catch(e){if(secret===current)status.textContent=e.message}
 finally{if(secret===current){markingAll=false;all.disabled=!items.some(item=>!item.read)}}
};g.addEventListener('uadav:account',()=>{if((localStorage.getItem(key)||'')!==current)load()});g.addEventListener('focus',load);g.addEventListener('online',load);g.addEventListener('storage',e=>{if(e.key===null||e.key===key)load()});setInterval(()=>{if(!document.hidden&&host.isConnected)load()},30000);load()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();})(globalThis);
