/* Staging only. Receipt secrets stay in the form and are never synchronized. */
(function(root){
  'use strict';
  const ORIGIN='https://uadav-stream-staging.pages.dev',API='https://uadav-api-staging.uadavstream.workers.dev/api/';
  const credentialPattern=/^UA[CD]-[a-f0-9]{64}$/;
  function parseProof(value){
    const text=String(value||'');if(text.length>8192)throw Error('El comprobante es demasiado grande.');
    const combined=text.match(/\b((?:JOB|POST)-[A-Z0-9-]{3,80})\s*\|\s*([a-f0-9]{64})\b/i);
    const id=combined?.[1]||text.match(/(?:Identificador|Postulación):\s*((?:JOB|POST)-[A-Z0-9-]{3,80})\b/i)?.[1];
    const clave=combined?.[2]||text.match(/\bClave:\s*([a-f0-9]{64})\b/i)?.[1];
    if(!id||!clave||!(id.toUpperCase().startsWith('JOB-')?/^JOB-[A-Z0-9-]{3,80}$/i:/^POST-[A-Z0-9-]{5,80}$/i).test(id))throw Error('Usá el código completo o el archivo privado que guardaste al publicar o postularte.');
    return {tipo:id.toUpperCase().startsWith('JOB-')?'oferta':'postulacion',id:id.toUpperCase(),clave:clave.toLowerCase()};
  }
  function createClient({origin,apiBase=API,getCredential,getGeneration=()=>0,transport}){
    if(origin!==ORIGIN||apiBase!==API)throw Error('Mis trabajos solo está preparado para staging.');
    let verified='';
    const context=()=>({credential:getCredential()||'',generation:getGeneration()});
    const assertCurrent=ctx=>{if(ctx.credential!==(getCredential()||'')||ctx.generation!==getGeneration())throw Error('La cuenta cambió. Abrí Mis trabajos desde la cuenta que hizo el envío.');};
    async function call(route,method='GET',body){
      const ctx=context();if(!credentialPattern.test(ctx.credential))throw Error('Ingresá a tu cuenta desde Mi Perfil.');
      const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);
      try{
        const response=await transport(API+route,{method,headers:{Authorization:'Bearer '+ctx.credential,'Content-Type':'application/json'},cache:'no-store',signal:ctl.signal,...(body===undefined?{}:{body:JSON.stringify(body)})});
        const data=await response.json();assertCurrent(ctx);
        if(!response.ok){const error=Error([404,503].includes(response.status)?'Mis trabajos todavía no está disponible en este entorno. Podés seguir usando tu comprobante privado.':data.error||'No se confirmó la operación.');error.status=response.status;throw error;}
        if(data?.success!==true)throw Error('La respuesta no confirmó la operación.');
        return data;
      }finally{clearTimeout(timer)}
    }
    async function list(offset=0){
      const ctx=context();
      const data=await call('bolsa_trabajo/cuenta?offset='+offset);
      assertCurrent(ctx);
      if(data.enabled!==true||!Array.isArray(data.items)||data.items.length>50||data.items.some(item=>!item||!['oferta','postulacion'].includes(item.tipo)||typeof item.titulo!=='string'||!(item.tipo==='oferta'?/^JOB-[A-Z0-9-]{3,80}$/:/^POST-[A-Z0-9-]{5,80}$/).test(item.id||''))||data.next_offset!==null&&(!Number.isInteger(data.next_offset)||data.next_offset<=offset||data.next_offset>4000))throw Error('La lista de trabajos está incompleta o no pudo validarse.');
      verified=ctx.credential;return data;
    }
    return {list,assertCurrent,selection(checked){const ctx=context();if(checked&&(!credentialPattern.test(ctx.credential)||verified!==ctx.credential))throw Error('Volvé a comprobar Mis trabajos antes de guardarlo en esta cuenta.');return {...ctx,save:checked===true,headers:checked?{Authorization:'Bearer '+ctx.credential}:{}};},link:proof=>call('bolsa_trabajo/cuenta/vincular','POST',{...proof,confirm:'VINCULAR_A_MI_CUENTA'}),unlink:item=>call('bolsa_trabajo/cuenta/quitar','POST',{tipo:item.tipo,id:item.id,confirm:'QUITAR_DE_MI_CUENTA'}),inbox:id=>call('bolsa_trabajo/mis-postulantes','POST',{job_id:id,cuenta:true}),manage:(id,accion)=>call('bolsa_trabajo/mi-oferta/gestionar','POST',{job_id:id,cuenta:true,accion,dias:30})};
  }
  root.UADAVJobsAccount={createClient,parseProof};
  if(!root.document||root.location?.origin!==ORIGIN)return;
  const doc=root.document,credential=()=>root.UADAVAccount?.code?.()||'',element=(tag,text)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
  let generation=0,current=credential(),turn=0,inboxTurn=0,next=null,items=[],busy=false,profile=null;
  const client=createClient({origin:root.location.origin,getCredential:credential,getGeneration:()=>generation,transport:(...args)=>root.fetch(...args)}),choices=new Map();
  root.UADAVJobsAccount.selection=kind=>client.selection(choices.get(kind)?.input.checked===true);
  root.UADAVJobsAccount.assertCurrent=client.assertCurrent;
  function showChoices(enabled){for(const {row,input} of choices.values()){const wasEnabled=!row.hidden&&!input.disabled;row.hidden=!enabled;row.style.display=enabled?'flex':'none';if(!enabled||!wasEnabled){input.checked=enabled;input.defaultChecked=enabled}input.disabled=!enabled;}}
  function saveChoice(kind,formId,label){
    const form=doc.getElementById(formId);if(!form)return;
    const row=element('label');row.className='job-account-save';row.hidden=true;row.style.display='none';
    const input=element('input');input.type='checkbox';input.id='saveJobAccount-'+kind;
    row.append(input,element('span',label));const actions=form.querySelector('.actions');if(actions)actions.parentNode.insertBefore(row,actions);else form.append(row);
    choices.set(kind,{row,input});
  }
  function button(text,action){const node=element('button',text);node.type='button';node.className='chip job-account-button';node.addEventListener('click',action);return node;}
  const labels={activa:'Activa',publicada:'Publicada',cerrada:'Cerrada',cerrada_por_contratante:'Cerrada',vencida:'Vencida',recibida:'Recibida',pendiente:'Pendiente',en_revision:'En revisión',en_proceso:'En proceso',aprobada:'Aprobada',rechazada:'No seleccionada',aceptada:'Aceptada',finalizada:'Finalizada'};
  const stateLabel=value=>labels[value]||String(value||'Sin información').replace(/_/g,' ');
  function render(){
    if(!profile?.host.isConnected)return;profile.list.replaceChildren();
    for(const item of items){
      const card=element('article');card.className='job-account-card';card.append(element('small',item.tipo==='oferta'?'OFERTA QUE PUBLICASTE':'TU POSTULACIÓN'),element('h3',item.titulo),element('p',stateLabel(item.estado)));
      if(item.tipo==='oferta'&&item.fecha_limite)card.append(element('small','Vigencia: '+String(item.fecha_limite)));
      const actions=element('div');actions.className='job-account-actions';
      if(item.tipo==='oferta'){
        actions.append(button('Ver postulantes',async event=>{
          const target=event.currentTarget,ctx=client.selection(false),attempt=++inboxTurn;target.disabled=true;profile.status.textContent='Consultando postulantes…';
          try{const data=await client.inbox(item.id);client.assertCurrent(ctx);if(!Array.isArray(data.items))throw Error('No se confirmó la lista de postulantes.');if(attempt!==inboxTurn||!profile.host.isConnected)return;profile.inbox.replaceChildren(element('h3',item.titulo));profile.status.textContent=data.items.length===1?'1 postulación recibida':data.items.length+' postulaciones recibidas';
            for(const applicant of data.items){const row=element('article');row.className='job-account-card';row.append(element('strong',applicant.nombre||'Postulante'),element('p',stateLabel(applicant.estado)));if(applicant.mensaje)row.append(element('p',applicant.mensaje));const links=element('div');links.className='job-account-actions';const link=(text,url)=>{const anchor=element('a',text);anchor.className='chip job-account-button';anchor.href=url;anchor.target='_blank';anchor.rel='noopener noreferrer';links.append(anchor);};if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicant.email||''))link('Enviar email','mailto:'+encodeURIComponent(applicant.email));const digits=String(applicant.whatsapp||'').replace(/\D/g,'');if(digits.length>=9&&digits.length<=15)link('WhatsApp','https://wa.me/'+digits);try{const url=new URL(applicant.portfolio_url);if(['https:','http:'].includes(url.protocol)&&!url.username&&!url.password)link('Ver portfolio',url.href)}catch{}if(applicant.artist_id&&String(applicant.artist_id).length<=160)link('Ver perfil artístico',ORIGIN+'/artista.html?id='+encodeURIComponent(applicant.artist_id));row.append(links);profile.inbox.append(row);}
          }catch(error){if(attempt===inboxTurn&&profile.host.isConnected)profile.status.textContent=error.message}finally{target.disabled=false}
        }));
        for(const [action,text] of [['cerrar','Cerrar oferta'],['renovar','Renovar 30 días']]){
          if(action==='cerrar'&&!item.recibe_postulaciones)continue;
          actions.append(button(text,async event=>{if(action==='cerrar'&&!root.confirm('¿Cerrar esta oferta? Dejará de recibir postulaciones; conservarás su historial.'))return;const target=event.currentTarget;target.disabled=true;try{await client.manage(item.id,action);await load();}catch(error){if(profile.host.isConnected)profile.status.textContent=error.message}finally{target.disabled=false}}));
        }
      }
      actions.append(button('Quitar de Mi Perfil',async event=>{if(!root.confirm('¿Quitar esta gestión de Mi Perfil? La publicación y las postulaciones se conservan. Para vincularla otra vez necesitarás su comprobante privado.'))return;const target=event.currentTarget;target.disabled=true;try{await client.unlink(item);profile.inbox.replaceChildren();await load()}catch(error){if(profile.host.isConnected)profile.status.textContent=error.message}finally{target.disabled=false}}));
      card.append(actions);profile.list.append(card);
    }
    profile.more.hidden=next===null;profile.more.style.display=next===null?'none':'';
  }
  async function load(more=false){
    const secret=credential();if(secret!==current){current=secret;generation++;turn++;busy=false;items=[];next=null;showChoices(false);if(profile){profile.list.replaceChildren();profile.inbox.replaceChildren();profile.proof.value='';profile.consent.checked=false;}}
    if(!credentialPattern.test(secret)){showChoices(false);if(profile){profile.tools.hidden=true;profile.status.textContent='Creá o vinculá tu cuenta para guardar tus trabajos entre dispositivos. Los comprobantes privados siguen funcionando abajo.';}return;}
    if(busy)return;if(!more){inboxTurn++;if(profile)profile.inbox.replaceChildren()}const attempt=++turn;busy=true;if(profile){profile.tools.hidden=false;profile.refresh.disabled=true;profile.more.disabled=true;profile.status.textContent='Consultando Mis trabajos…';}
    try{const data=await client.list(more?next||0:0);if(attempt!==turn||profile&&!profile.host.isConnected)return;showChoices(true);items=more?[...new Map([...items,...data.items].map(item=>[item.tipo+'|'+item.id,item])).values()]:data.items;next=data.next_offset;if(profile){profile.status.textContent=items.length===1?'1 gestión guardada en esta cuenta.':items.length?items.length+' gestiones guardadas en esta cuenta.':'Todavía no guardaste trabajos en esta cuenta. Podés vincular un comprobante anterior.';render();}}
    catch(error){if(attempt===turn){showChoices(false);if(profile?.host.isConnected){items=[];next=null;profile.list.replaceChildren();profile.inbox.replaceChildren();profile.more.hidden=true;profile.status.textContent=error.message;}}}
    finally{if(attempt===turn){busy=false;if(profile){profile.refresh.disabled=false;profile.more.disabled=false}}}
  }
  function mountProfile(){
    const host=doc.getElementById('mis-trabajos');if(!host)return;
    const container=element('div');container.className='job-account-section';const status=element('p');status.className='muted';status.setAttribute('role','status');status.setAttribute('aria-live','polite');const refresh=button('Actualizar mis trabajos',()=>load()),tools=element('div'),list=element('div'),inbox=element('div');list.className='job-account-grid';inbox.className='job-account-grid';
    const details=element('details'),summary=element('summary','Guardar un comprobante anterior en mi cuenta'),form=element('form'),label=element('label','Código privado o contenido de tu comprobante'),proof=element('textarea');proof.id='accountJobProof';proof.autocomplete='off';proof.spellcheck=false;proof.rows=3;proof.required=true;proof.maxLength=8192;label.htmlFor=proof.id;
    const consentLabel=element('label'),consent=element('input');consent.type='checkbox';consent.required=true;consentLabel.append(consent,element('span','Confirmo que quiero guardar esta gestión en mi cuenta actual.'));const submit=element('button','Guardar en Mi Perfil');submit.type='submit';submit.className='chip active job-account-button';const upload=element('input');upload.type='file';upload.accept='.txt,text/plain';upload.hidden=true;upload.setAttribute('aria-label','Elegir comprobante privado');const pick=button('Abrir archivo de comprobante',()=>upload.click());
    upload.addEventListener('change',async()=>{const file=upload.files?.[0];if(!file)return;const previous=current,readGeneration=generation;try{if(file.size>8192)throw Error('El archivo es demasiado grande.');const text=await file.text();if(previous!==credential()||readGeneration!==generation)throw Error('La cuenta cambió. Volvé a elegir el archivo.');const parsed=parseProof(text);proof.value=parsed.id+'|'+parsed.clave;consent.checked=false;status.textContent='Comprobante reconocido. Confirmá si querés guardarlo en esta cuenta.';}catch(error){status.textContent=error.message}finally{upload.value='';}});
    form.addEventListener('submit',async event=>{event.preventDefault();if(submit.disabled||!consent.checked)return;const original=proof.value;submit.disabled=true;try{await client.link(parseProof(original));if(proof.value===original)proof.value='';consent.checked=false;await load();}catch(error){if(host.isConnected)status.textContent=error.message;}finally{if(proof.value===original)proof.value='';submit.disabled=false;}});
    form.append(label,proof,consentLabel,submit,pick,upload);details.append(summary,form);const more=button('Cargar más gestiones',()=>load(true));more.hidden=true;
    tools.append(refresh,details);container.append(status,tools,list,more,inbox);host.insertBefore(container,host.children[2]||null);profile={host,status,tools,list,inbox,more,refresh,proof,consent};
  }
  function mount(){
    const style=element('style');style.textContent='.job-account-save{align-items:flex-start;gap:10px;grid-column:1/-1;padding:12px 0;text-transform:none!important;letter-spacing:normal!important}.job-account-save input{width:20px;min-height:20px;flex:0 0 20px}.job-account-section{margin:16px 0}.job-account-section form{display:grid;gap:12px;margin:14px 0}.job-account-section textarea{width:100%;font:inherit;font-size:16px;background:#121825;color:#fff;border:1px solid #ffffff33;border-radius:12px;padding:12px}.job-account-section form label{display:flex;gap:10px;align-items:flex-start}.job-account-section details{margin:14px 0}.job-account-section summary{cursor:pointer;font-weight:700;padding:12px 0}.job-account-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:14px 0}.job-account-card{padding:16px;border:1px solid #ffffff22;border-radius:16px;overflow-wrap:anywhere;background:#101620}.job-account-card h3{margin:10px 0}.job-account-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.job-account-button{min-height:44px;white-space:normal}.job-account-button:focus-visible,.job-account-section textarea:focus-visible{outline:3px solid #8fb8ff;outline-offset:3px}@media(max-width:700px){.job-account-grid{grid-template-columns:1fr}.job-account-actions>*{flex:1 1 auto}}';doc.head.append(style);
    mountProfile();saveChoice('oferta','jobPostForm','Guardar esta oferta en Mi Perfil');saveChoice('postulacion','applyForm','Guardar esta postulación en Mi Perfil');load();
    root.addEventListener('uadav:account',()=>{if(credential()!==current)load()});root.addEventListener('storage',event=>{if(event.key==='uadav_account_access_v1')load()});root.addEventListener('focus',()=>{if(!profile||profile.host.isConnected)load()});root.addEventListener('online',()=>load());
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(window);
