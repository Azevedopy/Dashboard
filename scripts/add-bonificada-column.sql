-- Script para adicionar a coluna 'bonificada' na tabela metrics_consultoria
-- Este script verifica se a coluna já existe antes de tentar adicioná-la

DO $$ 
BEGIN
    -- Verificar se a coluna 'bonificada' já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'metrics_consultoria' 
        AND column_name = 'bonificada'
    ) THEN
        -- Adicionar a coluna 'bonificada' com valor padrão FALSE
        ALTER TABLE metrics_consultoria 
        ADD COLUMN bonificada BOOLEAN DEFAULT FALSE;
        
        -- Adicionar comentário explicativo
        COMMENT ON COLUMN metrics_consultoria.bonificada IS 
        'Indica se a consultoria foi bonificada (valor muito baixo, sem comissão)';
        
        RAISE NOTICE 'Coluna bonificada adicionada com sucesso à tabela metrics_consultoria';
    ELSE
        RAISE NOTICE 'Coluna bonificada já existe na tabela metrics_consultoria';
    END IF;
END $$;

-- Verificar a estrutura da tabela após a modificação
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'metrics_consultoria'
AND column_name = 'bonificada';
