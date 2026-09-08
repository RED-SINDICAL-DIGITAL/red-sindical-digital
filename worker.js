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
    // 0. HELPERS DE FEDERACIÓN DE ADMINS Y MODERACIÓN IA
    // ============================================================

    // Verifica una clave (token) contra el ADMIN_KEY nacional o contra las
    // claves de delegación provincial guardadas en KV ('admin_keys').
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

    // Igual que arriba pero extrae el token directamente del header Authorization
    async function verificarAdminRequest(request, env) {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      return verificarToken(token, env);
    }

    // Consulta a Gemini Flash para decidir si un mensaje de chat debe ocultarse
    async function moderarMensajeIA(texto, env) {
      if (!env.GEMINI_API_KEY) {
        return { oculto: false, motivo: 'Moderación IA no configurada (falta GEMINI_API_KEY).', ia_disponible: false };
      }
      try {
        const prompt = `Sos un moderador de chat en vivo de una plataforma de streaming de un sindicato de artistas. Analizá el siguiente mensaje escrito por un espectador y decidí si debe OCULTARSE por contener insultos graves, discurso de odio, acoso, spam publicitario, contenido sexual explícito o amenazas. Una opinión crítica normal, una queja sobre el show o lenguaje coloquial NO deben ocultarse. Respondé ÚNICAMENTE con un JSON válido, sin texto adicional ni markdown, con este formato exacto: {"ocultar": true, "motivo": "texto breve"} o {"ocultar": false, "motivo": "texto breve"}. Mensaje a analizar: """${texto}"""`;

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
        return { oculto: false, motivo: 'La IA no pudo evaluar el mensaje, se publicó sin filtrar.', ia_disponible: false };
      }
    }

    // Pre-auditoría IA de una publicación de cartelera (detecta datos sospechosos)
    async function auditarCarteleraIA(titulo, descripcion, precio, env) {
      if (!env.GEMINI_API_KEY) {
        return { aprobado: true, motivo: 'Moderación IA no configurada, se aprobó automáticamente.', ia_disponible: false };
      }
      try {
        const prompt = `Sos un auditor de publicaciones de cartelera de espectáculos para un sindicato de artistas. Evaluá si la siguiente publicación parece legítima o si tiene señales de fraude, estafa, precio absurdo, datos incoherentes o spam. Título: "${titulo}". Descripción/lugar: "${descripcion}". Precio informado: "${precio}". Respondé ÚNICAMENTE con un JSON válido sin texto adicional: {"aprobado": true, "motivo": "texto breve"} o {"aprobado": false, "motivo": "texto breve"}.`;
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
        return { aprobado: true, motivo: 'La IA no pudo auditar la publicación, se aprobó automáticamente.', ia_disponible: false };
      }
    }

    // ============================================================
    // 1. PROTECCIÓN DE ADMIN.HTML (ahora federada: nacional o provincial)
    // ============================================================
    if (path === '/admin.html' || path === '/admin') {
      const token = url.searchParams.get('key');

      if (!env.ADMIN_KEY) {
        return new Response('Error: ADMIN_KEY no definida', {
          status: 500,
          headers: corsHeaders
        });
      }

      const verificacion = await verificarToken(token, env);
      if (!verificacion.valido) {
        return new Response('Acceso denegado. Incluye ?key=TU_CLAVE en la URL', {
          status: 403,
          headers: corsHeaders
        });
      }

      const adminHtml = await env.UADAV_DB.get('admin_html');
      if (adminHtml === null) {
        return new Response('El archivo admin.html no está disponible en el KV.', {
          status: 404,
          headers: corsHeaders
        });
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
    // 2. RUTAS ESPECIALES (visitas, YouTube, etc.)
    // ============================================================

    // --- VISITAS ---
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

    // --- BÚSQUEDA EN YOUTUBE ---
    if (path === '/api/youtube/search') {
      const query = url.searchParams.get('q');
      if (!query) return new Response(JSON.stringify([]), { headers: corsHeaders });
      const cacheKey = `search_${query.toLowerCase().replace(/\s+/g, '_')}`;
      const cached = await env.UADAV_DB.get(cacheKey);
      if (cached) return new Response(cached, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      try {
        const searchRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${env.YOUTUBE_API_KEY}`
        );
        const searchData = await searchRes.json();
        if (searchData.error) {
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
        return new Response(JSON.stringify(items), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify([]), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ============================================================
    // 3. ENDPOINTS DE LANDING Y SUSCRIPTORES
    // ============================================================

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

    // --- EXPORTAR SUSCRIPTORES (CSV) ---
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
    // 3.b FEDERACIÓN DE DELEGACIONES PROVINCIALES (solo Nacional)
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
    // 3.c CHAT EN VIVO CON MODERACIÓN IA (Gemini Flash)
    // ============================================================

    // --- LEER MENSAJES DE UNA SEÑAL ---
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

    // --- ENVIAR MENSAJE (pasa por moderación IA automáticamente) ---
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
        // Rotación FIFO: máximo 30 mensajes
        if (mensajes.length > 30) mensajes = mensajes.slice(mensajes.length - 30);

        await env.UADAV_DB.put(`chat_${streamId}`, JSON.stringify(mensajes), { expirationTtl: 7200 });

        return new Response(JSON.stringify({ success: true, mensaje: nuevoMensaje }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // --- ANULACIÓN MANUAL DEL ADMIN NACIONAL (mostrar/ocultar mensaje) ---
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

    // --- PRE-AUDITORÍA IA DE UNA PUBLICACIÓN DE CARTELERA ---
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
        const admin = await verificarAdminRequest(request, env);
        if (!admin.valido) {
          return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: corsHeaders });
        }

        // Secciones que las delegaciones provinciales pueden editar (solo lo suyo)
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

          // Fuerza la provincia del delegado en cada item que envía (no puede tocar otras)
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

        // Administrador Nacional: control total, guarda tal cual viene
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
