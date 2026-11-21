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
    const host=url.hostname.toLowerCase().replace(/\.$/,'');
    if(!host.includes('.')||host.length>253||!host.split('.').every(part=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(part))||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal')||host.includes(':')||/^\d+(?:\.\d+){3}$/.test(host))throw Error(label+': usá el dominio público de la publicación.');
    url.hostname=host;url.hash='';return url.href;
  }
  function normalize(row,{visible=false,source='Importación Admin',now=Date.now()}={}){
    if(!row||typeof row!=='object'||Array.isArray(row))throw Error('Una fila de Bolsa no tiene un formato válido.');
    const val=(...keys)=>{for(const key of keys)if(row[key]!==undefined&&row[key]!==null&&String(row[key]).trim())return row[key];return ''};
    const title=text(val('titulo','Titulo','Título','title'),180),description=text(val('descripcion','Descripción','resumen'),2500);
    if(!title||!description)throw Error('Cada oferta externa necesita título y descripción.');
    const sourceInput=val('source_url','url_origen','url','URL');
    if(!sourceInput)throw Error('«'+title+'» no tiene URL de origen HTTPS. Esta herramienta incorpora ofertas externas; el archivo exportado de Bolsa puede incluir ofertas internas y no sirve como respaldo para restaurar. Para una fuente externa, agregá su URL oficial. Para copias de seguridad, usá Auditoría → Respaldo avanzado.');
    const sourceUrl=publicUrl(sourceInput,'Origen de «'+title+'»');
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
  function prepareReview(reply,kind,source){
    if(!['job','event'].includes(kind)||reply?.success!==true||reply.kind!==kind||!reply.item||typeof reply.item.titulo!=='string'||!reply.item.titulo.trim())throw Error('No se confirmó una ficha válida para revisar.');
    const input=reply.item,item={};
    for(const key of ['titulo','descripcion','ciudad','provincia','pais','fecha','fecha_inicio','fecha_fin','fecha_limite','lugar','categoria','empresa','modalidad','source','region_scope'])item[key]=typeof input[key]==='string'?text(input[key],key==='descripcion'?2500:180):'';
    item.source_url=publicUrl(input.source_url,'Origen');item.external_id=item.source_url;
    item.application_url=item.source_url;item.application_mode='external_url';item.origen='externo';
    if(source){item.source=text(source.name,100);item.source_id=text(source.id,80);item.source_auto_sync=true;}
    return {kind,item};
  }
  function captureReady(health){
    if(health?.ok!==true||health.success!==true||health.d1!==true||!/^\d+$/.test(String(health.build||''))||Number(health.build)<11762)throw Error('La revisión de enlaces requiere el Worker de staging 11762 o posterior. Actualizalo y volvé a revisar.');
  }
  function reviewedItem(review,{title,description,deadline},now=Date.now()){
    const item={...review.item,titulo:text(title,180),descripcion:text(description,2500)};
    if(!item.titulo||!item.descripcion)throw Error('Completá el título y la descripción antes de incorporar.');
    item.source_url=publicUrl(item.source_url,'Origen');item.external_id=item.source_url;item.application_url=item.source_url;
    if(review.kind==='job'){
      if(!validDate(deadline)||deadline<today(now))throw Error('Elegí una fecha límite válida y vigente.');
      item.fecha_limite=deadline;item.revisado_por_admin=true;
    }
    return item;
  }
  async function sendReviewed(kind,item,{origin,request}){
    if(origin!==ORIGIN)throw Error('La revisión externa solo está preparada en staging.');
    if(!['job','event'].includes(kind))throw Error('Elegí Bolsa o Cartelera.');
    const result=await request('admin/federated/import',{method:'POST',body:{kind,items:[item]}});
    if(result?.success!==true||result.kind!==kind||!Number.isInteger(result.imported)||!Number.isInteger(result.updated)||result.imported<0||result.updated<0||result.imported+result.updated!==1)throw Error('No se confirmó la incorporación. Comprobá la lista antes de repetirla.');
    return result;
  }
  function splitBatches(batches){
    const seen=new Set(),result=[];
    for(const batch of batches){
      if(batch.entity!=='jobs'){result.push(batch);continue}
      for(const row of batch.rows){const key=publicUrl(row.source_url||row.external_id,'Origen');if(seen.has(key))throw Error('La planilla repite una URL de origen. Corregí los duplicados antes de importar.');seen.add(key)}
      for(let i=0;i<batch.rows.length;i+=5)result.push({...batch,rows:batch.rows.slice(i,i+5)});
    }
    return result;
  }
  async function readWorkbook(file,reader){
    if(/\.(csv|tsv|txt)$/i.test(file.name)){
      const content=(await file.text()).replace(/^\uFEFF/,'');
      if(content.includes('\uFFFD'))throw Error('No se pudo leer el texto. Guardá la planilla como CSV UTF-8 y volvé a elegirla.');
      return reader.read(content,{type:'string',raw:true});
    }
    return reader.read(await file.arrayBuffer(),{type:'array'});
  }
  function sheetRows(workbook,name,entity,reader){
    const rows=reader.utils.sheet_to_json(workbook.Sheets[name],{defval:''});
    if(entity!=='jobs')return rows;
    return rows.map(row=>{
      const result={...row};
      for(const key of ['fecha_limite','Fecha límite','fecha','Fecha']){
        if(typeof result[key]!=='number')continue;
        const date=reader.SSF.parse_date_code(result[key],{date1904:workbook.Workbook?.WBProps?.date1904===true});
        if(!date)throw Error('No se pudo interpretar una fecha de Excel. Usá una fecha calendario o AAAA-MM-DD.');
        result[key]=String(date.y).padStart(4,'0')+'-'+String(date.m).padStart(2,'0')+'-'+String(date.d).padStart(2,'0');
      }
      return result;
    });
  }
  async function sendBatch(batch,{origin,request}){
    if(origin!==ORIGIN)throw Error('La importación de Bolsa solo está preparada en staging.');
    if(batch?.entity!=='jobs'||!Array.isArray(batch.rows)||!batch.rows.length||batch.rows.length>5)throw Error('Revisá un lote de hasta cinco ofertas externas.');
    const result=await request('admin/federated/import',{method:'POST',body:{kind:'job',items:batch.rows}});
    if(result?.success!==true||result.kind!=='job'||!Number.isInteger(result.imported)||!Number.isInteger(result.updated)||result.imported<0||result.updated<0||result.imported+result.updated!==batch.rows.length)throw Error('El servidor no confirmó todas las ofertas de este lote. Revisá la lista antes de repetirlo.');
    return result;
  }
  root.UADAVJobsImport={normalize,splitBatches,sendBatch,today,readWorkbook,sheetRows,prepareReview,captureReady,reviewedItem,sendReviewed,publicUrl};
})(window);
