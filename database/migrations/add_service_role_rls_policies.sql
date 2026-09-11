-- Add RLS policies for service role to manage user profiles
-- This allows the backend API to create/update user profiles

-- Enable RLS on all tables if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing service role policies if they exist
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Service role can update users" ON users;
DROP POLICY IF EXISTS "Service role can select users" ON users;
DROP POLICY IF EXISTS "Service role can delete users" ON users;

-- Create service role policies for users table
CREATE POLICY "Service role can insert users"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update users"
  ON users FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can select users"
  ON users FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete users"
  ON users FOR DELETE
  TO service_role
  USING (true);

-- Admin profiles policies
DROP POLICY IF EXISTS "Service role can insert admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Service role can update admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Service role can select admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Service role can delete admin_profiles" ON admin_profiles;

CREATE POLICY "Service role can insert admin_profiles"
  ON admin_profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update admin_profiles"
  ON admin_profiles FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can select admin_profiles"
  ON admin_profiles FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete admin_profiles"
  ON admin_profiles FOR DELETE
  TO service_role
  USING (true);

-- Attendant profiles policies
DROP POLICY IF EXISTS "Service role can insert attendant_profiles" ON attendant_profiles;
DROP POLICY IF EXISTS "Service role can update attendant_profiles" ON attendant_profiles;
DROP POLICY IF EXISTS "Service role can select attendant_profiles" ON attendant_profiles;
DROP POLICY IF EXISTS "Service role can delete attendant_profiles" ON attendant_profiles;

CREATE POLICY "Service role can insert attendant_profiles"
  ON attendant_profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update attendant_profiles"
  ON attendant_profiles FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can select attendant_profiles"
  ON attendant_profiles FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete attendant_profiles"
  ON attendant_profiles FOR DELETE
  TO service_role
  USING (true);

-- Customer profiles policies
DROP POLICY IF EXISTS "Service role can insert customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can update customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can select customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can delete customer_profiles" ON customer_profiles;

CREATE POLICY "Service role can insert customer_profiles"
  ON customer_profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update customer_profiles"
  ON customer_profiles FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can select customer_profiles"
  ON customer_profiles FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete customer_profiles"
  ON customer_profiles FOR DELETE
  TO service_role
  USING (true);

-- Admin access table policies
DROP POLICY IF EXISTS "Service role can insert admin_access" ON admin_access;
DROP POLICY IF EXISTS "Service role can update admin_access" ON admin_access;
DROP POLICY IF EXISTS "Service role can select admin_access" ON admin_access;
DROP POLICY IF EXISTS "Service role can delete admin_access" ON admin_access;

CREATE POLICY "Service role can insert admin_access"
  ON admin_access FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update admin_access"
  ON admin_access FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can select admin_access"
  ON admin_access FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete admin_access"
  ON admin_access FOR DELETE
  TO service_role
  USING (true);
