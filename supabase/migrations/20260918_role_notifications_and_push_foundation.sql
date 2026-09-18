-- Role-aware in-app notifications for customers, attendants, admins, and super admins.
-- Push notifications are sent by the API/service layer from the same events; this
-- migration keeps the notifications table reliable for realtime/in-app feeds.

CREATE OR REPLACE FUNCTION public.notification_type_from_text(p_type text)
RETURNS public.notification_type
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumtypid = 'public.notification_type'::regtype
      AND enumlabel = p_type
  ) THEN
    RETURN p_type::public.notification_type;
  END IF;

  RETURN 'system_alert'::public.notification_type;
END;
$$;

CREATE OR REPLACE FUNCTION public.notification_priority_from_text(p_priority text)
RETURNS public.notification_priority
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumtypid = 'public.notification_priority'::regtype
      AND enumlabel = p_priority
  ) THEN
    RETURN p_priority::public.notification_priority;
  END IF;

  RETURN 'medium'::public.notification_priority;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_app_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'::jsonb,
  p_priority text DEFAULT 'medium'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (user_id, type, priority, title, message, data, is_read, read_at, created_at)
  VALUES (
    p_user_id,
    public.notification_type_from_text(p_type),
    public.notification_priority_from_text(p_priority),
    p_title,
    p_message,
    COALESCE(p_data, '{}'::jsonb),
    false,
    NULL::timestamp with time zone,
    NOW()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_roles(
  p_roles text[],
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'::jsonb,
  p_priority text DEFAULT 'medium',
  p_only_on_duty boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, priority, title, message, data, is_read, read_at, created_at)
  SELECT DISTINCT
    u.id,
    public.notification_type_from_text(p_type),
    public.notification_priority_from_text(p_priority),
    p_title,
    p_message,
    COALESCE(p_data, '{}'::jsonb),
    false,
    NULL::timestamp with time zone,
    NOW()
  FROM public.users u
  LEFT JOIN public.attendant_profiles ap ON ap.user_id = u.id
  WHERE u.is_active = true
    AND u.role::text = ANY(p_roles)
    AND (
      p_only_on_duty = false
      OR u.role::text <> 'attendant'
      OR COALESCE(ap.is_on_duty, false) = true
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.status_label(p_status text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_status
    WHEN 'pending_payment' THEN 'Pending payment'
    WHEN 'payment_failed' THEN 'Payment failed'
    WHEN 'paid' THEN 'Paid'
    WHEN 'confirmed' THEN 'Confirmed'
    WHEN 'preparing' THEN 'Preparing'
    WHEN 'packed' THEN 'Packed'
    WHEN 'ready_for_pickup' THEN 'Ready for pickup'
    WHEN 'picked_up' THEN 'Picked up'
    WHEN 'out_for_delivery' THEN 'Out for delivery'
    WHEN 'delivered' THEN 'Delivered'
    WHEN 'cancelled' THEN 'Cancelled'
    ELSE initcap(replace(p_status, '_', ' '))
  END;
$$;

CREATE OR REPLACE FUNCTION public.notify_order_created_for_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_name text;
BEGIN
  SELECT full_name INTO v_customer_name
  FROM public.users
  WHERE id = NEW.customer_id;

  PERFORM public.insert_app_notification(
    NEW.customer_id,
    'order_created',
    'Order created',
    'Your order ' || COALESCE(NEW.code, 'Unknown') || ' has been created.',
    jsonb_build_object(
      'kind', 'order',
      'id', NEW.id,
      'order_id', NEW.id,
      'order_code', NEW.code,
      'status', NEW.status::text,
      'total_kobo', NEW.total_kobo
    ),
    'medium'
  );

  PERFORM public.notify_roles(
    ARRAY['attendant', 'admin', 'super_admin'],
    'order_created',
    'New order received',
    'Order ' || COALESCE(NEW.code, 'Unknown') || ' was placed' ||
      CASE WHEN v_customer_name IS NULL THEN '.' ELSE ' by ' || v_customer_name || '.' END,
    jsonb_build_object(
      'kind', 'order',
      'id', NEW.id,
      'order_id', NEW.id,
      'order_code', NEW.code,
      'customer_id', NEW.customer_id,
      'customer_name', v_customer_name,
      'status', NEW.status::text,
      'total_kobo', NEW.total_kobo
    ),
    'high',
    false
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_order_status_for_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_label text;
  v_reason text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_label := public.status_label(NEW.status::text);
  v_reason := COALESCE(NEW.cancellation_reason, 'No reason provided');

  PERFORM public.insert_app_notification(
    NEW.customer_id,
    CASE WHEN NEW.status::text = 'cancelled' THEN 'order_cancelled' ELSE 'order_status_updated' END,
    CASE WHEN NEW.status::text = 'cancelled' THEN 'Order cancelled' ELSE 'Order status updated' END,
    CASE
      WHEN NEW.status::text = 'cancelled'
        THEN 'Your order ' || COALESCE(NEW.code, 'Unknown') || ' was cancelled. Reason: ' || v_reason
      ELSE 'Your order ' || COALESCE(NEW.code, 'Unknown') || ' is now ' || v_label || '.'
    END,
    jsonb_build_object(
      'kind', 'order',
      'id', NEW.id,
      'order_id', NEW.id,
      'order_code', NEW.code,
      'old_status', OLD.status::text,
      'new_status', NEW.status::text,
      'status', NEW.status::text,
      'cancellation_reason', NEW.cancellation_reason
    ),
    CASE WHEN NEW.status::text IN ('cancelled', 'payment_failed') THEN 'high' ELSE 'medium' END
  );

  IF NEW.status::text IN ('paid', 'confirmed', 'preparing', 'packed', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'payment_failed') THEN
    PERFORM public.notify_roles(
      ARRAY['attendant', 'admin', 'super_admin'],
      CASE WHEN NEW.status::text = 'cancelled' THEN 'order_cancelled' ELSE 'order_status_updated' END,
      'Order ' || COALESCE(NEW.code, 'Unknown') || ' - ' || v_label,
      CASE
        WHEN NEW.status::text = 'cancelled'
          THEN 'Order ' || COALESCE(NEW.code, 'Unknown') || ' was cancelled. Reason: ' || v_reason
        ELSE 'Order ' || COALESCE(NEW.code, 'Unknown') || ' is now ' || v_label || '.'
      END,
      jsonb_build_object(
        'kind', 'order',
        'id', NEW.id,
        'order_id', NEW.id,
        'order_code', NEW.code,
        'customer_id', NEW.customer_id,
        'old_status', OLD.status::text,
        'new_status', NEW.status::text,
        'status', NEW.status::text,
        'cancellation_reason', NEW.cancellation_reason
      ),
      CASE WHEN NEW.status::text IN ('paid', 'cancelled', 'payment_failed') THEN 'high' ELSE 'medium' END,
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_payment_for_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_status text;
  v_reference text;
BEGIN
  v_status := NEW.status::text;

  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF v_status NOT IN ('success', 'failed') THEN
    RETURN NEW;
  END IF;

  SELECT id, code, customer_id, total_kobo
  INTO v_order
  FROM public.orders
  WHERE id = NEW.order_id;

  IF v_order.id IS NULL THEN
    RETURN NEW;
  END IF;

  v_reference := NEW.payment_reference;

  IF v_status = 'success' THEN
    PERFORM public.insert_app_notification(
      v_order.customer_id,
      'payment_successful',
      'Payment successful',
      'Payment for order ' || COALESCE(v_order.code, 'Unknown') || ' was successful.',
      jsonb_build_object(
        'kind', 'order',
        'id', v_order.id,
        'order_id', v_order.id,
        'order_code', v_order.code,
        'payment_id', NEW.id,
        'payment_reference', v_reference,
        'amount_kobo', NEW.amount_kobo
      ),
      'high'
    );

    PERFORM public.notify_roles(
      ARRAY['attendant', 'admin', 'super_admin'],
      'payment_successful',
      'Order paid',
      'Order ' || COALESCE(v_order.code, 'Unknown') || ' has been paid and is ready for processing.',
      jsonb_build_object(
        'kind', 'order',
        'id', v_order.id,
        'order_id', v_order.id,
        'order_code', v_order.code,
        'customer_id', v_order.customer_id,
        'payment_id', NEW.id,
        'payment_reference', v_reference,
        'amount_kobo', NEW.amount_kobo
      ),
      'high',
      false
    );
  ELSE
    PERFORM public.insert_app_notification(
      v_order.customer_id,
      'order_status_updated',
      'Payment failed',
      'Payment for order ' || COALESCE(v_order.code, 'Unknown') || ' failed. Please try again.',
      jsonb_build_object(
        'kind', 'order',
        'id', v_order.id,
        'order_id', v_order.id,
        'order_code', v_order.code,
        'payment_id', NEW.id,
        'payment_reference', v_reference,
        'status', 'payment_failed'
      ),
      'high'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_support_ticket_for_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_name text;
BEGIN
  SELECT full_name INTO v_customer_name
  FROM public.users
  WHERE id = NEW.customer_id;

  PERFORM public.notify_roles(
    ARRAY['attendant', 'admin', 'super_admin'],
    'support_ticket',
    'New support ticket',
    COALESCE(v_customer_name, 'A customer') || ' opened support ticket ' || COALESCE(NEW.ticket_number, 'Unknown') || '.',
    jsonb_build_object(
      'kind', 'support',
      'id', NEW.id,
      'ticket_id', NEW.id,
      'ticket_number', NEW.ticket_number,
      'order_id', NEW.order_id,
      'customer_id', NEW.customer_id,
      'customer_name', v_customer_name,
      'subject', NEW.subject,
      'priority', NEW.priority::text
    ),
    CASE WHEN NEW.priority::text IN ('high', 'urgent') THEN 'high' ELSE 'medium' END,
    false
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_support_message_for_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket record;
  v_sender record;
  v_notify_ids uuid[];
BEGIN
  SELECT id, ticket_number, customer_id, attendant_id, subject
  INTO v_ticket
  FROM public.support_tickets
  WHERE id = NEW.ticket_id;

  IF v_ticket.id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, full_name, role
  INTO v_sender
  FROM public.users
  WHERE id = NEW.sender_id;

  IF NEW.sender_role::text = 'customer' THEN
    SELECT array_agg(DISTINCT u.id)
    INTO v_notify_ids
    FROM public.users u
    WHERE u.is_active = true
      AND u.role::text IN ('attendant', 'admin', 'super_admin')
      AND u.id <> NEW.sender_id;

    IF v_notify_ids IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, priority, title, message, data, is_read, read_at, created_at)
      SELECT
        unnest(v_notify_ids),
        public.notification_type_from_text('support_message'),
        public.notification_priority_from_text('medium'),
        'New support message',
        COALESCE(v_sender.full_name, 'Customer') || ' sent a message in ticket ' || COALESCE(v_ticket.ticket_number, 'Unknown') || '.',
        jsonb_build_object(
          'kind', 'support',
          'id', NEW.ticket_id,
          'ticket_id', NEW.ticket_id,
          'ticket_number', v_ticket.ticket_number,
          'message_id', NEW.id,
          'sender_id', NEW.sender_id,
          'sender_role', NEW.sender_role::text
        ),
        false,
        NULL::timestamp with time zone,
        NOW();
    END IF;
  ELSE
    IF v_ticket.customer_id <> NEW.sender_id THEN
      PERFORM public.insert_app_notification(
        v_ticket.customer_id,
        'support_message',
        'Support reply',
        COALESCE(v_sender.full_name, 'Support') || ' replied to ticket ' || COALESCE(v_ticket.ticket_number, 'Unknown') || '.',
        jsonb_build_object(
          'kind', 'support',
          'id', NEW.ticket_id,
          'ticket_id', NEW.ticket_id,
          'ticket_number', v_ticket.ticket_number,
          'message_id', NEW.id,
          'sender_id', NEW.sender_id,
          'sender_role', NEW.sender_role::text
        ),
        'medium'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_support_ticket_status_for_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  PERFORM public.insert_app_notification(
    NEW.customer_id,
    'support_ticket_status',
    'Support ticket updated',
    'Your ticket ' || COALESCE(NEW.ticket_number, 'Unknown') || ' is now ' || initcap(replace(NEW.status::text, '_', ' ')) || '.',
    jsonb_build_object(
      'kind', 'support',
      'id', NEW.id,
      'ticket_id', NEW.id,
      'ticket_number', NEW.ticket_number,
      'old_status', OLD.status::text,
      'new_status', NEW.status::text
    ),
    'medium'
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_low_stock_for_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold integer;
BEGIN
  v_threshold := COALESCE(NEW.low_stock_threshold, 10);

  IF NEW.stock_quantity IS NULL OR NEW.stock_quantity > v_threshold THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
    AND OLD.stock_quantity IS NOT NULL
    AND OLD.stock_quantity <= v_threshold
    AND NEW.stock_quantity <= v_threshold THEN
    RETURN NEW;
  END IF;

  PERFORM public.notify_roles(
    ARRAY['attendant', 'admin', 'super_admin'],
    'low_stock',
    'Low stock alert',
    COALESCE(NEW.name, 'A product') || ' is low on stock. Current stock: ' || NEW.stock_quantity || '.',
    jsonb_build_object(
      'kind', 'product',
      'id', NEW.id,
      'product_id', NEW.id,
      'product_name', NEW.name,
      'stock_quantity', NEW.stock_quantity,
      'low_stock_threshold', v_threshold
    ),
    'high',
    false
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_address_change_for_customer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type text;
  v_title text;
  v_message text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_type := 'address_created';
    v_title := 'Address added';
    v_message := 'A new delivery address was added to your account.';
  ELSIF OLD.is_default IS DISTINCT FROM NEW.is_default AND NEW.is_default = true THEN
    v_type := 'default_address_changed';
    v_title := 'Default address updated';
    v_message := 'Your default delivery address was updated.';
  ELSE
    v_type := 'address_updated';
    v_title := 'Address updated';
    v_message := 'A delivery address was updated on your account.';
  END IF;

  PERFORM public.insert_app_notification(
    NEW.user_id,
    v_type,
    v_title,
    v_message,
    jsonb_build_object(
      'kind', 'address',
      'id', NEW.id,
      'address_id', NEW.id,
      'city', NEW.city,
      'state', NEW.state,
      'is_default', NEW.is_default
    ),
    'low'
  );

  RETURN NEW;
END;
$$;

-- Clean up older duplicate or drifted trigger names, then install the canonical set.
DROP TRIGGER IF EXISTS order_created_notification_trigger ON public.orders;
DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_created_for_roles();

DROP TRIGGER IF EXISTS order_status_updated_notification_trigger ON public.orders;
DROP TRIGGER IF EXISTS on_order_status_updated ON public.orders;
DROP TRIGGER IF EXISTS on_order_status_customer_notify ON public.orders;
CREATE TRIGGER on_order_status_updated
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.notify_order_status_for_roles();

DROP TRIGGER IF EXISTS on_payment_successful ON public.payments;
DROP TRIGGER IF EXISTS on_payment_notification ON public.payments;
CREATE TRIGGER on_payment_notification
AFTER INSERT OR UPDATE OF status ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.notify_payment_for_roles();

DROP TRIGGER IF EXISTS on_support_ticket_created ON public.support_tickets;
CREATE TRIGGER on_support_ticket_created
AFTER INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_support_ticket_for_roles();

DROP TRIGGER IF EXISTS on_support_message_created ON public.support_messages;
CREATE TRIGGER on_support_message_created
AFTER INSERT ON public.support_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_support_message_for_roles();

DROP TRIGGER IF EXISTS on_support_ticket_status_updated ON public.support_tickets;
CREATE TRIGGER on_support_ticket_status_updated
AFTER UPDATE OF status ON public.support_tickets
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.notify_support_ticket_status_for_roles();

DROP TRIGGER IF EXISTS low_stock_notification_trigger ON public.products;
DROP TRIGGER IF EXISTS on_low_stock ON public.products;
DROP TRIGGER IF EXISTS on_product_updated ON public.products;
CREATE TRIGGER on_low_stock
AFTER INSERT OR UPDATE OF stock_quantity ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_low_stock_for_roles();

DROP TRIGGER IF EXISTS on_address_created ON public.addresses;
DROP TRIGGER IF EXISTS on_address_added ON public.addresses;
DROP TRIGGER IF EXISTS on_address_updated ON public.addresses;
CREATE TRIGGER on_address_created
AFTER INSERT ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION public.notify_address_change_for_customer();

CREATE TRIGGER on_address_updated
AFTER UPDATE ON public.addresses
FOR EACH ROW
WHEN (
  OLD.address_line1 IS DISTINCT FROM NEW.address_line1
  OR OLD.address_line2 IS DISTINCT FROM NEW.address_line2
  OR OLD.city IS DISTINCT FROM NEW.city
  OR OLD.state IS DISTINCT FROM NEW.state
  OR OLD.phone IS DISTINCT FROM NEW.phone
  OR OLD.is_default IS DISTINCT FROM NEW.is_default
)
EXECUTE FUNCTION public.notify_address_change_for_customer();

DELETE FROM public.push_tokens a
USING public.push_tokens b
WHERE a.user_id = b.user_id
  AND a.token = b.token
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_tokens_unique_user_token
ON public.push_tokens (user_id, token);

CREATE INDEX IF NOT EXISTS idx_push_tokens_active_user
ON public.push_tokens (user_id)
WHERE is_active = true;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
