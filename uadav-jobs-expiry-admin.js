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
      try{const data=await request('admin/jobs/expiry-notices',{method:'GET'});if(!alive())return;if(!validPreview(data))throw Error('Los avisos de vencimiento no están disponibles. Volvé a revisar más tarde.');state.preview=data;state.message=data.pending?data.pending+' ofertas tienen avisos pendientes. Esta revisión permite enviar hasta '+data.batch_size+'.':'No hay avisos pendientes para las cuentas vinculadas.'}
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
  const validStamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
  function validCronRun(value){
    return !!value&&value.version===1&&['success','error'].includes(value.status)&&Number.isSafeInteger(value.scheduled_time)&&value.scheduled_time>0&&value.scheduled_time<8640000000000000&&validStamp(value.started_at)&&validStamp(value.completed_at)&&value.completed_at>=value.started_at&&(value.status==='error'||['processed','emitted','recorded'].every(key=>Number.isInteger(value[key])&&value[key]>=0&&value[key]<=5)&&value.emitted<=value.recorded);
  }
  function validCron(value){
    return value?.success===true&&value.scope==='bolsa-staging'&&value.schedule==='*/15 * * * *'&&['enabled','paused','ready','running','interrupted'].every(key=>typeof value[key]==='boolean')&&!(value.running&&value.interrupted)&&(value.attempt_started_at===null||validStamp(value.attempt_started_at))&&(!(value.running||value.interrupted)||value.attempt_started_at!==null)&&(value.last_run===null||validCronRun(value.last_run))&&(value.last_success===null||validCronRun(value.last_success)&&value.last_success.status==='success');
  }
  function cronMessage(data){
    let message=!data.ready?'La revisión automática aún no está preparada.':data.paused?'Las revisiones automáticas están pausadas por mantenimiento.':!data.enabled?'La revisión automática está desactivada.':data.running?'Hay una revisión automática en curso.':data.interrupted?'Una revisión quedó sin confirmar. La próxima ejecución podrá reintentar lo pendiente.':'Activada para revisar cada 15 minutos.';
    if(data.last_run){
      const date=new Intl.DateTimeFormat('es-AR',{dateStyle:'short',timeStyle:'short',hourCycle:'h23',timeZone:'America/Argentina/Buenos_Aires'}).format(new Date(data.last_run.completed_at));
      message+=' Última revisión: '+date+' (hora de Argentina).';
      message+=data.last_run.status==='success'?' '+(data.last_run.processed===1?'Se actualizó 1 oferta':'Se actualizaron '+data.last_run.processed+' ofertas')+' y '+(data.last_run.emitted===1?'se generó 1 aviso privado.':'se generaron '+data.last_run.emitted+' avisos privados.'):' No se confirmó su finalización.';
    }else if(data.ready&&!data.running&&!data.interrupted)message+=' Todavía no hay una ejecución confirmada.';
    return message;
  }
  function cronController({origin,apiBase,request,onChange=()=>{},alive=()=>true}){
    if(origin!==ORIGIN||apiBase!==API)throw Error('La revisión automática solo se puede consultar en Admin staging.');
    let state={busy:false,message:'Consultá el estado de la revisión automática.'};const emit=()=>{if(alive())onChange({...state})};
    async function refresh(){
      if(state.busy||!alive())return;
      state={busy:true,message:'Consultando la revisión automática…'};emit();
      try{const data=await request('admin/jobs/cron',{method:'GET'});if(!alive())return;if(!validCron(data))throw Error('Invalid cron response');state.message=cronMessage(data)}
      catch(error){if(alive())state.message=error?.status===404?'La revisión automática todavía no está disponible en el servicio.':'No se pudo comprobar la revisión automática. Volvé a consultar más tarde.'}
      finally{state.busy=false;emit()}
    }
    return {refresh,getState:()=>({...state})};
  }
  function mount(host,{request,apiBase}){
    if(!host||root.location?.origin!==ORIGIN||apiBase!==API)return;
    host.className='card card-pad';host.style.marginTop='16px';
    host.innerHTML='<div class="section-title"><div><h2>Avisos por vencimiento de ofertas</h2><small>Próximos 3 días y ofertas vencidas.</small></div></div><p>Los avisos llegan a Mi Perfil de quienes guardaron sus ofertas en una cuenta. Las candidaturas se conservan.</p><h3>Revisión automática</h3><p class="callout" data-cron="status" role="status" aria-live="polite"></p><button type="button" class="btn btn-secondary" data-cron="refresh">Actualizar estado automático</button><h3>Revisión manual</h3><button type="button" class="btn btn-secondary" data-expiry="review">Revisar vencimientos</button><ul data-expiry="items" style="display:grid;gap:10px;margin:16px 0;padding-left:22px"></ul><label style="display:flex;gap:10px;align-items:flex-start;margin:16px 0"><input type="checkbox" data-expiry="confirm">Confirmo el envío de los avisos privados de esta revisión.</label><button type="button" class="btn btn-primary" data-expiry="send" disabled>Enviar avisos revisados</button><p class="callout" data-expiry="status" role="status" aria-live="polite"></p><p class="muted">Esta acción genera avisos internos. La recuperación por correo sigue deshabilitada.</p>';
    const get=name=>host.querySelector('[data-expiry="'+name+'"]');let flow;
    flow=controller({origin:root.location.origin,apiBase,request,alive:()=>host.isConnected,onChange:state=>{
      get('review').disabled=state.busy;get('send').disabled=!flow.canSend();get('confirm').disabled=state.busy||!state.preview?.batch_size;get('confirm').checked=state.confirmed;get('status').textContent=state.message;
      const list=get('items');list.replaceChildren();for(const item of state.preview?.items||[]){const row=host.ownerDocument.createElement('li');row.textContent=item.title+' · '+item.deadline+' · '+(item.kind==='soon'?'Por vencer':'Vencida');list.append(row)}
    }});
    get('review').addEventListener('click',()=>flow.review());get('confirm').addEventListener('change',()=>flow.confirm(get('confirm').checked));get('send').addEventListener('click',()=>flow.send());get('confirm').disabled=true;get('status').textContent=flow.getState().message;
    const cronStatus=host.querySelector('[data-cron="status"]'),cronRefresh=host.querySelector('[data-cron="refresh"]');
    const automatic=cronController({origin:root.location.origin,apiBase,request,alive:()=>host.isConnected,onChange:state=>{cronStatus.textContent=state.message;cronRefresh.disabled=state.busy}});
    cronRefresh.addEventListener('click',()=>automatic.refresh());automatic.refresh();
  }
  root.UADAVJobsExpiry={controller,validPreview,cronController,validCron,mount};
})(window);
