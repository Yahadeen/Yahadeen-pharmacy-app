-- Comprehensive Notification System for Yahadeen Pharmacy
-- This migration sets up triggers to notify all relevant roles about order, payment, and support events
-- IMPORTANT: Run 20260915_add_all_notification_types.sql FIRST to add the required enum values

-- Enable the notifications publication for realtime
alter publication supabase_realtime add table notifications;

-- Create function to send notification
create or replace function send_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_data jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_notification_id uuid;
begin
  insert into notifications (user_id, title, message, type, data)
  values (p_user_id, p_title, p_message, p_type::notification_type, p_data)
  returning id into v_notification_id;
  
  return v_notification_id;
end;
$$;

-- Create function to notify multiple users
create or replace function send_notification_to_roles(
  p_title text,
  p_message text,
  p_type text,
  p_data jsonb default '{}'::jsonb,
  p_roles text[] default array['admin', 'super_admin']
)
returns void
language plpgsql
as $$
begin
  insert into notifications (user_id, title, message, type, data)
  select id, p_title, p_message, p_type::notification_type, p_data
  from users
  where role::text = any(p_roles)
  and is_active = true;
end;
$$;

-- Order Created Notification
create or replace function notify_order_created()
returns trigger
language plpgsql
as $$
declare
  v_order_code text;
  v_customer_name text;
begin
  v_order_code := new.code;
  v_customer_name := (select full_name from users where id = new.customer_id);
  
  -- Notify admins about new order
  perform send_notification_to_roles(
    'New Order Created',
    'Order ' || v_order_code || ' has been created by ' || v_customer_name,
    'order_created'::notification_type,
    jsonb_build_object(
      'order_id', new.id,
      'order_code', v_order_code,
      'customer_id', new.customer_id,
      'customer_name', v_customer_name,
      'total_kobo', new.total_kobo
    ),
    array['admin', 'super_admin']
  );
  
  return new;
end;
$$;

create trigger on_order_created
after insert on orders
for each row
execute function notify_order_created();

-- Order Status Updated Notification
create or replace function notify_order_status_updated()
returns trigger
language plpgsql
as $$
declare
  v_order_code text;
  v_customer_id uuid;
  v_status_label text;
begin
  v_order_code := new.code;
  v_customer_id := new.customer_id;
  
  -- Determine status label
  v_status_label := case new.status
    when 'paid' then 'Paid'
    when 'confirmed' then 'Confirmed'
    when 'preparing' then 'Preparing'
    when 'packed' then 'Packed'
    when 'ready_for_pickup' then 'Ready for Pickup'
    when 'picked_up' then 'Picked Up'
    when 'out_for_delivery' then 'Out for Delivery'
    when 'delivered' then 'Delivered'
    when 'cancelled' then 'Cancelled'
    else new.status
  end;
  
  -- Notify customer about status change
  perform send_notification(
    v_customer_id,
    'Order Status Updated',
    'Your order ' || v_order_code || ' is now ' || v_status_label,
    'order_status_updated'::notification_type,
    jsonb_build_object(
      'order_id', new.id,
      'order_code', v_order_code,
      'status', new.status,
      'status_label', v_status_label
    )
  );
  
  -- Notify attendants and admins about order progression
  if new.status in ('paid', 'confirmed', 'preparing', 'packed', 'ready_for_pickup') then
    perform send_notification_to_roles(
      'Order ' || v_order_code || ' - ' || v_status_label,
      'Order ' || v_order_code || ' status changed to ' || v_status_label,
      'order_status_updated'::notification_type,
      jsonb_build_object(
        'order_id', new.id,
        'order_code', v_order_code,
        'status', new.status,
        'status_label', v_status_label
      ),
      array['attendant', 'admin', 'super_admin']
    );
  end if;
  
  return new;
end;
$$;

create trigger on_order_status_updated
after update of status on orders
for each row
execute function notify_order_status_updated();

-- Payment Successful Notification
create or replace function notify_payment_successful()
returns trigger
language plpgsql
as $$
declare
  v_order_code text;
  v_customer_id uuid;
  v_amount_kobo bigint;
begin
  select code, customer_id, total_kobo
  into v_order_code, v_customer_id, v_amount_kobo
  from orders
  where id = new.order_id;
  
  -- Notify customer about successful payment
  perform send_notification(
    v_customer_id,
    'Payment Successful',
    'Payment of ₦' || (v_amount_kobo / 100.0) || ' for order ' || v_order_code || ' was successful',
    'payment_successful'::notification_type,
    jsonb_build_object(
      'order_id', new.order_id,
      'order_code', v_order_code,
      'amount_kobo', v_amount_kobo,
      'payment_reference', new.payment_reference
    )
  );
  
  -- Notify attendants and admins about new paid order
  perform send_notification_to_roles(
    'New Order Paid - ' || v_order_code,
    'Order ' || v_order_code || ' has been paid and is ready for processing',
    'payment_successful'::notification_type,
    jsonb_build_object(
      'order_id', new.order_id,
      'order_code', v_order_code,
      'amount_kobo', v_amount_kobo
    ),
    array['attendant', 'admin', 'super_admin']
  );
  
  return new;
end;
$$;

create trigger on_payment_successful
after insert on payments
for each row
when (new.status = 'success')
execute function notify_payment_successful();

