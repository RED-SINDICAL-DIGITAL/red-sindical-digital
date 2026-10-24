/* Reuses the authenticated Admin transport; never reads or stores its key. */
(function(root){
  'use strict';
  const ORIGIN='https://uadav-stream-staging.pages.dev',API='https://uadav-api-staging.uadavstream.workers.dev/api/';
  const validDay=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value))&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
  function validPreview(value){
    const until=validDay(value?.day)?new Date(Date.parse(value.day+'T12:00:00Z')+3*86400000).toISOString().slice(0,10):'';
    return value?.success===true&&value.dry_run===true&&validDay(value.day)&&value.advance_days===3&&/^[a-f0-9]{64}$/.test(value.fingerprint||'')&&Number.isInteger(value.pending)&&value.pending>=0&&value.pending<=2000&&value.batch_size===Math.min(5,value.pending)&&value.more_pending===(value.pending>5)&&Array.isArray(value.items)&&value.items.length===value.batch_size&&new Set(value.items.map(x=>x?.job_id)).size===value.items.length&&value.items.every(x=>/^JOB-[A-Z0-9-]{3,80}$/i.test(x?.job_id||'')&&typeof x.title==='string'&&x.title.length<=160&&validDay(x.deadline)&&(x.kind==='soon'?x.deadline>=value.day&&x.deadline<=until:x.kind==='expired'&&x.deadline<value.day));
  }
  function controller({origin,apiBase,request,onChange=()=>{},alive=()=>true}){
    if(origin!==ORIGIN||apiBase!==API)throw Error('Los avisos solo se pueden revisar en Admin staging.');
    let state={busy:false,preview:null,confirmed:false,message:'Revisá las ofertas antes de enviar avisos a sus cuentas.'};
    const emit=()=>{if(alive())onChange({...state})};
    const canSend=()=>!!(!state.busy&&state.confirmed&&state.preview?.batch_size&&alive());
    async function review(){
      if(state.busy||!alive())return;
      state={...state,busy:true,preview:null,confirmed:false,message:'Revisando vencimientos…'};emit();
      try{const data=await request('admin/jobs/expiry-notices',{method:'GET'});if(!alive())return;if(!validPreview(data))throw Error('No se confirmó la revisión. Volvé a revisar antes de enviar.');state.preview=data;state.message=data.pending?data.pending+' ofertas tienen avisos pendientes. Esta revisión permite enviar hasta '+data.batch_size+'.':'No hay avisos pendientes para las cuentas vinculadas.'}
      catch(error){if(alive())state.message=error?.status===404?'Los avisos de vencimiento todavía no están preparados en staging.':error?.message||'No se pudo completar la revisión.'}
      finally{state.busy=false;emit()}
    }
    function confirm(value){if(!state.busy&&state.preview){state.confirmed=value===true;emit()}}
    async function send(){
      if(!canSend())return;
      const preview=state.preview;state={...state,busy:true,confirmed:false,message:'Enviando los avisos de esta revisión…'};emit();
      try{
        const data=await request('admin/jobs/expiry-notices',{method:'POST',body:{confirm:'EMITIR_AVISOS_VENCIMIENTO_STAGING',fingerprint:preview.fingerprint}});
        if(!alive())return;
        if(data?.success!==true||data.dry_run!==false||data.fingerprint!==preview.fingerprint||typeof data.more_pending!=='boolean'||!Number.isInteger(data.emitted)||data.emitted<0||data.emitted>preview.batch_size||!Number.isInteger(data.recorded)||data.recorded<data.emitted||data.recorded>preview.batch_size)throw Error('No se confirmó el resultado. Revisá los avisos antes de volver a enviar.');
        state.message=data.emitted===1?'Se generó 1 aviso privado en Mi Perfil.':'Se generaron '+data.emitted+' avisos privados en Mi Perfil.';if(data.more_pending)state.message+=' Volvé a revisar para continuar con los siguientes.';
      }catch(error){if(alive())state.message=(error?.message||'No se pudo confirmar el envío.')+' Volvé a revisar antes de intentar otra vez.'}
      finally{state.busy=false;state.preview=null;state.confirmed=false;emit()}
    }
    return {review,confirm,send,canSend,getState:()=>({...state})};
  }
  function mount(host,{request,apiBase}){
    if(!host||root.location?.origin!==ORIGIN||apiBase!==API)return;
    host.className='card card-pad';host.style.marginTop='16px';
    host.innerHTML='<div class="section-title"><div><h2>Avisos por vencimiento de ofertas</h2><small>Próximos 3 días y ofertas vencidas.</small></div></div><p>Los avisos llegan a Mi Perfil de quienes guardaron sus ofertas en una cuenta. Las candidaturas se conservan.</p><button type="button" class="btn btn-secondary" data-expiry="review">Revisar vencimientos</button><ul data-expiry="items" style="display:grid;gap:10px;margin:16px 0;padding-left:22px"></ul><label style="display:flex;gap:10px;align-items:flex-start;margin:16px 0"><input type="checkbox" data-expiry="confirm">Confirmo el envío de los avisos privados de esta revisión.</label><button type="button" class="btn btn-primary" data-expiry="send" disabled>Enviar avisos revisados</button><p class="callout" data-expiry="status" role="status" aria-live="polite"></p><p class="muted">Esta acción genera avisos internos. La recuperación por correo sigue deshabilitada.</p>';
    const get=name=>host.querySelector('[data-expiry="'+name+'"]');let flow;
    flow=controller({origin:root.location.origin,apiBase,request,alive:()=>host.isConnected,onChange:state=>{
      get('review').disabled=state.busy;get('send').disabled=!flow.canSend();get('confirm').disabled=state.busy||!state.preview?.batch_size;get('confirm').checked=state.confirmed;get('status').textContent=state.message;
      const list=get('items');list.replaceChildren();for(const item of state.preview?.items||[]){const row=host.ownerDocument.createElement('li');row.textContent=item.title+' · '+item.deadline+' · '+(item.kind==='soon'?'Por vencer':'Vencida');list.append(row)}
    }});
    get('review').addEventListener('click',()=>flow.review());get('confirm').addEventListener('change',()=>flow.confirm(get('confirm').checked));get('send').addEventListener('click',()=>flow.send());get('confirm').disabled=true;get('status').textContent=flow.getState().message;
  }
  root.UADAVJobsExpiry={controller,validPreview,mount};
})(window);
