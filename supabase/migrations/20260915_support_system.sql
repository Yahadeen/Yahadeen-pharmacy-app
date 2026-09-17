-- Support System Tables and Triggers
-- Enables customers to get help with orders, with real-time messaging
-- Attendants and admins can view and respond to support tickets

-- ============================================================
-- Enums
-- ============================================================

-- Support ticket status
CREATE TYPE support_ticket_status AS ENUM (
  'open',
  'in_progress',
  'resolved',
  'closed'
);

-- Support ticket priority
CREATE TYPE support_ticket_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Support ticket category
CREATE TYPE support_ticket_category AS ENUM (
  'order_issue',
  'payment_issue',
  'delivery_issue',
  'product_issue',
  'other'
);

-- Message sender role
CREATE TYPE message_sender_role AS ENUM (
  'customer',
  'attendant',
  'admin'
);

-- ============================================================
-- Tables
-- ============================================================

-- Support tickets table
CREATE TABLE support_tickets (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  ticket_number VARCHAR(20) NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendant_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable until an attendant replies
  status support_ticket_status NOT NULL DEFAULT 'open',
  priority support_ticket_priority NOT NULL DEFAULT 'medium',
  subject VARCHAR(255) NOT NULL,
  category support_ticket_category NOT NULL DEFAULT 'order_issue',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for support_tickets
CREATE INDEX idx_support_tickets_customer ON support_tickets(customer_id);
CREATE INDEX idx_support_tickets_order ON support_tickets(order_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_attendant ON support_tickets(attendant_id);
CREATE INDEX idx_support_tickets_created ON support_tickets(created_at DESC);

-- Support messages table
CREATE TABLE support_messages (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role message_sender_role NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for support_messages
CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id);
CREATE INDEX idx_support_messages_sender ON support_messages(sender_id);
CREATE INDEX idx_support_messages_created ON support_messages(created_at DESC);

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'ST-' || LPAD(NEXTVAL('support_ticket_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS support_ticket_seq START 1;

CREATE TRIGGER generate_ticket_number_trigger
BEFORE INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_number();

-- Update updated_at timestamp
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Notification Functions
-- ============================================================

-- Notify admins and attendants when a new support ticket is created
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

CREATE TRIGGER support_ticket_created_notification_trigger
AFTER INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION notify_support_ticket_created();

-- Notify relevant parties when a new message is sent
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

CREATE TRIGGER support_message_sent_notification_trigger
AFTER INSERT ON support_messages
FOR EACH ROW
EXECUTE FUNCTION notify_support_message_sent();

-- Notify customer when ticket status changes
CREATE OR REPLACE FUNCTION notify_support_ticket_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      created_at
    )
    VALUES (
      NEW.customer_id,
      'support_ticket_status',
      'Support Ticket Updated',
      'Your support ticket #' || NEW.ticket_number || ' is now ' || NEW.status,
      jsonb_build_object(
        'ticket_id', NEW.id,
        'ticket_number', NEW.ticket_number,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_ticket_status_changed_notification_trigger
AFTER UPDATE OF status ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION notify_support_ticket_status_changed();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Support tickets RLS policies
CREATE POLICY "Customers can view their own tickets"
  ON support_tickets FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Attendants can view tickets assigned to them or all"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'attendant'
    )
  );

CREATE POLICY "Admins can view all tickets"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Customers can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Attendants can update tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'attendant'
    )
  );

CREATE POLICY "Admins can update all tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Support messages RLS policies
CREATE POLICY "Users can view messages in their tickets"
  ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = support_messages.ticket_id
      AND st.customer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('attendant', 'admin')
    )
  );

CREATE POLICY "Users can create messages in their tickets"
  ON support_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = support_messages.ticket_id
      AND st.customer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('attendant', 'admin')
    )
  );

-- ============================================================
-- Grant permissions
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON support_tickets TO authenticated;
GRANT ALL ON support_messages TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE support_ticket_seq TO authenticated;