-- Support Ticket Created Notification
create or replace function notify_support_ticket_created()
returns trigger
language plpgsql
as $$
declare
  v_order_code text;
  v_customer_name text;
begin
  select code into v_order_code
  from orders
  where id = new.order_id;
  
  select full_name into v_customer_name
  from users
  where id = new.customer_id;
  
  -- Notify attendants and admins about new support ticket
  perform send_notification_to_roles(
    'New Support Ticket - ' || new.subject,
    'Customer ' || v_customer_name || ' created a support ticket for order ' || v_order_code,
    'support_ticket_created'::notification_type,
    jsonb_build_object(
      'ticket_id', new.id,
      'ticket_number', new.ticket_number,
      'order_id', new.order_id,
      'order_code', v_order_code,
      'customer_id', new.customer_id,
      'customer_name', v_customer_name,
      'subject', new.subject,
      'priority', new.priority
    ),
    array['attendant', 'admin', 'super_admin']
  );
  
  return new;
end;
$$;

create trigger on_support_ticket_created
after insert on support_tickets
for each row
execute function notify_support_ticket_created();

-- Support Message Created Notification
create or replace function notify_support_message_created()
returns trigger
language plpgsql
as $$
declare
  v_ticket_number text;
  v_customer_id uuid;
  v_sender_role text;
  v_sender_name text;
  v_attendant_id uuid;
begin
  select ticket_number, customer_id, attendant_id
  into v_ticket_number, v_customer_id, v_attendant_id
  from support_tickets
  where id = new.ticket_id;
  
  v_sender_role := new.sender_role;
  
  select full_name into v_sender_name
  from users
  where id = new.sender_id;
  
  -- If customer sent message, notify attendant and admins
  if v_sender_role = 'customer' then
    perform send_notification_to_roles(
      'New Support Message - ' || v_ticket_number,
      'Customer sent a message in support ticket ' || v_ticket_number,
      'support_message_created'::notification_type,
      jsonb_build_object(
        'ticket_id', new.ticket_id,
        'ticket_number', v_ticket_number,
        'message_id', new.id,
        'sender_role', v_sender_role,
        'sender_name', v_sender_name
      ),
      array['attendant', 'admin', 'super_admin']
    );
  -- If attendant/admin sent message, notify customer
  elsif v_sender_role in ('attendant', 'admin') then
    perform send_notification(
      v_customer_id,
      'Support Response - ' || v_ticket_number,
      v_sender_name || ' responded to your support ticket',
      'support_message_created'::notification_type,
      jsonb_build_object(
        'ticket_id', new.ticket_id,
        'ticket_number', v_ticket_number,
        'message_id', new.id,
        'sender_role', v_sender_role,
        'sender_name', v_sender_name
      )
    );
  end if;
  
  return new;
end;
$$;

create trigger on_support_message_created
after insert on support_messages
for each row
execute function notify_support_message_created();

-- Support Ticket Status Updated Notification
create or replace function notify_support_ticket_status_updated()
returns trigger
language plpgsql
as $$
declare
  v_ticket_number text;
  v_customer_id uuid;
  v_status_label text;
begin
  v_ticket_number := new.ticket_number;
  v_customer_id := old.customer_id;
  
  v_status_label := case new.status
    when 'open' then 'Open'
    when 'in_progress' then 'In Progress'
    when 'resolved' then 'Resolved'
    when 'closed' then 'Closed'
    else new.status
  end;
  
  -- Notify customer about status change
  perform send_notification(
    v_customer_id,
    'Support Ticket Updated',
    'Your support ticket ' || v_ticket_number || ' is now ' || v_status_label,
    'support_ticket_status_updated'::notification_type,
    jsonb_build_object(
      'ticket_id', new.id,
      'ticket_number', v_ticket_number,
      'status', new.status,
      'status_label', v_status_label
    )
  );
  
  return new;
end;
$$;

create trigger on_support_ticket_status_updated
after update of status on support_tickets
for each row
execute function notify_support_ticket_status_updated();

-- Low Stock Alert Notification
create or replace function notify_low_stock()
returns trigger
language plpgsql
as $$
declare
  v_product_name text;
  v_current_stock int;
  v_threshold int;
begin
  v_product_name := new.name;
  v_current_stock := new.stock_quantity;
  v_threshold := 10; -- Alert when stock is below 10
  
  if v_current_stock <= v_threshold then
    perform send_notification_to_roles(
      'Low Stock Alert - ' || v_product_name,
      'Product ' || v_product_name || ' is running low. Current stock: ' || v_current_stock,
      'low_stock'::notification_type,
      jsonb_build_object(
        'product_id', new.id,
        'product_name', v_product_name,
        'current_stock', v_current_stock,
        'threshold', v_threshold
      ),
      array['attendant', 'admin', 'super_admin']
    );
  end if;
  
  return new;
end;
$$;

create trigger on_low_stock
after update of stock_quantity on products
for each row
execute function notify_low_stock();

-- Comment: This comprehensive notification system ensures:
-- 1. Customers are notified about their order status changes, payments, and support ticket updates
-- 2. Attendants are notified about new paid orders, order status changes, support tickets, and low stock
-- 3. Admins are notified about all important events across the system
-- 4. All notifications include detailed data in the JSONB data field for frontend handling
-- 5. Notifications are published via Supabase Realtime for instant delivery to connected clients
