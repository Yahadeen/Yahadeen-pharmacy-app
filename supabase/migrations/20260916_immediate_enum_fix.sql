-- IMMEDIATE FIX: Run this SQL directly in your Supabase SQL Editor
-- This will fix the enum comparison issue in the support messages RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view messages in their tickets" ON support_messages;
DROP POLICY IF EXISTS "Users can create messages in their tickets" ON support_messages;

-- Recreate with proper enum casting
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
      AND role::text IN ('attendant', 'admin')
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
      AND role::text IN ('attendant', 'admin')
    )
  );

-- Also fix support tickets policies
DROP POLICY IF EXISTS "Attendants can view tickets assigned to them or all" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Attendants can update tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON support_tickets;

CREATE POLICY "Attendants can view tickets assigned to them or all"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role::text = 'attendant'
    )
  );

CREATE POLICY "Admins can view all tickets"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role::text = 'admin'
    )
  );

CREATE POLICY "Attendants can update tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role::text = 'attendant'
    )
  );

CREATE POLICY "Admins can update all tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role::text = 'admin'
    )
  );