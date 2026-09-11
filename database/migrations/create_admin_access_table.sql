-- Create admin access control table for managing feature permissions
CREATE TABLE IF NOT EXISTS public.admin_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature VARCHAR(50) NOT NULL, -- e.g., 'products', 'inventory', 'orders', 'payments', 'delivery_fees'
  can_view BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(admin_id, feature)
);

-- Create indexes for admin access
CREATE INDEX IF NOT EXISTS idx_admin_access_admin_id ON public.admin_access(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_feature ON public.admin_access(feature);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_access TO authenticated;

-- Enable RLS
ALTER TABLE public.admin_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Super admins can do anything
CREATE POLICY "Super admins have full access to admin_access"
  ON public.admin_access
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Admins can view their own access
CREATE POLICY "Admins can view their own access"
  ON public.admin_access
  FOR SELECT
  TO authenticated
  USING (admin_id = auth.uid());

-- Admins can view access of other admins (for transparency)
CREATE POLICY "Admins can view all admin access"
  ON public.admin_access
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Insert default access for all existing admins (if any)
-- This is a placeholder - actual migration should handle existing data
