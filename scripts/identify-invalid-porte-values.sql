-- Script para identificar valores de porte que violam a nova restrição

-- Verificar todos os valores de porte existentes
SELECT 
    porte,
    COUNT(*) as quantidade,
    CASE 
        WHEN porte IN ('basic', 'starter', 'pro', 'enterprise') THEN 'VÁLIDO'
        ELSE 'INVÁLIDO'
    END as status
FROM metrics_consultoria 
WHERE porte IS NOT NULL
GROUP BY porte
ORDER BY porte;

-- Mostrar registros específicos com valores inválidos
SELECT 
    id,
    date,
    consultor,
    client,
    porte,
    created_at
FROM metrics_consultoria 
WHERE porte IS NOT NULL 
  AND porte NOT IN ('basic', 'starter', 'pro', 'enterprise')
ORDER BY created_at DESC
LIMIT 20;

-- Contar total de registros inválidos
SELECT COUNT(*) as total_registros_invalidos
FROM metrics_consultoria 
WHERE porte IS NOT NULL 
  AND porte NOT IN ('basic', 'starter', 'pro', 'enterprise');
