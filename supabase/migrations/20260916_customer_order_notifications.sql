-- Add customer notifications for order status changes
-- This ensures customers are notified when their order status changes

-- Function to create customer notification for order status change
CREATE OR REPLACE FUNCTION notify_customer_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify the customer
    INSERT INTO public.notifications (user_id, type, priority, title, message, data, is_read, read_at, created_at)
    VALUES (
      NEW.customer_id,
      'order_status_updated',
      'high',
      'Order Status Updated',
      'Your order ' || COALESCE(NEW.code, 'Unknown') || ' status has been updated to ' || NEW.status,
      jsonb_build_object(
        'order_id', NEW.id,
        'order_code', NEW.code,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'kind', 'order',
        'id', NEW.id
      ),
      false,
      NULL,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_order_status_customer_notify ON public.orders;

-- Create trigger to notify customer on order status change
CREATE TRIGGER on_order_status_customer_notify
AFTER UPDATE ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_customer_order_status();
