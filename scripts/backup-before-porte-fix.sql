-- Script para fazer backup dos dados antes da correção

-- Criar tabela de backup com os dados atuais
CREATE TABLE IF NOT EXISTS metrics_consultoria_backup_porte AS
SELECT 
    id,
    date,
    consultor,
    client,
    porte as porte_original,
    size_detail,
    created_at,
    NOW() as backup_created_at
FROM metrics_consultoria
WHERE porte IS NOT NULL;

-- Verificar o backup criado
SELECT 
    COUNT(*) as total_registros_backup,
    COUNT(DISTINCT porte_original) as valores_porte_distintos
FROM metrics_consultoria_backup_porte;

-- Mostrar valores únicos de porte no backup
SELECT 
    porte_original,
    COUNT(*) as quantidade
FROM metrics_consultoria_backup_porte
GROUP BY porte_original
ORDER BY porte_original;
