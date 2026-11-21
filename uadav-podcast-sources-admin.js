(()=>{'use strict';
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el};
const btn=(text,action)=>{const b=node('button',text,'btn btn-secondary');b.type='button';b.onclick=action;return b};
async function render(host,api,isCurrent=()=>true){
 host.replaceChildren();const card=node('section',null,'card card-pad'),heading=node('h2','Fuentes RSS de podcasts'),status=node('p','Comprobando importación RSS…','muted');
 status.setAttribute('role','status');host.append(card);card.append(heading,node('p','Agregá un programa una sola vez. Revisá sus episodios antes de importarlos.','muted'),status);
 const current=()=>isCurrent()&&host.isConnected&&host.contains(card);let saving=false,busy=false,selected=null,items=[];
 const form=node('form');form.style.cssText='display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin:20px 0';
 function field(label,type='text'){const l=node('label',label),input=node('input');input.type=type;input.className='input';input.style.cssText='display:block;width:100%;min-height:48px;margin-top:8px;font-size:16px';l.append(input);form.append(l);return input}
 const name=field('Nombre del programa'),url=field('URL pública del RSS','url'),interval=field('Actualizar cada cuántas horas','number');interval.min=1;interval.max=168;interval.value=12;name.maxLength=120;
 const autoLabel=node('label','Actualizar y publicar automáticamente '),auto=node('input');auto.type='checkbox';autoLabel.prepend(auto);form.append(autoLabel);
 const controls=node('div');controls.style.cssText='grid-column:1/-1;display:flex;gap:10px;flex-wrap:wrap';
 const preview=node('section'),list=node('section'),episodes=node('section');let viewToken=0;
 function feedback(text){if(current())status.textContent=text}
 function reset(){selected=null;name.value='';url.value='';url.disabled=false;interval.value=12;auto.checked=false;preview.replaceChildren();save.textContent='Guardar fuente'}
 async function run(button,operation){if(busy||saving||!current())return;busy=true;button.disabled=true;try{await operation()}catch(e){feedback(e.message||'No se pudo completar. Conservamos los datos para reintentar.')}finally{busy=false;if(current())button.disabled=false}}
 const check=btn('Ver episodios antes de importar',()=>run(check,async()=>{
  const requestedURL=url.value.trim();feedback('Leyendo el RSS…');preview.replaceChildren();const result=await api('admin/podcasts/preview',{method:'POST',body:{url:requestedURL}});
  if(!current())return;if(url.value.trim()!==requestedURL){feedback('La URL cambió. Volvé a revisar el RSS.');return}if(result?.success!==true||!Array.isArray(result.episodes))throw Error('No se pudo confirmar la lectura.');
  preview.append(node('h3',result.title||'Vista previa'),node('p',result.parsed+' episodios compatibles · '+result.skipped+' sin medio compatible. Esta vista no publica.'));
  const ol=node('ol');for(const item of result.episodes){ol.append(node('li',(item.media_type==='video'?'Video · ':'Audio · ')+item.titulo))}preview.append(ol);
  if(result.truncated)preview.append(node('p','El feed supera el límite de 200 episodios por lectura.','muted'));feedback('Vista previa lista. Revisá los episodios antes de importar.');
 }));
 const save=btn('Guardar fuente',()=>{});save.type='submit';
 controls.append(check,save,btn('Nueva fuente',()=>{if(!busy&&!saving)reset()}));form.append(controls);
 form.onsubmit=async e=>{e.preventDefault();if(saving||busy||!current())return;if(!name.value.trim()||!url.value.trim()){feedback('Completá nombre y URL del programa.');return}
  saving=true;save.disabled=true;[name,url,interval,auto].forEach(el=>el.disabled=true);try{
   const result=await api('admin/podcasts/sources',{method:'POST',body:{...(selected?{id:selected.id}:{}),name:name.value.trim(),url:url.value.trim(),interval_hours:Number(interval.value),active:auto.checked,auto_publish:auto.checked}});
   if(!current())return;if(result?.success!==true||!result.id)throw Error('No se confirmó el guardado. Conservamos el formulario.');
   reset();await refresh();feedback('Fuente guardada. Importar ahora publica sus episodios; la actualización automática depende del Worker.');
  }catch(e){feedback(e.message||'No se pudo guardar. Conservamos el formulario.')}finally{saving=false;if(current()){save.disabled=false;[name,interval,auto].forEach(el=>el.disabled=false);url.disabled=!!selected}}
 };
 async function showEpisodes(source){
  const token=++viewToken;feedback('Cargando episodios…');const data=await api('admin/podcasts/episodes?source_id='+encodeURIComponent(source.id));
  if(!current()||token!==viewToken)return;episodes.replaceChildren(node('h3','Episodios · '+source.name));
  if(!Array.isArray(data.items))throw Error('No se confirmó la lista de episodios.');
  for(const item of data.items){
   const row=node('div');row.style.cssText='display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 0;border-top:1px solid #ffffff18';
   row.append(node('span',item.titulo||'Episodio'));
   const toggle=btn(item.visible?'Ocultar':'Mostrar',()=>run(toggle,async()=>{
    const result=await api('admin/podcasts/episodes',{method:'PUT',body:{id:item.id,visible:!item.visible}});
    if(!current()||token!==viewToken)return;
    if(result?.success!==true||result.id!==item.id||typeof result.visible!=='boolean')throw Error('No se confirmó el cambio.');
    item.visible=result.visible;toggle.textContent=item.visible?'Ocultar':'Mostrar';feedback(item.visible?'Episodio visible.':'Episodio oculto. Las próximas sincronizaciones conservarán esta decisión.');
   }));row.append(toggle);episodes.append(row);
  }
  feedback(data.items.length+' episodios. Mostramos hasta 200 por fuente.');
 }
 async function refresh(){
  const data=await api('admin/podcasts/sources');if(!current())return;
  if(!Array.isArray(data.items))throw Error('El Worker todavía no confirmó el módulo RSS.');
  items=data.items;list.replaceChildren(node('h3','Programas registrados'));
  status.textContent=data.cron_enabled?'Actualización automática habilitada en el Worker.':'Actualización programada desactivada. Podés revisar e importar manualmente.';
  for(const source of items){
   const row=node('article');row.style.cssText='border:1px solid #ffffff24;border-radius:16px;padding:16px;margin-top:12px;overflow-wrap:anywhere';
   row.append(node('h4',source.name),node('p',source.url,'muted'),node('p',source.active&&source.auto_publish?'Automática · cada '+source.interval_hours+' h':'Sólo importación manual','muted'));
   if(source.last_success_at)row.append(node('p','Última lectura correcta: '+new Date(source.last_success_at).toLocaleString('es-AR'),'muted'));
   if(source.last_error)row.append(node('p','Último intento: '+source.last_error,'muted'));
   const actions=node('div');actions.style.cssText='display:flex;gap:10px;flex-wrap:wrap';
   const sync=btn('Importar episodios ahora',()=>run(sync,async()=>{
    feedback('Importando episodios…');const result=await api('admin/podcasts/sync',{method:'POST',body:{id:source.id}});
    if(!current())return;if(result?.success!==true)throw Error('No se confirmó la importación. Actualizá antes de reintentar.');
    await refresh();feedback(result.not_modified?'El RSS no cambió.':result.created+' nuevos · '+result.updated+' actualizados · '+result.unchanged+' sin cambios.'+(result.truncated?' Se procesaron hasta 200 episodios.':''));
   }));
   sync.disabled=source.busy;
   const edit=btn('Configurar',()=>{if(busy||saving)return;selected=source;name.value=source.name;url.value=source.url;url.disabled=true;interval.value=source.interval_hours;auto.checked=source.active&&source.auto_publish;save.textContent='Guardar cambios';form.scrollIntoView({block:'center'});name.focus()});
   const view=btn('Ver episodios',()=>run(view,()=>showEpisodes(source)));
   actions.append(sync,edit,view);row.append(actions);list.append(row);
  }
  if(!items.length)list.append(node('p','Todavía no hay fuentes RSS registradas.','muted'));
 }
 try{await refresh();if(!current())return;card.append(form,preview,list,episodes)}
 catch(e){if(!current())return;status.textContent=e.status===404?'La carga manual sigue disponible. Para habilitar RSS falta desplegar el Worker actualizado en staging.':(e.message||'No se pudo comprobar RSS.');card.append(btn('Volver a comprobar',()=>render(host,api,isCurrent)))}
}
window.UADAVPodcastSourcesAdmin={render};
})();