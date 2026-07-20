// ========================================
// CONFIGURAÇÃO DO SUPABASE
// João V. Cantuária - Publicidade e Fotografia
// ========================================

// ⚠️ SUAS CREDENCIAIS DO SUPABASE
var SUPABASE_URL = 'https://gzetvnqnqmjrkcfsjxyk.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_i5bIlH9xOl7Oeh3MEVnuXg_F7Zp3aZ5';

// Variável global
var supabase = null;

// Função para tentar inicializar
function tryInitSupabase() {
    // Verificar se SDK está disponível
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase inicializado com sucesso!');
            console.log('🔗 URL:', SUPABASE_URL);
            return true;
        } catch (error) {
            console.error('❌ Erro ao criar cliente:', error);
            return false;
        }
    }
    return false;
}

// Tentar inicializar várias vezes até funcionar
var attempts = 0;
var maxAttempts = 50;

function waitForSupabase() {
    attempts++;
    
    if (tryInitSupabase()) {
        console.log('✅ Supabase pronto!');
        return;
    }
    
    if (attempts < maxAttempts) {
        console.log('⏳ Aguardando SDK... (tentativa ' + attempts + ')');
        setTimeout(waitForSupabase, 100);
    } else {
        console.error('❌ SDK do Supabase não carregou após ' + maxAttempts + ' tentativas');
        console.error('📝 Verifique sua conexão com a internet');
    }
}

// Iniciar
waitForSupabase();
