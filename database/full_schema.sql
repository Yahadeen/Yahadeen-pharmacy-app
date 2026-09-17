-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id uuid NOT NULL,
  email character varying NOT NULL UNIQUE,
  full_name character varying,
  phone character varying,
  role USER-DEFINED NOT NULL DEFAULT 'customer'::user_role,
  is_active boolean DEFAULT true,
  email_verified boolean DEFAULT true,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.admin_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE,
  department character varying,
  permissions jsonb DEFAULT '{}'::jsonb,
  last_login_at timestamp with time zone,
  CONSTRAINT admin_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT admin_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.attendant_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE,
  employee_id character varying UNIQUE,
  hire_date date,
  schedule jsonb DEFAULT '{}'::jsonb,
  is_on_duty boolean DEFAULT false,
  last_login_at timestamp with time zone,
  CONSTRAINT attendant_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT attendant_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.customer_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE,
  date_of_birth date,
  preferred_payment_method character varying DEFAULT 'card'::character varying,
  payment_methods jsonb DEFAULT '[]'::jsonb,
  loyalty_points integer DEFAULT 0,
  total_orders integer DEFAULT 0,
  total_spent_kobo bigint DEFAULT 0,
  CONSTRAINT customer_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT customer_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  description text,
  parent_id uuid,
  image_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  generic_name character varying,
  brand character varying,
  description text,
  image_url text,
  category_id uuid,
  price_kobo bigint NOT NULL,
  requires_prescription boolean DEFAULT false,
  is_active boolean DEFAULT true,
  stock_quantity integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.inventory_adjustments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid,
  quantity integer NOT NULL,
  previous_quantity integer NOT NULL,
  reason text NOT NULL,
  adjusted_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_adjustments_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_adjustments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT inventory_adjustments_adjusted_by_fkey FOREIGN KEY (adjusted_by) REFERENCES public.users(id)
);
CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  full_name character varying NOT NULL,
  phone character varying,
  address_line1 character varying NOT NULL,
  address_line2 character varying,
  city character varying NOT NULL,
  state character varying NOT NULL,
  postal_code character varying,
  country character varying DEFAULT 'Nigeria'::character varying,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code character varying NOT NULL UNIQUE,
  customer_id uuid,
  address_id uuid,
  attendant_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'pending_payment'::order_status,
  total_kobo bigint NOT NULL DEFAULT 0,
  subtotal_kobo bigint NOT NULL DEFAULT 0,
  tax_kobo bigint NOT NULL DEFAULT 0,
  delivery_fee_kobo bigint NOT NULL DEFAULT 0,
  discount_kobo bigint NOT NULL DEFAULT 0,
  notes text,
  cancellation_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id),
  CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id),
  CONSTRAINT orders_attendant_id_fkey FOREIGN KEY (attendant_id) REFERENCES public.users(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  product_id uuid,
  quantity integer NOT NULL,
  unit_price_kobo bigint NOT NULL,
  total_kobo bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  amount_kobo bigint NOT NULL,
  payment_method character varying NOT NULL,
  payment_reference character varying UNIQUE,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.admin_invites (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code character varying NOT NULL UNIQUE,
  email character varying NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'attendant'::user_role,
  invited_by uuid,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  is_used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'used'::character varying, 'expired'::character varying]::text[])),
  department character varying,
  access jsonb,
  created_by uuid,
  CONSTRAINT admin_invites_pkey PRIMARY KEY (id),
  CONSTRAINT admin_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id),
  CONSTRAINT admin_invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.password_reset_tokens (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  token character varying NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  is_used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  type USER-DEFINED NOT NULL,
  priority USER-DEFINED DEFAULT 'medium'::notification_priority,
  title character varying NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.push_tokens (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  token text NOT NULL,
  platform character varying NOT NULL,
  device_info jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT push_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  order_updates boolean DEFAULT true,
  low_stock_alerts boolean DEFAULT true,
  admin_invitations boolean DEFAULT true,
  system_alerts boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.delivery_fees (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  description text,
  base_fee_naira integer NOT NULL DEFAULT 0,
  fee_per_km_naira integer NOT NULL DEFAULT 0,
  free_delivery_threshold_naira integer NOT NULL DEFAULT 0,
  city character varying,
  state character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT delivery_fees_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_access (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  admin_id uuid NOT NULL,
  feature character varying NOT NULL,
  can_view boolean DEFAULT true,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_access_pkey PRIMARY KEY (id),
  CONSTRAINT admin_access_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id)
);
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ticket_number character varying NOT NULL UNIQUE,
  order_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  attendant_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'open'::support_ticket_status,
  priority USER-DEFINED NOT NULL DEFAULT 'medium'::support_ticket_priority,
  subject character varying NOT NULL,
  category USER-DEFINED NOT NULL DEFAULT 'order_issue'::support_ticket_category,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid,
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT support_tickets_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id),
  CONSTRAINT support_tickets_attendant_id_fkey FOREIGN KEY (attendant_id) REFERENCES public.users(id),
  CONSTRAINT support_tickets_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id)
);
CREATE TABLE public.support_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ticket_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  sender_role USER-DEFINED NOT NULL,
  message text NOT NULL,
  attachment_url text,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT support_messages_pkey PRIMARY KEY (id),
  CONSTRAINT support_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id),
  CONSTRAINT support_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id)
);