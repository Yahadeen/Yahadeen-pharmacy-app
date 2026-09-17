/**
 * Row and payload shapes shared by the two Expo apps and the Next dashboard.
 *
 * Field names are `snake_case` because they mirror the Postgres columns and the
 * Supabase client returns rows verbatim. Anything computed by the API layer
 * rather than stored is marked as such.
 */

import type {
  DeliveryStatus,
  OrderStatus,
  PaymentStatus,
  UserRole,
} from './enums';

/* --------------------------------------------------------------- identity -- */

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  preferred_payment_method: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/** Frozen copy of the address written onto the order at checkout. */
export type AddressSnapshot = Omit<Address, 'user_id' | 'is_default' | 'created_at'>;

/* -------------------------------------------------------------- catalogue -- */

export interface Category {
  id: string;
  name: string;
  slug: string;
  /** Feather icon name, rendered by both mobile apps. */
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  generic_name: string | null;
  brand: string | null;
  description: string | null;
  /** e.g. "500mg × 10 tablets" */
  pack_size: string | null;
  image_url: string | null;
  price_kobo: number;
  requires_prescription: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  product_id: string;
  quantity: number;
  low_stock_threshold: number;
  updated_by: string | null;
  updated_at: string;
}

/**
 * What list and detail endpoints actually return: the product joined with its
 * live stock row and category name. Screens should depend on this, not `Product`.
 */
export interface ProductWithStock extends Product {
  quantity: number;
  low_stock_threshold: number;
  category_name: string | null;
}

export interface StockMovement {
  id: string;
  product_id: string;
  /** Signed: `-3` sold, `+50` restocked. */
  delta: number;
  quantity_after: number;
  reason: 'sale' | 'restock' | 'correction' | 'expiry' | 'return';
  note: string | null;
  actor_id: string | null;
  created_at: string;
}

/* ----------------------------------------------------------------- orders -- */

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  unit_price_kobo: number;
  quantity: number;
  total_kobo: number;
  created_at: string;
  product?: {
    id: string;
    name: string;
    image_url: string | null;
  };
  // These fields are expected by the attendant app for snapshots
  name_snapshot?: string;
  pack_size_snapshot?: string | null;
  image_url_snapshot?: string | null;
}

export interface Order {
  id: string;
  /** Human-friendly reference shown to customers and riders, e.g. `PG-4F2A19`. */
  code: string;
  customer_id: string;
  status: OrderStatus;
  subtotal_kobo: number;
  delivery_fee_kobo: number;
  total_kobo: number;
  address_id: string | null;
  /** Free-text note from the customer, e.g. "call before you arrive". */
  note: string | null;
  prescription_url: string | null;
  attendant_id: string | null;
  created_at: string;
  paid_at: string | null;
  confirmed_at: string | null;
  packed_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
}

/** Order joined with everything a detail screen needs in one round trip. */
export interface OrderDetail extends Order {
  items: OrderItem[];
  payment: Payment | null;
  delivery: Delivery | null;
  customer: Pick<Profile, 'id' | 'full_name' | 'phone' | 'avatar_url'> | null;
  address: Address | null;
  address_snapshot?: AddressSnapshot;
  unread_messages: number;
}

/** Row shape for order lists — cheap to fetch, enough to render a card. */
export interface OrderSummary
  extends Pick<
    Order,
    'id' | 'code' | 'status' | 'total_kobo' | 'created_at' | 'customer_id'
  > {
  item_count: number;
  /** First two item names, for the card subtitle. */
  preview: string;
  customer_name: string | null;
}

/* ------------------------------------------------- payment & fulfilment -- */

export interface Payment {
  id: string;
  order_id: string;
  provider: 'paystack' | 'flutterwave' | 'manual';
  provider_ref: string | null;
  status: PaymentStatus;
  amount_kobo: number;
  channel: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  provider: string | null;
  tracking_ref: string | null;
  status: DeliveryStatus;
  rider_name: string | null;
  rider_phone: string | null;
  distance_km: number | null;
  eta: string | null;
  updated_at: string;
}

/* ------------------------------------------------- chat & notifications -- */

export interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: UserRole;
  body: string;
  attachment_url: string | null;
  created_at: string;
  read_at: string | null;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  /** Deep-link payload, e.g. `{ kind: 'order', id: '…' }`. */
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

/* ------------------------------------------------------------ API payloads -- */

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ProductQuery {
  q?: string;
  category?: string;
  in_stock_only?: boolean;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'name';
  page?: number;
  page_size?: number;
}

/** What the client posts to `/api/orders`. Prices are re-derived server-side. */
export interface CreateOrderPayload {
  address_id: string;
  items: { product_id: string; quantity: number }[];
  note?: string;
  prescription_url?: string;
}

export interface DeliveryQuote {
  distance_km: number;
  fee_kobo: number;
  /** Set when the fee was waived, e.g. "Free over ₦20,000". */
  free_reason: string | null;
  eta_minutes: number | null;
}

export interface DashboardStats {
  revenue_kobo: number;
  revenue_kobo_prev: number;
  orders_total: number;
  orders_pending: number;
  orders_completed: number;
  customers_total: number;
  low_stock_count: number;
  out_of_stock_count: number;
  /** Last 14 days, oldest first. */
  revenue_series: { date: string; kobo: number }[];
  best_sellers: { product_id: string; name: string; qty: number; revenue_kobo: number }[];
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}
