export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    const url = new URL(request.url);
    // NORMALIZACIÓN: Elimina tildes automáticamente (señales -> senales)
    const path = url.pathname.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // ============================================================
    // 1. RUTAS ESPECÍFICAS
    // ============================================================
    if (path === '/api/visits') {
      if (request.method === 'POST' || request.method === 'GET') {
        const current = await env.UADAV_DB.get('contadores');
        const contadores = current ? JSON.parse(current) : { visitas_totales: 0 };
        if (request.method === 'POST') contadores.visitas_totales = (contadores.visitas_totales || 0) + 1;
        await env.UADAV_DB.put('contadores', JSON.stringify(contadores));
        return new Response(JSON.stringify(contadores), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (path === '/api/youtube/search') {
      const query = url.searchParams.get('q');
      if (!query) return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      
      const cacheKey = `search_${query.toLowerCase().replace(/\s+/g, '_')}`;
      const cached = await env.UADAV_DB.get(cacheKey);
      if (cached) return new Response(cached, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      try {
        // Fallback a Invidious primero (Cuota Cero)
        const instances = ['https://inv.nadeko.net', 'https://invidious.nerdvpn.de', 'https://yewtu.be', 'https://invidious.tiekoetter.com'];
        for (const inst of instances) {
          try {
            const res = await fetch(`${inst}/api/v1/search?q=${encodeURIComponent(query)}&type=video&limit=15`, { cf: { cacheTtl: 3600 } });
            if (res.ok) {
              const data = await res.json();
              const items = data.map(i => ({
                id: i.videoId, titulo: i.title, categoria: i.author || 'Desconocido',
                duracion: `${Math.floor((i.lengthSeconds||0)/60)}:${(i.lengthSeconds||0)%60}`.replace(/:\d$/, ':0$&'),
                thumbnail: i.videoThumbnails?.[0]?.url || '', tipo: (i.lengthSeconds||0) <= 60 ? 'short' : 'video'
              })).filter(v => v.id);
              await env.UADAV_DB.put(cacheKey, JSON.stringify(items), { expirationTtl: 86400 });
              return new Response(JSON.stringify(items), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
          } catch (e) { continue; }
        }
        
        // Si Invidious falla, usar YouTube API
        const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${env.YOUTUBE_API_KEY}`);
        const searchData = await searchRes.json();
        if (searchData.items) {
          const items = searchData.items.map(i => ({
            id: i.id.videoId, titulo: i.snippet.title, categoria: i.snippet.channelTitle,
            duracion: '0:00', thumbnail: i.snippet.thumbnails.high?.url || '', tipo: 'video'
          }));
          await env.UADAV_DB.put(cacheKey, JSON.stringify(items), { expirationTtl: 86400 });
          return new Response(JSON.stringify(items), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      } catch (e) { console.error(e); }
      return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (path === '/api/suscriptores' && request.method === 'POST') {
      const { email } = await request.json();
      if (email && email.includes('@')) {
        const current = await env.UADAV_DB.get('suscriptores');
        let lista = current ? JSON.parse(current) : [];
        if (!lista.find(s => s.email === email)) {
          lista.push({ email, fecha: new Date().toISOString() });
          await env.UADAV_DB.put('suscriptores', JSON.stringify(lista));
        }
      }
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // ============================================================
    // 2. ENDPOINT GENÉRICO (A prueba de 404)
    // ============================================================
    const key = path.replace('/api/', '').replace(/\//g, '_') || 'config';
    
    if (request.method === 'GET') {
      const data = await env.UADAV_DB.get(key);
      if (data) {
        return new Response(data, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      // SI NO EXISTE LA CLAVE, DEVUELVE 200 CON ARRAY VACÍO (NUNCA 404)
      return new Response(JSON.stringify([]), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405, headers: corsHeaders });
  }
};
