-- Verificar todas as restrições da tabela metrics_consultoria
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'metrics_consultoria'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;
