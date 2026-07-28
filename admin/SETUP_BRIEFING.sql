-- ========================================
-- TABELAS: BRIEFINGS (Questionarios)
-- Execute no SQL Editor do Supabase (Run without RLS)
-- ========================================

CREATE TABLE IF NOT EXISTS briefings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descricao TEXT,
    cliente_nome TEXT,
    perguntas JSONB DEFAULT '[]',
    codigo TEXT UNIQUE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS briefing_respostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    briefing_id UUID REFERENCES briefings(id) ON DELETE CASCADE,
    respostas JSONB DEFAULT '[]',
    respondido_por TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE briefings DISABLE ROW LEVEL SECURITY;
ALTER TABLE briefing_respostas DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_briefing_codigo ON briefings(codigo);
CREATE INDEX IF NOT EXISTS idx_briefing_respostas_bid ON briefing_respostas(briefing_id);
