-- Script para testar se a inserção funciona após a correção

-- Teste 1: Inserir com cada valor válido
DO $$
BEGIN
    -- Teste basic
    INSERT INTO metrics_consultoria (cliente, tipo, consultor, porte, status, data_inicio, data_termino, tempo_dias)
    VALUES ('Teste Basic', 'consultoria', 'Teste', 'basic', 'em_andamento', CURRENT_DATE, CURRENT_DATE + 30, 30);
    
    -- Teste starter
    INSERT INTO metrics_consultoria (cliente, tipo, consultor, porte, status, data_inicio, data_termino, tempo_dias)
    VALUES ('Teste Starter', 'consultoria', 'Teste', 'starter', 'em_andamento', CURRENT_DATE, CURRENT_DATE + 30, 30);
    
    -- Teste pro
    INSERT INTO metrics_consultoria (cliente, tipo, consultor, porte, status, data_inicio, data_termino, tempo_dias)
    VALUES ('Teste Pro', 'consultoria', 'Teste', 'pro', 'em_andamento', CURRENT_DATE, CURRENT_DATE + 30, 30);
    
    -- Teste enterprise
    INSERT INTO metrics_consultoria (cliente, tipo, consultor, porte, status, data_inicio, data_termino, tempo_dias)
    VALUES ('Teste Enterprise', 'consultoria', 'Teste', 'enterprise', 'em_andamento', CURRENT_DATE, CURRENT_DATE + 30, 30);
    
    RAISE NOTICE 'Todos os testes de inserção passaram!';
    
    -- Limpar dados de teste
    DELETE FROM metrics_consultoria WHERE cliente LIKE 'Teste %';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro no teste: %', SQLERRM;
    -- Tentar limpar mesmo em caso de erro
    DELETE FROM metrics_consultoria WHERE cliente LIKE 'Teste %';
END $$;
