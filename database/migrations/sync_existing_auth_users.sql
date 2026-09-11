-- Sync existing auth users to custom tables and re-enable trigger

-- First, manually sync the user that was just created
-- Replace with actual values from your signup
DO $$
DECLARE
    auth_user RECORD;
    invite RECORD;
BEGIN
    -- Get the auth user
    SELECT * INTO auth_user 
    FROM auth.users 
    WHERE email = 'techtune.it.solutions@gmail.com';
    
    IF auth_user IS NOT NULL THEN
        -- Check if user already exists in custom table
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth_user.id) THEN
            -- Insert into users table
            INSERT INTO users (id, email, email_verified, is_active, role)
            VALUES (
                auth_user.id,
                auth_user.email,
                auth_user.email_confirmed_at IS NOT NULL,
                true,
                'super_admin'
            );
            
            -- Get the invite details
            SELECT * INTO invite 
            FROM admin_invites 
            WHERE email = auth_user.email;
            
            -- Create admin profile
            INSERT INTO admin_profiles (user_id, department, permissions)
            VALUES (
                auth_user.id,
                'Executive',
                '{"all": true}'::jsonb
            );
            
            RAISE NOTICE 'Successfully synced user: %', auth_user.email;
        ELSE
            RAISE NOTICE 'User already exists in custom table: %', auth_user.email;
        END IF;
    ELSE
        RAISE NOTICE 'No auth user found with email: techtune.it.solutions@gmail.com';
    END IF;
END $$;

-- Re-enable the trigger for future signups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, email_verified, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.email_confirmed_at IS NOT NULL,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        email_verified = EXCLUDED.email_verified,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

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

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
    EXECUTE FUNCTION handle_user_update();
