-- Fix RLS policies for customer signup flow
-- This ensures service role can insert into users, customer_profiles, and notifications tables

-- Step 1: Ensure service role exists and has proper permissions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role;
  END IF;
  
  -- Grant all necessary permissions
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
  GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;
  GRANT service_role TO postgres;
END $$;

-- Step 2: Enable RLS on all relevant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing policies on these tables to avoid conflicts
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Service role can update users" ON users;
DROP POLICY IF EXISTS "Service role can select users" ON users;
DROP POLICY IF EXISTS "Service role can delete users" ON users;
DROP POLICY IF EXISTS "Service role full access users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;
DROP POLICY IF EXISTS "Authenticated can insert users" ON users;
DROP POLICY IF EXISTS "Authenticated can update users" ON users;
DROP POLICY IF EXISTS "Authenticated can select users" ON users;

DROP POLICY IF EXISTS "Service role can insert customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can update customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can select customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can delete customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role full access customer_profiles" ON customer_profiles;

DROP POLICY IF EXISTS "Service role full access notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can update notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can select notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can delete notifications" ON notifications;

-- Step 4: Create comprehensive service role policies using FOR ALL
CREATE POLICY "Service role full access users"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access customer_profiles"
  ON customer_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access notifications"
  ON notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 5: Add policies for authenticated users (for normal app operations)
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Step 6: Verify service role membership
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles r JOIN pg_auth_members m ON r.oid = m.roleid WHERE r.rolname = 'service_role' AND m.member = (SELECT oid FROM pg_roles WHERE rolname = 'postgres')) THEN
    GRANT service_role TO postgres;
  END IF;
END $$;
