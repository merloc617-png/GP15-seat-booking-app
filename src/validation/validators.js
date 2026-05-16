/** @param {unknown} value */
export function validateName(value) {
  if (typeof value !== 'string') return { ok: false, error: 'errors.name.type' };
  const name = value.trim();
  if (name.length < LIMITS.NAME_MIN) return { ok: false, error: 'errors.name.empty' };
  if (name.length > LIMITS.NAME_MAX) return { ok: false, error: 'errors.name.tooLong' };
  return { ok: true, value: name };
}

/** @param {unknown} value */
export function validatePrice(value) {
  if (value === '' || value === null || value === undefined) return { ok: false, error: 'errors.price.empty' };
  const price = Number(value);
  if (!Number.isFinite(price)) return { ok: false, error: 'errors.price.nan' };
  if (price < LIMITS.PRICE_MIN) return { ok: false, error: 'errors.price.negative' };
  if (price > LIMITS.PRICE_MAX) return { ok: false, error: 'errors.price.tooHigh' };
  return { ok: true, value: price };
}

/**
 * @param {{ name?: unknown, price?: unknown }} [payload]
 * @param {Array<{ getName: () => string }>} [existingServices]
 * @returns {{ ok: boolean, value?: { name: string, price: number }, errors: string[] }}
 */
export function validateService(payload = {}, existingServices = []) {
  const nameResult = validateName(payload.name);
  const priceResult = validatePrice(payload.price);
  const errors = [];
  
  if (!nameResult.ok) {
    errors.push(nameResult.error);
  } else {
    const nameLower = nameResult.value.toLowerCase();
    const isDuplicate = existingServices.some(
      service => service.getName().toLowerCase() === nameLower
    );
    if (isDuplicate) {
      errors.push('errors.name.duplicate');
    }
  }
  
  if (!priceResult.ok) errors.push(priceResult.error);

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name: nameResult.value,
      price: priceResult.value,
    },
    errors: [],
  };
}

/** @param {unknown} input */
export function escapeHtml(input) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const LIMITS = Object.freeze({
  NAME_MIN: 1,
  NAME_MAX: 80,
  PRICE_MIN: 0,
  PRICE_MAX: 1000,
});
