/* Presentation only: retain original forms, controls and submission handlers. */
(()=>{'use strict';
const event=document.body.dataset.page==='publicar-evento',form=document.getElementById(event?'form':'jobPostForm');if(!form)return;
const fields=document.createElement('div');fields.className='publication-fields';while(form.firstChild)fields.append(form.firstChild);
const preview=document.createElement('aside');preview.className='publication-preview';preview.setAttribute('aria-label','Vista previa de la publicación');
preview.innerHTML='<p class="publication-eyebrow">VISTA PREVIA</p><div class="publication-art"><span>Tu '+(event?'afiche':'oportunidad')+'</span></div><h2></h2><p class="publication-meta"></p><p class="publication-description"></p><small>Vista orientativa. Revisá los datos antes de publicar.</small>';
form.classList.add('publication-layout');form.append(fields,preview);
const value=id=>document.getElementById(id)?.value.trim()||'',title=preview.querySelector('h2'),meta=preview.querySelector('.publication-meta'),description=preview.querySelector('.publication-description'),art=preview.querySelector('.publication-art');let imageURL='';
function update(){title.textContent=value(event?'title':'pubJobTitulo')||(event?'Nombre de tu evento':'Título de la oportunidad');meta.textContent=(event?[value('date'),value('time'),value('venue'),value('city')]:[value('pubJobRubro'),value('pubJobCiudad'),value('pubJobFecha')]).filter(Boolean).join(' · ')||(event?'Fecha y lugar':'Especialidad y ciudad');description.textContent=value(event?'short':'pubJobDescripcion')||value(event?'description':'pubJobDescripcion')||'Los detalles de tu publicación aparecerán acá.';
 const candidate=value(event?'poster':'pubJobLogo');let safe='';try{const url=new URL(candidate);if(url.protocol==='https:')safe=url.href;}catch{}if(safe===imageURL)return;imageURL=safe;art.replaceChildren();const fallback=document.createElement('span');fallback.textContent=event?'Tu afiche':'Tu oportunidad';art.append(fallback);if(!safe)return;const image=document.createElement('img');image.alt=event?'Vista previa del afiche':'Imagen del contratante';image.referrerPolicy='no-referrer';image.addEventListener('load',()=>{if(image.parentNode)fallback.hidden=true});image.addEventListener('error',()=>{image.remove();fallback.hidden=false});image.src=safe;art.append(image);
}
form.addEventListener('input',update);form.addEventListener('change',update);form.addEventListener('reset',()=>setTimeout(update,0));
form.addEventListener('invalid',e=>{for(let p=e.target.parentElement;p&&p!==form;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;if(event&&e.target.closest('[hidden]')){const button=document.getElementById('toggleEventExtras');if(button?.getAttribute('aria-expanded')==='false')button.click();}},true);
update();
})();
