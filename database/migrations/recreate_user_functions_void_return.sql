-- Drop existing functions first
DROP FUNCTION IF EXISTS create_user_with_bypass(uuid, character varying, character varying, character varying, public.user_role);
DROP FUNCTION IF EXISTS create_customer_profile_with_bypass(uuid, date, character varying, jsonb, integer, integer, bigint);
DROP FUNCTION IF EXISTS create_notification_with_bypass(uuid, character varying, character varying, character varying, text, jsonb);

-- Create a SECURITY DEFINER function to bypass RLS for user creation
-- This allows the backend API to create users without RLS blocking

CREATE OR REPLACE FUNCTION create_user_with_bypass(
  p_id uuid,
  p_email varchar(255),
  p_full_name varchar(255),
  p_phone varchar(20),
  p_role public.user_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO users (id, email, full_name, phone, role, is_active, email_verified)
  VALUES (p_id, p_email, p_full_name, p_phone, p_role, true, true)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    updated_at = now();
END;
$$;

-- Create a SECURITY DEFINER function to bypass RLS for customer profile creation
CREATE OR REPLACE FUNCTION create_customer_profile_with_bypass(
  p_user_id uuid,
  p_date_of_birth date,
  p_preferred_payment_method varchar(50),
  p_payment_methods jsonb,
  p_loyalty_points integer,
  p_total_orders integer,
  p_total_spent_kobo bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO customer_profiles (
    user_id, 
    date_of_birth, 
    preferred_payment_method, 
    payment_methods, 
    loyalty_points, 
    total_orders, 
    total_spent_kobo
  )
  VALUES (
    p_user_id, 
    p_date_of_birth, 
    p_preferred_payment_method, 
    p_payment_methods, 
    p_loyalty_points, 
    p_total_orders, 
    p_total_spent_kobo
  )
  ON CONFLICT (user_id) DO UPDATE SET
    date_of_birth = EXCLUDED.date_of_birth,
    preferred_payment_method = EXCLUDED.preferred_payment_method,
    payment_methods = EXCLUDED.payment_methods;
END;
$$;

-- Create a SECURITY DEFINER function to bypass RLS for notification creation
CREATE OR REPLACE FUNCTION create_notification_with_bypass(
  p_user_id uuid,
  p_type varchar(50),
  p_priority varchar(20),
  p_title varchar(255),
  p_message text,
  p_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, priority, title, message, data, is_read)
  VALUES (p_user_id, p_type, p_priority, p_title, p_message, p_data, false);
END;
$$;

-- Grant execute permissions to authenticated and service role
GRANT EXECUTE ON FUNCTION create_user_with_bypass TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION create_customer_profile_with_bypass TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION create_notification_with_bypass TO authenticated, service_role;
