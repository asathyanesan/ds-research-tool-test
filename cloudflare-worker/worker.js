const FLYER_BASE = 'https://apim-n1ai-use2-flyer.azure-api.net';
const ALLOWED_ORIGIN = 'https://asathyanesan.github.io';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const path = url.pathname + url.search;

    // Only allow the two FlyerGPT endpoints
    const isOpenAI = path.startsWith('/openai/');
    const isAnthropic = path.startsWith('/anthropic/');
    if (!isOpenAI && !isAnthropic) {
      return new Response('Not found', { status: 404 });
    }

    const upstreamHeaders = new Headers();
    upstreamHeaders.set('Content-Type', 'application/json');

    if (isOpenAI) {
      upstreamHeaders.set('api-key', env.FLYER_API_KEY);
    } else {
      upstreamHeaders.set('x-api-key', env.FLYER_API_KEY);
      upstreamHeaders.set('anthropic-version', '2023-06-01');
    }

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

    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        ...CORS_HEADERS,
      },
    });
  },
};
