/**
 * Pure validation functions. No DOM, no I/O - so unit tests are trivial.
 *
 * Defensive programming, OWASP A04 (Insecure Design) and input validation
 * principles applied at every external boundary (UI input, storage rehydrate).
 */

const NAME_MIN = 1;
const NAME_MAX = 80;
const PRICE_MIN = 0;
const PRICE_MAX = 1000;

/**
 * Validate a movie / service name.
 * @param {unknown} value
 * @returns {{ ok: boolean, value?: string, error?: string }}
 */
export function validateName(value) {
  if (typeof value !== 'string') {
    return { ok: false, error: 'errors.name.type' };
  }
  const trimmed = value.trim();
  if (trimmed.length < NAME_MIN) {
    return { ok: false, error: 'errors.name.empty' };
  }
  if (trimmed.length > NAME_MAX) {
    return { ok: false, error: 'errors.name.tooLong' };
  }
  return { ok: true, value: trimmed };
}

/**
 * Validate a base ticket price.
 * @param {unknown} value
 * @returns {{ ok: boolean, value?: number, error?: string }}
 */
export function validatePrice(value) {
  if (value === '' || value === null || value === undefined) {
    return { ok: false, error: 'errors.price.empty' };
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return { ok: false, error: 'errors.price.nan' };
  }
  if (n < PRICE_MIN) {
    return { ok: false, error: 'errors.price.negative' };
  }
  if (n > PRICE_MAX) {
    return { ok: false, error: 'errors.price.tooHigh' };
  }
  return { ok: true, value: Number(n.toFixed(2)) };
}

/**
 * Validate a service form payload.
 * @param {{ name: unknown, price: unknown }} payload
 * @returns {{ ok: boolean, value?: { name: string, price: number }, errors: string[] }}
 */
export function validateService(payload = {}) {
  const errors = [];
  const nameRes = validateName(payload.name);
  const priceRes = validatePrice(payload.price);
  if (!nameRes.ok) errors.push(nameRes.error);
  if (!priceRes.ok) errors.push(priceRes.error);
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { name: nameRes.value, price: priceRes.value },
    errors: [],
  };
}

/**
 * Escape HTML for safe display. We use textContent everywhere in the UI
 * which already protects us, but expose this helper for any string that
 * eventually lands in attribute context (e.g. aria-label).
 */
export function escapeHtml(input) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const LIMITS = Object.freeze({
  NAME_MIN,
  NAME_MAX,
  PRICE_MIN,
  PRICE_MAX,
});
