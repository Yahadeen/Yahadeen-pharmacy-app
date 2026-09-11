/**
 * Commerce rules that both clients and the API must agree on.
 *
 * These are business constants, not display strings: the server re-derives every
 * amount from them at checkout, and the apps use them only to show the customer
 * what to expect. Keeping them here means a fee change lands in one place.
 */

/** Orders at or above this subtotal ship free. ₦20,000. */
export const FREE_DELIVERY_THRESHOLD_KOBO = 2_000_000;

/** Flat dispatch fee before distance is added. ₦500. */
export const DELIVERY_BASE_FEE_KOBO = 50_000;

/** Distance component of the delivery fee. ₦120 per kilometre. */
export const DELIVERY_PER_KM_KOBO = 12_000;

/** Hard cap per line so a mistyped quantity cannot drain the shelf. */
export const MAX_QTY_PER_LINE = 20;

/**
 * What delivery costs for a given distance and basket size. Mirrored by the API
 * so the quote a customer sees on the checkout screen is the amount charged.
 */
export function deliveryFeeKobo(distanceKm: number, subtotalKobo: number): number {
  if (subtotalKobo >= FREE_DELIVERY_THRESHOLD_KOBO) return 0;
  return DELIVERY_BASE_FEE_KOBO + Math.round(distanceKm * DELIVERY_PER_KM_KOBO);
}
