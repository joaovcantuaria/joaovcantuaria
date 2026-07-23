// ========================================
// PAINEL ADMIN - JAVASCRIPT COMPLETO
// Layout premium com panels overlay
// ========================================

// ========================================
// PANEL NAVIGATION
// ========================================
function openPanel(panelId) {
    document.getElementById('panel-' + panelId).classList.add('active');
    document.body.style.overflow = 'hidden';
    loadPanelData(panelId);
}

function closePanel() {
    document.querySelectorAll('.panel-overlay.active').forEach(p => p.classList.remove('active'));
    document.body.style.overflow = '';
}

// Nav card clicks
document.querySelectorAll('.nav-card').forEach(card => {
    card.addEventListener('click', () => openPanel(card.dataset.panel));
});

// ESC to close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) { closeModal(); return; }
        closePanel();
    }
});

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if (confirm('Sair do painel?')) {
            await supabase.auth.signOut();
            window.location.href = 'admin-login.html';
        }
    });
}

// ========================================
// MODAL
// ========================================
function openModal(title, bodyHTML) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});

// ========================================
// TOAST
// ========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast-msg' + (type === 'error' ? ' error' : '');
    toast.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ========================================
// UTILITIES
// ========================================
function formatCurrency(value) {
    return 'R$ ' + Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

// ========================================
// LOAD PANEL DATA
// ========================================
function loadPanelData(panel) {
    switch(panel) {
        case 'clientes': loadClientes(); break;
        case 'projetos': loadProjetos(); break;
        case 'orcamentos': loadOrcamentos(); break;
        case 'fotografia': loadGalerias(); loadSelecoes(); break;
        case 'entregas': loadEntregas(); break;
        case 'financeiro': loadFinanceiro(); break;
        case 'portfolio': loadPortfolio(); break;
        case 'depoimentos': loadDepoimentos(); break;
        case 'configuracoes': loadConfiguracoes(); break;
    }
}

// ========================================
// DASHBOARD STATS
// ========================================
async function loadDashboardStats() {
    try {
        const { count: c1 } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
        document.getElementById('statClientes').textContent = c1 || 0;

        const { count: c2 } = await supabase.from('projetos').select('*', { count: 'exact', head: true }).eq('status', 'em_andamento');
        document.getElementById('statProjetos').textContent = c2 || 0;

        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        const { data: rec } = await supabase.from('transacoes').select('valor').eq('tipo', 'receita').gte('data', firstDay).lte('data', lastDay);
        const total = (rec || []).reduce((s, r) => s + Number(r.valor), 0);
        document.getElementById('statReceita').textContent = formatCurrency(total);

        const { count: c3 } = await supabase.from('galerias').select('*', { count: 'exact', head: true });
        document.getElementById('statFotos').textContent = c3 || 0;
    } catch (e) { console.error('Stats error:', e); }
}

// ========================================
// CLIENTES CRUD
// ========================================
async function loadClientes() {
    try {
        const { data, error } = await supabase.from('usuarios').select('*').order('nome_completo');
        if (error) throw error;
        const tbody = document.getElementById('clientesTableBody');
        if (!data || data.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="empty">Nenhum cliente cadastrado</td></tr>'; return; }
        tbody.innerHTML = data.map(c => `<tr>
            <td>${c.nome_completo || '-'}</td>
            <td>${c.email || '-'}</td>
            <td>${c.telefone || '-'}</td>
            <td>${c.empresa || '-'}</td>
            <td>
                <button class="tbl-btn" onclick="openEditClientModal('${c.id}')"><i class="fas fa-edit"></i></button>
                <button class="tbl-btn danger" onclick="deleteClient('${c.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
    } catch (e) { console.error(e); }
}

function openAddClientModal() {
    openModal('Novo Cliente', `<form class="modal-form" onsubmit="saveClient(event)">
        <input type="hidden" id="clientId" value="">
        <div class="form-group"><label>Nome Completo</label><input type="text" id="clientNome" required placeholder="Nome do cliente"></div>
        <div class="form-row">
            <div class="form-group"><label>Email</label><input type="email" id="clientEmail" placeholder="email@exemplo.com"></div>
            <div class="form-group"><label>Telefone</label><input type="text" id="clientTelefone" placeholder="(11) 99999-9999"></div>
        </div>
        <div class="form-group"><label>Empresa</label><input type="text" id="clientEmpresa" placeholder="Empresa"></div>
        <div class="form-actions"><button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button><button type="submit" class="btn-submit">Salvar</button></div>
    </form>`);
}

async function openEditClientModal(id) {
    const { data: c } = await supabase.from('usuarios').select('*').eq('id', id).single();
    if (!c) return;
    openModal('Editar Cliente', `<form class="modal-form" onsubmit="saveClient(event)">
        <input type="hidden" id="clientId" value="${c.id}">
        <div class="form-group"><label>Nome Completo</label><input type="text" id="clientNome" required value="${c.nome_completo||''}"></div>
        <div class="form-row">
            <div class="form-group"><label>Email</label><input type="email" id="clientEmail" value="${c.email||''}"></div>
            <div class="form-group"><label>Telefone</label><input type="text" id="clientTelefone" value="${c.telefone||''}"></div>
        </div>
        <div class="form-group"><label>Empresa</label><input type="text" id="clientEmpresa" value="${c.empresa||''}"></div>
        <div class="form-actions"><button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button><button type="submit" class="btn-submit">Salvar</button></div>
    </form>`);
}

async function saveClient(e) {
    e.preventDefault();
    const id = document.getElementById('clientId').value;
    const payload = { nome_completo: document.getElementById('clientNome').value, email: document.getElementById('clientEmail').value, telefone: document.getElementById('clientTelefone').value, empresa: document.getElementById('clientEmpresa').value };
    try {
        if (id) { await supabase.from('usuarios').update(payload).eq('id', id); showToast('Cliente atualizado!'); }
        else { await supabase.from('usuarios').insert([payload]); showToast('Cliente adicionado!'); }
        closeModal(); loadClientes(); loadDashboardStats();
    } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

async function deleteClient(id) {
    if (!confirm('Excluir este cliente?')) return;
    await supabase.from('usuarios').delete().eq('id', id);
    showToast('Cliente excluido!'); loadClientes(); loadDashboardStats();
}

// ========================================
// PROJETOS CRUD
// ========================================
async function loadProjetos() {
    try {
        const { data, error } = await supabase.from('projetos').select('*, usuarios(nome_completo)').order('created_at', { ascending: false });
        if (error) throw error;
        const tbody = document.getElementById('projetosTableBody');
        if (!data || data.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="empty">Nenhum projeto</td></tr>'; return; }
        const statusMap = { 'aguardando':'<span class="badge badge-warning">Aguardando</span>', 'em_andamento':'<span class="badge badge-info">Em Andamento</span>', 'em_revisao':'<span class="badge badge-purple">Em Revisao</span>', 'concluido':'<span class="badge badge-success">Concluido</span>' };
        tbody.innerHTML = data.map(p => `<tr>
            <td>${p.titulo || '-'}</td>
            <td>${p.usuarios?.nome_completo || '-'}</td>
            <td>${statusMap[p.status] || p.status}</td>
            <td><div class="progress-mini"><div class="progress-mini-fill" style="width:${p.progresso||0}%"></div></div><small>${p.progresso||0}%</small></td>
            <td>${formatDate(p.data_inicio || p.created_at)}</td>
            <td>
                <button class="tbl-btn" onclick="openEditProjectModal('${p.id}')"><i class="fas fa-edit"></i></button>
                <button class="tbl-btn danger" onclick="deleteProject('${p.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
    } catch (e) { console.error(e); }
}

async function getClientesOptions(selectedId) {
    const { data } = await supabase.from('usuarios').select('id, nome_completo').order('nome_completo');
    return (data || []).map(c => `<option value="${c.id}" ${c.id===selectedId?'selected':''}>${c.nome_completo||c.id}</option>`).join('');
}

async function openAddProjectModal() {
    const opts = await getClientesOptions();
    openModal('Novo Projeto', `<form class="modal-form" onsubmit="saveProject(event)">
        <input type="hidden" id="projectId" value="">
        <div class="form-group"><label>Titulo</label><input type="text" id="projectTitulo" required placeholder="Nome do projeto"></div>
        <div class="form-row">
            <div class="form-group"><label>Cliente</label><select id="projectCliente" required><option value="">Selecione...</option>${opts}</select></div>
            <div class="form-group"><label>Status</label><select id="projectStatus"><option value="aguardando">Aguardando</option><option value="em_andamento">Em Andamento</option><option value="em_revisao">Em Revisao</option><option value="concluido">Concluido</option></select></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Progresso (%)</label><input type="number" id="projectProgresso" min="0" max="100" value="0"></div>
            <div class="form-group"><label>Data Inicio</label><input type="date" id="projectDataInicio"></div>
        </div>
        <div class="form-group"><label>Descricao</label><textarea id="projectDescricao" rows="3" placeholder="Descricao..."></textarea></div>
        <div class="form-actions"><button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button><button type="submit" class="btn-submit">Salvar</button></div>
    </form>`);
}

async function openEditProjectModal(id) {
    const { data: p } = await supabase.from('projetos').select('*').eq('id', id).single();
    if (!p) return;
    const opts = await getClientesOptions(p.cliente_id);
    openModal('Editar Projeto', `<form class="modal-form" onsubmit="saveProject(event)">
        <input type="hidden" id="projectId" value="${p.id}">
        <div class="form-group"><label>Titulo</label><input type="text" id="projectTitulo" required value="${p.titulo||''}"></div>
        <div class="form-row">
            <div class="form-group"><label>Cliente</label><select id="projectCliente" required><option value="">Selecione...</option>${opts}</select></div>
            <div class="form-group"><label>Status</label><select id="projectStatus"><option value="aguardando" ${p.status==='aguardando'?'selected':''}>Aguardando</option><option value="em_andamento" ${p.status==='em_andamento'?'selected':''}>Em Andamento</option><option value="em_revisao" ${p.status==='em_revisao'?'selected':''}>Em Revisao</option><option value="concluido" ${p.status==='concluido'?'selected':''}>Concluido</option></select></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Progresso (%)</label><input type="number" id="projectProgresso" min="0" max="100" value="${p.progresso||0}"></div>
            <div class="form-group"><label>Data Inicio</label><input type="date" id="projectDataInicio" value="${p.data_inicio||''}"></div>
        </div>
        <div class="form-group"><label>Descricao</label><textarea id="projectDescricao" rows="3">${p.descricao||''}</textarea></div>
        <div class="form-actions"><button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button><button type="submit" class="btn-submit">Salvar</button></div>
    </form>`);
}

async function saveProject(e) {
    e.preventDefault();
    const id = document.getElementById('projectId').value;
    const payload = { titulo: document.getElementById('projectTitulo').value, cliente_id: document.getElementById('projectCliente').value, status: document.getElementById('projectStatus').value, progresso: parseInt(document.getElementById('projectProgresso').value)||0, data_inicio: document.getElementById('projectDataInicio').value||null, descricao: document.getElementById('projectDescricao').value };
    try {
        if (id) { await supabase.from('projetos').update(payload).eq('id', id); showToast('Projeto atualizado!'); }
        else { await supabase.from('projetos').insert([payload]); showToast('Projeto criado!'); }
        closeModal(); loadProjetos(); loadDashboardStats();
    } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

async function deleteProject(id) {
    if (!confirm('Excluir este projeto?')) return;
    await supabase.from('projetos').delete().eq('id', id);
    showToast('Projeto excluido!'); loadProjetos(); loadDashboardStats();
}

// ========================================
// ORCAMENTOS
// ========================================
async function loadOrcamentos() {
    try {
        const { data, error } = await supabase.from('orcamentos').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const tbody = document.getElementById('orcamentosTableBody');
        if (!data || data.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="empty">Nenhum orcamento</td></tr>'; return; }
        const statusMap = { 'pending':'<span class="badge badge-warning">Pendente</span>', 'accepted':'<span class="badge badge-success">Aprovado</span>', 'expired':'<span class="badge badge-danger">Expirado</span>' };
        tbody.innerHTML = data.map(o => {
            const isExpired = new Date(o.expires_at) < new Date() && o.status !== 'accepted';
            const status = isExpired ? statusMap['expired'] : (statusMap[o.status] || o.status);
            const link = `${window.location.origin}/orcamentos/?id=${o.id}`;
            return `<tr>
                <td>${o.project_title || '-'}</td>
                <td>${o.client_name || '-'}</td>
                <td>${formatCurrency(o.total)}</td>
                <td>${status}</td>
                <td>${formatDate(o.created_at)}</td>
                <td>
                    <button class="tbl-btn" onclick="copyToClipboard('${link}')" title="Copiar link"><i class="fas fa-link"></i></button>
                    <a href="${link}" target="_blank" class="tbl-btn" title="Abrir"><i class="fas fa-external-link-alt"></i></a>
                    <button class="tbl-btn danger" onclick="deleteOrcamento('${o.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    } catch (e) { console.error(e); }
}

async function deleteOrcamento(id) {
    if (!confirm('Excluir este orcamento?')) return;
    await supabase.from('orcamentos').delete().eq('id', id);
    showToast('Orcamento excluido!'); loadOrcamentos();
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast('Link copiado!');
}

// ========================================
// FOTOGRAFIA - GALERIAS & SELECOES
// ========================================
async function loadGalerias() {
    try {
        const { data, error } = await supabase.from('galerias').select('*').order('criado_em', { ascending: false });
        if (error) throw error;
        const container = document.getElementById('galeriasGrid');
        if (!data || data.length === 0) { container.innerHTML = '<p class="empty">Nenhuma galeria criada</p>'; return; }
        container.innerHTML = data.map(g => {
            const numFotos = g.fotos ? g.fotos.length : 0;
            const link = `${window.location.origin}/fotografia/galeria.html?codigo=${g.codigo}`;
            return `<div class="galeria-row">
                <div class="galeria-row-info">
                    <strong>${g.nome_album || g.codigo.toUpperCase()}</strong>
                    <span>${numFotos} foto${numFotos!==1?'s':''} · ${formatDate(g.criado_em)} · Codigo: ${g.codigo}</span>
                </div>
                <div class="galeria-row-actions">
                    <button class="tbl-btn" onclick="copyToClipboard('${link}')" title="Copiar link"><i class="fas fa-link"></i></button>
                    <a href="${link}" target="_blank" class="tbl-btn" title="Visualizar"><i class="fas fa-external-link-alt"></i></a>
                    <button class="tbl-btn danger" onclick="deleteGaleria('${g.codigo}','${g.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        }).join('');
    } catch (e) { console.error(e); }
}

async function deleteGaleria(codigo, id) {
    if (!confirm('Excluir galeria "' + codigo.toUpperCase() + '"?')) return;
    await supabase.from('galerias').delete().eq('id', id);
    showToast('Galeria excluida!'); loadGalerias(); loadDashboardStats();
}

async function loadSelecoes() {
    try {
        const { data, error } = await supabase.from('selecoes').select('*').order('criado_em', { ascending: false });
        if (error) throw error;
        const container = document.getElementById('selecoesGrid');
        if (!data || data.length === 0) { container.innerHTML = '<p class="empty">Nenhuma selecao recebida</p>'; return; }
        container.innerHTML = data.map(s => {
            const numFotos = s.fotos_selecionadas ? s.fotos_selecionadas.length : 0;
            return `<div class="galeria-row">
                <div class="galeria-row-info">
                    <strong>${s.nome_cliente || 'Sem nome'}</strong>
                    <span>Galeria: ${s.codigo.toUpperCase()} · ${numFotos} foto(s) · ${formatDate(s.criado_em)}</span>
                    ${s.mensagem ? `<span style="color:rgba(255,255,255,0.4);font-style:italic;font-size:0.78rem;">"${s.mensagem}"</span>` : ''}
                </div>
                <div class="galeria-row-actions">
                    <button class="tbl-btn" onclick="viewSelecao(${JSON.stringify(s.fotos_selecionadas).replace(/"/g,'&quot;')})" title="Ver fotos"><i class="fas fa-eye"></i></button>
                    <button class="tbl-btn danger" onclick="deleteSelecao('${s.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        }).join('');
    } catch (e) { console.error(e); }
}

async function deleteSelecao(id) {
    if (!confirm('Excluir esta selecao?')) return;
    await supabase.from('selecoes').delete().eq('id', id);
    showToast('Selecao excluida!'); loadSelecoes();
}

function viewSelecao(fotos) {
    const html = fotos.map(f => `<img src="https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_300,q_70/${f}.jpg" style="width:100%;border-radius:6px;">`).join('');
    openModal('Fotos Selecionadas (' + fotos.length + ')', `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:0.5rem;">${html}</div>`);
}

// ========================================
// UPLOAD GALERIA MODAL
// ========================================
let uploadFiles = [];

function openUploadGaleriaModal() {
    uploadFiles = [];
    openModal('Nova Galeria de Fotos', `<form class="modal-form" onsubmit="uploadGaleria(event)">
        <div class="form-group"><label>Nome do Album</label><input type="text" id="uploadNomeAlbum" required placeholder="Ex: Ensaio Maria"></div>
        <div class="form-row">
            <div class="form-group"><label>Codigo de Acesso</label><input type="text" id="uploadCodigo" required placeholder="Ex: maria2026"></div>
            <div class="form-group"><label>Fotos Inclusas</label><input type="number" id="uploadFotosInclusas" value="15" min="1"></div>
        </div>
        <div class="form-group"><label>Valor Foto Extra (R$)</label><input type="number" id="uploadValorExtra" value="25" min="0" step="0.01"></div>
        <div class="dropzone" id="uploadDropzone" onclick="document.getElementById('uploadFileInput').click()">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Arraste fotos ou clique para selecionar</p>
            <small>JPG, PNG, WebP</small>
        </div>
        <input type="file" id="uploadFileInput" style="display:none" multiple accept="image/*" onchange="handleUploadFiles(this.files)">
        <div class="preview-grid" id="uploadPreviewGrid"></div>
        <div class="form-actions"><button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button><button type="submit" class="btn-submit" id="btnDoUpload">Enviar Fotos</button></div>
    </form>`);

    // Drag & drop
    setTimeout(() => {
        const dz = document.getElementById('uploadDropzone');
        if (dz) {
            dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
            dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
            dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('dragover'); handleUploadFiles(e.dataTransfer.files); });
        }
    }, 100);
}

function handleUploadFiles(files) {
    uploadFiles = [...uploadFiles, ...Array.from(files).filter(f => f.type.startsWith('image/'))];
    renderUploadPreviews();
}

function renderUploadPreviews() {
    const grid = document.getElementById('uploadPreviewGrid');
    if (!grid) return;
    grid.innerHTML = uploadFiles.map((file, i) => {
        const url = URL.createObjectURL(file);
        return `<div class="preview-item"><img src="${url}"><button class="remove-preview" onclick="removeUploadFile(${i})"><i class="fas fa-times"></i></button></div>`;
    }).join('');
}

function removeUploadFile(i) {
    uploadFiles.splice(i, 1);
    renderUploadPreviews();
}

async function uploadGaleria(e) {
    e.preventDefault();
    const codigo = document.getElementById('uploadCodigo').value.trim().toLowerCase().replace(/\s+/g, '_');
    const nomeAlbum = document.getElementById('uploadNomeAlbum').value.trim();
    const fotosInclusas = parseInt(document.getElementById('uploadFotosInclusas').value) || 15;
    const valorExtra = parseFloat(document.getElementById('uploadValorExtra').value) || 25;

    if (!codigo || uploadFiles.length === 0) { showToast('Preencha o codigo e selecione fotos', 'error'); return; }

    const btn = document.getElementById('btnDoUpload');
    btn.textContent = 'Enviando...';
    btn.disabled = true;

    const uploadedUrls = [];
    for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('tags', codigo);
        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.public_id) uploadedUrls.push(data.public_id);
        } catch (err) { console.error(err); }
    }

    // Save to Supabase
    try {
        const { data: existing } = await supabase.from('galerias').select('id, fotos').eq('codigo', codigo).maybeSingle();
        if (existing) {
            const allFotos = [...(existing.fotos || []), ...uploadedUrls];
            await supabase.from('galerias').update({ fotos: allFotos, nome_album: nomeAlbum, fotos_inclusas: fotosInclusas, valor_foto_extra: valorExtra }).eq('id', existing.id);
        } else {
            await supabase.from('galerias').insert([{ codigo, fotos: uploadedUrls, nome_album: nomeAlbum, fotos_inclusas: fotosInclusas, valor_foto_extra: valorExtra }]);
        }
        showToast(`${uploadedUrls.length} fotos enviadas com sucesso!`);
        closeModal();
        loadGalerias();
        loadDashboardStats();
    } catch (err) { showToast('Erro ao salvar: ' + err.message, 'error'); }
}

// ========================================
// FINANCEIRO CRUD
// ========================================
async function loadFinanceiro() {
    try {
        const { data, error } = await supabase.from('transacoes').select('*').order('data', { ascending: false });
        if (error) throw error;
        let totalR = 0, totalD = 0;
        const tbody = document.getElementById('financeiroTableBody');
        if (!data || data.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="empty">Nenhuma transacao</td></tr>'; }
        else {
            tbody.innerHTML = data.map(t => {
                if (t.tipo === 'receita') totalR += Number(t.valor); else totalD += Number(t.valor);
                return `<tr>
                    <td>${formatDate(t.data)}</td>
                    <td>${t.tipo==='receita'?'<span class="badge badge-success">Receita</span>':'<span class="badge badge-danger">Despesa</span>'}</td>
                    <td>${t.descricao||'-'}</td>
                    <td>${t.categoria||'-'}</td>
                    <td>${t.metodo_pagamento||'-'}</td>
                    <td>${formatCurrency(t.valor)}</td>
                    <td>
                        <button class="tbl-btn" onclick="openEditTransactionModal('${t.id}')"><i class="fas fa-edit"></i></button>
                        <button class="tbl-btn danger" onclick="deleteTransaction('${t.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
            }).join('');
        }
        document.getElementById('totalReceitas').textContent = formatCurrency(totalR);
        document.getElementById('totalDespesas').textContent = formatCurrency(totalD);
        document.getElementById('saldoLiquido').textContent = formatCurrency(totalR - totalD);
    } catch (e) { console.error(e); }
}

function openAddTransactionModal(tipo) {
    const cats = tipo==='receita' ? ['Ensaio Fotografico','Fotos Extras','Edicao','Produtos','Outros'] : ['Equipamento','Software','Marketing','Transporte','Educacao','Estudio','Outros'];
    const metodos = ['PIX','Cartao Credito','Cartao Debito','Transferencia','Dinheiro','Boleto'];
    openModal(`Nova ${tipo==='receita'?'Receita':'Despesa'}`, `<form class="modal-form" onsubmit="saveTransaction(event)">
        <input type="hidden" id="transId" value=""><input type="hidden" id="transTipo" value="${tipo}">
        <div class="form-row">
            <div class="form-group"><label>Valor (R$)</label><input type="number" id="transValor" step="0.01" min="0" required placeholder="0.00"></div>
            <div class="form-group"><label>Data</label><input type="date" id="transData" required value="${new Date().toISOString().split('T')[0]}"></div>
        </div>
        <div class="form-group"><label>Descricao</label><input type="text" id="transDescricao" required placeholder="Descricao"></div>
        <div class="form-row">
            <div class="form-group"><label>Categoria</label><select id="transCategoria">${cats.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>
            <div class="form-group"><label>Metodo</label><select id="transMetodo">${metodos.map(m=>`<option value="${m}">${m}</option>`).join('')}</select></div>
        </div>
        <div class="form-actions"><button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button><button type="submit" class="btn-submit">Salvar</button></div>
    </form>`);
}

async function openEditTransactionModal(id) {
    const { data: t } = await supabase.from('transacoes').select('*').eq('id', id).single();
    if (!t) return;
    const cats = t.tipo==='receita' ? ['Ensaio Fotografico','Fotos Extras','Edicao','Produtos','Outros'] : ['Equipamento','Software','Marketing','Transporte','Educacao','Estudio','Outros'];
    const metodos = ['PIX','Cartao Credito','Cartao Debito','Transferencia','Dinheiro','Boleto'];
    openModal(`Editar ${t.tipo==='receita'?'Receita':'Despesa'}`, `<form class="modal-form" onsubmit="saveTransaction(event)">
        <input type="hidden" id="transId" value="${t.id}"><input type="hidden" id="transTipo" value="${t.tipo}">
        <div class="form-row">
            <div class="form-group"><label>Valor (R$)</label><input type="number" id="transValor" step="0.01" min="0" required value="${t.valor}"></div>
            <div class="form-group"><label>Data</label><input type="date" id="transData" required value="${t.data||''}"></div>
        </div>
        <div class="form-group"><label>Descricao</label><input type="text" id="transDescricao" required value="${t.descricao||''}"></div>
        <div class="form-row">
            <div class="form-group"><label>Categoria</label><select id="transCategoria">${cats.map(c=>`<option value="${c}" ${c===t.categoria?'selected':''}>${c}</option>`).join('')}</select></div>
            <div class="form-group"><label>Metodo</label><select id="transMetodo">${metodos.map(m=>`<option value="${m}" ${m===t.metodo_pagamento?'selected':''}>${m}</option>`).join('')}</select></div>
        </div>
        <div class="form-actions"><button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button><button type="submit" class="btn-submit">Salvar</button></div>
    </form>`);
}

async function saveTransaction(e) {
    e.preventDefault();
    const id = document.getElementById('transId').value;
    const payload = { tipo: document.getElementById('transTipo').value, valor: parseFloat(document.getElementById('transValor').value), data: document.getElementById('transData').value, descricao: document.getElementById('transDescricao').value, categoria: document.getElementById('transCategoria').value, metodo_pagamento: document.getElementById('transMetodo').value };
    try {
        if (id) { await supabase.from('transacoes').update(payload).eq('id', id); showToast('Transacao atualizada!'); }
        else { await supabase.from('transacoes').insert([payload]); showToast('Transacao registrada!'); }
        closeModal(); loadFinanceiro(); loadDashboardStats();
    } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

async function deleteTransaction(id) {
    if (!confirm('Excluir transacao?')) return;
    await supabase.from('transacoes').delete().eq('id', id);
    showToast('Excluida!'); loadFinanceiro(); loadDashboardStats();
}

// ========================================
// PORTFOLIO CRUD
// ========================================
async function loadPortfolio() {
    try {
        const { data, error } = await supabase.from('portfolio').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const tbody = document.getElementById('portfolioTableBody');
        if (!data || data.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="empty">Nenhum item</td></tr>'; return; }
        tbody.innerHTML = data.map(item => `<tr>
            <td>${item.titulo||'-'}</td>
            <td>${item.categoria||'-'}</td>
            <td>${item.destaque?'<i class="fas fa-star" style="color:var(--gold)"></i>':'-'}</td>
            <td>${formatDate(item.created_at)}</td>
            <td>
                <button class="tbl-btn" onclick="openEditPortfolioModal('${item.id}')"><i class="fas fa-edit"></i></button>
                <button class="tbl-btn danger" onclick="deletePortfolio('${item.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
    } catch (e) { console.error(e); }
}

function openAddPortfolioModal() {
    openModal('Novo Item', `<form class="modal-form" onsubmit="savePortfolio(event)">
        <input type="hidden" id="portfolioId" value="">
        <div class="form-group"><label>Titulo</label><input type="text" id="portfolioTitulo" required placeholder="Titulo do trabalho"></div>
        <div class="form-row">
            <div class="form-group"><label>Categoria</label><select id="portfolioCategoria"><option value="corporativa">Corporativa</option><option value="ensaio-pessoal">Ensaio Pessoal</option><option value="eventos">Eventos</option><option value="produto">Produto</option><option value="outros">Outros</option></select></div>
            <div class="form-group"><label>Destaque</label><select id="portfolioDestaque"><option value="false">Nao</option><option value="true">Sim</option></select></div>
        </div>
        <div class="form-group"><label>URL da Imagem</label><input type="url" id="portfolioImagem" placeholder="https://..."></div>
        <div class="form-group"><label>Descricao</label><textarea id="portfolioDescricao" rows="3" placeholder="Descricao..."></textarea></div>
        <div class="form-actions"><button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button><button type="submit" class="btn-submit">Salvar</button></div>
    </form>`);
}

async function openEditPortfolioModal(id) {
    const { data: item } = await supabase.from('portfolio').select('*').eq('id', id).single();
    if (!item) return;
    openModal('Editar Item', `<form class="modal-form" onsubmit="savePortfolio(event)">
        <input type="hidden" id="portfolioId" value="${item.id}">
        <div class="form-group"><label>Titulo</label><input type="text" id="portfolioTitulo" required value="${item.titulo||''}"></div>
        <div class="form-row">
            <div class="form-group"><label>Categoria</label><select id="portfolioCategoria"><option value="corporativa" ${item.categoria==='corporativa'?'selected':''}>Corporativa</option><option value="ensaio-pessoal" ${item.categoria==='ensaio-pessoal'?'selected':''}>Ensaio Pessoal</option><option value="eventos" ${item.categoria==='eventos'?'selected':''}>Eventos</option><option value="produto" ${item.categoria==='produto'?'selected':''}>Produto</option><option value="outros" ${item.categoria==='outros'?'selected':''}>Outros</option></select></div>
            <div class="form-group"><label>Destaque</label><select id="portfolioDestaque"><option value="false" ${!item.destaque?'selected':''}>Nao</option><option value="true" ${item.destaque?'selected':''}>Sim</option></select></div>
        </div>
        <div class="form-group"><label>URL da Imagem</label><input type="url" id="portfolioImagem" value="${item.imagem_url||''}"></div>
        <div class="form-group"><label>Descricao</label><textarea id="portfolioDescricao" rows="3">${item.descricao||''}</textarea></div>
        <div class="form-actions"><button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button><button type="submit" class="btn-submit">Salvar</button></div>
    </form>`);
}

async function savePortfolio(e) {
    e.preventDefault();
    const id = document.getElementById('portfolioId').value;
    const payload = { titulo: document.getElementById('portfolioTitulo').value, categoria: document.getElementById('portfolioCategoria').value, destaque: document.getElementById('portfolioDestaque').value==='true', imagem_url: document.getElementById('portfolioImagem').value||null, descricao: document.getElementById('portfolioDescricao').value };
    try {
        if (id) { await supabase.from('portfolio').update(payload).eq('id', id); showToast('Atualizado!'); }
        else { await supabase.from('portfolio').insert([payload]); showToast('Adicionado!'); }
        closeModal(); loadPortfolio();
    } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

async function deletePortfolio(id) {
    if (!confirm('Excluir item?')) return;
    await supabase.from('portfolio').delete().eq('id', id);
    showToast('Excluido!'); loadPortfolio();
}

// ========================================
// DEPOIMENTOS CRUD
// ========================================
async function loadDepoimentos() {
    try {
        const { data, error } = await supabase.from('depoimentos').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const tbody = document.getElementById('depoimentosTableBody');
        if (!data || data.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="empty">Nenhum depoimento</td></tr>'; return; }
        tbody.innerHTML = data.map(d => `<tr>
            <td>${d.nome||'-'}</td>
            <td>${d.empresa||'-'}</td>
            <td>${(d.texto||'').substring(0,50)}${(d.texto||'').length>50?'...':''}</td>
            <td>${d.ativo?'<span class="badge badge-success">Ativo</span>':'<span class="badge badge-warning">Inativo</span>'}</td>
            <td>
                <button class="tbl-btn" onclick="openEditDepoimentoModal('${d.id}')"><i class="fas fa-edit"></i></button>
                <button class="tbl-btn danger" onclick="deleteDepoimento('${d.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
    } catch (e) { console.error(e); }
}

function openAddDepoimentoModal() {
    openModal('Novo Depoimento', `<form class="modal-form" onsubmit="saveDepoimento(event)">
        <input type="hidden" id="depoimentoId" value="">
        <div class="form-row">
            <div class="form-group"><label>Nome</label><input type="text" id="depoimentoNome" required placeholder="Nome"></div>
            <div class="form-group"><label>Empresa</label><input type="text" id="depoimentoEmpresa" placeholder="Empresa/Cargo"></div>
        </div>
        <div class="form-group"><label>Depoimento</label><textarea id="depoimentoTexto" rows="4" required placeholder="O que a pessoa disse..."></textarea></div>
        <div class="form-row">
            <div class="form-group"><label>Nota (1-5)</label><input type="number" id="depoimentoNota" min="1" max="5" value="5"></div>
            <div class="form-group"><label>Ativo</label><select id="depoimentoAtivo"><option value="true">Sim</option><option value="false">Nao</option></select></div>
        </div>
        <div class="form-actions"><button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button><button type="submit" class="btn-submit">Salvar</button></div>
    </form>`);
}

async function openEditDepoimentoModal(id) {
    const { data: d } = await supabase.from('depoimentos').select('*').eq('id', id).single();
    if (!d) return;
    openModal('Editar Depoimento', `<form class="modal-form" onsubmit="saveDepoimento(event)">
        <input type="hidden" id="depoimentoId" value="${d.id}">
        <div class="form-row">
            <div class="form-group"><label>Nome</label><input type="text" id="depoimentoNome" required value="${d.nome||''}"></div>
            <div class="form-group"><label>Empresa</label><input type="text" id="depoimentoEmpresa" value="${d.empresa||''}"></div>
        </div>
        <div class="form-group"><label>Depoimento</label><textarea id="depoimentoTexto" rows="4" required>${d.texto||''}</textarea></div>
        <div class="form-row">
            <div class="form-group"><label>Nota (1-5)</label><input type="number" id="depoimentoNota" min="1" max="5" value="${d.nota||5}"></div>
            <div class="form-group"><label>Ativo</label><select id="depoimentoAtivo"><option value="true" ${d.ativo?'selected':''}>Sim</option><option value="false" ${!d.ativo?'selected':''}>Nao</option></select></div>
        </div>
        <div class="form-actions"><button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button><button type="submit" class="btn-submit">Salvar</button></div>
    </form>`);
}

async function saveDepoimento(e) {
    e.preventDefault();
    const id = document.getElementById('depoimentoId').value;
    const payload = { nome: document.getElementById('depoimentoNome').value, empresa: document.getElementById('depoimentoEmpresa').value, texto: document.getElementById('depoimentoTexto').value, nota: parseInt(document.getElementById('depoimentoNota').value)||5, ativo: document.getElementById('depoimentoAtivo').value==='true' };
    try {
        if (id) { await supabase.from('depoimentos').update(payload).eq('id', id); showToast('Atualizado!'); }
        else { await supabase.from('depoimentos').insert([payload]); showToast('Adicionado!'); }
        closeModal(); loadDepoimentos();
    } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

async function deleteDepoimento(id) {
    if (!confirm('Excluir depoimento?')) return;
    await supabase.from('depoimentos').delete().eq('id', id);
    showToast('Excluido!'); loadDepoimentos();
}

// ========================================
// CONFIGURACOES
// ========================================
async function loadConfiguracoes() {
    try {
        const { data } = await supabase.from('configuracoes').select('*').single();
        if (!data) return;
        document.getElementById('configWhatsapp').value = data.whatsapp || '';
        document.getElementById('configEmail').value = data.email || '';
        document.getElementById('configInstagram').value = data.instagram || '';
        document.getElementById('configLinkedin').value = data.linkedin || '';
        document.getElementById('configTitulo').value = data.titulo || '';
        document.getElementById('configSubtitulo').value = data.subtitulo || '';
        document.getElementById('configSobre').value = data.sobre || '';
    } catch (e) { console.error(e); }
}

async function saveConfiguracoes() {
    const payload = { whatsapp: document.getElementById('configWhatsapp').value, email: document.getElementById('configEmail').value, instagram: document.getElementById('configInstagram').value, linkedin: document.getElementById('configLinkedin').value, titulo: document.getElementById('configTitulo').value, subtitulo: document.getElementById('configSubtitulo').value, sobre: document.getElementById('configSobre').value };
    try {
        const { data: existing } = await supabase.from('configuracoes').select('id').single();
        if (existing) { await supabase.from('configuracoes').update(payload).eq('id', existing.id); }
        else { await supabase.from('configuracoes').insert([payload]); }
        showToast('Configuracoes salvas!');
    } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

// ========================================
// INIT
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
});


// ========================================
// ENTREGAS DE FOTOS
// ========================================
let entregaCapaFile = null;
let entregaFotosFiles = [];

async function loadEntregas() {
    try {
        const { data, error } = await supabase.from('entregas').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const container = document.getElementById('entregasGrid');
        if (!data || data.length === 0) { container.innerHTML = '<p class="empty">Nenhuma entrega criada</p>'; return; }
        container.innerHTML = data.map(e => {
            const numFotos = e.fotos ? e.fotos.length : 0;
            const link = `${window.location.origin}/entrega/?id=${e.codigo}`;
            return `<div class="galeria-row">
                <div class="galeria-row-info">
                    <strong>${e.cliente_nome}</strong>
                    <span>${numFotos} foto${numFotos!==1?'s':''} · ${formatDate(e.created_at)} · Codigo: ${e.codigo}</span>
                </div>
                <div class="galeria-row-actions">
                    <button class="tbl-btn" onclick="copyToClipboard('${link}')" title="Copiar link"><i class="fas fa-link"></i></button>
                    <a href="${link}" target="_blank" class="tbl-btn" title="Visualizar"><i class="fas fa-external-link-alt"></i></a>
                    <button class="tbl-btn danger" onclick="deleteEntrega('${e.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        }).join('');
    } catch (e) { console.error(e); }
}

async function deleteEntrega(id) {
    if (!confirm('Excluir esta entrega?')) return;
    await supabase.from('entregas').delete().eq('id', id);
    showToast('Entrega excluida!'); loadEntregas();
}

function openAddEntregaModal() {
    entregaCapaFile = null;
    entregaFotosFiles = [];
    openModal('Nova Entrega de Fotos', `<form class="modal-form" onsubmit="saveEntrega(event)">
        <div class="form-group">
            <label>Nome do Cliente</label>
            <input type="text" id="entregaCliente" required placeholder="Nome completo do cliente">
        </div>
        <div class="form-group">
            <label>Codigo de Acesso (para URL)</label>
            <input type="text" id="entregaCodigo" required placeholder="Ex: ensaio-maria-2026">
        </div>
        <div class="form-group">
            <label>Historia do Ensaio</label>
            <textarea id="entregaHistoria" rows="4" placeholder="Conte um pouco sobre esse ensaio/evento..."></textarea>
        </div>
        <div class="form-group">
            <label>Foto de Capa</label>
            <div class="dropzone" id="capaDropzone" onclick="document.getElementById('capaInput').click()">
                <i class="fas fa-image"></i>
                <p>Clique ou arraste a foto de capa</p>
            </div>
            <input type="file" id="capaInput" style="display:none" accept="image/*" onchange="handleCapaFile(this.files)">
            <div id="capaPreview"></div>
        </div>
        <div class="form-group">
            <label>Fotos do Album</label>
            <div class="dropzone" id="fotosDropzone" onclick="document.getElementById('fotosInput').click()">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Arraste as fotos ou clique para selecionar</p>
                <small>JPG, PNG, WebP</small>
            </div>
            <input type="file" id="fotosInput" style="display:none" multiple accept="image/*" onchange="handleEntregaFotos(this.files)">
            <div class="preview-grid" id="entregaPreviewGrid"></div>
        </div>
        <div class="form-actions">
            <button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn-submit" id="btnSaveEntrega">Criar Entrega</button>
        </div>
    </form>`);

    // Drag & drop for capa
    setTimeout(() => {
        const capaDz = document.getElementById('capaDropzone');
        if (capaDz) {
            capaDz.addEventListener('dragover', (e) => { e.preventDefault(); capaDz.classList.add('dragover'); });
            capaDz.addEventListener('dragleave', () => capaDz.classList.remove('dragover'));
            capaDz.addEventListener('drop', (e) => { e.preventDefault(); capaDz.classList.remove('dragover'); handleCapaFile(e.dataTransfer.files); });
        }
        const fotosDz = document.getElementById('fotosDropzone');
        if (fotosDz) {
            fotosDz.addEventListener('dragover', (e) => { e.preventDefault(); fotosDz.classList.add('dragover'); });
            fotosDz.addEventListener('dragleave', () => fotosDz.classList.remove('dragover'));
            fotosDz.addEventListener('drop', (e) => { e.preventDefault(); fotosDz.classList.remove('dragover'); handleEntregaFotos(e.dataTransfer.files); });
        }
    }, 100);
}

function handleCapaFile(files) {
    if (files.length === 0) return;
    entregaCapaFile = files[0];
    const url = URL.createObjectURL(files[0]);
    const preview = document.getElementById('capaPreview');
    if (preview) preview.innerHTML = `<div class="preview-item" style="width:200px;aspect-ratio:16/9;margin-top:0.5rem;"><img src="${url}"></div>`;
}

function handleEntregaFotos(files) {
    entregaFotosFiles = [...entregaFotosFiles, ...Array.from(files).filter(f => f.type.startsWith('image/'))];
    renderEntregaPreviews();
}

function renderEntregaPreviews() {
    const grid = document.getElementById('entregaPreviewGrid');
    if (!grid) return;
    grid.innerHTML = entregaFotosFiles.map((file, i) => {
        const url = URL.createObjectURL(file);
        return `<div class="preview-item"><img src="${url}"><button class="remove-preview" onclick="removeEntregaFoto(${i})"><i class="fas fa-times"></i></button></div>`;
    }).join('');
}

function removeEntregaFoto(i) {
    entregaFotosFiles.splice(i, 1);
    renderEntregaPreviews();
}

async function saveEntrega(e) {
    e.preventDefault();
    const clienteNome = document.getElementById('entregaCliente').value.trim();
    const codigo = document.getElementById('entregaCodigo').value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const historia = document.getElementById('entregaHistoria').value.trim();

    if (!clienteNome || !codigo) { showToast('Preencha nome e codigo', 'error'); return; }
    if (!entregaCapaFile) { showToast('Selecione uma foto de capa', 'error'); return; }
    if (entregaFotosFiles.length === 0) { showToast('Selecione as fotos do album', 'error'); return; }

    const btn = document.getElementById('btnSaveEntrega');
    btn.textContent = 'Enviando capa...';
    btn.disabled = true;

    try {
        // 1. Upload capa
        const capaId = await uploadToCloudinary(entregaCapaFile, 'entrega_' + codigo);
        if (!capaId) throw new Error('Falha no upload da capa');

        // 2. Upload fotos
        const fotosIds = [];
        for (let i = 0; i < entregaFotosFiles.length; i++) {
            btn.textContent = `Enviando foto ${i+1}/${entregaFotosFiles.length}...`;
            const id = await uploadToCloudinary(entregaFotosFiles[i], 'entrega_' + codigo);
            if (id) fotosIds.push(id);
        }

        btn.textContent = 'Salvando...';

        // 3. Salvar no Supabase
        const { error } = await supabase.from('entregas').insert([{
            cliente_nome: clienteNome,
            codigo: codigo,
            historia: historia,
            capa_url: capaId,
            fotos: fotosIds
        }]);

        if (error) throw error;

        showToast(`Entrega criada com ${fotosIds.length} fotos!`);
        closeModal();
        loadEntregas();

    } catch (err) {
        showToast('Erro: ' + err.message, 'error');
        btn.textContent = 'Criar Entrega';
        btn.disabled = false;
    }
}

async function uploadToCloudinary(file, tag) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('tags', tag);
    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        return data.public_id || null;
    } catch (err) {
        console.error('Upload error:', err);
        return null;
    }
}
