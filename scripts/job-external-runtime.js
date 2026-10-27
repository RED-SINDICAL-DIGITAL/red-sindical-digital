/* Maintained source for public-source reads and external jobs. No credentials are forwarded. */
function uadavExternalError(code,message,status=422){return Object.assign(Error(message),{externalCode:code,externalStatus:status})}
async function uadavExternalBody(request,max=65536){
  let body;try{body=await uadavSecurityJSON(request,max)}catch(error){throw uadavExternalError('EXTERNAL_BODY',error.status===413?'La solicitud es demasiado grande.':'La solicitud no contiene datos válidos.',error.status===413?413:400)}
  if(!body||typeof body!=='object'||Array.isArray(body))throw uadavExternalError('EXTERNAL_BODY','La solicitud no contiene un objeto válido.',400);
  return body;
}
function uadavExternalURL(value){
  let url;try{url=new URL(uadavPodcastURL(value))}catch{throw uadavExternalError('EXTERNAL_URL','Usá el dominio público de la publicación, con HTTPS y sin credenciales.',400)}
  const host=url.hostname.toLowerCase().replace(/\.$/,'');
  if(url.href.length>700||host.length>253||!host.split('.').every(part=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(part)))throw uadavExternalError('EXTERNAL_URL','La dirección de origen no es válida.',400);
  url.hostname=host;url.hash='';return url.href;
}
function uadavExternalPublicAddress(value){
  const address=String(value||'').toLowerCase();
  if(/^\d{1,3}(?:\.\d{1,3}){3}$/.test(address)){
    const [a,b,c,...rest]=address.split('.').map(Number);
    if([a,b,c,...rest].some(n=>n>255))return false;
    return !(a===0||a===10||a===127||a>=224||a===100&&b>=64&&b<=127||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0&&(c===0||c===2)||b===88&&c===99)||a===198&&(b===18||b===19||b===51&&c===100)||a===203&&b===0&&c===113);
  }
  // Only global unicast IPv6. Reject mapped IPv4, local/special ranges and transition tunnels.
  if(!/^[23][0-9a-f]{3}:[0-9a-f:]+$/.test(address))return false;
  const [first,second]=address.split(':').map(part=>parseInt(part||'0',16));
  return !(first===0x2002||first===0x3fff||first===0x2001&&(second<0x200||second===0xdb8));
}
function uadavExternalAwait(promise,signal){
  return new Promise((resolve,reject)=>{
    const abort=()=>{signal?.removeEventListener('abort',abort);reject(uadavExternalError('EXTERNAL_TIMEOUT','La fuente tardó demasiado. Podés usar CSV.'))};
    if(signal?.aborted){abort();return}
    signal?.addEventListener('abort',abort,{once:true});
    Promise.resolve(promise).then(value=>{signal?.removeEventListener('abort',abort);resolve(value)},error=>{signal?.removeEventListener('abort',abort);reject(error)});
  });
}
function uadavExternalCancel(body){
  // Cleanup must not make an error or timeout wait on an unresponsive peer.
  try{Promise.resolve(body?.cancel()).catch(()=>{})}catch{}
}
async function uadavExternalRead(response,limit,signal){
  if(Number(response.headers.get('content-length'))>limit){uadavExternalCancel(response.body);throw uadavExternalError('EXTERNAL_SIZE','La página es demasiado grande. Usá CSV o carga manual.')}
  const reader=response.body?.getReader();if(!reader)throw uadavExternalError('EXTERNAL_EMPTY','La fuente no devolvió contenido.');
  const decoder=new TextDecoder();let text='',size=0;
  try{
    while(true){
      if(signal?.aborted)throw uadavExternalError('EXTERNAL_TIMEOUT','La fuente tardó demasiado. Podés usar CSV.');
      const {done,value}=await uadavExternalAwait(reader.read(),signal);if(done)break;
      size+=value.byteLength;if(size>limit)throw uadavExternalError('EXTERNAL_SIZE','La página es demasiado grande. Usá CSV o carga manual.');
      text+=decoder.decode(value,{stream:true});
    }
    return text+decoder.decode();
  }catch(error){uadavExternalCancel(reader);throw error}finally{try{reader.releaseLock()}catch{}}
}
// DNS preflight is not IP pinning. Operational callers also restrict hosts to
// fixed trusted publishers; arbitrary sources use uploaded HTML or CSV instead.
async function uadavExternalDNS(host,requestFetch,signal){
  let count=0;
  for(const type of ['A','AAAA']){
    const url='https://cloudflare-dns.com/dns-query?name='+encodeURIComponent(host)+'&type='+type;
    let response;
    try{response=await uadavExternalAwait(requestFetch(url,{redirect:'manual',signal,headers:{Accept:'application/dns-json'}}),signal)}
    catch(error){if(error.externalCode)throw error;throw uadavExternalError('EXTERNAL_DNS_FETCH','No pudimos consultar el verificador público de la fuente. Usá CSV.')}
    // Workers rejects redirect:"error". Manual mode plus an explicit rejection
    // preserves the no-redirect resolver policy in both Node and workerd.
    if(response.status>=300&&response.status<400){uadavExternalCancel(response.body);throw uadavExternalError('EXTERNAL_DNS_REDIRECT','El verificador público redirigió la consulta. No se leyó la fuente. Usá CSV.')}
    if(!response.ok){uadavExternalCancel(response.body);throw uadavExternalError('EXTERNAL_DNS','No pudimos comprobar que la fuente sea pública. Usá CSV.')}
    let data;const content=await uadavExternalRead(response,16384,signal);
    try{data=JSON.parse(content)}catch{throw uadavExternalError('EXTERNAL_DNS_FORMAT','El verificador público devolvió una respuesta inválida. Usá CSV.')}
    if(data?.Status!==0||data.Answer!==undefined&&(!Array.isArray(data.Answer)||data.Answer.length>32))throw uadavExternalError('EXTERNAL_DNS','No pudimos comprobar que la fuente sea pública. Usá CSV.');
    for(const answer of data.Answer||[]){
      if(![1,28].includes(answer.type))continue;
      if(!uadavExternalPublicAddress(answer.data))throw uadavExternalError('EXTERNAL_DNS_PRIVATE','La fuente no es un sitio público permitido.',400);
      count++;
    }
  }
  if(!count)throw uadavExternalError('EXTERNAL_DNS','La fuente no tiene una dirección pública comprobable. Usá CSV.');
}
const UADAV_EXTERNAL_TRUSTED_HOSTS=new Set(['uadav-stream-staging.pages.dev','www.agenciabeat.com','agenciabeat.com','www.blogger.com','www.rosario.gob.ar','www.cultura.gob.ar','www.teatrocervantes.gob.ar','teatrocervantes.gob.ar']);
async function uadavExternalTrustedHTML(value,options={}){return uadavExternalFetchHTML(value,{...options,requireTrusted:true})}
async function uadavExternalFetchHTML(value,{requestFetch=fetch,timeoutMs=8000,requireTrusted=false}={}){
  let current=uadavExternalURL(value);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    for(let redirects=0;redirects<=3;redirects++){
      if(requireTrusted&&!UADAV_EXTERNAL_TRUSTED_HOSTS.has(new URL(current).hostname))throw uadavExternalError('EXTERNAL_SOURCE_REVIEW_REQUIRED','Esta fuente se importa con HTML o CSV. La lectura directa admite solo los proveedores públicos autorizados.',422);
      await uadavExternalDNS(new URL(current).hostname,requestFetch,controller.signal);
      const response=await uadavExternalAwait(requestFetch(current,{redirect:'manual',signal:controller.signal,headers:{Accept:'text/html, application/xhtml+xml;q=0.9','User-Agent':'UADAVSTREAM/1.0'}}),controller.signal);
      if([301,302,303,307,308].includes(response.status)){
        const location=response.headers.get('location');uadavExternalCancel(response.body);
        if(!location||redirects===3)throw uadavExternalError('EXTERNAL_REDIRECT','La fuente redirige demasiadas veces. Usá la dirección final o CSV.');
        current=uadavExternalURL(new URL(location,current).href);continue;
      }
      if(!response.ok){uadavExternalCancel(response.body);throw uadavExternalError('EXTERNAL_HTTP','La página de origen no respondió correctamente. Usá CSV o carga manual.')}
      if(!/^(?:text\/html|application\/xhtml\+xml)(?:\s*;|$)/i.test(response.headers.get('content-type')||'')){uadavExternalCancel(response.body);throw uadavExternalError('EXTERNAL_TYPE','La URL no entrega una página HTML importable.',400)}
      return {url:current,html:await uadavExternalRead(response,750000,controller.signal)};
    }
  }catch(error){
    if(error.externalCode)throw error;
    if(controller.signal.aborted)throw uadavExternalError('EXTERNAL_TIMEOUT','La fuente tardó demasiado. Podés usar CSV.');
    throw uadavExternalError('EXTERNAL_FETCH','No pudimos leer esa página. Usá CSV o carga manual.');
  }finally{clearTimeout(timer)}
}
function uadavExternalPreview(html,url,kind){
  if(!['job','event'].includes(kind))throw uadavExternalError('EXTERNAL_KIND','Elegí Bolsa o Cartelera.',400);
  const clean=value=>uadavDecodeHTMLText(String(value||'').replace(/<[^<>]*>/g,' ')).replace(/\s+/g,' ').trim();
  const meta=name=>{let cursor=0;for(let n=0;n<300;n++){const start=lower.indexOf('<meta',cursor);if(start<0)break;const end=html.indexOf('>',start+5);if(end<0)break;cursor=end+1;const tag=html.slice(start,end+1);const key=tag.match(/(?:property|name)\s*=\s*["']([^"']*)["']/i)?.[1];if(key?.toLowerCase()!==name)continue;return clean(tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1])}return ''};
  const lower=html.toLowerCase();let schema={},cursor=0;
  for(let n=0;n<200;n++){
    const start=lower.indexOf('<script',cursor);if(start<0)break;const open=html.indexOf('>',start+7);if(open<0)break;const end=lower.indexOf('</script',open+1);if(end<0)break;cursor=end+8;
    if(!/type\s*=\s*["']application\/ld\+json["']/i.test(html.slice(start,open))||end-open>150000)continue;
    try{const data=JSON.parse(html.slice(open+1,end)),roots=Array.isArray(data)?data:[data],nodes=roots.slice(0,100).flatMap(x=>Array.isArray(x?.['@graph'])?x['@graph'].slice(0,100):[x]);const hit=nodes.find(x=>[].concat(x?.['@type']||[]).some(type=>{const name=String(type).replace(/^https?:\/\/schema\.org\//i,'').toLowerCase();return kind==='job'?name==='jobposting':name.endsWith('event')}));if(hit){schema=hit;break}}catch{}
  }
  const titleStart=lower.indexOf('<title'),titleOpen=titleStart<0?-1:html.indexOf('>',titleStart),titleEnd=titleOpen<0?-1:lower.indexOf('</title',titleOpen);
  const title=meta('og:title')||meta('twitter:title')||(titleEnd>=0?clean(html.slice(titleOpen+1,titleEnd)):'');
  const object=value=>Array.isArray(value)?value[0]||{}:value&&typeof value==='object'?value:{};
  const place=object(kind==='job'?schema.jobLocation:schema.location),address=object(place.address),organization=object(schema.hiringOrganization);
  const date=value=>{const d=String(value||'').slice(0,10);return uadavJobValidDate(d)?d:''};
  const item={titulo:clean((typeof schema.name==='string'?schema.name:'')||(typeof schema.title==='string'?schema.title:'')||title||'Sin título').slice(0,180),descripcion:clean((typeof schema.description==='string'?schema.description:'')||meta('og:description')||meta('description')).slice(0,2500),source:new URL(url).hostname.replace(/^www\./,''),source_url:url,external_id:url,origen:'externo',last_seen_at:new Date().toISOString(),source_status:'active',ciudad:clean(address.addressLocality).slice(0,120),provincia:clean(address.addressRegion).slice(0,120),pais:clean(address.addressCountry?.name||address.addressCountry||'Argentina').slice(0,80)};
  const image=typeof schema.image==='string'?schema.image:Array.isArray(schema.image)?schema.image[0]:schema.image?.url;
  item.imagen='';const imageValue=String(image||meta('og:image')||'');if(imageValue)try{item.imagen=uadavExternalURL(new URL(imageValue,url).href)}catch{}
  if(kind==='job')Object.assign(item,{fecha:date(schema.datePosted),fecha_limite:date(schema.validThrough),empresa:clean(organization.name).slice(0,180),modalidad:schema.jobLocationType==='TELECOMMUTE'?'remoto':'presencial',application_mode:'external_url',application_url:url,region_scope:'argentina'});
  else Object.assign(item,{fecha:String(schema.startDate||'').slice(0,80),fecha_inicio:String(schema.startDate||'').slice(0,80),fecha_fin:String(schema.endDate||'').slice(0,80),lugar:clean(place.name).slice(0,180),categoria:'Eventos'});
  return {success:true,kind,item,structured:Object.keys(schema).length>0};
}
// Fixed Google-hosted public feed owned by the operator. Article URLs are only
// candidates: no news becomes a job without its explicit category and review.
function uadavBeatJobCandidates(data,limit=6){
  if(data?.feed?.id?.$t!=='tag:blogger.com,1999:blog-3101225953970770773'||!Array.isArray(data.feed.entry||[]))throw uadavExternalError('EXTERNAL_FEED','La fuente no devolvió el feed autorizado.');
  const labels=new Set(['convocatorias','trabajo','empleo','casting','castings','audiciones']),seen=new Set(),items=[];
  for(const row of (data.feed.entry||[]).slice(0,25)){
    if(!(row.category||[]).some(x=>labels.has(String(x.term||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())))continue;
    const link=(row.link||[]).find(x=>x.rel==='alternate'&&x.type==='text/html')?.href;let url;try{url=uadavExternalURL(link)}catch{continue}
    if(!['www.agenciabeat.com','agenciabeat.com'].includes(new URL(url).hostname)||seen.has(url))continue;
    const label=uadavDecodeHTMLText(String(row.title?.$t||'').replace(/<[^<>]*>/g,' ')).trim().slice(0,180);if(!label)continue;seen.add(url);items.push({href:url,label});if(items.length>=Math.min(20,limit))break;
  }
  return items;
}
async function uadavBeatFeed({requestFetch=fetch,timeoutMs=5000,limit=6}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{const url='https://www.blogger.com/feeds/3101225953970770773/posts/summary?alt=json&max-results=25',r=await uadavExternalAwait(requestFetch(url,{redirect:'manual',credentials:'omit',signal:controller.signal,headers:{Accept:'application/json'}}),controller.signal);if(r.status!==200||!/^application\/json(?:\s*;|$)/i.test(r.headers.get('content-type')||'')){uadavExternalCancel(r.body);throw uadavExternalError('EXTERNAL_FEED','No se confirmó la fuente autorizada.');}let data;try{data=JSON.parse(await uadavExternalRead(r,350000,controller.signal))}catch(error){if(error.externalCode)throw error;throw uadavExternalError('EXTERNAL_FEED','La fuente no devolvió JSON válido.');}return{candidates:uadavBeatJobCandidates(data,limit),publisher:'Agencia Beat',transport:'fixed-google-public-feed'};}finally{clearTimeout(timer)}
}
async function uadavPrepareExternalJobs(current,rows,{now=Date.now(),maxRecords=2000}={}){
  const list=current.map(row=>({...row})),indices=new Map();let imported=0,updated=0;const iso=new Date(now).toISOString(),today=uadavJobToday(now),seen=new Set();
  for(let index=0;index<list.length;index++){
    const row=list[index];if(row.origen!=='externo')continue;
    let key;try{key=uadavExternalURL(row.source_url)}catch{continue}
    if(indices.has(key))throw uadavExternalError('EXTERNAL_EXISTING_DUPLICATE','Hay ofertas duplicadas para una misma URL. Revisalas desde Admin antes de importar.',409);
    indices.set(key,index);
  }
  for(const raw of rows){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw uadavExternalError('EXTERNAL_ROW','Una oferta externa no tiene un formato válido.',400);
    const title=String(raw.titulo||'').trim().slice(0,180),description=String(raw.descripcion||raw.resumen||'').trim().slice(0,2500);
    if(typeof raw.titulo!=='string'||typeof (raw.descripcion||raw.resumen)!=='string'||!title||!description)throw uadavExternalError('EXTERNAL_FIELDS','Cada oferta externa necesita título y descripción.',400);
    const sourceUrl=uadavExternalURL(raw.source_url||raw.url_origen||raw.url),applicationUrl=uadavExternalURL(raw.application_url||sourceUrl);
    if(seen.has(sourceUrl))throw uadavExternalError('EXTERNAL_DUPLICATE','El lote repite una URL de origen.',409);seen.add(sourceUrl);
    const index=indices.get(sourceUrl)??-1,old=index>=0?list[index]:null;
    const approved=raw.revisado_por_admin===true,expires=String(raw.fecha_limite||'').trim();
    if(expires&&!uadavJobValidDate(expires)||(approved||old?.activo===true)&&(!uadavJobValidDate(expires)||expires<today))throw uadavExternalError('EXTERNAL_DATE','La oferta externa publicada requiere una fecha de caducidad válida y vigente.',400);
    const item={...(old||{}),id:old?.id||'JOB-EXT-'+crypto.randomUUID().slice(0,8).toUpperCase(),request_id:old?.request_id||'external-url:'+await uadavDigest(sourceUrl),titulo:title,descripcion:description,rubro:String(raw.rubro||raw.categoria||'Artistas').slice(0,100),ciudad:String(raw.ciudad||'').slice(0,120),provincia:String(raw.provincia||'').slice(0,120),pais:String(raw.pais||'Argentina').slice(0,80),region_scope:String(raw.region_scope||'argentina').slice(0,40),modalidad:String(raw.modalidad||'presencial').slice(0,50),remuneracion:String(raw.remuneracion||'no_informada').slice(0,100),fecha:String(raw.fecha||'').slice(0,40),fecha_limite:expires,empresa:String(raw.empresa||raw.organizacion||'').slice(0,180),source:String(raw.source||raw.fuente||'externa').slice(0,100),source_url:sourceUrl,external_key:sourceUrl,source_id:old?.source_id||String(raw.source_id||'').slice(0,80),source_auto_sync:old?old.source_auto_sync===true:raw.source_auto_sync===true,last_seen_at:iso,source_status:'active',application_mode:'external_url',application_url:applicationUrl,origen:'externo',activo:old?old.activo===true:approved,revision_pendiente:old?old.revision_pendiente!==false:!approved,importado_en:old?.importado_en||iso,actualizado:iso};
    if(index>=0){list[index]=old.managed===true||old.claimed===true?{...old,last_seen_at:iso}:item;updated++}else{if(list.length>=maxRecords)throw uadavExternalError('EXTERNAL_CAPACITY','La colección requiere revisión administrativa antes de incorporar más ofertas.',503);indices.set(sourceUrl,list.length);list.push(item);imported++}
  }
  return {list,imported,updated};
}

function uadavExternalCandidates(html,base,kind,limit=6){
  const lower=html.toLowerCase(),seen=new Set(),out=[];let cursor=0;
  const words=kind==='job'?/convoc|casting|audici[oó]n|bailar[ií]n|actriz|actor|m[uú]sico|vacante|trabajo/i:/teatro|m[uú]sica|danza|circo|festival|show|funci[oó]n|concierto|recital|encuentro|espect[aá]culo/i;
  for(let n=0;n<2000&&out.length<Math.max(3,Math.min(12,Number(limit)||6));n++){
    const start=lower.indexOf('<a',cursor);if(start<0)break;cursor=start+2;if(!/[\s>]/.test(html[cursor]||''))continue;
    const open=html.indexOf('>',cursor),end=open<0?-1:lower.indexOf('</a',open+1);if(open<0||end<0)break;cursor=end+3;
    const href=html.slice(start,open).match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];if(!href)continue;
    const label=uadavDecodeHTMLText(html.slice(open+1,end).replace(/<[^<>]*>/g,' ')).replace(/\s+/g,' ').trim().slice(0,180);
    if(label.length<8||!words.test(label+' '+href))continue;
    try{const url=uadavExternalURL(new URL(uadavDecodeHTMLText(href),base).href);if(seen.has(url))continue;seen.add(url);out.push({href:url,label})}catch{}
  }
  return out;
}
