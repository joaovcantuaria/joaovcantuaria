// ========================================
// META API DE CONVERSOES (server-side)
// O token fica no segredo META_CAPI_TOKEN, nunca no navegador.
// ========================================

const PIXEL_ID = '1637637344613171';
const ALLOWED_EVENTS = ['PageView', 'Lead', 'Purchase'];
const ALLOWED_ORIGINS = [
    'https://www.joaovcantuaria.com',
    'https://joaovcantuaria.com',
];

function corsHeaders(origin: string | null) {
    const allowed = origin && (ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'));
    return {
        'Access-Control-Allow-Origin': allowed ? origin! : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Vary': 'Origin',
    };
}

async function sha256(value?: string) {
    if (!value) return undefined;
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value.toLowerCase().trim()));
    return [Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')];
}

Deno.serve(async (req) => {
    const origin = req.headers.get('origin');
    const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' };

    if (req.method === 'OPTIONS') return new Response('ok', { headers });
    if (req.method !== 'POST') return new Response('{"error":"method"}', { status: 405, headers });

    const token = Deno.env.get('META_CAPI_TOKEN');
    if (!token) return new Response('{"error":"not configured"}', { status: 500, headers });

    let body: Record<string, any>;
    try { body = await req.json(); } catch { return new Response('{"error":"json"}', { status: 400, headers }); }

    if (!ALLOWED_EVENTS.includes(body.event_name)) {
        return new Response('{"error":"event"}', { status: 400, headers });
    }

    const payload = {
        data: [{
            event_name: body.event_name,
            event_id: typeof body.event_id === 'string' ? body.event_id.slice(0, 64) : undefined,
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: typeof body.event_source_url === 'string' ? body.event_source_url.slice(0, 500) : undefined,
            action_source: 'website',
            user_data: {
                em: await sha256(body.email),
                ph: await sha256(typeof body.telefone === 'string' ? body.telefone.replace(/\D/g, '') : undefined),
                client_ip_address: req.headers.get('x-forwarded-for')?.split(',')[0].trim(),
                client_user_agent: req.headers.get('user-agent') ?? undefined,
                fbp: body.fbp || undefined,
                fbc: body.fbc || undefined,
            },
            custom_data: {
                content_name: typeof body.content_name === 'string' ? body.content_name.slice(0, 100) : undefined,
                currency: 'BRL',
                value: 0,
            },
        }],
    };

    const res = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    return new Response(JSON.stringify({ ok: res.ok }), { status: res.ok ? 200 : 502, headers });
});
