-- Add support ticket notification types to the notification_type enum
-- This allows the support system to create notifications

-- First, alter the enum to add the new types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'support_ticket';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'support_message';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'support_ticket_status';
