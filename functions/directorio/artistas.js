// Read-only bridge for the isolated preview. Only the public artist list is exposed.
export async function onRequestGet({ request }) {
  if (new URL(request.url).hostname !== 'integration-staging-preserve.uadav-stream-staging.pages.dev') {
    return new Response(null, { status: 404 });
  }
  try {
    const upstream = await fetch('https://uadav-api-staging.uadavstream.workers.dev/api/public/artistas', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000)
    });
    if (!upstream.ok) throw new Error('Directory unavailable');
    const rows = await upstream.json();
    if (!Array.isArray(rows)) throw new Error('Invalid directory');
    return Response.json(rows, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Directorio temporalmente no disponible' }, { status: 503 });
  }
}
