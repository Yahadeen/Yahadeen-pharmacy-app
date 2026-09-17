-- Check the actual source code of notify_support_ticket_status
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'notify_support_ticket_status'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Also check notify_support_ticket
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'notify_support_ticket'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check broadcast_admin_notification
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'broadcast_admin_notification'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
