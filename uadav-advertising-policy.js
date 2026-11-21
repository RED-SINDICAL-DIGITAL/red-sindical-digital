/* Approved launch offer. No checkout, renewal or campaign activation side effects. */
(function(root){'use strict';
 const products=[
 {id:'UADAV-CONSULT-HERO',name:'Hero premium',entity_type:'artist_or_event',placement:'hero'},
 {id:'UADAV-CONSULT-CARTELERA',name:'Promoción en Cartelera',entity_type:'event',placement:'cartelera_slider'},
 {id:'UADAV-CONSULT-FEED',name:'Publicidad en portada / feed',entity_type:'brand',placement:'infeed'}
 ].map(p=>({...p,currency:'ARS',duration_days:0,price_label:'Consultar con administración',quote_required:true,active:false}));
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
 const policy={version:'2026-11-05-admin-quote',currency:'ARS',memberships:false,automaticRenewal:false,heroMaxCommercialCampaigns:1,heroEditorialTarget:4,commercialMode:'admin_quote',paymentMethod:'bank_transfer',administration:'Santa Fe',products,provinces,targetIssue,matchesTerritory,validDay,eligible};
 if(typeof module==='object'&&module.exports)module.exports=policy;else root.UADAVAdvertising=policy;
})(typeof window==='object'?window:globalThis);
