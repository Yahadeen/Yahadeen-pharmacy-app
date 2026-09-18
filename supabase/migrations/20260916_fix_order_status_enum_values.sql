-- Fix order_status enum to use lowercase values to match the shared package
-- The shared package uses lowercase: 'paid', 'confirmed', 'preparing', etc.
-- This migration ensures the database enum matches

-- First, backup existing status values to a temporary column
DO $$
BEGIN
  -- Check if the temporary column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'status_backup'
  ) THEN
    -- Add a temporary column to backup status values
    ALTER TABLE orders ADD COLUMN status_backup TEXT;
    -- Copy current status values
    UPDATE orders SET status_backup = status::text;
  END IF;
END $$;

-- Drop the enum (this will cascade and drop the status column)
DROP TYPE IF EXISTS order_status CASCADE;

-- Recreate the enum with correct lowercase values
CREATE TYPE order_status AS ENUM (
  'pending_payment',
  'payment_failed',
  'paid',
  'confirmed',
  'preparing',
  'packed',
  'ready_for_pickup',
  'picked_up',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

-- Add the status column back with the correct enum type
ALTER TABLE orders ADD COLUMN status order_status NOT NULL DEFAULT 'pending_payment'::order_status;

-- Restore status values from backup, converting to lowercase
UPDATE orders SET status = 
  CASE 
    WHEN LOWER(status_backup) IN ('pending_payment', 'payment_failed', 'paid', 'confirmed', 'preparing', 'packed', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled') 
    THEN LOWER(status_backup)::order_status
    ELSE 'pending_payment'::order_status
  END;

-- Drop the temporary backup column
ALTER TABLE orders DROP COLUMN IF EXISTS status_backup;

-- Set the correct default
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending_payment'::order_status;
