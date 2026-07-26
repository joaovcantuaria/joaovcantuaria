-- Adicionar coluna 'pasta' na tabela backgrounds
ALTER TABLE backgrounds ADD COLUMN IF NOT EXISTS pasta TEXT DEFAULT 'Geral';
