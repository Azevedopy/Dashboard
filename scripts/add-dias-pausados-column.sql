-- Script para adicionar coluna dias_pausados na tabela consultoria
-- Este script verifica se a coluna já existe antes de criar

DO $$
BEGIN
    -- Verificar se a coluna dias_pausados já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'consultoria' 
        AND column_name = 'dias_pausados'
    ) THEN
        -- Adicionar coluna dias_pausados
        ALTER TABLE consultoria 
        ADD COLUMN dias_pausados INTEGER NOT NULL DEFAULT 0;
        
        RAISE NOTICE 'Coluna dias_pausados adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna dias_pausados já existe na tabela consultoria';
    END IF;
    
    -- Atualizar registros existentes para garantir que tenham valor 0
    UPDATE consultoria 
    SET dias_pausados = 0 
    WHERE dias_pausados IS NULL;
    
    RAISE NOTICE 'Registros existentes atualizados com dias_pausados = 0';
    
END $$;

-- Verificar se a coluna foi criada corretamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'consultoria' 
AND column_name = 'dias_pausados';

-- Testar inserção de dados
DO $$
DECLARE
    test_id INTEGER;
BEGIN
    -- Inserir um registro de teste
    INSERT INTO consultoria (
        cliente,
        consultor,
        tipo,
        porte,
        valor,
        data_inicio,
        prazo_dias,
        status,
        dias_pausados
    ) VALUES (
        'Cliente Teste Pausa',
        'Consultor Teste',
        'Implementação',
        'Pequeno',
        5000.00,
        CURRENT_DATE,
        30,
        'em_andamento',
        5
    ) RETURNING id INTO test_id;
    
    RAISE NOTICE 'Registro de teste inserido com ID: %', test_id;
    
    -- Verificar se o registro foi inserido corretamente
    IF EXISTS (
        SELECT 1 FROM consultoria 
        WHERE id = test_id 
        AND dias_pausados = 5
    ) THEN
        RAISE NOTICE 'Teste de inserção: SUCESSO - dias_pausados = 5';
    ELSE
        RAISE NOTICE 'Teste de inserção: FALHOU';
    END IF;
    
    -- Testar update
    UPDATE consultoria 
    SET dias_pausados = 10 
    WHERE id = test_id;
    
    -- Verificar update
    IF EXISTS (
        SELECT 1 FROM consultoria 
        WHERE id = test_id 
        AND dias_pausados = 10
    ) THEN
        RAISE NOTICE 'Teste de update: SUCESSO - dias_pausados = 10';
    ELSE
        RAISE NOTICE 'Teste de update: FALHOU';
    END IF;
    
    -- Limpar dados de teste
    DELETE FROM consultoria WHERE id = test_id;
    RAISE NOTICE 'Dados de teste removidos';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro durante teste: %', SQLERRM;
        -- Tentar limpar dados de teste mesmo em caso de erro
        DELETE FROM consultoria WHERE cliente = 'Cliente Teste Pausa';
END $$;

-- Mostrar estatísticas finais
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN dias_pausados > 0 THEN 1 END) as com_dias_pausados,
    AVG(dias_pausados) as media_dias_pausados,
    MAX(dias_pausados) as max_dias_pausados
FROM consultoria;

-- Resultado final
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'consultoria' 
        AND column_name = 'dias_pausados'
    ) THEN
        RAISE NOTICE '🎉 SUCESSO: Coluna dias_pausados está pronta para uso!';
        RAISE NOTICE '📊 Agora você pode calcular dias efetivos: prazo_dias - dias_pausados';
        RAISE NOTICE '💡 Para pausar um projeto, atualize dias_pausados com o total de dias pausados';
    ELSE
        RAISE NOTICE '❌ ERRO: Coluna dias_pausados não foi criada corretamente';
    END IF;
END $$;
