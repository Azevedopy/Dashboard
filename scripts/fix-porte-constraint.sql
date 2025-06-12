-- Script para corrigir a restrição de porte na tabela metrics_consultoria

-- Primeiro, vamos verificar a restrição atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'metrics_consultoria_porte_check';

-- Remover a restrição atual se existir
ALTER TABLE metrics_consultoria 
DROP CONSTRAINT IF EXISTS metrics_consultoria_porte_check;

-- Criar nova restrição com os valores corretos
ALTER TABLE metrics_consultoria 
ADD CONSTRAINT metrics_consultoria_porte_check 
CHECK (porte IN ('basic', 'starter', 'pro', 'enterprise'));

-- Verificar se a nova restrição foi criada corretamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'metrics_consultoria_porte_check';

-- Verificar dados existentes que podem violar a nova restrição
SELECT DISTINCT porte, COUNT(*) as count
FROM metrics_consultoria 
WHERE porte IS NOT NULL
GROUP BY porte
ORDER BY porte;
