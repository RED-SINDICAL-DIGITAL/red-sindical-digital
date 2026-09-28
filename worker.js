export default {
  async fetch(request, env) {
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
    const isAdmin = () => (request.headers.get('Authorization') || '') === `Bearer ${env.ADMIN_KEY}`;
    const getJSON = async (key, fallback) => {
      const raw = await env.UADAV_DB.get(key);
      if (!raw) return fallback;
      try { return JSON.parse(raw); } catch { return fallback; }
    };
    const putJSON = (key, value) => env.UADAV_DB.put(key, JSON.stringify(value));
    const getArray = (key) => getJSON(key, []);
    const getObject = (key) => getJSON(key, {});

    if (path === '/api/health') {
      return json({ ok: true, success: true, service: 'UADAVSTREAM', version: 'V6.4.2-candidate', kv: !!env.UADAV_DB, youtube_key: !!env.YOUTUBE_API_KEY, timestamp: new Date().toISOString() });
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
          id: 'EV-' + Date.now().toString(36).toUpperCase(),
          nombre: String(body?.nombre || body?.titulo || 'Evento').slice(0, 180),
          titulo: String(body?.titulo || body?.nombre || 'Evento').slice(0, 180),
          fecha: String(body?.fecha || '').slice(0, 80),
          lugar: String(body?.lugar || '').slice(0, 180),
          imagen: String(body?.imagen || '').slice(0, 500),
          trailer: String(body?.trailer || '').slice(0, 500),
          precio: String(body?.precio || '').slice(0, 80),
          link_compra: String(body?.link_compra || body?.link_ticketera || '').slice(0, 500),
          descripcion: String(body?.descripcion || '').slice(0, 2500),
          contacto_email: String(body?.contacto_email || '').slice(0, 160),
          creado_por: 'publico', estado: 'pending', fecha_creacion: new Date().toISOString()
        };
        const list = await getArray('eventos_pendientes');
        list.push(item);
        await putJSON('eventos_pendientes', list.slice(-1000));
        return json({ success: true, id: item.id });
      }
      if (request.method === 'GET') {
        if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
        return json(await getArray('eventos_pendientes'));
      }
      if (request.method === 'PUT') {
        if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
        const body = await request.json().catch(() => ({}));
        const list = await getArray('eventos_pendientes');
        const i = list.findIndex(x => String(x?.id) === String(body?.id));
        if (i < 0) return json({ error: 'Evento no encontrado' }, 404);
        const item = list[i];
        if (body?.action === 'approve') {
          const pub = await getArray('eventos_publicados');
          pub.push({ ...item, estado: 'published', publicado_en: new Date().toISOString() });
          await putJSON('eventos_publicados', pub);
        }
        list.splice(i, 1);
        await putJSON('eventos_pendientes', list);
        return json({ success: true });
      }
      return json({ error: 'Método no permitido' }, 405);
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
      const body = await request.json().catch(() => ({}));
      const channelId = String(body?.channel_id || '').trim();
      if (!channelId) return json({ error: 'channel_id requerido' }, 400);
      if (!env.YOUTUBE_API_KEY) return json({ error: 'YOUTUBE_API_KEY no configurada' }, 503);
      try {
        const qs = new URLSearchParams({part:'snippet,brandingSettings',id:channelId,key:env.YOUTUBE_API_KEY});
        const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${qs.toString()}`);
        const data = await res.json();
        const ch = data?.items?.[0];
        if (!ch) return json({ error: 'Canal no encontrado' }, 404);
        const artista = {
          id:'ART-'+channelId,
          tipo:'artista',
          nombre:ch.snippet?.title || 'Artista',
          nombre_artistico:ch.snippet?.title || 'Artista',
          rubro:'Artista de variedades',
          foto:ch.snippet?.thumbnails?.high?.url || ch.snippet?.thumbnails?.medium?.url || '',
          bio:ch.snippet?.description || '',
          canal:channelId,
          youtube_id:channelId,
          youtube_bio:ch.snippet?.description || '',
          visible:false,
          estado:'catalogo',
          afiliado_verificado:false,
          actualizado:new Date().toISOString()
        };
        const arr = await getArray('artistas');
        const i = arr.findIndex(x => String(x?.canal || x?.youtube_id || '') === channelId);
        if(i>=0) arr[i] = {...arr[i], ...artista}; else arr.push(artista);
        await putJSON('artistas',arr);
        return json({ success:true, artista:publicArtistFromItem(artista) });
      } catch(e) { return json({ error:String(e?.message || e) },502); }
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
      await env.UADAV_DB.put('secciones', await request.text());
      return json({ success: true });
    }

    if (path === '/api/banners') {
      if (request.method === 'GET') return json(await getObject('banners'));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      await env.UADAV_DB.put('banners', await request.text());
      return json({ success: true });
    }

    if (path === '/api/radios') {
      if (request.method === 'GET') return json(await getArray('radios'));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      await env.UADAV_DB.put('radios', await request.text());
      return json({ success: true });
    }

    if (path === '/api/senales' || path === '/api/senales_oficiales') {
      if (request.method === 'GET') return json(await getArray('senales_oficiales'));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      await env.UADAV_DB.put('senales_oficiales', await request.text());
      return json({ success: true });
    }

    if (path === '/api/artistas') {
      const sections = await getArray('secciones');
      const sec = sections.find(x => x && x.id === 'artistas');
      if (request.method === 'GET') return json(isAdmin() ? (sec?.items || []) : (sec?.items || []).filter(x => x && x.visible !== false));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      return json({ success: false, message: 'Use /api/secciones para modificar artistas.' }, 400);
    }

    if (path === '/api/cartelera' || path === '/api/cartelera_aprobada' || path === '/api/eventos_publicados') {
      const key = path === '/api/eventos_publicados' ? 'eventos_publicados' : 'cartelera_aprobada';
      if (request.method === 'GET') return json(await getArray(key));
      if (!isAdmin()) return json({ error: 'No autorizado' }, 401);
      await env.UADAV_DB.put(key, await request.text());
      return json({ success: true });
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
      if (!env.YOUTUBE_API_KEY) return json({ items: [], source: 'no_api_key', region, category: category || null });
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

      // 1) YouTube Data API oficial
      if (env.YOUTUBE_API_KEY) {
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

      // 2) Instancias Invidious: respaldo de las instancias que ya veníamos utilizando.
      const instances = [
        'https://invidious.nerdvpn.de',
        'https://yewtu.be',
        'https://invidious.tiekoetter.com'
      ];
      for (const base of ['https://invidious.nerdvpn.de','https://yewtu.be','https://invidious.tiekoetter.com']) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6500);
        try {
          const r = await fetch(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&page=1`, {
            signal: controller.signal,
            headers: { Accept:'application/json', 'User-Agent':'UADAVSTREAM/6.3.1' }
          });
          if (!r.ok) continue;
          const raw = await r.json();
          const arr = Array.isArray(raw) ? raw : [];
          const items = arr.map(v => ({
            id: String(v.videoId || v.id || '').trim(),
            titulo: v.title || 'Video',
            descripcion: v.author || v.authorId || 'YouTube',
            thumbnail: v.videoThumbnails?.find(t=>t?.quality==='high')?.url || v.videoThumbnails?.find(t=>t?.quality==='medium')?.url || v.videoThumbnails?.[0]?.url || '',
            categoria:'Resultado',
            duracion: Number(v.lengthSeconds || 0),
            tipo:'video'
          })).filter(x => x.id);
          if (items.length) {
            await env.UADAV_DB.put(cacheKey, JSON.stringify(items), { expirationTtl: 21600 });
            return new Response(JSON.stringify(items), { headers: { ...cors, 'X-UADAV-Search-Source':'invidious' } });
          }
        } catch {} finally { clearTimeout(timer); }
      }

      return new Response('[]', { headers: { ...cors, 'X-UADAV-Search-Source':'none' } });
    }

    // --- YOUTUBE / RESOLVER CANAL ---
    if (path === '/api/youtube/search_channel') {
      const name = String(url.searchParams.get('name') || '').trim();
      if (!name) return json({ channelId:null });
      const cacheKey = `channel_search_v631_${name.toLowerCase().replace(/\s+/g,'_').slice(0,100)}`;
      const cached = await env.UADAV_DB.get(cacheKey);
      if (cached) return new Response(cached, { headers: { ...cors, 'X-UADAV-Search-Source':'cache' } });
      if (!env.YOUTUBE_API_KEY) return json({ channelId:null, error:'YOUTUBE_API_KEY no configurada' });
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
      if (env.YOUTUBE_API_KEY) {
        try {
          const res=await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(q)}&type=video&key=${env.YOUTUBE_API_KEY}`);
          const data=await res.json();
          if(res.ok && !data.error && Array.isArray(data.items) && data.items.length){ result.source='youtube_api'; result.count=data.items.length; return json(result); }
          result.youtube_error=data?.error?.message || `HTTP ${res.status}`;
        } catch(e){ result.youtube_error=String(e?.message || e); }
      }
      for (const base of ['https://invidious.nerdvpn.de','https://yewtu.be','https://invidious.tiekoetter.com']) {
        const controller = new AbortController(); const timer=setTimeout(()=>controller.abort(),4000);
        try {
          const r=await fetch(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&page=1`,{signal:controller.signal,headers:{Accept:'application/json'}});
          if(!r.ok) continue; const arr=await r.json();
          if(Array.isArray(arr)&&arr.length){result.source='invidious';result.instance=base;result.count=Math.min(arr.length,24);return json(result);}
        } catch {} finally { clearTimeout(timer); }
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
      if(request.method==='GET') return json(list.filter(x=>x && (x.activo!==false)));
      if(!isAdmin()) return json({error:'No autorizado'},401);
      if(request.method==='POST'){
        const b=await request.json().catch(()=>({})); if(!b.titulo||!b.descripcion)return json({error:'Título y descripción son obligatorios'},400);
        const item={id:'JOB-'+Date.now().toString(36).toUpperCase(),creado:new Date().toISOString(),titulo:String(b.titulo).slice(0,160),rubro:String(b.rubro||'').slice(0,80),ciudad:String(b.ciudad||'').slice(0,100),fecha:String(b.fecha||'').slice(0,30),descripcion:String(b.descripcion).slice(0,2500),contacto:String(b.contacto||'').slice(0,300),activo:b.activo!==false}; list.push(item); await putJSON('bolsa_trabajo',list); return json({success:true,item});
      }
      if(request.method==='PUT'){const b=await request.json().catch(()=>({}));const i=list.findIndex(x=>String(x.id)===String(b.id));if(i<0)return json({error:'No encontrado'},404);Object.assign(list[i],b,{id:list[i].id});await putJSON('bolsa_trabajo',list);return json({success:true,item:list[i]});}
      if(request.method==='DELETE'){const b=await request.json().catch(()=>({}));const next=list.filter(x=>String(x.id)!==String(b.id));await putJSON('bolsa_trabajo',next);return json({success:true});}
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
      list.push(item); while(list.length>1000)list.shift(); await putJSON('postulaciones_trabajo',list); return json({success:true,item});
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
      bolsa_activa:a.afiliado_verificado===true
    });
    async function allCanonicalArtists(){
      const list=await getArray('artistas');
      const secs=await getArray('secciones');
      const out=[]; const seen=new Set();
      for(const a of Array.isArray(list)?list:[]){ const p=publicArtistFromItem(a); const k=String(p.id||p.canal||p.nombre).toLowerCase(); if(k&&!seen.has(k)){seen.add(k);out.push(a)} }
      for(const s of Array.isArray(secs)?secs:[]){ if(s?.tipo_contenido!=='perfiles') continue; for(const a of Array.isArray(s.items)?s.items:[]){const p=publicArtistFromItem(a);const k=String(p.id||p.canal||p.nombre).toLowerCase();if(k&&!seen.has(k)){seen.add(k);out.push({...a,id:p.id})}} }
      return out;
    }
    if(path==='/api/public/artistas' && request.method==='GET'){
      const arr=await allCanonicalArtists();
      return json(arr.map(publicArtistFromItem).filter(a=>a.visible && !['suspendido','bloqueado','oculto'].includes(String(a.estado||'').toLowerCase())));
    }
    if(path==='/api/public/artista' && request.method==='GET'){
      const id=String(url.searchParams.get('id')||'').trim().toLowerCase();
      const arr=await allCanonicalArtists();
      const found=arr.find(a=>[a.id,a.canal,a.nombre,a.nombre_artistico].some(v=>String(v||'').trim().toLowerCase()===id));
      if(!found) return json({error:'Artista no encontrado'},404);
      const p=publicArtistFromItem(found); if(!p.visible && !p.afiliado_verificado) return json({error:'Perfil no disponible'},404); return json(p);
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
      return json({ service: 'UADAVSTREAM', version: 'V6.4.2-candidate', architecture: 'Cloudflare KV', features: ['core-api', 'youtube-search', 'chat', 'banners', 'radios', 'senales', 'artistas', 'premium', 'home-layout', 'youtube-popular-regional','artist-center','artist-self-management','contracting','artist-content','job-board'] });
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
  }
};
