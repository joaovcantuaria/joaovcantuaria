# 🛡️ PAINEL ADMINISTRATIVO

## 📂 Arquivos Criados

✅ **admin-login.html** - Página de login administrativo  
✅ **admin-dashboard.html** - Dashboard principal do admin  
✅ **admin-auth.js** - Sistema de autenticação admin  
✅ **admin.js** - Funcionalidades do painel  
✅ **admin-styles.css** - Estilos do painel administrativo  

## 🔐 COMO ACESSAR

### URL de Acesso:
```
http://127.0.0.1:5500/admin/admin-login.html
```

### Credenciais de Teste:
```
Email: admin@joaovcantuaria.com
Senha: Admin@2026
```

**OBS:** Você pode fazer login com QUALQUER usuário cadastrado no sistema. A verificação de permissões de admin será implementada posteriormente.

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### ✅ Dashboard Principal
- 📊 Estatísticas gerais (clientes, projetos, receita, fotos)
- 🔔 Atividades recentes
- ⚠️ Projetos urgentes

### ✅ Gestão de Clientes
- 📋 Listagem de todos os clientes cadastrados
- 📊 Tabela com informações completas
- 🔍 Integração com Supabase

### ✅ Gestão de Projetos
- 📁 Visualização de projetos
- 📊 Status e progresso

### ✅ Sistema Financeiro Privado
- 💰 Controle de receitas
- 💸 Controle de despesas
- 📈 Saldo líquido
- 📊 Relatórios financeiros

### 🚧 Em Desenvolvimento
- 📸 Sistema de Provas de Fotos (upload com watermark)
- 🎨 Gerenciamento de Portfólio
- ⭐ Gerenciamento de Depoimentos
- ⚙️ Configurações do Site

## 🔧 INTEGRAÇÃO COM SUPABASE

O painel administrativo está configurado para usar o Supabase com as mesmas credenciais da área do cliente:

```javascript
URL: https://gzetvnqnqmjrkcfsjxyk.supabase.co
Key: sb_publishable_i5bIlH9xOl7Oeh3MEVnuXg_F7Zp3aZ5
```

## 📊 DADOS CARREGADOS

Atualmente o painel carrega:

1. **Total de Clientes** - Da tabela `usuarios`
2. **Total de Projetos Ativos** - Da tabela `projetos` (status: em_andamento)
3. **Lista Completa de Clientes** - Com todos os dados cadastrados

## 🎨 DESIGN

- **Cores:** Preto (#000), Dourado (#FFD700), Branco (#FFF)
- **Sidebar:** Fixa com navegação
- **Responsivo:** Funciona em desktop, tablet e mobile
- **Tema:** Elegante e profissional

## 🔒 SEGURANÇA

⚠️ **IMPORTANTE:**

1. O painel administrativo atualmente aceita login de qualquer usuário autenticado
2. É necessário implementar uma tabela `admins` ou campo `is_admin` na tabela `usuarios`
3. A área financeira é **PRIVADA** - não deve ser acessível aos clientes

### Próximos Passos de Segurança:

1. Criar tabela `admins` no Supabase:
```sql
CREATE TABLE admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL,
    nivel TEXT DEFAULT 'admin', -- admin, super_admin
    data_criacao TIMESTAMP DEFAULT NOW()
);
```

2. Adicionar verificação no `admin-auth.js`:
```javascript
// Verificar se é admin
const { data: adminData } = await supabase
    .from('admins')
    .select('*')
    .eq('id', authData.user.id)
    .single();

if (!adminData) {
    throw new Error('Acesso negado. Você não tem permissões de administrador.');
}
```

## 🚀 COMO TESTAR

1. Certifique-se que o Live Server está rodando
2. Acesse: `http://127.0.0.1:5500/admin/admin-login.html`
3. Faça login com as credenciais de teste
4. Explore o painel administrativo!

## 📝 LOGS ESPERADOS NO CONSOLE

```
🚀 Inicializando Supabase no painel admin...
✅ Cliente Supabase criado no admin!
✅ Supabase pronto para admin!
✅ Admin autenticado: admin@joaovcantuaria.com
🎛️ Painel administrativo carregado!
✅ Admin autenticado, carregando dados...
📊 Dashboard stats carregadas!
✅ Clientes carregados: X
```

## 🔗 NAVEGAÇÃO DO SITE

- **Site Principal:** `index.html`
- **Login Clientes:** `login.html`
- **Área do Cliente:** `area-cliente.html`
- **Login Admin:** `admin/admin-login.html` ⬅️ VOCÊ ESTÁ AQUI
- **Dashboard Admin:** `admin/admin-dashboard.html`

---

**Criado em:** 22/06/2026  
**Status:** ✅ FUNCIONAL (necessita implementação de segurança adicional)
