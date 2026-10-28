/* Canonical Cartelera operations. No KV writes or external network requests. */
const fail=message=>Object.assign(Error(message),{eventStatus:400});
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const validDay=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
function https(value){let url;try{url=new URL(String(value||''))}catch{throw fail('Indicá una URL HTTPS completa de la fuente oficial.')}if(url.protocol!=='https:'||url.username||url.password||!url.hostname.includes('.')||url.hostname.includes(':')||/^[\d.]+$/.test(url.hostname)||/(^|\.)(localhost|local|internal|lan|home|localdomain|onion)$/i.test(url.hostname))throw fail('La fuente debe usar HTTPS sin credenciales.');url.hash='';return url.href}
async function importEvents(db,rows,now=new Date().toISOString()){
 if(!Array.isArray(rows)||!rows.length||rows.length>200)throw fail('Importá entre 1 y 200 eventos por lote.');
 const existing=(await db.prepare('SELECT id,status,data_json FROM events').all()).results||[],statements=[],entries=[],seen=new Set();let skipped=0;
 for(const raw of rows){
  const source=https(raw.source_url||raw.url_origen||raw.url),key=source+'\n'+String(raw.external_id||''),id='EV-EXT-'+(await digest(key)).slice(0,32).toUpperCase();
  if(seen.has(key))throw fail('Hay dos eventos con la misma referencia externa en el lote.');seen.add(key);
  const title=String(raw.titulo||raw.nombre||'').trim(),date=String(raw.fecha_inicio||raw.fecha||'').slice(0,10),end=String(raw.fecha_fin||'').slice(0,10),venue=String(raw.lugar||'').trim();
  if(!title||!venue||!validDay(date)||(end&&(!validDay(end)||end<date)))throw fail('Cada evento necesita título, lugar y fechas válidas.');
  const time=String(raw.hora||'');if(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw fail('La hora del evento es inválida.');
  if(raw.funciones!==undefined&&(!Array.isArray(raw.funciones)||raw.funciones.length>50))throw fail('Revisá las funciones del evento.');
  const funciones=(raw.funciones||[]).map(f=>{const fecha=String(f.fecha||''),hora=String(f.hora||'');if(!validDay(fecha)||(hora&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora))||(end&&fecha>end))throw fail('Revisá las fechas y horas de cada función.');return {fecha,hora}});
  const old=existing.find(r=>{const x=JSON.parse(r.data_json);return r.id===id||(x.source_url===source&&String(x.external_id||x.external_key||source)===String(raw.external_id||source))});
  const prior=old?JSON.parse(old.data_json):{};
  if(old&&(old.status!=='published'||prior.managed===true||prior.claimed===true||prior.created_by_artist_id||prior.origen!=='externo')){skipped++;continue}
  const item={...prior,id:old?.id||id,titulo:title.slice(0,180),nombre:title.slice(0,180),categoria:String(raw.categoria||'Eventos').slice(0,100),fecha:date,fecha_inicio:date,fecha_fin:end,hora:raw.hora===undefined?prior.hora||'':time,funciones:raw.funciones===undefined?prior.funciones||[]:funciones,es_gratuito:raw.es_gratuito===undefined?prior.es_gratuito===true:raw.es_gratuito===true,precio_desde:String(raw.precio_desde??prior.precio_desde??'').slice(0,80),moneda:String(raw.moneda??prior.moneda??'ARS').slice(0,12),link_compra:raw.link_compra||raw.link_ticketera?https(raw.link_compra||raw.link_ticketera):prior.link_compra||'',lugar:venue.slice(0,180),ciudad:String(raw.ciudad||'').slice(0,120),provincia:String(raw.provincia||'').slice(0,120),pais:String(raw.pais||'Argentina').slice(0,80),descripcion_corta:String(raw.descripcion_corta??raw.resumen??prior.descripcion_corta??'').slice(0,400),descripcion:String(raw.descripcion??prior.descripcion??'').slice(0,2500),imagen:raw.imagen||raw.poster?https(raw.imagen||raw.poster):prior.imagen||'',source:String(raw.source||'externa').slice(0,100),source_url:source,external_id:String(raw.external_id||''),external_key:String(raw.external_id||source),origen:'externo',estado:'published',last_seen_at:now,source_status:'active',source_auto_sync:old?prior.source_auto_sync===true:raw.source_auto_sync===true,fecha_creacion:prior.fecha_creacion||now,importado_en:prior.importado_en||now,actualizado:now,destacado_pagado:prior.destacado_pagado===true,destacado_solicitado:prior.destacado_solicitado===true};
  const sql=`INSERT INTO events(id,title,category,city,province,country,venue,start_date,end_date,status,featured,payment_status,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,'published',?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,category=excluded.category,city=excluded.city,province=excluded.province,country=excluded.country,venue=excluded.venue,start_date=excluded.start_date,end_date=excluded.end_date,data_json=excluded.data_json,updated_at=excluded.updated_at WHERE events.status='published' AND events.data_json=?`;
  statements.push(db.prepare(sql).bind(item.id,item.titulo,item.categoria,item.ciudad,item.provincia,item.pais,item.lugar,date,end,item.destacado_pagado?1:0,String(prior.destacado_estado||''),JSON.stringify(item),item.fecha_creacion,now,old?.data_json||null));entries.push({updated:!!old});
 }
 if(!statements.length)return {imported:0,created:0,updated:0,skipped,total:rows.length};
 const results=await db.batch(statements);let imported=0,updated=0;
 results.forEach((r,i)=>{if(Number(r.meta?.changes)===1){if(entries[i].updated)updated++;else imported++}else skipped++});
 return {imported,created:imported,updated,skipped,total:rows.length};
}
async function maintenance(db,now=new Date().toISOString()){
 const lastDay="MAX(COALESCE(NULLIF(end_date,''),start_date,''),COALESCE((SELECT MAX(json_extract(value,'$.fecha')) FROM json_each(events.data_json,'$.funciones')),''))";
 const end="CASE WHEN length("+lastDay+")=10 THEN "+lastDay+"||'T23:59:59-03:00' ELSE "+lastDay+" END";
 const statements=[
  db.prepare(`UPDATE events SET featured=0,payment_status='vencido',data_json=json_set(data_json,'$.destacado_pagado',json('false'),'$.destacado_estado','vencido','$.actualizado',?),updated_at=? WHERE status='published' AND featured=1 AND julianday(json_extract(data_json,'$.destacado_hasta'))<julianday(?)`).bind(now,now,now),
  db.prepare(`UPDATE events SET status='expired',data_json=json_set(data_json,'$.estado','expired','$.source_status','stale','$.actualizado',?),updated_at=? WHERE status='published' AND json_extract(data_json,'$.origen')='externo' AND COALESCE(json_extract(data_json,'$.managed'),0)<>1 AND COALESCE(json_extract(data_json,'$.claimed'),0)<>1 AND (julianday(${end})<julianday(?,'-6 hours') OR (json_extract(data_json,'$.source_auto_sync')=1 AND julianday(COALESCE(json_extract(data_json,'$.last_seen_at'),json_extract(data_json,'$.importado_en')))<julianday(?,'-72 hours')))` ).bind(now,now,now,now)
 ];
 const r=await db.batch(statements);return {expired_features:Number(r[0].meta?.changes||0),expired_external_events:Number(r[1].meta?.changes||0)};
}
export {importEvents,maintenance};
