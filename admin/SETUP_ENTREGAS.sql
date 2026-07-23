-- ========================================
-- TABELA ENTREGAS DE FOTOS
-- Execute no SQL Editor do Supabase
-- ========================================

CREATE TABLE IF NOT EXISTS entregas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_nome TEXT NOT NULL,
    historia TEXT,
    capa_url TEXT,
    fotos JSONB DEFAULT '[]',
    codigo TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Desabilitar RLS (admin full access)
ALTER TABLE entregas DISABLE ROW LEVEL SECURITY;

-- Indice para busca por codigo
CREATE INDEX IF NOT EXISTS idx_entregas_codigo ON entregas(codigo);
