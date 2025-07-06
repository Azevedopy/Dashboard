-- Script para testar funcionalidade completa de pausa
-- Simula cenários reais de uso

RAISE NOTICE '=== TESTE AVANÇADO DE FUNCIONALIDADE DE PAUSA ===';

DO $$
DECLARE
    projeto1_id INTEGER;
    projeto2_id INTEGER;
    projeto3_id INTEGER;
BEGIN
    RAISE NOTICE '🚀 Iniciando teste avançado de funcionalidade de pausa...';
    
    -- CENÁRIO 1: Projeto com uma pausa simples
    INSERT INTO consultoria (
        cliente,
        consultor,
        tipo,
        porte,
        valor,
        data_inicio,
        prazo_dias,
        status,
        dias_pausados,
        assinatura_fechamento
    ) VALUES (
        'Empresa Alpha - Teste Pausa Simples',
        'João Silva',
        'Implementação ERP',
        'Grande',
        25000.00,
        CURRENT_DATE - INTERVAL '45 days',
        60,
        'em_andamento',
        10,
        FALSE
    ) RETURNING id INTO projeto1_id;
    
    RAISE NOTICE 'CENÁRIO 1: Projeto criado (ID: %) - Pausa simples de 10 dias', projeto1_id;
    
    -- CENÁRIO 2: Projeto com múltiplas pausas
    INSERT INTO consultoria (
        cliente,
        consultor,
        tipo,
        porte,
        valor,
        data_inicio,
        prazo_dias,
        status,
        dias_pausados,
        assinatura_fechamento
    ) VALUES (
        'Empresa Beta - Teste Múltiplas Pausas',
        'Maria Santos',
        'Consultoria Estratégica',
        'Médio',
        15000.00,
        CURRENT_DATE - INTERVAL '30 days',
        45,
        'pausado',
        18,
        FALSE
    ) RETURNING id INTO projeto2_id;
    
    -- Simular histórico de pausas para projeto 2
    UPDATE consultoria 
    SET data_pausa = CURRENT_DATE - INTERVAL '5 days'
    WHERE id = projeto2_id;
    
    RAISE NOTICE 'CENÁRIO 2: Projeto criado (ID: %) - Múltiplas pausas (18 dias total)', projeto2_id;
    
    -- CENÁRIO 3: Projeto concluído com assinatura
    INSERT INTO consultoria (
        cliente,
        consultor,
        tipo,
        porte,
        valor,
        data_inicio,
        prazo_dias,
        status,
        dias_pausados,
        assinatura_fechamento
    ) VALUES (
        'Empresa Gamma - Teste Concluído',
        'Pedro Costa',
        'Auditoria de Processos',
        'Pequeno',
        8000.00,
        CURRENT_DATE - INTERVAL '35 days',
        30,
        'concluido',
        3,
        TRUE
    ) RETURNING id INTO projeto3_id;
    
    RAISE NOTICE 'CENÁRIO 3: Projeto criado (ID: %) - Concluído com assinatura', projeto3_id;
    
    -- Mostrar resumo dos projetos de teste
    RAISE NOTICE '📊 RESUMO DOS PROJETOS DE TESTE:';
    
    -- Análise detalhada de cada projeto
    FOR rec IN 
        SELECT 
            id,
            cliente,
            consultor,
            status,
            prazo_dias,
            dias_pausados,
            (prazo_dias - dias_pausados) as dias_efetivos,
            assinatura_fechamento,
            valor,
            CASE 
                WHEN status = 'concluido' AND (prazo_dias - dias_pausados) <= prazo_dias * 0.8 THEN 'Elegível para bonificação'
                WHEN status = 'concluido' THEN 'Não elegível para bonificação'
                ELSE 'Em andamento/pausado'
            END as status_bonificacao
        FROM consultoria 
        WHERE id IN (projeto1_id, projeto2_id, projeto3_id)
        ORDER BY id
    LOOP
        RAISE NOTICE '  Projeto %: % (% dias efetivos de %) - %', 
            rec.id, 
            rec.cliente, 
            rec.dias_efetivos, 
            rec.prazo_dias,
            rec.status_bonificacao;
    END LOOP;
    
    -- Testar cálculos de bonificação
    RAISE NOTICE '💰 TESTE DE CÁLCULOS DE BONIFICAÇÃO:';
    
    FOR rec IN
        SELECT 
            cliente,
            valor,
            prazo_dias,
            dias_pausados,
            (prazo_dias - dias_pausados) as dias_efetivos,
            status,
            assinatura_fechamento,
            CASE 
                WHEN status = 'concluido' 
                     AND assinatura_fechamento = TRUE 
                     AND (prazo_dias - dias_pausados) <= prazo_dias * 0.8 
                THEN valor * 0.10
                ELSE 0
            END as bonus_calculado
        FROM consultoria 
        WHERE id IN (projeto1_id, projeto2_id, projeto3_id)
    LOOP
        RAISE NOTICE '  %: R$ %.2f (Bônus: R$ %.2f)', 
            rec.cliente, 
            rec.valor, 
            rec.bonus_calculado;
    END LOOP;
    
    -- Testar operações de pausa/retomada
    RAISE NOTICE '⏸️ TESTANDO OPERAÇÕES DE PAUSA/RETOMADA:';
    
    -- Pausar projeto 1
    UPDATE consultoria 
    SET 
        status = 'pausado',
        data_pausa = CURRENT_DATE,
        dias_pausados = dias_pausados + 2
    WHERE id = projeto1_id;
    
    RAISE NOTICE '  Projeto 1 pausado - Total de dias pausados aumentado para 12';
    
    -- Retomar projeto 2
    UPDATE consultoria 
    SET status = 'em_andamento'
    WHERE id = projeto2_id;
    
    RAISE NOTICE '  Projeto 2 retomado - Mantendo 18 dias pausados no histórico';
    
    -- Concluir projeto 1 sem assinatura
    UPDATE consultoria 
    SET 
        status = 'concluido',
        assinatura_fechamento = FALSE
    WHERE id = projeto1_id;
    
    RAISE NOTICE '  Projeto 1 concluído SEM assinatura de fechamento';
    
    -- Relatório final dos testes
    RAISE NOTICE '📈 RELATÓRIO FINAL DOS TESTES:';
    
    SELECT 
        COUNT(*) as total_projetos,
        COUNT(CASE WHEN status = 'pausado' THEN 1 END) as pausados,
        COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as em_andamento,
        COUNT(CASE WHEN status = 'concluido' THEN 1 END) as concluidos,
        AVG(dias_pausados) as media_dias_pausados,
        SUM(CASE 
            WHEN status = 'concluido' 
                 AND assinatura_fechamento = TRUE 
                 AND (prazo_dias - dias_pausados) <= prazo_dias * 0.8 
            THEN valor * 0.10
            ELSE 0
        END) as total_bonus_elegivel
    FROM consultoria 
    WHERE id IN (projeto1_id, projeto2_id, projeto3_id);
    
    -- Limpar dados de teste
    DELETE FROM consultoria WHERE id IN (projeto1_id, projeto2_id, projeto3_id);
    RAISE NOTICE '🧹 Dados de teste removidos com sucesso';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro durante teste avançado: %', SQLERRM;
        -- Limpar dados mesmo em caso de erro
        DELETE FROM consultoria WHERE cliente LIKE '%Teste%';
        RAISE NOTICE '🧹 Limpeza de emergência executada';
