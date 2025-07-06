-- Script para atualizar registros existentes na tabela metrics_consultoria
-- Marca como bonificada consultorias com valor muito baixo (ex: <= 100)

-- Primeiro, vamos ver quantos registros serão afetados
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN valor_consultoria <= 100 THEN 1 END) as registros_baixo_valor
FROM metrics_consultoria;

-- Atualizar registros com valor baixo para bonificada = TRUE
UPDATE metrics_consultoria 
SET 
    bonificada = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE 
    valor_consultoria <= 100 
    AND (bonificada IS NULL OR bonificada = FALSE);

-- Verificar os resultados da atualização
SELECT 
    bonificada,
    COUNT(*) as quantidade,
    MIN(valor_consultoria) as menor_valor,
    MAX(valor_consultoria) as maior_valor,
    AVG(valor_consultoria) as valor_medio
FROM metrics_consultoria 
GROUP BY bonificada
ORDER BY bonificada;

-- Mostrar alguns exemplos de registros bonificados
SELECT 
    cliente,
    valor_consultoria,
    bonificada,
    status,
    consultor
FROM metrics_consultoria 
WHERE bonificada = TRUE
LIMIT 5;
