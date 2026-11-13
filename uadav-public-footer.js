/* Shared public footer. Read-only configuration, no analytics writes or fabricated counts. */
(function(root){
'use strict';
const links=[['Ayuda','/guia.html'],['Contacto','/contacto.html'],['Términos','/terminos.html'],['Privacidad','/privacidad.html'],['Derechos y CCT','/documentacion.html'],['Media Kit','/mediakit.html'],['Convenios','/convenios.html'],['Publicidad','/consultar-publicidad.html']];
function settings(value){const x=value?.data||value||{};return{name:typeof x.nombre==='string'&&x.nombre.trim()?x.nombre.trim().slice(0,100):'UADAV STREAM',description:typeof x.descripcion==='string'?x.descripcion.slice(0,300):'El talento tiene su lugar.',email:typeof x.email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email.trim())?x.email.trim():'',legalName:typeof x.legal_name==='string'?x.legal_name.slice(0,200):'',legalAddress:typeof x.legal_address==='string'?x.legal_address.slice(0,300):'',verified:x.visits_verified===true}}
function count(value,config){const x=value?.data||value||{},v=x.visitas_totales;return config.verified&&x.mostrar_visitas===true&&typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:null}
root.UADAVPublicFooter={settings,count,links};if(typeof module==='object'&&module.exports)module.exports=root.UADAVPublicFooter;
if(!root.document||root.__uadavFooterMounted)return;
const doc=root.document;
if(new URLSearchParams(root.location.search).get('panel')==='1'||/\/(admin|radio-studio)(?:\.html)?$/.test(root.location.pathname))return;
root.__uadavFooterMounted=true;
function node(tag,text){const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n}
async function mount(){
 if(doc.getElementById('publicSiteFooter'))return;
 const css=node('link');css.rel='stylesheet';css.href='/uadav-public-footer.css?v=20261113';doc.head.append(css);
 const footer=node('footer');footer.id='publicSiteFooter';footer.setAttribute('aria-label','Información de UADAV STREAM');
 const identity=node('div');identity.className='public-footer-identity';const title=node('strong','UADAV STREAM'),description=node('p','El talento tiene su lugar.');identity.append(title,description);
 const nav=node('nav');nav.setAttribute('aria-label','Ayuda, información legal e institucional');for(const [label,href]of links){const a=node('a',label);a.href=href;nav.append(a)}
 const bottom=node('div');bottom.className='public-footer-bottom';const copyright=node('small','© '+new Date().getFullYear()+' UADAV STREAM'),counter=node('small');counter.hidden=true;counter.id='publicFooterVisits';counter.title='Visitas acumuladas del contador del sitio; no equivale a personas únicas ni a audiencia en vivo.';bottom.append(copyright,counter);footer.append(identity,nav,bottom);
 footer.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||e.button>0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;try{if(root.parent!==root&&root.parent.UADAVShellHost?.navigate){e.preventDefault();e.stopPropagation();root.parent.UADAVShellHost.navigate(a.getAttribute('href'))}}catch{}});
 for(const old of doc.querySelectorAll('body>footer,main>footer,.shell>footer,#siteFooter,#visitCounter'))old.hidden=true;
 doc.body.append(footer);
 const api=root.PLATFORM_API_BASE||root.UADAV_API_BASE;if(!api)return;
 async function read(path){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);try{const r=await root.fetch(api.replace(/\/?$/,'/')+path,{method:'GET',cache:'no-store',signal:ctl.signal});if(!r.ok)throw Error();return await r.json()}finally{clearTimeout(timer)}}
 const results=await Promise.allSettled([read('footer_config'),read('visits')]);
 const config=settings(results[0].status==='fulfilled'?results[0].value:null);title.textContent=config.name;description.textContent=config.description;copyright.textContent='© '+new Date().getFullYear()+' '+config.name;
 const total=count(results[1].status==='fulfilled'?results[1].value:null,config);if(total!==null){counter.textContent=new Intl.NumberFormat('es-AR').format(total)+' visitas acumuladas';counter.hidden=false}
 const contact=doc.getElementById('officialContact'),legal=doc.getElementById('officialResponsible');
 if(contact&&config.email){contact.replaceChildren();const a=node('a',config.email);a.href='mailto:'+config.email;contact.append(a)}
 if(legal&&config.legalName){legal.textContent=config.legalName+(config.legalAddress?' · '+config.legalAddress:'')}
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof window!=='undefined'?window:globalThis);
