-- Fix support ticket triggers - remove duplicate triggers that may conflict
-- The admin_notifications_triggers migration already creates correct triggers:
-- on_support_ticket_created and on_support_ticket_status_updated
-- These use the correct 'users' table, not the non-existent 'profiles' table

-- Drop the old triggers from 20260915_fix_support_user_names.sql
DROP TRIGGER IF EXISTS support_ticket_created_notification_trigger ON public.support_tickets;
DROP TRIGGER IF EXISTS support_ticket_status_changed_notification_trigger ON public.support_tickets;

-- Note: The following triggers are KEPT as they are correct and important:
-- - generate_ticket_number_trigger (generates ticket numbers)
-- - update_support_tickets_updated_at (updates timestamp)
-- - on_support_ticket_created (from admin_notifications_triggers - uses users table)
-- - on_support_ticket_status_updated (from admin_notifications_triggers - uses users table)
