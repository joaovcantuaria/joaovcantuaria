// ========================================
// PAINEL ADMIN - JOAOZINHO ROTEIRISTA
// Usa showToast, formatCurrency, formatDate e esc do admin.js
// ========================================

// Preco oficial do Claude Opus 5.5 (US$ por milhao de tokens), so para estimativa
const RT_USD_IN = 4;
const RT_USD_OUT = 20;

async function loadRoteirista() {
    document.getElementById('rtWebhookUrl').textContent = `${SUPABASE_URL}/functions/v1/swift-responder`;
    loadRtConfig();
    loadRtStats();
    loadRtUsuarios();
    loadRtPagamentos();
}

async function loadRtConfig() {
    const { data, error } = await supabase.rpc('rt_config_ver');
    if (error) {
        showToast('Rode o supabase/ROTEIRISTA.sql no Supabase primeiro.', 'error');
        return;
    }
    document.getElementById('rtBaseUrl').value = data.ia_base_url || '';
    document.getElementById('rtModelo').value = data.ia_modelo || '';
    document.getElementById('rtEsforco').value = data.ia_esforco || 'medium';
    document.getElementById('rtBusca').value = String(data.ia_busca_web);
    document.getElementById('rtAtivo').value = String(data.ativo);
    document.getElementById('rtPreco1').value = data.preco_1;
    document.getElementById('rtPreco5').value = data.preco_5;
    document.getElementById('rtKeyAtual').textContent = data.ia_api_key ? `(atual: ${data.ia_api_key})` : '(nao configurada)';
    document.getElementById('rtMpAtual').textContent = data.mp_access_token ? `(atual: ${data.mp_access_token})` : '(nao configurado)';
    document.getElementById('rtApiKey').value = '';
    document.getElementById('rtMpToken').value = '';
}

document.getElementById('rtConfigForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const baseUrl = document.getElementById('rtBaseUrl').value.trim();
    if (baseUrl && !/^https:\/\//i.test(baseUrl)) {
        showToast('O endereco da API precisa comecar com https://', 'error');
        return;
    }
    const payload = {
        ia_base_url: baseUrl,
        ia_api_key: document.getElementById('rtApiKey').value.trim(),
        ia_modelo: document.getElementById('rtModelo').value.trim(),
        ia_esforco: document.getElementById('rtEsforco').value,
        ia_busca_web: document.getElementById('rtBusca').value === 'true',
        ativo: document.getElementById('rtAtivo').value === 'true',
        mp_access_token: document.getElementById('rtMpToken').value.trim(),
        preco_1: Number(document.getElementById('rtPreco1').value) || null,
        preco_5: Number(document.getElementById('rtPreco5').value) || null,
    };
    const { error } = await supabase.rpc('rt_config_salvar', { p: payload });
    if (error) { showToast('Erro ao salvar: ' + error.message, 'error'); return; }
    showToast('Configuracao salva!');
    loadRtConfig();
});

document.getElementById('rtCreditoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('rtCredEmail').value.trim();
    const qtd = parseInt(document.getElementById('rtCredQtd').value, 10);
    if (!email || !(qtd > 0)) return;
    const { data, error } = await supabase.rpc('rt_admin_creditar', { p_email: email, p_qtd: qtd });
    if (error) {
        showToast(error.message.includes('nao encontrado') ? 'Nenhuma conta com esse e-mail.' : 'Erro: ' + error.message, 'error');
        return;
    }
    showToast(`Creditos adicionados! Saldo agora: ${data}`);
    document.getElementById('rtCredEmail').value = '';
    loadRtUsuarios();
});

async function loadRtStats() {
    const [{ data: pags }, { data: rots }] = await Promise.all([
        supabase.from('rt_pagamentos').select('valor').eq('status', 'aprovado'),
        supabase.from('rt_roteiros').select('input_tokens, output_tokens'),
    ]);
    const receita = (pags || []).reduce((s, p) => s + Number(p.valor), 0);
    const custo = (rots || []).reduce((s, r) => s + (r.input_tokens * RT_USD_IN + r.output_tokens * RT_USD_OUT) / 1e6, 0);
    document.getElementById('rtStatReceita').textContent = formatCurrency(receita);
    document.getElementById('rtStatRoteiros').textContent = (rots || []).length;
    document.getElementById('rtStatCusto').textContent = 'US$ ' + custo.toFixed(2).replace('.', ',');
}

async function loadRtUsuarios() {
    const tbody = document.getElementById('rtUsuariosBody');
    const { data, error } = await supabase.rpc('rt_admin_usuarios');
    if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">Nenhum usuario ainda</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(u => `<tr>
        <td>${esc(u.email)}</td>
        <td><strong style="color:var(--gold);">${u.saldo}</strong></td>
        <td>${u.roteiros}</td>
        <td>${formatCurrency(u.comprado)}</td>
        <td>${formatDate(u.criado_em)}</td>
    </tr>`).join('');
}

async function loadRtPagamentos() {
    const tbody = document.getElementById('rtPagamentosBody');
    const { data } = await supabase.from('rt_pagamentos').select('*').order('created_at', { ascending: false }).limit(100);
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">Nenhum pagamento ainda</td></tr>';
        return;
    }
    const badge = { aprovado: 'badge-success', pendente: 'badge-warning', recusado: 'badge-danger' };
    tbody.innerHTML = data.map(p => `<tr>
        <td>${esc(p.email || '-')}</td>
        <td>${p.quantidade} roteiro${p.quantidade > 1 ? 's' : ''}</td>
        <td>${formatCurrency(p.valor)}</td>
        <td><span class="badge ${badge[p.status] || ''}">${esc(p.status)}</span></td>
        <td>${formatDate(p.created_at)}</td>
    </tr>`).join('');
}
