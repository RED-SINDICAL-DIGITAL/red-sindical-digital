(()=>{'use strict';const api=(window.PLATFORM_API_BASE||window.UADAV_API_BASE||'').replace(/\/?$/,'/'),form=document.getElementById('commercialForm'),button=document.getElementById('send'),status=document.getElementById('result');let busy=false,completed=false,ready=false,attempt=null;
async function request(path,opt={}){if(!api)throw Error('La configuración del servidor no está disponible.');const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);try{const r=await fetch(api+path,{...opt,cache:'no-store',signal:ctl.signal});let data;try{data=await r.json()}catch{throw Error('El servidor no devolvió una respuesta válida. No se confirmó la operación.')}if(!r.ok||data?.success===false||data?.ok===false)throw Error(data?.error||'No pudimos confirmar la consulta.');return data}catch(e){if(e?.name==='AbortError')throw Error('La consulta tardó demasiado. Antes de reintentar, verificá si ya fue recibida para evitar duplicados.');throw e}finally{clearTimeout(timer)}}
async function checkAvailability(){
 const notice=document.getElementById('availability');
 notice.textContent='Comprobando disponibilidad del formulario…';
 try{
  const data=await request('advertising/inquiries/capabilities');
  ready=data.enabled===true;
  button.disabled=!ready;
  if(ready){
   notice.textContent='Tu consulta llegará a la bandeja de administración de Santa Fe.';
   return;
  }
  notice.textContent='El formulario todavía no está habilitado. ';
 }catch{
  notice.textContent='No pudimos comprobar la disponibilidad. ';
 }
 const contact=document.createElement('a');
 contact.href='/contacto.html';
 contact.textContent='Ver contacto oficial';
 const retry=document.createElement('button');
 retry.type='button';
 retry.textContent='Reintentar';
 retry.onclick=()=>{retry.disabled=true;checkAvailability()};
 notice.append(contact,' ',retry);
}
checkAvailability();
form.onsubmit=async e=>{e.preventDefault();if(busy||completed||!ready)return;const fields=Object.fromEntries(new FormData(form));fields.consent=form.elements.consent.checked;const snapshot=JSON.stringify(fields);if(!attempt||attempt.snapshot!==snapshot)attempt={snapshot,id:crypto.randomUUID()};busy=true;const controls=[...form.elements],disabled=controls.map(x=>x.disabled);controls.forEach(x=>x.disabled=true);status.textContent='Verificando y enviando…';try{const token=await window.UADAVSecurity.token('commercial_inquiry');const d=await request('advertising/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...fields,request_id:attempt.id,turnstile_token:token})});if(d.success!==true||d.id!=='PUB-'+attempt.id)throw Error('No pudimos confirmar la referencia. Conservá tus datos y reintentá.');completed=true;status.textContent='Consulta guardada para Santa Fe. Referencia: '+d.id+'. No se envió un correo automático.';button.textContent='Consulta guardada';}catch(error){status.textContent=error.message||'No pudimos confirmar la consulta. Tus datos siguen en el formulario.';}finally{busy=false;if(!completed)controls.forEach((x,i)=>x.disabled=disabled[i]);}};
})();
