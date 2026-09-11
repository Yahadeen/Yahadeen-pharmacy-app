-- Fix notification trigger to use PharmaGo instead of Yahadeen

-- Drop and recreate the trigger function with correct app name
DROP TRIGGER IF EXISTS trigger_new_user_signup ON public.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup();

-- Create function with correct app name
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the new user
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    NEW.id,
    'welcome',
    'Welcome to Yahadeen!',
    'Your account has been successfully created. Start exploring our pharmacy management system.',
    jsonb_build_object(
      'user_email', NEW.email,
      'user_role', NEW.role,
      'created_at', NEW.created_at
    )
  );

  -- Create notification for all admins about the new user signup
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  )
  SELECT 
    u.id,
    'new_user_signup',
    'New User Signup',
    'A new user has signed up: ' || NEW.email,
    jsonb_build_object(
      'new_user_id', NEW.id,
      'new_user_email', NEW.email,
      'new_user_role', NEW.role,
      'new_user_full_name', NEW.full_name,
      'created_at', NEW.created_at
    )
  FROM public.users u
  WHERE u.role IN ('admin', 'super_admin')
    AND u.is_active = TRUE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_new_user_signup
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_signup();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO authenticated;
