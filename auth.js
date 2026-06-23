// ========================================
// SISTEMA DE AUTENTICAÇÃO COM SUPABASE
// João V. Cantuária - Publicidade e Fotografia
// ========================================

// AGUARDAR O SUPABASE ESTAR PRONTO
function waitForSupabaseReady(callback) {
    let attempts = 0;
    const maxAttempts = 50;
    
    const checkInterval = setInterval(() => {
        attempts++;
        
        if (typeof supabase !== 'undefined' && supabase !== null) {
            clearInterval(checkInterval);
            console.log('✅ Supabase pronto para autenticação!');
            callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('❌ Timeout: Supabase não inicializou');
            alert('Erro ao carregar sistema de autenticação. Recarregue a página.');
        }
    }, 100);
}

// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const closeForgotModal = document.getElementById('closeForgotModal');

// ========================================
// TOGGLE DE SENHA (Mostrar/Ocultar)
// ========================================
const togglePasswordButtons = document.querySelectorAll('.toggle-password');

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

// ========================================
// FUNÇÕES DE UTILIDADE
// ========================================

// Mostrar mensagem
function showMessage(message, type = 'error') {
    const messageElement = document.getElementById('authMessage');
    messageElement.textContent = message;
    messageElement.className = `auth-message ${type} show`;
    
    // Auto-ocultar após 5 segundos
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 5000);
}

// Validar e-mail
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validar senha
function validatePassword(password) {
    return password.length >= 6;
}

// Validar telefone brasileiro
function validatePhone(phone) {
    const re = /^[\d\s()-]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// ========================================
// FUNÇÕES SUPABASE
// ========================================

// LOGIN com Supabase
async function loginUser(email, password) {
    try {
        // Fazer login no Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // Buscar dados adicionais do usuário
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (userError) {
            // Se não encontrou dados, criar registro básico
            const { error: insertError } = await supabase
                .from('usuarios')
                .insert([{
                    id: authData.user.id,
                    email: authData.user.email,
                    nome_completo: authData.user.email.split('@')[0]
                }]);
            
            if (insertError) console.error('Erro ao criar registro:', insertError);
        }

        return {
            success: true,
            user: {
                id: authData.user.id,
                email: authData.user.email,
                name: userData?.nome_completo || authData.user.email,
                phone: userData?.telefone || '',
                company: userData?.empresa || ''
            },
            token: authData.session.access_token
        };

    } catch (error) {
        console.error('Erro no login:', error);
        return {
            success: false,
            message: getSupabaseErrorMessage(error.message)
        };
    }
}

// CADASTRO com Supabase
async function registerUser(userData) {
    try {
        // 1. Criar usuário na autenticação Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    nome_completo: `${userData.firstName} ${userData.lastName}`
                }
            }
        });

        if (authError) throw authError;

        // 2. Salvar dados adicionais na tabela usuarios
        const { error: dbError } = await supabase
            .from('usuarios')
            .insert([{
                id: authData.user.id,
                email: userData.email,
                nome_completo: `${userData.firstName} ${userData.lastName}`,
                telefone: userData.phone,
                empresa: userData.company || ''
            }]);

        if (dbError) {
            console.error('Erro ao salvar dados:', dbError);
            // Não bloqueia o cadastro se falhar
        }

        return {
            success: true,
            message: 'Cadastro realizado com sucesso! Você já pode fazer login.'
        };

    } catch (error) {
        console.error('Erro no cadastro:', error);
        return {
            success: false,
            message: getSupabaseErrorMessage(error.message)
        };
    }
}

// RECUPERAR SENHA com Supabase
async function sendPasswordReset(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });

        if (error) throw error;

        return {
            success: true,
            message: 'E-mail de recuperação enviado com sucesso!'
        };

    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        return {
            success: false,
            message: getSupabaseErrorMessage(error.message)
        };
    }
}

// LOGOUT
async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userData');
    window.location.href = 'login.html';
}

// Mensagens de erro em português
function getSupabaseErrorMessage(message) {
    const errors = {
        'Invalid login credentials': 'E-mail ou senha incorretos.',
        'Email not confirmed': 'Por favor, confirme seu e-mail antes de fazer login.',
        'User already registered': 'Este e-mail já está cadastrado.',
        'Password should be at least 6 characters': 'A senha deve ter no mínimo 6 caracteres.',
        'Unable to validate email address': 'E-mail inválido.',
        'Signup requires a valid password': 'Senha inválida.',
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

// ========================================
// LOGIN
// ========================================
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const remember = document.getElementById('rememberMe').checked;
        
        // Validações
        if (!validateEmail(email)) {
            showMessage('Por favor, insira um e-mail válido.', 'error');
            return;
        }
        
        if (!validatePassword(password)) {
            showMessage('A senha deve ter no mínimo 6 caracteres.', 'error');
            return;
        }
        
        try {
            showMessage('Fazendo login...', 'success');
            
            // Login real com Supabase
            const response = await loginUser(email, password);
            
            if (response.success) {
                // Salvar dados
                if (remember) {
                    localStorage.setItem('authToken', response.token);
                    localStorage.setItem('userData', JSON.stringify(response.user));
                } else {
                    sessionStorage.setItem('authToken', response.token);
                    sessionStorage.setItem('userData', JSON.stringify(response.user));
                }
                
                showMessage('Login realizado com sucesso! Redirecionando...', 'success');
                
                // Redirecionar
                setTimeout(() => {
                    window.location.href = 'area-cliente.html';
                }, 1000);
            } else {
                showMessage(response.message, 'error');
            }
        } catch (error) {
            showMessage('Erro ao conectar. Verifique sua internet.', 'error');
            console.error('Erro:', error);
        }
    });
}

