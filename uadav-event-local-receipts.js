/* UADAV Stream: public-event references saved on this device only.
   Not an ownership token, an account synchronization system, or an edit permission. */
(function(root){
'use strict';
const KEY='uadav_event_public_receipts_local_v1',MAX=30,ID=/^[A-Za-z0-9_-]{1,120}$/;
const storage=()=>{try{return root.localStorage}catch{return null}};
function sanitize(raw){
 if(!raw||typeof raw!=='object'||!ID.test(String(raw.id||'')))return null;
 return {id:String(raw.id),title:String(raw.title||'Evento publicado').slice(0,120),saved_at:Math.min(Date.now(),Math.max(0,Number(raw.saved_at)||Date.now()))};
}
function list(){
 try{const parsed=JSON.parse(storage()?.getItem(KEY)||'[]');if(!Array.isArray(parsed))return [];
 const seen=new Set();return parsed.map(sanitize).filter(x=>{if(!x||seen.has(x.id))return false;seen.add(x.id);return true}).slice(0,MAX)
 }catch{return[]}
}
function save(event){
 const item=sanitize({...event,saved_at:Date.now()});if(!item)return false;
 const updated=[item,...list().filter(x=>x.id!==item.id)].slice(0,MAX);
 try{storage()?.setItem(KEY,JSON.stringify(updated));root.dispatchEvent?.(new CustomEvent('uadav:local-event-receipts'));return true}catch{return false}
}
function remove(id){
 if(!ID.test(String(id||'')))return false;
 try{storage()?.setItem(KEY,JSON.stringify(list().filter(x=>x.id!==id)));root.dispatchEvent?.(new CustomEvent('uadav:local-event-receipts'));return true}catch{return false}
}
root.UADAVLocalEventReceipts=Object.freeze({list,save,remove});
})(window);
