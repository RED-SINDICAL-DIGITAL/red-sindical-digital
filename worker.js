export default {
  async fetch(request, env, ctx) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Premium-Token,X-Client-Id',
      'Content-Type': 'application/json; charset=utf-8'
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    const path = url.pathname;
    const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
      status,
      headers: { ...cors, ...extra }
    });
    const text = (body, status = 200, extra = {}) => new Response(body, {
      status,
      headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8', ...extra }
    });
    const isAdmin = () => { const got=String(request.headers.get('Authorization')||'').trim(); const want='Bearer '+String(env.ADMIN_KEY||'').trim(); return !!env.ADMIN_KEY && got===want; }
    const getJSON = async (key, fallback) => {
      const raw = await env.UADAV_DB.get(key);
      if (!raw) return fallback;
      try { return JSON.parse(raw); } catch { return fallback; }
    };
    const putJSON = (key, value) => env.UADAV_DB.put(key, JSON.stringify(value));
    const getArray = (key) => getJSON(key, []);
    const getObject = (key) => getJSON(key, {});
    const isoNow = () => new Date().toISOString();
    const normalizeSearchText = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    async function getSearchRestrictions() {
      if (hasD1()) {
        try {
          const r = await env.DB.prepare(`SELECT id,kind,value,active,reason FROM search_restrictions WHERE active=1 ORDER BY kind,value`).all();
          return Array.isArray(r.results) ? r.results : [];
        } catch (_) {}
      }
      return (await getArray('search_restrictions')).filter(x=>x && x.active!==false);
    }
    function restrictedProspect(item, restrictions) {
      const title = normalizeSearchText(item?.title);
      const channel = normalizeSearchText(item?.channel_name);
      const urlValue = normalizeSearchText(item?.url);
      const external = normalizeSearchText(item?.external_id);
      for (const r of (restrictions || [])) {
        const value = normalizeSearchText(r?.value);
        if (!value) continue;
        const kind = String(r?.kind || 'term');
        if (kind === 'term' && (title.includes(value) || channel.includes(value))) return true;
        if (kind === 'channel' && (external === value || channel === value)) return true;
        if (kind === 'url' && urlValue.includes(value)) return true;
        if (kind === 'artist' && (title === value || channel === value)) return true;
      }
      return false;
    }
    const prospectingQueries = {
      all: 'artistas Argentina',
      solista: 'solista artista Argentina',
      banda: 'banda grupo musical Argentina',
      circo: 'circo artistas Argentina',
      teatro: 'teatro actores actrices Argentina',
      danza: 'danza bailarines Argentina',
      magia: 'magia ilusionistas Argentina',
      humor: 'humor comedia Argentina',
      animacion: 'animacion espectaculo Argentina',
      locucion: 'locutor conductor Argentina',
      grupo: 'compania elenco grupo artistico Argentina',
      sala: 'teatro sala cultural espacio escenico Argentina',
      productora: 'productora espectaculos Argentina',
      creador: 'youtuber creador contenidos Argentina'
    };
    const categoryLabel = (key) => ({all:'Artistas',solista:'Solistas',banda:'Bandas / Grupos',circo:'Circo',teatro:'Teatro',danza:'Danza',magia:'Magia',humor:'Humor',animacion:'Animación',locucion:'Locución / Conducción',grupo:'Compañías / Elencos',sala:'Salas / Espacios',productora:'Productoras',creador:'Creadores / YouTubers'}[key] || 'Artistas');
    const makeId = (prefix='ID') => prefix+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
    const hasD1 = () => !!env.DB;
    async function youtubeApiEnabled(){
      const v = await getJSON('youtube_api_enabled', null);
      if (v === false || String(v).toLowerCase() === 'false') return false;
      return !!env.YOUTUBE_API_KEY;
    }

    // Invidious is a permanent provider in UADAV STREAM: used as the default source
    // for public discovery so the official YouTube quota is not consumed unless
    // Invidious succeeds. The official API remains enabled only as last fallback.

    // for global search, artist prospecting and channel resolution. Instances are ordered
    // by the current public list from the Invidious documentation, with yewtu.be retained
    // as an additional legacy fallback.
    const INVIDIOUS_INSTANCES = [
      'https://inv.nadeko.net',
      'https://invidious.nerdvpn.de',
      'https://yt.chocolatemoo53.com',
      'https://invidious.tiekoetter.com',
      'https://yewtu.be'
    ];
    async function invidiousSearch(query, type='video', limit=20) {
      const q=String(query||'').trim(); if(!q) return [];
      const max=Math.min(25,Math.max(1,Number(limit||20)));
      for (const base of INVIDIOUS_INSTANCES) {
        const controller=new AbortController();
        const timer=setTimeout(()=>controller.abort(),5000);
        try {
          const u=new URL(base+'/api/v1/search');
          u.searchParams.set('q',q);
          u.searchParams.set('type',type);
          u.searchParams.set('page','1');
          u.searchParams.set('hl','es');
          const r=await fetch(u.toString(),{signal:controller.signal,headers:{Accept:'application/json','User-Agent':'UADAVSTREAM/7.4'}});
          if(!r.ok) continue;
          const arr=await r.json();
          if(Array.isArray(arr)&&arr.length) return arr.slice(0,max);
        } catch (_) {} finally { clearTimeout(timer); }
      }
      return [];
    }

    async function invidiousChannelSearch(name) {
      const arr=await invidiousSearch(name,'channel',8);
      const item=arr.find(x=>x?.authorId||x?.channelId||x?.ucid||x?.id);
      if(!item) return null;
      const channelId=String(item.authorId||item.channelId||item.ucid||item.id||'');
      if(!channelId) return null;
      return {channelId,nombre:String(item.author||item.title||name),thumbnail:String(item.authorThumbnails?.[0]?.url||item.videoThumbnails?.[0]?.url||''),bio:String(item.description||''),source:'invidious'};
    }
    async function invidiousChannelInfo(channelId){
      const id=String(channelId||'').trim(); if(!id)return null;
      for(const base of INVIDIOUS_INSTANCES){
        const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),5000);
        try{
          const r=await fetch(base+'/api/v1/channels/'+encodeURIComponent(id)+'?hl=es',{signal:controller.signal,headers:{Accept:'application/json','User-Agent':'UADAVSTREAM/7.4.2'}});
          if(!r.ok)continue; const d=await r.json();
          if(d?.authorId||d?.author){
            return {channelId:String(d.authorId||id),nombre:String(d.author||'Artista'),thumbnail:String(d.authorThumbnails?.find?.(x=>x.quality==='medium')?.url||d.authorThumbnails?.[0]?.url||''),banner:String(d.authorBanners?.find?.(x=>x.quality==='medium')?.url||d.authorBanners?.[0]?.url||''),bio:String(d.description||''),source:'invidious'};
          }
        }catch(_){ } finally{clearTimeout(timer)}
      }
      return null;
    }
    const d1Batch = async (statements) => {
      if (!hasD1() || !statements.length) return;
      for (let i = 0; i < statements.length; i += 50) await env.DB.batch(statements.slice(i, i + 50));
    };
    const safeJSON = (v, fallback = {}) => { try { return typeof v === 'string' ? JSON.parse(v) : (v ?? fallback); } catch { return fallback; } };
    async function audit(action, entityType, entityId, meta = {}) {
      if (!hasD1()) return;
      try {
        await env.DB.prepare(`INSERT INTO audit_log(actor_type,actor_name,action,entity_type,entity_id,meta_json,created_at) VALUES(?,?,?,?,?,?,?)`)
          .bind(isAdmin() ? 'admin' : 'system', isAdmin() ? 'Administrador Nacional' : 'UADAV STREAM', action, entityType || null, entityId || null, JSON.stringify(meta), isoNow()).run();
      } catch (_) {}
    }
    async function upsertSetting(key, value) {
      if (!hasD1()) return;
      await env.DB.prepare(`INSERT INTO settings(key,value_json,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at`)
        .bind(key, JSON.stringify(value), isoNow()).run();
    }
    async function syncSourcesD1(list) {
      if (!hasD1()) return;
      const statements = (Array.isArray(list)?list:[]).map(x => env.DB.prepare(`INSERT INTO sources(id,name,province,type,active,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,province=excluded.province,type=excluded.type,active=excluded.active,data_json=excluded.data_json,updated_at=excluded.updated_at`)
        .bind(String(x.id||('SRC-'+Math.random().toString(36).slice(2,10))), String(x.nombre||x.name||x.provincia||'Origen'), String(x.provincia||x.province||''), String(x.tipo||x.type||'seccional'), x.activa===false?0:1, JSON.stringify(x), String(x.creado||x.created_at||isoNow()), isoNow()));
      await d1Batch(statements);
    }
    async function syncArtistsD1(list) {
      if (!hasD1()) return;
      const statements = (Array.isArray(list)?list:[]).filter(Boolean).map(a => env.DB.prepare(`INSERT INTO artists(id,source_id,name,stage_name,category,city,province,country,affiliation_status,verified,status,visible,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,name=excluded.name,stage_name=excluded.stage_name,category=excluded.category,city=excluded.city,province=excluded.province,country=excluded.country,affiliation_status=excluded.affiliation_status,verified=excluded.verified,status=excluded.status,visible=excluded.visible,data_json=excluded.data_json,updated_at=excluded.updated_at`)
        .bind(String(a.id||a.token||a.canal||a.nombre||a.nombre_artistico||'ART-'+Date.now()), String(a.source_id||a.origen_id||'' )||null, String(a.nombre||''), String(a.nombre_artistico||a.nombre||''), String(a.rubro||a.categoria||''), String(a.ciudad||''), String(a.provincia||a.region||''), String(a.pais||'Argentina'), String(a.estado_afiliacion||a.afiliacion_estado||''), a.afiliado_verificado===true?1:0, String(a.estado||'catalogo'), a.visible===false?0:1, JSON.stringify(a), String(a.creado||a.fecha_creacion||isoNow()), isoNow()));
      await d1Batch(statements);
    }
    async function syncProducersD1(list) {
      if (!hasD1()) return;
      const statements = (Array.isArray(list)?list:[]).filter(Boolean).map(x => env.DB.prepare(`INSERT INTO producers(id,source_id,name,city,province,country,status,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,name=excluded.name,city=excluded.city,province=excluded.province,country=excluded.country,status=excluded.status,data_json=excluded.data_json,updated_at=excluded.updated_at`)
        .bind(String(x.id||x.token||'PROD-'+Date.now()), String(x.source_id||x.origen_id||'')||null, String(x.nombre||x.name||x.productora||''), String(x.ciudad||''), String(x.provincia||x.region||''), String(x.pais||'Argentina'), String(x.estado||x.status||'activo'), JSON.stringify(x), String(x.creado||x.fecha_creacion||isoNow()), isoNow()));
      await d1Batch(statements);
    }
    async function syncEventsD1(list) {
      if (!hasD1()) return;
      const statements = (Array.isArray(list)?list:[]).filter(Boolean).map(x => env.DB.prepare(`INSERT INTO events(id,source_id,title,category,city,province,country,venue,start_date,end_date,status,featured,payment_status,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,title=excluded.title,category=excluded.category,city=excluded.city,province=excluded.province,country=excluded.country,venue=excluded.venue,start_date=excluded.start_date,end_date=excluded.end_date,status=excluded.status,featured=excluded.featured,payment_status=excluded.payment_status,data_json=excluded.data_json,updated_at=excluded.updated_at`)
        .bind(String(x.id), String(x.source_id||x.origen_id||'')||null, String(x.titulo||x.nombre||x.title||'Evento'), String(x.categoria||x.rubro||''), String(x.ciudad||''), String(x.provincia||''), String(x.pais||'Argentina'), String(x.lugar||x.venue||''), String(x.fecha_inicio||x.fecha||x.start_date||''), String(x.fecha_fin||x.end_date||''), String(x.estado||x.status||'published'), x.destacado_pagado===true?1:0, String(x.destacado_estado||x.payment_status||''), JSON.stringify(x), String(x.fecha_creacion||x.creado||x.created_at||isoNow()), isoNow()));
      await d1Batch(statements);
    }
    async function syncRadiosD1(list) {
      if (!hasD1()) return;
      const statements = (Array.isArray(list)?list:[]).filter(Boolean).map(x => env.DB.prepare(`INSERT INTO radios(id,source_id,name,city,province,country,status,featured,pauta_status,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,name=excluded.name,city=excluded.city,province=excluded.province,country=excluded.country,status=excluded.status,featured=excluded.featured,pauta_status=excluded.pauta_status,data_json=excluded.data_json,updated_at=excluded.updated_at`)
        .bind(String(x.id||x.slug||x.nombre||'RAD-'+Date.now()), String(x.source_id||x.origen_id||'')||null, String(x.nombre||x.name||'Radio'), String(x.ciudad||''), String(x.provincia||''), String(x.pais||'Argentina'), String(x.estado||x.status||'active'), x.destacada===true||x.destacado===true?1:0, String(x.pauta_status||x.estado_pauta||''), JSON.stringify(x), String(x.creado||x.fecha_creacion||isoNow()), isoNow()));
      await d1Batch(statements);
    }
    async function syncJobsD1(list) {
      if (!hasD1()) return;
      const statements = (Array.isArray(list)?list:[]).filter(Boolean).map(x => env.DB.prepare(`INSERT INTO jobs(id,source_id,title,category,city,province,status,active,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,title=excluded.title,category=excluded.category,city=excluded.city,province=excluded.province,status=excluded.status,active=excluded.active,data_json=excluded.data_json,updated_at=excluded.updated_at`)
        .bind(String(x.id), String(x.source_id||x.origen_id||'')||null, String(x.titulo||x.title||'Oportunidad'), String(x.rubro||x.categoria||''), String(x.ciudad||''), String(x.provincia||''), String(x.estado||x.status||(x.activo===false?'hidden':'published')), x.activo===false?0:1, JSON.stringify(x), String(x.creado||x.fecha_creacion||isoNow()), isoNow()));
      await d1Batch(statements);
    }
    async function syncJobApplicationsD1(list) {
      if (!hasD1()) return;
      const statements = (Array.isArray(list)?list:[]).filter(Boolean).map(x => env.DB.prepare(`INSERT INTO job_applications(id,job_id,artist_id,status,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET job_id=excluded.job_id,artist_id=excluded.artist_id,status=excluded.status,data_json=excluded.data_json,updated_at=excluded.updated_at`)
        .bind(String(x.id), String(x.job_id||''), String(x.artist_id||''), String(x.estado||x.status||'pendiente'), JSON.stringify(x), String(x.creado||x.created_at||isoNow()), isoNow()));
      await d1Batch(statements);
    }
    async function syncContractsD1(list) {
      if (!hasD1()) return;
      const statements = (Array.isArray(list)?list:[]).filter(Boolean).map(x => env.DB.prepare(`INSERT INTO contracts(id,artist_id,producer_id,status,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET artist_id=excluded.artist_id,producer_id=excluded.producer_id,status=excluded.status,data_json=excluded.data_json,updated_at=excluded.updated_at`)
        .bind(String(x.id), String(x.artist_id||''), String(x.producer_id||x.productora_id||''), String(x.estado||x.status||'pendiente'), JSON.stringify(x), String(x.creado||x.created_at||isoNow()), isoNow()));
      await d1Batch(statements);
    }
    async function deliverNotification(payload, env2=env) {
      const url = String(env2.EMAIL_AUTOMATION_URL||'').trim();
      if (!url) return {sent:false,reason:'EMAIL_AUTOMATION_URL no configurada'};
      try {
        const r = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(env2.EMAIL_AUTOMATION_SECRET?{'X-UADAV-Webhook-Secret':String(env2.EMAIL_AUTOMATION_SECRET)}:{})},body:JSON.stringify(payload)});
        if(!r.ok) return {sent:false,status:r.status};
        return {sent:true};
      } catch(e) { return {sent:false,error:String(e?.message||e)}; }
    }
    async function emitNotification(payload) {
      const item = { id: 'N-'+Date.now().toString(36).toUpperCase(), channel:String(payload.channel||'email'), template:String(payload.template||payload.event||'generic'), recipient:String(payload.to||payload.recipient||''), status:'queued', payload, created_at:isoNow() };
      if (hasD1()) await env.DB.prepare(`INSERT INTO notifications(id,channel,template,recipient,status,payload_json,created_at) VALUES(?,?,?,?,?,?,?)`).bind(item.id,item.channel,item.template,item.recipient,item.status,JSON.stringify(payload),item.created_at).run();
      if (env.UADAV_NOTIFY) {
        try { await env.UADAV_NOTIFY.send(JSON.stringify({notification_id:item.id,...payload})); return item; } catch (_) {}
      }
      const send = deliverNotification({notification_id:item.id,...payload},env);
      if (ctx?.waitUntil) ctx.waitUntil(send);
      else { const result=await send; if(result.sent && hasD1()) await env.DB.prepare(`UPDATE notifications SET status='sent',sent_at=? WHERE id=?`).bind(isoNow(),item.id).run(); }
      return item;
    }
    async function flushQueuedNotifications(env2=env, limit=20) {
      if(!hasD1()) return {processed:0};
      const rows = await env2.DB.prepare(`SELECT id,channel,template,recipient,payload_json FROM notifications WHERE status='queued' ORDER BY created_at ASC LIMIT ?`).bind(Math.min(50,Math.max(1,Number(limit||20)))).all();
      let processed=0;
      for(const row of (rows.results||[])){
        const payload=safeJSON(row.payload_json,{});
        const result=await deliverNotification({notification_id:row.id,...payload},env2);
        if(result.sent){ await env2.DB.prepare(`UPDATE notifications SET status='sent',sent_at=? WHERE id=?`).bind(isoNow(),row.id).run(); processed++; }
      }
      return {processed};
    }
    const aiSchemaFor = (type) => {
      const common={type:'object',additionalProperties:false,properties:{resumen:{type:'string'},observaciones:{type:'array',items:{type:'string'}},campos_faltantes:{type:'array',items:{type:'string'}},duplicado_probable:{type:'boolean'},confianza:{type:'number'}} ,required:['resumen','observaciones','campos_faltantes','duplicado_probable','confianza']};
      if(type==='artist') common.properties.categoria_sugerida={type:'string'};
      if(type==='event') common.properties.categoria_sugerida={type:'string'};
      if(type==='radio') common.properties.categoria_sugerida={type:'string'};
      return common;
    };
    async function callGemini(prompt,schema){
      const key=String(env.GEMINI_API_KEY||'').trim(); if(!key)return null;
      const model=String(env.GEMINI_MODEL||'gemini-2.5-flash-lite');
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.1,responseMimeType:'application/json',responseSchema:schema}})});
      const data=await r.json().catch(()=>({})); if(!r.ok)return null;
      const txt=(data?.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('');
      try{return JSON.parse(txt)}catch{return null}
    }
    async function callGroq(prompt,schema){
      const key=String(env.GROQ_API_KEY||'').trim(); if(!key)return null;
      const model=String(env.GROQ_MODEL||'openai/gpt-oss-20b');
      const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model,messages:[{role:'system',content:'Respondé únicamente con JSON válido y seguí exactamente el esquema solicitado.'},{role:'user',content:prompt}],temperature:0,response_format:{type:'json_schema',json_schema:{name:'uadav_ai',strict:true,schema}}})});
      const data=await r.json().catch(()=>({})); if(!r.ok)return null;
      const txt=data?.choices?.[0]?.message?.content||''; try{return JSON.parse(txt)}catch{return null}
    }

    const D1_BOOTSTRAP_SQL = `PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  province TEXT,
  type TEXT NOT NULL DEFAULT 'seccional',
  active INTEGER NOT NULL DEFAULT 1,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS artists (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  name TEXT,
  stage_name TEXT,
  category TEXT,
  city TEXT,
  province TEXT,
  country TEXT,
  affiliation_status TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  status TEXT,
  visible INTEGER NOT NULL DEFAULT 1,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_artists_province ON artists(province);
CREATE INDEX IF NOT EXISTS idx_artists_category ON artists(category);
CREATE INDEX IF NOT EXISTS idx_artists_status ON artists(status);
CREATE INDEX IF NOT EXISTS idx_artists_source ON artists(source_id);

CREATE TABLE IF NOT EXISTS producers (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  name TEXT NOT NULL,
  city TEXT,
  province TEXT,
  country TEXT,
  status TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_producers_province ON producers(province);
CREATE INDEX IF NOT EXISTS idx_producers_source ON producers(source_id);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  title TEXT NOT NULL,
  category TEXT,
  city TEXT,
  province TEXT,
  country TEXT,
  venue TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured);

CREATE TABLE IF NOT EXISTS radios (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  name TEXT NOT NULL,
  city TEXT,
  province TEXT,
  country TEXT,
  status TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  pauta_status TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_radios_featured ON radios(featured);
CREATE INDEX IF NOT EXISTS idx_radios_pauta ON radios(pauta_status);
CREATE INDEX IF NOT EXISTS idx_radios_province ON radios(province);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  title TEXT NOT NULL,
  category TEXT,
  city TEXT,
  province TEXT,
  status TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(active);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_province ON jobs(province);

CREATE TABLE IF NOT EXISTS job_applications (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  artist_id TEXT,
  status TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_job_apps_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_artist ON job_applications(artist_id);

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  artist_id TEXT,
  producer_id TEXT,
  status TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contracts_artist ON contracts(artist_id);
CREATE INDEX IF NOT EXISTS idx_contracts_producer ON contracts(producer_id);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  status TEXT,
  payment_status TEXT,
  starts_at TEXT,
  ends_at TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_campaign_entity ON campaigns(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_campaign_status ON campaigns(status);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  template TEXT NOT NULL,
  recipient TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  sent_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type TEXT,
  actor_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  meta_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

-- Full-text search base for artists, events, radios and producers.
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
  entity_type UNINDEXED,
  entity_id UNINDEXED,
  title,
  subtitle,
  body,
  tokenize = 'unicode61 remove_diacritics 2'
);

CREATE TABLE IF NOT EXISTS artist_claims (
  id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL,
  name TEXT,
  email TEXT NOT NULL,
  whatsapp TEXT,
  proof_url TEXT,
  social_url TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  review_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_artist_claims_artist ON artist_claims(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_claims_status ON artist_claims(status);
CREATE INDEX IF NOT EXISTS idx_artist_claims_email ON artist_claims(email);

CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  name TEXT NOT NULL,
  city TEXT,
  province TEXT,
  country TEXT,
  address TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'candidate',
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_province ON venues(province);
CREATE INDEX IF NOT EXISTS idx_venues_status ON venues(status);

CREATE TABLE IF NOT EXISTS event_occurrences (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT,
  timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_event_occurrences_event ON event_occurrences(event_id);
CREATE INDEX IF NOT EXISTS idx_event_occurrences_start ON event_occurrences(start_at);

CREATE TABLE IF NOT EXISTS search_restrictions (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  value TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_search_restrictions_kind ON search_restrictions(kind);
CREATE INDEX IF NOT EXISTS idx_search_restrictions_active ON search_restrictions(active);

CREATE TABLE IF NOT EXISTS prospecting_runs (
  id TEXT PRIMARY KEY,
  country TEXT,
  region TEXT,
  category TEXT,
  query TEXT,
  resource_type TEXT,
  provider TEXT,
  status TEXT,
  result_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prospecting_runs_created ON prospecting_runs(created_at);

CREATE TABLE IF NOT EXISTS prospecting_results (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  resource_type TEXT,
  external_id TEXT,
  title TEXT,
  channel_name TEXT,
  category TEXT,
  city TEXT,
  province TEXT,
  country TEXT,
  thumbnail TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'candidate',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prospecting_results_run ON prospecting_results(run_id);
CREATE INDEX IF NOT EXISTS idx_prospecting_results_external ON prospecting_results(external_id);
CREATE INDEX IF NOT EXISTS idx_prospecting_results_status ON prospecting_results(status);
CREATE INDEX IF NOT EXISTS idx_prospecting_results_category ON prospecting_results(category);
`;
    if (path === '/api/health') {
      return json({ ok: true, success: true, service: 'UADAVSTREAM', version: 'V7.4.2', kv: !!env.UADAV_DB, d1: hasD1(), youtube_api_enabled: await youtubeApiEnabled(), ai_gemini: !!env.GEMINI_API_KEY, ai_groq: !!env.GROQ_API_KEY, email_automation: !!env.EMAIL_AUTOMATION_URL, queue: !!env.UADAV_NOTIFY, youtube_key: !!env.YOUTUBE_API_KEY, youtube_api_mode: (await youtubeApiEnabled())?'enabled':'invidious_only', timestamp: isoNow() });
    }
    if (path === '/api/v7/health') {
      return json({ service:'UADAVSTREAM', architecture:'D1+KV', d1:hasD1(), ai:{gemini:!!env.GEMINI_API_KEY,groq:!!env.GROQ_API_KEY}, automation:{email:!!env.EMAIL_AUTOMATION_URL,queue:!!env.UADAV_NOTIFY} });
    }
    if (path === '/api/admin/invidious/health' && request.method === 'GET') {
      if(!isAdmin()) return json({error:'No autorizado'},401);
      const out=[];
      for(const base of INVIDIOUS_INSTANCES){
        const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),3500); const t=Date.now();
        try{const r=await fetch(base+'/api/v1/stats',{signal:controller.signal,headers:{Accept:'application/json','User-Agent':'UADAVSTREAM/7.4'}});out.push({instance:base,ok:r.ok,status:r.status,ms:Date.now()-t});}
        catch(e){out.push({instance:base,ok:false,error:String(e?.message||e)});} finally{clearTimeout(timer);}
      }
      return json({checked_at:isoNow(),instances:out});
    }

    if (path === '/api/v7/migrate_kv' && request.method === 'POST') {
      if (!isAdmin()) return json({error:'No autorizado'},401);
      if (!hasD1()) return json({error:'D1 no configurado en el Worker'},503);
      await syncSourcesD1(await getArray('sources'));
      await syncArtistsD1(await getArray('artistas'));
      await syncProducersD1(await getArray('productoras'));
      await syncEventsD1([...(await getArray('eventos_publicados')),...(await getArray('eventos_pendientes')),...(await getArray('cartelera_aprobada'))]);
      await syncRadiosD1(await getArray('radios'));
      await syncJobsD1(await getArray('bolsa_trabajo'));
      await syncJobApplicationsD1(await getArray('postulaciones_trabajo'));
      await syncContractsD1(await getArray('contrataciones'));
      await upsertSetting('migration_completed',{at:isoNow(),version:'V7'});
      await audit('kv_to_d1_migration','system','migration',{ok:true});
      return json({success:true,message:'Migración KV → D1 completada para los registros soportados'});
    }

    if (path === '/api/v7/ai/normalize' && request.method === 'POST') {
      if (!isAdmin()) return json({error:'No autorizado'},401);
      const body=await request.json().catch(()=>({})); const type=String(body.type||'artist'); const input=body.input; if(!input)return json({error:'Input requerido'},400);
      const prompt=`Sos el asistente interno de ★ UADAV STREAM. Analizá únicamente los datos proporcionados. No inventes datos. Devolvé JSON según el esquema. No tomes decisiones sindicales ni financieras. Tipo: ${type}. Datos: ${JSON.stringify(input).slice(0,18000)}`;
      const schema=aiSchemaFor(type); let result=await callGemini(prompt,schema); let provider='gemini'; if(!result){result=await callGroq(prompt,schema);provider='groq';}
      if(!result)return json({error:'No hay proveedor de IA disponible o la solicitud fue rechazada'},503);
      return json({success:true,provider,result});
    }

    if (path === '/api/v7/ai/assistant' && request.method === 'POST') {
      if (!isAdmin()) return json({error:'No autorizado'},401);
      const body=await request.json().catch(()=>({})); const q=String(body.question||'').trim(); if(!q)return json({error:'Pregunta requerida'},400);
      const answerSchema={type:'object',additionalProperties:false,properties:{respuesta:{type:'string'},filtros_sugeridos:{type:'array',items:{type:'string'}},riesgos:{type:'array',items:{type:'string'}},accion_sugerida:{type:'string'}},required:['respuesta','filtros_sugeridos','riesgos','accion_sugerida']};
      const prompt=`Sos ★ UADAV STREAM Asistente Administrativo. Respondé sobre la consulta usando SOLO el contexto enviado. No afirmes datos no presentes. No ejecutes acciones. Consulta: ${q}. Contexto: ${JSON.stringify(body.context||{}).slice(0,18000)}`;
      let result=await callGemini(prompt,answerSchema); let provider='gemini'; if(!result){result=await callGroq(prompt,answerSchema);provider='groq';} if(!result)return json({error:'IA no disponible'},503); return json({success:true,provider,result});
    }

    if (path === '/api/v7/notify' && request.method === 'POST') {
      if (!isAdmin()) return json({error:'No autorizado'},401);
      const body=await request.json().catch(()=>({})); if(!body.event)return json({error:'Evento requerido'},400); const item=await emitNotification(body); return json({success:true,item});
    }

    if (path === '/api/v7/export' && request.method === 'GET') {
      if (!isAdmin()) return json({error:'No autorizado'},401);
      if (!hasD1()) return json({error:'D1 no configurado'},503);
      const tables=['sources','artists','producers','events','radios','jobs','job_applications','contracts','campaigns','notifications','audit_log','settings']; const out={generated_at:isoNow(),tables:{}};
      for(const t of tables){const r=await env.DB.prepare(`SELECT * FROM ${t}`).all();out.tables[t]=r.results||[];}
      return json(out);
    }

    if (path === '/api/admin_check') {
      if (isAdmin()) return json({ success: true, role: 'admin_nacional', platform: 'UADAVSTREAM' });
      const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
      const delegaciones = await getObject('delegaciones');
      if (token && delegaciones[token]) return json({ success: true, role: 'admin_provincial', provincia: delegaciones[token], platform: 'UADAVSTREAM' });
      return json({ success: false, error: 'No autorizado' }, 401);
    }

    if (path === '/admin' || path === '/admin.html') {
      if (!isAdmin()) return text('Acceso denegado', 403);
      const html = await env.UADAV_DB.get('admin_html');
      return html ? new Response(html, { headers: { ...cors, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }) : text('admin_html no encontrado', 404);
    }

    if (path === '/api/visits') {
      const counters = await getObject('contadores');
      if (request.method === 'GET') return json(counters);
      if (request.method === 'POST') {
        counters.visitas_totales = Number(counters.visitas_totales || 0) + 1;
        await putJSON('contadores', counters);
        return json(counters);
      }
      return json({ error: 'Método no permitido' }, 405);
    }


    // ============================================================
    // COMPATIBILIDAD PÚBLICA / ADMIN — V6.4.2 CANDIDATE
    // Mantiene V6.4.1 compatible y completa endpoints usados por
    // el Admin/Home actuales sin cambiar la arquitectura KV.
    // ============================================================
    if (path === '/api/metrics/event' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const type = String(body?.type || body?.evento || 'event').slice(0, 60).replace(/[^A-Za-z0-9_.-]/g, '_');
      const day = new Date().toISOString().slice(0, 10);
      const key = `metrics_${day}`;
      const data = await getObject(key);
      data.fecha = day;
      data.total = Number(data.total || 0) + 1;
      data.by_type = data.by_type || {};
      data.by_type[type] = Number(data.by_type[type] || 0) + 1;
      await env.UADAV_DB.put(key, JSON.stringify(data), { expirationTtl: 90 * 86400 });
      return json({ success: true });
    }

    if (path === '/api/suscriptores') {
      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const email = String(body?.email || '').trim().toLowerCase().slice(0, 160);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Email inválido' }, 400);
        const list = await getArray('suscriptores');
        const found = list.find(x => String(x?.email || '').toLowerCase() === email);
        if (!found) list.push({ email, fecha: new Date().toISOString(), origen: String(body?.origen || 'uadavstream').slice(0, 60) });
        await putJSON('suscriptores', list.slice(-5000));
        return json({ success: true, already: !!found });
      }
      if (request.method === 'GET') {
        if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
        return json(await getArray('suscriptores'));
      }
      return json({ error: 'Método no permitido' }, 405);
    }

    if (path === '/api/analytics/config') {
      if (request.method === 'GET') return json(await getObject('analytics_config'));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      await env.UADAV_DB.put('analytics_config', await request.text());
      return json({ success: true });
    }

    if (path === '/api/secciones_version' && request.method === 'GET') {
      return json(await getObject('secciones_version', { version: '1', updated: null }));
    }

    if (path === '/api/eventos') {
      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const item = {
          id:'EV-'+Date.now().toString(36).toUpperCase(), nombre:String(body?.nombre||body?.titulo||'Evento').slice(0,180), titulo:String(body?.titulo||body?.nombre||'Evento').slice(0,180), categoria:String(body?.categoria||body?.category||'Eventos').slice(0,80), fecha:String(body?.fecha||'').slice(0,80), fecha_inicio:String(body?.fecha_inicio||body?.fecha||'').slice(0,80), fecha_fin:String(body?.fecha_fin||'').slice(0,80), lugar:String(body?.lugar||'').slice(0,180), direccion:String(body?.direccion||'').slice(0,220), ciudad:String(body?.ciudad||'').slice(0,120), provincia:String(body?.provincia||'').slice(0,120), pais:String(body?.pais||'Argentina').slice(0,80), imagen:String(body?.imagen||body?.poster||'').slice(0,500), trailer:String(body?.trailer||body?.youtube_id||'').slice(0,500), youtube_id:String(body?.youtube_id||body?.trailer||'').slice(0,80), precio:String(body?.precio||body?.precio_desde||'').slice(0,80), es_gratuito:body?.es_gratuito===true, link_compra:String(body?.link_compra||body?.link_ticketera||'').slice(0,500), descripcion:String(body?.descripcion||'').slice(0,2500), contacto_email:String(body?.contacto_email||body?.email||'').slice(0,160), contacto:String(body?.contacto||body?.whatsapp||'').slice(0,200), creado_por:String(body?.creado_por||'publico').slice(0,40), estado:'pending', destacado_solicitado:body?.destacado_solicitado===true, destacado_pagado:false, destacado_estado:body?.destacado_solicitado===true?'pendiente_revision':'no_solicitado', pago_referencia:String(body?.pago_referencia||'').slice(0,160), fecha_creacion:new Date().toISOString()
        };
        if (item.destacado_solicitado===true) {
          const list=await getArray('eventos_pendientes'); list.push(item); await putJSON('eventos_pendientes',list.slice(-1000));
          await emitNotification({event:'featured_requested',template:'event_featured_requested',to:item.contacto_email||'',subject:'Solicitud de destacado recibida · ★ UADAV STREAM',payload:{id:item.id,titulo:item.titulo,fecha:item.fecha,lugar:item.lugar}});
          return json({success:true,id:item.id,item,mode:'review_featured'});
        }
        item.estado='published'; item.publicado_en=isoNow();
        const pub=await getArray('eventos_publicados'); pub.push(item); await putJSON('eventos_publicados',pub.slice(-2000));
        const cat=await getArray('cartelera_aprobada'); cat.push(item); await putJSON('cartelera_aprobada',cat.slice(-2000));
        await syncEventsD1([item]);
        await emitNotification({event:'event_published',template:'event_published',to:item.contacto_email||'',subject:'Tu evento ya está publicado · ★ UADAV STREAM',payload:{id:item.id,titulo:item.titulo,fecha:item.fecha,lugar:item.lugar}});
        return json({success:true,id:item.id,item,mode:'auto_published'});
      }
      if (request.method === 'GET') { if(!isAdmin())return json({error:'No autorizado'},401); return json(await getArray('eventos_pendientes')); }
      if (request.method === 'PUT') {
        if(!isAdmin())return json({error:'No autorizado'},401); const body=await request.json().catch(()=>({})); const list=await getArray('eventos_pendientes'); const i=list.findIndex(x=>String(x?.id)===String(body?.id)); if(i<0)return json({error:'Evento no encontrado'},404); const item={...list[i]};
        if(body?.action==='approve'){ item.estado='published'; item.publicado_en=new Date().toISOString(); const pub=await getArray('eventos_publicados'); const pi=pub.findIndex(x=>String(x.id)===String(item.id)); if(pi>=0)pub[pi]=item;else pub.push(item); await putJSON('eventos_publicados',pub); const cat=await getArray('cartelera_aprobada'); const ci=cat.findIndex(x=>String(x.id)===String(item.id)); if(ci>=0)cat[ci]=item;else cat.push(item); await putJSON('cartelera_aprobada',cat); list.splice(i,1); await putJSON('eventos_pendientes',list); return json({success:true,item});}
        if(body?.action==='reject'){ item.estado='rejected'; item.rechazado_en=new Date().toISOString(); list.splice(i,1); await putJSON('eventos_pendientes',list); const rej=await getArray('eventos_rechazados'); rej.push(item); await putJSON('eventos_rechazados',rej.slice(-1000)); return json({success:true,item});}
        if(body?.action==='feature_paid'){ const paid=body?.destacado_pagado===true; item.destacado_pagado=paid; item.destacado_estado=paid?'pagado':'cancelado'; item.destacado_desde=paid?new Date().toISOString():null; item.destacado_hasta=String(body?.destacado_hasta||'').slice(0,40); const pub=await getArray('eventos_publicados'); const pi=pub.findIndex(x=>String(x.id)===String(item.id)); if(pi>=0)pub[pi]={...pub[pi],...item}; await putJSON('eventos_publicados',pub); const cat=await getArray('cartelera_aprobada'); const ci=cat.findIndex(x=>String(x.id)===String(item.id)); if(ci>=0)cat[ci]={...cat[ci],...item}; await putJSON('cartelera_aprobada',cat); return json({success:true,item});}
        return json({error:'Acción no reconocida'},400);
      }
      return json({error:'Método no permitido'},405);
    }

    async function eventsFromD1(filters={}) {
      if(!hasD1()) return null;
      try {
      const where=[`lower(COALESCE(status,'published'))='published'`]; const binds=[];
      const q=normalizeSearchText(filters.q); const category=normalizeSearchText(filters.category); const city=normalizeSearchText(filters.city); const country=normalizeSearchText(filters.country);
      if(q){const v=`%${q}%`; where.push(`(lower(title) LIKE ? OR lower(COALESCE(venue,'')) LIKE ? OR lower(COALESCE(city,'')) LIKE ? OR lower(COALESCE(province,'')) LIKE ? OR lower(COALESCE(country,'')) LIKE ? OR lower(COALESCE(category,'')) LIKE ?)`); binds.push(v,v,v,v,v,v);}
      if(category){where.push(`lower(COALESCE(category,'')) LIKE ?`);binds.push(`%${category}%`);}
      if(city){where.push(`lower(COALESCE(city,''))=?`);binds.push(city);}
      if(country){where.push(`lower(COALESCE(country,''))=?`);binds.push(country);}
      if(filters.from){where.push(`substr(COALESCE(start_date,''),1,10)>=?`);binds.push(filters.from);}
      if(filters.to){where.push(`substr(COALESCE(start_date,''),1,10)<=?`);binds.push(filters.to);}
      if(filters.featured==='true')where.push(`featured=1`);
      const r=await env.DB.prepare(`SELECT * FROM events WHERE ${where.join(' AND ')} ORDER BY featured DESC, start_date ASC LIMIT 1000`).bind(...binds).all();
      return (r.results||[]).map(x=>({...safeJSON(x.data_json,{}),id:x.id,titulo:x.title||'Evento',nombre:x.title||'Evento',categoria:x.category||'',ciudad:x.city||'',provincia:x.province||'',pais:x.country||'Argentina',lugar:x.venue||'',fecha_inicio:x.start_date||'',fecha_fin:x.end_date||'',estado:x.status||'published',destacado_pagado:Boolean(x.featured),destacado_estado:x.payment_status||''}));
      } catch (_) {
        return null;
      }
    }

    if (path === '/api/cartelera') {
      const key='cartelera_aprobada';
      if(request.method==='GET') {
        let items=await eventsFromD1({q:url.searchParams.get('q'),category:url.searchParams.get('category'),city:url.searchParams.get('city'),country:url.searchParams.get('country'),from:String(url.searchParams.get('from')||''),to:String(url.searchParams.get('to')||''),featured:url.searchParams.get('featured')}) || await getArray(key);
        const q=normalizeSearchText(url.searchParams.get('q'));
        const category=normalizeSearchText(url.searchParams.get('category'));
        const city=normalizeSearchText(url.searchParams.get('city'));
        const country=normalizeSearchText(url.searchParams.get('country'));
        const from=String(url.searchParams.get('from')||'').trim();
        const to=String(url.searchParams.get('to')||'').trim();
        const when=normalizeSearchText(url.searchParams.get('when'));
        const free=url.searchParams.get('free');
        const featured=url.searchParams.get('featured');
        const today=new Date(); const todayStr=today.toISOString().slice(0,10);
        const endWeek=new Date(today); endWeek.setDate(today.getDate() + (7 - today.getDay() || 7)); const weekStr=endWeek.toISOString().slice(0,10);
        const endMonth=new Date(today.getFullYear(),today.getMonth()+1,0).toISOString().slice(0,10);
        items=items.filter(e=>{
          if(String(e.estado||'published')!=='published') return false;
          const text=normalizeSearchText([e.titulo,e.nombre,e.descripcion,e.lugar,e.ciudad,e.provincia,e.pais,e.categoria].join(' '));
          const start=String(e.fecha_inicio||e.fecha||'').slice(0,10);
          if(q && !text.includes(q)) return false;
          if(category && normalizeSearchText(e.categoria)!==category) return false;
          if(city && normalizeSearchText(e.ciudad)!==city) return false;
          if(country && normalizeSearchText(e.pais)!==country) return false;
          if(from && start && start<from) return false; if(to && start && start>to) return false;
          if(when==='hoy' && start!==todayStr) return false;
          if(when==='manana'){ const d=new Date(today); d.setDate(today.getDate()+1); if(start!==d.toISOString().slice(0,10)) return false; }
          if(when==='esta-semana' && start>weekStr) return false;
          if(when==='este-mes' && start>endMonth) return false;
          if(free==='true' && !(e.es_gratuito===true || normalizeSearchText(e.precio)==='gratis')) return false;
          if(free==='false' && (e.es_gratuito===true || normalizeSearchText(e.precio)==='gratis')) return false;
          if(featured==='true' && e.destacado_pagado!==true) return false;
          return true;
        });
        items.sort((a,b)=>Number(b.destacado_pagado===true)-Number(a.destacado_pagado===true) || String(a.fecha_inicio||a.fecha||'').localeCompare(String(b.fecha_inicio||b.fecha||'')));
        return json(items.slice(0,500));
      }
      if(!isAdmin())return json({error:'No autorizado'},401);
      if(request.method==='POST'){const b=await request.json().catch(()=>({})); if(!b.titulo||!b.fecha||!b.lugar)return json({error:'Título, fecha y lugar son obligatorios'},400); const list=await getArray(key); const item={id:'SHOW-'+Date.now().toString(36).toUpperCase(),titulo:String(b.titulo).slice(0,180),fecha:String(b.fecha).slice(0,80),lugar:String(b.lugar).slice(0,180),artista_id:String(b.artista_id||'').slice(0,120),precio_desde:b.precio_desde??'',link_ticketera:String(b.link_ticketera||'').slice(0,500),poster:String(b.poster||b.imagen||'').slice(0,500),descripcion:String(b.descripcion||'').slice(0,2500),estado:'published',creado_por:'admin',destacado_pagado:b.destacado_pagado===true,fecha_creacion:new Date().toISOString()}; list.push(item); await putJSON(key,list); return json({success:true,item});}
      if(request.method==='PUT'){const b=await request.json().catch(()=>({})); const list=await getArray(key); const i=list.findIndex(x=>String(x.id)===String(b.id)); if(i<0)return json({error:'Show no encontrado'},404); list[i]={...list[i],...b,id:list[i].id}; await putJSON(key,list); return json({success:true,item:list[i]});}
      if(request.method==='DELETE'){const b=await request.json().catch(()=>({})); const list=await getArray(key); await putJSON(key,list.filter(x=>String(x.id)!==String(b.id))); return json({success:true});}
    }

    if (path === '/api/cartelera_aprobada' || path === '/api/eventos_publicados') {
      const key=path==='/api/eventos_publicados'?'eventos_publicados':'cartelera_aprobada'; if(request.method==='GET')return json(await getArray(key)); if(!isAdmin())return json({error:'No autorizado'},401);
      if(request.method==='POST'||request.method==='PUT'){await env.UADAV_DB.put(key,await request.text());return json({success:true});}
      if(request.method==='DELETE'){const b=await request.json().catch(()=>({}));const list=await getArray(key);await putJSON(key,list.filter(x=>String(x.id)!==String(b.id)));return json({success:true});}
      return json({error:'Método no permitido'},405);
    }

    if (path === '/api/evento' && request.method === 'GET') {
      const id=String(url.searchParams.get('id')||'').trim(); if(!id)return json({error:'ID requerido'},400);
      if(hasD1()){
        try{
          const r=await env.DB.prepare(`SELECT * FROM events WHERE id=? AND lower(COALESCE(status,'published'))='published' LIMIT 1`).bind(id).first();
          if(r) return json({...safeJSON(r.data_json,{}),id:r.id,titulo:r.title||'Evento',nombre:r.title||'Evento',categoria:r.category||'',ciudad:r.city||'',provincia:r.province||'',pais:r.country||'Argentina',lugar:r.venue||'',fecha_inicio:r.start_date||'',fecha_fin:r.end_date||'',estado:r.status||'published',destacado_pagado:Boolean(r.featured),destacado_estado:r.payment_status||''});
        }catch(_){ }
      }
      const all=[...(await getArray('eventos_publicados')),...(await getArray('cartelera_aprobada'))];
      const item=all.find(x=>String(x.id)===id && String(x.estado||'published')==='published');
      return item?json(item):json({error:'Evento no encontrado'},404);
    }

    if (path === '/api/admin/youtube-provider') {
      if(!isAdmin()) return json({error:'No autorizado'},401);
      if(request.method==='GET'){ return json({enabled:await youtubeApiEnabled(), key_present:!!env.YOUTUBE_API_KEY, mode:(await youtubeApiEnabled())?'invidious-then-youtube':'invidious-only'}); }
      if(request.method==='POST'){ const b=await request.json().catch(()=>({})); const enabled=b.enabled===true && !!env.YOUTUBE_API_KEY; await putJSON('youtube_api_enabled',enabled); await upsertSetting('youtube_api_enabled',enabled); await audit('set_youtube_api_enabled','platform','youtube_api',{enabled}); return json({success:true,enabled,key_present:!!env.YOUTUBE_API_KEY,mode:enabled?'invidious-then-youtube':'invidious-only'}); }
      return json({error:'Método no permitido'},405);
    }

    if (path === '/api/prospecting/config' && request.method === 'GET') {
      const cfg = hasD1() ? await getJSON('prospecting_config', {enabled:false}) : await getObject('prospecting_config');
      return json(cfg || {enabled:false});
    }

    if (path === '/api/admin/prospecting/config') {
      if(!isAdmin())return json({error:'No autorizado'},401);
      if(request.method==='GET') return json(await getObject('prospecting_config',{enabled:false,public_button:false,default_country:'Argentina'}));
      if(request.method==='POST'){const b=await request.json().catch(()=>({})); const cfg={enabled:b.enabled!==false,public_button:b.public_button===true,default_country:'Argentina',default_category:String(b.default_category||'all')}; await putJSON('prospecting_config',cfg); await upsertSetting('prospecting_config',cfg); return json({success:true,cfg});}
    }

    if (path === '/api/admin/prospecting/restrictions') {
      if(!isAdmin())return json({error:'No autorizado'},401);
      if(request.method==='GET'){
        if(hasD1()){try{const r=await env.DB.prepare(`SELECT * FROM search_restrictions ORDER BY created_at DESC`).all();return json(r.results||[]);}catch(_){} }
        return json(await getArray('search_restrictions'));
      }
      if(request.method==='POST'){
        const b=await request.json().catch(()=>({})); const item={id:makeId('RST'),kind:String(b.kind||'term').slice(0,30),value:String(b.value||'').slice(0,180),active:b.active!==false,reason:String(b.reason||'').slice(0,300),created_at:isoNow(),updated_at:isoNow()}; if(!item.value)return json({error:'Valor requerido'},400);
        if(hasD1()) await env.DB.prepare(`INSERT INTO search_restrictions(id,kind,value,active,reason,created_at,updated_at) VALUES(?,?,?,?,?,?,?)`).bind(item.id,item.kind,item.value,item.active?1:0,item.reason,item.created_at,item.updated_at).run();
        else {const list=await getArray('search_restrictions'); list.push(item); await putJSON('search_restrictions',list);}
        await audit('create_search_restriction','search_restriction',item.id,item); return json({success:true,item});
      }
      if(request.method==='DELETE'){
        const id=String(url.searchParams.get('id')||''); if(!id)return json({error:'ID requerido'},400); if(hasD1()) await env.DB.prepare(`DELETE FROM search_restrictions WHERE id=?`).bind(id).run(); else await putJSON('search_restrictions',(await getArray('search_restrictions')).filter(x=>String(x.id)!==id)); await audit('delete_search_restriction','search_restriction',id); return json({success:true});
      }
    }

    if (path === '/api/admin/prospecting/search' && request.method === 'GET') {
      if(!isAdmin())return json({error:'No autorizado'},401);
      const key=String(url.searchParams.get('category')||'all').trim().toLowerCase();
      const q=String(url.searchParams.get('q')||prospectingQueries[key]||prospectingQueries.all).trim();
      const type=String(url.searchParams.get('type')||'channel,video').trim();
      const limit=Math.min(25,Math.max(5,Number(url.searchParams.get('limit')||20)));
      const ytEnabled=await youtubeApiEnabled();
      const run={id:makeId('PR'),country:'Argentina',region:String(url.searchParams.get('region')||''),category:key,query:q,resource_type:type,provider:ytEnabled?'invidious+youtube':'invidious',status:'running',result_count:0,created_at:isoNow()};
      if(hasD1()) await env.DB.prepare(`INSERT INTO prospecting_runs(id,country,region,category,query,resource_type,provider,status,result_count,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(run.id,run.country,run.region,run.category,run.query,run.resource_type,run.provider,run.status,0,run.created_at).run();
      const restrictions=await getSearchRestrictions();
      const raw=[];
      // Invidious is ALWAYS first. The official YouTube API is only the last fallback.
      const ivVideo=await invidiousSearch(q,'video',limit);
      const ivChannel=type.includes('channel')?await invidiousSearch(q,'channel',Math.min(10,limit)):[];
      for(const x of ivVideo) raw.push({...x,__source:'invidious'});
      for(const x of ivChannel) raw.push({...x,__source:'invidious'});

      // Spend official quota only when Invidious did not provide enough usable candidates.
      if(raw.length < Math.min(5,limit) && ytEnabled && env.YOUTUBE_API_KEY){
        try{
          const params=new URLSearchParams({part:'snippet',maxResults:String(limit),q:q,type:'video',regionCode:'AR',order:'relevance',key:env.YOUTUBE_API_KEY});
          const res=await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
          const data=await res.json();
          if(res.ok&&!data?.error) raw.push(...(Array.isArray(data.items)?data.items.map(x=>({...x,__source:'youtube'})):[]));
        }catch(_){ }
        if(type.includes('channel')){
          try{
            const params=new URLSearchParams({part:'snippet',maxResults:String(Math.min(10,limit)),q:q,type:'channel',regionCode:'AR',order:'relevance',key:env.YOUTUBE_API_KEY});
            const res=await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
            const data=await res.json();
            if(res.ok&&!data?.error) raw.push(...(Array.isArray(data.items)?data.items.map(x=>({...x,__source:'youtube'})):[]));
          }catch(_){ }
        }
      }
      const seen=new Set();
      const results=raw.map(x=>{
        const ytChannel=!!x.id?.channelId;
        const isInvidious=String(x.__source||'')==='invidious';
        const isChannel=isInvidious ? String(x.type||'')==='channel' || !!x.authorId && !x.videoId : ytChannel;
        const external=isChannel ? String(x.id?.channelId||x.authorId||x.channelId||x.ucid||x.id||'') : String(x.id?.videoId||x.videoId||'');
        const title=isChannel ? String(x.snippet?.title||x.author||x.title||'') : String(x.snippet?.title||x.title||'');
        const channelName=String(x.snippet?.channelTitle||x.author||x.channel_name||title);
        const thumbnail=String(x.snippet?.thumbnails?.high?.url||x.snippet?.thumbnails?.medium?.url||x.snippet?.thumbnails?.default?.url||x.videoThumbnails?.find?.(t=>t.quality==='medium')?.url||x.videoThumbnails?.[0]?.url||x.authorThumbnails?.[0]?.url||'');
        const item={id:makeId('PRES'),run_id:run.id,resource_type:isChannel?'channel':'video',external_id:external,title,channel_name:channelName,category:categoryLabel(key),country:'Argentina',thumbnail,url:isChannel?`https://www.youtube.com/channel/${external}`:`https://www.youtube.com/watch?v=${external}`,status:'candidate',source:isInvidious?'invidious':'youtube',raw_json:x,created_at:isoNow(),updated_at:isoNow()};
        return item;
      }).filter(x=>x.external_id && !restrictedProspect(x,restrictions)).filter(x=>{const k=x.resource_type+':'+x.external_id;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,limit);
      run.status='completed'; run.result_count=results.length;
      if(hasD1()){
        for(let i=0;i<results.length;i+=40){const chunk=results.slice(i,i+40).map(r=>env.DB.prepare(`INSERT INTO prospecting_results(id,run_id,resource_type,external_id,title,channel_name,category,city,province,country,thumbnail,url,status,raw_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(r.id,r.run_id,r.resource_type,r.external_id,r.title,r.channel_name,r.category,'','',r.country,r.thumbnail,r.url,r.status,JSON.stringify(r.raw_json),r.created_at,r.updated_at)); await env.DB.batch(chunk);} await env.DB.prepare(`UPDATE prospecting_runs SET status=?,result_count=? WHERE id=?`).bind(run.status,run.result_count,run.id).run();
      } else { await putJSON('prospecting_last_run',{...run,results}); }
      await audit('prospecting_search','prospecting_run',run.id,{query:q,category:key,count:results.length,providers:ytEnabled?['invidious','youtube']:['invidious']});
      return json({success:true,run,results,providers:{youtube:ytEnabled && !!env.YOUTUBE_API_KEY,invidious:true}});
    }

    if (path === '/api/admin/d1/status' && request.method === 'GET') {
      if(!isAdmin())return json({error:'No autorizado'},401); if(!hasD1())return json({configured:false,reason:'D1 no configurado'});
      try{const r=await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`).all(); return json({configured:true,tables:r.results||[]});}catch(e){return json({configured:true,error:String(e?.message||e)},500)}
    }

    if (path === '/api/admin/d1/init' && request.method === 'POST') {
      if(!isAdmin())return json({error:'No autorizado'},401); if(!hasD1())return json({error:'D1 no configurado en el Worker'},503);
      try{const out=await env.DB.exec(D1_BOOTSTRAP_SQL); await audit('d1_bootstrap','database','DB',{queries:out?.count||0}); return json({success:true,queries:out?.count||0});}catch(e){return json({error:String(e?.message||e)},500)}
    }

    if (path === '/api/premium/revoke' && request.method === 'POST') {
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      const body = await request.json().catch(() => ({}));
      const code = String(body?.code || '').trim().toUpperCase();
      if (!code) return json({ error: 'Código requerido' }, 400);
      const list = await getArray('premium_codes');
      const i = list.findIndex(x => String(x?.code || '').toUpperCase() === code);
      if (i < 0) return json({ error: 'Código no encontrado' }, 404);
      list[i].activo = false;
      list[i].revocado = new Date().toISOString();
      await putJSON('premium_codes', list);
      return json({ success: true, item: list[i] });
    }

    if (path === '/api/admin/stats' && request.method === 'GET') {
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      const days = Math.max(1, Math.min(31, Number(url.searchParams.get('days') || 7)));
      const counters = await getObject('contadores');
      const byType = {};
      let total = 0;
      for (let i = 0; i < days; i++) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        const m = await getObject(`metrics_${d}`);
        total += Number(m?.total || 0);
        for (const [k,v] of Object.entries(m?.by_type || {})) byType[k] = Number(byType[k] || 0) + Number(v || 0);
      }
      const radios = await getArray('radios');
      const artists = await getArray('artistas');
      const events = await getArray('eventos_publicados');
      return json({
        days, visits: Number(counters?.visitas_totales || 0), events: total,
        by_type: byType, radios: radios.length, artists: artists.length, eventos_publicados: events.length
      });
    }

    if (path === '/api/admin/audit-log' && request.method === 'GET') {
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      return json((await getArray('audit_log')).slice(-100).reverse());
    }

    if (path === '/api/admin/rights-export' && request.method === 'GET') {
      if (!isAdmin()) return text('No autorizado', 401);
      const month = String(url.searchParams.get('month') || new Date().toISOString().slice(0,7));
      const arr = await getArray('artistas');
      const rows = [['month','artist_id','artist','sadaic','aadi','capif','estado','actualizado']];
      for (const a of arr) {
        const p = publicArtistFromItem(a);
        const r = a?.derechos_gremiales || {};
        rows.push([month,p.id||'',p.nombre||'',r.sadaic||'',r.aadi||'',r.capif||'',r.estado||'',r.actualizado||'']);
      }
      const csv = rows.map(row => row.map(v => '"' + String(v ?? '').replace(/"/g,'""') + '"').join(',')).join('\n');
      return new Response(csv, {status:200, headers:{...cors,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="uadav-rights-${month}.csv"`}});
    }

    if (path === '/api/admin/artist-sanctions') {
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      if (request.method === 'GET') return json(await getArray('artist_sanctions'));
      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const list = await getArray('artist_sanctions');
        list.push({ id:'SAN-'+Date.now().toString(36), ...body, fecha:new Date().toISOString() });
        await putJSON('artist_sanctions', list.slice(-2000));
        return json({ success:true });
      }
    }

    if (path === '/api/admin/importar-canal' && request.method === 'POST') {
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      try {
        const body = await request.json().catch(() => ({}));
        const channelId = String(body?.channel_id || '').trim();
        if (!channelId) return json({ error: 'channel_id requerido' }, 400);
        let meta = await invidiousChannelInfo(channelId);
        if (!meta && await youtubeApiEnabled() && env.YOUTUBE_API_KEY) {
          const qs = new URLSearchParams({part:'snippet,brandingSettings',id:channelId,key:env.YOUTUBE_API_KEY});
          const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${qs.toString()}`);
          const data = await res.json();
          const ch = data?.items?.[0];
          if (ch) meta = {channelId,nombre:ch.snippet?.title||'Artista',thumbnail:ch.snippet?.thumbnails?.high?.url||ch.snippet?.thumbnails?.medium?.url||'',bio:ch.snippet?.description||'',source:'youtube_api'};
        }
        if (!meta) return json({error:'Canal no encontrado mediante Invidious ni mediante el fallback oficial de YouTube.'},404);
        const artista = {
          id:'ART-'+channelId,
          tipo:'artista',
          nombre:meta.nombre || 'Artista',
          nombre_artistico:meta.nombre || 'Artista',
          rubro:'Artista de variedades',
          foto:meta.thumbnail || '',
          bio:meta.bio || '',
          canal:channelId,
          youtube_id:channelId,
          youtube_bio:meta.bio || '',
          visible:false,
          estado:'catalogo',
          afiliado_verificado:false,
          actualizado:new Date().toISOString()
        };
        const arr = await getArray('artistas');
        const i = arr.findIndex(x => String(x?.canal || x?.youtube_id || '') === channelId);
        if(i>=0) arr[i] = {...arr[i], ...artista}; else arr.push(artista);
        await putJSON('artistas',arr);
        if (hasD1()) await syncArtistsD1(arr);
        await audit('import_channel','artist',artista.id,{channelId,source:meta.source||'unknown'});
        return json({ success:true, artista:publicArtistFromItem(artista), source:meta.source||'unknown' });
      } catch(e) {
        return json({ error:String(e?.message || e) },502);
      }
    }

    if (path === '/api/apariencia') {
      if (request.method === 'GET') return json(await getObject('apariencia'));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      await env.UADAV_DB.put('apariencia', await request.text());
      return json({ success: true });
    }

    if (path === '/api/config' || path === '/api/config_global') {
      if (request.method === 'GET') return json(await getObject('config_global'));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      const body = await request.text();
      await env.UADAV_DB.put('config_global', body);
      return json({ success: true });
    }

    if (path === '/api/secciones') {
      if (request.method === 'GET') return json(await getArray('secciones'));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      const raw = await request.text();
      await env.UADAV_DB.put('secciones', raw);
      try {
        const parsed = JSON.parse(raw);
        const artistSec = Array.isArray(parsed) ? parsed.find(x => x && x.id === 'artistas' && x.tipo_contenido === 'perfiles') : null;
        if (artistSec) {
          const existing = await getArray('artistas');
          const merged = Array.isArray(existing) ? [...existing] : [];
          const seen = new Map();
          merged.forEach((a,i) => { const p=publicArtistFromItem(a); const key=String(p.id||p.canal||p.nombre).trim().toLowerCase(); if(key)seen.set(key,i); });
          for (const item of Array.isArray(artistSec.items) ? artistSec.items : []) {
            const p=publicArtistFromItem(item); const key=String(p.id||p.canal||p.nombre).trim().toLowerCase(); if(!key)continue;
            const normalized={...item,id:item.id||p.id||('ART-'+Date.now().toString(36).toUpperCase()),nombre_artistico:item.nombre_artistico||item.nombre||p.nombre,nombre:item.nombre||item.nombre_artistico||p.nombre,visible:item.visible!==false,estado:item.estado||'catalogo',afiliado_verificado:item.afiliado_verificado===true};
            const pos=seen.get(key); if(pos===undefined){seen.set(key,merged.length);merged.push(normalized)} else merged[pos]={...merged[pos],...normalized};
          }
          await putJSON('artistas',merged);
        }
      } catch {}
      return json({ success: true });
    }

    if (path === '/api/banners') {
      if (request.method === 'GET') return json(await getObject('banners'));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      await env.UADAV_DB.put('banners', await request.text());
      return json({ success: true });
    }

    if (path === '/api/radios') {
      if (request.method === 'GET') {
        if (hasD1()) { try { const r=await env.DB.prepare(`SELECT * FROM radios WHERE lower(COALESCE(status,'active')) NOT IN ('hidden','oculto') ORDER BY featured DESC, updated_at DESC LIMIT 500`).all(); return json((r.results||[]).map(x=>({...safeJSON(x.data_json,{}),id:x.id,nombre:x.name||'Radio',ciudad:x.city||'',provincia:x.province||'',pais:x.country||'Argentina',destacada:Boolean(x.featured),pauta_status:x.pauta_status||'',estado:x.status||'active'}))); } catch(_){} }
        return json(await getArray('radios'));
      }
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      const raw=await request.text(); await env.UADAV_DB.put('radios', raw); await syncRadiosD1(safeJSON(raw,[])); await audit('update_radios','radios',null,{count:Array.isArray(safeJSON(raw,[]))?safeJSON(raw,[]).length:0}); return json({ success: true });
    }

    if (path === '/api/senales' || path === '/api/senales_oficiales') {
      if (request.method === 'GET') return json(await getArray('senales_oficiales'));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      await env.UADAV_DB.put('senales_oficiales', await request.text());
      return json({ success: true });
    }

    if (path === '/api/artistas_prospectos') {
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      if (request.method === 'GET') return json(await getArray('artistas_prospectos'));
      if (request.method === 'POST' || request.method === 'PUT') {
        const body = await request.json().catch(() => null);
        if (Array.isArray(body)) { await putJSON('artistas_prospectos', body); return json({ success: true, count: body.length }); }
        if (!body || !body.id) return json({ error: 'ID de prospecto requerido' }, 400);
        const list = await getArray('artistas_prospectos');
        const i = list.findIndex(x => String(x.id) === String(body.id));
        if (i >= 0) list[i] = { ...list[i], ...body, id: list[i].id }; else list.push(body);
        await putJSON('artistas_prospectos', list.slice(-2000));
        return json({ success: true, item: i >= 0 ? list[i] : body });
      }
      if (request.method === 'DELETE') { const b=await request.json().catch(()=>({})); const list=await getArray('artistas_prospectos'); await putJSON('artistas_prospectos',list.filter(x=>String(x.id)!==String(b.id))); return json({success:true}); }
      return json({ error: 'Método no permitido' },405);
    }

    if (path === '/api/artistas') {
      if (request.method === 'GET') { const arr=await allCanonicalArtists(); return json(isAdmin()?arr:arr.filter(x=>x&&publicArtistFromItem(x).visible!==false)); }
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      const body=await request.json().catch(()=>null); if(!Array.isArray(body))return json({error:'Se esperaba un arreglo de artistas'},400);
      await putJSON('artistas',body); await syncArtistsD1(body); await audit('replace_artists','artists',null,{count:body.length}); return json({success:true,count:body.length});
    }

    if (path === '/api/estado_sitio') {
      if (request.method === 'GET') return json(await getObject('estado_sitio'));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      await env.UADAV_DB.put('estado_sitio', await request.text());
      return json({ success: true });
    }

    if (path === '/api/web_visibility' || path === '/api/home_layout') {
      const key = path === '/api/home_layout' ? 'home_layout' : 'web_visibility';
      if (request.method === 'GET') return json(await getObject(key));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      await env.UADAV_DB.put(key, await request.text());
      return json({ success: true });
    }

    if (path === '/api/landing_config') {
      if (request.method === 'GET') return json(await getObject('landing_config'));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      await env.UADAV_DB.put('landing_config', await request.text());
      return json({ success: true });
    }

    if (path === '/api/footer_config') {
      if (request.method === 'GET') return json(await getObject('footer_config'));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      await env.UADAV_DB.put('footer_config', await request.text());
      return json({ success: true });
    }

    if (path === '/api/site_pages') {
      if (request.method === 'GET') return json(await getObject('site_pages', {}));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      await env.UADAV_DB.put('site_pages', await request.text());
      return json({ success: true });
    }

    if (path === '/api/chat' && request.method === 'GET') {
      const stream = String(url.searchParams.get('id_stream') || 'general');
      return json((await getArray(`chat_${stream}`)).slice(-50));
    }
    if (path === '/api/moderar_chat' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body?.mensaje) return json({ error: 'Mensaje vacío' }, 400);
      const stream = String(body.id_stream || 'general');
      const messages = await getArray(`chat_${stream}`);
      messages.push({ alias: String(body.alias || 'Espectador').slice(0, 40), mensaje: String(body.mensaje).slice(0, 1000), tipo: body.tipo || 'chat', fecha: new Date().toISOString(), moderado: false });
      while (messages.length > 50) messages.shift();
      await env.UADAV_DB.put(`chat_${stream}`, JSON.stringify(messages), { expirationTtl: 7200 });
      return json({ success: true, moderado: false, aprobado: true });
    }

    // --- YOUTUBE / DESCUBRIMIENTO REGIONAL ---
    if (path === '/api/youtube/trending') {
      const region = String(url.searchParams.get('region') || 'AR').toUpperCase().slice(0,2);
      const category = String(url.searchParams.get('category') || '').replace(/[^0-9]/g,'').slice(0,3);
      const limit = Math.max(5, Math.min(50, Number(url.searchParams.get('limit') || 25)));
      const cacheKey = `yt_popular_v631_${region}_${category || 'all'}_${limit}`;
      const cached = await env.UADAV_DB.get(cacheKey);
      if (cached) return new Response(cached, { headers: { ...cors, 'X-UADAV-Search-Source':'cache' } });
      // Invidious first so trending does not spend official YouTube quota.
      for (const base of INVIDIOUS_INSTANCES) {
        const controller = new AbortController(); const timer=setTimeout(()=>controller.abort(),5000);
        try {
          const u=new URL(base+'/api/v1/trending'); u.searchParams.set('region',region); u.searchParams.set('type',category?'music':'default'); u.searchParams.set('hl','es');
          const r=await fetch(u.toString(),{signal:controller.signal,headers:{Accept:'application/json','User-Agent':'UADAVSTREAM/7.4.2'}});
          if(!r.ok)continue; const arr=await r.json();
          if(Array.isArray(arr)&&arr.length){const items=arr.slice(0,limit).map(x=>({id:x.videoId||'',channel_id:x.authorId||'',channel_name:x.author||'',titulo:x.title||'',descripcion:x.description||'',thumbnail:x.videoThumbnails?.find?.(t=>t?.quality==='high')?.url||x.videoThumbnails?.[0]?.url||'',views:Number(x.viewCount||0),published_at:x.publishedText||'',category_id:category||''})).filter(x=>x.id); if(items.length){const payload={source:'invidious_trending',region,category:category||null,items};const out=JSON.stringify(payload);await env.UADAV_DB.put(cacheKey,out,{expirationTtl:1800});return new Response(out,{headers:{...cors,'X-UADAV-Search-Source':'invidious_trending'}});}}
        } catch {} finally {clearTimeout(timer)}
      }
      if (!(await youtubeApiEnabled()) || !env.YOUTUBE_API_KEY) return json({ items: [], source: 'invidious_only', region, category: category || null });
      try {
        const qs = new URLSearchParams({ part:'snippet,statistics', chart:'mostPopular', regionCode:region, maxResults:String(limit), key:env.YOUTUBE_API_KEY });
        if (category) qs.set('videoCategoryId', category);
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${qs.toString()}`);
        const data = await res.json();
        if (!res.ok || data.error) return json({ items: [], source:'youtube_error', region, category:category || null, error:String(data?.error?.message || `HTTP ${res.status}`) });
        const items = (data.items || []).map(x => ({
          id: x.id,
          channel_id: x.snippet?.channelId || '',
          channel_name: x.snippet?.channelTitle || '',
          titulo: x.snippet?.title || '',
          descripcion: x.snippet?.description || '',
          thumbnail: x.snippet?.thumbnails?.high?.url || x.snippet?.thumbnails?.medium?.url || x.snippet?.thumbnails?.default?.url || '',
          views: Number(x.statistics?.viewCount || 0),
          published_at: x.snippet?.publishedAt || '',
          category_id: x.snippet?.categoryId || category || ''
        })).filter(x => x.id);
        const payload = { source:'youtube_mostPopular', region, category:category || null, items };
        const out = JSON.stringify(payload);
        await env.UADAV_DB.put(cacheKey, out, { expirationTtl: 1800 });
        return new Response(out, { headers: { ...cors, 'X-UADAV-Search-Source':'youtube_mostPopular' } });
      } catch (e) {
        return json({ items: [], source:'youtube_exception', region, category:category || null, error:String(e?.message || e) });
      }
    }

    // --- YOUTUBE / BÚSQUEDA GLOBAL CON FALLBACK ---
    if (path === '/api/youtube/search') {
      const q = String(url.searchParams.get('q') || '').trim();
      if (!q) return json([]);
      const cacheKey = `search_v631_${q.toLowerCase().replace(/\s+/g, '_').slice(0, 120)}`;
      const cached = await env.UADAV_DB.get(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length) return new Response(cached, { headers: { ...cors, 'X-UADAV-Search-Source':'cache' } });
        } catch {}
      }

      // 1) Invidious first: zero official YouTube quota in normal operation.
      for (const base of INVIDIOUS_INSTANCES) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        try {
          const r = await fetch(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&page=1&hl=es`, {signal: controller.signal, headers: {Accept:'application/json','User-Agent':'UADAVSTREAM/7.4.2'}});
          if (!r.ok) continue;
          const raw = await r.json();
          const arr = Array.isArray(raw) ? raw : [];
          const items = arr.map(v => ({
            id:String(v.videoId||v.id||'').trim(),
            titulo:v.title||'Video',
            descripcion:v.author||v.authorId||'YouTube',
            thumbnail:v.videoThumbnails?.find?.(t=>t?.quality==='high')?.url||v.videoThumbnails?.find?.(t=>t?.quality==='medium')?.url||v.videoThumbnails?.[0]?.url||'',
            categoria:'Resultado',
            duracion:Number(v.lengthSeconds||0),
            tipo:'video'
          })).filter(x=>x.id);
          if(items.length){ await env.UADAV_DB.put(cacheKey,JSON.stringify(items),{expirationTtl:21600}); return new Response(JSON.stringify(items),{headers:{...cors,'X-UADAV-Search-Source':'invidious'}}); }
        } catch {} finally {clearTimeout(timer)}
      }

      // 2) Optional official YouTube API fallback — only when explicitly enabled.
      if (await youtubeApiEnabled() && env.YOUTUBE_API_KEY) {
        try {
          const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${encodeURIComponent(q)}&type=video&key=${env.YOUTUBE_API_KEY}`);
          const data = await res.json();
          if (res.ok && !data.error) {
            const items = (data.items || []).map(x => ({
              id: x.id?.videoId,
              titulo: x.snippet?.title || 'Video',
              descripcion: x.snippet?.channelTitle || 'YouTube',
              thumbnail: x.snippet?.thumbnails?.high?.url || x.snippet?.thumbnails?.medium?.url || x.snippet?.thumbnails?.default?.url || '',
              categoria: 'Resultado',
              tipo:'video'
            })).filter(x => x.id);
            if (items.length) {
              await env.UADAV_DB.put(cacheKey, JSON.stringify(items), { expirationTtl: 86400 });
              return new Response(JSON.stringify(items), { headers: { ...cors, 'X-UADAV-Search-Source':'youtube_api' } });
            }
          }
        } catch {}
      }

      return new Response('[]', { headers: { ...cors, 'X-UADAV-Search-Source':'none' } });
    }

    // --- CHANNEL INFO / INVIDIOUS FIRST ---
    if (path === '/api/youtube/channel_info') {
      const id=String(url.searchParams.get('id')||'').trim();
      const handle=String(url.searchParams.get('handle')||'').trim();
      let meta=null;
      if(id) meta=await invidiousChannelInfo(id);
      if(!meta && handle){ const found=await invidiousChannelSearch(handle); if(found) meta=await invidiousChannelInfo(found.channelId)||found; }
      if(meta){ return json(meta); }
      if(await youtubeApiEnabled() && env.YOUTUBE_API_KEY){
        try{
          const qs=new URLSearchParams({part:'snippet,brandingSettings',maxResults:'1',key:env.YOUTUBE_API_KEY});
          if(id) qs.set('id',id); else if(handle) { qs.set('forHandle',handle.replace(/^@/,'')); }
          const r=await fetch(`https://www.googleapis.com/youtube/v3/channels?${qs.toString()}`); const d=await r.json(); const ch=d?.items?.[0];
          if(ch){return json({channelId:ch.id,nombre:ch.snippet?.title||'Artista',thumbnail:ch.snippet?.thumbnails?.high?.url||ch.snippet?.thumbnails?.default?.url||'',bio:(ch.snippet?.description||'').slice(0,500),source:'youtube_api'});}
        }catch(e){}
      }
      return json({channelId:null,error:'Canal no encontrado mediante Invidious.'},404);
    }

    // --- YOUTUBE / RESOLVER CANAL ---
    if (path === '/api/youtube/search_channel') {
      const name = String(url.searchParams.get('name') || '').trim();
      if (!name) return json({ channelId:null });
      const cacheKey = `channel_search_v631_${name.toLowerCase().replace(/\s+/g,'_').slice(0,100)}`;
      const cached = await env.UADAV_DB.get(cacheKey);
      if (cached) return new Response(cached, { headers: { ...cors, 'X-UADAV-Search-Source':'cache' } });
      const iv=await invidiousChannelSearch(name);
      if(iv){ const out=JSON.stringify(iv); await env.UADAV_DB.put(cacheKey,out,{expirationTtl:604800}); return new Response(out,{headers:{...cors,'X-UADAV-Search-Source':'invidious'}}); }
      if (!await youtubeApiEnabled() || !env.YOUTUBE_API_KEY) return json({ channelId:null, error:'No se encontró el canal mediante Invidious y la API oficial está desactivada para proteger la cuota.' });
      try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(name)}&key=${env.YOUTUBE_API_KEY}`);
        const data = await res.json();
        const item = data?.items?.[0];
        if (!res.ok || !item) return json({ channelId:null });
        const out = JSON.stringify({ channelId:item.id?.channelId || '', nombre:item.snippet?.title || name, thumbnail:item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '', bio:(item.snippet?.description || '').slice(0,500), source:'youtube_api' });
        await env.UADAV_DB.put(cacheKey, out, { expirationTtl: 604800 });
        return new Response(out, { headers:{...cors,'X-UADAV-Search-Source':'youtube_api'} });
      } catch(e) { return json({ channelId:null, error:String(e?.message || e) }); }
    }

    // --- DIAGNÓSTICO DE BÚSQUEDA PARA ADMIN ---
    if (path === '/api/admin/search-diagnostic' && request.method === 'GET') {
      if (!isAdmin()) return json({ error:'No autorizado' },401);
      const q = String(url.searchParams.get('q') || 'prueba').trim();
      const result = { query:q, youtube_api_key:!!env.YOUTUBE_API_KEY, cache_key:`search_v631_${q.toLowerCase().replace(/\s+/g,'_').slice(0,120)}`, source:'none', count:0, status:'OK', checked_at:new Date().toISOString() };
      try {
        const cached = await env.UADAV_DB.get(result.cache_key);
        if (cached) { const arr=JSON.parse(cached); if(Array.isArray(arr)&&arr.length){ result.source='cache'; result.count=arr.length; return json(result); } }
      } catch {}
      for (const base of INVIDIOUS_INSTANCES) {
        const controller = new AbortController(); const timer=setTimeout(()=>controller.abort(),4000);
        try {
          const r=await fetch(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&page=1&hl=es`,{signal:controller.signal,headers:{Accept:'application/json','User-Agent':'UADAVSTREAM/7.4.2'}});
          if(!r.ok) continue; const arr=await r.json();
          if(Array.isArray(arr)&&arr.length){result.source='invidious';result.instance=base;result.count=Math.min(arr.length,24);return json(result);}
        } catch {} finally { clearTimeout(timer); }
      }
      if (await youtubeApiEnabled() && env.YOUTUBE_API_KEY) {
        try {
          const res=await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(q)}&type=video&key=${env.YOUTUBE_API_KEY}`);
          const data=await res.json();
          if(res.ok && !data.error && Array.isArray(data.items) && data.items.length){ result.source='youtube_api_fallback'; result.count=data.items.length; return json(result); }
          result.youtube_error=data?.error?.message || `HTTP ${res.status}`;
        } catch(e){ result.youtube_error=String(e?.message || e); }
      }
      result.status='ERROR';
      return json(result, 200);
    }

    // --- ARTISTAS / POSTULACIONES PÚBLICAS ---
    if (path === '/api/postulaciones_artista') {
      if (request.method === 'POST') {
        const b = await request.json().catch(() => ({}));
        if (!b.nombre || !b.email) return json({error:'Nombre y email son obligatorios'},400);
        const list = await getArray('postulaciones_artista');
        const item = { id:'ART-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase(), estado:'pendiente', creado:new Date().toISOString(), nombre:String(b.nombre).slice(0,100), rubro:String(b.rubro||'').slice(0,80), ciudad:String(b.ciudad||'').slice(0,100), email:String(b.email).slice(0,160), whatsapp:String(b.whatsapp||'').slice(0,50), youtube:String(b.youtube||'').slice(0,250), foto:String(b.foto||'').slice(0,500), bio:String(b.bio||'').slice(0,2000), terms_version:String(b.terms_version||'ARTIST-1.0').slice(0,40), terms_accepted:b.terms_accepted===true, terms_accepted_at:String(b.terms_accepted_at||''), terms_version:String(b.terms_version||'ARTIST-1.0').slice(0,40), terms_accepted:b.terms_accepted===true, terms_accepted_at:String(b.terms_accepted_at||'').slice(0,50) };
        list.push(item); while(list.length>500) list.shift(); await putJSON('postulaciones_artista',list); return json({success:true,id:item.id});
      }
      if (!isAdmin()) return json({error:'No autorizado'},401);
      const list=await getArray('postulaciones_artista');
      if(request.method==='GET') return json(list);
      if(request.method==='PUT'){
        const b=await request.json().catch(()=>({})); const i=list.findIndex(x=>String(x.id)===String(b.id)); if(i<0)return json({error:'No encontrado'},404);
        if(b.estado) list[i].estado=String(b.estado); list[i].revisado=new Date().toISOString(); await putJSON('postulaciones_artista',list); return json({success:true,item:list[i]});
      }
    }

    // --- BOLSA DE TRABAJO ---
    if (path === '/api/bolsa_trabajo') {
      const list=await getArray('bolsa_trabajo');
      if(request.method==='GET') return json(list.filter(x=>x&&x.activo!==false));
      if(request.method==='POST'){ const b=await request.json().catch(()=>({})); if(!b.titulo||!b.descripcion||!b.contacto)return json({error:'Título, descripción y contacto son obligatorios'},400); const item={id:'JOB-'+Date.now().toString(36).toUpperCase(),creado:new Date().toISOString(),creado_por:isAdmin()?'admin':'publico',titulo:String(b.titulo).slice(0,160),rubro:String(b.rubro||'').slice(0,80),ciudad:String(b.ciudad||'').slice(0,100),fecha:String(b.fecha||'').slice(0,30),descripcion:String(b.descripcion).slice(0,2500),contacto:String(b.contacto).slice(0,300),contacto_tipo:String(b.contacto_tipo||'').slice(0,30),activo:b.activo!==false}; list.push(item); while(list.length>2000)list.shift(); await putJSON('bolsa_trabajo',list); await syncJobsD1(list); await audit('create_job','job',item.id,{title:item.titulo}); return json({success:true,item}); }
      if(!isAdmin())return json({error:'No autorizado'},401);
      if(request.method==='PUT'){const b=await request.json().catch(()=>({}));const i=list.findIndex(x=>String(x.id)===String(b.id));if(i<0)return json({error:'No encontrado'},404);Object.assign(list[i],b,{id:list[i].id});await putJSON('bolsa_trabajo',list); await syncJobsD1(list); await audit('update_job','job',list[i].id,{}); return json({success:true,item:list[i]});}
      if(request.method==='DELETE'){const b=await request.json().catch(()=>({})); const next=list.filter(x=>String(x.id)!==String(b.id)); await putJSON('bolsa_trabajo',next); await syncJobsD1(next); await audit('delete_job','job',b.id,{}); return json({success:true});}
    }
    if (path === '/api/bolsa_trabajo/postular' && request.method === 'POST') {
      const b=await request.json().catch(()=>({}));
      if(!b.job_id||!b.nombre||!b.email)return json({error:'Faltan datos'},400);
      const token=String(b.artist_token||'').trim();
      if(!token)return json({error:'La participación en la Bolsa de Trabajo es un beneficio para artistas afiliados. Ingresá desde tu perfil privado UADAVSTREAM.'},403);
      const raw=await env.UADAV_DB.get(artistTokenKey(token));
      if(!raw)return json({error:'Acceso de artista inválido o vencido'},401);
      let access; try{access=JSON.parse(raw)}catch{return json({error:'Acceso de artista inválido'},401)}
      if(access.expires&&Date.now()>access.expires)return json({error:'Acceso de artista vencido'},401);
      const arr=await getArray('artistas');
      const artist=arr.find(a=>String(publicArtistFromItem(a).id)===String(access.artist_id));
      if(!artist || artist.afiliado_verificado!==true)return json({error:'La Bolsa de Trabajo está disponible para artistas afiliados UADAV verificados.'},403);
      const jobList=await getArray('bolsa_trabajo');
      const job=jobList.find(x=>String(x.id)===String(b.job_id)&&x.activo!==false);
      if(!job)return json({error:'Oportunidad no disponible'},404);
      const list=await getArray('postulaciones_trabajo');
      const item={id:'POST-'+Date.now().toString(36).toUpperCase(),job_id:String(b.job_id),artist_id:String(access.artist_id),artist_nombre:String(artist.nombre_artistico||artist.nombre||''),nombre:String(b.nombre).slice(0,120),email:String(b.email).slice(0,160),whatsapp:String(b.whatsapp||'').slice(0,50),mensaje:String(b.mensaje||'').slice(0,2000),creado:new Date().toISOString(),estado:'pendiente'};
      list.push(item); while(list.length>1000)list.shift(); await putJSON('postulaciones_trabajo',list); await syncJobApplicationsD1(list); await audit('create_job_application','job_application',item.id,{job_id:item.job_id,artist_id:item.artist_id}); await emitNotification({event:'JOB_APPLICATION',to:body?.email||'',subject:'★ UADAV STREAM · Nueva postulación',text:'Se recibió una postulación a una oportunidad laboral.',entity_id:item.id}); return json({success:true,item});
    }
    if (path === '/api/bolsa_trabajo/postulaciones' && request.method === 'GET') {
      if(!isAdmin())return json({error:'No autorizado'},401); return json(await getArray('postulaciones_trabajo'));
    }

    // --- SHORTS ---
    if (path === '/api/shorts') {
      const list=await getArray('shorts');
      if(request.method==='GET') return json(list.filter(x=>x && x.visible!==false));
      if(!isAdmin())return json({error:'No autorizado'},401);
      if(request.method==='POST'){const b=await request.json().catch(()=>({}));if(!b.id&&!b.youtube_id)return json({error:'ID de video requerido'},400);const item={id:b.id||b.youtube_id,titulo:String(b.titulo||'Short'),artista:String(b.artista||''),descripcion:String(b.descripcion||''),thumbnail:String(b.thumbnail||''),visible:b.visible!==false,creado:new Date().toISOString()};list.push(item);await putJSON('shorts',list);return json({success:true,item});}
      if(request.method==='PUT'){const b=await request.json().catch(()=>({}));const i=list.findIndex(x=>String(x.id)===String(b.id));if(i<0)return json({error:'No encontrado'},404);Object.assign(list[i],b,{id:list[i].id});await putJSON('shorts',list);return json({success:true,item:list[i]});}
      if(request.method==='DELETE'){const b=await request.json().catch(()=>({}));await putJSON('shorts',list.filter(x=>String(x.id)!==String(b.id)));return json({success:true});}
    }

    if (path === '/api/premium/validate' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      const code = String(body?.code || '').trim().toUpperCase();
      const list = await getArray('premium_codes');
      const item = list.find(x => String(x.code || '').toUpperCase() === code && x.activo !== false);
      if (!item) return json({ valid: false, error: 'Código inválido' });
      if (item.expira && Date.now() > Date.parse(item.expira)) return json({ valid: false, error: 'Código vencido' });
      return json({ valid: true, benefit: item.beneficio || 'sin_publicidad', expires: item.expira || null });
    }

    if (path === '/api/premium/codes') {
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      if (request.method === 'GET') return json(await getArray('premium_codes'));
      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const list = await getArray('premium_codes');
        const code = 'UADAV-P-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        const item = { code, activo: true, beneficio: body.beneficio || 'sin_publicidad', dias: Number(body.dias || 30), expira: body.expira || null, creado: new Date().toISOString(), usos: 0 };
        list.push(item);
        await putJSON('premium_codes', list);
        return json({ success: true, item });
      }
    }



    // ============================================================
    // V6.4 — ARTIST CENTER / SELF MANAGEMENT / CONTRACTING
    // ============================================================
    const artistTokenKey = token => 'artist_access_' + String(token || '').replace(/[^A-Za-z0-9_-]/g,'').slice(0,120);
    const publicArtistFromItem = a => ({
      id:a.id||a.token||a.canal||a.nombre||a.nombre_artistico||'',
      nombre:a.nombre_artistico||a.nombre||'Artista',
      rubro:a.rubro||'Artista de variedades',
      ciudad:a.ciudad||a.region||'',
      foto:a.foto||a.imagen||a.thumbnail||'',
      bio:a.bio||'',
      canal:a.canal||a.channel_id||'',
      youtube_bio:a.youtube_bio||'',
      visible:a.visible!==false,
      estado:a.estado||'catalogo',
      afiliado_verificado:a.afiliado_verificado===true,
      donacion_activa:a.donacion_activa===true,
      donation_url:a.donation_url||a.donacion_url||'',
      live_url:a.live_url||'',
      booking_url:a.booking_url||'',
      honorario_desde:a.honorario_desde||a.precio_desde||'',
      disponibilidad:a.disponibilidad||'',
      redes:a.redes||{},
      contenido:a.contenido||[],
      bolsa_activa:a.afiliado_verificado===true,
      claimed:a.claimed===true,
      claim_status:a.claim_status||'none'
    });
    async function artistsFromD1(params={}) {
      if(!hasD1()) return null;
      const search=String(params.search||'').trim(); const category=String(params.category||'').trim(); const province=String(params.province||'').trim();
      const where=['visible=1']; const binds=[];
      if(search){where.push(`(name LIKE ? OR stage_name LIKE ? OR category LIKE ? OR city LIKE ? OR province LIKE ?)`); const q=`%${search}%`; binds.push(q,q,q,q,q);}
      if(category){where.push('category LIKE ?');binds.push(`%${category}%`);}
      if(province){where.push('province LIKE ?');binds.push(`%${province}%`);}
      const sql=`SELECT * FROM artists WHERE ${where.join(' AND ')} AND lower(COALESCE(status,'')) NOT IN ('suspendido','bloqueado','oculto') ORDER BY verified DESC, updated_at DESC LIMIT 500`;
      const r=await env.DB.prepare(sql).bind(...binds).all();
      return (r.results||[]).map(x=>({...(safeJSON(x.data_json,{})),id:x.id,nombre:x.name||x.stage_name||'Artista',nombre_artistico:x.stage_name||x.name||'Artista',rubro:x.category||'',ciudad:x.city||'',provincia:x.province||'',pais:x.country||'Argentina',afiliado_verificado:Boolean(x.verified),visible:Boolean(x.visible),estado:x.status||'catalogo',source_id:x.source_id||null,claimed:safeJSON(x.data_json,{}).claimed===true,claim_status:safeJSON(x.data_json,{}).claim_status||'none'}));
    }
    async function artistFromD1(identifier){
      if(!hasD1()) return null; const raw=String(identifier||'').trim().toLowerCase(); if(!raw)return null;
      const like=`%${raw.replace(/%/g,'')}%`;
      const r=await env.DB.prepare(`SELECT * FROM artists WHERE lower(id)=? OR lower(name)=? OR lower(stage_name)=? OR lower(json_extract(data_json,'$.canal'))=? LIMIT 1`).bind(raw,raw,raw,raw).all();
      const x=(r.results||[])[0]; if(!x)return null; const d=safeJSON(x.data_json,{}); return {...d,id:x.id,nombre:x.name||x.stage_name||'Artista',nombre_artistico:x.stage_name||x.name||'Artista',rubro:x.category||'',ciudad:x.city||'',provincia:x.province||'',pais:x.country||'Argentina',afiliado_verificado:Boolean(x.verified),visible:Boolean(x.visible),estado:x.status||'catalogo',claimed:d.claimed===true,claim_status:d.claim_status||'none'};
    }

    async function allCanonicalArtists(){
      const list=await getArray('artistas');
      const secs=await getArray('secciones');
      const out=[]; const seen=new Set();
      for(const a of Array.isArray(list)?list:[]){ const p=publicArtistFromItem(a); const k=String(p.id||p.canal||p.nombre).toLowerCase(); if(k&&!seen.has(k)){seen.add(k);out.push(a)} }
      for(const s of Array.isArray(secs)?secs:[]){ if(s?.tipo_contenido!=='perfiles') continue; for(const a of Array.isArray(s.items)?s.items:[]){const p=publicArtistFromItem(a);const k=String(p.id||p.canal||p.nombre).toLowerCase();if(k&&!seen.has(k)){seen.add(k);out.push({...a,id:p.id})}} }
      return out;
    }
    if(path==='/api/public/artistas' && request.method==='GET'){
      const q=String(url.searchParams.get('search')||'').trim(); const category=String(url.searchParams.get('category')||'').trim(); const province=String(url.searchParams.get('province')||'').trim();
      const d1=await artistsFromD1({search:q,category,province}); const arr=d1||await allCanonicalArtists();
      return json(arr.map(publicArtistFromItem).filter(a=>a.visible && !['suspendido','bloqueado','oculto'].includes(String(a.estado||'').toLowerCase())));
    }
    if(path==='/api/public/artista' && request.method==='GET'){
      const rawId=decodeURIComponent(String(url.searchParams.get('id')||url.searchParams.get('artist')||'')).trim();
      let found=await artistFromD1(rawId);
      if(!found){
        const norm=v=>String(v||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/$/,''); const id=norm(rawId); const arr=await allCanonicalArtists();
        found=arr.find(a=>{const p=publicArtistFromItem(a);const candidates=[a.id,a.token,a.canal,a.channel_id,a.youtube_id,a.nombre,a.nombre_artistico,p.id,p.canal,p.nombre];return candidates.some(v=>norm(v)===id);}) || arr.find(a=>{const p=publicArtistFromItem(a);const name=norm(p.nombre);return id&&name&&name===id.replace(/[_-]+/g,' ');});
      }
      if(!found)return json({error:'Artista no encontrado'},404);
      const p=publicArtistFromItem(found); if(!p.visible && !p.afiliado_verificado)return json({error:'Perfil no disponible'},404);
      return json({...p,claimed:found.claimed===true,claim_status:found.claim_status||'none',claim_email:found.claim_email||'',claim_at:found.claim_at||null});
    }
    if(path==='/api/artista/claim' && request.method==='POST'){
      const b=await request.json().catch(()=>({})); const artistId=String(b.artist_id||'').trim(); if(!artistId)return json({error:'artist_id requerido'},400);
      const artist=await artistFromD1(artistId) || (await allCanonicalArtists()).find(a=>String(publicArtistFromItem(a).id)===artistId); if(!artist)return json({error:'Artista no encontrado'},404);
      if(artist.claimed===true || artist.claim_status==='approved') return json({error:'Este perfil ya fue reclamado'},409);
      const claim={id:'CL-'+Date.now().toString(36).toUpperCase(),artist_id:String(publicArtistFromItem(artist).id),name:String(b.name||'').slice(0,140),email:String(b.email||'').slice(0,180),whatsapp:String(b.whatsapp||'').slice(0,60),proof_url:String(b.proof_url||'').slice(0,500),social_url:String(b.social_url||'').slice(0,500),note:String(b.note||'').slice(0,1500),status:'pending',created_at:isoNow()};
      if(hasD1()) await env.DB.prepare(`INSERT INTO artist_claims(id,artist_id,name,email,whatsapp,proof_url,social_url,note,status,created_at,reviewed_at,review_note) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(claim.id,claim.artist_id,claim.name,claim.email,claim.whatsapp,claim.proof_url,claim.social_url,claim.note,'pending',claim.created_at,null,'').run();
      else {const list=await getArray('artist_claims');list.push(claim);await putJSON('artist_claims',list.slice(-2000));}
      await emitNotification({event:'ARTIST_CLAIM_CREATED',template:'artist_claim_created',to:claim.email,subject:'Recibimos tu solicitud de perfil en ★ UADAV STREAM',name:claim.name,artist_id:claim.artist_id});
      await audit('artist_claim_created','artist_claim',claim.id,{artist_id:claim.artist_id});
      return json({success:true,id:claim.id,status:'pending'});
    }
    if(path==='/api/admin/artist-claims' && request.method==='GET'){
      if(!isAdmin())return json({error:'No autorizado'},401);
      if(hasD1()){const r=await env.DB.prepare(`SELECT * FROM artist_claims ORDER BY created_at DESC LIMIT 500`).all();return json(r.results||[]);}
      return json((await getArray('artist_claims')).slice(-500).reverse());
    }
    if(path==='/api/admin/artist-claims' && request.method==='PUT'){
      if(!isAdmin())return json({error:'No autorizado'},401); const b=await request.json().catch(()=>({})); const claimId=String(b.id||'').trim(); const status=String(b.status||'').trim(); if(!claimId||!status)return json({error:'id y status requeridos'},400);
      let claim;
      if(hasD1()){const r=await env.DB.prepare(`SELECT * FROM artist_claims WHERE id=?`).bind(claimId).first();claim=r||null;} else {const list=await getArray('artist_claims');claim=list.find(x=>String(x.id)===claimId)||null;}
      if(!claim)return json({error:'Reclamo no encontrado'},404);
      const now=isoNow();
      if(status==='approved'){
        let artist=await artistFromD1(String(claim.artist_id)); if(!artist){const arr=await allCanonicalArtists();artist=arr.find(a=>String(publicArtistFromItem(a).id)===String(claim.artist_id));}
        if(!artist)return json({error:'Artista asociado no encontrado'},404);
        const arr=await getArray('artistas'); let i=arr.findIndex(a=>String(publicArtistFromItem(a).id)===String(claim.artist_id)); if(i<0){arr.push(artist);i=arr.length-1;}
        const token='UAD-ART-'+crypto.randomUUID().replace(/-/g,''); const artistId=String(publicArtistFromItem(arr[i]).id); await env.UADAV_DB.put(artistTokenKey(token),JSON.stringify({artist_id:artistId,created:now,expires:Date.now()+1000*60*60*24*365*2}));
        arr[i]={...arr[i],claimed:true,claim_status:'approved',claim_email:claim.email||'',claim_name:claim.name||'',claim_at:now,claim_id:claim.id,self_managed:true}; await putJSON('artistas',arr); await syncArtistsD1([arr[i]]);
        if(hasD1()) await env.DB.prepare(`UPDATE artist_claims SET status='approved',reviewed_at=?,review_note=? WHERE id=?`).bind(now,String(b.review_note||'Aprobado por administración').slice(0,1000),claimId).run();
        else {const list=await getArray('artist_claims');const ix=list.findIndex(x=>String(x.id)===claimId);if(ix>=0){list[ix]={...list[ix],status:'approved',reviewed_at:now,review_note:String(b.review_note||'').slice(0,1000)};await putJSON('artist_claims',list);}}
        const base=String(b.base_url||'https://uadavstream.com.ar').replace(/\/$/,''); const profileUrl=base+'/gestionar-artista.html?token='+encodeURIComponent(token);
        await emitNotification({event:'ARTIST_CLAIM_APPROVED',template:'artist_claim_approved',to:claim.email,subject:'Tu perfil de ★ UADAV STREAM fue reclamado',name:claim.name,artist_id:artistId,profileUrl});
        await audit('artist_claim_approved','artist_claim',claimId,{artist_id:artistId}); return json({success:true,status:'approved',profileUrl,token});
      }
      if(!['rejected','pending'].includes(status))return json({error:'Estado no permitido'},400);
      if(hasD1()) await env.DB.prepare(`UPDATE artist_claims SET status=?,reviewed_at=?,review_note=? WHERE id=?`).bind(status,now,String(b.review_note||'').slice(0,1000),claimId).run();
      else {const list=await getArray('artist_claims');const ix=list.findIndex(x=>String(x.id)===claimId);if(ix>=0){list[ix]={...list[ix],status,reviewed_at:now,review_note:String(b.review_note||'').slice(0,1000)};await putJSON('artist_claims',list);}}
      await audit('artist_claim_'+status,'artist_claim',claimId,{}); return json({success:true,status});
    }
    if(path==='/api/admin/artistas/sync' && request.method==='POST'){
      if(!isAdmin()) return json({error:'No autorizado'},401);
      const arr=await allCanonicalArtists();
      const seen=new Set(); const normalized=[];
      for(const a of arr){const p=publicArtistFromItem(a);const k=String(p.id||p.canal||p.nombre).toLowerCase();if(!k||seen.has(k))continue;seen.add(k);normalized.push({...a,id:p.id||('ART-'+Date.now().toString(36)),nombre:a.nombre||a.nombre_artistico||p.nombre,visible:a.visible!==false,estado:a.estado||'catalogo'});}
      await putJSON('artistas',normalized); return json({success:true,count:normalized.length,artists:normalized.map(publicArtistFromItem)});
    }
    if(path==='/api/admin/artistas' && request.method==='GET'){
      if(!isAdmin()) return json({error:'No autorizado'},401); return json(await getArray('artistas'));
    }
    if(path==='/api/artista/access/create' && request.method==='POST'){
      if(!isAdmin()) return json({error:'No autorizado'},401);
      const b=await request.json().catch(()=>({})); const id=String(b.artist_id||'').trim(); if(!id)return json({error:'artist_id requerido'},400);
      const arr=await allCanonicalArtists(); const artist=arr.find(a=>String(publicArtistFromItem(a).id).toLowerCase()===id.toLowerCase() || String(a.canal||'').toLowerCase()===id.toLowerCase()); if(!artist)return json({error:'Artista no encontrado'},404);
      const token='UAD-ART-'+crypto.randomUUID().replace(/-/g,''); await env.UADAV_DB.put(artistTokenKey(token),JSON.stringify({artist_id:publicArtistFromItem(artist).id,created:new Date().toISOString(),expires:Date.now()+1000*60*60*24*365}));
      const profileUrl=(b.base_url||'https://uadavstream.com.ar')+'/gestionar-artista.html?token='+encodeURIComponent(token);
      return json({success:true,token,profileUrl,artist:publicArtistFromItem(artist)});
    }
    if(path==='/api/artista/access' && request.method==='GET'){
      const token=String(url.searchParams.get('token')||'').trim(); if(!token)return json({error:'Token requerido'},400); const raw=await env.UADAV_DB.get(artistTokenKey(token)); if(!raw)return json({error:'Acceso inválido o vencido'},401); const access=JSON.parse(raw); if(access.expires&&Date.now()>access.expires)return json({error:'Acceso vencido'},401); const arr=await allCanonicalArtists(); const artist=arr.find(a=>String(publicArtistFromItem(a).id)===String(access.artist_id)); if(!artist)return json({error:'Perfil no encontrado'},404); return json({artist:publicArtistFromItem(artist),access:{artist_id:access.artist_id,expires:access.expires}});
    }
    if(path==='/api/artista/access' && request.method==='POST'){
      const b=await request.json().catch(()=>({})); const token=String(b.token||'').trim(); const raw=await env.UADAV_DB.get(artistTokenKey(token)); if(!raw)return json({error:'Acceso inválido o vencido'},401); const access=JSON.parse(raw); if(access.expires&&Date.now()>access.expires)return json({error:'Acceso vencido'},401);
      const arr=await getArray('artistas'); let i=arr.findIndex(a=>String(publicArtistFromItem(a).id)===String(access.artist_id));
      if(i<0){ const all=await allCanonicalArtists(); const found=all.find(a=>String(publicArtistFromItem(a).id)===String(access.artist_id)); if(!found)return json({error:'Perfil no encontrado'},404); arr.push(found); i=arr.length-1; }
      const a=arr[i];
      const allowed=['nombre','nombre_artistico','rubro','ciudad','foto','bio','canal','live_url','booking_url','donation_url','donacion_url','honorario_desde','disponibilidad','redes','web'];
      for(const k of allowed) if(Object.prototype.hasOwnProperty.call(b,k)) a[k]=b[k];
      a.self_managed=true; a.ultima_edicion_artista=new Date().toISOString(); a.cambios_pendientes=true; a.estado=a.estado==='aprobado'?'aprobado':(a.estado||'pendiente');
      await putJSON('artistas',arr); return json({success:true,review_required:true,artist:publicArtistFromItem(a)});
    }
    if(path==='/api/artista/content' && request.method==='GET'){
      const id=String(url.searchParams.get('artist_id')||''); const list=await getArray('artista_contenido'); return json(list.filter(x=>String(x.artist_id)===id && x.estado==='publicado'));
    }
    if(path==='/api/artista/content' && request.method==='POST'){
      const b=await request.json().catch(()=>({})); const token=String(b.token||''); const raw=await env.UADAV_DB.get(artistTokenKey(token)); if(!raw)return json({error:'Acceso inválido'},401); const access=JSON.parse(raw); const item={id:'AC-'+crypto.randomUUID().slice(0,8),artist_id:String(access.artist_id),titulo:String(b.titulo||'Contenido'),tipo:String(b.tipo||'video'),url:String(b.url||''),thumbnail:String(b.thumbnail||''),descripcion:String(b.descripcion||''),estado:'pendiente',creado:new Date().toISOString()}; if(!item.url)return json({error:'URL requerida'},400); const list=await getArray('artista_contenido'); list.push(item); await putJSON('artista_contenido',list); return json({success:true,item});
    }
    if(path==='/api/contrataciones' && request.method==='POST'){
      const b=await request.json().catch(()=>({})); if(!b.artist_id||!b.nombre||!b.email)return json({error:'Artista, nombre y email son obligatorios'},400); if(b.acepta_contrato!==true)return json({error:'Debe aceptar el contrato/condiciones para continuar'},400);
      const artists=await getArray('artistas'); const artist=artists.find(a=>String(publicArtistFromItem(a).id)===String(b.artist_id)); if(!artist||artist.afiliado_verificado!==true)return json({error:'La contratación directa está disponible para artistas afiliados UADAV verificados.'},403);
      const list=await getArray('contrataciones'); const item={id:'CON-'+Date.now().toString(36).toUpperCase(),creado:new Date().toISOString(),artist_id:String(b.artist_id),nombre:String(b.nombre).slice(0,140),empresa:String(b.empresa||'').slice(0,160),email:String(b.email).slice(0,180),whatsapp:String(b.whatsapp||'').slice(0,60),evento:String(b.evento||'').slice(0,220),fecha:String(b.fecha||''),ciudad:String(b.ciudad||'').slice(0,100),honorario:String(b.honorario||'').slice(0,80),detalles:String(b.detalles||'').slice(0,3000),contrato_version:String(b.contrato_version||'UADAV-1.0').slice(0,40),contrato_url:String(b.contrato_url||'').slice(0,500),acepta_contrato:true,estado:'pendiente'}; list.push(item); while(list.length>2000)list.shift(); await putJSON('contrataciones',list); return json({success:true,item});
    }
    if(path==='/api/contrataciones' && request.method==='GET'){if(!isAdmin())return json({error:'No autorizado'},401);return json(await getArray('contrataciones'));}
    if(path==='/api/admin/artista_contenido' && request.method==='GET'){if(!isAdmin())return json({error:'No autorizado'},401);return json(await getArray('artista_contenido'));}
    if(path==='/api/admin/artista_contenido' && request.method==='PUT'){if(!isAdmin())return json({error:'No autorizado'},401);const b=await request.json().catch(()=>({}));const list=await getArray('artista_contenido');const i=list.findIndex(x=>String(x.id)===String(b.id));if(i<0)return json({error:'No encontrado'},404);if(b.estado)list[i].estado=String(b.estado);await putJSON('artista_contenido',list);return json({success:true,item:list[i]});}

    // --- PERFIL PRIVADO: DERECHOS Y BOLSA ---
    if(path==='/api/artist/rights' && request.method==='GET'){
      const token=String(url.searchParams.get('token')||'').trim(); if(!token)return json({error:'Token requerido'},400);
      const raw=await env.UADAV_DB.get(artistTokenKey(token)); if(!raw)return json({error:'Acceso inválido'},401); let access; try{access=JSON.parse(raw)}catch{return json({error:'Acceso inválido'},401)}
      if(access.expires&&Date.now()>access.expires)return json({error:'Acceso vencido'},401);
      const arr=await getArray('artistas'); const artist=arr.find(a=>String(publicArtistFromItem(a).id)===String(access.artist_id));
      if(!artist)return json({error:'Artista no encontrado'},404); if(artist.afiliado_verificado!==true)return json({enabled:false,rights:null});
      return json({enabled:true,rights:artist.derechos_gremiales||{}});
    }
    if(path==='/api/artist/rights' && request.method==='POST'){
      const b=await request.json().catch(()=>({})); const token=String(b.token||'').trim(); if(!token)return json({error:'Token requerido'},400);
      const raw=await env.UADAV_DB.get(artistTokenKey(token)); if(!raw)return json({error:'Acceso inválido'},401); let access; try{access=JSON.parse(raw)}catch{return json({error:'Acceso inválido'},401)}
      if(access.expires&&Date.now()>access.expires)return json({error:'Acceso vencido'},401);
      const arr=await getArray('artistas'); const i=arr.findIndex(a=>String(publicArtistFromItem(a).id)===String(access.artist_id)); if(i<0)return json({error:'Artista no encontrado'},404); if(arr[i].afiliado_verificado!==true)return json({error:'Esta sección se habilita para afiliados UADAV verificados.'},403);
      arr[i].derechos_gremiales={sadaic:String(b.sadaic||'').slice(0,120),aadi:String(b.aadi||'').slice(0,120),capif:String(b.capif||'').slice(0,120),estado:String(b.estado||'pendiente').slice(0,60),documentos:Array.isArray(b.documentos)?b.documentos.slice(0,10):[],notas:String(b.notas||'').slice(0,1200),actualizado:new Date().toISOString()};
      arr[i].cambios_pendientes=true; await putJSON('artistas',arr); return json({success:true,rights:arr[i].derechos_gremiales,review_required:true});
    }
    if(path==='/api/artist/jobs' && request.method==='GET'){
      const token=String(url.searchParams.get('token')||'').trim(); if(!token)return json({error:'Token requerido'},400);
      const raw=await env.UADAV_DB.get(artistTokenKey(token)); if(!raw)return json({error:'Acceso inválido'},401); let access; try{access=JSON.parse(raw)}catch{return json({error:'Acceso inválido'},401)}
      if(access.expires&&Date.now()>access.expires)return json({error:'Acceso vencido'},401); const arr=await getArray('artistas'); const artist=arr.find(a=>String(publicArtistFromItem(a).id)===String(access.artist_id)); if(!artist)return json({error:'Artista no encontrado'},404); if(artist.afiliado_verificado!==true)return json({enabled:false,items:[]});
      const jobs=await getArray('bolsa_trabajo'); const rubro=String(artist.rubro||'').toLowerCase(); const items=jobs.filter(x=>x&&x.activo!==false).sort((a,b)=>{const ar=String(a.rubro||'').toLowerCase().includes(rubro)?0:1;const br=String(b.rubro||'').toLowerCase().includes(rubro)?0:1;return ar-br}).slice(0,50); return json({enabled:true,items});
    }
    if(path==='/api/admin/artista-rights' && request.method==='GET'){
      if(!isAdmin())return json({error:'No autorizado'},401); const id=String(url.searchParams.get('artist_id')||''); const arr=await getArray('artistas'); const a=arr.find(x=>String(publicArtistFromItem(x).id)===id); if(!a)return json({error:'Artista no encontrado'},404); return json({artist:publicArtistFromItem(a),rights:a.derechos_gremiales||{}});
    }
    if(path==='/api/admin/artista-rights' && request.method==='POST'){
      if(!isAdmin())return json({error:'No autorizado'},401); const b=await request.json().catch(()=>({})); const arr=await getArray('artistas'); const i=arr.findIndex(x=>String(publicArtistFromItem(x).id)===String(b.artist_id)); if(i<0)return json({error:'Artista no encontrado'},404); arr[i].derechos_gremiales={sadaic:String(b.sadaic||'').slice(0,120),aadi:String(b.aadi||'').slice(0,120),capif:String(b.capif||'').slice(0,120),estado:String(b.estado||'pendiente').slice(0,60),documentos:Array.isArray(b.documentos)?b.documentos.slice(0,10):[],notas:String(b.notas||'').slice(0,1200),actualizado:new Date().toISOString()}; await putJSON('artistas',arr); return json({success:true,rights:arr[i].derechos_gremiales});
    }

    if (path === '/api/platform_info') {
      return json({ service: 'UADAVSTREAM', version: 'V7.4.2', architecture: 'Cloudflare D1 + KV', features: ['core-api','d1-bootstrap','event-calendar','prospecting','search-restrictions', 'youtube-search', 'chat', 'banners', 'radios', 'senales', 'artistas', 'premium', 'home-layout', 'youtube-popular-regional','artist-center','artist-self-management','contracting','artist-content','job-board'] });
    }

    // Fallback KV: keeps the existing Admin compatible with previously stored keys.
    if (path.startsWith('/api/')) {
      const key = path.slice(5).replace(/\//g, '_') || 'config';
      if (request.method === 'GET') return json(await getJSON(key, ['secciones','radios','senales_oficiales','artistas','cartelera_aprobada','eventos_publicados'].includes(key) ? [] : {}));
      if (request.method === 'POST' || request.method === 'PUT') {
        if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
        await env.UADAV_DB.put(key, await request.text());
        return json({ success: true, key });
      }
    }

    return json({ error: 'Ruta no encontrada' }, 404);
  },
  async scheduled(_event, env, ctx) {
    if (env.DB) { const task=flushQueuedNotifications(env,20); if(ctx?.waitUntil) ctx.waitUntil(task); else await task; }
  },
  async queue(batch, env, ctx) {
    const run = async()=>{
      for (const msg of batch.messages) {
        const payload=safeJSON(msg.body,{}); const result=await deliverNotification(payload,env);
        if(result.sent && env.DB && payload.notification_id) await env.DB.prepare(`UPDATE notifications SET status='sent',sent_at=? WHERE id=?`).bind(new Date().toISOString(),String(payload.notification_id)).run();
      }
    };
    if(ctx?.waitUntil) ctx.waitUntil(run()); else await run();
  }
};
