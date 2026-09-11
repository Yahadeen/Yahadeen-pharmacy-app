-- Add additional notification types to the enum
-- This allows the system to send various user-related notifications

-- Add 'welcome' to the existing enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'welcome';

-- Add 'new_user_signup' to the existing enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_user_signup';

-- Add RLS policies for notifications if they don't exist
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Service role full access notifications"
  ON notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
