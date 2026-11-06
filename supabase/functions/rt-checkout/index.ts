// ========================================
// JOAOZINHO ROTEIRISTA: cria o pagamento no Mercado Pago (Checkout Pro)
// Body: {"pacote":"1"} ou {"pacote":"5"}  ->  {"url":"https://www.mercadopago.com.br/..."}
// ========================================
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = 'https://www.joaovcantuaria.com';
const ALLOWED_ORIGINS = [SITE, 'https://joaovcantuaria.com'];

function cors(origin: string | null) {
    const ok = origin && (ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('http://192.168.'));
    return {
        'Access-Control-Allow-Origin': ok ? origin! : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Vary': 'Origin',
    };
}

Deno.serve(async (req) => {
    const headers = { ...cors(req.headers.get('origin')), 'Content-Type': 'application/json' };
    if (req.method === 'OPTIONS') return new Response('ok', { headers });
    const json = (obj: unknown, status = 200) => new Response(JSON.stringify(obj), { status, headers });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
        auth: { persistSession: false },
    });

    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user) return json({ erro: 'Faca login para comprar.' }, 401);

    let pacote = '';
    try { pacote = String((await req.json()).pacote); } catch { /* invalido */ }
    if (pacote !== '1' && pacote !== '5') return json({ erro: 'Pacote invalido.' }, 400);

    const { data: cfg } = await admin.from('rt_config').select('mp_access_token, preco_1, preco_5, ativo').eq('id', 1).single();
    if (!cfg?.ativo || !cfg.mp_access_token) return json({ erro: 'Pagamentos indisponiveis no momento.' }, 503);

    const quantidade = pacote === '5' ? 5 : 1;
    const valor = Number(pacote === '5' ? cfg.preco_5 : cfg.preco_1);

    // Registra a compra pendente; o id vira a referencia no Mercado Pago
    const { data: pag, error } = await admin.from('rt_pagamentos').insert({
        user_id: user.id,
        email: user.email,
        pacote,
        quantidade,
        valor,
    }).select('id').single();
    if (error || !pag) return json({ erro: 'Nao foi possivel iniciar a compra.' }, 500);

    const webhook = `${Deno.env.get('SUPABASE_URL')}/functions/v1/swift-responder` /* codigo: rt-webhook */;
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${cfg.mp_access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            items: [{
                id: `roteirista-${pacote}`,
                title: quantidade === 1 ? 'Joaozinho Roteirista: 1 roteiro' : 'Joaozinho Roteirista: 5 roteiros',
                quantity: 1,
                unit_price: valor,
                currency_id: 'BRL',
            }],
            payer: { email: user.email },
            external_reference: pag.id,
            notification_url: webhook,
            back_urls: {
                success: `${SITE}/roteirista/?pagamento=aprovado`,
                pending: `${SITE}/roteirista/?pagamento=pendente`,
                failure: `${SITE}/roteirista/?pagamento=falhou`,
            },
            auto_return: 'approved',
            statement_descriptor: 'ROTEIRISTA',
        }),
    });

    const pref = await res.json().catch(() => null);
    if (!res.ok || !pref?.init_point) {
        console.error('rt-checkout MP:', res.status, JSON.stringify(pref));
        await admin.from('rt_pagamentos').update({ status: 'recusado' }).eq('id', pag.id);
        return json({ erro: 'Nao foi possivel abrir o pagamento. Tente de novo.' }, 502);
    }

    return json({ url: pref.init_point });
});
