-- Script para forçar a correção da restrição de porte

-- 1. Remover TODAS as restrições relacionadas a porte
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'metrics_consultoria'::regclass
          AND contype = 'c'
          AND (conname LIKE '%porte%' OR pg_get_constraintdef(oid) LIKE '%porte%')
    LOOP
        EXECUTE 'ALTER TABLE metrics_consultoria DROP CONSTRAINT IF EXISTS ' || constraint_record.conname;
        RAISE NOTICE 'Removida restrição: %', constraint_record.conname;
    END LOOP;
END $$;

-- 2. Limpar e padronizar todos os valores de porte existentes
UPDATE metrics_consultoria 
SET porte = TRIM(LOWER(porte))
WHERE porte IS NOT NULL;

-- 3. Mapear valores para os padrões corretos
UPDATE metrics_consultoria SET porte = 'basic' WHERE porte IN ('pequeno', 'small', 'básico', 'basico', 'basic');
UPDATE metrics_consultoria SET porte = 'starter' WHERE porte IN ('medio', 'médio', 'medium', 'inicial', 'starter');
UPDATE metrics_consultoria SET porte = 'pro' WHERE porte IN ('grande', 'large', 'profissional', 'avançado', 'avancado', 'pro');
UPDATE metrics_consultoria SET porte = 'enterprise' WHERE porte IN ('enterprise', 'empresarial', 'corporativo');

-- 4. Definir valor padrão para qualquer valor restante inválido
UPDATE metrics_consultoria 
SET porte = 'basic' 
WHERE porte IS NOT NULL 
  AND porte NOT IN ('basic', 'starter', 'pro', 'enterprise');

-- 5. Verificar se todos os valores estão corretos agora
SELECT 
    porte,
    COUNT(*) as quantidade
FROM metrics_consultoria 
WHERE porte IS NOT NULL
GROUP BY porte
ORDER BY porte;

-- 6. Criar a nova restrição
ALTER TABLE metrics_consultoria 
ADD CONSTRAINT metrics_consultoria_porte_check 
CHECK (porte IS NULL OR porte IN ('basic', 'starter', 'pro', 'enterprise'));

-- 7. Verificar se a restrição foi criada
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'metrics_consultoria_porte_check';
