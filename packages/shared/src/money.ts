/**
 * Money is stored and transported as integer **kobo** everywhere — never as a
 * float. ₦1,250.50 is `125050`. Only format at the edge, right before render.
 */

export function toKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function toNaira(kobo: number): number {
  return kobo / 100;
}

/**
 * `₦1,250.50`. Drops the decimals when the amount is whole, which is the common
 * case for drug prices and keeps listings tidy.
 */
export function formatNaira(kobo: number, opts?: { alwaysDecimals?: boolean }): string {
  const naira = toNaira(kobo);
  const showDecimals = opts?.alwaysDecimals || kobo % 100 !== 0;
  return `₦${naira.toLocaleString('en-NG', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })}`;
}

/** Compact form for dashboard tiles: `₦1.2m`, `₦840k`. */
export function formatNairaCompact(kobo: number): string {
  const naira = toNaira(kobo);
  const abs = Math.abs(naira);
  if (abs >= 1_000_000_000) return `₦${(naira / 1_000_000_000).toFixed(1)}b`;
  if (abs >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}m`;
  if (abs >= 1_000) return `₦${(naira / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return `₦${naira.toFixed(0)}`;
}

/**
 * Anything priced by the line: a cart line, an `OrderItem`, a receipt row. Field
 * names are snake_case to match the Postgres columns, so DB rows can be summed
 * without remapping.
 */
export interface LineItemLike {
  unit_price_kobo: number;
  qty: number;
}

export function subtotalKobo(items: readonly LineItemLike[]): number {
  return items.reduce((sum, i) => sum + i.unit_price_kobo * i.qty, 0);
}
