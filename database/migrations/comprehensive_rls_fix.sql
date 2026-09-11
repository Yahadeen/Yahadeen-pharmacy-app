-- Comprehensive RLS and permission fix for user registration
-- This ensures service role can create/update all user-related tables

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

-- Step 2: Add missing notification types
DO $$
BEGIN
  -- Add 'welcome' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'welcome' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE 'welcome';
  END IF;
  
  -- Add 'new_user_signup' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'new_user_signup' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE 'new_user_signup';
  END IF;
END $$;

-- Step 3: Enable RLS on all user-related tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop ALL existing policies to avoid conflicts
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

DROP POLICY IF EXISTS "Service role can insert admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Service role can update admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Service role can select admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Service role can delete admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Service role full access admin_profiles" ON admin_profiles;

DROP POLICY IF EXISTS "Service role can insert attendant_profiles" ON attendant_profiles;
DROP POLICY IF EXISTS "Service role can update attendant_profiles" ON attendant_profiles;
DROP POLICY IF EXISTS "Service role can select attendant_profiles" ON attendant_profiles;
DROP POLICY IF EXISTS "Service role can delete attendant_profiles" ON attendant_profiles;
DROP POLICY IF EXISTS "Service role full access attendant_profiles" ON attendant_profiles;

DROP POLICY IF EXISTS "Service role can insert customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can update customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can select customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can delete customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role full access customer_profiles" ON customer_profiles;

DROP POLICY IF EXISTS "Service role can insert admin_access" ON admin_access;
DROP POLICY IF EXISTS "Service role can update admin_access" ON admin_access;
DROP POLICY IF EXISTS "Service role can select admin_access" ON admin_access;
DROP POLICY IF EXISTS "Service role can delete admin_access" ON admin_access;
DROP POLICY IF EXISTS "Service role full access admin_access" ON admin_access;

DROP POLICY IF EXISTS "Service role full access notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Step 5: Create comprehensive service role policies using FOR ALL
CREATE POLICY "Service role full access users"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access admin_profiles"
  ON admin_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access attendant_profiles"
  ON attendant_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access customer_profiles"
  ON customer_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access admin_access"
  ON admin_access FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access notifications"
  ON notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 6: Add policies for authenticated users (for normal app operations)
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

-- Step 7: Grant anon role basic select permissions for public data (if needed)
CREATE POLICY "Anon can select users"
  ON users FOR SELECT
  TO anon
  USING (false); -- No public access by default

-- Step 8: Verify service role membership
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles r JOIN pg_auth_members m ON r.oid = m.roleid WHERE r.rolname = 'service_role' AND m.member = (SELECT oid FROM pg_roles WHERE rolname = 'postgres')) THEN
    GRANT service_role TO postgres;
  END IF;
END $$;
