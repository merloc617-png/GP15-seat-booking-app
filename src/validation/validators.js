/**
 * 纯校验（无 DOM / 无 I/O）。
 * TODO: 名称长度、价格范围、与 i18n errors.* 对齐。
 */

/** @param {unknown} _value */
export function validateName(_value) {
  // TODO
  return { ok: false, error: 'errors.todo' };
}

/** @param {unknown} _value */
export function validatePrice(_value) {
  // TODO
  return { ok: false, error: 'errors.todo' };
}

/**
 * @param {{ name?: unknown, price?: unknown }} [_payload]
 * @returns {{ ok: boolean, value?: { name: string, price: number }, errors: string[] }}
 */
export function validateService(_payload = {}) {
  // TODO
  return { ok: false, errors: ['errors.todo'] };
}

/** @param {unknown} _input */
export function escapeHtml(_input) {
  // TODO
  return '';
}

export const LIMITS = Object.freeze({
  NAME_MIN: 1,
  NAME_MAX: 80,
  PRICE_MIN: 0,
  PRICE_MAX: 1000,
});
