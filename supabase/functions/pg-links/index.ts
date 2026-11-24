// ========================================
// LINKS DE PAGAMENTO (cartao de credito via Mercado Pago Checkout Pro)
// Publicar no Supabase com o nome exato: pg-links  (Verify JWT desligado)
//
// Painel admin (com login de admin):
//   {"acao":"criar","descricao":"...","valor":350,"max_parcelas":6,"cliente_nome":"...","cliente_email":"...","validade_dias":7}
//   {"acao":"cancelar","id":"<uuid>"}
// Mercado Pago (aviso de pagamento): POST /functions/v1/pg-links?origem=mp
// ========================================
import { createClient } from 'npm:@supabase/supabase-js@2';

const NOME_FUNCAO = 'pg-links';
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

// Codigo curto e facil de ler (sem 0/O, 1/I)
function gerarCodigo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    return Array.from(bytes, b => chars[b % chars.length]).join('');
}

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

Deno.serve(async (req) => {
    const headers = { ...cors(req.headers.get('origin')), 'Content-Type': 'application/json' };
    if (req.method === 'OPTIONS') return new Response('ok', { headers });
    const json = (obj: unknown, status = 200) => new Response(JSON.stringify(obj), { status, headers });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
        auth: { persistSession: false },
    });
    const { data: cfg } = await admin.from('rt_config').select('mp_access_token').eq('id', 1).single();
    const token = cfg?.mp_access_token;

    const url = new URL(req.url);

    // ----------------------------------------
    // Aviso do Mercado Pago: confere o pagamento direto na API
    // ----------------------------------------
    if (url.searchParams.get('origem') === 'mp') {
        let body: Record<string, any> = {};
        try { body = await req.json(); } catch { /* aviso sem corpo */ }
        const tipo = body.type || body.topic || url.searchParams.get('type') || url.searchParams.get('topic');
        const paymentId = String(body.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id') || '');
        if (tipo !== 'payment' || !/^\d+$/.test(paymentId)) return new Response('ok');
        if (!token) return new Response('nao configurado', { status: 500 });

        const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return new Response('erro', { status: 502 }); // o Mercado Pago tenta de novo
        const pagamento = await res.json();

        const ref = String(pagamento.external_reference || '');
        if (!/^[0-9a-f-]{36}$/i.test(ref)) return new Response('ok');
        const { data: link } = await admin.from('pg_links').select('id, valor, status').eq('id', ref).single();
        if (!link) return new Response('ok');

        if (pagamento.status === 'approved' && link.status !== 'pago') {
            if (Math.abs(Number(pagamento.transaction_amount) - Number(link.valor)) > 0.01) {
                console.error('pg-links valor diferente:', ref, pagamento.transaction_amount, link.valor);
                return new Response('ok');
            }
            await admin.from('pg_links').update({
                status: 'pago',
                mp_payment_id: paymentId,
                parcelas_pagas: pagamento.installments || 1,
                pago_em: new Date().toISOString(),
            }).eq('id', ref);
        }
        return new Response('ok');
    }

    // ----------------------------------------
    // Acoes do painel: so admin
    // ----------------------------------------
    const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: userData } = await admin.auth.getUser(jwt);
    const user = userData?.user;
    if (!user) return json({ erro: 'Faca login no painel.' }, 401);
    const { data: ehAdmin } = await admin.from('admins').select('id').eq('id', user.id).maybeSingle();
    if (!ehAdmin) return json({ erro: 'Acesso negado.' }, 403);
    if (!token) return json({ erro: 'Configure o Access Token do Mercado Pago no painel (aba Roteirista).' }, 503);

    let body: Record<string, any>;
    try { body = await req.json(); } catch { return json({ erro: 'Dados invalidos.' }, 400); }

    if (body.acao === 'cancelar') {
        const { data: link } = await admin.from('pg_links').select('id, status, mp_preference_id').eq('id', String(body.id)).single();
        if (!link) return json({ erro: 'Link nao encontrado.' }, 404);
        if (link.status === 'pago') return json({ erro: 'Este link ja foi pago.' }, 400);
        // Expira a preferencia no Mercado Pago para ninguem pagar pelo endereco antigo
        if (link.mp_preference_id) {
            await fetch(`https://api.mercadopago.com/checkout/preferences/${link.mp_preference_id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ expires: true, expiration_date_to: new Date().toISOString() }),
            }).catch(err => console.error('pg-links cancelar MP:', err));
        }
        await admin.from('pg_links').update({ status: 'cancelado' }).eq('id', link.id);
        return json({ ok: true });
    }

    if (body.acao !== 'criar') return json({ erro: 'Acao invalida.' }, 400);

    const descricao = texto(body.descricao, 200);
    const valor = Math.round(Number(body.valor) * 100) / 100;
    const maxParcelas = Math.min(12, Math.max(1, Math.floor(Number(body.max_parcelas) || 1)));
    const clienteNome = texto(body.cliente_nome, 120);
    const clienteEmail = texto(body.cliente_email, 160);
    const validadeDias = Math.min(90, Math.max(0, Math.floor(Number(body.validade_dias) || 0)));

    if (!descricao) return json({ erro: 'Informe a descricao.' }, 400);
    if (!(valor >= 1)) return json({ erro: 'O valor minimo e R$ 1,00.' }, 400);
    if (clienteEmail && !/^\S+@\S+\.\S+$/.test(clienteEmail)) return json({ erro: 'E-mail do cliente invalido.' }, 400);

    const expiraEm = validadeDias ? new Date(Date.now() + validadeDias * 86400000) : null;

    // Grava primeiro: o id vira a referencia no Mercado Pago
    let codigo = gerarCodigo();
    let link: { id: string } | null = null;
    for (let tentativa = 0; tentativa < 3 && !link; tentativa++) {
        const { data, error } = await admin.from('pg_links').insert({
            codigo,
            descricao,
            valor,
            max_parcelas: maxParcelas,
            cliente_nome: clienteNome || null,
            cliente_email: clienteEmail || null,
            expira_em: expiraEm?.toISOString() ?? null,
        }).select('id').single();
        if (data) link = data;
        else if (error?.code === '23505') codigo = gerarCodigo(); // codigo repetido: gera outro
        else return json({ erro: 'Nao foi possivel criar o link.' }, 500);
    }
    if (!link) return json({ erro: 'Nao foi possivel criar o link.' }, 500);

    const paginaLink = `${SITE}/pagar/?c=${codigo}`;
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            items: [{ id: codigo, title: descricao, quantity: 1, unit_price: valor, currency_id: 'BRL' }],
            ...(clienteEmail ? { payer: { email: clienteEmail, name: clienteNome || undefined } } : {}),
            // Somente cartao de credito
            payment_methods: {
                excluded_payment_types: [
                    { id: 'ticket' }, { id: 'bank_transfer' }, { id: 'atm' }, { id: 'debit_card' }, { id: 'prepaid_card' },
                ],
                installments: maxParcelas,
            },
            external_reference: link.id,
            notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/${NOME_FUNCAO}?origem=mp`,
            back_urls: {
                success: `${paginaLink}&retorno=aprovado`,
                pending: `${paginaLink}&retorno=pendente`,
                failure: `${paginaLink}&retorno=falhou`,
            },
            auto_return: 'approved',
            statement_descriptor: 'JVCANTUARIA',
            ...(expiraEm ? { expires: true, expiration_date_to: expiraEm.toISOString() } : {}),
        }),
    });
    const pref = await res.json().catch(() => null);
    if (!res.ok || !pref?.init_point) {
        console.error('pg-links MP:', res.status, JSON.stringify(pref));
        await admin.from('pg_links').delete().eq('id', link.id);
        return json({ erro: 'O Mercado Pago recusou a criacao do link. Confira o Access Token.' }, 502);
    }

    await admin.from('pg_links').update({ mp_preference_id: pref.id, mp_init_point: pref.init_point }).eq('id', link.id);
    return json({ ok: true, id: link.id, codigo, url: paginaLink });
});
