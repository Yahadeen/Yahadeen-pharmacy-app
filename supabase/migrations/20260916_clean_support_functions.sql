-- Clean up duplicate and broken support notification functions
-- Keep only the clean ones from admin_notifications_triggers

-- Drop old duplicate functions (these reference send_notification or are outdated)
DROP FUNCTION IF EXISTS public.notify_support_ticket_status_changed() CASCADE;
DROP FUNCTION IF EXISTS public.notify_support_ticket_status_updated() CASCADE;
DROP FUNCTION IF EXISTS public.notify_support_ticket_created() CASCADE;
DROP FUNCTION IF EXISTS public.notify_support_message_sent() CASCADE;
DROP FUNCTION IF EXISTS public.notify_support_message_created() CASCADE;
DROP FUNCTION IF EXISTS public.send_notification() CASCADE;

-- Drop old triggers that use the old functions
DROP TRIGGER IF EXISTS support_ticket_status_changed_notification_trigger ON public.support_tickets;
DROP TRIGGER IF EXISTS support_message_sent_notification_trigger ON public.support_messages;

-- Keep these clean functions (from admin_notifications_triggers):
-- - notify_support_ticket() - broadcasts to admins, uses users table
-- - notify_support_ticket_status() - broadcasts to admins, uses users table
-- - notify_support_message() - broadcasts to admins, uses users table
-- - broadcast_admin_notification() - helper function, uses users table

-- Keep these important triggers:
-- - on_support_ticket_created -> calls notify_support_ticket()
-- - on_support_ticket_status_updated -> calls notify_support_ticket_status()
-- - on_support_message_created -> calls notify_support_message()
-- - generate_ticket_number_trigger -> generates ticket numbers
-- - update_support_tickets_updated_at -> updates timestamps
