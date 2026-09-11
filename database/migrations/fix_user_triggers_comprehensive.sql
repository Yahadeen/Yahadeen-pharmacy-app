-- Migration: Fix user triggers to handle all user types properly
-- This ensures that when a user is created in Supabase auth, their profile
-- is automatically created in the appropriate role-specific table

-- Step 1: Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_user_update();

-- Step 2: Ensure RLS policies allow service role operations
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Service role can update users" ON users;
DROP POLICY IF EXISTS "Service role can select users" ON users;

-- Create proper service role policies
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

-- Step 3: Create policies for role-specific profile tables
-- Admin profiles
DROP POLICY IF EXISTS "Service role can insert admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Service role can update admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Service role can select admin_profiles" ON admin_profiles;

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

-- Attendant profiles
DROP POLICY IF EXISTS "Service role can insert attendant_profiles" ON attendant_profiles;
DROP POLICY IF EXISTS "Service role can update attendant_profiles" ON attendant_profiles;
DROP POLICY IF EXISTS "Service role can select attendant_profiles" ON attendant_profiles;

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

-- Customer profiles
DROP POLICY IF EXISTS "Service role can insert customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can update customer_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can select customer_profiles" ON customer_profiles;

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

-- Step 4: Create improved trigger function that handles role assignment
-- Note: This only creates the base users entry. Role-specific profiles
-- should be created by the application after the user is created,
-- based on the invite code or signup flow.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into users table with default role as customer
    -- The application will update the role based on invite code
    INSERT INTO users (id, email, email_verified, is_active, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.email_confirmed_at IS NOT NULL,
        true,
        'customer' -- Default role, will be updated by app
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        email_verified = EXCLUDED.email_verified,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 5: Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 6: Create update trigger
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET
        email = NEW.email,
        email_verified = NEW.email_confirmed_at IS NOT NULL,
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
    EXECUTE FUNCTION handle_user_update();

-- Step 7: Create a function to handle role-specific profile creation
-- This will be called by the application after setting the user's role
CREATE OR REPLACE FUNCTION create_role_profile(user_id UUID, user_role user_role, full_name TEXT DEFAULT NULL, phone TEXT DEFAULT NULL, department TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- Create attendant profile
    IF user_role = 'attendant' THEN
        INSERT INTO attendant_profiles (user_id, employee_id, schedule)
        VALUES (
            user_id,
            'YD-' || COALESCE(full_name, 'user'),
            '{}'::jsonb
        )
        ON CONFLICT (user_id) DO NOTHING;
    
    -- Create admin profile
    ELSIF user_role = 'admin' OR user_role = 'super_admin' THEN
        INSERT INTO admin_profiles (user_id, department, permissions)
        VALUES (
            user_id,
            COALESCE(department, 'General'),
            CASE WHEN user_role = 'super_admin' THEN '{"all": true}'::jsonb ELSE '{}'::jsonb END
        )
        ON CONFLICT (user_id) DO NOTHING;
    
    -- Create customer profile
    ELSIF user_role = 'customer' THEN
        INSERT INTO customer_profiles (user_id)
        VALUES (user_id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 8: Create a trigger to automatically create role-specific profile when role is set
CREATE OR REPLACE FUNCTION handle_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if role has changed
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        PERFORM create_role_profile(NEW.id, NEW.role, NEW.full_name, NEW.phone, NEW.department);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Note: This trigger is optional - the application can call create_role_profile directly
-- Uncomment if you want automatic profile creation on role change
-- CREATE TRIGGER on_user_role_changed
--     AFTER UPDATE OF role ON users
--     FOR EACH ROW
--     WHEN (OLD.role IS DISTINCT FROM NEW.role)
--     EXECUTE FUNCTION handle_role_change();
