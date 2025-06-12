-- Script para atualizar valores de porte existentes se necessário

-- Verificar valores atuais de porte
SELECT DISTINCT porte, COUNT(*) as count
FROM metrics_consultoria 
WHERE porte IS NOT NULL
GROUP BY porte
ORDER BY porte;

-- Atualizar valores antigos para os novos padrões (se necessário)
-- Descomente as linhas abaixo se houver dados com valores diferentes

-- UPDATE metrics_consultoria SET porte = 'basic' WHERE porte = 'pequeno';
-- UPDATE metrics_consultoria SET porte = 'starter' WHERE porte = 'medio';
-- UPDATE metrics_consultoria SET porte = 'pro' WHERE porte = 'grande';
-- UPDATE metrics_consultoria SET porte = 'enterprise' WHERE porte = 'enterprise';

-- Verificar se ainda há valores inválidos
SELECT DISTINCT porte, COUNT(*) as count
FROM metrics_consultoria 
WHERE porte NOT IN ('basic', 'starter', 'pro', 'enterprise') 
  AND porte IS NOT NULL
GROUP BY porte;
