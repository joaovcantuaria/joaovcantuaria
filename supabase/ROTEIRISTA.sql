-- ========================================
-- JOAOZINHO ROTEIRISTA: creditos, roteiros, pagamentos e configuracao
-- Execute INTEIRO no SQL Editor do Supabase (pode rodar mais de uma vez)
-- Requer o SEGURANCA_RLS.sql ja aplicado (usa public.is_admin()).
-- ========================================

-- ----------------------------------------
-- 1. Tabelas
-- ----------------------------------------

-- Saldo de roteiros de cada usuario
CREATE TABLE IF NOT EXISTS rt_creditos (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    saldo INTEGER NOT NULL DEFAULT 0 CHECK (saldo >= 0),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roteiros gerados
CREATE TABLE IF NOT EXISTS rt_roteiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dados JSONB NOT NULL DEFAULT '{}',
    titulo TEXT,
    conteudo TEXT NOT NULL,
    modelo TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rt_roteiros_user ON rt_roteiros(user_id, created_at DESC);

-- Compras pelo Mercado Pago
CREATE TABLE IF NOT EXISTS rt_pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    pacote TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'recusado')),
    mp_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    aprovado_em TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_rt_pagamentos_user ON rt_pagamentos(user_id, created_at DESC);

-- Configuracao (linha unica). Chaves secretas: NINGUEM le pelo site,
-- so as Edge Functions (service role). O admin ve apenas a versao mascarada.
CREATE TABLE IF NOT EXISTS rt_config (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    ia_base_url TEXT DEFAULT '',
    ia_api_key TEXT DEFAULT '',
    ia_modelo TEXT DEFAULT 'claude-opus-5-5',
    ia_esforco TEXT DEFAULT 'medium' CHECK (ia_esforco IN ('low', 'medium', 'high')),
    ia_busca_web BOOLEAN DEFAULT TRUE,
    mp_access_token TEXT DEFAULT '',
    preco_1 NUMERIC(10,2) DEFAULT 1.99,
    preco_5 NUMERIC(10,2) DEFAULT 6.99,
    ativo BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO rt_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------
-- 2. RLS
-- ----------------------------------------
ALTER TABLE rt_creditos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rt_roteiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE rt_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rt_config ENABLE ROW LEVEL SECURITY;  -- sem nenhuma politica: fechada para o site

DROP POLICY IF EXISTS "Ver proprio saldo" ON rt_creditos;
DROP POLICY IF EXISTS "Admin acesso total" ON rt_creditos;
CREATE POLICY "Ver proprio saldo" ON rt_creditos FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin acesso total" ON rt_creditos FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Ver proprios roteiros" ON rt_roteiros;
DROP POLICY IF EXISTS "Admin acesso total" ON rt_roteiros;
CREATE POLICY "Ver proprios roteiros" ON rt_roteiros FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin acesso total" ON rt_roteiros FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Ver proprios pagamentos" ON rt_pagamentos;
DROP POLICY IF EXISTS "Admin acesso total" ON rt_pagamentos;
CREATE POLICY "Ver proprios pagamentos" ON rt_pagamentos FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin acesso total" ON rt_pagamentos FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ----------------------------------------
-- 3. Creditos: debitar e creditar de forma atomica (so o servidor usa)
-- ----------------------------------------
CREATE OR REPLACE FUNCTION public.rt_debitar(p_user UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    UPDATE rt_creditos SET saldo = saldo - 1, updated_at = NOW()
    WHERE user_id = p_user AND saldo > 0;
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.rt_creditar(p_user UUID, p_qtd INTEGER)
RETURNS INTEGER
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
    INSERT INTO rt_creditos (user_id, saldo) VALUES (p_user, p_qtd)
    ON CONFLICT (user_id) DO UPDATE SET saldo = rt_creditos.saldo + p_qtd, updated_at = NOW()
    RETURNING saldo;
$$;

-- Aprova um pagamento uma unica vez e libera os creditos (idempotente)
CREATE OR REPLACE FUNCTION public.rt_aprovar_pagamento(p_id UUID, p_mp_payment_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_user UUID;
    v_qtd INTEGER;
BEGIN
    UPDATE rt_pagamentos
    SET status = 'aprovado', aprovado_em = NOW(), mp_payment_id = p_mp_payment_id
    WHERE id = p_id AND status <> 'aprovado'
    RETURNING user_id, quantidade INTO v_user, v_qtd;

    IF v_user IS NULL THEN
        RETURN FALSE;  -- ja aprovado antes (webhook repetido) ou inexistente
    END IF;

    PERFORM public.rt_creditar(v_user, v_qtd);
    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.rt_debitar(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rt_creditar(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rt_aprovar_pagamento(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rt_debitar(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.rt_creditar(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.rt_aprovar_pagamento(UUID, TEXT) TO service_role;

-- ----------------------------------------
-- 4. Funcoes do painel admin
-- ----------------------------------------

-- Mostra a configuracao com as chaves mascaradas
CREATE OR REPLACE FUNCTION public.rt_config_ver()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    c rt_config;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'acesso negado';
    END IF;
    SELECT * INTO c FROM rt_config WHERE id = 1;
    RETURN jsonb_build_object(
        'ia_base_url', c.ia_base_url,
        'ia_api_key', CASE WHEN COALESCE(c.ia_api_key, '') = '' THEN '' ELSE left(c.ia_api_key, 6) || '...' || right(c.ia_api_key, 4) END,
        'ia_modelo', c.ia_modelo,
        'ia_esforco', c.ia_esforco,
        'ia_busca_web', c.ia_busca_web,
        'mp_access_token', CASE WHEN COALESCE(c.mp_access_token, '') = '' THEN '' ELSE left(c.mp_access_token, 8) || '...' || right(c.mp_access_token, 4) END,
        'preco_1', c.preco_1,
        'preco_5', c.preco_5,
        'ativo', c.ativo,
        'updated_at', c.updated_at
    );
END;
$$;

-- Salva a configuracao. Chave vazia = mantem a atual.
CREATE OR REPLACE FUNCTION public.rt_config_salvar(p JSONB)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'acesso negado';
    END IF;
    UPDATE rt_config SET
        ia_base_url     = COALESCE(p->>'ia_base_url', ia_base_url),
        ia_api_key      = CASE WHEN COALESCE(p->>'ia_api_key', '') = '' THEN ia_api_key ELSE p->>'ia_api_key' END,
        ia_modelo       = COALESCE(NULLIF(p->>'ia_modelo', ''), ia_modelo),
        ia_esforco      = COALESCE(NULLIF(p->>'ia_esforco', ''), ia_esforco),
        ia_busca_web    = COALESCE((p->>'ia_busca_web')::BOOLEAN, ia_busca_web),
        mp_access_token = CASE WHEN COALESCE(p->>'mp_access_token', '') = '' THEN mp_access_token ELSE p->>'mp_access_token' END,
        preco_1         = COALESCE((p->>'preco_1')::NUMERIC, preco_1),
        preco_5         = COALESCE((p->>'preco_5')::NUMERIC, preco_5),
        ativo           = COALESCE((p->>'ativo')::BOOLEAN, ativo),
        updated_at      = NOW()
    WHERE id = 1;
END;
$$;

-- Admin adiciona creditos manualmente pelo e-mail (cortesia, teste, suporte)
CREATE OR REPLACE FUNCTION public.rt_admin_creditar(p_email TEXT, p_qtd INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
    v_user UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'acesso negado';
    END IF;
    SELECT id INTO v_user FROM auth.users WHERE lower(email) = lower(trim(p_email));
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'usuario nao encontrado';
    END IF;
    RETURN public.rt_creditar(v_user, p_qtd);
END;
$$;

-- Lista de usuarios do Roteirista com saldo e uso (para o painel)
CREATE OR REPLACE FUNCTION public.rt_admin_usuarios()
RETURNS TABLE (email TEXT, saldo INTEGER, roteiros BIGINT, comprado NUMERIC, criado_em TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'acesso negado';
    END IF;
    RETURN QUERY
    SELECT u.email::TEXT,
           COALESCE(c.saldo, 0),
           (SELECT count(*) FROM rt_roteiros r WHERE r.user_id = u.id),
           (SELECT COALESCE(sum(p.valor), 0) FROM rt_pagamentos p WHERE p.user_id = u.id AND p.status = 'aprovado'),
           u.created_at
    FROM auth.users u
    LEFT JOIN rt_creditos c ON c.user_id = u.id
    WHERE u.raw_user_meta_data->>'origem' = 'roteirista' OR c.user_id IS NOT NULL
    ORDER BY u.created_at DESC;
END;
$$;

-- Precos atuais (publico: a pagina mostra os valores configurados no painel)
CREATE OR REPLACE FUNCTION public.rt_precos()
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT jsonb_build_object('preco_1', preco_1, 'preco_5', preco_5, 'ativo', ativo) FROM rt_config WHERE id = 1;
$$;
GRANT EXECUTE ON FUNCTION public.rt_precos() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.rt_config_ver() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rt_config_salvar(JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rt_admin_creditar(TEXT, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rt_admin_usuarios() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rt_config_ver() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rt_config_salvar(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rt_admin_creditar(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rt_admin_usuarios() TO authenticated;

-- ----------------------------------------
-- 5. Quem se cadastra pelo Roteirista nao vira "cliente" de fotografia
-- ----------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NEW.raw_user_meta_data->>'origem' = 'roteirista' THEN
        BEGIN
            INSERT INTO rt_creditos (user_id, saldo) VALUES (NEW.id, 0) ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'handle_new_user roteirista: %', SQLERRM;
        END;
        RETURN NEW;
    END IF;

    BEGIN
        INSERT INTO usuarios (id, email, nome_completo, telefone, empresa)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1)),
            NEW.raw_user_meta_data->>'telefone',
            COALESCE(NEW.raw_user_meta_data->>'empresa', '')
        )
        ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        -- Nunca bloquear o cadastro por causa desta tabela
        RAISE WARNING 'handle_new_user: %', SQLERRM;
    END;
    RETURN NEW;
END;
$$;

-- Conferencia
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'rt_%' ORDER BY tablename;
