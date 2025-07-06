-- SCRIPT 1: Adicionar coluna dias_pausados
-- Este script adiciona a coluna dias_pausados à tabela metrics_consultoria

DO $$
BEGIN
    -- Verificar se a coluna dias_pausados já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'metrics_consultoria' 
        AND column_name = 'dias_pausados'
    ) THEN
        -- Adicionar a coluna dias_pausados
        ALTER TABLE metrics_consultoria 
        ADD COLUMN dias_pausados INTEGER NOT NULL DEFAULT 0;
        
        RAISE NOTICE 'Coluna dias_pausados adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna dias_pausados já existe.';
    END IF;
    
    -- Atualizar registros existentes para garantir que tenham valor 0
    UPDATE metrics_consultoria 
    SET dias_pausados = 0 
    WHERE dias_pausados IS NULL;
    
    -- Verificar se a atualização foi bem-sucedida
    RAISE NOTICE 'Registros atualizados: %', (
        SELECT COUNT(*) 
        FROM metrics_consultoria 
        WHERE dias_pausados = 0
    );
    
    -- Teste de inserção
    INSERT INTO metrics_consultoria (
        cliente, tipo, consultor, porte, data_inicio, data_termino, 
        tempo_dias, valor_consultoria, valor_bonus, status, dias_pausados
    ) VALUES (
        'Teste Dias Pausados', 'consultoria', 'Teste Consultor', 'basic',
        CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 30, 5000, 400, 'em_andamento', 5
    );
    
    -- Verificar se a inserção funcionou
    IF EXISTS (
        SELECT 1 FROM metrics_consultoria 
        WHERE cliente = 'Teste Dias Pausados' AND dias_pausados = 5
    ) THEN
        RAISE NOTICE 'Teste de inserção com dias_pausados: SUCESSO';
        
        -- Limpar dados de teste
        DELETE FROM metrics_consultoria WHERE cliente = 'Teste Dias Pausados';
        RAISE NOTICE 'Dados de teste removidos.';
    ELSE
        RAISE NOTICE 'Teste de inserção com dias_pausados: FALHOU';
    END IF;
    
END $$;

-- Mostrar estatísticas finais
SELECT 
    'dias_pausados' as coluna_adicionada,
    COUNT(*) as total_registros,
    AVG(dias_pausados) as media_dias_pausados,
    MAX(dias_pausados) as max_dias_pausados
FROM metrics_consultoria;
