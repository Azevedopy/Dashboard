-- Script para corrigir dados inválidos antes de aplicar a nova restrição

-- Primeiro, vamos mapear valores antigos para os novos padrões
-- Atualize conforme os valores encontrados no script anterior

-- Mapeamento comum de valores antigos para novos
UPDATE metrics_consultoria 
SET porte = 'basic' 
WHERE porte IN ('pequeno', 'small', 'básico', 'basico');

UPDATE metrics_consultoria 
SET porte = 'starter' 
WHERE porte IN ('medio', 'médio', 'medium', 'inicial');

UPDATE metrics_consultoria 
SET porte = 'pro' 
WHERE porte IN ('grande', 'large', 'profissional', 'avançado', 'avancado');

UPDATE metrics_consultoria 
SET porte = 'enterprise' 
WHERE porte IN ('enterprise', 'empresarial', 'corporativo');

-- Verificar se ainda existem valores inválidos após as atualizações
SELECT 
    porte,
    COUNT(*) as quantidade
FROM metrics_consultoria 
WHERE porte IS NOT NULL 
  AND porte NOT IN ('basic', 'starter', 'pro', 'enterprise')
GROUP BY porte;

-- Se ainda houver valores inválidos, defina um valor padrão
-- Descomente a linha abaixo se necessário
-- UPDATE metrics_consultoria 
-- SET porte = 'basic' 
-- WHERE porte IS NOT NULL 
--   AND porte NOT IN ('basic', 'starter', 'pro', 'enterprise');
