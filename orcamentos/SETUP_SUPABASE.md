# Setup da Tabela de Orçamentos no Supabase

Execute o SQL abaixo no **SQL Editor** do seu Supabase para criar a tabela de orçamentos.

## 1. Criar a tabela

```sql
CREATE TABLE orcamentos (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    password TEXT NOT NULL,
    project_title TEXT NOT NULL,
    project_description TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    images JSONB DEFAULT '[]',
    discount_type TEXT DEFAULT 'percent',
    discount_value NUMERIC DEFAULT 0,
    discount_note TEXT,
    subtotal NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    validity_days INTEGER DEFAULT 7,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending'
);
```

## 2. Habilitar RLS (Row Level Security)

```sql
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
```

## 3. Criar políticas de acesso

```sql
-- Permitir INSERT (para criar orçamentos do painel admin)
CREATE POLICY "Allow insert orcamentos" ON orcamentos
    FOR INSERT WITH CHECK (true);

-- Permitir SELECT (para o cliente acessar com senha - a verificação é feita no JS)
CREATE POLICY "Allow select orcamentos" ON orcamentos
    FOR SELECT USING (true);

-- Permitir UPDATE (para mudar status)
CREATE POLICY "Allow update orcamentos" ON orcamentos
    FOR UPDATE USING (true);
```

## 4. Acessar o sistema

- **Criar orçamento:** `joaovcantuaria.com/orcamentos/criar.html`
- **Link do cliente:** `joaovcantuaria.com/orcamentos/?id=XXXXX` (gerado automaticamente)

## Notas

- As imagens são salvas como base64 direto no banco (para orçamentos com poucas imagens isso funciona bem)
- Se quiser suportar muitas imagens grandes, migre para o Supabase Storage
- O campo `password` é a senha que o cliente usa para acessar — definida por você na criação
