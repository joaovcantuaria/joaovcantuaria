// ========================================
// DASHBOARD - ÁREA DO CLIENTE
// ========================================

// AGUARDAR O SUPABASE ESTAR PRONTO
function waitForSupabaseReady(callback) {
    let attempts = 0;
    const maxAttempts = 50;
    
    const checkInterval = setInterval(() => {
        attempts++;
        
        if (typeof supabase !== 'undefined' && supabase !== null) {
            clearInterval(checkInterval);
            console.log('✅ Supabase pronto para o dashboard!');
            callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('❌ Timeout: Supabase não inicializou no dashboard');
        }
    }, 100);
}

// Verificar autenticação ao carregar
async function checkAuthentication() {
    console.log('🔍 CHECKPOINT 1: Iniciando checkAuthentication');
    console.log('🔍 CHECKPOINT 2: supabase existe?', typeof supabase, supabase !== null);
    
    // AGUARDAR supabase estar pronto
    if (!supabase) {
        console.error('❌ ERRO FATAL: Supabase não está pronto!');
        alert('ERRO: Supabase não inicializou. Veja o console.');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Pausa de 5 segundos
        window.location.href = 'login.html';
        return false;
    }
    
    console.log('🔍 CHECKPOINT 3: Supabase OK, tentando getSession...');
    
    try {
        // Verificar sessão do Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔍 CHECKPOINT 4: Resposta do getSession');
        console.log('  - session:', session ? 'EXISTE' : 'NULL');
        console.log('  - error:', error);
        
        if (error) {
            console.error('❌ ERRO ao verificar sessão:', error);
            alert('ERRO ao verificar sessão: ' + error.message);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Pausa de 5 segundos
            window.location.href = 'login.html';
            return false;
        }
        
        if (!session) {
            // Não está logado, redirecionar para login
            console.log('⚠️ Sessão não encontrada, redirecionando...');
            alert('Sessão não encontrada. Faça login novamente.');
            await new Promise(resolve => setTimeout(resolve, 3000)); // Pausa de 3 segundos
            window.location.href = 'login.html';
            return false;
        }
        
        console.log('✅ CHECKPOINT 5: Sessão válida encontrada!', session.user.email);
        
        // Carregar dados do usuário do Supabase
        try {
            console.log('🔍 CHECKPOINT 6: Buscando dados do usuário...');
            
            const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            console.log('🔍 CHECKPOINT 7: Dados do usuário recebidos');
            console.log('  - userData:', userData);
            console.log('  - userError:', userError);
            
            if (userData) {
                updateUserInfo({
                    id: userData.id,
                    name: userData.nome_completo,
                    email: userData.email,
                    phone: userData.telefone,
                    company: userData.empresa
                });
                
                // Salvar no localStorage para acesso rápido
                localStorage.setItem('userData', JSON.stringify({
                    id: userData.id,
                    name: userData.nome_completo,
                    email: userData.email
                }));
            } else {
                // Se não tem dados na tabela, usar dados básicos do auth
                console.log('⚠️ Usuário não encontrado na tabela, usando dados básicos');
                updateUserInfo({
                    id: session.user.id,
                    name: session.user.email.split('@')[0],
                    email: session.user.email
                });
            }
        } catch (error) {
            console.error('⚠️ Erro ao carregar dados do usuário:', error);
            // Mesmo com erro, usa dados básicos
            updateUserInfo({
                id: session.user.id,
                name: session.user.email.split('@')[0],
                email: session.user.email
            });
        }
        
        console.log('✅ CHECKPOINT 8: Autenticação completa com sucesso!');
        return true;
        
    } catch (error) {
        console.error('❌ ERRO FATAL ao verificar autenticação:', error);
        console.error('Stack trace:', error.stack);
        alert('ERRO FATAL: ' + error.message + '\nVeja o console para detalhes.');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Pausa de 5 segundos
        window.location.href = 'login.html';
        return false;
    }
}

