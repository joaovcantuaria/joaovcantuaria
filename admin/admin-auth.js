// ========================================
// AUTENTICAÇÃO ADMINISTRATIVA
// ========================================

// AGUARDAR O SUPABASE ESTAR PRONTO
function waitForSupabaseReady(callback) {
    let attempts = 0;
    const maxAttempts = 50;
    
    const checkInterval = setInterval(() => {
        attempts++;
        
        if (typeof supabase !== 'undefined' && supabase !== null) {
            clearInterval(checkInterval);
            console.log('✅ Supabase pronto para admin!');
            callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('❌ Timeout: Supabase não inicializou no admin');
            showAdminMessage('Erro ao carregar sistema. Recarregue a página.', 'error');
        }
    }, 100);
}

// Elementos do DOM
const adminLoginForm = document.getElementById('adminLoginForm');
const togglePasswordButtons = document.querySelectorAll('.toggle-password');

// Toggle de senha
togglePasswordButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
});

// Mostrar mensagem
function showAdminMessage(message, type = 'error') {
    const messageElement = document.getElementById('adminMessage');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `admin-message ${type} show`;
        
        setTimeout(() => {
            messageElement.classList.remove('show');
        }, 5000);
    }
}

// Login do Admin
async function adminLogin(email, password) {
    try {
        // Fazer login no Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // Verificar se é admin (você pode criar uma tabela 'admins' ou usar metadados)
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        // Por enquanto, qualquer usuário logado pode acessar o admin
        // TODO: Adicionar verificação de permissão de admin
        
        return {
            success: true,
            user: {
                id: authData.user.id,
                email: authData.user.email,
                name: userData?.nome_completo || authData.user.email
            },
            token: authData.session.access_token
        };

    } catch (error) {
        console.error('Erro no login admin:', error);
        return {
            success: false,
            message: getErrorMessage(error.message)
        };
    }
}

// Mensagens de erro em português
function getErrorMessage(message) {
    const errors = {
        'Invalid login credentials': 'E-mail ou senha incorretos.',
        'Email not confirmed': 'E-mail não confirmado.',
        'User already registered': 'Este e-mail já está cadastrado.',
        'Password should be at least 6 characters': 'A senha deve ter no mínimo 6 caracteres.',
        'Invalid email': 'E-mail inválido.',
        'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.'
    };
    
    for (const [key, value] of Object.entries(errors)) {
        if (message.includes(key)) {
            return value;
        }
    }
    
    return message || 'Erro ao processar requisição.';
}

// Form de login
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;
        
        if (!email || !password) {
            showAdminMessage('Preencha todos os campos.', 'error');
            return;
        }
        
        try {
            showAdminMessage('Verificando credenciais...', 'success');
            
            const response = await adminLogin(email, password);
            
            if (response.success) {
                // Salvar dados do admin
                localStorage.setItem('adminToken', response.token);
                localStorage.setItem('adminData', JSON.stringify(response.user));
                
                showAdminMessage('Login realizado! Redirecionando...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1000);
            } else {
                showAdminMessage(response.message, 'error');
            }
        } catch (error) {
            showAdminMessage('Erro ao conectar. Verifique sua internet.', 'error');
            console.error('Erro:', error);
        }
    });
}

// Verificar se já está logado
async function checkAdminAuth() {
    if (!supabase) {
        console.log('⏳ Aguardando Supabase...');
        return;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session && window.location.pathname.includes('admin-login.html')) {
        window.location.href = 'admin-dashboard.html';
    }
}

// Aguardar Supabase estar pronto
waitForSupabaseReady(() => {
    checkAdminAuth();
    console.log('Sistema de autenticação admin pronto! 🔐');
});
