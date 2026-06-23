# 📁 GUIA: CONFIGURAR STORAGE (ARMAZENAMENTO DE FOTOS)
### João V. Cantuária - Supabase Storage

---

## 📋 O QUE VOCÊ VAI FAZER

Configurar os buckets (pastas) para armazenar:
1. **Provas de fotos** (privadas, apenas clientes veem suas fotos)
2. **Portfolio** (público, aparece no site)

---

## 🪣 PASSO 1: CRIAR BUCKETS

### **A) Criar bucket para Provas de Fotos**

1. No Supabase, clique em **"Storage"** no menu lateral esquerdo
2. Clique em **"Create a new bucket"**
3. Preencha:
   - **Name:** `provas-fotos`
   - **Public bucket:** ❌ **DESMARQUE** (deixe privado)
4. Clique em **"Create bucket"**

### **B) Criar bucket para Portfolio**

1. Clique em **"Create a new bucket"** novamente
2. Preencha:
   - **Name:** `portfolio`
   - **Public bucket:** ✅ **MARQUE** (será público)
3. Clique em **"Create bucket"**

---

## 🔒 PASSO 2: CONFIGURAR POLÍTICAS DE ACESSO

### **OPÇÃO 1: Configuração Simples (Recomendada para começar)**

#### **Para bucket `provas-fotos`:**

1. Clique no bucket **`provas-fotos`**
2. Clique na aba **"Policies"**
3. Clique em **"New Policy"**
4. Clique em **"For full customization"** (na parte de baixo)
5. Preencha:

```
Policy name: Usuarios autenticados podem ler e escrever
Allowed operations: Marque SELECT e INSERT
Target roles: authenticated
USING expression: true
WITH CHECK expression: true
```

6. Clique em **"Review"** e depois em **"Save policy"**

#### **Para bucket `portfolio`:**

Como você marcou como **público**, ele já permite leitura. Agora configure o upload:

1. Clique no bucket **`portfolio`**
2. Clique na aba **"Policies"**
3. Clique em **"New Policy"**
4. Clique em **"For full customization"**
5. Preencha:

```
Policy name: Upload apenas autenticados
Allowed operations: Marque INSERT
Target roles: authenticated
USING expression: (deixe vazio)
WITH CHECK expression: true
```

6. Clique em **"Review"** e depois em **"Save policy"**

---

### **OPÇÃO 2: Configuração com SQL (Mais Controle)**

Se você preferir usar SQL para ter mais controle:

#### **1. Acessar o SQL Editor**

1. Clique em **"SQL Editor"** no menu lateral
2. Clique em **"+ New query"**

#### **2. Políticas para `provas-fotos`**

Cole e execute este código SQL:

```sql
-- Permitir que usuários autenticados vejam arquivos
CREATE POLICY "Usuarios podem ler provas"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'provas-fotos'
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados façam upload
CREATE POLICY "Usuarios podem fazer upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'provas-fotos'
  AND auth.role() = 'authenticated'
);
```

#### **3. Políticas para `portfolio`**

Cole e execute este código SQL:

```sql
-- Leitura pública (qualquer um pode ver)
CREATE POLICY "Leitura publica portfolio"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio');

-- Upload apenas para usuários autenticados
CREATE POLICY "Upload autenticado portfolio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio'
  AND auth.role() = 'authenticated'
);
```

---

## ✅ PASSO 3: VERIFICAR SE FUNCIONOU

### **Teste 1: Verificar Buckets**

1. Vá em **Storage**
2. Você deve ver 2 buckets:
   - 📁 `provas-fotos` (privado)
   - 📁 `portfolio` (público)

### **Teste 2: Verificar Políticas**

1. Clique em cada bucket
2. Vá na aba **"Policies"**
3. Você deve ver as políticas criadas listadas

---

## 🚨 PROBLEMAS COMUNS

### **Erro: "new row violates row-level security policy"**

✅ **Solução:** As políticas não foram criadas corretamente. Tente:
1. Ir em Storage → bucket → Policies
2. Deletar todas as políticas
3. Criar novamente usando a **OPÇÃO 1** (mais simples)

### **Erro ao fazer upload de foto**

✅ **Solução:** Verifique se:
1. Você está logado no sistema
2. A política de INSERT existe
3. O bucket foi criado corretamente

### **Fotos não aparecem**

✅ **Solução:** Verifique se:
1. A política de SELECT existe
2. Para `provas-fotos`: usuário está autenticado
3. Para `portfolio`: bucket está marcado como público

---

## 📝 PRÓXIMOS PASSOS

Depois de configurar o Storage:

1. ✅ Testar cadastro e login no site
2. ✅ Verificar se área do cliente carrega
3. 🔄 Implementar upload de fotos no painel admin
4. 🔄 Adicionar marca d'água automática nas fotos

---

## 💡 DICA: CONFIGURAÇÃO RÁPIDA PARA TESTES

Se você só quer testar e não se importa com segurança agora:

1. Em **Storage**, clique no bucket
2. Vá em **"Configuration"**
3. Ative **"Public bucket"**
4. Salve

Isso permite qualquer um ler e escrever (útil para testes, mas **NÃO USE EM PRODUÇÃO**).

---

## 🔐 SEGURANÇA AVANÇADA (FUTURO)

Quando o site estiver funcionando, você pode criar políticas mais restritas:

```sql
-- Exemplo: Apenas admin pode fazer upload
CREATE POLICY "Apenas admin upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'provas-fotos'
  AND auth.jwt() ->> 'role' = 'admin'
);

-- Exemplo: Usuários veem apenas suas próprias fotos
CREATE POLICY "Ver apenas proprias fotos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'provas-fotos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

**Criado em:** 20/06/2026  
**Versão:** 1.0  
**Status:** ✅ Pronto para uso

**⚠️ LEMBRE-SE:** Use a **OPÇÃO 1** se você não tem experiência com SQL. É mais simples e funciona perfeitamente para começar!
