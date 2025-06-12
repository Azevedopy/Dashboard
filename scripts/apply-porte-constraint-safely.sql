-- Script para aplicar a restrição de porte de forma segura

-- Primeiro, verificar se não há mais valores inválidos
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM metrics_consultoria 
    WHERE porte IS NOT NULL 
      AND porte NOT IN ('basic', 'starter', 'pro', 'enterprise');
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Ainda existem % registros com valores de porte inválidos. Execute o script de correção primeiro.', invalid_count;
    ELSE
        RAISE NOTICE 'Todos os valores de porte são válidos. Prosseguindo com a criação da restrição.';
    END IF;
END $$;

-- Remover a restrição atual se existir
ALTER TABLE metrics_consultoria 
DROP CONSTRAINT IF EXISTS metrics_consultoria_porte_check;

-- Criar nova restrição com os valores corretos
ALTER TABLE metrics_consultoria 
ADD CONSTRAINT metrics_consultoria_porte_check 
CHECK (porte IN ('basic', 'starter', 'pro', 'enterprise'));

-- Verificar se a restrição foi criada corretamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'metrics_consultoria_porte_check';

-- Teste final: verificar todos os valores de porte
SELECT 
    porte,
    COUNT(*) as quantidade
FROM metrics_consultoria 
WHERE porte IS NOT NULL
GROUP BY porte
ORDER BY porte;
