-- ========================================
-- CORRIGIR POLITICA RLS DA TABELA ADMINS
-- ========================================
-- Execute no SQL Editor do Supabase

-- Remover politica antiga
DROP POLICY IF EXISTS "Admins can read admins" ON admins;

-- Nova politica: qualquer usuario autenticado pode verificar se esta na tabela admins
CREATE POLICY "Authenticated can check admin" ON admins
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Verificar quem esta na tabela admins
SELECT * FROM admins;
