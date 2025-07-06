-- Script de teste para inserção de registros com a coluna bonificada

-- Teste 1: Inserir uma consultoria normal (não bonificada)
INSERT INTO metrics_consultoria (
    cliente,
    tipo,
    porte,
    consultor,
    data_inicio,
    data_termino,
    valor_consultoria,
    status,
    tempo_dias,
    bonificada
) VALUES (
    'Teste Cliente Normal',
    'consultoria',
    'pro',
    'Consultor Teste',
    '2024-01-01',
    '2024-02-01',
    5000.00,
    'concluido',
    31,
    FALSE
);

-- Teste 2: Inserir uma consultoria bonificada (valor baixo)
INSERT INTO metrics_consultoria (
    cliente,
    tipo,
    porte,
    consultor,
    data_inicio,
    data_termino,
    valor_consultoria,
    status,
    tempo_dias,
    bonificada
) VALUES (
    'Teste Cliente Bonificado',
    'consultoria',
    'starter',
    'Consultor Teste',
    '2024-01-01',
    '2024-01-15',
    50.00,
    'concluido',
    14,
    TRUE
);

-- Teste 3: Inserir sem especificar bonificada (deve usar o padrão FALSE)
INSERT INTO metrics_consultoria (
    cliente,
    tipo,
    porte,
    consultor,
    data_inicio,
    data_termino,
    valor_consultoria,
    status,
    tempo_dias
) VALUES (
    'Teste Cliente Padrão',
    'upsell',
    'basic',
    'Consultor Teste',
    '2024-01-01',
    '2024-01-30',
    2000.00,
    'em_andamento',
    29
);

-- Verificar os registros inseridos
SELECT 
    cliente,
    valor_consultoria,
    bonificada,
    status,
    created_at
FROM metrics_consultoria 
WHERE cliente LIKE 'Teste Cliente%'
ORDER BY created_at DESC;

-- Limpar os dados de teste (descomente se quiser remover)
-- DELETE FROM metrics_consultoria WHERE cliente LIKE 'Teste Cliente%';
