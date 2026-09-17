-- Add address-related notification types to the enum if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'address_created' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'address_created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'address_updated' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'address_updated';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'default_address_changed' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'default_address_changed';
    END IF;
END $$;

-- Create function to automatically create notification when address is added
CREATE OR REPLACE FUNCTION create_address_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, priority, title, message, data)
  VALUES (
    NEW.user_id,
    'address_created'::notification_type,
    'low'::notification_priority,
    'Address Added',
    'New address added for ' || NEW.full_name || ' in ' || NEW.city || ', ' || NEW.state,
    jsonb_build_object(
      'address_id', NEW.id,
      'address', NEW.address_line1 || ', ' || NEW.city || ', ' || NEW.state
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for address creation
DROP TRIGGER IF EXISTS on_address_created ON addresses;
CREATE TRIGGER on_address_created
    AFTER INSERT ON addresses
    FOR EACH ROW
    EXECUTE FUNCTION create_address_notification();

-- Create function to create notification when address is updated
CREATE OR REPLACE FUNCTION create_address_update_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, priority, title, message, data)
  VALUES (
    NEW.user_id,
    'address_updated'::notification_type,
    'low'::notification_priority,
    'Address Updated',
    'Your address in ' || NEW.city || ', ' || NEW.state || ' has been updated',
    jsonb_build_object(
      'address_id', NEW.id,
      'address', NEW.address_line1 || ', ' || NEW.city || ', ' || NEW.state
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for address update
DROP TRIGGER IF EXISTS on_address_updated ON addresses;
CREATE TRIGGER on_address_updated
    AFTER UPDATE ON addresses
    FOR EACH ROW
    WHEN (OLD.address_line1 IS DISTINCT FROM NEW.address_line1 OR 
          OLD.city IS DISTINCT FROM NEW.city OR 
          OLD.state IS DISTINCT FROM NEW.state)
    EXECUTE FUNCTION create_address_update_notification();