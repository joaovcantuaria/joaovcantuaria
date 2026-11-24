// ========================================
// PAINEL ADMIN - LINKS DE PAGAMENTO (cartao de credito)
// Usa showToast, formatCurrency, formatDate e esc do admin.js
// ========================================

// Nome da Edge Function como publicada no Supabase
const PG_FUNCAO = 'pg-links';

let pgLinks = [];

async function loadPagamentos() {
    const tbody = document.getElementById('pgTableBody');
    const { data, error } = await supabase.from('pg_links').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">Rode o supabase/LINKS_PAGAMENTO.sql no Supabase primeiro.</td></tr>';
        return;
    }
    pgLinks = data || [];

    const agora = new Date();
    const pago = pgLinks.filter(l => l.status === 'pago').reduce((s, l) => s + Number(l.valor), 0);
    const aberto = pgLinks.filter(l => l.status === 'aberto' && !(l.expira_em && new Date(l.expira_em) < agora)).reduce((s, l) => s + Number(l.valor), 0);
    document.getElementById('pgStatPago').textContent = formatCurrency(pago);
    document.getElementById('pgStatAberto').textContent = formatCurrency(aberto);

    if (pgLinks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">Nenhum link criado ainda</td></tr>';
        return;
    }
    tbody.innerHTML = pgLinks.map((l, i) => {
        const expirado = l.status === 'aberto' && l.expira_em && new Date(l.expira_em) < agora;
        const status = l.status === 'pago'
            ? `<span class="badge badge-success">Pago${l.parcelas_pagas > 1 ? ` em ${l.parcelas_pagas}x` : ''}</span>`
            : l.status === 'cancelado' ? '<span class="badge badge-danger">Cancelado</span>'
            : expirado ? '<span class="badge badge-danger">Expirado</span>'
            : '<span class="badge badge-warning">Aguardando</span>';
        const podeAgir = l.status === 'aberto' && !expirado;
        return `<tr>
            <td>${esc(l.descricao)}<br><small style="color:var(--white-dim);font-family:monospace;">${esc(l.codigo)}</small></td>
            <td>${esc(l.cliente_nome || '-')}</td>
            <td>${formatCurrency(l.valor)}${l.max_parcelas > 1 ? `<br><small style="color:var(--white-dim);">ate ${l.max_parcelas}x</small>` : ''}</td>
            <td>${status}</td>
            <td>${formatDate(l.created_at)}</td>
            <td>
                <button class="tbl-btn" onclick="pgCopiar(${i})" title="Copiar link"><i class="fas fa-link"></i></button>
                ${podeAgir ? `<a class="tbl-btn" href="${esc(pgWhatsApp(l))}" target="_blank" rel="noopener" title="Enviar no WhatsApp"><i class="fab fa-whatsapp"></i></a>` : ''}
                ${podeAgir ? `<button class="tbl-btn danger" onclick="pgCancelar(${i})" title="Cancelar link"><i class="fas fa-ban"></i></button>` : ''}
            </td>
        </tr>`;
    }).join('');
}

const pgUrl = (codigo) => `${window.location.origin}/pagar/?c=${codigo}`;

function pgWhatsApp(link) {
    const nome = (link.cliente_nome || '').split(' ')[0];
    const msg = `Ola${nome ? ' ' + nome : ''}! Segue o link para pagamento de "${link.descricao}" (${formatCurrency(link.valor)}${link.max_parcelas > 1 ? `, em ate ${link.max_parcelas}x no cartao` : ''}):\n${pgUrl(link.codigo)}`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

async function pgChamar(body) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${PG_FUNCAO}`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.erro || `Erro ${res.status}. A funcao ${PG_FUNCAO} foi publicada no Supabase?`);
    return out;
}

document.getElementById('pgForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('pgCriar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
    try {
        const out = await pgChamar({
            acao: 'criar',
            descricao: document.getElementById('pgDescricao').value,
            valor: document.getElementById('pgValor').value,
            max_parcelas: document.getElementById('pgParcelas').value,
            cliente_nome: document.getElementById('pgNome').value,
            cliente_email: document.getElementById('pgEmail').value,
            validade_dias: document.getElementById('pgValidade').value,
        });
        const link = {
            codigo: out.codigo,
            descricao: document.getElementById('pgDescricao').value.trim(),
            valor: Number(document.getElementById('pgValor').value),
            max_parcelas: Number(document.getElementById('pgParcelas').value),
            cliente_nome: document.getElementById('pgNome').value.trim(),
        };
        document.getElementById('pgUrl').value = pgUrl(out.codigo);
        document.getElementById('pgWpp').href = pgWhatsApp(link);
        document.getElementById('pgResultado').hidden = false;
        document.getElementById('pgForm').reset();
        showToast('Link criado!');
        loadPagamentos();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-link"></i> Gerar link';
    }
});

document.getElementById('pgCopiar').addEventListener('click', () => {
    copyToClipboard(document.getElementById('pgUrl').value);
});

function pgCopiar(i) {
    copyToClipboard(pgUrl(pgLinks[i].codigo));
}

async function pgCancelar(i) {
    const l = pgLinks[i];
    if (!confirm(`Cancelar o link "${l.descricao}" de ${formatCurrency(l.valor)}?\n\nO cliente nao conseguira mais pagar por ele.`)) return;
    try {
        await pgChamar({ acao: 'cancelar', id: l.id });
        showToast('Link cancelado.');
        loadPagamentos();
    } catch (err) {
        showToast(err.message, 'error');
    }
}
