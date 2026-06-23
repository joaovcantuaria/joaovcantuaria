// ========================================
// PAINEL ADMINISTRATIVO - JAVASCRIPT
// ========================================

// AGUARDAR O SUPABASE ESTAR PRONTO
function waitForSupabaseReady(callback) {
    let attempts = 0;
    const maxAttempts = 50;
    
    const checkInterval = setInterval(() => {
        attempts++;
        
        if (typeof supabase !== 'undefined' && supabase !== null) {
            clearInterval(checkInterval);
            console.log('✅ Supabase pronto para admin dashboard!');
            callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('❌ Timeout: Supabase não inicializou no admin dashboard');
        }
    }, 100);
}

// Verificar autenticação admin
async function checkAdminAuthentication() {
    if (!supabase) {
        window.location.href = 'admin-login.html';
        return false;
    }

    try {
        // Tentar até 5 vezes com intervalo de 400ms (sessão pode demorar a persistir)
        let session = null;
        for (let i = 0; i < 5; i++) {
            const { data } = await supabase.auth.getSession();
            session = data.session;
            if (session) break;
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        if (!session) {
            window.location.href = 'admin-login.html';
            return false;
        }

        const adminNameElement = document.querySelector('.admin-user-name');
        if (adminNameElement) {
            adminNameElement.textContent = session.user.email.split('@')[0];
        }

        return true;

    } catch (error) {
        console.error('Erro ao verificar autenticação admin:', error);
        window.location.href = 'admin-login.html';
        return false;
    }
}

// ========================================
// NAVEGAÇÃO DA SIDEBAR
// ========================================
const adminSidebar = document.getElementById('adminSidebar');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebarClose = document.getElementById('sidebarClose');
const adminNavItems = document.querySelectorAll('.admin-nav-item');
const adminSections = document.querySelectorAll('.admin-section');
const adminPageTitle = document.querySelector('.admin-page-title');

// Toggle sidebar mobile
if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        adminSidebar.classList.add('active');
    });
}

if (sidebarClose) {
    sidebarClose.addEventListener('click', () => {
        adminSidebar.classList.remove('active');
    });
}

// Navegação
adminNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        const sectionName = item.getAttribute('data-section');
        
        // Atualizar menu ativo
        adminNavItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Mostrar seção
        adminSections.forEach(section => section.classList.remove('active'));
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Atualizar título
        const titles = {
            'dashboard': 'Dashboard',
            'clientes': 'Clientes',
            'projetos': 'Projetos',
            'fotos': 'Sistema de Fotos',
            'financeiro': 'Financeiro',
            'portfolio': 'Portfólio',
            'depoimentos': 'Depoimentos',
            'configuracoes': 'Configurações'
        };
        
        if (adminPageTitle) {
            adminPageTitle.textContent = titles[sectionName] || 'Dashboard';
        }
        
        // Fechar sidebar no mobile
        if (window.innerWidth <= 1024) {
            adminSidebar.classList.remove('active');
        }
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
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            window.location.href = 'admin-login.html';
        }
    });
}

// ========================================
// CARREGAR DADOS DO DASHBOARD
// ========================================
async function loadDashboardStats() {
    try {
        // Carregar total de clientes
        const { count: clientesCount } = await supabase
            .from('usuarios')
            .select('*', { count: 'exact', head: true });
        
        document.getElementById('totalClientes').textContent = clientesCount || 0;
        
        // Carregar total de projetos
        const { count: projetosCount } = await supabase
            .from('projetos')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'em_andamento');
        
        document.getElementById('totalProjetos').textContent = projetosCount || 0;
        
        console.log('📊 Dashboard stats carregadas!');
        
    } catch (error) {
        console.error('Erro ao carregar stats:', error);
    }
}

// ========================================
// CARREGAR CLIENTES
// ========================================
async function loadClientes() {
    try {
        const { data: clientes, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('data_criacao', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.getElementById('clientesTableBody');
        
        if (!clientes || clientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhum cliente cadastrado</td></tr>';
            return;
        }
        
        tbody.innerHTML = clientes.map(cliente => `
            <tr>
                <td>${cliente.nome_completo || 'Sem nome'}</td>
                <td>${cliente.email}</td>
                <td>${cliente.telefone || 'N/A'}</td>
                <td>0</td>
                <td>${new Date(cliente.data_criacao).toLocaleDateString('pt-BR')}</td>
                <td>
                    <button class="btn-icon" onclick="editClient('${cliente.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteClient('${cliente.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log('✅ Clientes carregados:', clientes.length);
        
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

// ========================================
// FUNÇÕES DE MODAL (PLACEHOLDERS)
// ========================================
function openAddClientModal() {
    alert('Modal de adicionar cliente - Em desenvolvimento!\n\nEm breve você poderá adicionar clientes manualmente pelo painel.');
}

function openAddProjectModal() {
    alert('Modal de adicionar projeto - Em desenvolvimento!\n\nEm breve você poderá criar projetos diretamente pelo painel.');
}

function openAddIncomeModal() {
    alert('Modal de adicionar receita - Em desenvolvimento!\n\nSistema de gestão financeira será implementado em breve.');
}

function openAddExpenseModal() {
    alert('Modal de adicionar despesa - Em desenvolvimento!\n\nSistema de gestão financeira será implementado em breve.');
}

function editClient(id) {
    alert('Editar cliente ' + id + ' - Em desenvolvimento!');
}

function deleteClient(id) {
    if (confirm('Deseja realmente excluir este cliente?')) {
        alert('Função de exclusão - Em desenvolvimento!');
    }
}

// ========================================
// INICIALIZAÇÃO
// ========================================
waitForSupabaseReady(() => {
    // Usar o listener nativo do Supabase
    // Ele dispara assim que a sessão estiver pronta
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Sessão válida — atualizar nome e carregar dados
            const adminNameElement = document.querySelector('.admin-user-name');
            if (adminNameElement && session) {
                adminNameElement.textContent = session.user.email.split('@')[0];
            }
            loadDashboardStats();
            loadClientes();

        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            // Sem sessão — ir para login
            window.location.href = 'admin-login.html';

        } else if (event === 'INITIAL_SESSION') {
            // Verificação inicial
            if (!session) {
                window.location.href = 'admin-login.html';
            } else {
                const adminNameElement = document.querySelector('.admin-user-name');
                if (adminNameElement) {
                    adminNameElement.textContent = session.user.email.split('@')[0];
                }
                loadDashboardStats();
                loadClientes();
            }
        }
    });
});