// Atualizar informações do usuário na interface
function updateUserInfo(user) {
    const userName = document.querySelector('.user-name');
    const userAvatar = document.querySelector('.user-avatar');
    
    if (userName) {
        userName.textContent = user.name || 'Usuário';
    }
    
    if (userAvatar && user.name) {
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=FFD700&color=000`;
        userAvatar.alt = user.name;
    }
}

// Executar verificação (agora assíncrona)
checkAuthentication().then(isAuthenticated => {
    if (!isAuthenticated) {
        throw new Error('Não autenticado');
    }
});

// ========================================
// ELEMENTOS DO DOM
// ========================================
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const logoutBtn = document.getElementById('logoutBtn');
const pageTitle = document.querySelector('.page-title');

// ========================================
// NAVEGAÇÃO DA SIDEBAR
// ========================================

// Toggle sidebar no mobile
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });
}

// Fechar sidebar ao clicar fora (mobile)
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024) {
        if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    }
});

// Navegação entre seções
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        const sectionName = item.getAttribute('data-section');
        
        // Atualizar menu ativo
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Mostrar seção correspondente
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Atualizar título da página
        const titles = {
            'dashboard': 'Dashboard',
            'projetos': 'Meus Projetos',
            'galeria': 'Galeria',
            'mensagens': 'Mensagens',
            'arquivos': 'Arquivos',
            'perfil': 'Meu Perfil'
        };
        
        if (pageTitle) {
            pageTitle.textContent = titles[sectionName] || 'Dashboard';
        }
        
        // Fechar sidebar no mobile
        if (window.innerWidth <= 1024) {
            sidebar.classList.remove('active');
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// ========================================
// LOGOUT
// ========================================
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if (confirm('Deseja realmente sair?')) {
            // Fazer logout no Supabase
            await supabase.auth.signOut();
            
            // Limpar dados locais
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('userData');
            
            // Redirecionar para login
            window.location.href = 'login.html';
        }
    });
}

// ========================================
// FUNCIONALIDADES DOS PROJETOS
// ========================================

// Carregar projetos do Supabase
async function loadProjects() {
    try {
        // Obter usuário atual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        // Buscar projetos do usuário
        const { data: projetos, error } = await supabase
            .from('projetos')
            .select('*')
            .eq('cliente_id', session.user.id)
            .order('data_criacao', { ascending: false });
        
        if (error) {
            console.error('Erro ao carregar projetos:', error);
            return;
        }
        
        console.log('Projetos carregados:', projetos);
        
        // Aqui você pode atualizar a interface com os projetos reais
        // Por exemplo, popular a lista de projetos dinamicamente
        
    } catch (error) {
        console.error('Erro ao carregar projetos:', error);
    }
}

// ========================================
// GALERIA DE FOTOS
// ========================================

// Visualizar foto em tela cheia (lightbox simples)
const galleryItems = document.querySelectorAll('.gallery-item');

galleryItems.forEach(item => {
    const viewBtn = item.querySelector('.fa-eye')?.parentElement;
    const downloadBtn = item.querySelector('.fa-download')?.parentElement;
    const img = item.querySelector('img');
    
    if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openLightbox(img.src);
        });
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            downloadImage(img.src);
        });
    }
});

// Lightbox simples
function openLightbox(imageSrc) {
    // Criar overlay
    const lightbox = document.createElement('div');
    lightbox.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    `;
    
    // Criar imagem
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 10px;
        box-shadow: 0 10px 50px rgba(255, 215, 0, 0.3);
    `;
    
    // Botão fechar
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: #FFD700;
        color: #000;
        border: none;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        font-size: 1.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    
    closeBtn.addEventListener('mouseover', () => {
        closeBtn.style.transform = 'scale(1.1)';
    });
    
    closeBtn.addEventListener('mouseout', () => {
        closeBtn.style.transform = 'scale(1)';
    });
    
    lightbox.appendChild(img);
    lightbox.appendChild(closeBtn);
    document.body.appendChild(lightbox);
    
    // Fechar ao clicar
    lightbox.addEventListener('click', () => {
        document.body.removeChild(lightbox);
    });
    
    // Prevenir propagação no clique da imagem
    img.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// Download de imagem
function downloadImage(url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'foto-' + Date.now() + '.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ========================================
// NOTIFICAÇÕES
// ========================================
const notificationBtn = document.querySelector('.notification-btn');

if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
        alert('Sistema de notificações em desenvolvimento!\n\nEm breve você poderá:\n- Ver atualizações de projetos\n- Receber mensagens\n- Acompanhar entregas');
    });
}

// ========================================
// MENU DO USUÁRIO
// ========================================
const userMenu = document.querySelector('.user-menu');

if (userMenu) {
    userMenu.addEventListener('click', () => {
        // Criar dropdown menu (simples)
        const hasDropdown = document.querySelector('.user-dropdown');
        
        if (hasDropdown) {
            hasDropdown.remove();
            return;
        }
        
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
            padding: 1rem;
            min-width: 200px;
            margin-top: 0.5rem;
            z-index: 1000;
        `;
        
        dropdown.innerHTML = `
            <div style="padding: 0.5rem; border-bottom: 1px solid #eee; margin-bottom: 0.5rem;">
                <strong style="color: #000;">Minha Conta</strong>
            </div>
            <a href="#perfil" class="dropdown-item" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; color: #333; text-decoration: none; border-radius: 5px; transition: all 0.3s;">
                <i class="fas fa-user"></i> Meu Perfil
            </a>
            <a href="#" class="dropdown-item" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; color: #333; text-decoration: none; border-radius: 5px; transition: all 0.3s;">
                <i class="fas fa-cog"></i> Configurações
            </a>
            <div style="border-top: 1px solid #eee; margin: 0.5rem 0;"></div>
            <a href="#" class="dropdown-item logout-dropdown" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; color: #e74c3c; text-decoration: none; border-radius: 5px; transition: all 0.3s;">
                <i class="fas fa-sign-out-alt"></i> Sair
            </a>
        `;
        
        userMenu.style.position = 'relative';
        userMenu.appendChild(dropdown);
        
        // Hover effect
        const items = dropdown.querySelectorAll('.dropdown-item');
        items.forEach(item => {
            item.addEventListener('mouseover', () => {
                item.style.background = '#f5f5f5';
            });
            item.addEventListener('mouseout', () => {
                item.style.background = 'transparent';
            });
        });
        
        // Logout do dropdown
        const logoutDropdown = dropdown.querySelector('.logout-dropdown');
        if (logoutDropdown) {
            logoutDropdown.addEventListener('click', async (e) => {
                e.preventDefault();
                if (confirm('Deseja realmente sair?')) {
                    // Fazer logout no Supabase
                    await supabase.auth.signOut();
                    
                    // Limpar dados locais
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }
            });
        }
        
        // Fechar ao clicar fora
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!userMenu.contains(e.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 100);
    });
}

// ========================================
// ANIMAÇÕES E EFEITOS
// ========================================

// Animar contadores ao entrar na viewport
function animateCounters() {
    const counters = document.querySelectorAll('.stat-info h3');
    
    counters.forEach(counter => {
        const target = parseInt(counter.textContent);
        const duration = 1000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        // Observar quando entra na viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.disconnect();
                }
            });
        });
        
        observer.observe(counter);
    });
}

// Executar animações
animateCounters();

// ========================================
// INICIALIZAÇÃO
// ========================================

waitForSupabaseReady(() => {
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            updateUserInfo({
                id: session.user.id,
                name: session.user.email.split('@')[0],
                email: session.user.email
            });
            loadProjects();

        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            window.location.href = 'login.html';

        } else if (event === 'INITIAL_SESSION') {
            if (!session) {
                window.location.href = 'login.html';
            } else {
                supabase.from('usuarios')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
                    .then(({ data }) => {
                        updateUserInfo({
                            id: session.user.id,
                            name: data?.nome_completo || session.user.email.split('@')[0],
                            email: session.user.email,
                            phone: data?.telefone || '',
                            company: data?.empresa || ''
                        });
                    });
                loadProjects();
            }
        }
    });
});
