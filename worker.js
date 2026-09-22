export default {
  async fetch(request, env) {
    // Definir CORS headers para TODAS las respuestas
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Responder a preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================================
    // HEALTH + ADMIN CHECK
    // ============================================================
    if (path === '/api/health') {
      return new Response(JSON.stringify({ ok:true, service:'UADAVSTREAM', version:'AUDIT-V1', kv:!!env.UADAV_DB, time:new Date().toISOString() }), { headers:{...corsHeaders,'Content-Type':'application/json'} });
    }
    if (path === '/api/admin_check') {
      const auth = request.headers.get('Authorization') || '';
      if (auth === `Bearer ${env.ADMIN_KEY}`) return new Response(JSON.stringify({success:true,role:'admin_nacional'}), {headers:{...corsHeaders,'Content-Type':'application/json'}});
      const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
      const raw = await env.UADAV_DB.get('delegaciones');
      if (raw) { try { const map=JSON.parse(raw); if (map[token]) return new Response(JSON.stringify({success:true,role:'admin_provincial',provincia:map[token]}), {headers:{...corsHeaders,'Content-Type':'application/json'}}); } catch(e){} }
      return new Response(JSON.stringify({error:'No autorizado'}), {status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    }

    // ============================================================
    // 1. ADMIN.HTML (protegido por clave)
    // ============================================================
    if (path === '/admin.html' || path === '/admin') {
      const token = url.searchParams.get('key');
      if (!env.ADMIN_KEY) {
        return new Response('Error: ADMIN_KEY no definida', { status: 500, headers: corsHeaders });
      }
      if (token !== env.ADMIN_KEY) {
        return new Response('Acceso denegado', { status: 403, headers: corsHeaders });
      }
      const adminHtml = await env.UADAV_DB.get('admin_html');
      if (adminHtml === null) {
        return new Response('admin.html no encontrado en KV', { status: 404, headers: corsHeaders });
      }
      return new Response(adminHtml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' }
      });
    }

    // D1 eliminado: UADAVSTREAM usa únicamente Cloudflare KV.
    // ============================================================
    // 3. UTILIDADES JWT
    // ============================================================
    function base64url(str) {
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    async function signJWT(payload, secret) {
      const header = { alg: 'HS256', typ: 'JWT' };
      const encodedHeader = base64url(JSON.stringify(header));
      const encodedPayload = base64url(JSON.stringify(payload));
      const signature = await crypto.subtle.sign(
        'HMAC',
        await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
        new TextEncoder().encode(encodedHeader + '.' + encodedPayload)
      );
      const encodedSignature = base64url(String.fromCharCode(...new Uint8Array(signature)));
      return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
    }
    async function verifyJWT(token, secret) {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [encodedHeader, encodedPayload, encodedSignature] = parts;
      const signature = new Uint8Array(
        atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/'))
          .split('').map(c => c.charCodeAt(0))
      );
      const data = new TextEncoder().encode(encodedHeader + '.' + encodedPayload);
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
      const valid = await crypto.subtle.verify('HMAC', key, signature, data);
      if (!valid) return null;
      return JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));
    }
    function getAuthUser(request) {
      const auth = request.headers.get('Authorization');
      if (!auth || !auth.startsWith('Bearer ')) return null;
      const token = auth.slice(7);
      return verifyJWT(token, env.JWT_SECRET);
    }

    // ============================================================
    // 4. CONFIGURACIÓN GLOBAL
    // ============================================================
    async function getConfig() {
      const raw = await env.UADAV_DB.get('config_global');
      if (raw) {
        try { return JSON.parse(raw); } catch (e) {}
      }
      return { registro_habilitado: false };
    }
    async function setConfig(config) {
      await env.UADAV_DB.put('config_global', JSON.stringify(config));
    }

    async function getKVArray(key){ const raw=await env.UADAV_DB.get(key); if(!raw)return []; try{const v=JSON.parse(raw);return Array.isArray(v)?v:[];}catch{return [];} }
    async function getKVObject(key){ const raw=await env.UADAV_DB.get(key); if(!raw)return {}; try{const v=JSON.parse(raw);return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};} }
    function esAdmin(){ return (request.headers.get('Authorization')||'') === `Bearer ${env.ADMIN_KEY}`; }

    // ============================================================
    // 5. ENDPOINTS EXISTENTES (VISITAS, YOUTUBE, SECCIONES, ETC.)
    //    TODOS CON CORS
    // ============================================================

    // --- VISITAS (público, sin auth) ---
    if (path === '/api/visits') {
      if (request.method === 'GET') {
        const current = await env.UADAV_DB.get('contadores');
        const contadores = current ? JSON.parse(current) : { visitas_totales: 0 };
        return new Response(JSON.stringify(contadores), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (request.method === 'POST') {
        const current = await env.UADAV_DB.get('contadores');
        const contadores = current ? JSON.parse(current) : { visitas_totales: 0 };
        contadores.visitas_totales = (contadores.visitas_totales || 0) + 1;
        await env.UADAV_DB.put('contadores', JSON.stringify(contadores));
        return new Response(JSON.stringify(contadores), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405, headers: corsHeaders });
    }

    // --- CANAL DE YOUTUBE ---
    if (path === '/api/channel_videos') {
      const channelId = url.searchParams.get('channel_id');
      let cleanId = channelId || '';
      if (cleanId.includes('channel_id=')) cleanId = cleanId.split('channel_id=')[1].split('&')[0];
      if (cleanId.includes('/channel/')) cleanId = cleanId.split('/channel/')[1].split('/')[0];
      if (cleanId.includes('/@')) cleanId = cleanId.split('/@')[1].split('/')[0];
      if (!cleanId.startsWith('UC') || cleanId.length < 24) {
        return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400, headers: corsHeaders });
      }
      try {
        const channelRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${cleanId}&key=${env.YOUTUBE_API_KEY}`
        );
        const channelData = await channelRes.json();
        if (channelData.items && channelData.items[0]) {
          const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
          const playlistRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=10&key=${env.YOUTUBE_API_KEY}`
          );
          const playlistData = await playlistRes.json();
          const videos = (playlistData.items || [])
            .map(item => ({ id: item.contentDetails.videoId, titulo: item.snippet.title }))
            .filter(v => v.id);
          return new Response(JSON.stringify(videos), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        console.log("API Error, intentando RSS...");
      }
      // Fallback RSS
      try {
        const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${cleanId}`);
        const xml = await rssRes.text();
        const entries = xml.split('<entry>').slice(1);
        const videos = entries.map(entry => {
          const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
          const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
          return { id: idMatch ? idMatch[1] : null, titulo: titleMatch ? titleMatch[1] : 'Sin título' };
        }).filter(v => v.id && v.id.length === 11);
        return new Response(JSON.stringify(videos), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // --- BÚSQUEDA EN YOUTUBE ---
    if (path === '/api/youtube/search') {
      const query = url.searchParams.get('q');
      if (!query) {
        return new Response(JSON.stringify([]), { headers: corsHeaders });
      }
      const cacheKey = `search_${query.toLowerCase().replace(/\s+/g, '_')}`;
      const cached = await env.UADAV_DB.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      try {
        const searchRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${env.YOUTUBE_API_KEY}`
        );
        const searchData = await searchRes.json();
        if (searchData.error) {
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const ids = searchData.items.map(item => item.id.videoId).join(',');
        const videoRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${env.YOUTUBE_API_KEY}`
        );
        const videoData = await videoRes.json();
        const durations = {};
        videoData.items.forEach(item => { durations[item.id] = item.contentDetails.duration; });

        const items = searchData.items.map(item => {
          const isoDuration = durations[item.id.videoId] || 'PT0S';
          const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          const seconds = (match[1] ? parseInt(match[1]) * 3600 : 0) +
                         (match[2] ? parseInt(match[2]) * 60 : 0) +
                         (match[3] ? parseInt(match[3]) : 0);
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          const duracion = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
          return {
            id: item.id.videoId,
            titulo: item.snippet.title,
            categoria: "Resultado",
            descripcion: item.snippet.channelTitle,
            duracion: duracion,
            thumbnail: item.snippet.thumbnails.high?.url,
            tipo: seconds <= 60 ? 'short' : 'video'
          };
        });

        await env.UADAV_DB.put(cacheKey, JSON.stringify(items), { expirationTtl: 86400 });
        return new Response(JSON.stringify(items), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // --- BUSCAR CANAL DE YOUTUBE POR NOMBRE ---
    if (path === '/api/youtube/search_channel') {
      const nombre = url.searchParams.get('name');
      if (!nombre) {
        return new Response(JSON.stringify({ error: 'Falta el parámetro name' }), { status: 400, headers: corsHeaders });
      }
      const cacheKey = `channel_match_${nombre.toLowerCase().trim().replace(/\s+/g, '_')}`;
      const cached = await env.UADAV_DB.get(cacheKey);
      if (cached) {
        return new Response(cached, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      try {
        const searchRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(nombre)}&type=channel&key=${env.YOUTUBE_API_KEY}`
        );
        const searchData = await searchRes.json();
        if (searchData.error || !searchData.items || searchData.items.length === 0) {
          const vacio = JSON.stringify({ channelId: null });
          await env.UADAV_DB.put(cacheKey, vacio, { expirationTtl: 3600 });
          return new Response(vacio, { status: 200, headers: corsHeaders });
        }
        const item = searchData.items[0];
        const resultado = {
          channelId: item.snippet.channelId || (item.id && item.id.channelId) || null,
          nombre: item.snippet.channelTitle,
          thumbnail: (item.snippet.thumbnails && (item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url)) || '',
          bio: (item.snippet.description || '').slice(0, 500)
        };
        await env.UADAV_DB.put(cacheKey, JSON.stringify(resultado), { expirationTtl: 604800 });
        return new Response(JSON.stringify(resultado), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ channelId: null }), {
          status: 200,
          headers: corsHeaders
        });
      }
    }

    // --- INFO DE CANAL POR ID O @HANDLE ---
    if (path === '/api/youtube/channel_info') {
      const id = url.searchParams.get('id');
      const handle = url.searchParams.get('handle');
      if (!id && !handle) {
        return new Response(JSON.stringify({ error: 'Falta id o handle' }), { status: 400, headers: corsHeaders });
      }
      const cacheKey = `channel_info_${(id || handle).toLowerCase()}`;
      const cached = await env.UADAV_DB.get(cacheKey);
      if (cached) {
        return new Response(cached, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      try {
        const param = id ? `id=${encodeURIComponent(id)}` : `forHandle=${encodeURIComponent(handle)}`;
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet&${param}&key=${env.YOUTUBE_API_KEY}`
        );
        const data = await res.json();
        if (data.error || !data.items || data.items.length === 0) {
          const vacio = JSON.stringify({ channelId: null });
          await env.UADAV_DB.put(cacheKey, vacio, { expirationTtl: 3600 });
          return new Response(vacio, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const ch = data.items[0];
        const resultado = {
          channelId: ch.id,
          nombre: ch.snippet.title,
          thumbnail: (ch.snippet.thumbnails && (ch.snippet.thumbnails.high?.url || ch.snippet.thumbnails.default?.url)) || '',
          bio: (ch.snippet.description || '').slice(0, 500)
        };
        await env.UADAV_DB.put(cacheKey, JSON.stringify(resultado), { expirationTtl: 604800 });
        return new Response(JSON.stringify(resultado), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ channelId: null }), {
          status: 200,
          headers: corsHeaders
        });
      }
    }

    // --- VIDEOS DE PLAYLIST ---
    if (path === '/api/youtube/playlist') {
      const playlistId = url.searchParams.get('id');
      if (!playlistId) {
        return new Response(JSON.stringify({ items: [] }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&key=${env.YOUTUBE_API_KEY}`
        );
        const data = await res.json();
        const items = (data.items || [])
          .map(it => ({
            id: it.contentDetails && it.contentDetails.videoId,
            titulo: it.snippet && it.snippet.title,
            thumbnail: (it.snippet && it.snippet.thumbnails && (it.snippet.thumbnails.high?.url || it.snippet.thumbnails.default?.url)) || ''
          }))
          .filter(v => v.id);
        return new Response(JSON.stringify({ items }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ items: [] }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // --- LANDING CONFIG ---
    if (path === '/api/landing_config') {
      if (request.method === 'GET') {
        const data = await env.UADAV_DB.get('landing_config');
        return new Response(data || JSON.stringify({}), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (request.method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${env.ADMIN_KEY}`) {
          return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: corsHeaders });
        }
        const body = await request.text();
        await env.UADAV_DB.put('landing_config', body);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
    }

    // --- SUSCRIPTORES ---
    if (path === '/api/suscriptores') {
      if (request.method === 'POST') {
        const { email } = await request.json();
        if (!email || !email.includes('@')) {
          return new Response(JSON.stringify({ error: 'Email inválido' }), { status: 400, headers: corsHeaders });
        }
        const current = await env.UADAV_DB.get('suscriptores');
        let lista = current ? JSON.parse(current) : [];
        if (!lista.find(s => s.email === email)) {
          lista.push({ email, fecha: new Date().toISOString() });
          await env.UADAV_DB.put('suscriptores', JSON.stringify(lista));
        }
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      if (request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${env.ADMIN_KEY}`) {
          return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: corsHeaders });
        }
        const data = await env.UADAV_DB.get('suscriptores');
        return new Response(data || JSON.stringify([]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // --- EXPORTAR SUSCRIPTORES ---
    if (path === '/api/suscriptores/export') {
      if (request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${env.ADMIN_KEY}`) {
          return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: corsHeaders });
        }
        const data = await env.UADAV_DB.get('suscriptores');
        const lista = data ? JSON.parse(data) : [];
        let csv = 'Email,Fecha\n';
        lista.forEach(s => {
          csv += `${s.email},${s.fecha}\n`;
        });
        return new Response(csv, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=suscriptores.csv'
          }
        });
      }
    }

    // ============================================================
    // 6. NUEVOS ENDPOINTS: AUTH, CONFIG, ARTISTAS, EVENTOS (CON CORS)
    // ============================================================

    // --- CONFIG ---
    if (path === '/api/config') {
      if (request.method === 'GET') {
        const config = await getConfig();
        return new Response(JSON.stringify(config), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (request.method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${env.ADMIN_KEY}`) {
          return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: corsHeaders });
        }
        const body = await request.json();
        await setConfig(body);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      return new Response('Método no permitido', { status: 405, headers: corsHeaders });
    }

    // UADAVSTREAM no usa registro público ni cuentas de espectador.
    if (path === '/api/auth/register' || path === '/api/auth/login' || path === '/api/auth/me') {
      return new Response(JSON.stringify({error:'Registro de espectadores deshabilitado en UADAVSTREAM'}), {status:410,headers:{...corsHeaders,'Content-Type':'application/json'}});
    }

    // --- PERFIL (me) ---
    // No existe perfil público de espectador: el sistema funciona sin registro.
    // --- ARTISTAS PENDIENTES / KV ---
    if (path === '/api/artistas_pendientes') {
      if (!esAdmin()) return new Response(JSON.stringify({error:'No autorizado'}), {status:401,headers:corsHeaders});
      if (request.method === 'GET') return new Response(JSON.stringify(await getKVArray('postulaciones')), {headers:{...corsHeaders,'Content-Type':'application/json'}});
      if (request.method === 'PUT') {
        const body=await request.json(); const list=await getKVArray('postulaciones');
        const i=list.findIndex(x=>String(x.id||x.token)===String(body.id||body.token));
        if(i<0) return new Response(JSON.stringify({error:'No encontrado'}),{status:404,headers:corsHeaders});
        list[i].estado=body.action==='approve'?'aprobado':'rechazado'; list[i].fecha_revision=new Date().toISOString();
        await env.UADAV_DB.put('postulaciones',JSON.stringify(list));
        if(list[i].estado==='aprobado'){
          const secRaw=await env.UADAV_DB.get('secciones'); let secs=secRaw?JSON.parse(secRaw):[]; let sec=secs.find(x=>x.id==='artistas');
          if(!sec){sec={id:'artistas',nombre:'Artistas',icono:'fa-user-group',activa:true,tipo_contenido:'perfiles',modo_visual:'videos',modo:'manual',items:[]};secs.push(sec);} sec.items=sec.items||[];
          if(!sec.items.some(x=>x.token===list[i].token)) sec.items.push({tipo:'artista',nombre:list[i].nombre_artistico,rubro:list[i].rubro,foto:list[i].foto||'',bio:list[i].bio||'',canal:list[i].youtube_id||list[i].channel_id||'',contacto:list[i].email||'',token:list[i].token});
          await env.UADAV_DB.put('secciones',JSON.stringify(secs));
        }
        return new Response(JSON.stringify({success:true}),{headers:corsHeaders});
      }
    }

    // --- EVENTOS / KV ---
    if (path === '/api/eventos') {
      if (request.method === 'POST') {
        const b=await request.json(); if(!b.nombre&&!b.titulo) return new Response(JSON.stringify({error:'Falta nombre/título'}),{status:400,headers:corsHeaders});
        const list=await getKVArray('eventos_pendientes'); const item={id:'EV-'+Date.now(),nombre:b.nombre||b.titulo,titulo:b.titulo||b.nombre,fecha:b.fecha||'',lugar:b.lugar||'',imagen:b.imagen||'',trailer:b.trailer||'',precio:b.precio||'',link_compra:b.link_compra||b.link_ticketera||'',descripcion:b.descripcion||'',contacto_email:b.contacto_email||'',creado_por:'publico',estado:'pending',fecha_creacion:new Date().toISOString()}; list.push(item); await env.UADAV_DB.put('eventos_pendientes',JSON.stringify(list)); return new Response(JSON.stringify({success:true,id:item.id}),{headers:corsHeaders});
      }
      if (request.method === 'GET') { if(!esAdmin()) return new Response(JSON.stringify({error:'No autorizado'}),{status:401,headers:corsHeaders}); return new Response(JSON.stringify(await getKVArray('eventos_pendientes')),{headers:{...corsHeaders,'Content-Type':'application/json'}}); }
      if (request.method === 'PUT') {
        if(!esAdmin()) return new Response(JSON.stringify({error:'No autorizado'}),{status:401,headers:corsHeaders}); const b=await request.json(); const p=await getKVArray('eventos_pendientes'); const i=p.findIndex(x=>String(x.id)===String(b.id)); if(i<0)return new Response(JSON.stringify({error:'Evento no encontrado'}),{status:404,headers:corsHeaders}); const item=p[i];
        if(b.action==='approve'){const pub=await getKVArray('eventos_publicados');pub.push({...item,estado:'published',publicado_en:new Date().toISOString()});await env.UADAV_DB.put('eventos_publicados',JSON.stringify(pub));} p.splice(i,1); await env.UADAV_DB.put('eventos_pendientes',JSON.stringify(p)); return new Response(JSON.stringify({success:true}),{headers:corsHeaders});
      }
    }
    if (path === '/api/eventos_publicados' && request.method === 'GET') return new Response(JSON.stringify(await getKVArray('eventos_publicados')),{headers:{...corsHeaders,'Content-Type':'application/json'}});

    // --- CARTELERA / KV ---
    if (path === '/api/cartelera') {
      if (request.method === 'GET') return new Response(JSON.stringify(await getKVArray('cartelera_aprobada')),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      if(!esAdmin()) return new Response(JSON.stringify({error:'No autorizado'}),{status:401,headers:corsHeaders});
      if(request.method==='POST'){const b=await request.json();const l=await getKVArray('cartelera_aprobada');const item={id:'SHOW-'+Date.now(),...b,estado:'approved',fecha_creacion:new Date().toISOString()};l.push(item);await env.UADAV_DB.put('cartelera_aprobada',JSON.stringify(l));return new Response(JSON.stringify({success:true,item}),{headers:corsHeaders});}
      if(request.method==='DELETE'){const b=await request.json();const l=await getKVArray('cartelera_aprobada');await env.UADAV_DB.put('cartelera_aprobada',JSON.stringify(l.filter(x=>String(x.id)!==String(b.id))));return new Response(JSON.stringify({success:true}),{headers:corsHeaders});}
    }
    if (path === '/api/artistas') return new Response(JSON.stringify((await getKVArray('secciones')).find(x=>x.id==='artistas')?.items||[]),{headers:{...corsHeaders,'Content-Type':'application/json'}});

    // --- RUTAS DE ACCESO ADMIN ---
    if (path === '/api/access/codes') { if(!esAdmin()) return new Response(JSON.stringify({error:'No autorizado'}),{status:401,headers:corsHeaders}); return new Response(JSON.stringify(await getKVArray('access_codes')),{headers:{...corsHeaders,'Content-Type':'application/json'}}); }
    if (path === '/api/access/generate') { if(!esAdmin()) return new Response(JSON.stringify({error:'No autorizado'}),{status:401,headers:corsHeaders}); const b=await request.json(); const list=await getKVArray('access_codes'); const code='UADAV-'+Math.random().toString(36).slice(2,8).toUpperCase(); list.push({code,provincia:b.provincia||'',rol:b.rol||'admin_provincial',activo:true,creado:new Date().toISOString()}); await env.UADAV_DB.put('access_codes',JSON.stringify(list)); const d=await getKVObject('delegaciones'); d[code]=b.provincia||''; await env.UADAV_DB.put('delegaciones',JSON.stringify(d)); return new Response(JSON.stringify({success:true,code}),{headers:corsHeaders}); }
    if (path === '/api/access/revoke') { if(!esAdmin()) return new Response(JSON.stringify({error:'No autorizado'}),{status:401,headers:corsHeaders}); const b=await request.json(); const list=await getKVArray('access_codes'); const i=list.findIndex(x=>x.code===b.code); if(i>=0)list[i].activo=false; await env.UADAV_DB.put('access_codes',JSON.stringify(list)); const d=await getKVObject('delegaciones'); delete d[b.code]; await env.UADAV_DB.put('delegaciones',JSON.stringify(d)); return new Response(JSON.stringify({success:true}),{headers:corsHeaders}); }

    // --- IMPORTACIONES DEL ADMIN ---
    if (path === '/api/admin/importar-canal' || path === '/api/admin/importar-tendencias') { if(!esAdmin()) return new Response(JSON.stringify({error:'No autorizado'}),{status:401,headers:corsHeaders}); return new Response(JSON.stringify({success:true,items:[],message:'Ruta preparada; usar búsqueda/canal para poblar la sección.'}),{headers:corsHeaders}); }

    // --- CHAT PÚBLICO / MODERACIÓN ---
    if (path === '/api/chat' && request.method === 'GET') return new Response(JSON.stringify((await getKVArray('chat_'+(url.searchParams.get('id_stream')||'general'))).slice(-50)),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    if (path === '/api/moderar_chat' && request.method === 'POST') { const b=await request.json(); if(!b.mensaje)return new Response(JSON.stringify({error:'Mensaje vacío'}),{status:400,headers:corsHeaders}); const key='chat_'+(b.id_stream||'general'); const l=await getKVArray(key); l.push({alias:b.alias||'Espectador',mensaje:b.mensaje,moderado:false,fecha:new Date().toISOString()}); if(l.length>50)l.splice(0,l.length-50); await env.UADAV_DB.put(key,JSON.stringify(l),{expirationTtl:7200}); return new Response(JSON.stringify({moderado:false,aprobado:true}),{headers:corsHeaders}); }

    // --- RUTA GENÉRICA KV ---
    const key = path.replace('/api/','').replace(/\//g,'_') || 'config';
    try {
      if(request.method==='GET'){const data=await env.UADAV_DB.get(key);if(data)return new Response(data,{headers:{...corsHeaders,'Content-Type':'application/json'}});const objs=['config','contadores','apariencia','estado_sitio','config_app','landing_config','footer_config','tarifas_minimas','delegaciones','filtro_grilla'];return new Response(JSON.stringify(objs.includes(key)?{}:[]),{headers:{...corsHeaders,'Content-Type':'application/json'}});}
      if(request.method==='POST'||request.method==='PUT'){if(!esAdmin())return new Response(JSON.stringify({error:'No autorizado'}),{status:401,headers:corsHeaders});const body=await request.text();await env.UADAV_DB.put(key,body);return new Response(JSON.stringify({success:true,key_actualizada:key}),{headers:corsHeaders});}
      return new Response(JSON.stringify({error:'Método no permitido'}),{status:405,headers:corsHeaders});
    } catch(e){return new Response(JSON.stringify({error:'Error KV: '+e.message}),{status:500,headers:corsHeaders});}
    // --- ALIASES PÚBLICOS PARA EL FRONTEND ---
    if (path === '/api/cartelera_aprobada' && request.method === 'GET') {
      return new Response(JSON.stringify(await getKVArray('cartelera_aprobada')), {headers:{...corsHeaders,'Content-Type':'application/json'}});
    }
    if (path === '/api/senales' && request.method === 'GET') {
      return new Response(JSON.stringify(await getKVArray('senales_oficiales')), {headers:{...corsHeaders,'Content-Type':'application/json'}});
    }
    if (path === '/api/eventos_publicados' && request.method === 'GET') {
      return new Response(JSON.stringify(await getKVArray('eventos_publicados')), {headers:{...corsHeaders,'Content-Type':'application/json'}});
    }

    // ============================================================
    // 7. RUTA GENÉRICA (KV) - DEBE IR AL FINAL
    // ============================================================
    const key = path.replace('/api/', '').replace(/\//g, '_') || 'config';
    try {
      if (request.method === 'GET') {
        const data = await env.UADAV_DB.get(key);
        if (data) {
          return new Response(data, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          const empty = (key === 'config' || key === 'contadores' || key === 'apariencia' || key === 'estado_sitio') ? {} : [];
          return new Response(JSON.stringify(empty), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      if (request.method === 'POST' || request.method === 'PUT') {
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${env.ADMIN_KEY}`) {
          return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: corsHeaders });
        }
        const body = await request.text();
        await env.UADAV_DB.put(key, body);
        return new Response(JSON.stringify({ success: true, key }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response('Método no permitido', { status: 405, headers: corsHeaders });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};
