// ========================================
// PAINEL ADMINISTRATIVO - JAVASCRIPT COMPLETO
// Todas as funcionalidades CRUD com Supabase
// ========================================

// ========================================
// NAVEGACAO DA SIDEBAR
// ========================================
const adminSidebar = document.getElementById('adminSidebar');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebarClose = document.getElementById('sidebarClose');
const adminNavItems = document.querySelectorAll('.admin-nav-item');
const adminSections = document.querySelectorAll('.admin-section');
const adminPageTitle = document.querySelector('.admin-page-title');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => adminSidebar.classList.add('active'));
}
if (sidebarClose) {
    sidebarClose.addEventListener('click', () => adminSidebar.classList.remove('active'));
}

adminNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionName = item.getAttribute('data-section');
        adminNavItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        adminSections.forEach(section => section.classList.remove('active'));
        const target = document.getElementById(`${sectionName}-section`);
        if (target) target.classList.add('active');
        const titles = {
            'dashboard': 'Dashboard', 'clientes': 'Clientes', 'projetos': 'Projetos',
            'fotos': 'Sistema de Fotos', 'financeiro': 'Financeiro', 'portfolio': 'Portfolio',
            'depoimentos': 'Depoimentos', 'configuracoes': 'Configuracoes'
        };
        if (adminPageTitle) adminPageTitle.textContent = titles[sectionName] || 'Dashboard';
        if (window.innerWidth <= 1024) adminSidebar.classList.remove('active');
        // Carregar dados da secao
        loadSectionData(sectionName);
    });
});

// ========================================
// LOGOUT
// ========================================
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async () => {
        if (confirm('Deseja realmente sair do painel administrativo?')) {
            await supabase.auth.signOut();
            window.location.href = 'admin-login.html';
        }
    });
}

// ========================================
// MODAL GENERICO
// ========================================
function openModal(title, bodyHTML) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('adminModalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('adminModalOverlay').classList.remove('active');
}

