-- Add department and access columns to admin_invites table
ALTER TABLE public.admin_invites 
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS access JSONB,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Update existing records to have default status
UPDATE public.admin_invites 
SET status = 'pending' 
WHERE status IS NULL;

-- Grant permissions on new columns
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.admin_invites TO authenticated;
