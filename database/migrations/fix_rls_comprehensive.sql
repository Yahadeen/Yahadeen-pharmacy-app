-- Comprehensive RLS fix for user profile creation
-- This ensures the service role can manage all user-related tables

-- First, let's check and fix the service role setup
-- Grant service role proper permissions
DO $$
BEGIN
  -- Ensure service role exists and has proper grants
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role;
  END IF;
  
  -- Grant necessary permissions
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
  GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;
END $$;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_access ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Service role can update users" ON users;
DROP POLICY IF EXISTS "Service role can select users" ON users;
DROP POLICY IF EXISTS "Service role can delete users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;

-- Drop all policies on admin_profiles
DROP POLICY IF EXISTS "Service role can insert admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Service role can update admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Service role can select admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Service role can delete admin_profiles" ON admin_profiles;

-- Drop all policies on attendant_profiles
DROP POLICY IF EXISTS "Service role can insert attendant_profiles" ON attendant_profiles;
DROP POLICY IF EXISTS "Service role can update attendant_profiles" ON attendant_profiles;
DROP POLICY IF EXISTS "Service role can select attendant_profiles" ON attendant_profiles;
DROP POLICY IF EXISTS "Service role can delete attendant_profiles" ON attendant_profiles;

-- Drop all policies on customer_profiles
DROP POLICY IF EXISTS "Service role can insert customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can update customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can select customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can delete customer_profiles" ON customer_profiles;

-- Drop all policies on admin_access
DROP POLICY IF EXISTS "Service role can insert admin_access" ON admin_access;
DROP POLICY IF EXISTS "Service role can update admin_access" ON admin_access;
DROP POLICY IF EXISTS "Service role can select admin_access" ON admin_access;
DROP POLICY IF EXISTS "Service role can delete admin_access" ON admin_access;

-- Create comprehensive service role policies for users
CREATE POLICY "Service role full access users"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create comprehensive service role policies for admin_profiles
CREATE POLICY "Service role full access admin_profiles"
  ON admin_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create comprehensive service role policies for attendant_profiles
CREATE POLICY "Service role full access attendant_profiles"
  ON attendant_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create comprehensive service role policies for customer_profiles
CREATE POLICY "Service role full access customer_profiles"
  ON customer_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create comprehensive service role policies for admin_access
CREATE POLICY "Service role full access admin_access"
  ON admin_access FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also add policies for authenticated role (for normal operations)
CREATE POLICY "Authenticated can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can select users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Grant service role to postgres (superuser) to ensure it works
GRANT service_role TO postgres;
