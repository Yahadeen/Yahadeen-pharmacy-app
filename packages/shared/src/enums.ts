/**
 * Cross-app enums and their display metadata.
 *
 * These strings are persisted in Postgres, so treat them as part of the schema:
 * add new members, never rename existing ones without a migration.
 */

/* ------------------------------------------------------------------ roles -- */

export const USER_ROLES = ['customer', 'attendant', 'admin', 'super_admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Roles allowed to sign into the attendant app. */
export const STAFF_ROLES: readonly UserRole[] = ['attendant', 'admin', 'super_admin'];
/** Roles allowed to sign into the admin dashboard. */
export const ADMIN_ROLES: readonly UserRole[] = ['admin', 'super_admin'];

/* ----------------------------------------------------------- order status -- */

export const ORDER_STATUSES = [
  'pending_payment',
  'payment_failed',
  'paid',
  'confirmed',
  'preparing',
  'packed',
  'ready_for_pickup',
  'picked_up',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Legal transitions. The server is the only place this is enforced — clients use
 * it to decide which action buttons to show.
 */
export const ORDER_STATUS_FLOW: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ['paid', 'payment_failed', 'cancelled'],
  payment_failed: ['pending_payment', 'cancelled'],
  paid: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['packed', 'cancelled'],
  packed: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['picked_up', 'cancelled'],
  picked_up: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_FLOW[from].includes(to);
}

/** Statuses that still need someone to act. Drives the attendant queue and admin tiles. */
export const OPEN_ORDER_STATUSES: readonly OrderStatus[] = [
  'paid',
  'confirmed',
  'preparing',
  'packed',
  'ready_for_pickup',
  'picked_up',
  'out_for_delivery',
];

export type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

export interface StatusMeta {
  /** Short label for pills and table cells. */
  label: string;
  /** Customer-facing sentence for the tracking timeline. */
  detail: string;
  tone: StatusTone;
}

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending_payment: {
    label: 'Awaiting payment',
    detail: 'Your order is reserved. Complete payment to send it to the pharmacy.',
    tone: 'warning',
  },
  payment_failed: {
    label: 'Payment failed',
    detail: "That payment didn't go through. You can try again.",
    tone: 'danger',
  },
  paid: {
    label: 'Paid',
    detail: 'Payment received. The pharmacy has been notified.',
    tone: 'info',
  },
  confirmed: {
    label: 'Confirmed',
    detail: 'An attendant checked your items and confirmed the order.',
    tone: 'info',
  },
  preparing: {
    label: 'Preparing',
    detail: 'Your items are being picked and packed.',
    tone: 'info',
  },
  packed: { label: 'Packed', detail: 'Everything is packed and sealed.', tone: 'info' },
  ready_for_pickup: {
    label: 'Ready for pickup',
    detail: 'Waiting for the rider to collect your order.',
    tone: 'info',
  },
  picked_up: { label: 'Picked up', detail: 'The rider has your order.', tone: 'info' },
  out_for_delivery: {
    label: 'Out for delivery',
    detail: 'On the way to your address.',
    tone: 'info',
  },
  delivered: { label: 'Delivered', detail: 'Delivered. Thanks for shopping with Yahadeen Pharm Go.', tone: 'success' },
  cancelled: { label: 'Cancelled', detail: 'This order was cancelled.', tone: 'neutral' },
};

/** The happy path, in order — used to render the tracking timeline. */
export const ORDER_TIMELINE: readonly OrderStatus[] = [
  'paid',
  'confirmed',
  'preparing',
  'packed',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
];

/* --------------------------------------------------------- payment status -- */

export const PAYMENT_STATUSES = ['pending', 'success', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, StatusTone> = {
  pending: 'warning',
  success: 'success',
  failed: 'danger',
  refunded: 'neutral',
};

/* -------------------------------------------------------- delivery status -- */

export const DELIVERY_STATUSES = [
  'unassigned',
  'requested',
  'rider_assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'failed',
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

/* ------------------------------------------------------------------ stock -- */

export type StockState = 'in_stock' | 'low_stock' | 'out_of_stock';

/**
 * Single source of truth for how stock is described. Both mobile apps and the
 * dashboard call this so a product never reads "In stock" in one place and
 * "Low" in another.
 */
export function stockState(quantity: number, lowStockThreshold = 10): StockState {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

export const STOCK_STATE_META: Record<StockState, { label: string; tone: StatusTone }> = {
  in_stock: { label: 'In stock', tone: 'success' },
  low_stock: { label: 'Low stock', tone: 'warning' },
  out_of_stock: { label: 'Out of stock', tone: 'danger' },
};
