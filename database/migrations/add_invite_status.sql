-- Migration: Add status column to admin_invites table
-- This adds a status column to track invite usage (pending, used, expired)

-- Add status column with default 'pending'
ALTER TABLE admin_invites 
ADD COLUMN status VARCHAR(20) DEFAULT 'pending' 
CHECK (status IN ('pending', 'used', 'expired'));

-- Update existing invites to have 'pending' status
UPDATE admin_invites 
SET status = 'pending' 
WHERE status IS NULL;

-- Create index on status for faster queries
CREATE INDEX idx_invites_status ON admin_invites(status);

-- Function to update expired invites to 'expired' status
CREATE OR REPLACE FUNCTION update_expired_invites()
RETURNS VOID AS $$
BEGIN
    UPDATE admin_invites 
    SET status = 'expired' 
    WHERE expires_at < NOW() AND status = 'pending';
END;
$$ LANGUAGE plpgsql;