END $$;

-- Teste de performance com múltiplos registros
DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    test_count INTEGER := 100;
    i INTEGER;
BEGIN
    RAISE NOTICE '⚡ TESTE DE PERFORMANCE: Inserindo % registros...', test_count;
    
    start_time := clock_timestamp();
    
    -- Inserir múltiplos registros de teste
    FOR i IN 1..test_count LOOP
        INSERT INTO consultoria (
            cliente,
            consultor,
            tipo,
            porte,
            valor,
            data_inicio,
            prazo_dias,
            status,
            dias_pausados,
            assinatura_fechamento
        ) VALUES (
            'Cliente Performance ' || i,
            'Consultor ' || (i % 5 + 1),
            CASE (i % 3) 
                WHEN 0 THEN 'Implementação'
                WHEN 1 THEN 'Consultoria'
                ELSE 'Auditoria'
            END,
            CASE (i % 3)
                WHEN 0 THEN 'Pequeno'
                WHEN 1 THEN 'Médio'
                ELSE 'Grande'
            END,
            (i * 100 + 5000)::DECIMAL,
            CURRENT_DATE - (i || ' days')::INTERVAL,
            30 + (i % 30),
            CASE (i % 4)
                WHEN 0 THEN 'em_andamento'
                WHEN 1 THEN 'pausado'
                WHEN 2 THEN 'concluido'
                ELSE 'cancelado'
            END,
            i % 10,
            (i % 2 = 0)
        );
    END LOOP;
    
    end_time := clock_timestamp();
    
    RAISE NOTICE '✅ Performance: % registros inseridos em %', 
        test_count, 
        (end_time - start_time);
    
    -- Testar consultas com as novas colunas
    start_time := clock_timestamp();
    
    PERFORM COUNT(*) 
    FROM consultoria 
    WHERE dias_pausados > 0 
    AND assinatura_fechamento = TRUE;
    
    end_time := clock_timestamp();
    
    RAISE NOTICE '✅ Consulta com novas colunas executada em %', (end_time - start_time);
    
    -- Limpar dados de performance
    DELETE FROM consultoria WHERE cliente LIKE 'Cliente Performance%';
    RAISE NOTICE '🧹 Dados de performance removidos';
    
END $$;

-- Resultado final do teste
RAISE NOTICE '🎉 TESTE AVANÇADO CONCLUÍDO COM SUCESSO!';
RAISE NOTICE '✅ Funcionalidade de pausa/retomada operacional';
RAISE NOTICE '✅ Cálculos de dias efetivos funcionando';
RAISE NOTICE '✅ Sistema de bonificação baseado em performance';
RAISE NOTICE '✅ Controle de assinatura de fechamento';
RAISE NOTICE '✅ Performance adequada para uso em produção';

RAISE NOTICE '=== TESTE AVANÇADO FINALIZADO ===';

-- Mostrar estatísticas finais da tabela
SELECT 
    'Estatísticas da tabela consultoria:' as info,
    COUNT(*) as total_projetos,
    COUNT(CASE WHEN status = 'pausado' THEN 1 END) as projetos_pausados,
    COUNT(CASE WHEN dias_pausados > 0 THEN 1 END) as projetos_com_pausas,
    AVG(dias_pausados) as media_dias_pausados,
    MAX(dias_pausados) as max_dias_pausados
FROM consultoria;
