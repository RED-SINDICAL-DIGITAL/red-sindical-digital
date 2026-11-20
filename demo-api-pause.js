const publicReads = new Set(['/api/public/landing','/api/landing_config','/api/footer_config','/api/public/security','/api/admin_check']);
export function withDemoPause(platform) {
  return {
  ...platform,
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (request.method === 'OPTIONS' || (request.method === 'GET' && publicReads.has(path))) {
      return platform.fetch(request, env, ctx);
    }
    const unavailable = () => Response.json({error:'La demo está temporalmente en pausa.'},{
      status:503, headers:{'Cache-Control':'no-store','Retry-After':'60','Access-Control-Allow-Origin':'*'}
    });
    if (env.DEMO_EMERGENCY_PAUSE === '1') return unavailable();
    if (env.DEMO_DB || env.DEMO_GATE_REQUIRED === '1') {
      try {
        const state = await env.DEMO_DB.prepare('SELECT paused FROM demo_state WHERE id=1').first();
        if (state?.paused !== 0) return unavailable();
      } catch { return unavailable(); }
    }
    return platform.fetch(request, env, ctx);
  }
  };
}
