-- Temporarily disable RLS to test if service role works
-- This is for debugging purposes only

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendant_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
