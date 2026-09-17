-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'attendant', 'customer');
CREATE TYPE order_status AS ENUM ('pending_payment', 'paid', 'confirmed', 'preparing', 'packed', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'payment_failed');
CREATE TYPE notification_type AS ENUM ('order_created', 'order_status_updated', 'order_cancelled', 'low_stock', 'inventory_adjusted', 'admin_invitation', 'password_reset', 'system_alert');
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Users table (syncs with Supabase auth.users)
-- This table stores additional user data and links to auth.users via id
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email)
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_auth_id ON users(id);

-- Function to sync auth.users to custom users table
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, email_verified, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.email_confirmed_at IS NOT NULL,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        email_verified = EXCLUDED.email_verified,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync new auth users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to handle auth user updates
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET
        email = NEW.email,
        email_verified = NEW.email_confirmed_at IS NOT NULL,
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync auth user updates
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
    EXECUTE FUNCTION handle_user_update();

-- Admin profiles
CREATE TABLE admin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100),
    permissions JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id)
);

-- Attendant profiles
CREATE TABLE attendant_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE,
    hire_date DATE,
    schedule JSONB DEFAULT '{}',
    is_on_duty BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id)
);

-- Customer profiles
CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    preferred_payment_method VARCHAR(50) DEFAULT 'card',
    payment_methods JSONB DEFAULT '[]',
    loyalty_points INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_spent_kobo BIGINT DEFAULT 0,
    UNIQUE(user_id)
);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand VARCHAR(255),
    description TEXT,
    image_url TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    price_kobo BIGINT NOT NULL,
    requires_prescription BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for products
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock_quantity);

-- Inventory adjustments
CREATE TABLE inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    adjusted_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Nigeria',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    attendant_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status order_status NOT NULL DEFAULT 'pending_payment',
    total_kobo BIGINT NOT NULL DEFAULT 0,
    subtotal_kobo BIGINT NOT NULL DEFAULT 0,
    tax_kobo BIGINT NOT NULL DEFAULT 0,
    delivery_fee_kobo BIGINT NOT NULL DEFAULT 0,
    discount_kobo BIGINT NOT NULL DEFAULT 0,
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for orders
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_code ON orders(code);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price_kobo BIGINT NOT NULL,
    total_kobo BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for order items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    amount_kobo BIGINT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for payments
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_reference ON payments(payment_reference);
CREATE INDEX idx_payments_status ON payments(status);

-- Admin invitations
CREATE TABLE admin_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'attendant',
    invited_by UUID REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for invites
CREATE INDEX idx_invites_code ON admin_invites(code);
CREATE INDEX idx_invites_email ON admin_invites(email);
CREATE INDEX idx_invites_expires ON admin_invites(expires_at);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for reset tokens
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    priority notification_priority DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Push notification tokens
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL, -- 'ios', 'android', 'web'
    device_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for push tokens
CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    order_updates BOOLEAN DEFAULT true,
    low_stock_alerts BOOLEAN DEFAULT true,
    admin_invitations BOOLEAN DEFAULT true,
    system_alerts BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for notification preferences
CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order code
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

-- Trigger to auto-generate order code
CREATE TRIGGER generate_order_code_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_code();

-- Function to check low stock and create notification
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    admin_ids UUID[];
BEGIN
    IF NEW.stock_quantity <= NEW.low_stock_threshold THEN
        -- Get all admin users
        SELECT ARRAY_AGG(id) INTO admin_ids
        FROM users
        WHERE role = 'admin' AND is_active = true;
        
        -- Create low stock notification for each admin
        IF admin_ids IS NOT NULL THEN
            FOR i IN 1..array_length(admin_ids, 1) LOOP
                INSERT INTO notifications (user_id, type, priority, title, message, data)
                VALUES (
                    admin_ids[i],
                    'low_stock',
                    'high',
                    'Low Stock Alert',
                    'Product "' || NEW.name || '" is running low on stock. Current: ' || NEW.stock_quantity || ', Threshold: ' || NEW.low_stock_threshold,
                    jsonb_build_object(
                        'product_id', NEW.id,
                        'product_name', NEW.name,
                        'current_stock', NEW.stock_quantity,
                        'threshold', NEW.low_stock_threshold
                    )
                );
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for low stock notification
CREATE TRIGGER low_stock_notification_trigger
    AFTER INSERT OR UPDATE OF stock_quantity ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock();

