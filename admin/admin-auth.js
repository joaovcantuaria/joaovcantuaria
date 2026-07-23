// ========================================
// AUTENTICACAO ADMINISTRATIVA
// ========================================

function waitForSupabaseReady(callback) {
    let attempts = 0;
    const maxAttempts = 50;
    const checkInterval = setInterval(() => {
        attempts++;
        if (typeof supabase !== 'undefined' && supabase !== null) {
            clearInterval(checkInterval);
            callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            showAdminMessage('Erro ao carregar sistema. Recarregue a pagina.', 'error');
        }
    }, 100);
}

// Toggle de senha
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
        const input = document.getElementById(button.getAttribute('data-target'));
        const icon = button.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });
});

function showAdminMessage(message, type = 'error') {
    const el = document.getElementById('adminMessage');
    if (el) {
        el.textContent = message;
        el.className = `admin-message ${type} show`;
        setTimeout(() => el.classList.remove('show'), 5000);
    }
}

// Form de login
const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;

        if (!email || !password) {
            showAdminMessage('Preencha todos os campos.', 'error');
            return;
        }

        const btn = adminLoginForm.querySelector('button[type="submit"]');
        btn.textContent = 'Verificando...';
        btn.disabled = true;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            console.log('Login OK, usuario:', data.user.id);

            // Verificar se e admin ANTES de redirecionar
            const { data: adminData, error: adminError } = await supabase
                .from('admins')
                .select('id')
                .eq('id', data.user.id)
                .maybeSingle();

            console.log('Admin check:', { adminData, adminError });

            if (!adminData) {
                await supabase.auth.signOut();
                showAdminMessage('Acesso negado. Voce nao tem permissao de administrador.', 'error');
                btn.textContent = 'Acessar Painel';
                btn.disabled = false;
                return;
            }

            showAdminMessage('Acesso autorizado! Redirecionando...', 'success');

            // Aguardar sessao ser completamente persistida
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Redirecionar
            window.location.href = 'admin-dashboard.html';

        } catch (error) {
            const msgs = {
                'Invalid login credentials': 'E-mail ou senha incorretos.',
                'Email not confirmed': 'E-mail nao confirmado.',
                'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.'
            };
            const found = Object.entries(msgs).find(([k]) => error.message.includes(k));
            showAdminMessage(found ? found[1] : error.message, 'error');
            btn.textContent = 'Acessar Painel';
            btn.disabled = false;
        }
    });
}

// Se ja estiver logado E for admin, redirecionar
async function checkAdminAuth() {
    if (!supabase) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return; // Nao logado, fica na tela de login

        // Verificar se e admin
        const { data: adminData } = await supabase
            .from('admins')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();

        if (adminData) {
            // E admin, redirecionar pro dashboard
            window.location.href = 'admin-dashboard.html';
        }
        // Se nao e admin, apenas fica na pagina de login (nao faz nada)
    } catch (e) {
        console.error('Erro ao verificar auth:', e);
    }
}

waitForSupabaseReady(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('erro') === 'acesso_negado') {
        showAdminMessage('Acesso negado. Voce nao tem permissao de administrador.', 'error');
    } else {
        checkAdminAuth();
    }
});
