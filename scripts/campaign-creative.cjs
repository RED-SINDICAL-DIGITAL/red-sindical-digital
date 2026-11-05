const uadavCampaignCreative=(()=>{
 const https=v=>{try{const u=new URL(String(v||''));return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return''}};
 function fields(x){return{creative_title:String(x.creative_title||'').trim().slice(0,120),creative_image_url:https(x.creative_image_url),creative_target_url:https(x.creative_target_url),banner_slot:['top','infeed','footer'].includes(x.banner_slot)?x.banner_slot:'',section_id:/^[A-Za-z0-9_-]{1,100}$/.test(String(x.section_id||''))?String(x.section_id):''}}
 function issue(x){if(!['infeed','section_sponsor'].includes(x.placement))return '';const v=fields(x);if(x.creative_image_url&&!v.creative_image_url||x.creative_target_url&&!v.creative_target_url)return 'Usá imágenes y enlaces HTTPS completos, sin credenciales.';if(x.status!=='active')return '';if(!v.creative_title||!v.creative_target_url)return 'Completá el nombre del anunciante y su enlace HTTPS.';if(x.placement==='infeed'&&(!v.creative_image_url||!v.banner_slot))return 'Elegí uno de los tres espacios y una imagen HTTPS para el banner.';if(x.placement==='section_sponsor'&&!v.section_id)return 'Indicá una sección válida para el auspicio.';return ''}
 return{https,fields,issue,version:'2026-11-05-creative-1'};
})();
module.exports=uadavCampaignCreative;
