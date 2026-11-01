-- ========================================
-- SEGURANCA: RLS EM TODAS AS TABELAS + FUNCOES PUBLICAS
-- Execute INTEIRO no SQL Editor do Supabase (pode rodar mais de uma vez)
-- ========================================
-- Regras:
--   * Admin (registro na tabela admins) pode tudo.
--   * Cliente logado ve somente os proprios dados.
--   * Visitante anonimo so INSERE leads/respostas/selecoes e le o que e
--     publico (portfolio, depoimentos ativos, backgrounds ativos).
--   * Paginas por codigo (entrega, galeria, briefing, orcamento) usam
--     funcoes RPC que devolvem SOMENTE o registro pedido.
-- ========================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ----------------------------------------
-- 1. Helper: usuario atual e admin?
-- ----------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM admins WHERE id = auth.uid());
$$;

-- ----------------------------------------
-- 2. Remover todas as politicas antigas e ligar RLS
-- ----------------------------------------
DO $$
DECLARE
    t text;
    p record;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'admins','usuarios','projetos','transacoes','provas_fotos','portfolio',
        'depoimentos','configuracoes','orcamentos','galerias','selecoes','entregas',
        'backgrounds','cadastros_leads','briefings','briefing_respostas','roleta_leads'
    ] LOOP
        IF to_regclass('public.' || t) IS NOT NULL THEN
            FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
                EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
            END LOOP;
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            EXECUTE format('CREATE POLICY "Admin acesso total" ON public.%I FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
        END IF;
    END LOOP;
END $$;

-- ----------------------------------------
-- 3. Politicas especificas
-- ----------------------------------------

-- admins: cada um so enxerga o proprio registro (usado no login do painel)
CREATE POLICY "Ver proprio registro admin" ON admins
    FOR SELECT USING (id = auth.uid());

-- usuarios: cliente le/edita/cria apenas o proprio cadastro
CREATE POLICY "Cliente le proprio cadastro" ON usuarios
    FOR SELECT USING (id = auth.uid());
CREATE POLICY "Cliente edita proprio cadastro" ON usuarios
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Cliente cria proprio cadastro" ON usuarios
    FOR INSERT WITH CHECK (id = auth.uid());

-- projetos / provas / entregas: cliente ve os seus
CREATE POLICY "Cliente ve proprios projetos" ON projetos
    FOR SELECT USING (cliente_id = auth.uid());
CREATE POLICY "Cliente ve proprias provas" ON provas_fotos
    FOR SELECT USING (cliente_id = auth.uid());
CREATE POLICY "Cliente ve proprias entregas" ON entregas
    FOR SELECT USING (cliente_id = auth.uid());

-- conteudo publico do site
CREATE POLICY "Publico le portfolio" ON portfolio
    FOR SELECT USING (true);
CREATE POLICY "Publico le depoimentos ativos" ON depoimentos
    FOR SELECT USING (ativo = true);
CREATE POLICY "Publico le configuracoes" ON configuracoes
    FOR SELECT USING (true);
CREATE POLICY "Publico le backgrounds ativos" ON backgrounds
    FOR SELECT USING (ativo = true);

-- formularios publicos: somente INSERT (ninguem de fora consegue ler)
CREATE POLICY "Publico envia lead" ON cadastros_leads
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Publico envia selecao" ON selecoes
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Publico responde briefing ativo" ON briefing_respostas
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM briefings b WHERE b.id = briefing_id AND b.ativo = true)
    );

-- roleta: aceita participacoes so ate o fim da promocao (27/10/2026 00:00 BRT)
-- Para uma nova promocao, altere a data abaixo e rode este bloco de novo.
CREATE POLICY "Publico participa da roleta no prazo" ON roleta_leads
    FOR INSERT WITH CHECK (now() < '2026-10-27 00:00:00-03'::timestamptz);

-- ----------------------------------------
-- 4. Funcoes publicas (RPC) - devolvem so o registro pedido
-- ----------------------------------------

-- Entrega de fotos por codigo
CREATE OR REPLACE FUNCTION public.get_entrega(p_codigo text)
RETURNS SETOF entregas
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT * FROM entregas WHERE codigo = p_codigo LIMIT 1;
$$;

-- Galeria de selecao por codigo
CREATE OR REPLACE FUNCTION public.get_galeria(p_codigo text)
RETURNS SETOF galerias
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT * FROM galerias WHERE codigo = p_codigo LIMIT 1;
$$;

-- Briefing ativo por codigo
CREATE OR REPLACE FUNCTION public.get_briefing(p_codigo text)
RETURNS SETOF briefings
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT * FROM briefings WHERE codigo = p_codigo AND ativo = true LIMIT 1;
$$;

-- Contador de downloads dos backgrounds
CREATE OR REPLACE FUNCTION public.increment_downloads(bg_id uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
    UPDATE backgrounds SET downloads = COALESCE(downloads, 0) + 1
    WHERE id = bg_id AND ativo = true;
$$;

-- Roleta: e-mail ja participou? (sem expor a lista)
CREATE OR REPLACE FUNCTION public.roleta_ja_participou(p_email text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM roleta_leads WHERE lower(email) = lower(trim(p_email)));
$$;

-- ----------------------------------------
-- 5. Orcamentos: senha com hash (bcrypt) e conferida no servidor
-- ----------------------------------------
CREATE OR REPLACE FUNCTION public.hash_orcamento_password()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public, extensions
AS $$
BEGIN
    IF NEW.password IS NOT NULL AND NEW.password !~ '^\$2[abxy]\$' THEN
        NEW.password := crypt(NEW.password, gen_salt('bf'));
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hash_orcamento_password ON orcamentos;
CREATE TRIGGER trg_hash_orcamento_password
    BEFORE INSERT OR UPDATE OF password ON orcamentos
    FOR EACH ROW EXECUTE FUNCTION public.hash_orcamento_password();

-- Converte as senhas ja existentes (texto puro) para hash
UPDATE orcamentos SET password = password WHERE password !~ '^\$2[abxy]\$';

-- Devolve o orcamento (sem a senha) somente se id + senha baterem
CREATE OR REPLACE FUNCTION public.get_orcamento(p_id text, p_password text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
    SELECT to_jsonb(o) - 'password'
    FROM orcamentos o
    WHERE o.id::text = p_id
      AND o.password = crypt(p_password, o.password)
    LIMIT 1;
$$;

-- ----------------------------------------
-- 6. Cadastro de cliente: cria a linha em usuarios pelo servidor
--    (funciona mesmo com confirmacao de e-mail ligada)
-- ----------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------
-- 7. Permissoes das funcoes
-- ----------------------------------------
REVOKE ALL ON FUNCTION public.hash_orcamento_password() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_entrega(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_galeria(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_briefing(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_downloads(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.roleta_ja_participou(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_orcamento(text, text) TO anon, authenticated;

-- Conferencia: todas devem aparecer com rowsecurity = true
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
