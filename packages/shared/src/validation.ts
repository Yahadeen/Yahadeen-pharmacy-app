/**
 * Input rules that both clients and the API must agree on.
 *
 * These live in the shared package because a rule enforced only in the app is
 * not enforced at all — the zod schemas on the route handlers import the same
 * functions, so a number the phone accepts is a number the server accepts.
 */

/**
 * Nigerian mobile numbers, accepted in the three shapes people actually type:
 * `08031234567`, `2348031234567` and `+2348031234567`. Separators are ignored.
 */
export function isNigerianPhone(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 11) return digits.startsWith('0');
  if (digits.length === 13) return digits.startsWith('234');
  return false;
}

/** Canonical storage form: `0803…`, 11 digits, no spaces. */
export function normalizeNigerianPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('234')) return `0${digits.slice(3)}`;
  return digits;
}

/** Deliberately permissive — the confirmation email is the real check. */
export function isEmail(input: string): boolean {
  const trimmed = input.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}
