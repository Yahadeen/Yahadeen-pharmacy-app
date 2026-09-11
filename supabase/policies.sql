-- Yahadeen Row-Level Security Policies
-- These policies control access based on user roles

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = required_role AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is attendant or admin
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('attendant', 'admin', 'super_admin') AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users policies (read own, service role writes)
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
Using (id = auth.uid());

CREATE POLICY "Staff can view all users"
  ON users FOR SELECT
  USING (is_staff());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service role can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Admin profiles policies
CREATE POLICY "Users can view own admin profile"
  ON admin_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Staff can view all admin profiles"
  ON admin_profiles FOR SELECT
  USING (is_staff());

CREATE POLICY "Users can update own admin profile"
  ON admin_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can insert admin profiles"
  ON admin_profiles FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update admin profiles"
  ON admin_profiles FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Attendant profiles policies
CREATE POLICY "Users can view own attendant profile"
  ON attendant_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Staff can view all attendant profiles"
  ON attendant_profiles FOR SELECT
  USING (is_staff());

CREATE POLICY "Users can update own attendant profile"
  ON attendant_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can insert attendant profiles"
  ON attendant_profiles FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update attendant profiles"
  ON attendant_profiles FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Customer profiles policies
CREATE POLICY "Users can view own customer profile"
  ON customer_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Staff can view all customer profiles"
  ON customer_profiles FOR SELECT
  USING (is_staff());

CREATE POLICY "Users can update own customer profile"
  ON customer_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can update customer profiles"
  ON customer_profiles FOR UPDATE
  WITH CHECK (true);

-- Addresses policies
CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Staff can view all addresses"
  ON addresses FOR SELECT
  USING (is_staff());

CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  USING (user_id = auth.uid());

-- Categories policies (public read, admin write)
CREATE POLICY "Everyone can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Staff can view all categories"
  ON categories FOR SELECT
  USING (is_staff());

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  USING (is_admin());

-- Products policies (public read active, admin write)
CREATE POLICY "Everyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Staff can view all products"
  ON products FOR SELECT
  USING (is_staff());

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  USING (is_admin());

-- Inventory adjustments policies (staff read, admin write)
CREATE POLICY "Staff can view inventory adjustments"
  ON inventory_adjustments FOR SELECT
  USING (is_staff());

CREATE POLICY "Admins can insert inventory adjustments"
  ON inventory_adjustments FOR INSERT
  WITH CHECK (is_admin());

-- Orders policies
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Attendants can view assigned orders"
  ON orders FOR SELECT
  USING (attendant_id = auth.uid() OR has_role('attendant') OR is_admin());

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (is_admin());

CREATE POLICY "Customers can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Attendants can update order status"
  ON orders FOR UPDATE
  USING (has_role('attendant') OR is_admin())
  WITH CHECK (has_role('attendant') OR is_admin());

CREATE POLICY "Customers can cancel own orders"
  ON orders FOR UPDATE
  USING (customer_id = auth.uid() AND status IN ('pending_payment', 'paid', 'confirmed'))
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Admins can update any order"
  ON orders FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Order items policies
CREATE POLICY "Customers can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all order items"
  ON order_items FOR SELECT
  USING (is_staff());

CREATE POLICY "Customers can insert own order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (is_admin());

-- Payments policies
CREATE POLICY "Customers can view own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all payments"
  ON payments FOR SELECT
  USING (is_staff());

CREATE POLICY "Service role can insert payments"
  ON payments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update payments"
  ON payments FOR UPDATE
  USING (true);

-- Admin invites policies
CREATE POLICY "Staff can view admin invites"
  ON admin_invites FOR SELECT
  USING (is_staff());

CREATE POLICY "Admins can insert admin invites"
  ON admin_invites FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Service role can update admin invites"
  ON admin_invites FOR UPDATE
  WITH CHECK (true);

-- Password reset tokens policies
CREATE POLICY "Users can view own reset tokens"
  ON password_reset_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert reset tokens"
  ON password_reset_tokens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update reset tokens"
  ON password_reset_tokens FOR UPDATE
  WITH CHECK (true);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Notification preferences policies
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can insert notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (true);

-- Push tokens policies
CREATE POLICY "Users can view own push tokens"
  ON push_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own push tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own push tokens"
  ON push_tokens FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own push tokens"
  ON push_tokens FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Service role can update push tokens"
  ON push_tokens FOR UPDATE
  WITH CHECK (true);
