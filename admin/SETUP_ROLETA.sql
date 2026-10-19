-- ========================================
-- TABELAS: ROLETA DE ANIVERSARIO
-- Execute no SQL Editor do Supabase (Run without RLS)
-- ========================================

-- Leads da roleta (quem participou)
CREATE TABLE IF NOT EXISTS roleta_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT NOT NULL,
    cidade TEXT NOT NULL,
    desconto TEXT NOT NULL,
    cupom TEXT NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE roleta_leads DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_roleta_cupom ON roleta_leads(cupom);
CREATE INDEX IF NOT EXISTS idx_roleta_email ON roleta_leads(email);
