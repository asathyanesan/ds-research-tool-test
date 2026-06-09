const FLYER_BASE = 'https://apim-n1ai-use2-flyer.azure-api.net';
const ALLOWED_ORIGINS = new Set([
  'https://asathyanesan.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
]);

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://asathyanesan.github.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Expose-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
});

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const CORS_HEADERS = corsHeaders(origin);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const path = url.pathname + url.search;

    // Only allow OpenAI-style endpoints
    if (!path.startsWith('/openai/')) {
      return new Response('Not found', { status: 404 });
    }

    // Track monthly query count for monitoring (no hard block)
    // Requires QUERY_COUNTER KV namespace to be bound in wrangler.toml
    if (env.QUERY_COUNTER) {
      const now = new Date();
      const monthKey = `ym:${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
      const countStr = await env.QUERY_COUNTER.get(monthKey);
      const count = parseInt(countStr || '0');
      // Increment; expire after 35 days so old keys self-clean
      await env.QUERY_COUNTER.put(monthKey, String(count + 1), { expirationTtl: 35 * 24 * 60 * 60 });
    }

    const upstreamHeaders = new Headers();
    upstreamHeaders.set('Content-Type', 'application/json');
    upstreamHeaders.set('api-key', env.FLYER_API_KEY_2);

    let upstream;
    try {
      upstream = await fetch(`${FLYER_BASE}${path}`, {
        method: 'POST',
        headers: upstreamHeaders,
        body: request.body,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: { message: 'Upstream unreachable' } }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const responseBody = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('Content-Type') || 'application/json';

    // For streaming responses, pipe the body directly rather than buffering
    if (contentType.includes('text/event-stream') || contentType.includes('stream')) {
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
          'X-Accel-Buffering': 'no',
          ...CORS_HEADERS,
        },
      });
    }

    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        ...CORS_HEADERS,
      },
    });
  },
};
