export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const apiBase = env.TABLE_API_BASE || '';
    if (!apiBase) return new Response('TABLE_API_BASE not configured', { status: 500 });

    // Proxy /tables/* paths to the API
    if (url.pathname.startsWith('/tables/')) {
      const target = apiBase + url.pathname + (url.search || '');
      const init = {
        method: request.method,
        headers: request.headers,
        body: request.body
      };
      const res = await fetch(target, init);
      const body = await res.arrayBuffer();
      const resp = new Response(body, { status: res.status, headers: res.headers });
      return resp;
    }

    // Default: serve static (not implemented in worker) or return 404
    return new Response('Not found', { status: 404 });
  }
};
