-- This script helps identify any remaining references to the non-existent profiles table
-- Run this in the SQL Editor to find what's causing the error

-- Check for any views that reference profiles
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE definition ILIKE '%profiles%';

-- Check for any functions that reference profiles
SELECT 
    p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname ILIKE '%profile%'
LIMIT 50;

-- Check for any triggers on support_tickets and support_messages
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('support_tickets', 'support_messages')
LIMIT 50;

-- Check if there's a profiles view
SELECT table_name 
FROM information_schema.views
WHERE table_schema = 'public' AND table_name ILIKE '%profile%';

-- Check all triggers on support_tickets
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'support_tickets';
