-- Script para atualizar constraints de status incluindo "pausado"
-- Remove constraint antiga e adiciona nova com status "pausado"

DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Buscar nome da constraint de status existente
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'consultoria'::regclass 
    AND contype = 'c' 
    AND pg_get_constraintdef(oid) LIKE '%status%'
    LIMIT 1;
    
    -- Remover constraint antiga se existir
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE consultoria DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Constraint antiga removida: %', constraint_name;
    ELSE
        RAISE NOTICE 'Nenhuma constraint de status encontrada para remover';
    END IF;
    
    -- Adicionar nova constraint com status "pausado"
    ALTER TABLE consultoria 
    ADD CONSTRAINT consultoria_status_check 
    CHECK (status IN ('em_andamento', 'pausado', 'concluido', 'cancelado'));
    
    RAISE NOTICE 'Nova constraint adicionada: consultoria_status_check';
    RAISE NOTICE 'Status válidos: em_andamento, pausado, concluido, cancelado';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao atualizar constraint: %', SQLERRM;
        RAISE NOTICE 'Tentando adicionar constraint mesmo assim...';
        
        -- Tentar adicionar constraint mesmo se houve erro na remoção
        BEGIN
            ALTER TABLE consultoria 
            ADD CONSTRAINT consultoria_status_check_new 
            CHECK (status IN ('em_andamento', 'pausado', 'concluido', 'cancelado'));
            RAISE NOTICE 'Constraint adicionada com nome alternativo: consultoria_status_check_new';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Não foi possível adicionar constraint: %', SQLERRM;
        END;
END $$;

-- Verificar constraints atuais
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'consultoria'::regclass 
AND contype = 'c' 
AND pg_get_constraintdef(oid) LIKE '%status%';

-- Testar todos os status válidos
DO $$
DECLARE
    test_ids INTEGER[];
    status_list TEXT[] := ARRAY['em_andamento', 'pausado', 'concluido', 'cancelado'];
    status_item TEXT;
    test_id INTEGER;
BEGIN
    RAISE NOTICE 'Testando todos os status válidos...';
    
    -- Testar cada status
    FOREACH status_item IN ARRAY status_list
    LOOP
        BEGIN
            INSERT INTO consultoria (
                cliente,
                consultor,
                tipo,
                porte,
                valor,
                data_inicio,
                prazo_dias,
                status
            ) VALUES (
                'Cliente Teste Status ' || status_item,
                'Consultor Teste',
                'Teste',
                'Pequeno',
                1000.00,
                CURRENT_DATE,
                30,
                status_item
            ) RETURNING id INTO test_id;
            
            test_ids := array_append(test_ids, test_id);
            RAISE NOTICE 'Status "%" - SUCESSO (ID: %)', status_item, test_id;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Status "%" - FALHOU: %', status_item, SQLERRM;
        END;
    END LOOP;
    
    -- Testar status inválido (deve falhar)
    BEGIN
        INSERT INTO consultoria (
            cliente,
            consultor,
            tipo,
            porte,
            valor,
            data_inicio,
            prazo_dias,
            status
        ) VALUES (
            'Cliente Teste Status Inválido',
            'Consultor Teste',
            'Teste',
            'Pequeno',
            1000.00,
            CURRENT_DATE,
            30,
            'status_invalido'
        );
        
        RAISE NOTICE 'Status inválido - ERRO: Deveria ter falhado!';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Status inválido - SUCESSO: Rejeitado corretamente';
    END;
    
    -- Limpar dados de teste
    IF test_ids IS NOT NULL THEN
        DELETE FROM consultoria WHERE id = ANY(test_ids);
        RAISE NOTICE 'Dados de teste removidos (% registros)', array_length(test_ids, 1);
    END IF;
    
END $$;

-- Mostrar estatísticas de status
SELECT 
    status,
    COUNT(*) as quantidade,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
FROM consultoria 
GROUP BY status
ORDER BY quantidade DESC;

-- Resultado final
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conrelid = 'consultoria'::regclass 
        AND contype = 'c' 
        AND pg_get_constraintdef(oid) LIKE '%pausado%'
    ) THEN
        RAISE NOTICE '🎉 SUCESSO: Status "pausado" está disponível!';
        RAISE NOTICE '✅ Status válidos: em_andamento, pausado, concluido, cancelado';
        RAISE NOTICE '🔒 Constraint ativa - status inválidos serão rejeitados';
    ELSE
        RAISE NOTICE '⚠️ AVISO: Constraint pode não estar ativa, mas status pausado pode funcionar';
    END IF;
END $$;
