-- Enable realtime publication for support tables
-- This allows the mobile apps and admin to receive real-time updates

-- Add support tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
