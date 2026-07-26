-- ========================================
-- TABELAS: BACKGROUNDS E CADASTROS/LEADS
-- Execute no SQL Editor do Supabase
-- ========================================

-- 1. Tabela de backgrounds (wallpapers)
CREATE TABLE IF NOT EXISTS backgrounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT,
    imagem_url TEXT NOT NULL,
    downloads INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de cadastros/leads (quem baixou)
CREATE TABLE IF NOT EXISTS cadastros_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    background_id UUID REFERENCES backgrounds(id) ON DELETE SET NULL,
    background_titulo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Desabilitar RLS
ALTER TABLE backgrounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE cadastros_leads DISABLE ROW LEVEL SECURITY;

-- Indices
CREATE INDEX IF NOT EXISTS idx_cadastros_email ON cadastros_leads(email);
CREATE INDEX IF NOT EXISTS idx_backgrounds_ativo ON backgrounds(ativo);
