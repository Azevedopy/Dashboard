-- SCRIPT 4: Verificar configuração completa
-- Este script verifica se todas as colunas e funcionalidades estão funcionando

DO $$
DECLARE
    col_count INTEGER;
    test_id UUID;
BEGIN
    RAISE NOTICE '=== VERIFICAÇÃO COMPLETA DA CONFIGURAÇÃO ===';
    
    -- 1. Verificar se todas as colunas necessárias existem
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_name = 'metrics_consultoria' 
    AND column_name IN ('data_pausa', 'dias_pausados', 'assinatura_fechamento');
    
    IF col_count = 3 THEN
        RAISE NOTICE '✅ Todas as 3 colunas necessárias existem: data_pausa, dias_pausados, assinatura_fechamento';
    ELSE
        RAISE NOTICE '❌ Faltam colunas. Encontradas: % de 3', col_count;
    END IF;
    
    -- 2. Mostrar detalhes das colunas
    RAISE NOTICE '=== DETALHES DAS COLUNAS ===';
    FOR col_count IN 
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'metrics_consultoria' 
        AND column_name IN ('data_pausa', 'dias_pausados', 'assinatura_fechamento')
    LOOP
        -- Log será mostrado pela query abaixo
    END LOOP;
    
    -- 3. Testar funcionalidade completa de pausa/retomada
    RAISE NOTICE '=== TESTE DE FUNCIONALIDADE COMPLETA ===';
    
    -- Inserir projeto de teste
    INSERT INTO metrics_consultoria (
        cliente, tipo, consultor, porte, data_inicio, data_termino, 
        tempo_dias, valor_consultoria, valor_bonus, status, 
        dias_pausados, data_pausa, assinatura_fechamento
    ) VALUES (
        'Projeto Teste Completo', 'consultoria', 'Consultor Teste', 'pro',
        CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '35 days', 45, 
        12000, 960, 'em_andamento', 0, NULL, FALSE
    ) RETURNING id INTO test_id;
    
    RAISE NOTICE '✅ Projeto de teste criado com ID: %', test_id;
    
    -- Simular pausa
    UPDATE metrics_consultoria 
    SET status = 'pausado', 
        data_pausa = CURRENT_TIMESTAMP,
        dias_pausados = 3
    WHERE id = test_id;
    
    RAISE NOTICE '✅ Projeto pausado com 3 dias pausados';
    
    -- Simular retomada
    UPDATE metrics_consultoria 
    SET status = 'em_andamento', 
        data_pausa = NULL,
        dias_pausados = 3  -- Mantém os dias pausados acumulados
    WHERE id = test_id;
    
    RAISE NOTICE '✅ Projeto retomado (dias pausados mantidos)';
    
    -- Simular finalização com assinatura
    UPDATE metrics_consultoria 
    SET status = 'concluido', 
        data_finalizacao = CURRENT_DATE,
        assinatura_fechamento = TRUE,
        avaliacao_estrelas = 5,
        prazo_atingido = TRUE
    WHERE id = test_id;
    
    RAISE NOTICE '✅ Projeto finalizado com assinatura confirmada';
    
    -- Calcular dias efetivos
    RAISE NOTICE '=== CÁLCULO DE DIAS EFETIVOS ===';
    SELECT 
        tempo_dias,
        dias_pausados,
        (tempo_dias - dias_pausados) as dias_efetivos,
        CASE 
            WHEN (tempo_dias - dias_pausados) <= 40 THEN 'Dentro do prazo'
            ELSE 'Fora do prazo'
        END as status_prazo
    FROM metrics_consultoria 
    WHERE id = test_id
    INTO col_count; -- Reutilizando variável
    
    -- Limpar dados de teste
    DELETE FROM metrics_consultoria WHERE id = test_id;
    RAISE NOTICE '✅ Dados de teste removidos';
    
    RAISE NOTICE '=== VERIFICAÇÃO CONCLUÍDA COM SUCESSO ===';
    
END $$;

-- Mostrar informações das colunas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'metrics_consultoria' 
AND column_name IN ('data_pausa', 'dias_pausados', 'assinatura_fechamento')
ORDER BY column_name;

-- Mostrar constraints de status
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%status%';

-- Estatísticas finais
SELECT 
    COUNT(*) as total_projetos,
    COUNT(*) FILTER (WHERE data_pausa IS NOT NULL) as projetos_pausados,
    COUNT(*) FILTER (WHERE dias_pausados > 0) as projetos_com_dias_pausados,
    COUNT(*) FILTER (WHERE assinatura_fechamento = TRUE) as projetos_com_assinatura,
    AVG(dias_pausados) as media_dias_pausados
FROM metrics_consultoria;
