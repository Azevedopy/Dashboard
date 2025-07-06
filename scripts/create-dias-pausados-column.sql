-- Script para criar a coluna dias_pausados na tabela metrics_consultoria
-- Execute este script no SQL Editor do Supabase

BEGIN;

-- Verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metrics_consultoria') THEN
        RAISE EXCEPTION 'Tabela metrics_consultoria não encontrada!';
    END IF;
END $$;

-- Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'metrics_consultoria' 
        AND column_name = 'dias_pausados'
    ) THEN
        -- Adicionar a coluna dias_pausados
        ALTER TABLE metrics_consultoria 
        ADD COLUMN dias_pausados INTEGER NOT NULL DEFAULT 0;
        
        RAISE NOTICE 'Coluna dias_pausados criada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna dias_pausados já existe!';
    END IF;
END $$;

-- Atualizar registros existentes para garantir que tenham valor 0
UPDATE metrics_consultoria 
SET dias_pausados = 0 
WHERE dias_pausados IS NULL;

-- Criar índice para melhor performance (opcional)
CREATE INDEX IF NOT EXISTS idx_metrics_consultoria_dias_pausados 
ON metrics_consultoria(dias_pausados);

-- Verificar se a coluna foi criada corretamente
DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'metrics_consultoria' 
        AND column_name = 'dias_pausados'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE 'Verificação: Coluna dias_pausados existe e está pronta para uso!';
    ELSE
        RAISE EXCEPTION 'Erro: Coluna dias_pausados não foi criada!';
    END IF;
END $$;

-- Mostrar estatísticas da tabela
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN dias_pausados = 0 THEN 1 END) as registros_sem_pausa,
    COUNT(CASE WHEN dias_pausados > 0 THEN 1 END) as registros_com_pausa
FROM metrics_consultoria;

-- Teste de inserção (opcional - remova se não quiser testar)
-- INSERT INTO metrics_consultoria (
--     cliente, consultor, tipo, porte, data_inicio, data_termino, 
--     tempo_dias, valor_consultoria, status, dias_pausados
-- ) VALUES (
--     'Teste Cliente', 'Teste Consultor', 'consultoria', 'pequeno',
--     CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
--     30, 5000.00, 'em_andamento', 0
-- );

COMMIT;

-- Mostrar estrutura final da tabela
\d metrics_consultoria;
