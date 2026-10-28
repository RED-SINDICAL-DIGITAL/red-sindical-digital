/* OFFLINE / DISPOSABLE DB ONLY. Never mounted on an operational Worker route. */
import {verifyJobBackupDigest} from './job-backup-digest.mjs';
const definitions={
 events:{columns:['id','source_id','title','category','city','province','country','venue','start_date','end_date','status','featured','payment_status','data_json','created_at','updated_at'],sql:"CREATE TABLE events(id TEXT PRIMARY KEY,source_id TEXT,title TEXT NOT NULL,category TEXT,city TEXT,province TEXT,country TEXT,venue TEXT,start_date TEXT,end_date TEXT,status TEXT,featured INTEGER NOT NULL DEFAULT 0,payment_status TEXT,data_json TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)"},
 event_publication_intents:{columns:['request_id','payload_hash','event_id','event_json','created_at'],sql:'CREATE TABLE event_publication_intents(request_id TEXT PRIMARY KEY,payload_hash TEXT NOT NULL,event_id TEXT NOT NULL UNIQUE,event_json TEXT NOT NULL,created_at TEXT NOT NULL)'},
 notifications:{columns:['id','channel','template','recipient','status','payload_json','created_at','sent_at'],sql:"CREATE TABLE notifications(id TEXT PRIMARY KEY,channel TEXT NOT NULL,template TEXT NOT NULL,recipient TEXT,status TEXT NOT NULL,payload_json TEXT NOT NULL,created_at TEXT NOT NULL,sent_at TEXT)"},
 event_notification_dispatch:{columns:['notification_id','state','owner','lease_until','attempts','next_at','provider_id','error_code','updated_at'],sql:'CREATE TABLE event_notification_dispatch(notification_id TEXT PRIMARY KEY,state TEXT NOT NULL,owner TEXT,lease_until INTEGER NOT NULL DEFAULT 0,attempts INTEGER NOT NULL DEFAULT 0,next_at INTEGER NOT NULL DEFAULT 0,provider_id TEXT,error_code TEXT,updated_at TEXT NOT NULL)'},
 entity_versions:{columns:['id','entity_type','entity_id','version','data_json','created_at'],sql:'CREATE TABLE entity_versions(id INTEGER PRIMARY KEY AUTOINCREMENT,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,version INTEGER NOT NULL,data_json TEXT NOT NULL,created_at TEXT NOT NULL)'}
};
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const encode=rows=>JSON.stringify(canonical([...rows].sort((a,b)=>String(a.id||a.request_id||a.notification_id).localeCompare(String(b.id||b.request_id||b.notification_id)))));
const requireValue=(ok,message)=>{if(!ok)throw Error(message)};
async function snapshot(backup){
 requireValue((await verifyJobBackupDigest(backup)).verified,'Un respaldo sin checksum verificado no se restaura.');
 const tables={events:backup.tables?.events||[],event_publication_intents:backup.tables?.event_publication_intents||[],notifications:(backup.tables?.notifications||[]).filter(x=>['event_published','event_featured_requested'].includes(x.template)),entity_versions:(backup.tables?.entity_versions||[]).filter(x=>x.entity_type==='event')};
 const noticeIds=new Set(tables.notifications.map(n=>n.id));tables.event_notification_dispatch=(backup.tables?.event_notification_dispatch||[]).filter(r=>noticeIds.has(r.notification_id)).map(r=>r.state==='sending'?{...r,state:'uncertain',owner:null,lease_until:0,error_code:'RESTORED_UNCONFIRMED'}:r);
 let total=0;for(const [name,rows]of Object.entries(tables)){requireValue(Array.isArray(rows),'Tabla inválida.');total+=rows.length;requireValue(rows.every(r=>r&&typeof r==='object'&&!Array.isArray(r)&&Object.keys(r).length===definitions[name].columns.length&&Object.keys(r).every(k=>definitions[name].columns.includes(k))),'Columnas no reconocidas.');}
 requireValue(total<=10000&&JSON.stringify(tables).length<=5000000,'Respaldo demasiado grande para este ensayo.');
 const ids=new Set(tables.events.map(e=>e.id));requireValue(ids.size===tables.events.length,'Eventos duplicados.');
 for(const row of tables.events){const e=JSON.parse(row.data_json);requireValue(e.id===row.id,'Identidad de evento inconsistente.');}
 for(const row of tables.event_publication_intents)requireValue(ids.has(row.event_id)&&/^[a-f0-9]{64}$/.test(row.payload_hash)&&JSON.parse(row.event_json).id===row.event_id,'Referencia inconsistente.');
 const normalized=JSON.stringify(Object.fromEntries(Object.entries(tables).map(([k,v])=>[k,encode(v)]))),bytes=new TextEncoder().encode(normalized),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 return {tables,hash};
}
async function restoreDisposable(db,backup,{purpose}={}){
 requireValue(purpose==='CARTELERA_DISPOSABLE_RESTORE_11770','Destino de ensayo no confirmado.');
 const source=await snapshot(backup),existing=(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()).results.map(r=>r.name),allowed=[...Object.keys(definitions),'cartelera_restore_guard'];
 const compare=async()=>{for(const [name,rows]of Object.entries(source.tables))requireValue(encode((await db.prepare('SELECT * FROM '+name).all()).results)===encode(rows),'La copia restaurada no coincide.');};
 if(existing.length){requireValue(existing.length===allowed.length&&existing.every(n=>allowed.includes(n)),'La base no está vacía o pertenece a otro sistema.');const guard=await db.prepare('SELECT digest,purpose FROM cartelera_restore_guard').all();requireValue(guard.results.length===1&&guard.results[0].digest===source.hash&&guard.results[0].purpose===purpose,'La base pertenece a otro ensayo.');await compare();return {complete:true,already_restored:true,counts:Object.fromEntries(Object.entries(source.tables).map(([k,v])=>[k,v.length]))};}
 const statements=Object.values(definitions).map(d=>db.prepare(d.sql));statements.push(db.prepare('CREATE TABLE cartelera_restore_guard(digest TEXT PRIMARY KEY,purpose TEXT NOT NULL)'));
 for(const [name,rows]of Object.entries(source.tables))for(const row of rows){const columns=definitions[name].columns.filter(c=>Object.hasOwn(row,c));statements.push(db.prepare('INSERT INTO '+name+'('+columns.join(',')+') VALUES('+columns.map(()=>'?').join(',')+')').bind(...columns.map(c=>row[c])));}
 statements.push(db.prepare('INSERT INTO cartelera_restore_guard VALUES(?,?)').bind(source.hash,purpose));await db.batch(statements);await compare();return {complete:true,already_restored:false,counts:Object.fromEntries(Object.entries(source.tables).map(([k,v])=>[k,v.length]))};
}
export {snapshot,restoreDisposable};
