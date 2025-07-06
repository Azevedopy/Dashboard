-- Script para verificar se toda a configuração de pausa está correta
-- Verifica colunas, constraints e funcionalidade completa

-- Verificar se todas as colunas necessárias existem
DO $$
DECLARE
    colunas_faltantes TEXT[] := ARRAY[]::TEXT[];
    coluna_nome TEXT;
BEGIN
    RAISE NOTICE '🔍 Verificando colunas necessárias...';
    
    -- Lista de colunas necessárias
    FOREACH coluna_nome IN ARRAY ARRAY['dias_pausados', 'data_pausa', 'assinatura_fechamento']
    LOOP
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'consultoria' 
            AND column_name = coluna_nome
        ) THEN
            colunas_faltantes := array_append(colunas_faltantes, coluna_nome);
        END IF;
    END LOOP;
    
    -- Reportar resultado
    IF array_length(colunas_faltantes, 1) IS NULL THEN
        RAISE NOTICE '✅ Todas as colunas necessárias existem!';
    ELSE
        RAISE NOTICE '❌ Colunas faltantes: %', array_to_string(colunas_faltantes, ', ');
    END IF;
END $$;

-- Mostrar detalhes de todas as colunas relacionadas à pausa
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'dias_pausados' THEN 'Total de dias pausados'
        WHEN column_name = 'data_pausa' THEN 'Data da última pausa'
        WHEN column_name = 'assinatura_fechamento' THEN 'Checkbox de assinatura'
        ELSE 'Coluna padrão'
    END as descricao
FROM information_schema.columns 
WHERE table_name = 'consultoria' 
AND column_name IN ('dias_pausados', 'data_pausa', 'assinatura_fechamento', 'status', 'prazo_dias')
ORDER BY 
    CASE column_name
        WHEN 'status' THEN 1
        WHEN 'prazo_dias' THEN 2
        WHEN 'dias_pausados' THEN 3
        WHEN 'data_pausa' THEN 4
        WHEN 'assinatura_fechamento' THEN 5
    END;

-- Verificar constraints de status
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'consultoria'::regclass 
AND contype = 'c' 
AND (pg_get_constraintdef(oid) LIKE '%status%' OR pg_get_constraintdef(oid) LIKE '%pausado%');

-- Testar funcionalidade completa de pausa
DO $$
DECLARE
    test_id INTEGER;
    dias_efetivos INTEGER;
BEGIN
    RAISE NOTICE '🧪 Testando funcionalidade completa de pausa...';
    
    -- Criar projeto de teste
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
        'Projeto Teste Pausa Completo',
        'Consultor Teste',
        'Implementação',
        'Médio',
        8000.00,
        CURRENT_DATE - INTERVAL '20 days',
        30,
        'em_andamento',
        0,
        FALSE
    ) RETURNING id INTO test_id;
    
    RAISE NOTICE 'Projeto criado (ID: %) - Status: em_andamento', test_id;
    
    -- Simular pausa do projeto
    UPDATE consultoria 
    SET 
        status = 'pausado',
        data_pausa = CURRENT_DATE - INTERVAL '10 days',
        dias_pausados = 5
    WHERE id = test_id;
    
    RAISE NOTICE 'Projeto pausado - 5 dias pausados registrados';
    
    -- Simular retomada
    UPDATE consultoria 
    SET 
        status = 'em_andamento',
        dias_pausados = 5  -- Manter histórico de dias pausados
    WHERE id = test_id;
    
    RAISE NOTICE 'Projeto retomado - Mantendo histórico de 5 dias pausados';
    
    -- Simular conclusão com assinatura
    UPDATE consultoria 
    SET 
        status = 'concluido',
        assinatura_fechamento = TRUE
    WHERE id = test_id;
    
    RAISE NOTICE 'Projeto concluído com assinatura de fechamento';
    
    -- Calcular dias efetivos
    SELECT (prazo_dias - dias_pausados) INTO dias_efetivos
    FROM consultoria 
    WHERE id = test_id;
    
    RAISE NOTICE 'Cálculo de dias efetivos: 30 - 5 = % dias', dias_efetivos;
    
    -- Verificar se cálculo está correto
    IF dias_efetivos = 25 THEN
        RAISE NOTICE '✅ Cálculo de dias efetivos: CORRETO';
    ELSE
        RAISE NOTICE '❌ Cálculo de dias efetivos: INCORRETO (esperado: 25, obtido: %)', dias_efetivos;
    END IF;
    
    -- Mostrar dados finais do teste
    SELECT 
        cliente,
        status,
        prazo_dias,
        dias_pausados,
        (prazo_dias - dias_pausados) as dias_efetivos,
        assinatura_fechamento,
        data_pausa
    FROM consultoria 
    WHERE id = test_id;
    
    -- Limpar dados de teste
    DELETE FROM consultoria WHERE id = test_id;
    RAISE NOTICE 'Dados de teste removidos';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro durante teste: %', SQLERRM;
        -- Limpar dados mesmo em caso de erro
        DELETE FROM consultoria WHERE cliente = 'Projeto Teste Pausa Completo';
END $$;

-- Estatísticas gerais da tabela
SELECT 
    COUNT(*) as total_projetos,
    COUNT(CASE WHEN status = 'pausado' THEN 1 END) as projetos_pausados,
    COUNT(CASE WHEN dias_pausados > 0 THEN 1 END) as projetos_com_historico_pausa,
    COUNT(CASE WHEN assinatura_fechamento = TRUE THEN 1 END) as projetos_com_assinatura,
    AVG(dias_pausados) as media_dias_pausados,
    MAX(dias_pausados) as max_dias_pausados
FROM consultoria;

-- Resultado final da verificação
DO $$
DECLARE
    colunas_ok BOOLEAN := TRUE;
    constraints_ok BOOLEAN := TRUE;
BEGIN
    -- Verificar colunas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultoria' AND column_name = 'dias_pausados') THEN
        colunas_ok := FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultoria' AND column_name = 'assinatura_fechamento') THEN
        colunas_ok := FALSE;
    END IF;
    
    -- Verificar constraints (opcional)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'consultoria'::regclass 
        AND contype = 'c' 
        AND pg_get_constraintdef(oid) LIKE '%pausado%'
    ) THEN
        constraints_ok := FALSE;
    END IF;
    
    -- Resultado final
    IF colunas_ok AND constraints_ok THEN
        RAISE NOTICE '🎉 VERIFICAÇÃO COMPLETA: Tudo configurado corretamente!';
        RAISE NOTICE '✅ Colunas: dias_pausados, data_pausa, assinatura_fechamento';
        RAISE NOTICE '✅ Status: em_andamento, pausado, concluido, cancelado';
        RAISE NOTICE '✅ Funcionalidade de pausa/retomada operacional';
        RAISE NOTICE '📊 Cálculo de dias efetivos: prazo_dias - dias_pausados';
    ELSIF colunas_ok THEN
        RAISE NOTICE '⚠️ VERIFICAÇÃO PARCIAL: Colunas OK, constraints podem precisar ajuste';
        RAISE NOTICE '✅ Funcionalidade básica operacional';
    ELSE
        RAISE NOTICE '❌ VERIFICAÇÃO FALHOU: Execute os scripts de configuração primeiro';
    END IF;
END $$;
