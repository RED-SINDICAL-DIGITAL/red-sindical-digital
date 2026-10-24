/* Bolsa staging: uses the current Admin session without handling its key.
 * Backups are private administrative files. Installing SQL and activating D1
 * remain manual steps. */
(function(root){
  'use strict';
  const ORIGIN='https://uadav-stream-staging.pages.dev';
  const API='https://uadav-api-staging.uadavstream.workers.dev/api/';
  const COLLECTIONS=['bolsa_trabajo','postulaciones_trabajo'];
  const TABLES=['job_store_meta','job_store_records','job_store_rates','job_owner_credentials','job_owner_recovery_tokens','job_owner_recovery_v2'];
  function verifyBackup(backup){
    if(!backup||backup.backup_integrity?.complete!==true||!backup.kv||!backup.tables||!Number.isFinite(Date.parse(backup.generated_at||'')))throw Error('El respaldo no está completo. No se preparó la migración.');
    for(const key of COLLECTIONS)if(!Array.isArray(backup.kv[key])||backup.kv[key].length>2000)throw Error('El respaldo de Bolsa no es válido.');
    if(Object.values(backup.tables).some(rows=>!Array.isArray(rows)))throw Error('El respaldo tiene tablas sin verificar.');
    if(!['kv','d1'].includes(backup.job_storage))throw Error('El Worker no informa el origen de Bolsa. Verificá el build 11758.');
    const missing=TABLES.filter(name=>!Array.isArray(backup.tables[name]));
    if(backup.job_storage==='d1'){
      const mismatch=()=>{throw Error('El respaldo de D1 no coincide con todos sus registros y credenciales. Repetí el respaldo; si vuelve a fallar, pausá las escrituras de staging para revisarlo.');};
      if(missing.length||!backup.tables.job_store_meta.some(row=>row?.key==='migration_ready'&&row.value==='true'))mismatch();
      const records=new Map(),credentials=new Map();
      for(const row of backup.tables.job_store_records){
        const key=row?.collection+'|'+row?.id;
        if(!COLLECTIONS.includes(row?.collection)||typeof row.id!=='string'||records.has(key))mismatch();
        records.set(key,row);
      }
      for(const row of backup.tables.job_owner_credentials){
        if(typeof row?.job_id!=='string'||credentials.has(row.job_id))mismatch();
        credentials.set(row.job_id,row.secret_hash);
      }
      let total=0;
      for(const collection of COLLECTIONS){
        const seen=new Set();
        for(const item of backup.kv[collection]){
          if(!item||typeof item.id!=='string'||seen.has(item.id))mismatch();
          seen.add(item.id);total++;
          const row=records.get(collection+'|'+item.id),{owner_access_hash,...payload}=item;
          if(!row||row.data_json!==JSON.stringify(payload)||String(row.request_id||'')!==String(item.request_id||''))mismatch();
          if(collection==='bolsa_trabajo'&&credentials.has(item.id)!==Boolean(owner_access_hash))mismatch();
          if(owner_access_hash&&(!/^[a-f0-9]{64}$/.test(owner_access_hash)||credentials.get(item.id)!==owner_access_hash))mismatch();
        }
      }
      if(total!==records.size)mismatch();
    }
    return {counts:Object.fromEntries(COLLECTIONS.map(key=>[key,backup.kv[key].length])),missing,source:backup.job_storage||'kv',generated_at:backup.generated_at};
  }
  function controller({origin,apiBase,request,download,onChange=()=>{},alive=()=>true}){
    if(origin!==ORIGIN||apiBase!==API)throw Error('Esta herramienta solo funciona en Admin staging con su API de pruebas.');
    let stopped=false;
    const state={busy:false,phase:'idle',message:'Primero generá el respaldo y revisá las tablas.',preview:null,backup:null,offset:0,complete:false,checks:{backup:false,isolation:false,maintenance:false}};
    const emit=()=>onChange({...state,checks:{...state.checks}});
    const validPreview=p=>p?.success===true&&p.dry_run===true&&/^[a-f0-9]{64}$/.test(p.fingerprint||'')&&COLLECTIONS.every(key=>Number.isInteger(p.counts?.[key])&&p.counts[key]>=0&&p.counts[key]<=2000);
    const canRun=()=>Boolean(!state.busy&&!state.complete&&state.preview&&state.backup?.source==='kv'&&!state.backup.missing.length&&Object.values(state.checks).every(Boolean));
    async function prepare(){
      if(state.busy)return;
      state.busy=true;state.phase='checking';state.complete=false;state.preview=null;state.backup=null;state.offset=0;state.checks={backup:false,isolation:false,maintenance:false};state.message='Consultando Bolsa y generando un respaldo privado…';emit();
      try{
        const backup=await request('v7/export',{method:'GET'});
        const checked=verifyBackup(backup);
        if(checked.source==='d1'){
          if(!alive())return;
          await download(backup);
          state.backup=checked;state.phase='already-d1';state.message='Respaldo actual de D1 verificado y descarga solicitada. Guardá el archivo. Bolsa ya usa D1. No corresponde repetir la migración desde KV.';return;
        }
        const preview=await request('admin/jobs/migration',{method:'GET'});
        if(!validPreview(preview)||COLLECTIONS.some(key=>preview.counts[key]!==checked.counts[key]))throw Error('Bolsa cambió o la respuesta está incompleta. Generá de nuevo el respaldo.');
        if(!alive())return;
        await download(backup);
        state.preview=preview;state.backup=checked;state.phase=checked.missing.length?'missing-schema':'ready';
        state.message=checked.missing.length?'Respaldo generado. Falta instalar el SQL de Bolsa en la base D1 de staging. Después volvé a revisar.':'Respaldo generado y tablas de respaldo presentes. Guardá el archivo y confirmá los tres pasos antes de copiar.';
      }catch(error){state.phase='error';state.message=error?.message||'No se pudo verificar el respaldo. No se inició la copia.'}
      finally{state.busy=false;emit()}
    }
    function confirm(name,checked){
      if(state.busy||!Object.hasOwn(state.checks,name))return;
      state.checks[name]=checked===true;emit();
    }
    async function run(){
      if(!canRun()||!alive())return;
      stopped=false;state.busy=true;state.phase='copying';state.message='Copiando registros por lotes pequeños. Mantené esta pantalla abierta.';emit();
      const expected=state.preview.fingerprint,total=COLLECTIONS.reduce((sum,key)=>sum+state.preview.counts[key],0);
      try{
        let batches=0;
        while(!stopped&&alive()){
          const offset=state.offset;
          const result=await request('admin/jobs/migration',{method:'POST',body:{dry_run:false,confirm:'MIGRAR_BOLSA_STAGING',fingerprint:expected,offset}});
          if(result?.success!==true||result.dry_run!==false||result.fingerprint!==expected||!Number.isInteger(result.processed)||result.processed<0||result.processed>3||typeof result.complete!=='boolean')throw Error('La respuesta del lote no pudo validarse. La copia quedó detenida.');
          if(result.complete){
            if(result.next_offset!==null||offset+result.processed!==total)throw Error('La respuesta final no confirma todos los registros.');
            state.offset=total;state.complete=true;state.phase='complete';state.message='Copia y comparación final confirmadas por el Worker. D1 no se activa desde esta pantalla. Falta validar el corte y los accesos.';break;
          }
          if(!Number.isInteger(result.next_offset)||result.next_offset<=offset||result.next_offset>total||result.next_offset!==offset+result.processed)throw Error('El servidor devolvió un lote sin avance verificable.');
          state.offset=result.next_offset;state.message='Copiados '+state.offset+' de '+total+' registros.';emit();
          if(++batches>Math.ceil(total/3)+1)throw Error('Se alcanzó el límite de lotes. Revisá el diagnóstico.');
        }
        if(!state.complete){state.phase='paused';state.message='Copia pausada después del lote en curso. Podés continuar desde el último lote confirmado.'}
      }catch(error){state.phase='error';state.message=error?.message||'No se confirmó el lote. Podés reintentar el mismo lote; no se sobrescriben datos.'}
      finally{state.busy=false;emit()}
    }
    function pause(){if(state.busy&&state.phase==='copying'){stopped=true;state.message='Se pausará cuando termine el lote en curso.';emit()}}
    function report(){
      const counts=state.preview?.counts||state.backup?.counts,d1=state.backup?.source==='d1';
      return ['UADAV STREAM · Bolsa staging','Resultado: '+state.phase,'Ofertas: '+(counts?.bolsa_trabajo??'sin revisar'),'Postulaciones: '+(counts?.postulaciones_trabajo??'sin revisar'),'Almacenamiento observado: '+(state.backup?.source?.toUpperCase()||'sin revisar'),'Respaldo actual: '+(state.backup?'verificado; descarga solicitada':'sin generar'),'Registros confirmados: '+(d1?'no aplica; D1 en uso':state.offset),'Comparación final: '+(d1?'respaldo D1 consistente':state.complete?'confirmada':'pendiente'),'Activación D1: no realizada por esta herramienta','Recuperación por correo: no habilitada por esta herramienta'].join('\n');
    }
    return {prepare,confirm,run,pause,report,canRun,getState:()=>({...state,checks:{...state.checks}})};
  }
  function mount(host,{request,apiBase,download}){
    if(!host||location.origin!==ORIGIN||apiBase!==API)return;
    host.className='card card-pad';host.style.marginTop='16px';
    host.innerHTML='<div class="section-title"><div><h2>Preparar Bolsa en D1 · Solo staging</h2><small>Respaldo, revisión y copia guiada. La activación sigue siendo manual.</small></div></div><p>Primero descargá el respaldo. Instalá el SQL en la base vinculada al Worker de pruebas y volvé a revisar. Esta pantalla copia ofertas y postulaciones; conserva KV.</p><div class="actions" style="display:flex;flex-wrap:wrap;gap:10px"><button type="button" class="btn btn-primary" data-job="prepare">Generar respaldo y revisar</button><a class="btn btn-secondary" href="https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/blob/release/radio-studio-staging-rc-20261020/migrations/staging/20261024_bolsa_completa.sql" target="_blank" rel="noopener noreferrer">Abrir SQL de staging</a></div><p data-job="counts" class="muted"></p><p data-job="schema" class="muted"></p><fieldset style="border:1px solid var(--border,#30425e);border-radius:12px;padding:14px;display:grid;gap:12px;margin:14px 0"><legend>Confirmaciones antes de copiar</legend><label style="display:flex;gap:10px;align-items:flex-start"><input type="checkbox" data-job="backup">Guardé el respaldo actual que acaba de generar esta pantalla.</label><label style="display:flex;gap:10px;align-items:flex-start"><input type="checkbox" data-job="isolation">Verifiqué en Cloudflare que DB pertenece a staging y es distinta de producción.</label><label style="display:flex;gap:10px;align-items:flex-start"><input type="checkbox" data-job="maintenance">Activé JOB_STORE_MAINTENANCE=true y dejé JOB_STORE_D1 desactivado en el Worker staging. Las solicitudes anteriores ya terminaron.</label></fieldset><div class="actions" style="display:flex;flex-wrap:wrap;gap:10px"><button type="button" class="btn btn-primary" data-job="run" disabled>Copiar Bolsa a D1</button><button type="button" class="btn btn-secondary" data-job="pause" disabled>Pausar después del lote</button><button type="button" class="btn btn-secondary" data-job="report">Copiar resultado sin datos privados</button></div><p class="callout" data-job="status" role="status" aria-live="polite"></p><p class="muted" data-job="copy-status" role="status"></p><p class="muted">La recuperación por correo y la restauración siguen bloqueadas. Al terminar, dejá la activación D1 pendiente para validar los accesos.</p>';
    const get=name=>host.querySelector('[data-job="'+name+'"]'),confirmations=host.querySelector('fieldset'),notice=host.lastElementChild;let flow;
    notice.textContent='Esta herramienta no habilita recuperación por correo ni restauración. La activación de D1 requiere validar los accesos.';
    flow=controller({origin:location.origin,apiBase,request,alive:()=>host.isConnected,download:async data=>download(new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),'uadav-bolsa-staging-backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json'),onChange:state=>{
      if(!host.isConnected)return;
      get('status').textContent=state.message;get('prepare').disabled=state.busy;get('run').disabled=!flow.canRun();get('pause').disabled=!state.busy||state.phase!=='copying';
      get('run').textContent=state.offset&&!state.complete?'Continuar copia':'Copiar Bolsa a D1';
      for(const key of ['backup','isolation','maintenance']){get(key).disabled=state.busy;get(key).checked=state.checks[key]}
      const counts=state.preview?.counts||state.backup?.counts;
      get('counts').textContent=counts?'Ofertas: '+counts.bolsa_trabajo+' · Postulaciones: '+counts.postulaciones_trabajo+(state.backup?.source==='d1'?' · Origen actual: D1':' · Registros confirmados: '+state.offset):'';
      const d1=state.backup?.source==='d1';confirmations.hidden=d1;confirmations.style.display=d1?'none':'grid';
      for(const name of ['run','pause']){get(name).hidden=d1;get(name).style.display=d1?'none':''}
      notice.textContent=d1?'Bolsa ya usa D1. Conservá este respaldo actual. Volver a KV requiere reconciliar los datos escritos desde el cambio. Esta herramienta no habilita recuperación por correo ni restauración.':'Esta herramienta no habilita recuperación por correo ni restauración. La activación de D1 requiere validar los accesos.';
      get('schema').textContent=state.backup?.missing.length?'Tablas pendientes: '+state.backup.missing.join(', '):state.backup?'Tablas de respaldo requeridas: presentes.':'';
    }});
    get('prepare').addEventListener('click',()=>flow.prepare());
    for(const key of ['backup','isolation','maintenance'])get(key).addEventListener('change',()=>flow.confirm(key,get(key).checked));
    get('run').addEventListener('click',()=>flow.run());get('pause').addEventListener('click',()=>flow.pause());
    get('report').addEventListener('click',async()=>{const out=get('copy-status');try{await navigator.clipboard.writeText(flow.report());out.textContent='Resultado copiado. No contiene nombres, correos, claves ni hashes.'}catch{out.textContent=flow.report()}});
    get('status').textContent=flow.getState().message;
  }
  root.UADAVJobsMigration={controller,verifyBackup,mount};
})(window);
