// ★ UADAV STREAM · API centralizada
// Cuando api.uadavstream.com.ar esté asociado al Worker, cambie SOLO esta URL.
window.UADAV_API_BASE = window.UADAV_API_BASE || 'https://uadav-api.uadavstream.workers.dev/api/';
// /api/ en el mismo dominio queda desactivado hasta que exista una Route de Cloudflare válida.
window.UADAV_USE_LOCAL_API = window.UADAV_USE_LOCAL_API === true;
