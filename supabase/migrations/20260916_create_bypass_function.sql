-- Create a function to insert support messages without triggering the enum comparison issues
-- This is a temporary workaround until the trigger functions are properly fixed

CREATE OR REPLACE FUNCTION insert_support_message_bypass_triggers(
  p_ticket_id UUID,
  p_sender_id UUID,
  p_sender_role TEXT,
  p_message TEXT,
  p_attachment_url TEXT DEFAULT NULL,
  p_is_internal BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Temporarily disable triggers
  SET session_replication_role = 'replica';
  
  -- Insert the message with explicit enum casting
  INSERT INTO support_messages (ticket_id, sender_id, sender_role, message, attachment_url, is_internal)
  VALUES (p_ticket_id, p_sender_id, p_sender_role::message_sender_role, p_message, p_attachment_url, p_is_internal)
  RETURNING support_messages.id INTO v_message_id;
  
  -- Re-enable triggers
  SET session_replication_role = 'origin';
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;