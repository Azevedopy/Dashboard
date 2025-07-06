-- Script para verificar e exibir o schema completo da tabela metrics_consultoria
-- Este script ajuda a diagnosticar problemas de estrutura da tabela

-- Verificar se a tabela existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'metrics_consultoria'
        ) 
        THEN '✅ Tabela metrics_consultoria existe'
        ELSE '❌ Tabela metrics_consultoria NÃO existe'
    END as status_tabela;

-- Mostrar todas as colunas da tabela
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'metrics_consultoria'
ORDER BY ordinal_position;

-- Verificar constraints da tabela
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'metrics_consultoria';

-- Verificar índices da tabela
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'metrics_consultoria'
ORDER BY indexname;

-- Contar registros na tabela
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as em_andamento,
    COUNT(CASE WHEN status = 'concluido' THEN 1 END) as concluidos,
    COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelados,
    COUNT(CASE WHEN status = 'pausado' THEN 1 END) as pausados,
    COUNT(CASE WHEN data_pausa IS NOT NULL THEN 1 END) as com_data_pausa,
    AVG(COALESCE(dias_pausados, 0)) as media_dias_pausados
FROM metrics_consultoria;

-- Verificar se existem valores NULL nas colunas críticas
SELECT 
    'data_pausa' as coluna,
    COUNT(*) as total,
    COUNT(data_pausa) as nao_nulos,
    COUNT(*) - COUNT(data_pausa) as nulos
FROM metrics_consultoria
UNION ALL
SELECT 
    'dias_pausados' as coluna,
    COUNT(*) as total,
    COUNT(dias_pausados) as nao_nulos,
    COUNT(*) - COUNT(dias_pausados) as nulos
FROM metrics_consultoria
UNION ALL
SELECT 
    'assinatura_fechamento' as coluna,
    COUNT(*) as total,
    COUNT(assinatura_fechamento) as nao_nulos,
    COUNT(*) - COUNT(assinatura_fechamento) as nulos
FROM metrics_consultoria;

-- Mostrar alguns registros de exemplo
SELECT 
    id,
    cliente,
    status,
    data_pausa,
    dias_pausados,
    assinatura_fechamento,
    created_at
FROM metrics_consultoria 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar permissões na tabela
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'metrics_consultoria'
ORDER BY grantee, privilege_type;
