-- ========================================
-- ADICIONAR cliente_id NA TABELA ENTREGAS
-- Execute no SQL Editor do Supabase
-- ========================================
ALTER TABLE entregas ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_entregas_cliente ON entregas(cliente_id);

-- Politica: cliente ve somente suas proprias entregas
-- (RLS ja esta desabilitado, mas se quiser habilitar no futuro, use isso)
-- CREATE POLICY "Cliente ve proprias entregas" ON entregas
--     FOR SELECT USING (cliente_id = auth.uid());
