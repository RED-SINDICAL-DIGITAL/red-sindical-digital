(function(root){'use strict';
function safeHTTPS(value){try{const u=new URL(String(value||''));return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return''}}
function bannerModel(value){if(!value||typeof value!=='object'||Array.isArray(value)||value.activo===false||value.active===false)return null;
// Regional campaigns require their own audience resolver; never broaden them here.
if(value.provincia||value.province||value.ciudad||value.city||value.pais||value.country||value.targeting||value.segmentacion)return null;
const image=safeHTTPS(value.image_url),target=value.target_url?safeHTTPS(value.target_url):'';
if(!image||(value.target_url&&!target))return null;
return{image,target,placeholder:new URL(image).pathname==='/assets/editorial/espacio-publicidad.svg'};
}
function mount(config,doc){doc=doc||root.document;const anchors={top:'worldsSection',infeed:'artistsSection',footer:'siteFooter'};
for(const slot of Object.keys(anchors)){doc.getElementById('homeBanner-'+slot)?.remove();const model=bannerModel(config?.[slot]),anchor=doc.getElementById(anchors[slot]);if(!model||!anchor)continue;
const section=doc.createElement('aside');section.id='homeBanner-'+slot;section.className='homeBanner shell';section.setAttribute('aria-label','Publicidad');
const label=doc.createElement('small');label.textContent=model.placeholder?'PUBLICIDAD · ESPACIO DISPONIBLE':'PUBLICIDAD';section.appendChild(label);
const image=doc.createElement('img');image.src=model.image;image.alt=model.placeholder?'Tu marca puede estar acá. Espacio publicitario disponible.':'Publicidad';image.loading='lazy';image.decoding='async';image.addEventListener('error',()=>section.remove(),{once:true});
if(model.target){const link=doc.createElement('a');link.href=model.target;link.target='_blank';link.rel='noopener noreferrer';link.appendChild(image);section.appendChild(link)}else section.appendChild(image);
anchor.before(section);
}}
root.UADAVHomeBanners={safeHTTPS,bannerModel,mount};if(typeof module==='object'&&module.exports)module.exports=root.UADAVHomeBanners;
})(typeof window==='object'?window:globalThis);