// Fechar modal clicando fora
document.getElementById('adminModalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});

// ========================================
// UTILIDADES
// ========================================
function formatCurrency(value) {
    return 'R$ ' + Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ========================================
// CARREGAR DADOS POR SECAO
// ========================================
function loadSectionData(section) {
    switch(section) {
        case 'clientes': loadClientes(); break;
        case 'projetos': loadProjetos(); break;
        case 'fotos': loadProvas(); break;
        case 'financeiro': loadFinanceiro(); break;
        case 'portfolio': loadPortfolio(); break;
        case 'depoimentos': loadDepoimentos(); break;
        case 'configuracoes': loadConfiguracoes(); break;
    }
}

// ========================================
// DASHBOARD - ESTATISTICAS
// ========================================
async function loadDashboardStats() {
    try {
        const { count: clientesCount } = await supabase
            .from('usuarios').select('*', { count: 'exact', head: true });
        document.getElementById('totalClientes').textContent = clientesCount || 0;

        const { count: projetosCount } = await supabase
            .from('projetos').select('*', { count: 'exact', head: true })
            .eq('status', 'em_andamento');
        document.getElementById('totalProjetos').textContent = projetosCount || 0;

        // Receita do mes atual
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        const { data: receitas } = await supabase
            .from('transacoes').select('valor')
            .eq('tipo', 'receita').gte('data', firstDay).lte('data', lastDay);
        const totalMes = (receitas || []).reduce((s, r) => s + Number(r.valor), 0);
        document.getElementById('receitaMes').textContent = formatCurrency(totalMes);

        // Fotos entregues
        const { count: fotosCount } = await supabase
            .from('provas_fotos').select('*', { count: 'exact', head: true })
            .eq('status', 'entregue');
        document.getElementById('fotosEntregues').textContent = fotosCount || 0;

    } catch (error) {
        console.error('Erro ao carregar stats:', error);
    }
}

// ========================================
// CRUD CLIENTES
// ========================================
async function loadClientes() {
    try {
        const { data: clientes, error } = await supabase
            .from('usuarios').select('*').order('email', { ascending: true });
        if (error) throw error;

        const tbody = document.getElementById('clientesTableBody');
        if (!clientes || clientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhum cliente cadastrado</td></tr>';
            return;
        }

        tbody.innerHTML = clientes.map(c => `
            <tr>
                <td>${c.nome_completo || 'Sem nome'}</td>
                <td>${c.email || ''}</td>
                <td>${c.telefone || 'N/A'}</td>
                <td>-</td>
                <td>${formatDate(c.data_criacao || c.created_at)}</td>
                <td>
                    <button class="btn-icon" onclick="openEditClientModal('${c.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteClient('${c.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

function openAddClientModal() {
    openModal('Novo Cliente', `
        <form id="clientForm" class="admin-form" onsubmit="saveClient(event)">
            <input type="hidden" id="clientId" value="">
            <div class="form-group">
                <label>Nome Completo *</label>
                <input type="text" id="clientNome" required placeholder="Nome do cliente">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" id="clientEmail" required placeholder="email@exemplo.com">
                </div>
                <div class="form-group">
                    <label>Telefone</label>
                    <input type="text" id="clientTelefone" placeholder="(11) 99999-9999">
                </div>
            </div>
            <div class="form-group">
                <label>Empresa</label>
                <input type="text" id="clientEmpresa" placeholder="Nome da empresa">
            </div>
            <div class="form-actions">
                <button type="button" class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-admin-primary">Salvar</button>
            </div>
        </form>
    `);
}

async function openEditClientModal(id) {
    const { data: c, error } = await supabase.from('usuarios').select('*').eq('id', id).single();
    if (error || !c) { showToast('Erro ao carregar cliente', 'error'); return; }

    openModal('Editar Cliente', `
        <form id="clientForm" class="admin-form" onsubmit="saveClient(event)">
            <input type="hidden" id="clientId" value="${c.id}">
            <div class="form-group">
                <label>Nome Completo *</label>
                <input type="text" id="clientNome" required value="${c.nome_completo || ''}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" id="clientEmail" required value="${c.email || ''}">
                </div>
                <div class="form-group">
                    <label>Telefone</label>
                    <input type="text" id="clientTelefone" value="${c.telefone || ''}">
                </div>
            </div>
            <div class="form-group">
                <label>Empresa</label>
                <input type="text" id="clientEmpresa" value="${c.empresa || ''}">
            </div>
            <div class="form-actions">
                <button type="button" class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-admin-primary">Salvar</button>
            </div>
        </form>
    `);
}

async function saveClient(e) {
    e.preventDefault();
    const id = document.getElementById('clientId').value;
    const payload = {
        nome_completo: document.getElementById('clientNome').value,
        email: document.getElementById('clientEmail').value,
        telefone: document.getElementById('clientTelefone').value,
        empresa: document.getElementById('clientEmpresa').value
    };

    try {
        if (id) {
            const { error } = await supabase.from('usuarios').update(payload).eq('id', id);
            if (error) throw error;
            showToast('Cliente atualizado com sucesso!');
        } else {
            const { error } = await supabase.from('usuarios').insert([payload]);
            if (error) throw error;
            showToast('Cliente adicionado com sucesso!');
        }
        closeModal();
        loadClientes();
        loadDashboardStats();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

async function deleteClient(id) {
    if (!confirm('Deseja realmente excluir este cliente? Esta acao nao pode ser desfeita.')) return;
    try {
        const { error } = await supabase.from('usuarios').delete().eq('id', id);
        if (error) throw error;
        showToast('Cliente excluido com sucesso!');
        loadClientes();
        loadDashboardStats();
    } catch (error) {
        showToast('Erro ao excluir: ' + error.message, 'error');
    }
}

// ========================================
// CRUD PROJETOS
// ========================================
async function loadProjetos() {
    try {
        const { data: projetos, error } = await supabase
            .from('projetos').select('*, usuarios(nome_completo)')
            .order('created_at', { ascending: false });
        if (error) throw error;

        const tbody = document.getElementById('projetosTableBody');
        if (!projetos || projetos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhum projeto cadastrado</td></tr>';
            return;
        }

        const statusLabels = {
            'aguardando': '<span class="badge badge-warning">Aguardando</span>',
            'em_andamento': '<span class="badge badge-info">Em Andamento</span>',
            'em_revisao': '<span class="badge badge-purple">Em Revisao</span>',
            'concluido': '<span class="badge badge-success">Concluido</span>'
        };

        tbody.innerHTML = projetos.map(p => `
            <tr>
                <td>${p.titulo || 'Sem titulo'}</td>
                <td>${p.usuarios?.nome_completo || 'N/A'}</td>
                <td>${statusLabels[p.status] || p.status}</td>
                <td>
                    <div class="progress-bar-mini">
                        <div class="progress-fill-mini" style="width:${p.progresso || 0}%"></div>
                    </div>
                    <small>${p.progresso || 0}%</small>
                </td>
                <td>${formatDate(p.data_inicio || p.created_at)}</td>
                <td>
                    <button class="btn-icon" onclick="openEditProjectModal('${p.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteProject('${p.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar projetos:', error);
    }
}

async function getClientesOptions(selectedId) {
    const { data: clientes } = await supabase.from('usuarios').select('id, nome_completo').order('nome_completo');
    return (clientes || []).map(c =>
        `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.nome_completo || c.id}</option>`
    ).join('');
}

async function openAddProjectModal() {
    const clientesOpts = await getClientesOptions();
    openModal('Novo Projeto', `
        <form id="projectForm" class="admin-form" onsubmit="saveProject(event)">
            <input type="hidden" id="projectId" value="">
            <div class="form-group">
                <label>Titulo *</label>
                <input type="text" id="projectTitulo" required placeholder="Nome do projeto">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Cliente *</label>
                    <select id="projectCliente" required>
                        <option value="">Selecione...</option>
                        ${clientesOpts}
                    </select>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="projectStatus">
                        <option value="aguardando">Aguardando Inicio</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="em_revisao">Em Revisao</option>
                        <option value="concluido">Concluido</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Progresso (%)</label>
                    <input type="number" id="projectProgresso" min="0" max="100" value="0">
                </div>
                <div class="form-group">
                    <label>Data Inicio</label>
                    <input type="date" id="projectDataInicio">
                </div>
            </div>
            <div class="form-group">
                <label>Descricao</label>
                <textarea id="projectDescricao" rows="3" placeholder="Descricao do projeto..."></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-admin-primary">Salvar</button>
            </div>
        </form>
    `);
}

async function openEditProjectModal(id) {
    const { data: p, error } = await supabase.from('projetos').select('*').eq('id', id).single();
    if (error || !p) { showToast('Erro ao carregar projeto', 'error'); return; }
    const clientesOpts = await getClientesOptions(p.cliente_id);

    openModal('Editar Projeto', `
        <form id="projectForm" class="admin-form" onsubmit="saveProject(event)">
            <input type="hidden" id="projectId" value="${p.id}">
            <div class="form-group">
                <label>Titulo *</label>
                <input type="text" id="projectTitulo" required value="${p.titulo || ''}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Cliente *</label>
                    <select id="projectCliente" required>
                        <option value="">Selecione...</option>
                        ${clientesOpts}
                    </select>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="projectStatus">
                        <option value="aguardando" ${p.status==='aguardando'?'selected':''}>Aguardando</option>
                        <option value="em_andamento" ${p.status==='em_andamento'?'selected':''}>Em Andamento</option>
                        <option value="em_revisao" ${p.status==='em_revisao'?'selected':''}>Em Revisao</option>
                        <option value="concluido" ${p.status==='concluido'?'selected':''}>Concluido</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Progresso (%)</label>
                    <input type="number" id="projectProgresso" min="0" max="100" value="${p.progresso||0}">
                </div>
                <div class="form-group">
                    <label>Data Inicio</label>
                    <input type="date" id="projectDataInicio" value="${p.data_inicio||''}">
                </div>
            </div>
            <div class="form-group">
                <label>Descricao</label>
                <textarea id="projectDescricao" rows="3">${p.descricao||''}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-admin-primary">Salvar</button>
            </div>
        </form>
    `);
}

async function saveProject(e) {
    e.preventDefault();
    const id = document.getElementById('projectId').value;
    const payload = {
        titulo: document.getElementById('projectTitulo').value,
        cliente_id: document.getElementById('projectCliente').value,
        status: document.getElementById('projectStatus').value,
        progresso: parseInt(document.getElementById('projectProgresso').value) || 0,
        data_inicio: document.getElementById('projectDataInicio').value || null,
        descricao: document.getElementById('projectDescricao').value
    };

    try {
        if (id) {
            const { error } = await supabase.from('projetos').update(payload).eq('id', id);
            if (error) throw error;
            showToast('Projeto atualizado!');
        } else {
            const { error } = await supabase.from('projetos').insert([payload]);
            if (error) throw error;
            showToast('Projeto criado!');
        }
        closeModal();
        loadProjetos();
        loadDashboardStats();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

async function deleteProject(id) {
    if (!confirm('Excluir este projeto?')) return;
    try {
        const { error } = await supabase.from('projetos').delete().eq('id', id);
        if (error) throw error;
        showToast('Projeto excluido!');
        loadProjetos();
        loadDashboardStats();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

// ========================================
// CRUD FINANCEIRO
// ========================================
async function loadFinanceiro() {
    try {
        const { data: transacoes, error } = await supabase
            .from('transacoes').select('*').order('data', { ascending: false });
        if (error) throw error;

        let totalR = 0, totalD = 0;
        const tbody = document.getElementById('financeiroTableBody');

        if (!transacoes || transacoes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhuma transacao registrada</td></tr>';
        } else {
            tbody.innerHTML = transacoes.map(t => {
                if (t.tipo === 'receita') totalR += Number(t.valor);
                else totalD += Number(t.valor);
                const tipoBadge = t.tipo === 'receita'
                    ? '<span class="badge badge-success">Receita</span>'
                    : '<span class="badge badge-danger">Despesa</span>';
                return `<tr>
                    <td>${formatDate(t.data)}</td>
                    <td>${tipoBadge}</td>
                    <td>${t.descricao || ''}</td>
                    <td>${t.categoria || ''}</td>
                    <td>${t.metodo_pagamento || ''}</td>
                    <td>${formatCurrency(t.valor)}</td>
                    <td>
                        <button class="btn-icon" onclick="openEditTransactionModal('${t.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="deleteTransaction('${t.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
            }).join('');
        }

        document.getElementById('totalReceitas').textContent = formatCurrency(totalR);
        document.getElementById('totalDespesas').textContent = formatCurrency(totalD);
        document.getElementById('saldoLiquido').textContent = formatCurrency(totalR - totalD);
    } catch (error) {
        console.error('Erro financeiro:', error);
    }
}

function openAddTransactionModal(tipo) {
    const categoriasReceita = ['Ensaio Fotografico', 'Fotos Extras', 'Edicao Adicional', 'Produtos', 'Outros'];
    const categoriasDespesa = ['Equipamento', 'Software', 'Marketing', 'Transporte', 'Educacao', 'Estudio', 'Outros'];
    const categorias = tipo === 'receita' ? categoriasReceita : categoriasDespesa;
    const metodos = ['PIX', 'Cartao Credito', 'Cartao Debito', 'Transferencia', 'Dinheiro', 'Boleto'];

    openModal(`Nova ${tipo === 'receita' ? 'Receita' : 'Despesa'}`, `
        <form id="transactionForm" class="admin-form" onsubmit="saveTransaction(event)">
            <input type="hidden" id="transId" value="">
            <input type="hidden" id="transTipo" value="${tipo}">
            <div class="form-row">
                <div class="form-group">
                    <label>Valor (R$) *</label>
                    <input type="number" id="transValor" step="0.01" min="0" required placeholder="0.00">
                </div>
                <div class="form-group">
                    <label>Data *</label>
                    <input type="date" id="transData" required value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            <div class="form-group">
                <label>Descricao *</label>
                <input type="text" id="transDescricao" required placeholder="Descricao da transacao">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Categoria</label>
                    <select id="transCategoria">
                        ${categorias.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Metodo de Pagamento</label>
                    <select id="transMetodo">
                        ${metodos.map(m => `<option value="${m}">${m}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-admin-primary">Salvar</button>
            </div>
        </form>
    `);
}

async function openEditTransactionModal(id) {
    const { data: t, error } = await supabase.from('transacoes').select('*').eq('id', id).single();
    if (error || !t) { showToast('Erro ao carregar transacao', 'error'); return; }

    const categoriasReceita = ['Ensaio Fotografico', 'Fotos Extras', 'Edicao Adicional', 'Produtos', 'Outros'];
    const categoriasDespesa = ['Equipamento', 'Software', 'Marketing', 'Transporte', 'Educacao', 'Estudio', 'Outros'];
    const categorias = t.tipo === 'receita' ? categoriasReceita : categoriasDespesa;
    const metodos = ['PIX', 'Cartao Credito', 'Cartao Debito', 'Transferencia', 'Dinheiro', 'Boleto'];

    openModal(`Editar ${t.tipo === 'receita' ? 'Receita' : 'Despesa'}`, `
        <form id="transactionForm" class="admin-form" onsubmit="saveTransaction(event)">
            <input type="hidden" id="transId" value="${t.id}">
            <input type="hidden" id="transTipo" value="${t.tipo}">
            <div class="form-row">
                <div class="form-group">
                    <label>Valor (R$) *</label>
                    <input type="number" id="transValor" step="0.01" min="0" required value="${t.valor}">
                </div>
                <div class="form-group">
                    <label>Data *</label>
                    <input type="date" id="transData" required value="${t.data || ''}">
                </div>
            </div>
            <div class="form-group">
                <label>Descricao *</label>
                <input type="text" id="transDescricao" required value="${t.descricao || ''}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Categoria</label>
                    <select id="transCategoria">
                        ${categorias.map(c => `<option value="${c}" ${c===t.categoria?'selected':''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Metodo de Pagamento</label>
                    <select id="transMetodo">
                        ${metodos.map(m => `<option value="${m}" ${m===t.metodo_pagamento?'selected':''}>${m}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-admin-primary">Salvar</button>
            </div>
        </form>
    `);
}

async function saveTransaction(e) {
    e.preventDefault();
    const id = document.getElementById('transId').value;
    const payload = {
        tipo: document.getElementById('transTipo').value,
        valor: parseFloat(document.getElementById('transValor').value),
        data: document.getElementById('transData').value,
        descricao: document.getElementById('transDescricao').value,
        categoria: document.getElementById('transCategoria').value,
        metodo_pagamento: document.getElementById('transMetodo').value
    };

    try {
        if (id) {
            const { error } = await supabase.from('transacoes').update(payload).eq('id', id);
            if (error) throw error;
            showToast('Transacao atualizada!');
        } else {
            const { error } = await supabase.from('transacoes').insert([payload]);
            if (error) throw error;
            showToast('Transacao registrada!');
        }
        closeModal();
        loadFinanceiro();
        loadDashboardStats();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

async function deleteTransaction(id) {
    if (!confirm('Excluir esta transacao?')) return;
    try {
        const { error } = await supabase.from('transacoes').delete().eq('id', id);
        if (error) throw error;
        showToast('Transacao excluida!');
        loadFinanceiro();
        loadDashboardStats();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

// ========================================
// CRUD PROVAS DE FOTOS
// ========================================
async function loadProvas() {
    try {
        const { data: provas, error } = await supabase
            .from('provas_fotos').select('*, usuarios(nome_completo), projetos(titulo)')
            .order('created_at', { ascending: false });
        if (error) throw error;

        const tbody = document.getElementById('fotosTableBody');
        if (!provas || provas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhuma prova cadastrada</td></tr>';
            return;
        }

        const statusLabels = {
            'pendente': '<span class="badge badge-warning">Pendente</span>',
            'visualizada': '<span class="badge badge-info">Visualizada</span>',
            'selecionada': '<span class="badge badge-purple">Selecionada</span>',
            'entregue': '<span class="badge badge-success">Entregue</span>'
        };

        tbody.innerHTML = provas.map(p => `
            <tr>
                <td>${p.titulo || 'Sem titulo'}</td>
                <td>${p.usuarios?.nome_completo || 'N/A'}</td>
                <td>${p.projetos?.titulo || 'N/A'}</td>
                <td>${p.total_fotos || 0}</td>
                <td>${p.fotos_selecionadas || 0}</td>
                <td>${statusLabels[p.status] || p.status}</td>
                <td>
                    <button class="btn-icon" onclick="openEditProvaModal('${p.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteProva('${p.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar provas:', error);
    }
}

async function openAddProvaModal() {
    const clientesOpts = await getClientesOptions();
    const { data: projetos } = await supabase.from('projetos').select('id, titulo').order('titulo');
    const projetosOpts = (projetos || []).map(p => `<option value="${p.id}">${p.titulo}</option>`).join('');

    openModal('Nova Prova de Fotos', `
        <form id="provaForm" class="admin-form" onsubmit="saveProva(event)">
            <input type="hidden" id="provaId" value="">
            <div class="form-group">
                <label>Titulo *</label>
                <input type="text" id="provaTitulo" required placeholder="Ex: Ensaio Maria - Selecao">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Cliente *</label>
                    <select id="provaCliente" required>
                        <option value="">Selecione...</option>
                        ${clientesOpts}
                    </select>
                </div>
                <div class="form-group">
                    <label>Projeto</label>
                    <select id="provaProjeto">
                        <option value="">Nenhum</option>
                        ${projetosOpts}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Total de Fotos</label>
                    <input type="number" id="provaTotalFotos" min="0" value="0">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="provaStatus">
                        <option value="pendente">Pendente</option>
                        <option value="visualizada">Visualizada</option>
                        <option value="selecionada">Selecionada</option>
                        <option value="entregue">Entregue</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Link das Fotos (Drive/Storage)</label>
                <input type="url" id="provaLink" placeholder="https://...">
            </div>
            <div class="form-actions">
                <button type="button" class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-admin-primary">Salvar</button>
            </div>
        </form>
    `);
}

async function openEditProvaModal(id) {
    const { data: p, error } = await supabase.from('provas_fotos').select('*').eq('id', id).single();
    if (error || !p) { showToast('Erro ao carregar prova', 'error'); return; }

    const clientesOpts = await getClientesOptions(p.cliente_id);
    const { data: projetos } = await supabase.from('projetos').select('id, titulo').order('titulo');
    const projetosOpts = (projetos || []).map(pr =>
        `<option value="${pr.id}" ${pr.id===p.projeto_id?'selected':''}>${pr.titulo}</option>`
    ).join('');

    openModal('Editar Prova de Fotos', `
        <form id="provaForm" class="admin-form" onsubmit="saveProva(event)">
            <input type="hidden" id="provaId" value="${p.id}">
            <div class="form-group">
                <label>Titulo *</label>
                <input type="text" id="provaTitulo" required value="${p.titulo||''}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Cliente *</label>
                    <select id="provaCliente" required>
                        <option value="">Selecione...</option>
                        ${clientesOpts}
                    </select>
                </div>
                <div class="form-group">
                    <label>Projeto</label>
                    <select id="provaProjeto">
                        <option value="">Nenhum</option>
                        ${projetosOpts}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Total de Fotos</label>
                    <input type="number" id="provaTotalFotos" min="0" value="${p.total_fotos||0}">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="provaStatus">
                        <option value="pendente" ${p.status==='pendente'?'selected':''}>Pendente</option>
                        <option value="visualizada" ${p.status==='visualizada'?'selected':''}>Visualizada</option>
                        <option value="selecionada" ${p.status==='selecionada'?'selected':''}>Selecionada</option>
                        <option value="entregue" ${p.status==='entregue'?'selected':''}>Entregue</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Fotos Selecionadas pelo Cliente</label>
                    <input type="number" id="provaFotosSelecionadas" min="0" value="${p.fotos_selecionadas||0}">
                </div>
                <div class="form-group">
                    <label>Link das Fotos</label>
                    <input type="url" id="provaLink" value="${p.link_fotos||''}">
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-admin-primary">Salvar</button>
            </div>
        </form>
    `);
}

async function saveProva(e) {
    e.preventDefault();
    const id = document.getElementById('provaId').value;
    const payload = {
        titulo: document.getElementById('provaTitulo').value,
        cliente_id: document.getElementById('provaCliente').value,
        projeto_id: document.getElementById('provaProjeto').value || null,
        total_fotos: parseInt(document.getElementById('provaTotalFotos').value) || 0,
        status: document.getElementById('provaStatus').value,
        link_fotos: document.getElementById('provaLink').value || null
    };

    // Se editando, incluir fotos selecionadas
    const selEl = document.getElementById('provaFotosSelecionadas');
    if (selEl) payload.fotos_selecionadas = parseInt(selEl.value) || 0;

    try {
        if (id) {
            const { error } = await supabase.from('provas_fotos').update(payload).eq('id', id);
            if (error) throw error;
            showToast('Prova atualizada!');
        } else {
            const { error } = await supabase.from('provas_fotos').insert([payload]);
            if (error) throw error;
            showToast('Prova criada!');
        }
        closeModal();
        loadProvas();
        loadDashboardStats();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

async function deleteProva(id) {
    if (!confirm('Excluir esta prova de fotos?')) return;
    try {
        const { error } = await supabase.from('provas_fotos').delete().eq('id', id);
        if (error) throw error;
        showToast('Prova excluida!');
        loadProvas();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

// ========================================
// CRUD PORTFOLIO
// ========================================
async function loadPortfolio() {
    try {
        const { data: items, error } = await supabase
            .from('portfolio').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        const tbody = document.getElementById('portfolioTableBody');
        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum item no portfolio</td></tr>';
            return;
        }

        tbody.innerHTML = items.map(item => `
            <tr>
                <td>${item.titulo || ''}</td>
                <td>${item.categoria || ''}</td>
                <td>${item.destaque ? '<i class="fas fa-star" style="color:gold"></i>' : '-'}</td>
                <td>${formatDate(item.created_at)}</td>
                <td>
                    <button class="btn-icon" onclick="openEditPortfolioModal('${item.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deletePortfolio('${item.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro portfolio:', error);
    }
}

function openAddPortfolioModal() {
    openModal('Novo Item do Portfolio', `
        <form id="portfolioForm" class="admin-form" onsubmit="savePortfolio(event)">
            <input type="hidden" id="portfolioId" value="">
            <div class="form-group">
                <label>Titulo *</label>
                <input type="text" id="portfolioTitulo" required placeholder="Titulo do trabalho">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Categoria</label>
                    <select id="portfolioCategoria">
                        <option value="corporativa">Corporativa</option>
                        <option value="ensaio-pessoal">Ensaio Pessoal</option>
                        <option value="eventos">Eventos</option>
                        <option value="produto">Produto</option>
                        <option value="outros">Outros</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Destaque</label>
                    <select id="portfolioDestaque">
                        <option value="false">Nao</option>
                        <option value="true">Sim</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>URL da Imagem</label>
                <input type="url" id="portfolioImagem" placeholder="https://...">
            </div>
            <div class="form-group">
                <label>Descricao</label>
                <textarea id="portfolioDescricao" rows="3" placeholder="Descricao do trabalho..."></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-admin-primary">Salvar</button>
            </div>
        </form>
    `);
}

async function openEditPortfolioModal(id) {
    const { data: item, error } = await supabase.from('portfolio').select('*').eq('id', id).single();
    if (error || !item) { showToast('Erro ao carregar item', 'error'); return; }

    openModal('Editar Item do Portfolio', `
        <form id="portfolioForm" class="admin-form" onsubmit="savePortfolio(event)">
            <input type="hidden" id="portfolioId" value="${item.id}">
            <div class="form-group">
                <label>Titulo *</label>
                <input type="text" id="portfolioTitulo" required value="${item.titulo||''}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Categoria</label>
                    <select id="portfolioCategoria">
                        <option value="corporativa" ${item.categoria==='corporativa'?'selected':''}>Corporativa</option>
                        <option value="ensaio-pessoal" ${item.categoria==='ensaio-pessoal'?'selected':''}>Ensaio Pessoal</option>
                        <option value="eventos" ${item.categoria==='eventos'?'selected':''}>Eventos</option>
                        <option value="produto" ${item.categoria==='produto'?'selected':''}>Produto</option>
                        <option value="outros" ${item.categoria==='outros'?'selected':''}>Outros</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Destaque</label>
                    <select id="portfolioDestaque">
                        <option value="false" ${!item.destaque?'selected':''}>Nao</option>
                        <option value="true" ${item.destaque?'selected':''}>Sim</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>URL da Imagem</label>
                <input type="url" id="portfolioImagem" value="${item.imagem_url||''}">
            </div>
            <div class="form-group">
                <label>Descricao</label>
                <textarea id="portfolioDescricao" rows="3">${item.descricao||''}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-admin-primary">Salvar</button>
            </div>
        </form>
    `);
}

async function savePortfolio(e) {
    e.preventDefault();
    const id = document.getElementById('portfolioId').value;
    const payload = {
        titulo: document.getElementById('portfolioTitulo').value,
        categoria: document.getElementById('portfolioCategoria').value,
        destaque: document.getElementById('portfolioDestaque').value === 'true',
        imagem_url: document.getElementById('portfolioImagem').value || null,
        descricao: document.getElementById('portfolioDescricao').value
    };

    try {
        if (id) {
            const { error } = await supabase.from('portfolio').update(payload).eq('id', id);
            if (error) throw error;
            showToast('Item atualizado!');
        } else {
            const { error } = await supabase.from('portfolio').insert([payload]);
            if (error) throw error;
            showToast('Item adicionado ao portfolio!');
        }
        closeModal();
        loadPortfolio();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

async function deletePortfolio(id) {
    if (!confirm('Excluir este item do portfolio?')) return;
    try {
        const { error } = await supabase.from('portfolio').delete().eq('id', id);
        if (error) throw error;
        showToast('Item excluido!');
        loadPortfolio();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

// ========================================
// CRUD DEPOIMENTOS
// ========================================
async function loadDepoimentos() {
    try {
        const { data: deps, error } = await supabase
            .from('depoimentos').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        const tbody = document.getElementById('depoimentosTableBody');
        if (!deps || deps.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum depoimento cadastrado</td></tr>';
            return;
        }

        tbody.innerHTML = deps.map(d => `
            <tr>
                <td>${d.nome || ''}</td>
                <td>${d.empresa || ''}</td>
                <td>${(d.texto || '').substring(0, 60)}${(d.texto||'').length > 60 ? '...' : ''}</td>
                <td>${d.ativo ? '<span class="badge badge-success">Ativo</span>' : '<span class="badge badge-warning">Inativo</span>'}</td>
                <td>
                    <button class="btn-icon" onclick="openEditDepoimentoModal('${d.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteDepoimento('${d.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro depoimentos:', error);
    }
}

function openAddDepoimentoModal() {
    openModal('Novo Depoimento', `
        <form id="depoimentoForm" class="admin-form" onsubmit="saveDepoimento(event)">
            <input type="hidden" id="depoimentoId" value="">
            <div class="form-row">
                <div class="form-group">
                    <label>Nome *</label>
                    <input type="text" id="depoimentoNome" required placeholder="Nome da pessoa">
                </div>
                <div class="form-group">
                    <label>Empresa</label>
                    <input type="text" id="depoimentoEmpresa" placeholder="Empresa/Cargo">
                </div>
            </div>
            <div class="form-group">
                <label>Depoimento *</label>
                <textarea id="depoimentoTexto" rows="4" required placeholder="O que a pessoa disse..."></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Nota (1-5)</label>
                    <input type="number" id="depoimentoNota" min="1" max="5" value="5">
                </div>
                <div class="form-group">
                    <label>Ativo no site</label>
                    <select id="depoimentoAtivo">
                        <option value="true">Sim</option>
                        <option value="false">Nao</option>
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-admin-primary">Salvar</button>
            </div>
        </form>
    `);
}

async function openEditDepoimentoModal(id) {
    const { data: d, error } = await supabase.from('depoimentos').select('*').eq('id', id).single();
    if (error || !d) { showToast('Erro ao carregar depoimento', 'error'); return; }

    openModal('Editar Depoimento', `
        <form id="depoimentoForm" class="admin-form" onsubmit="saveDepoimento(event)">
            <input type="hidden" id="depoimentoId" value="${d.id}">
            <div class="form-row">
                <div class="form-group">
                    <label>Nome *</label>
                    <input type="text" id="depoimentoNome" required value="${d.nome||''}">
                </div>
                <div class="form-group">
                    <label>Empresa</label>
                    <input type="text" id="depoimentoEmpresa" value="${d.empresa||''}">
                </div>
            </div>
            <div class="form-group">
                <label>Depoimento *</label>
                <textarea id="depoimentoTexto" rows="4" required>${d.texto||''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Nota (1-5)</label>
                    <input type="number" id="depoimentoNota" min="1" max="5" value="${d.nota||5}">
                </div>
                <div class="form-group">
                    <label>Ativo no site</label>
                    <select id="depoimentoAtivo">
                        <option value="true" ${d.ativo?'selected':''}>Sim</option>
                        <option value="false" ${!d.ativo?'selected':''}>Nao</option>
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-admin-primary">Salvar</button>
            </div>
        </form>
    `);
}

async function saveDepoimento(e) {
    e.preventDefault();
    const id = document.getElementById('depoimentoId').value;
    const payload = {
        nome: document.getElementById('depoimentoNome').value,
        empresa: document.getElementById('depoimentoEmpresa').value,
        texto: document.getElementById('depoimentoTexto').value,
        nota: parseInt(document.getElementById('depoimentoNota').value) || 5,
        ativo: document.getElementById('depoimentoAtivo').value === 'true'
    };

    try {
        if (id) {
            const { error } = await supabase.from('depoimentos').update(payload).eq('id', id);
            if (error) throw error;
            showToast('Depoimento atualizado!');
        } else {
            const { error } = await supabase.from('depoimentos').insert([payload]);
            if (error) throw error;
            showToast('Depoimento adicionado!');
        }
        closeModal();
        loadDepoimentos();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

async function deleteDepoimento(id) {
    if (!confirm('Excluir este depoimento?')) return;
    try {
        const { error } = await supabase.from('depoimentos').delete().eq('id', id);
        if (error) throw error;
        showToast('Depoimento excluido!');
        loadDepoimentos();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

// ========================================
// CONFIGURACOES DO SITE
// ========================================
async function loadConfiguracoes() {
    try {
        const { data, error } = await supabase
            .from('configuracoes').select('*').single();
        if (error || !data) return;

        document.getElementById('configWhatsapp').value = data.whatsapp || '';
        document.getElementById('configEmail').value = data.email || '';
        document.getElementById('configInstagram').value = data.instagram || '';
        document.getElementById('configLinkedin').value = data.linkedin || '';
        document.getElementById('configTitulo').value = data.titulo || '';
        document.getElementById('configSubtitulo').value = data.subtitulo || '';
        document.getElementById('configSobre').value = data.sobre || '';
    } catch (error) {
        console.error('Erro configuracoes:', error);
    }
}

async function saveConfiguracoes() {
    const payload = {
        whatsapp: document.getElementById('configWhatsapp').value,
        email: document.getElementById('configEmail').value,
        instagram: document.getElementById('configInstagram').value,
        linkedin: document.getElementById('configLinkedin').value,
        titulo: document.getElementById('configTitulo').value,
        subtitulo: document.getElementById('configSubtitulo').value,
        sobre: document.getElementById('configSobre').value
    };

    try {
        // Tenta atualizar o registro existente, senao cria um novo
        const { data: existing } = await supabase.from('configuracoes').select('id').single();

        if (existing) {
            const { error } = await supabase.from('configuracoes').update(payload).eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('configuracoes').insert([payload]);
            if (error) throw error;
        }

        showToast('Configuracoes salvas com sucesso!');
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

// ========================================
// INICIALIZACAO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadClientes();
});
