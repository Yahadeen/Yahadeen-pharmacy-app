-- Fix order creation failures caused by notification triggers comparing enum columns to text.

CREATE OR REPLACE FUNCTION notification_type_from_text(p_type text)
RETURNS notification_type
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumtypid = 'notification_type'::regtype
      AND enumlabel = p_type
  ) THEN
    RETURN p_type::notification_type;
  END IF;

  RETURN 'system_alert'::notification_type;
END;
$$;

CREATE OR REPLACE FUNCTION send_notification_to_roles(
  p_title text,
  p_message text,
  p_type text,
  p_data jsonb DEFAULT '{}'::jsonb,
  p_roles text[] DEFAULT ARRAY['admin', 'super_admin']
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT id, p_title, p_message, notification_type_from_text(p_type), p_data
  FROM users
  WHERE role::text = ANY(p_roles)
    AND is_active = true;
END;
$$;

CREATE OR REPLACE FUNCTION broadcast_admin_notification(
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  admin_user record;
BEGIN
  FOR admin_user IN
    SELECT id FROM public.users
    WHERE role::text IN ('admin', 'super_admin')
      AND is_active = true
  LOOP
    INSERT INTO public.notifications (user_id, type, priority, title, message, data, is_read, read_at, created_at)
    VALUES (admin_user.id, notification_type_from_text(p_type), 'medium', p_title, p_message, p_data, false, NULL, NOW());
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION create_admin_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, priority, title, message, data, is_read, read_at, created_at)
  VALUES (p_user_id, notification_type_from_text(p_type), 'medium', p_title, p_message, p_data, false, NULL, NOW());
END;
$$;

CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM broadcast_admin_notification(
    'order_created',
    'New Order Created',
    'A new order has been placed: ' || COALESCE(NEW.code, 'Unknown'),
    jsonb_build_object(
      'order_id', NEW.id,
      'order_code', NEW.code,
      'customer_id', NEW.customer_id,
      'total_kobo', NEW.total_kobo,
      'kind', 'order',
      'id', NEW.id
    )
  );
  RETURN NEW;
END;
$$;

-- Keep only the current admin notification trigger name for order creation.
DROP TRIGGER IF EXISTS order_created_notification_trigger ON public.orders;

DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION notify_new_order();
