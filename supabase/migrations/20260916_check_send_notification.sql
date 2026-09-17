-- Check if send_notification function exists and what it does
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'send_notification'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check the notify_support_message function
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'notify_support_message'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
