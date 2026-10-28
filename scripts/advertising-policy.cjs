/* Approved launch offer. No checkout, renewal or campaign activation side effects. */
(function(root){'use strict';
 const durations=[7,15,30],products=[];
 for(const [key,name,entity,placement,prices] of [
  ['cartelera','Destacado en Cartelera','event','cartelera_slider',[5000,9000,15000]],
  ['hero','Hero de Explorar','artist_or_event','hero',[12000,22000,36000]],
  ['combo','Hero + Cartelera','event','hero_cartelera',[15000,28000,45000]]])
  durations.forEach((days,i)=>products.push({id:`UADAV-LAUNCH-${key}-${days}`,name:`${name} · ${days} días`,entity_type:entity,placement,duration_days:days,amount:prices[i],currency:'ARS',price_label:'ARS '+prices[i].toLocaleString('es-AR'),active:false}));
 for(const [key,name,entity,placement,amount,from] of [
  ['radio','Radio destacada','radio','radio_partner',20000,false],
  ['banner','Banner entre secciones','brand','infeed',30000,false],
  ['sponsor','Auspicio de sección','brand','section_sponsor',50000,true]])
  products.push({id:`UADAV-LAUNCH-${key}-30`,name,entity_type:entity,placement,duration_days:30,amount,currency:'ARS',price_from:from,price_label:(from?'Desde ':'')+'ARS '+amount.toLocaleString('es-AR'),active:false});
 const provinces=['Buenos Aires','Ciudad Autónoma de Buenos Aires','Catamarca','Chaco','Chubut','Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'];
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 function targetIssue(x){
  if(!['national','province','city','international'].includes(x.target_scope))return 'Elegí el alcance territorial de la campaña.';
  if(x.target_scope==='international')return '';
  if(!/^[A-Z]{2}$/.test(String(x.target_country||'')))return 'Indicá el país con dos letras, por ejemplo AR.';
  if(['province','city'].includes(x.target_scope)&&!String(x.target_province||'').trim())return 'Indicá la provincia de la campaña.';
  if(x.target_scope==='city'&&!String(x.target_city||'').trim())return 'Indicá la ciudad de la campaña.';
  if(x.target_country==='AR'&&['province','city'].includes(x.target_scope)&&!provinces.some(p=>norm(p)===norm(x.target_province)))return 'Elegí una provincia argentina válida.';
  return '';
 }
 function matchesTerritory(c,viewer={}){
  if(targetIssue(c))return false;
  if(c.target_scope==='international')return true;
  if(norm(c.target_country)!==norm(viewer.country))return false;
  if(['province','city'].includes(c.target_scope)&&norm(c.target_province)!==norm(viewer.province))return false;
  if(c.target_scope==='city'&&norm(c.target_city)!==norm(viewer.city))return false;
  return true;
 }
 function validDay(v){return /^\d{4}-\d{2}-\d{2}$/.test(String(v||''))&&Number.isFinite(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v}
 function eligible(c,viewer,now=Date.now()){
  return c.status==='active'&&['paid','waived'].includes(c.payment_status)&&c.delivery_verified===true&&validDay(c.starts_at)&&validDay(c.ends_at)&&c.starts_at<=c.ends_at&&Date.parse(c.starts_at+'T00:00:00-03:00')<=now&&Date.parse(c.ends_at+'T23:59:59.999-03:00')>=now&&matchesTerritory(c,viewer);
 }
 const policy={version:'2026-10-27-launch',currency:'ARS',memberships:false,automaticRenewal:false,heroMaxCommercialCampaigns:3,products,provinces,targetIssue,matchesTerritory,validDay,eligible};
 if(typeof module==='object'&&module.exports)module.exports=policy;else root.UADAVAdvertising=policy;
})(typeof window==='object'?window:globalThis);
