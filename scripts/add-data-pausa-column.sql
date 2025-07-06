-- Script para adicionar colunas de pausa na tabela metrics_consultoria
-- Este script adiciona data_pausa e dias_pausados de forma segura

DO $$
BEGIN
    -- Verificar se a coluna data_pausa já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'metrics_consultoria' 
        AND column_name = 'data_pausa'
    ) THEN
        -- Adicionar coluna data_pausa
        ALTER TABLE metrics_consultoria 
        ADD COLUMN data_pausa TIMESTAMP WITH TIME ZONE DEFAULT NULL;
        
        -- Adicionar comentário explicativo
        COMMENT ON COLUMN metrics_consultoria.data_pausa IS 
        'Data em que o projeto foi pausado. NULL indica que o projeto não está pausado ou foi retomado.';
        
        RAISE NOTICE '✅ Coluna data_pausa adicionada com sucesso!';
    ELSE
        RAISE NOTICE '⚠️ Coluna data_pausa já existe na tabela.';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Erro ao adicionar coluna data_pausa: %', SQLERRM;
END $$;

-- Verificar se a coluna foi criada corretamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'metrics_consultoria' 
AND column_name = 'data_pausa';

-- Verificar quantos registros têm data_pausa
SELECT 
    COUNT(*) as total_registros,
    COUNT(data_pausa) as com_data_pausa,
    COUNT(*) - COUNT(data_pausa) as sem_data_pausa
FROM metrics_consultoria;

    -- Verificar se a coluna dias_pausados já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'metrics_consultoria' 
        AND column_name = 'dias_pausados'
    ) THEN
        -- Adicionar coluna para contar dias pausados
        ALTER TABLE metrics_consultoria 
        ADD COLUMN dias_pausados INTEGER DEFAULT 0 NOT NULL;
        
        -- Adicionar comentário explicativo
        COMMENT ON COLUMN metrics_consultoria.dias_pausados IS 
        'Total de dias que o projeto ficou pausado. Usado para calcular dias efetivos para bonificação.';
        
        RAISE NOTICE '✅ Coluna dias_pausados adicionada com sucesso!';
    ELSE
        RAISE NOTICE '⚠️ Coluna dias_pausados já existe na tabela.';
    END IF;
    
    -- Atualizar registros existentes para ter dias_pausados = 0 se for NULL
    UPDATE metrics_consultoria 
    SET dias_pausados = 0 
    WHERE dias_pausados IS NULL;
    
    RAISE NOTICE 'Registros existentes atualizados com dias_pausados = 0';
    
END $$;

-- Verificar as colunas criadas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'metrics_consultoria' 
AND column_name IN ('data_pausa', 'dias_pausados')
ORDER BY column_name;

-- Mostrar estrutura completa da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'metrics_consultoria'
ORDER BY ordinal_position;

-- Testar funcionalidade de pausa
INSERT INTO metrics_consultoria (
    cliente, 
    tipo, 
    data_inicio, 
    data_termino, 
    tempo_dias, 
    porte, 
    valor_consultoria, 
    valor_bonus, 
    consultor, 
    status,
    dias_pausados,
    data_pausa
) VALUES (
    'Teste Data Pausa',
    'consultoria',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    30,
    'pro',
    15000.00,
    1200.00,
    'Consultor Teste',
    'em_andamento',
    0,
    NULL
);

-- Simular pausa do projeto
UPDATE metrics_consultoria 
SET data_pausa = CURRENT_TIMESTAMP
WHERE cliente = 'Teste Data Pausa';

-- Verificar projeto pausado
SELECT 
    id, 
    cliente, 
    status, 
    data_pausa,
    CASE 
        WHEN data_pausa IS NOT NULL THEN 'PAUSADO'
        ELSE 'ATIVO'
    END as situacao
FROM metrics_consultoria 
WHERE cliente = 'Teste Data Pausa';

-- Simular retomada do projeto (data_pausa = NULL)
UPDATE metrics_consultoria 
SET data_pausa = NULL
WHERE cliente = 'Teste Data Pausa';

-- Verificar projeto retomado
SELECT 
    id, 
    cliente, 
    status, 
    data_pausa,
    CASE 
        WHEN data_pausa IS NOT NULL THEN 'PAUSADO'
        ELSE 'ATIVO'
    END as situacao
FROM metrics_consultoria 
WHERE cliente = 'Teste Data Pausa';

-- Remover registro de teste
DELETE FROM metrics_consultoria 
WHERE cliente = 'Teste Data Pausa';

RAISE NOTICE '🎉 Coluna data_pausa configurada e testada com sucesso!';
