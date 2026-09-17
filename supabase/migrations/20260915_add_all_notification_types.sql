-- Add all notification types to the notification_type enum
-- This migration adds the types needed for the comprehensive notification system

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_created';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_status_updated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'payment_successful';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'support_ticket';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'support_message';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'support_ticket_status';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'low_stock';