-- Function to notify on order creation
CREATE OR REPLACE FUNCTION notify_order_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify customer
    INSERT INTO notifications (user_id, type, priority, title, message, data)
    VALUES (
        NEW.customer_id,
        'order_created',
        'medium',
        'Order Created',
        'Your order ' || NEW.code || ' has been created successfully.',
        jsonb_build_object(
            'order_id', NEW.id,
            'order_code', NEW.code,
            'total_kobo', NEW.total_kobo
        )
    );
    
    -- Notify admins
    INSERT INTO notifications (user_id, type, priority, title, message, data)
    SELECT 
        u.id,
        'order_created',
        'medium',
        'New Order Received',
        'New order ' || NEW.code || ' received from customer.',
        jsonb_build_object(
            'order_id', NEW.id,
            'order_code', NEW.code,
            'customer_id', NEW.customer_id,
            'total_kobo', NEW.total_kobo
        )
    FROM users u
    WHERE u.role = 'admin' AND u.is_active = true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order creation notification
CREATE TRIGGER order_created_notification_trigger
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_created();

-- Function to notify on order status update
CREATE OR REPLACE FUNCTION notify_order_status_updated()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        -- Notify customer
        INSERT INTO notifications (user_id, type, priority, title, message, data)
        VALUES (
            NEW.customer_id,
            'order_status_updated',
            'medium',
            'Order Status Updated',
            'Your order ' || NEW.code || ' status has been updated to ' || NEW.status,
            jsonb_build_object(
                'order_id', NEW.id,
                'order_code', NEW.code,
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
        
        -- If order is cancelled, notify with higher priority
        IF NEW.status = 'cancelled' THEN
            INSERT INTO notifications (user_id, type, priority, title, message, data)
            VALUES (
                NEW.customer_id,
                'order_cancelled',
                'high',
                'Order Cancelled',
                'Your order ' || NEW.code || ' has been cancelled. Reason: ' || COALESCE(NEW.cancellation_reason, 'Not specified'),
                jsonb_build_object(
                    'order_id', NEW.id,
                    'order_code', NEW.code,
                    'cancellation_reason', NEW.cancellation_reason
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order status update notification
CREATE TRIGGER order_status_updated_notification_trigger
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_status_updated();

-- Function to notify on inventory adjustment
CREATE OR REPLACE FUNCTION notify_inventory_adjusted()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify admins about inventory adjustment
    INSERT INTO notifications (user_id, type, priority, title, message, data)
    SELECT 
        u.id,
        'inventory_adjusted',
        'medium',
        'Inventory Adjusted',
        'Inventory for product has been adjusted. Quantity: ' || NEW.quantity,
        jsonb_build_object(
            'product_id', NEW.product_id,
            'quantity', NEW.quantity,
            'reason', NEW.reason,
            'adjusted_by', NEW.adjusted_by
        )
    FROM users u
    WHERE u.role = 'admin' AND u.is_active = true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for inventory adjustment notification
CREATE TRIGGER inventory_adjusted_notification_trigger
    AFTER INSERT ON inventory_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION notify_inventory_adjusted();

-- Function to notify on admin invitation
CREATE OR REPLACE FUNCTION notify_admin_invitation()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for the invited user when they register
    -- This will be handled during registration
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Insert first admin invite code (expires in 30 days)
-- Use this code to register the first admin account: YAHADEEN-ADMIN-2024
INSERT INTO admin_invites (code, email, role, invited_by, expires_at)
VALUES (
    'YAHADEEN-2026',
    'techtune.it.solutions@gmail.com',
    'super_admin',
    NULL,
    NOW() + INTERVAL '30 days'
)
ON CONFLICT (code) DO NOTHING;

