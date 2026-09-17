-- Check the actual source code of the notify_support_ticket_status function
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'notify_support_ticket_status'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check the source of broadcast_admin_notification
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'broadcast_admin_notification'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check if there's a profiles table or view
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'profiles';

-- Check all tables with 'profile' in the name
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name ILIKE '%profile%';
