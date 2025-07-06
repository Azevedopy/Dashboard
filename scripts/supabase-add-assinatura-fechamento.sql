-- SCRIPT 2: Adicionar coluna assinatura_fechamento
-- Este script adiciona a coluna assinatura_fechamento à tabela metrics_consultoria

DO $$
BEGIN
    -- Verificar se a coluna assinatura_fechamento já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'metrics_consultoria' 
        AND column_name = 'assinatura_fechamento'
    ) THEN
        -- Adicionar a coluna assinatura_fechamento
        ALTER TABLE metrics_consultoria 
        ADD COLUMN assinatura_fechamento BOOLEAN NOT NULL DEFAULT FALSE;
        
        RAISE NOTICE 'Coluna assinatura_fechamento adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna assinatura_fechamento já existe.';
    END IF;
    
    -- Atualizar registros existentes para garantir que tenham valor FALSE
    UPDATE metrics_consultoria 
    SET assinatura_fechamento = FALSE 
    WHERE assinatura_fechamento IS NULL;
    
    -- Verificar se a atualização foi bem-sucedida
    RAISE NOTICE 'Registros atualizados: %', (
        SELECT COUNT(*) 
        FROM metrics_consultoria 
        WHERE assinatura_fechamento = FALSE
    );
    
    -- Teste de inserção com assinatura
    INSERT INTO metrics_consultoria (
        cliente, tipo, consultor, porte, data_inicio, data_termino, 
        tempo_dias, valor_consultoria, valor_bonus, status, 
        dias_pausados, assinatura_fechamento
    ) VALUES (
        'Teste Assinatura', 'consultoria', 'Teste Consultor', 'pro',
        CURRENT_DATE, CURRENT_DATE + INTERVAL '45 days', 45, 8000, 640, 'concluido', 
        0, TRUE
    );
    
    -- Verificar se a inserção funcionou
    IF EXISTS (
        SELECT 1 FROM metrics_consultoria 
        WHERE cliente = 'Teste Assinatura' AND assinatura_fechamento = TRUE
    ) THEN
        RAISE NOTICE 'Teste de inserção com assinatura_fechamento: SUCESSO';
        
        -- Limpar dados de teste
        DELETE FROM metrics_consultoria WHERE cliente = 'Teste Assinatura';
        RAISE NOTICE 'Dados de teste removidos.';
    ELSE
        RAISE NOTICE 'Teste de inserção com assinatura_fechamento: FALHOU';
    END IF;
    
END $$;

-- Mostrar estatísticas finais
SELECT 
    'assinatura_fechamento' as coluna_adicionada,
    COUNT(*) as total_registros,
    COUNT(*) FILTER (WHERE assinatura_fechamento = TRUE) as com_assinatura,
    COUNT(*) FILTER (WHERE assinatura_fechamento = FALSE) as sem_assinatura,
    ROUND(
        (COUNT(*) FILTER (WHERE assinatura_fechamento = TRUE) * 100.0 / COUNT(*)), 2
    ) as percentual_com_assinatura
FROM metrics_consultoria;
