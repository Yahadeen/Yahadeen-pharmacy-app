-- Re-enable RLS with proper policies for service role
-- This migration re-enables RLS after testing and ensures service role can manage data

-- Enable RLS on all user-related tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

DROP POLICY IF EXISTS "Users can view own admin profile" ON admin_profiles;
DROP POLICY IF EXISTS "Service role can manage admin profiles" ON admin_profiles;

DROP POLICY IF EXISTS "Users can view own attendant profile" ON attendant_profiles;
DROP POLICY IF EXISTS "Service role can manage attendant profiles" ON attendant_profiles;

DROP POLICY IF EXISTS "Users can view own customer profile" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can manage customer profiles" ON customer_profiles;

DROP POLICY IF EXISTS "Users can view own admin access" ON admin_access;
DROP POLICY IF EXISTS "Service role can manage admin access" ON admin_access;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can manage notifications" ON notifications;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage users" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policies for admin_profiles table
CREATE POLICY "Users can view own admin profile" ON admin_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = admin_profiles.user_id
      AND users.id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage admin profiles" ON admin_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policies for attendant_profiles table
CREATE POLICY "Users can view own attendant profile" ON attendant_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = attendant_profiles.user_id
      AND users.id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage attendant profiles" ON attendant_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policies for customer_profiles table
CREATE POLICY "Users can view own customer profile" ON customer_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = customer_profiles.user_id
      AND users.id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage customer profiles" ON customer_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policies for admin_access table
CREATE POLICY "Users can view own admin access" ON admin_access
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = admin_access.admin_id
      AND users.id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage admin access" ON admin_access
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policies for notifications table
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage notifications" ON notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
