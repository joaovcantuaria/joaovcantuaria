-- ========================================
-- SETUP SUPABASE - TABELAS DO PAINEL ADMIN
-- Joao V. Cantuaria
-- ========================================
-- Execute este SQL no Editor SQL do Supabase:
-- https://supabase.com/dashboard > Seu Projeto > SQL Editor > New Query
-- ========================================

-- 1. TABELA ADMINS (se ainda nao existe)
-- Controla quem tem acesso ao painel admin
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA USUARIOS (clientes)
-- Se ja existe, ignore este bloco
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    nome_completo TEXT,
    telefone TEXT,
    empresa TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA PROJETOS
CREATE TABLE IF NOT EXISTS projetos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descricao TEXT,
    cliente_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'em_andamento', 'em_revisao', 'concluido')),
    progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
    data_inicio DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA TRANSACOES (financeiro)
CREATE TABLE IF NOT EXISTS transacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    valor DECIMAL(10,2) NOT NULL DEFAULT 0,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    descricao TEXT,
    categoria TEXT,
    metodo_pagamento TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA PROVAS DE FOTOS
CREATE TABLE IF NOT EXISTS provas_fotos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    cliente_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    projeto_id UUID REFERENCES projetos(id) ON DELETE SET NULL,
    total_fotos INTEGER DEFAULT 0,
    fotos_selecionadas INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'visualizada', 'selecionada', 'entregue')),
    link_fotos TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA PORTFOLIO
CREATE TABLE IF NOT EXISTS portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT DEFAULT 'outros',
    imagem_url TEXT,
    destaque BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DEPOIMENTOS
CREATE TABLE IF NOT EXISTS depoimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    empresa TEXT,
    texto TEXT NOT NULL,
    nota INTEGER DEFAULT 5 CHECK (nota >= 1 AND nota <= 5),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABELA CONFIGURACOES (registro unico)
CREATE TABLE IF NOT EXISTS configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp TEXT,
    email TEXT,
    instagram TEXT,
    linkedin TEXT,
    titulo TEXT,
    subtitulo TEXT,
    sobre TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- POLITICAS DE SEGURANCA (RLS)
-- ========================================
-- Habilitar RLS em todas as tabelas
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE provas_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE depoimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Politica: Admins podem fazer tudo
-- (usuario logado que existe na tabela admins)

CREATE POLICY "Admins full access" ON usuarios
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
    );

CREATE POLICY "Admins full access" ON projetos
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
    );

CREATE POLICY "Admins full access" ON transacoes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
    );

CREATE POLICY "Admins full access" ON provas_fotos
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
    );

CREATE POLICY "Admins full access" ON portfolio
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
    );

CREATE POLICY "Admins full access" ON depoimentos
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
    );

CREATE POLICY "Admins full access" ON configuracoes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
    );

CREATE POLICY "Admins can read admins" ON admins
    FOR SELECT USING (
        auth.uid() = id
    );

-- Politica: Clientes podem ver seus proprios dados
CREATE POLICY "Users read own data" ON usuarios
    FOR SELECT USING (
        id::text = auth.uid()::text
    );

-- Politica: Clientes podem ver seus proprios projetos
CREATE POLICY "Users read own projects" ON projetos
    FOR SELECT USING (
        cliente_id::text = auth.uid()::text
    );

-- Politica: Clientes podem ver suas proprias provas
CREATE POLICY "Users read own provas" ON provas_fotos
    FOR SELECT USING (
        cliente_id::text = auth.uid()::text
    );

-- Politica: Portfolio e depoimentos sao publicos (leitura)
CREATE POLICY "Public read portfolio" ON portfolio
    FOR SELECT USING (true);

CREATE POLICY "Public read depoimentos" ON depoimentos
    FOR SELECT USING (ativo = true);

CREATE POLICY "Public read configuracoes" ON configuracoes
    FOR SELECT USING (true);

-- ========================================
-- INSERIR SEU USUARIO COMO ADMIN
-- ========================================
-- IMPORTANTE: Substitua pelo UUID do seu usuario!
-- Voce encontra em: Authentication > Users > copie o UUID
--
-- INSERT INTO admins (id) VALUES ('SEU-UUID-AQUI');
--
-- Exemplo:
-- INSERT INTO admins (id) VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- ========================================
-- INSERIR CONFIGURACOES INICIAIS
-- ========================================
INSERT INTO configuracoes (whatsapp, email, instagram, linkedin, titulo, subtitulo, sobre)
VALUES (
    '(11) 99999-9999',
    'contato@joaovcantuaria.com',
    '@joaovcantuaria',
    'linkedin.com/in/joaovcantuaria',
    'Joao V. Cantuaria',
    'Estrategias Visuais que Transformam',
    'Fotografo profissional especializado em fotografia corporativa, ensaios pessoais e eventos.'
);
