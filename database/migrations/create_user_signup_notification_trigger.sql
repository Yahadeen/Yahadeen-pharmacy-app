-- Create notification trigger for new user signups
-- This trigger creates a notification entry when a new user is created

-- First, ensure the notifications table exists
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Create function to handle new user signup notifications
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
    'Welcome to PharmaGo!',
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

-- Create trigger that fires after a new user is inserted
DROP TRIGGER IF EXISTS trigger_new_user_signup ON public.users;
CREATE TRIGGER trigger_new_user_signup
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_signup();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO authenticated;
