-- Check which function each trigger on support_tickets is calling
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'support_tickets'
ORDER BY t.tgname;

-- Also check if there are multiple triggers with similar names
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'support_tickets'
ORDER BY trigger_name;
