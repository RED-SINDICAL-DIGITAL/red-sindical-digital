export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================================
    // SISTEMA INVIDIOUS "CUOTA CERO"
    // ============================================================
    const INVIDIOUS_INSTANCES = [
      'https://inv.nadeko.net',
      'https://invidious.nerdvpn.de',
      'https://yewtu.be',
      'https://invidious.tiekoetter.com'
    ];

    async function buscarEnInvidious(query, env) {
      const cacheKey = `invidious_${query.toLowerCase().replace(/\s+/g, '_')}`;
      
      // 1️⃣ Buscar en caché KV primero (CUOTA CERO)
      try {
        const cached = await env.UADAV_DB.get(cacheKey);
        if (cached) {
          console.log('✅ CACHE HIT (Cuota cero):', query);
          return JSON.parse(cached);
        }
      } catch (e) {
        console.log('Error leyendo caché:', e);
      }
      
      // 2️⃣ Probar instancias de Invidious en orden rotativo
      for (const instance of INVIDIOUS_INSTANCES) {
        try {
          console.log(' Intentando Invidious:', instance);
          const cleanInstance = instance.replace(/\/$/, '');
          const searchUrl = `${cleanInstance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&limit=15`;
          
          const res = await fetch(searchUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            cf: { cacheTtl: 3600 }
          });
          
          if (!res.ok) {
            console.log(`❌ ${instance} falló con status ${res.status}`);
            continue;
          }
          
          const data = await res.json();
          
          const resultados = data.map(item => {
            let seconds = 0;
            if (item.lengthSeconds) {
              seconds = typeof item.lengthSeconds === 'number' ? item.lengthSeconds : 0;
            } else if (item.duration) {
              seconds = item.duration;
            }
            
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const duracion = `${mins}:${secs.toString().padStart(2, '0')}`;
            
            let thumbnail = '';
            if (item.videoThumbnails && item.videoThumbnails.length > 0) {
              thumbnail = item.videoThumbnails[0].url;
            } else if (item.thumbnail) {
              thumbnail = item.thumbnail;
            }
            
            return {
              id: item.videoId,
              titulo: item.title,
              categoria: item.author || 'Desconocido',
              descripcion: item.description?.slice(0, 200) || '',
              duracion: duracion,
              thumbnail: thumbnail,
              tipo: seconds <= 60 ? 'short' : 'video',
              source: 'invidious'
            };
          }).filter(v => v.id);
          
          // ✅ Guardar en caché por 24 horas (CUOTA CERO)
          try {
            await env.UADAV_DB.put(cacheKey, JSON.stringify(resultados), { expirationTtl: 86400 });
          } catch (e) {
            console.log('Error guardando en caché:', e);
          }
          
          console.log(`✅ Invidious EXITO (${instance}): ${resultados.length} resultados`);
          return resultados;
          
        } catch (error) {
          console.log(`❌ Error en ${instance}:`, error.message);
          continue;
        }
      }
      
      // 3️ Si TODAS las instancias fallan, usar YouTube API oficial
      console.log('️ Invidious falló, usando YouTube API oficial (último recurso)');
      return null;
    }

    // ============================================================
    // HELPERS DE FEDERACIÓN Y MODERACIÓN IA
    // ============================================================
    async function verificarToken(token, env) {
      if (!token) return { valido: false };
      if (env.ADMIN_KEY && token === env.ADMIN_KEY) {
        return { valido: true, rol: 'nacional', provincia: null, nombre: 'Administración Nacional' };
      }
      const raw = await env.UADAV_DB.get('admin_keys');
      const lista = raw ? JSON.parse(raw) : [];
      const encontrado = lista.find(a => a.key === token && a.activo !== false);
      if (encontrado) {
        return {
          valido: true,
          rol: 'provincial',
          provincia: encontrado.provincia,
          nombre: encontrado.nombre || ('Delegación ' + encontrado.provincia)
        };
      }
      return { valido: false };
    }

    async function verificarAdminRequest(request, env) {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      return verificarToken(token, env);
    }

    async function moderarMensajeIA(texto, env) {
      if (!env.GEMINI_API_KEY) {
        return { oculto: false, motivo: 'Moderación IA no configurada.', ia_disponible: false };
      }
      try {
        const prompt = `Sos un moderador de chat en vivo. Analizá si este mensaje debe OCULTARSE por insultos graves, odio, acoso, spam o amenazas. Respondé ÚNICAMENTE con JSON: {"ocultar": true/false, "motivo": "texto"}. Mensaje: """${texto}"""`;
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0, maxOutputTokens: 120 }
            })
          }
        );
        const data = await res.json();
        const textoRespuesta = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const limpio = textoRespuesta.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(limpio);
        return { oculto: !!parsed.ocultar, motivo: parsed.motivo || '', ia_disponible: true };
      } catch (e) {
        return { oculto: false, motivo: 'IA no disponible.', ia_disponible: false };
      }
    }

    async function auditarCarteleraIA(titulo, descripcion, precio, env) {
      if (!env.GEMINI_API_KEY) {
        return { aprobado: true, motivo: 'IA no configurada.', ia_disponible: false };
      }
      try {
        const prompt = `Evaluá si esta publicación de cartelera es legítima o tiene señales de fraude. Título: "${titulo}". Descripción: "${descripcion}". Precio: "${precio}". Respondé ÚNICAMENTE con JSON: {"aprobado": true/false, "motivo": "texto"}.`;
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0, maxOutputTokens: 120 }
            })
          }
        );
        const data = await res.json();
        const textoRespuesta = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const limpio = textoRespuesta.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(limpio);
        return { aprobado: parsed.aprobado !== false, motivo: parsed.motivo || '', ia_disponible: true };
      } catch (e) {
        return { aprobado: true, motivo: 'IA no disponible.', ia_disponible: false };
      }
    }

    // ============================================================
    // 1. PROTECCIÓN DE ADMIN.HTML
    // ============================================================
    if (path === '/admin.html' || path === '/admin') {
      const token = url.searchParams.get('key');
      if (!env.ADMIN_KEY) {
        return new Response('Error: ADMIN_KEY no definida', { status: 500, headers: corsHeaders });
      }
      const verificacion = await verificarToken(token, env);
      if (!verificacion.valido) {
        return new Response('Acceso denegado. Incluye ?key=TU_CLAVE en la URL', { status: 403, headers: corsHeaders });
      }
      const adminHtml = await env.UADAV_DB.get('admin_html');
      if (adminHtml === null) {
        return new Response('El archivo admin.html no está disponible en el KV.', { status: 404, headers: corsHeaders });
      }
      return new Response(adminHtml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    // ============================================================
    // 2. RUTAS ESPECIALES
    // ============================================================
    if (path === '/api/visits') {
      if (request.method === 'GET') {
        const current = await env.UADAV_DB.get('contadores');
        const contadores = current ? JSON.parse(current) : { visitas_totales: 0 };
        return new Response(JSON.stringify(contadores), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (request.method === 'POST') {
        const current = await env.UADAV_DB.get('contadores');
        const contadores = current ? JSON.parse(current) : { visitas_totales: 0 };
        contadores.visitas_totales = (contadores.visitas_totales || 0) + 1;
        await env.UADAV_DB.put('contadores', JSON.stringify(contadores));
        return new Response(JSON.stringify(contadores), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405, headers: corsHeaders });
    }

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
          return new Response(JSON.stringify(videos), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      } catch (e) { console.log("API Error, intentando RSS..."); }
      try {
        const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${cleanId}`);
        const xml = await rssRes.text();
        const entries = xml.split('<entry>').slice(1);
        const videos = entries.map(entry => {
          const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
          const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
          return { id: idMatch ? idMatch[1] : null, titulo: titleMatch ? titleMatch[1] : 'Sin título' };
        }).filter(v => v.id && v.id.length === 11);
        return new Response(JSON.stringify(videos), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify([]), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ============================================================
    // BÚSQUEDA CON INVIDIOUS (CUOTA CERO)
    // ============================================================
    if (path === '/api/youtube/search') {
      const query = url.searchParams.get('q');
      if (!query) {
        return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      try {
        // 1️⃣ Intentar con Invidious primero (CUOTA CERO)
        const resultadosInvidious = await buscarEnInvidious(query, env);
        
        if (resultadosInvidious && resultadosInvidious.length > 0) {
          return new Response(JSON.stringify(resultadosInvidious), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        
        // 2️ Si Invidious falló, usar YouTube API oficial
        console.log('🔵 Usando YouTube API oficial para:', query);
        
        const cacheKey = `search_${query.toLowerCase().replace(/\s+/g, '_')}`;
        const cached = await env.UADAV_DB.get(cacheKey);
        if (cached) {
          return new Response(cached, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        const searchRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${env.YOUTUBE_API_KEY}`
        );
        
        const searchData = await searchRes.json();
        
        if (searchData.error) {
          console.error('Error YouTube API:', searchData.error);
          return new Response(JSON.stringify([]), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
          const duracion = `${mins}:${secs.toString().padStart(2, '0')}`;
          
          return {
            id: item.id.videoId,
            titulo: item.snippet.title,
            categoria: item.snippet.channelTitle,
            descripcion: item.snippet.description?.slice(0, 200) || '',
            duracion: duracion,
            thumbnail: item.snippet.thumbnails.high?.url || '',
            tipo: seconds <= 60 ? 'short' : 'video',
            source: 'youtube_api'
          };
        });
        
        await env.UADAV_DB.put(cacheKey, JSON.stringify(items), { expirationTtl: 172800 });
        
        return new Response(JSON.stringify(items), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        
      } catch (e) {
        console.error('Error en búsqueda:', e);
        return new Response(JSON.stringify([]), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ============================================================
    // 3. ENDPOINTS DE LANDING Y SUSCRIPTORES
    // ============================================================
    if (path === '/api/landing_config') {
      if (request.method === 'GET') {
        const data = await env.UADAV_DB.get('landing_config');
        return new Response(data || JSON.stringify({}), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
        return new Response(data || JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (path === '/api/suscriptores/export') {
      if (request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${env.ADMIN_KEY}`) {
          return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: corsHeaders });
        }
        const data = await env.UADAV_DB.get('suscriptores');
        const lista = data ? JSON.parse(data) : [];
        let csv = 'Email,Fecha\n';
        lista.forEach(s => { csv += `${s.email},${s.fecha}\n`; });
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
    // 3.b FEDERACIÓN DE DELEGACIONES
    // ============================================================
    if (path === '/api/admin_check') {
      const verificacion = await verificarAdminRequest(request, env);
      if (!verificacion.valido) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: corsHeaders });
      }
      return new Response(JSON.stringify({
        rol: verificacion.rol,
        provincia: verificacion.provincia,
        nombre: verificacion.nombre
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (path === '/api/admin_keys') {
      const verificacion = await verificarAdminRequest(request, env);
      if (request.method === 'GET') {
        if (!verificacion.valido || verificacion.rol !== 'nacional') {
          return new Response(JSON.stringify({ error: 'Solo el Administrador Nacional puede ver las delegaciones' }), { status: 403, headers: corsHeaders });
        }
        const raw = await env.UADAV_DB.get('admin_keys');
        return new Response(raw || '[]', { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (request.method === 'POST') {
        if (!verificacion.valido || verificacion.rol !== 'nacional') {
          return new Response(JSON.stringify({ error: 'Solo el Administrador Nacional puede crear delegaciones' }), { status: 403, headers: corsHeaders });
        }
        const { provincia, nombre } = await request.json();
        if (!provincia) {
          return new Response(JSON.stringify({ error: 'Falta la provincia' }), { status: 400, headers: corsHeaders });
        }
        const raw = await env.UADAV_DB.get('admin_keys');
        const lista = raw ? JSON.parse(raw) : [];
        const slug = provincia.toString().toUpperCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^A-Z0-9]/g, '').slice(0, 14) || 'PROV';
        const nuevaClave = `UADAV-DELEG-${slug}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        lista.push({
          key: nuevaClave,
          provincia,
          nombre: nombre || `Delegación ${provincia}`,
          activo: true,
          fecha_creacion: new Date().toISOString()
        });
        await env.UADAV_DB.put('admin_keys', JSON.stringify(lista));
        return new Response(JSON.stringify({ success: true, key: nuevaClave }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (request.method === 'PUT') {
        if (!verificacion.valido || verificacion.rol !== 'nacional') {
          return new Response(JSON.stringify({ error: 'Solo el Administrador Nacional puede modificar delegaciones' }), { status: 403, headers: corsHeaders });
        }
        const { key, activo } = await request.json();
        const raw = await env.UADAV_DB.get('admin_keys');
        let lista = raw ? JSON.parse(raw) : [];
        const idx = lista.findIndex(a => a.key === key);
        if (idx === -1) return new Response(JSON.stringify({ error: 'Clave no encontrada' }), { status: 404, headers: corsHeaders });
        lista[idx].activo = !!activo;
        await env.UADAV_DB.put('admin_keys', JSON.stringify(lista));
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (request.method === 'DELETE') {
        if (!verificacion.valido || verificacion.rol !== 'nacional') {
          return new Response(JSON.stringify({ error: 'Solo el Administrador Nacional puede eliminar delegaciones' }), { status: 403, headers: corsHeaders });
        }
        const { key } = await request.json();
        const raw = await env.UADAV_DB.get('admin_keys');
        let lista = raw ? JSON.parse(raw) : [];
        lista = lista.filter(a => a.key !== key);
        await env.UADAV_DB.put('admin_keys', JSON.stringify(lista));
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405, headers: corsHeaders });
    }

    // ============================================================
    // 3.c CHAT EN VIVO CON MODERACIÓN IA
    // ============================================================
    if (path === '/api/chat' && request.method === 'GET') {
      const streamId = url.searchParams.get('streamId');
      if (!streamId) return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const raw = await env.UADAV_DB.get(`chat_${streamId}`);
      let mensajes = raw ? JSON.parse(raw) : [];
      const admin = await verificarAdminRequest(request, env);
      if (!admin.valido) {
        mensajes = mensajes.filter(m => !m.oculto);
      }
      return new Response(JSON.stringify(mensajes), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (path === '/api/chat/mensaje' && request.method === 'POST') {
      try {
        const { streamId, autor, mensaje } = await request.json();
        if (!streamId || !mensaje || !mensaje.trim()) {
          return new Response(JSON.stringify({ error: 'Falta streamId o mensaje' }), { status: 400, headers: corsHeaders });
        }
        const veredictoIA = await moderarMensajeIA(mensaje.trim(), env);
        const nuevoMensaje = {
          id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
          autor: (autor || 'Anónimo').toString().slice(0, 40),
          mensaje: mensaje.trim().slice(0, 300),
          fecha: new Date().toISOString(),
          oculto: veredictoIA.oculto,
          motivo_ia: veredictoIA.motivo,
          moderado_manual: false
        };
        const raw = await env.UADAV_DB.get(`chat_${streamId}`);
        let mensajes = raw ? JSON.parse(raw) : [];
        mensajes.push(nuevoMensaje);
        if (mensajes.length > 30) mensajes = mensajes.slice(mensajes.length - 30);
        await env.UADAV_DB.put(`chat_${streamId}`, JSON.stringify(mensajes), { expirationTtl: 7200 });
        return new Response(JSON.stringify({ success: true, mensaje: nuevoMensaje }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    if (path === '/api/chat/moderar' && request.method === 'PUT') {
      const admin = await verificarAdminRequest(request, env);
      if (!admin.valido || admin.rol !== 'nacional') {
        return new Response(JSON.stringify({ error: 'Solo el Administrador Nacional puede moderar manualmente' }), { status: 403, headers: corsHeaders });
      }
      try {
        const { streamId, msgId, oculto } = await request.json();
        const raw = await env.UADAV_DB.get(`chat_${streamId}`);
        let mensajes = raw ? JSON.parse(raw) : [];
        const idx = mensajes.findIndex(m => m.id === msgId);
        if (idx === -1) return new Response(JSON.stringify({ error: 'Mensaje no encontrado' }), { status: 404, headers: corsHeaders });
        mensajes[idx].oculto = !!oculto;
        mensajes[idx].moderado_manual = true;
        await env.UADAV_DB.put(`chat_${streamId}`, JSON.stringify(mensajes), { expirationTtl: 7200 });
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    if (path === '/api/cartelera/auditar' && request.method === 'POST') {
      const admin = await verificarAdminRequest(request, env);
      if (!admin.valido) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: corsHeaders });
      }
      try {
        const { titulo, descripcion, precio } = await request.json();
        const resultado = await auditarCarteleraIA(titulo || '', descripcion || '', precio || '', env);
        return new Response(JSON.stringify(resultado), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // ============================================================
    // 4. ENDPOINT GENÉRICO
    // ============================================================
    const key = path.replace('/api/', '').replace(/\//g, '_') || 'config';
    try {
      if (request.method === 'GET') {
        const data = await env.UADAV_DB.get(key);
        if (data) {
          return new Response(data, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } else {
          const empty = (key === 'config' || key === 'contadores' || key === 'apariencia' || key === 'estado_sitio') ? {} : [];
          return new Response(JSON.stringify(empty), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
      if (request.method === 'POST' || request.method === 'PUT') {
        const admin = await verificarAdminRequest(request, env);
        if (!admin.valido) {
          return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: corsHeaders });
        }
        const REGIONABLES = ['artistas_uadav', 'cartelera_shows'];
        if (admin.rol === 'provincial') {
          if (!REGIONABLES.includes(key)) {
            return new Response(JSON.stringify({ error: 'Esta sección es exclusiva del Administrador Nacional' }), { status: 403, headers: corsHeaders });
          }
          let itemsEnviados;
          try {
            itemsEnviados = JSON.parse(await request.text());
          } catch (e) {
            itemsEnviados = [];
          }
          if (!Array.isArray(itemsEnviados)) itemsEnviados = [];
          itemsEnviados = itemsEnviados.map(item => ({ ...item, provincia: admin.provincia }));
          const actualRaw = await env.UADAV_DB.get(key);
          const actual = actualRaw ? JSON.parse(actualRaw) : [];
          const otrasProvincias = actual.filter(item => item.provincia !== admin.provincia);
          const fusion = [...otrasProvincias, ...itemsEnviados];
          await env.UADAV_DB.put(key, JSON.stringify(fusion));
          return new Response(JSON.stringify({ success: true, key, provincia: admin.provincia }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const body = await request.text();
        await env.UADAV_DB.put(key, body);
        return new Response(JSON.stringify({ success: true, key }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response('Método no permitido', { status: 405, headers: corsHeaders });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
  }
};
