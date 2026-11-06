// ========================================
// JOAOZINHO ROTEIRISTA: aviso de pagamento do Mercado Pago
// Nao confia no corpo do aviso: consulta o pagamento direto na API do
// Mercado Pago e so libera creditos se estiver aprovado e com o valor certo.
// ========================================
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
    const ok = () => new Response('ok', { status: 200 });
    const url = new URL(req.url);

    let body: Record<string, any> = {};
    try { body = await req.json(); } catch { /* aviso sem corpo */ }

    // O Mercado Pago manda o id em formatos diferentes conforme o tipo de aviso
    const tipo = body.type || body.topic || url.searchParams.get('type') || url.searchParams.get('topic');
    const paymentId = String(body.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id') || '');
    if (tipo !== 'payment' || !/^\d+$/.test(paymentId)) return ok();

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
        auth: { persistSession: false },
    });
    const { data: cfg } = await admin.from('rt_config').select('mp_access_token').eq('id', 1).single();
    if (!cfg?.mp_access_token) return new Response('nao configurado', { status: 500 });

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${cfg.mp_access_token}` },
    });
    if (!res.ok) {
        console.error('rt-webhook consulta MP:', res.status);
        return new Response('erro', { status: 502 }); // o Mercado Pago tenta de novo
    }
    const pagamento = await res.json();

    const ref = String(pagamento.external_reference || '');
    if (!/^[0-9a-f-]{36}$/i.test(ref)) return ok();

    const { data: pedido } = await admin.from('rt_pagamentos').select('id, valor, status').eq('id', ref).single();
    if (!pedido) return ok();

    if (pagamento.status === 'approved') {
        if (Math.abs(Number(pagamento.transaction_amount) - Number(pedido.valor)) > 0.01) {
            console.error('rt-webhook valor diferente:', ref, pagamento.transaction_amount, pedido.valor);
            return ok();
        }
        await admin.rpc('rt_aprovar_pagamento', { p_id: ref, p_mp_payment_id: paymentId });
    } else if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(pagamento.status) && pedido.status === 'pendente') {
        await admin.from('rt_pagamentos').update({ status: 'recusado', mp_payment_id: paymentId }).eq('id', ref);
    }

    return ok();
});
