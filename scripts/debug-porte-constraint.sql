-- Script para debugar e entender exatamente qual restrição está ativa

-- 1. Verificar a restrição atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'metrics_consultoria'::regclass
  AND contype = 'c'
  AND conname LIKE '%porte%';

-- 2. Verificar a estrutura da coluna porte
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'metrics_consultoria' 
  AND column_name = 'porte';

-- 3. Verificar todos os valores únicos de porte existentes
SELECT 
    porte,
    COUNT(*) as quantidade,
    LENGTH(porte) as tamanho_string,
    ASCII(LEFT(porte, 1)) as primeiro_char_ascii
FROM metrics_consultoria 
WHERE porte IS NOT NULL
GROUP BY porte
ORDER BY porte;

-- 4. Verificar se há espaços ou caracteres especiais
SELECT 
    porte,
    CASE 
        WHEN porte = TRIM(porte) THEN 'SEM_ESPACOS'
        ELSE 'COM_ESPACOS'
    END as tem_espacos,
    CASE 
        WHEN porte ~ '^[a-zA-Z_]+$' THEN 'APENAS_LETRAS'
        ELSE 'CARACTERES_ESPECIAIS'
    END as tipo_caracteres
FROM metrics_consultoria 
WHERE porte IS NOT NULL
GROUP BY porte
ORDER BY porte;
