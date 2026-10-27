/* Experimental staging component. Not connected to Worker routes. */
export const schema=`CREATE TABLE IF NOT EXISTS event_publication_intents (request_id TEXT PRIMARY KEY, payload_hash TEXT NOT NULL, event_id TEXT NOT NULL UNIQUE, event_json TEXT NOT NULL, created_at TEXT NOT NULL);`;
export async function reserveEvent(db,{requestId,payloadHash,event,createdAt}){
 if(!db||!/^[-A-Za-z0-9_]{16,128}$/.test(requestId||'')||!/^[a-f0-9]{64}$/.test(payloadHash||'')||!event||!/^[-A-Za-z0-9_]{1,120}$/.test(event.id||'')||!createdAt)throw Error('Invalid event intent');
 const candidate=JSON.stringify(event);if(candidate.length>50000)throw Error('Event too large');
 const results=await db.batch([
  db.prepare('INSERT OR IGNORE INTO event_publication_intents(request_id,payload_hash,event_id,event_json,created_at) SELECT ?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM events WHERE id=?)').bind(requestId,payloadHash,event.id,candidate,createdAt,event.id),
  db.prepare("INSERT OR IGNORE INTO events(id,title,category,city,province,country,venue,start_date,end_date,status,featured,payment_status,data_json,created_at,updated_at) SELECT event_id,?,?,?,?,?,?,?,?, 'published',0,?,event_json,created_at,created_at FROM event_publication_intents WHERE request_id=? AND payload_hash=? AND event_id=?").bind(String(event.titulo||'Evento'),String(event.categoria||''),String(event.ciudad||''),String(event.provincia||''),String(event.pais||'Argentina'),String(event.lugar||''),String(event.fecha_inicio||event.fecha||''),String(event.fecha_fin||''),String(event.destacado_estado||''),requestId,payloadHash,event.id)
 ]);
 const row=await db.prepare('SELECT payload_hash,event_id,event_json FROM event_publication_intents WHERE request_id=?').bind(requestId).first();
 if(!row)throw Error('Publication not confirmed');
 if(row.payload_hash!==payloadHash)return {status:'conflict'};
 const saved=await db.prepare('SELECT id,status,data_json FROM events WHERE id=?').bind(row.event_id).first();if(!saved)throw Error('Publication unavailable');
 const current=JSON.parse(saved.data_json);if(!current||current.id!==saved.id)throw Error('Publication unavailable');
 return {status:'committed',created:Number(results[0]?.meta?.changes)===1,event:{...current,estado:saved.status}};
}
