-- Fix broadcast_admin_notification to use users table instead of profiles
CREATE OR REPLACE FUNCTION broadcast_admin_notification(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  admin_user RECORD;
BEGIN
  FOR admin_user IN
    SELECT id FROM public.users
    WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, priority, title, message, data, is_read, read_at, created_at)
    VALUES (admin_user.id, p_type::notification_type, 'medium', p_title, p_message, p_data, false, NULL, NOW());
  END LOOP;
END;
$$;
