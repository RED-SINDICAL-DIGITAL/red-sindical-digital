/* ★ UADAV STREAM — render seguro de un solo anuncio por espacio.
   Espera campañas YA APROBADAS por backend. No compra, no pago, no activación.
   No instala espacios por sí solo. El integrador monta SOLO home, events o explore.
*/
(function(root){
 'use strict';
 function mount(container,campaigns,location,slot,now){
   if(!container||typeof container.replaceChildren!=='function')return null;
   const selector=root.UADAVTerritorialAds;
   if(!selector||!selector.SLOTS.includes(slot))return null;
   const selected=selector.select(campaigns,location,slot,now);
   container.replaceChildren();
   container.hidden=!selected;
   if(!selected)return null;
   const doc=container.ownerDocument;
   const article=doc.createElement('article');article.className='uadav-ad-card';article.dataset.adSlot=slot;
   const tag=doc.createElement('span');tag.className='uadav-ad-disclosure';tag.textContent='Publicidad';
   const anchor=doc.createElement('a');anchor.href=selected.destination;anchor.rel='noopener noreferrer sponsored';anchor.target='_blank';anchor.className='uadav-ad-link';
   const title=doc.createElement('strong');title.textContent=selected.title;
   anchor.append(title);
   if(selected.description){const desc=doc.createElement('span');desc.textContent=String(selected.description).slice(0,240);anchor.append(desc)}
   article.append(tag,anchor);container.append(article);
   return {id:selected.id,slot};
 }
 root.UADAVAdSlot=Object.freeze({mount});
})(typeof window!=='undefined'?window:globalThis);
