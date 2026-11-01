// ========================================
// GUARDA DAS PAGINAS ADMINISTRATIVAS
// Requer a variavel global `supabase` ja criada.
// Sem sessao -> tela de login; logado sem ser admin -> acesso negado.
// ========================================

async function requireAdmin() {
    const loginUrl = '/admin/admin-login.html';
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = loginUrl;
        return new Promise(() => {});
    }

    const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

    if (!adminData) {
        window.location.href = loginUrl + '?erro=acesso_negado';
        return new Promise(() => {});
    }

    return session;
}
