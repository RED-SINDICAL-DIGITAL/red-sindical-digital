// ============================================================
// WORKER COMPLETO - UADAVSTREAM / BEATPLAY
// TODAS LAS RUTAS PARA FRONTEND, FORMULARIOS, TICKETERA Y CONSOLA
// ============================================================
export default {
  async fetch(request, env) {
    // Cabeceras CORS globales
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token, X-Profile-ID, X-Access-Code',
      'Access-Control-Allow-Credentials': 'true',
    };

    // Responder al Preflight de CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Función auxiliar para responder JSON con CORS
    function jsonResponse(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validador de Administrador Nacional
    function esAdminNacional(request) {
      const auth = request.headers.get('Authorization');
      return auth === `Bearer ${env.ADMIN_KEY}`;
    }

    // Validador de Administradores Provinciales (Federalización)
    async function obtenerProvinciaAdmin(request) {
      const auth = request.headers.get('Authorization');
      if (!auth) return null;
      if (auth === `Bearer ${env.ADMIN_KEY}`) return 'nacional';

      const token = auth.replace('Bearer ', '').trim();
      const delegacionesRaw = await env.UADAV_DB.get('delegaciones');
      if (delegacionesRaw) {
        const delegaciones = JSON.parse(delegacionesRaw);
        if (delegaciones[token]) {
          return delegaciones[token];
        }
      }
      return null;
    }

    // ============================================================
    // 1. PROTECCIÓN Y ACCESO AL PANEL ADMIN.HTML
    // ============================================================
    if (path === '/admin.html' || path === '/admin') {
      const token = url.searchParams.get('key');
      if (!env.ADMIN_KEY) {
        return new Response('Error: ADMIN_KEY no definida', { status: 500, headers: corsHeaders });
      }
      if (token !== env.ADMIN_KEY) {
        return new Response('Acceso denegado. Incluye ?key=TU_CLAVE', { status: 403, headers: corsHeaders });
      }
      const adminHtml = await env.UADAV_DB.get('admin_html');
      if (adminHtml === null) {
        return new Response('admin.html no está cargado en KV.', { status: 404, headers: corsHeaders });
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
    // 2. VERIFICACIÓN DE ADMIN (FEDERALIZACIÓN)
    // ============================================================
    if (path === '/api/admin_check') {
      const authHeader = request.headers.get('Authorization');
      if (authHeader === `Bearer ${env.ADMIN_KEY}`) {
        return jsonResponse({ success: true, role: 'admin_nacional' });
      }
      const delegaciones = await env.UADAV_DB.get('delegaciones');
      if (delegaciones) {
        const map = JSON.parse(delegaciones);
        const token = authHeader ? authHeader.replace('Bearer ', '') : null;
        if (token && map[token]) {
          return jsonResponse({ success: true, role: 'admin_provincial', provincia: map[token] });
        }
      }
      return jsonResponse({ error: 'No autorizado' }, 401);
    }

    // ============================================================
    // 3. ENDPOINTS PÚBLICOS Y DE CONFIGURACIÓN
    // ============================================================

    // --- VISITAS ---
    if (path === '/api/visits') {
      const current = await env.UADAV_DB.get('contadores');
      let contadores = current ? JSON.parse(current) : { visitas_totales: 0 };
      if (request.method === 'POST') {
        contadores.visitas_totales = (contadores.visitas_totales || 0) + 1;
        await env.UADAV_DB.put('contadores', JSON.stringify(contadores));
      }
      return jsonResponse(contadores);
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
        if (!esAdminNacional(request)) return jsonResponse({ error: 'No autorizado' }, 401);
        const body = await request.text();
        await env.UADAV_DB.put('landing_config', body);
        return jsonResponse({ success: true });
      }
    }

    // --- SUSCRIPTORES ---
    if (path === '/api/suscriptores') {
      if (request.method === 'POST') {
        const { email } = await request.json();
        if (!email || !email.includes('@')) {
          return jsonResponse({ error: 'Email inválido' }, 400);
        }
        const current = await env.UADAV_DB.get('suscriptores');
        let lista = current ? JSON.parse(current) : [];
        if (!lista.find(s => s.email === email)) {
          lista.push({ email, fecha: new Date().toISOString() });
          await env.UADAV_DB.put('suscriptores', JSON.stringify(lista));
        }
        return jsonResponse({ success: true });
      }
      if (request.method === 'GET') {
        if (!esAdminNacional(request)) return jsonResponse({ error: 'No autorizado' }, 401);
        const data = await env.UADAV_DB.get('suscriptores');
        return jsonResponse(data ? JSON.parse(data) : []);
      }
    }

    // --- EXPORTAR SUSCRIPTORES CSV ---
    if (path === '/api/suscriptores/export') {
      if (request.method === 'GET') {
        if (!esAdminNacional(request)) return jsonResponse({ error: 'No autorizado' }, 401);
        const data = await env.UADAV_DB.get('suscriptores');
        const lista = data ? JSON.parse(data) : [];
        let csv = 'Email,Fecha\n';
        lista.forEach(s => { csv += `${s.email},${s.fecha}\n`; });
        return new Response(csv, {
          headers: { ...corsHeaders, 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=suscriptores.csv' }
        });
      }
    }

    // ============================================================
    // 4. BÚSQUEDA Y EXTRACCIÓN DE VIDEOS (FAILBACK INVIDIOUS)
    // ============================================================

    // --- BÚSQUEDA EN YOUTUBE ---
    if (path === '/api/youtube/search') {
      const query = url.searchParams.get('q');
      if (!query) return jsonResponse([]);
      const cacheKey = `search_${query.toLowerCase().replace(/\s+/g, '_')}`;
      const cached = await env.UADAV_DB.get(cacheKey);
      if (cached) return new Response(cached, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const invidiousInstances = [
        'https://inv.nadeko.net',
        'https://invidious.nerdvpn.de',
        'https://yewtu.be',
        'https://invidious.tiekoetter.com'
      ];
      let resultados = null;

      for (const base of invidiousInstances) {
        try {
          const res = await fetch(`${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&fields=videoId,title,author,lengthSeconds,thumbnailUrl`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              resultados = data.map(item => ({
                id: item.videoId,
                titulo: item.title,
                categoria: 'Resultado',
                descripcion: item.author || 'Artista',
                duracion: item.lengthSeconds ? `${Math.floor(item.lengthSeconds/60)}:${(item.lengthSeconds%60).toString().padStart(2,'0')}` : 'HD',
                thumbnail: item.thumbnailUrl || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
                tipo: item.lengthSeconds && item.lengthSeconds <= 60 ? 'short' : 'video'
              }));
              break;
            }
          }
        } catch (e) { continue; }
      }

      if (!resultados && env.YOUTUBE_API_KEY) {
        try {
          const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${env.YOUTUBE_API_KEY}`);
          const searchData = await searchRes.json();
          if (!searchData.error) {
            const ids = searchData.items.map(item => item.id.videoId).join(',');
            const videoRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${env.YOUTUBE_API_KEY}`);
            const videoData = await videoRes.json();
            const durations = {};
            videoData.items.forEach(item => { durations[item.id] = item.contentDetails.duration; });
            resultados = searchData.items.map(item => {
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
          }
        } catch (e) { /* silencio */ }
      }

      if (resultados) {
        await env.UADAV_DB.put(cacheKey, JSON.stringify(resultados), { expirationTtl: 172800 });
        return jsonResponse(resultados);
      }
      return jsonResponse([]);
    }

    // --- VIDEOS DE CANAL ---
    if (path === '/api/channel_videos') {
      const channelId = url.searchParams.get('channel_id');
      if (!channelId) return jsonResponse({ error: 'Falta channel_id' }, 400);
      let cleanId = channelId.replace('/channel/', '').replace('/@', '').split('?')[0].split('&')[0];
      try {
        const res = await fetch(`https://inv.nadeko.net/api/v1/channels/${cleanId}/videos`, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map(v => ({ id: v.videoId, titulo: v.title }));
          return jsonResponse(mapped);
        }
      } catch (e) { /* fallback */ }
      try {
        const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${cleanId}`);
        const xml = await rssRes.text();
        const entries = xml.split('<entry>').slice(1);
        const videos = entries.map(entry => {
          const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
          const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
          return { id: idMatch ? idMatch[1] : null, titulo: titleMatch ? titleMatch[1] : 'Video' };
        }).filter(v => v.id);
        return jsonResponse(videos);
      } catch (e) {
        return jsonResponse([]);
      }
    }

    // ============================================================
    // 5. POSTULACIÓN, SUGERENCIA, BOOKING Y TICKETERA
    // ============================================================

    // --- POSTULACIÓN DE ARTISTAS ---
    if (path === '/api/artistas/postular') {
      if (request.method !== 'POST') return jsonResponse({ error: 'Método no permitido' }, 405);
      try {
        const body = await request.json();
        if (!body.nombre_artistico || !body.rubro || !body.email || !body.delegacion) {
          return jsonResponse({ error: 'Faltan campos gremiales obligatorios' }, 400);
        }
        const token = 'UADAV-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        const pendientesRaw = await env.UADAV_DB.get('postulaciones') || '[]';
        let pendientes = JSON.parse(pendientesRaw);
        pendientes.push({ ...body, token, estado: 'pendiente', fecha: new Date().toISOString() });
        await env.UADAV_DB.put('postulaciones', JSON.stringify(pendientes));
        await env.UADAV_DB.put(`token_${token}`, JSON.stringify({ youtube_id: body.youtube_id, email: body.email }), { expirationTtl: 86400 });
        return jsonResponse({ success: true, token });
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // --- VERIFICAR TOKEN EN BIO DE YOUTUBE ---
    if (path === '/api/verificar_token') {
      const token = url.searchParams.get('token');
      if (!token) return jsonResponse({ error: 'Falta token' }, 400);
      const tokenData = await env.UADAV_DB.get(`token_${token}`);
      if (!tokenData) return jsonResponse({ error: 'Token inválido' }, 400);
      const { youtube_id } = JSON.parse(tokenData);
      let bio = '';
      try {
        const res = await fetch(`https://inv.nadeko.net/api/v1/channels/${youtube_id}`);
        if (res.ok) {
          const data = await res.json();
          bio = data.description || '';
        } else {
          const apiRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${youtube_id}&key=${env.YOUTUBE_API_KEY}`);
          const apiData = await apiRes.json();
          if (apiData.items && apiData.items[0]) {
            bio = apiData.items[0].snippet.description || '';
          }
        }
      } catch (e) { /* silencio */ }
      if (bio.includes(token)) {
        return jsonResponse({ success: true, mensaje: 'Token verificado. Alta automática realizada.' });
      } else {
        return jsonResponse({ success: false, mensaje: 'Token no encontrado en la biografía.' });
      }
    }

    // --- SUGERENCIA DE CARTELERA ---
    if (path === '/api/cartelera/sugerir') {
      if (request.method !== 'POST') return jsonResponse({ error: 'Método no permitido' }, 405);
      try {
        const body = await request.json();
        if (!body.titulo || !body.fecha || !body.lugar) {
          return jsonResponse({ error: 'Faltan campos obligatorios' }, 400);
        }
        const pendienteRaw = await env.UADAV_DB.get('cartelera_pendiente') || '[]';
        let pendiente = JSON.parse(pendienteRaw);
        const nueva = { ...body, id: 'SHOW-' + Date.now(), estado: 'pendiente', fecha_creacion: new Date().toISOString() };
        if (env.GEMINI_API_KEY) {
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{ text: `Analiza esta propuesta de show y responde solo con un objeto JSON: {"aprobado_ia": true/false, "motivo": "texto corto"}. Título: "${body.titulo}", Descripción: "${body.descripcion || ''}"` }]
                }]
              })
            });
            const geminiData = await geminiRes.json();
            const textoIa = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const matchJson = textoIa.match(/\{.*\}/s);
            if (matchJson) {
              nueva.pre_auditoria_ia = JSON.parse(matchJson[0]);
            }
          } catch (e) { /* silencio */ }
        }
        pendiente.push(nueva);
        await env.UADAV_DB.put('cartelera_pendiente', JSON.stringify(pendiente));
        return jsonResponse({ success: true });
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // --- BOOKING CORPORATIVO ---
    if (path === '/api/booking') {
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          if (!body.cliente || !body.artista_id || !body.presupuesto) {
            return jsonResponse({ error: 'Faltan parámetros críticos' }, 400);
          }
          const tarifasRaw = await env.UADAV_DB.get('tarifas_minimas');
          const tarifaMinima = tarifasRaw ? JSON.parse(tarifasRaw).monto || 50000 : 50000;
          if (body.presupuesto < tarifaMinima) {
            return jsonResponse({ error: `El presupuesto está por debajo del piso mínimo sindical de $${tarifaMinima}` }, 400);
          }
          const solicitudesRaw = await env.UADAV_DB.get('solicitudes_contratacion') || '[]';
          let solicitudes = JSON.parse(solicitudesRaw);
          const gestionId = `BK-${Date.now()}`;
          solicitudes.push({ ...body, id: gestionId, estado: 'pendiente', fecha_solicitud: new Date().toISOString() });
          await env.UADAV_DB.put('solicitudes_contratacion', JSON.stringify(solicitudes));
          // Enviar alerta
          await fetch(`${url.origin}/api/alertas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensaje: `💼 NUEVA SOLICITUD DE BOOKING: Cliente "${body.cliente}" - Artista ID "${body.artista_id}" - $${body.presupuesto}. ID: ${gestionId}`, tipo: 'recaudacion' })
          });
          const linkPagoSena = `https://link.mercadopago.com.ar/pagar?monto=${body.presupuesto * 0.1}`;
          return jsonResponse({ success: true, gestion_id: gestionId, link_pago: linkPagoSena });
        } catch (e) {
          return jsonResponse({ error: e.message }, 500);
        }
      }
      if (request.method === 'GET') {
        if (!esAdminNacional(request)) return jsonResponse({ error: 'No autorizado' }, 401);
        const data = await env.UADAV_DB.get('solicitudes_contratacion') || '[]';
        return jsonResponse(JSON.parse(data));
      }
    }

    // --- TICKETERA ---
    if (path === '/api/ticketera') {
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const monto = body.monto || 0;
          const serviceFee = monto * 0.10;
          const neto = monto - serviceFee;
          const ticketId = 'TICK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
          const transaccionesRaw = await env.UADAV_DB.get('transacciones_ticketera') || '[]';
          let transacciones = JSON.parse(transaccionesRaw);
          transacciones.push({ ...body, ticketId, serviceFee, neto, estado: 'pagado', fecha: new Date().toISOString() });
          await env.UADAV_DB.put('transacciones_ticketera', JSON.stringify(transacciones));
          return jsonResponse({ success: true, ticketId, qrData: `UADAVSTREAM-VALIDEZ-${ticketId}`, serviceFee, neto });
        } catch (e) {
          return jsonResponse({ error: e.message }, 500);
        }
      }
      if (request.method === 'GET') {
        if (!esAdminNacional(request)) return jsonResponse({ error: 'No autorizado' }, 401);
        const data = await env.UADAV_DB.get('transacciones_ticketera') || '[]';
        return jsonResponse(JSON.parse(data));
      }
    }

    // --- ALERTAS (SLACK / NTFY) ---
    if (path === '/api/alertas') {
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const alertasRaw = await env.UADAV_DB.get('alertas_sistema_control') || '[]';
          let alertas = JSON.parse(alertasRaw);
          alertas.push({ ...body, fecha: new Date().toISOString(), leida: false });
          await env.UADAV_DB.put('alertas_sistema_control', JSON.stringify(alertas));
          if (env.SLACK_WEBHOOK_URL) {
            await fetch(env.SLACK_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: `🚨 CONSOLA UADAV: ${body.mensaje || 'Nueva alerta'}` })
            });
          }
          if (env.NTFY_TOPIC) {
            await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
              method: 'POST',
              headers: { 'Title': 'UADAVSTREAM OPERACIONES', 'Priority': 'high' },
              body: body.mensaje || 'Alerta entrante'
            });
          }
          return jsonResponse({ success: true });
        } catch (e) {
          return jsonResponse({ error: e.message }, 500);
        }
      }
      if (request.method === 'GET') {
        if (!esAdminNacional(request)) return jsonResponse({ error: 'No autorizado' }, 401);
        const data = await env.UADAV_DB.get('alertas_sistema_control') || '[]';
        return jsonResponse(JSON.parse(data));
      }
    }

    // --- MODERACIÓN DE CHAT CON GEMINI ---
    if (path === '/api/moderar_chat') {
      if (request.method !== 'POST') return jsonResponse({ error: 'Método no permitido' }, 405);
      try {
        const { mensaje, id_stream, alias } = await request.json();
        if (!mensaje) return jsonResponse({ error: 'Mensaje vacío' }, 400);
        let moderado = false;
        if (env.GEMINI_API_KEY) {
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{ text: `Analiza si este mensaje de chat contiene insultos graves, discriminación o acoso. Responde solo con "APROBADO" o "RECHAZADO": "${mensaje}"` }]
                }]
              })
            });
            const geminiData = await geminiRes.json();
            const respuestaIa = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (respuestaIa.includes('RECHAZADO')) moderado = true;
          } catch (e) { /* fallback manual */ }
        }
        const keyChat = `chat_${id_stream || 'general'}`;
        const chatRaw = await env.UADAV_DB.get(keyChat) || '[]';
        let mensajes = JSON.parse(chatRaw);
        mensajes.push({ alias: alias || 'Espectador', mensaje, moderado, fecha: new Date().toISOString() });
        if (mensajes.length > 30) mensajes = mensajes.slice(-30);
        await env.UADAV_DB.put(keyChat, JSON.stringify(mensajes), { expirationTtl: 7200 });
        return jsonResponse({ moderado, aprobado: !moderado });
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // --- FILTRO DE GRILLA COMPARTIDO ---
    if (path === '/api/filtro_grilla') {
      if (request.method === 'GET') {
        const data = await env.UADAV_DB.get('filtro_grilla');
        return jsonResponse(data ? JSON.parse(data) : {});
      }
      if (request.method === 'POST') {
        if (!esAdminNacional(request)) return jsonResponse({ error: 'No autorizado' }, 401);
        const body = await request.text();
        await env.UADAV_DB.put('filtro_grilla', body);
        return jsonResponse({ success: true });
      }
    }

    // --- EXPORTAR PLANILLA SADAIC / AADI CAPIF ---
    if (path === '/api/exportar_planilla') {
      if (request.method === 'GET') {
        if (!esAdminNacional(request)) return jsonResponse({ error: 'No autorizado' }, 401);
        const data = await env.UADAV_DB.get('reproducciones') || '[]';
        const lista = JSON.parse(data);
        let csv = 'Artista,Cancion,Fecha,Plataforma\n';
        lista.forEach(r => {
          csv += `${r.artista || ''},${r.cancion || ''},${r.fecha || ''},${r.plataforma || 'UADAVSTREAM'}\n`;
        });
        return new Response(csv, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=planilla_reproducciones.csv'
          }
        });
      }
    }

    // --- TARIFAS MÍNIMAS ---
    if (path === '/api/tarifas_minimas') {
      if (request.method === 'GET') {
        const data = await env.UADAV_DB.get('tarifas_minimas');
        return jsonResponse(data ? JSON.parse(data) : {});
      }
      if (request.method === 'POST') {
        if (!esAdminNacional(request)) return jsonResponse({ error: 'No autorizado' }, 401);
        const body = await request.text();
        await env.UADAV_DB.put('tarifas_minimas', body);
        return jsonResponse({ success: true });
      }
    }

    // --- DELEGACIONES (FEDERALIZACIÓN) ---
    if (path === '/api/delegaciones') {
      if (request.method === 'GET') {
        const data = await env.UADAV_DB.get('delegaciones');
        return jsonResponse(data ? JSON.parse(data) : {});
      }
      if (request.method === 'POST') {
        if (!esAdminNacional(request)) return jsonResponse({ error: 'No autorizado' }, 401);
        const body = await request.text();
        await env.UADAV_DB.put('delegaciones', body);
        return jsonResponse({ success: true });
      }
    }

    // --- POSTULACIONES (LISTA PARA ADMIN) ---
    if (path === '/api/postulaciones') {
      if (request.method === 'GET') {
        if (!esAdminNacional(request)) return jsonResponse({ error: 'No autorizado' }, 401);
        const data = await env.UADAV_DB.get('postulaciones') || '[]';
        return jsonResponse(JSON.parse(data));
      }
    }

    // ============================================================
    // 6. ENDPOINT GENÉRICO (para secciones, radios, artistas, etc.)
    // ============================================================
    const key = path.replace('/api/', '').replace(/\//g, '_') || 'config';
    try {
      if (request.method === 'GET') {
        const data = await env.UADAV_DB.get(key);
        if (data) {
          return new Response(data, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } else {
          const fallbacksObjetos = ['config', 'contadores', 'apariencia', 'estado_sitio', 'config_app', 'tarifas_minimas', 'delegaciones', 'landing_config'];
          const emptyValue = fallbacksObjetos.includes(key) ? {} : [];
          return jsonResponse(emptyValue);
        }
      }
      if (request.method === 'POST' || request.method === 'PUT') {
        if (!esAdminNacional(request)) return jsonResponse({ error: 'No autorizado' }, 401);
        const bodyText = await request.text();
        await env.UADAV_DB.put(key, bodyText);
        return jsonResponse({ success: true, key_actualizada: key });
      }
      return jsonResponse({ error: 'Método no permitido' }, 405);
    } catch (e) {
      return jsonResponse({ error: 'Error en enrutador KV: ' + e.message }, 500);
    }
  }
};
