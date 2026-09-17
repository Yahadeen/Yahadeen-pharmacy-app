-- Fix ambiguous column reference in order code generation function
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TRIGGER AS $$
DECLARE
    order_code VARCHAR(20);
    prefix VARCHAR(10) := 'YD';
BEGIN
    LOOP
        order_code := prefix || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        IF NOT EXISTS (SELECT 1 FROM orders WHERE orders.code = order_code) THEN
            NEW.code := order_code;
            RETURN NEW;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
