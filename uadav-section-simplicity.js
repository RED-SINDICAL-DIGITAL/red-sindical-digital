(function(){
'use strict';
function start(){
 if(document.body.dataset.page==='bolsa-trabajo'){
  const intro=document.querySelector('.jobs-intro'),list=document.getElementById('buscar-oportunidades'),owner=document.getElementById('ownerInbox');
  if(intro&&list)intro.after(list);
  if(owner)owner.classList.add('section-management');
  function openTarget(){
   let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}
   if(!['publicar-oportunidad','jobPostForm','ownerInbox','ownerForm'].includes(id))return;
   const target=document.getElementById(id),details=target?.closest('details')||target?.querySelector('details');
   if(details){details.open=true;target.scrollIntoView({block:'start',behavior:'instant'})}
  }
  openTarget();window.addEventListener('hashchange',openTarget);
  document.getElementById('ownerGo')?.addEventListener('click',()=>{const details=owner?.querySelector('details');if(details)details.open=true});
 }
 if(document.body.dataset.page==='cartelera'){
  const filters=document.querySelector('.filters');
  if(filters&&!filters.closest('.section-filter-details')){
   const details=document.createElement('details');details.className='section-filter-details';
   const title=document.createElement('summary');filters.before(details);details.append(title,filters);
   function update(){const count=[...filters.querySelectorAll('input,select')].filter(el=>el.value.trim()).length;title.textContent=count?'Filtros · '+count+' '+(count===1?'activo':'activos'):'Ubicación, fecha y más filtros';return count}
   if(update())details.open=true;
   filters.addEventListener('input',update);filters.addEventListener('change',update);
   document.getElementById('clearEventFilters')?.addEventListener('click',update);
  }
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
