/* ★ UADAV STREAM — selección territorial de publicidad. Sin datos personales ni rastreo.
   Contrato: campañas verificadas desde servidor; este módulo NO valida pagos ni autoriza campañas.
   Uso: UADAVTerritorialAds.select(campaigns, { country:'AR',province:'Santa Fe',city:'Rosario' }, 'home')
*/
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.UADAVTerritorialAds=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SLOTS=Object.freeze(['home','events','explore']);
  const norm=v=>String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
  const country=v=>{const s=norm(v);return ({argentina:'ar',argentine:'ar',brasil:'br',brazil:'br',uruguay:'uy',chile:'cl',paraguay:'py',bolivia:'bo',peru:'pe',colombia:'co',mexico:'mx',mexico:'mx',espana:'es',spain:'es'})[s]||s;};
  const province=v=>{const s=norm(v).replace(/^provincia de /,'');return ({'sf':'santa fe','cordoba':'cordoba','cba':'cordoba','buenos aires province':'buenos aires','caba':'ciudad autonoma de buenos aires','autonomous city of buenos aires':'ciudad autonoma de buenos aires'})[s]||s;};
  const city=v=>norm(v);
  const parts=(value,normalizer)=>{
    if(value===undefined||value===null||value==='')return [];
    return (Array.isArray(value)?value:[value]).map(normalizer).filter(Boolean);
  };
  // Nunca extender localmente una coincidencia de una ciudad a toda la provincia.
  function targeting(campaign,location){
    const t=campaign?.targeting||{};
    const countries=parts(t.countries,country),provinces=parts(t.provinces,province),cities=parts(t.cities,city);
    const scope=t.scope||((cities.length&&'city')||(provinces.length&&'province')||(countries.length&&'country')||null);
    if(!['global','country','province','city'].includes(scope))return null;
    const l={country:country(location?.country),province:province(location?.province),city:city(location?.city)};
    if(scope==='global'){
      // Un anuncio global no puede declarar filtros contradictorios.
      if(countries.length||provinces.length||cities.length)return null;
      return 1;
    }
    if(!countries.length||!l.country||!countries.includes(l.country))return null;
    if(scope==='country')return provinces.length||cities.length?null:2;
    if(!provinces.length||!l.province||!provinces.includes(l.province))return null;
    if(scope==='province')return cities.length?null:3;
    if(!cities.length||!l.city||!cities.includes(l.city))return null;
    return 4;
  }
  function eligible(campaign,location,slot,now=Date.now()){
    if(!campaign||!SLOTS.includes(slot)||campaign.slot!==slot)return null;
    if(campaign.status!=='active'||campaign.approved!==true||campaign.published!==true)return null;
    const from=Date.parse(campaign.starts_at||''),to=Date.parse(campaign.ends_at||'');
    if(!Number.isFinite(from)||!Number.isFinite(to)||from>now||to<=now||from>=to)return null;
    if(typeof campaign.title!=='string'||!campaign.title.trim()||typeof campaign.destination!=='string')return null;
    let url;try{url=new URL(campaign.destination)}catch{return null}
    if(url.protocol!=='https:')return null;
    const rank=targeting(campaign,location);
    if(rank===null)return null;
    return {...campaign,territorial_rank:rank,disclosure:'Publicidad'};
  }
  function select(campaigns,location,slot,now=Date.now()){
    if(!Array.isArray(campaigns)||!SLOTS.includes(slot))return null;
    const matches=campaigns.map(c=>eligible(c,location,slot,now)).filter(Boolean);
    // Priorización local, luego mayor prioridad comercial y orden estable por id.
    matches.sort((a,b)=>b.territorial_rank-a.territorial_rank-
      0||Number(b.priority||0)-Number(a.priority||0)||String(a.id||'').localeCompare(String(b.id||'')));
    return matches[0]||null;
  }
  return Object.freeze({SLOTS,norm,eligible,select,targeting});
});
