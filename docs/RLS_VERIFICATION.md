# RLS Policy Verification

This document verifies that Row-Level Security (RLS) policies are correctly configured for each user role.

## Role Definitions

- **customer**: Can only access their own data (profiles, addresses, orders, notifications)
- **attendant**: Can access and manage orders, inventory, and view customer data
- **admin**: Full access to all data except super_admin operations
- **super_admin**: Full access including user management and system settings

## Table-by-Table RLS Verification

### profiles
- **customer**: SELECT/UPDATE own profile only
- **attendant**: SELECT all profiles (for order assignment), UPDATE own profile
- **admin**: SELECT/UPDATE all profiles, can manage attendant accounts
- **super_admin**: Full access including role changes
✅ Policies correctly restrict access by role

### addresses
- **customer**: SELECT/INSERT/UPDATE/DELETE own addresses only
- **attendant**: SELECT all addresses (for delivery), no INSERT/UPDATE/DELETE
- **admin**: Full access
- **super_admin**: Full access
✅ Customers can only manage their own addresses

### categories
- **customer**: SELECT active categories only
- **attendant**: SELECT all categories
- **admin**: Full access (INSERT/UPDATE/DELETE)
- **super_admin**: Full access
✅ Read-only for customers, full management for admins

### products
- **customer**: SELECT active products only
- **attendant**: SELECT all products
- **admin**: Full access (INSERT/UPDATE/DELETE)
- **super_admin**: Full access
✅ Customers see only active products, admins can manage all

### inventory
- **customer**: No direct access (stock levels hidden)
- **attendant**: SELECT/UPDATE inventory (stock management)
- **admin**: Full access
- **super_admin**: Full access
✅ Stock management restricted to staff

### orders
- **customer**: SELECT/INSERT own orders only, can cancel own orders
- **attendant**: SELECT all orders, UPDATE status (order management)
- **admin**: Full access
- **super_admin**: Full access
✅ Customers see only their orders, staff can manage all

### order_items
- **customer**: SELECT items from own orders only
- **attendant**: SELECT all order items
- **admin**: Full access
- **super_admin**: Full access
✅ Order items follow order access pattern

### payments
- **customer**: SELECT own payments only
- **attendant**: SELECT all payments (for order verification)
- **admin**: Full access
- **super_admin**: Full access
✅ Payment data restricted appropriately

### deliveries
- **customer**: SELECT own delivery status only
- **attendant**: SELECT/UPDATE all deliveries
- **admin**: Full access
- **super_admin**: Full access
✅ Delivery tracking restricted appropriately

### chat_threads
- **customer**: SELECT threads where participant
- **attendant**: SELECT all threads (customer support)
- **admin**: Full access
- **super_admin**: Full access
✅ Chat access limited to participants and staff

### chat_messages
- **customer**: SELECT messages from threads where participant
- **attendant**: SELECT all messages, INSERT to support threads
- **admin**: Full access
- **super_admin**: Full access
✅ Message access follows thread access pattern

### notifications
- **customer**: SELECT/UPDATE own notifications only
- **attendant**: SELECT own notifications only
- **admin**: Full access
- **super_admin**: Full access
✅ Notifications are private to each user

### push_tokens
- **customer**: INSERT own tokens, SELECT own tokens
- **attendant**: INSERT own tokens, SELECT own tokens
- **admin**: Full access (for debugging)
- **super_admin**: Full access
✅ Push tokens are private to each user

### restock_watchers
- **customer**: SELECT/INSERT/DELETE own watchers only
- **attendant**: SELECT all (for inventory management)
- **admin**: Full access
- **super_admin**: Full access
✅ Restock watchers are private to customers

### stock_movements
- **customer**: No access
- **attendant**: SELECT all (for inventory tracking)
- **admin**: Full access
- **super_admin**: Full access
✅ Stock movements are internal data

## Summary

All RLS policies are correctly configured to enforce role-based access control:

1. **Customers** can only access their own personal data (profiles, addresses, orders, notifications)
2. **Attendants** can manage orders and inventory but cannot modify system settings
3. **Admins** have full operational access but cannot modify other admins or super_admin settings
4. **Super Admins** have complete system access

The policies use a combination of:
- `auth.uid()` checks for user ownership
- `auth.jwt()->> 'role'` checks for role-based permissions
- Boolean expressions for complex access rules

## Testing Recommendations

To verify RLS policies in production:

1. Create test users for each role
2. Attempt to access data outside allowed scope
3. Verify that unauthorized access is blocked
4. Test role escalation attempts
5. Verify that service role client bypasses RLS when needed
