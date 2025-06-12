-- Verificar os valores únicos de tipo na tabela
SELECT DISTINCT tipo, COUNT(*) as quantidade
FROM metrics_consultoria 
GROUP BY tipo
ORDER BY tipo;

-- Verificar os valores únicos de porte na tabela
SELECT DISTINCT porte, COUNT(*) as quantidade
FROM metrics_consultoria 
GROUP BY porte
ORDER BY porte;

-- Verificar os valores únicos de status na tabela
SELECT DISTINCT status, COUNT(*) as quantidade
FROM metrics_consultoria 
GROUP BY status
ORDER BY status;

-- Verificar a estrutura completa da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'metrics_consultoria' 
ORDER BY ordinal_position;
