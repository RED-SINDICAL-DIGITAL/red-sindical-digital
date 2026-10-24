/* The planilla flow for jobs uses the external-import transaction, never the generic importer. */
(function(root){
  'use strict';
  const ORIGIN='https://uadav-stream-staging.pages.dev';
  const text=(value,max)=>String(value??'').trim().slice(0,max);
  function today(now=Date.now()){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now));
    const field=type=>parts.find(x=>x.type===type).value;
    return field('year')+'-'+field('month')+'-'+field('day');
  }
  function validDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const date=new Date(value+'T12:00:00Z');
    return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
  }
  function publicUrl(value,label){
    let url;try{url=new URL(String(value||'').trim())}catch{throw Error(label+': usá una URL HTTPS completa.')}
    if(url.protocol!=='https:'||url.username||url.password||url.port||url.href.length>700)throw Error(label+': usá una URL HTTPS sin credenciales ni puertos especiales.');
    const host=url.hostname.toLowerCase();
    if(!host.includes('.')||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal')||host.includes(':')||/^\d+(?:\.\d+){3}$/.test(host))throw Error(label+': usá el dominio público de la publicación.');
    url.hash='';return url.href;
  }
  function normalize(row,{visible=false,source='Importación Admin',now=Date.now()}={}){
    if(!row||typeof row!=='object'||Array.isArray(row))throw Error('Una fila de Bolsa no tiene un formato válido.');
    const val=(...keys)=>{for(const key of keys)if(row[key]!==undefined&&row[key]!==null&&String(row[key]).trim())return row[key];return ''};
    const title=text(val('titulo','Titulo','Título','title'),180),description=text(val('descripcion','Descripción','resumen'),2500);
    if(!title||!description)throw Error('Cada oferta externa necesita título y descripción.');
    const sourceUrl=publicUrl(val('source_url','url_origen','url','URL'),'Origen de «'+title+'»');
    const applicationUrl=publicUrl(val('application_url','url_postulacion')||sourceUrl,'Postulación de «'+title+'»');
    const deadline=text(val('fecha_limite','Fecha límite'),30);
    if(deadline&&!validDate(deadline))throw Error('Fecha límite inválida en «'+title+'»: usá AAAA-MM-DD.');
    if(visible&&(!deadline||deadline<today(now)))throw Error('Para publicar «'+title+'» elegí una fecha límite vigente. Podés dejarla oculta para revisarla.');
    // Source URL is the identity. Spreadsheet IDs cannot overwrite native offers or another source.
    return {titulo:title,descripcion:description,source:text(val('source','fuente')||source,100),source_url:sourceUrl,external_id:sourceUrl,
      application_url:applicationUrl,application_mode:'external_url',revisado_por_admin:visible===true,origen:'externo',fecha_limite:deadline,
      rubro:text(val('rubro','Rubro','categoria'),100),empresa:text(val('empresa','entidad','organizacion'),180),modalidad:text(val('modalidad')||'presencial',50),
      ciudad:text(val('ciudad','Ciudad'),120),provincia:text(val('provincia','Provincia'),120),pais:text(val('pais','País')||'Argentina',80),
      fecha:text(val('fecha','Fecha'),40),remuneracion:text(val('remuneracion')||'no_informada',100)};
  }
  function splitBatches(batches){
    const seen=new Set(),result=[];
    for(const batch of batches){
      if(batch.entity!=='jobs'){result.push(batch);continue}
      for(const row of batch.rows){if(seen.has(row.external_id.toLowerCase()))throw Error('La planilla repite una URL de origen. Corregí los duplicados antes de importar.');seen.add(row.external_id.toLowerCase())}
      for(let i=0;i<batch.rows.length;i+=5)result.push({...batch,rows:batch.rows.slice(i,i+5)});
    }
    return result;
  }
  async function sendBatch(batch,{origin,request}){
    if(origin!==ORIGIN)throw Error('La importación de Bolsa solo está preparada en staging.');
    if(batch?.entity!=='jobs'||!Array.isArray(batch.rows)||!batch.rows.length||batch.rows.length>5)throw Error('Revisá un lote de hasta cinco ofertas externas.');
    const result=await request('admin/federated/import',{method:'POST',body:{kind:'job',items:batch.rows}});
    if(result?.success!==true||result.kind!=='job'||!Number.isInteger(result.imported)||!Number.isInteger(result.updated)||result.imported<0||result.updated<0||result.imported+result.updated!==batch.rows.length)throw Error('El servidor no confirmó todas las ofertas de este lote. Revisá la lista antes de repetirlo.');
    return result;
  }
  root.UADAVJobsImport={normalize,splitBatches,sendBatch,today};
})(window);