// ========================================
// CADASTRO
// ========================================
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const company = document.getElementById('company').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const acceptTerms = document.getElementById('acceptTerms').checked;
        
        // Validações
        if (!firstName || !lastName) {
            showMessage('Por favor, preencha seu nome completo.', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showMessage('Por favor, insira um e-mail válido.', 'error');
            return;
        }
        
        if (!validatePhone(phone)) {
            showMessage('Por favor, insira um telefone válido.', 'error');
            return;
        }
        
        if (!validatePassword(password)) {
            showMessage('A senha deve ter no mínimo 6 caracteres.', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('As senhas não coincidem.', 'error');
            return;
        }
        
        if (!acceptTerms) {
            showMessage('Você precisa aceitar os termos de uso.', 'error');
            return;
        }
        
        try {
            showMessage('Criando sua conta...', 'success');
            
            // Cadastro real com Supabase
            const response = await registerUser({
                firstName,
                lastName,
                email,
                phone,
                company,
                password
            });
            
            if (response.success) {
                showMessage('Conta criada com sucesso! Redirecionando para login...', 'success');
                
                // Redirecionar para login
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showMessage(response.message, 'error');
            }
        } catch (error) {
            showMessage('Erro ao conectar. Verifique sua internet.', 'error');
            console.error('Erro:', error);
        }
    });
}

// ========================================
// RECUPERAÇÃO DE SENHA
// ========================================

// Abrir modal
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordModal.classList.add('show');
    });
}

// Fechar modal
if (closeForgotModal) {
    closeForgotModal.addEventListener('click', () => {
        forgotPasswordModal.classList.remove('show');
    });
}

// Fechar modal ao clicar fora
if (forgotPasswordModal) {
    forgotPasswordModal.addEventListener('click', (e) => {
        if (e.target === forgotPasswordModal) {
            forgotPasswordModal.classList.remove('show');
        }
    });
}

// Formulário de recuperação
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('forgotEmail').value.trim();
        
        if (!validateEmail(email)) {
            alert('Por favor, insira um e-mail válido.');
            return;
        }
        
        try {
            // Enviar e-mail de recuperação com Supabase
            const response = await sendPasswordReset(email);
            
            if (response.success) {
                alert('Instruções enviadas para seu e-mail!');
                forgotPasswordModal.classList.remove('show');
                forgotPasswordForm.reset();
            } else {
                alert(response.message || 'Erro ao enviar instruções. Verifique o e-mail.');
            }
        } catch (error) {
            alert('Erro ao conectar com o servidor. Tente novamente.');
            console.error('Erro:', error);
        }
    });
}

// ========================================
// LOGIN SOCIAL COM SUPABASE
// ========================================
const socialButtons = document.querySelectorAll('.btn-social');

socialButtons.forEach(button => {
    button.addEventListener('click', async () => {
        const provider = button.classList.contains('btn-google') ? 'google' : 'facebook';
        
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: window.location.origin + '/area-cliente.html'
                }
            });
            
            if (error) {
                showMessage(`Erro ao conectar com ${provider.charAt(0).toUpperCase() + provider.slice(1)}`, 'error');
                console.error(error);
            }
        } catch (error) {
            showMessage(`Login com ${provider.charAt(0).toUpperCase() + provider.slice(1)} em desenvolvimento!`, 'error');
            console.error('Erro:', error);
        }
    });
});



// ========================================
// VERIFICAR SE USUÁRIO JÁ ESTÁ LOGADO
// ========================================
async function checkAuth() {
    // AGUARDAR supabase estar pronto
    if (!supabase) {
        console.log('⏳ Aguardando Supabase inicializar...');
        return;
    }
    
    // Verificar sessão no Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session && (window.location.pathname.includes('login.html') || window.location.pathname.includes('cadastro.html'))) {
        // Se já está logado e tenta acessar login/cadastro, redireciona
        window.location.href = 'area-cliente.html';
    }
}

// Aguardar Supabase estar pronto antes de verificar auth
waitForSupabaseReady(() => {
    checkAuth();
    console.log('Sistema de autenticação pronto! 🔐');
});
