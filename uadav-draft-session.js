/* UADAV STREAM beta: tab-scoped, non-sensitive form drafts. No credentials, contact, tokens or remote calls. */
(function(){
 'use strict';
 const definitions={
  'publicar-evento':{form:'form',fields:['title','category','subcategory','organizer','short','description','date','time','venue','address','city','province','country','free','currency','priceFrom','priceTo','ticketing','tickets','poster','cover','trailer','instagram','gallery','featured']},
  'bolsa-trabajo':{form:'jobPostForm',fields:['pubJobTitulo','pubJobRubro','pubJobCiudad','pubJobFecha','pubJobDescripcion','pubJobEntidad']}
 };
 const page=document.body?.dataset.page||document.body?.getAttribute('data-page')||'';
 const type=page==='publicar-evento'?'publicar-evento':page==='bolsa-trabajo'?'bolsa-trabajo':null;
 if(!type)return;
 const definition=definitions[type],form=document.getElementById(definition.form);
 if(!form)return;
 const key='uadav_safe_draft_v1_'+type,ttl=4*60*60*1000;
 let dirty=false;
 const field=id=>document.getElementById(id);
 function clear(){try{sessionStorage.removeItem(key)}catch{}dirty=false}
 function write(){
  const data={};
  for(const id of definition.fields){
   const element=field(id);
   if(!element||element.type==='password'||element.type==='hidden')continue;
   data[id]=element.type==='checkbox'?!!element.checked:String(element.value||'').slice(0,6000);
  }
  try{sessionStorage.setItem(key,JSON.stringify({ts:Date.now(),data}))}catch{}
 }
 function restore(){
  let record;
  try{record=JSON.parse(sessionStorage.getItem(key)||'null')}catch{return}
  if(!record||typeof record.ts!=='number'||Date.now()-record.ts>ttl||record.ts>Date.now()+60000){clear();return}
  if(!record.data||typeof record.data!=='object')return;
  for(const [id,value] of Object.entries(record.data)){
   if(!definition.fields.includes(id))continue;
   const element=field(id);
   if(!element)continue;
   if(element.type==='checkbox'&&typeof value==='boolean')element.checked=value;
   else if(typeof value==='string')element.value=value;
  }
 }
 restore();
 const handle=event=>{
  const node=event.target;
  if(!node?.id||!definition.fields.includes(node.id))return;
  dirty=true;write();
 };
 form.addEventListener('input',handle);
 form.addEventListener('change',handle);
 window.addEventListener('pagehide',()=>{if(dirty)write()});
 window.UADAVSafeDraft={type,clear,save:write};
})();
