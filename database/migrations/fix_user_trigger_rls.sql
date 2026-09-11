-- Migration: Fix RLS for handle_new_user trigger
-- This adds a policy to allow the trigger function to insert users

-- Drop existing service role insert policy
DROP POLICY IF EXISTS "Service role can insert users" ON users;

-- Add policy that allows service role and trigger to insert users
CREATE POLICY "Service role can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Ensure the trigger function has proper security definer
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
