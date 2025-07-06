-- Script para adicionar coluna assinatura_fechamento na tabela consultoria
-- Esta coluna controla se o projeto teve assinatura de fechamento

DO $$
BEGIN
    -- Verificar se a coluna assinatura_fechamento já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'consultoria' 
        AND column_name = 'assinatura_fechamento'
    ) THEN
        -- Adicionar coluna assinatura_fechamento
        ALTER TABLE consultoria 
        ADD COLUMN assinatura_fechamento BOOLEAN NOT NULL DEFAULT FALSE;
        
        -- Adicionar comentário explicativo
        COMMENT ON COLUMN consultoria.assinatura_fechamento IS 
        'Indica se o projeto teve assinatura de fechamento. Usado para controle de qualidade e bonificação.';
        
        RAISE NOTICE 'Coluna assinatura_fechamento adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna assinatura_fechamento já existe na tabela consultoria';
    END IF;
    
    -- Atualizar registros existentes para garantir que tenham valor FALSE
    UPDATE consultoria 
    SET assinatura_fechamento = FALSE 
    WHERE assinatura_fechamento IS NULL;
    
    RAISE NOTICE 'Registros existentes atualizados com assinatura_fechamento = FALSE';
    
END $$;

-- Verificar se a coluna foi criada corretamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'consultoria' 
AND column_name = 'assinatura_fechamento';

-- Testar funcionalidade da coluna
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
        assinatura_fechamento
    ) VALUES (
        'Cliente Teste Assinatura',
        'Consultor Teste',
        'Consultoria',
        'Médio',
        10000.00,
        CURRENT_DATE,
        45,
        'concluido',
        TRUE
    ) RETURNING id INTO test_id;
    
    RAISE NOTICE 'Registro de teste inserido com ID: %', test_id;
    
    -- Verificar se o registro foi inserido corretamente
    IF EXISTS (
        SELECT 1 FROM consultoria 
        WHERE id = test_id 
        AND assinatura_fechamento = TRUE
    ) THEN
        RAISE NOTICE 'Teste de inserção: SUCESSO - assinatura_fechamento = TRUE';
    ELSE
        RAISE NOTICE 'Teste de inserção: FALHOU';
    END IF;
    
    -- Testar update para FALSE
    UPDATE consultoria 
    SET assinatura_fechamento = FALSE 
    WHERE id = test_id;
    
    -- Verificar update
    IF EXISTS (
        SELECT 1 FROM consultoria 
        WHERE id = test_id 
        AND assinatura_fechamento = FALSE
    ) THEN
        RAISE NOTICE 'Teste de update: SUCESSO - assinatura_fechamento = FALSE';
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
        DELETE FROM consultoria WHERE cliente = 'Cliente Teste Assinatura';
END $$;

-- Mostrar estatísticas finais
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN assinatura_fechamento = TRUE THEN 1 END) as com_assinatura,
    COUNT(CASE WHEN assinatura_fechamento = FALSE THEN 1 END) as sem_assinatura,
    ROUND(
        COUNT(CASE WHEN assinatura_fechamento = TRUE THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as percentual_com_assinatura
FROM consultoria;

-- Resultado final
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'consultoria' 
        AND column_name = 'assinatura_fechamento'
    ) THEN
        RAISE NOTICE '🎉 SUCESSO: Coluna assinatura_fechamento está pronta para uso!';
        RAISE NOTICE '✅ Agora você pode controlar assinaturas de fechamento';
        RAISE NOTICE '📋 Use TRUE para projetos com assinatura, FALSE para sem assinatura';
    ELSE
        RAISE NOTICE '❌ ERRO: Coluna assinatura_fechamento não foi criada corretamente';
    END IF;
END $$;
