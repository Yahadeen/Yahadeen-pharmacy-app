-- Add prescription_url column to orders table
-- This allows customers to attach prescription images for orders that require them
-- The column is nullable so it won't affect existing orders or functionality

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS prescription_url TEXT NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN public.orders.prescription_url IS 'URL to prescription image uploaded by customer for orders requiring prescription verification';
