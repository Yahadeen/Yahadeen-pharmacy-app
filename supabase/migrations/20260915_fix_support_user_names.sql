-- Fix support system notification triggers to use full_name instead of first_name/last_name
-- This migration updates the notification functions to match the users table schema

-- ============================================================
-- Update notification functions to use full_name
-- ============================================================

-- Drop old triggers
DROP TRIGGER IF EXISTS support_ticket_created_notification_trigger ON support_tickets;
DROP TRIGGER IF EXISTS support_message_sent_notification_trigger ON support_messages;
DROP TRIGGER IF EXISTS support_ticket_status_changed_notification_trigger ON support_tickets;

-- Update support ticket created notification function
CREATE OR REPLACE FUNCTION notify_support_ticket_created()
RETURNS TRIGGER AS $$
DECLARE
  order_data RECORD;
BEGIN
  -- Get order details
  SELECT * INTO order_data FROM orders WHERE id = NEW.order_id;
  
  -- Notify admins
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    created_at
  )
  SELECT 
    u.id,
    'support_ticket',
    'New Support Ticket',
    'Customer ' || COALESCE(u.full_name, 'User') || ' created a support ticket for order #' || order_data.code,
    jsonb_build_object(
      'ticket_id', NEW.id,
      'ticket_number', NEW.ticket_number,
      'order_id', NEW.order_id,
      'order_code', order_data.code,
      'customer_id', NEW.customer_id,
      'subject', NEW.subject,
      'priority', NEW.priority
    ),
    NOW()
  FROM users u
  WHERE u.role = 'admin'
  AND u.id != NEW.customer_id;
  
  -- Notify attendants
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    created_at
  )
  SELECT 
    u.id,
    'support_ticket',
    'New Support Ticket',
    'Customer ' || COALESCE(u.full_name, 'User') || ' created a support ticket for order #' || order_data.code,
    jsonb_build_object(
      'ticket_id', NEW.id,
      'ticket_number', NEW.ticket_number,
      'order_id', NEW.order_id,
      'order_code', order_data.code,
      'customer_id', NEW.customer_id,
      'subject', NEW.subject,
      'priority', NEW.priority
    ),
    NOW()
  FROM users u
  WHERE u.role = 'attendant'
  AND u.id != NEW.customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update support message sent notification function
CREATE OR REPLACE FUNCTION notify_support_message_sent()
RETURNS TRIGGER AS $$
DECLARE
  ticket_data RECORD;
  sender_name TEXT;
BEGIN
  -- Get ticket details
  SELECT 
    st.*,
    u.full_name
  INTO ticket_data
  FROM support_tickets st
  JOIN users u ON st.customer_id = u.id
  WHERE st.id = NEW.ticket_id;
  
  -- Get sender name
  SELECT COALESCE(full_name, 'User') INTO sender_name
  FROM users
  WHERE id = NEW.sender_id;
  
  -- If sender is customer, notify admins and attendants
  IF NEW.sender_role = 'customer' THEN
    -- Notify admins
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      created_at
    )
    SELECT 
      u.id,
      'support_message',
      'New Support Message',
      sender_name || ' sent a message on ticket #' || ticket_data.ticket_number,
      jsonb_build_object(
        'ticket_id', NEW.ticket_id,
        'ticket_number', ticket_data.ticket_number,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id,
        'sender_role', NEW.sender_role
      ),
      NOW()
    FROM users u
    WHERE u.role = 'admin'
    AND u.id != NEW.sender_id;
    
    -- Notify assigned attendant
    IF ticket_data.attendant_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        created_at
      )
      VALUES (
        ticket_data.attendant_id,
        'support_message',
        'New Support Message',
        sender_name || ' sent a message on ticket #' || ticket_data.ticket_number,
        jsonb_build_object(
          'ticket_id', NEW.ticket_id,
          'ticket_number', ticket_data.ticket_number,
          'message_id', NEW.id,
          'sender_id', NEW.sender_id,
          'sender_role', NEW.sender_role
        ),
        NOW()
      );
    END IF;
    
  -- If sender is attendant or admin, notify customer
  ELSIF NEW.sender_role = 'attendant' OR NEW.sender_role = 'admin' THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      created_at
    )
    VALUES (
      ticket_data.customer_id,
      'support_message',
      'Support Response',
      'You have a new response on ticket #' || ticket_data.ticket_number,
      jsonb_build_object(
        'ticket_id', NEW.ticket_id,
        'ticket_number', ticket_data.ticket_number,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id,
        'sender_role', NEW.sender_role
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER support_ticket_created_notification_trigger
AFTER INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION notify_support_ticket_created();

CREATE TRIGGER support_message_sent_notification_trigger
AFTER INSERT ON support_messages
FOR EACH ROW
EXECUTE FUNCTION notify_support_message_sent();

CREATE TRIGGER support_ticket_status_changed_notification_trigger
AFTER UPDATE OF status ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION notify_support_ticket_status_changed();
