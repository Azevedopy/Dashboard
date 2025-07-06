-- SCRIPT 3: Atualizar constraint de status para incluir "pausado"
-- Este script atualiza as constraints de status da tabela metrics_consultoria

DO $$
BEGIN
    -- Remover constraint antiga de status se existir
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'metrics_consultoria' 
        AND constraint_type = 'CHECK' 
        AND constraint_name LIKE '%status%'
    ) THEN
        -- Tentar remover constraints conhecidas
        BEGIN
            ALTER TABLE metrics_consultoria DROP CONSTRAINT IF EXISTS metrics_consultoria_status_check;
            RAISE NOTICE 'Constraint antiga de status removida.';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Não foi possível remover constraint antiga: %', SQLERRM;
        END;
    END IF;
    
    -- Adicionar nova constraint de status incluindo "pausado"
    ALTER TABLE metrics_consultoria 
    ADD CONSTRAINT metrics_consultoria_status_check 
    CHECK (status IN ('em_andamento', 'pausado', 'concluido', 'cancelado'));
    
    RAISE NOTICE 'Nova constraint de status adicionada com sucesso!';
    
    -- Testar todos os status válidos
    BEGIN
        -- Teste 1: em_andamento
        INSERT INTO metrics_consultoria (
            cliente, tipo, consultor, porte, data_inicio, data_termino, 
            tempo_dias, valor_consultoria, valor_bonus, status, dias_pausados
        ) VALUES (
            'Teste Status 1', 'consultoria', 'Teste', 'basic',
            CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 30, 5000, 400, 'em_andamento', 0
        );
        
        -- Teste 2: pausado
        INSERT INTO metrics_consultoria (
            cliente, tipo, consultor, porte, data_inicio, data_termino, 
            tempo_dias, valor_consultoria, valor_bonus, status, dias_pausados
        ) VALUES (
            'Teste Status 2', 'consultoria', 'Teste', 'basic',
            CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 30, 5000, 400, 'pausado', 5
        );
        
        -- Teste 3: concluido
        INSERT INTO metrics_consultoria (
            cliente, tipo, consultor, porte, data_inicio, data_termino, 
            tempo_dias, valor_consultoria, valor_bonus, status, dias_pausados
        ) VALUES (
            'Teste Status 3', 'consultoria', 'Teste', 'basic',
            CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 30, 5000, 400, 'concluido', 0
        );
        
        -- Teste 4: cancelado
        INSERT INTO metrics_consultoria (
            cliente, tipo, consultor, porte, data_inicio, data_termino, 
            tempo_dias, valor_consultoria, valor_bonus, status, dias_pausados
        ) VALUES (
            'Teste Status 4', 'consultoria', 'Teste', 'basic',
            CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 30, 5000, 400, 'cancelado', 0
        );
        
        RAISE NOTICE 'Todos os status válidos testados com SUCESSO!';
        
        -- Limpar dados de teste
        DELETE FROM metrics_consultoria WHERE cliente LIKE 'Teste Status %';
        RAISE NOTICE 'Dados de teste removidos.';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao testar status: %', SQLERRM;
    END;
    
    -- Testar status inválido (deve falhar)
    BEGIN
        INSERT INTO metrics_consultoria (
            cliente, tipo, consultor, porte, data_inicio, data_termino, 
            tempo_dias, valor_consultoria, valor_bonus, status, dias_pausados
        ) VALUES (
            'Teste Status Inválido', 'consultoria', 'Teste', 'basic',
            CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 30, 5000, 400, 'status_invalido', 0
        );
        
        RAISE NOTICE 'ERRO: Status inválido foi aceito (não deveria)';
        
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'SUCESSO: Status inválido foi rejeitado corretamente!';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro inesperado ao testar status inválido: %', SQLERRM;
    END;
    
END $$;

-- Mostrar status válidos e estatísticas
SELECT 
    'Status válidos' as info,
    'em_andamento, pausado, concluido, cancelado' as valores_aceitos;

SELECT 
    status,
    COUNT(*) as quantidade,
    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentual
FROM metrics_consultoria 
WHERE status IS NOT NULL
GROUP BY status
ORDER BY quantidade DESC;
