-- Create notification triggers for admin events
-- This ensures admins are notified about important events in the system

-- Function to create admin notification
CREATE OR REPLACE FUNCTION create_admin_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, priority, title, message, data, is_read, read_at, created_at)
  VALUES (p_user_id, p_type::notification_type, 'medium', p_title, p_message, p_data, false, NULL, NOW());
END;
$$;

-- Function to broadcast notification to all admins
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
    WHERE role::text IN ('admin', 'super_admin')
      AND is_active = true
  LOOP
    INSERT INTO public.notifications (user_id, type, priority, title, message, data, is_read, read_at, created_at)
    VALUES (admin_user.id, p_type::notification_type, 'medium', p_title, p_message, p_data, false, NULL, NOW());
  END LOOP;
END;
$$;

-- Trigger for new orders
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM broadcast_admin_notification(
    'new_order',
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

DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION notify_new_order();

-- Trigger for order status changes
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM broadcast_admin_notification(
      'order_status_updated',
      'Order Status Updated',
      'Order ' || COALESCE(NEW.code, 'Unknown') || ' status changed to ' || NEW.status,
      jsonb_build_object(
        'order_id', NEW.id,
        'order_code', NEW.code,
        'customer_id', NEW.customer_id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'kind', 'order',
        'id', NEW.id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_status_updated ON public.orders;
CREATE TRIGGER on_order_status_updated
AFTER UPDATE ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_order_status_change();

-- Trigger for new products
CREATE OR REPLACE FUNCTION notify_new_product()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM broadcast_admin_notification(
    'new_product',
    'New Product Added',
    'A new product has been added: ' || COALESCE(NEW.name, 'Unknown'),
    jsonb_build_object(
      'product_id', NEW.id,
      'product_name', NEW.name,
      'category_id', NEW.category_id,
      'price_kobo', NEW.price_kobo,
      'kind', 'product',
      'id', NEW.id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_product_created ON public.products;
CREATE TRIGGER on_product_created
AFTER INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION notify_new_product();

-- Trigger for product updates (including inventory changes)
CREATE OR REPLACE FUNCTION notify_product_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Notify if stock level changed significantly
  IF OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity THEN
    IF NEW.stock_quantity <= 5 THEN
      PERFORM broadcast_admin_notification(
        'low_stock',
        'Low Stock Alert',
        'Product ' || COALESCE(NEW.name, 'Unknown') || ' is running low on stock',
        jsonb_build_object(
          'product_id', NEW.id,
          'product_name', NEW.name,
          'old_stock', OLD.stock_quantity,
          'new_stock', NEW.stock_quantity,
          'kind', 'product',
          'id', NEW.id
        )
      );
    END IF;
  END IF;
  
  -- Notify if price changed
  IF OLD.price_kobo IS DISTINCT FROM NEW.price_kobo THEN
    PERFORM broadcast_admin_notification(
      'product_price_updated',
      'Product Price Updated',
      'Price changed for ' || COALESCE(NEW.name, 'Unknown'),
      jsonb_build_object(
        'product_id', NEW.id,
        'product_name', NEW.name,
        'old_price', OLD.price_kobo,
        'new_price', NEW.price_kobo,
        'kind', 'product',
        'id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_product_updated ON public.products;
CREATE TRIGGER on_product_updated
AFTER UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION notify_product_update();

-- Trigger for new support messages
CREATE OR REPLACE FUNCTION notify_support_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  ticket_number TEXT;
BEGIN
  -- Get ticket number
  SELECT ticket_number INTO ticket_number
  FROM public.support_tickets
  WHERE id = NEW.ticket_id;
  
  PERFORM broadcast_admin_notification(
    'support_message',
    'New Support Message',
    'New message on ticket #' || COALESCE(ticket_number, 'Unknown'),
    jsonb_build_object(
      'message_id', NEW.id,
      'ticket_id', NEW.ticket_id,
      'ticket_number', ticket_number,
      'sender_id', NEW.sender_id,
      'sender_role', NEW.sender_role,
      'message', NEW.message,
      'attachment_url', NEW.attachment_url,
      'kind', 'support',
      'id', NEW.id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_support_message_created ON public.support_messages;
CREATE TRIGGER on_support_message_created
AFTER INSERT ON public.support_messages
FOR EACH ROW
EXECUTE FUNCTION notify_support_message();

-- Trigger for new support tickets
CREATE OR REPLACE FUNCTION notify_support_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM broadcast_admin_notification(
    'new_support_ticket',
    'New Support Ticket',
    'A new support ticket has been created: ' || COALESCE(NEW.ticket_number, 'Unknown'),
    jsonb_build_object(
      'ticket_id', NEW.id,
      'ticket_number', NEW.ticket_number,
      'customer_id', NEW.customer_id,
      'subject', NEW.subject,
      'priority', NEW.priority,
      'kind', 'support',
      'id', NEW.id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_support_ticket_created ON public.support_tickets;
CREATE TRIGGER on_support_ticket_created
AFTER INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION notify_support_ticket();

-- Trigger for support ticket status changes
CREATE OR REPLACE FUNCTION notify_support_ticket_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM broadcast_admin_notification(
      'support_ticket_status_updated',
      'Support Ticket Status Updated',
      'Ticket ' || COALESCE(NEW.ticket_number, 'Unknown') || ' status changed to ' || NEW.status,
      jsonb_build_object(
        'ticket_id', NEW.id,
        'ticket_number', NEW.ticket_number,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'kind', 'support',
        'id', NEW.id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_support_ticket_status_updated ON public.support_tickets;
CREATE TRIGGER on_support_ticket_status_updated
AFTER UPDATE ON public.support_tickets
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_support_ticket_status();

-- Note: prescriptions table doesn't exist in current schema
-- If you add it later, you can create the prescription trigger here

-- Trigger for address additions
CREATE OR REPLACE FUNCTION notify_address_added()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM broadcast_admin_notification(
    'address_added',
    'New Address Added',
    'A new address has been added by user ' || COALESCE(NEW.user_id::TEXT, 'Unknown'),
    jsonb_build_object(
      'address_id', NEW.id,
      'user_id', NEW.user_id,
      'address_line', NEW.address_line,
      'city', NEW.city,
      'kind', 'address',
      'id', NEW.id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_address_created ON public.addresses;
CREATE TRIGGER on_address_created
AFTER INSERT ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION notify_address_added();

-- Enable realtime on notifications table (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
