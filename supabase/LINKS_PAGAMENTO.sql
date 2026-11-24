-- ========================================
-- LINKS DE PAGAMENTO (cartao de credito via Mercado Pago)
-- Execute INTEIRO no SQL Editor do Supabase (pode rodar mais de uma vez)
-- Requer SEGURANCA_RLS.sql (public.is_admin) e ROTEIRISTA.sql (rt_config,
-- onde fica o Access Token do Mercado Pago).
-- ========================================

CREATE TABLE IF NOT EXISTS pg_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL CHECK (valor >= 1),
    max_parcelas INTEGER NOT NULL DEFAULT 1 CHECK (max_parcelas BETWEEN 1 AND 12),
    cliente_nome TEXT,
    cliente_email TEXT,
    status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'pago', 'cancelado')),
    expira_em TIMESTAMPTZ,
    mp_preference_id TEXT,
    mp_init_point TEXT,
    mp_payment_id TEXT,
    parcelas_pagas INTEGER,
    pago_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pg_links_created ON pg_links(created_at DESC);

-- Somente o admin le e altera. A pagina publica usa a funcao abaixo.
ALTER TABLE pg_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin acesso total" ON pg_links;
CREATE POLICY "Admin acesso total" ON pg_links FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Pagina publica /pagar: devolve so o necessario para pagar o link pedido
CREATE OR REPLACE FUNCTION public.get_pg_link(p_codigo TEXT)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'descricao', descricao,
        'valor', valor,
        'max_parcelas', max_parcelas,
        'cliente_nome', split_part(COALESCE(cliente_nome, ''), ' ', 1),
        'status', CASE
            WHEN status = 'aberto' AND expira_em IS NOT NULL AND expira_em < NOW() THEN 'expirado'
            ELSE status
        END,
        'url', CASE
            WHEN status = 'aberto' AND (expira_em IS NULL OR expira_em >= NOW()) THEN mp_init_point
        END,
        'expira_em', expira_em
    )
    FROM pg_links
    WHERE codigo = upper(trim(p_codigo))
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_pg_link(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pg_link(TEXT) TO anon, authenticated;

-- Conferencia
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pg_links';
