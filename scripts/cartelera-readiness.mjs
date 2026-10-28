/* Read-only transition audit. Counts only: no contact data, titles or credentials. */
const collections=['eventos_publicados','cartelera_aprobada','eventos_pendientes'];
function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]));return v}
function normalized(event,status){return JSON.stringify(stable({...event,id:String(event.id),estado:status}))}
async function inspect(db,kv){
 const blockers=[],legacy=new Map(),raws=[];let duplicates=0;
 for(const key of collections){const raw=await kv.get(key);raws.push(raw);let values;try{values=raw==null?[]:JSON.parse(raw);if(!Array.isArray(values))throw Error()}catch{blockers.push('INVALID_LEGACY_COLLECTION');continue}
  for(const event of values){if(!event||typeof event!=='object'||Array.isArray(event)||typeof event.id!=='string'||!event.id){blockers.push('INVALID_LEGACY_EVENT');continue}const status=event.estado||event.status||(key==='eventos_pendientes'?'pending':'published'),item={status,json:normalized(event,status)};if(legacy.has(event.id)){duplicates++;if(legacy.get(event.id).json!==item.json)blockers.push('CONFLICTING_LEGACY_COPIES')}else legacy.set(event.id,item)}
 }
 const names=new Set(((await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results||[]).map(r=>r.name));
 if(!names.has('events'))return{ready:false,read_only:true,blockers:[...new Set([...blockers,'EVENTS_TABLE_MISSING'])],counts:{legacy:legacy.size}};
 const rows=(await db.prepare('SELECT id,status,data_json FROM events').all()).results||[],canonical=new Map();let invalid=0;
 for(const row of rows){try{const data=JSON.parse(row.data_json);if(!data||typeof data!=='object'||Array.isArray(data))throw Error();canonical.set(String(row.id),{status:row.status,json:normalized({...data,id:String(row.id)},row.status)})}catch{invalid++}}
 const counts={legacy:legacy.size,d1:rows.length,legacy_duplicate_copies:duplicates,invalid_d1:invalid,legacy_missing_in_d1:0,changed_records:0,d1_only_public:0,public_before:0,public_after:0};
 for(const [id,event] of legacy){if(event.status==='published')counts.public_before++;const current=canonical.get(id);if(!current)counts.legacy_missing_in_d1++;else if(current.json!==event.json)counts.changed_records++}
 for(const [id,event] of canonical){if(event.status==='published'){counts.public_after++;if(!legacy.has(id))counts.d1_only_public++}}
 if(invalid)blockers.push('INVALID_D1_EVENT');if(counts.legacy_missing_in_d1)blockers.push('LEGACY_EVENTS_MISSING_IN_D1');if(counts.changed_records)blockers.push('LEGACY_D1_DIFFERENCES_REQUIRE_REVIEW');if(counts.d1_only_public)blockers.push('D1_ONLY_PUBLIC_EVENTS_REQUIRE_REVIEW');
 for(let i=0;i<collections.length;i++)if(await kv.get(collections[i])!==raws[i])blockers.push('LEGACY_CHANGED_DURING_CHECK');
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({legacy:[...legacy].sort(),canonical:[...canonical].sort()})))),b=>b.toString(16).padStart(2,'0')).join('');
 return {ready:blockers.length===0,read_only:true,blockers:[...new Set(blockers)],counts,comparison_sha256:digest,distributed_snapshot:false,backup_required:true,scope:'cartelera-staging-readiness'};
}
export {inspect};
