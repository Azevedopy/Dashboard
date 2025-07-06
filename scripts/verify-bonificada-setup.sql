-- Script de verificação completa da implementação da coluna 'bonificada'

-- 1. Verificar se a coluna existe e suas propriedades
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'metrics_consultoria'
AND column_name = 'bonificada';

-- 2. Verificar a distribuição de valores na coluna bonificada
SELECT 
    bonificada,
    COUNT(*) as quantidade,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
FROM metrics_consultoria 
GROUP BY bonificada
ORDER BY bonificada;

-- 3. Análise por valor de consultoria e status bonificada
SELECT 
    CASE 
        WHEN valor_consultoria <= 100 THEN 'Muito Baixo (≤100)'
        WHEN valor_consultoria <= 1000 THEN 'Baixo (101-1000)'
        WHEN valor_consultoria <= 10000 THEN 'Médio (1001-10000)'
        ELSE 'Alto (>10000)'
    END as faixa_valor,
    bonificada,
    COUNT(*) as quantidade
FROM metrics_consultoria 
GROUP BY 
    CASE 
        WHEN valor_consultoria <= 100 THEN 'Muito Baixo (≤100)'
        WHEN valor_consultoria <= 1000 THEN 'Baixo (101-1000)'
        WHEN valor_consultoria <= 10000 THEN 'Médio (1001-10000)'
        ELSE 'Alto (>10000)'
    END,
    bonificada
ORDER BY 
    CASE 
        WHEN valor_consultoria <= 100 THEN 1
        WHEN valor_consultoria <= 1000 THEN 2
        WHEN valor_consultoria <= 10000 THEN 3
        ELSE 4
    END,
    bonificada;

-- 4. Verificar registros com possíveis inconsistências
SELECT 
    id,
    cliente,
    valor_consultoria,
    bonificada,
    valor_comissao,
    percentual_comissao,
    status
FROM metrics_consultoria 
WHERE 
    -- Casos que podem precisar de revisão
    (valor_consultoria <= 100 AND bonificada = FALSE) OR
    (valor_consultoria > 1000 AND bonificada = TRUE)
ORDER BY valor_consultoria;

-- 5. Resumo geral da tabela
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN bonificada = TRUE THEN 1 END) as total_bonificadas,
    COUNT(CASE WHEN bonificada = FALSE THEN 1 END) as total_nao_bonificadas,
    COUNT(CASE WHEN bonificada IS NULL THEN 1 END) as total_nulos,
    ROUND(AVG(valor_consultoria), 2) as valor_medio_geral,
    ROUND(AVG(CASE WHEN bonificada = FALSE THEN valor_consultoria END), 2) as valor_medio_nao_bonificadas,
    ROUND(AVG(CASE WHEN bonificada = TRUE THEN valor_consultoria END), 2) as valor_medio_bonificadas
FROM metrics_consultoria;
