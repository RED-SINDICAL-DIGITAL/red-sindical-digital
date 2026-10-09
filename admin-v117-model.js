/* ★ UADAV STREAM · Admin V11.7 business model registry
   Frontend helper only. Backend writes remain controlled by the Cloudflare Worker. */
(function(){
  'use strict';
  const MODEL={
    version:'11.7',build:'11747',
    plans:{
      free:{label:'Artista GRATIS',price:0,features:['Perfil público','Creación y reclamo gratuitos','Contenido por enlaces','Cartelera gratuita','Bolsa de Trabajo gratuita','Contratación sin comisión']},
      pro:{label:'Artista PRO',referenceMonthlyUSD:3.99,referenceAnnualUSD:30,features:['Presentación interactiva compartible','Presupuestos','Agenda y organización de consultas','Estadísticas de la plataforma','Un cupo mensual de destacado por 7 días','Convenios comerciales disponibles']}
    },
    support:{requiresPro:true,commission:0},
    marketplace:{commission:0,paymentProcessing:false},
    travelAudiences:['public','artist','artist_pro','uadav_member'],
    analyticsEvents:['profile_view','play_start','follow','favorite','playlist_add','ticket_click','hire_click','support_click','share'],
    separation:['uadav_membership != artist_pro','support != artist_pro','cartelera_premium != artist_pro']
  };
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function isPro(a){if(!a)return false;if(a.plan==='pro'||a.pro_active===true||Number(a.pro_active)===1){if(!a.pro_expires&&!a.pro_expires_at)return true;const x=new Date(a.pro_expires||a.pro_expires_at);return !Number.isNaN(+x)&&x>Date.now()}return false}
  function planBadge(a){return isPro(a)?'<span class="badge warn">★ PRO</span>':'<span class="badge info">GRATIS</span>'}
  function supportAllowed(a){return isPro(a) && !!a && (a.claimed||a.verified||a.claim_status==='approved'||a.verificado===true)}
  function normalizeSupportLinks(a){const raw=a?.support_links||a?.apoyar||[];return (Array.isArray(raw)?raw:[]).filter(x=>x&&x.url).map(x=>({provider:esc(x.provider||x.label||'Apoyar'),url:String(x.url)}))}
  function metricLabel(k){return ({profile_view:'Visitas al perfil',play_start:'Reproducciones iniciadas',follow:'Nuevos seguidores',favorite:'Favoritos',playlist_add:'Agregados a playlists',ticket_click:'Clics en entradas',hire_click:'Clics en contratar',support_click:'Clics en apoyar',share:'Compartidos'})[k]||k}
  function validatePlan(p){return p==='free'||p==='pro'?p:'free'}
  function benefitAudienceLabel(v){return ({public:'Público',artist:'Artistas',artist_pro:'Artista PRO',uadav_member:'Afiliados UADAV'})[v]||v}
  window.UADAV_V117={MODEL,isPro,planBadge,supportAllowed,normalizeSupportLinks,metricLabel,validatePlan,benefitAudienceLabel};
  document.documentElement.dataset.uadavModel='v11.7';
})();

