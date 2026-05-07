import { describe, it, expect } from 'vitest';
import {
  validateName,
  validatePrice,
  validateService,
  escapeHtml,
  LIMITS,
} from '../../src/validation/validators.js';

describe('validateName', () => {
  it('accepts a normal title and trims whitespace', () => {
    expect(validateName('  Avatar  ')).toEqual({ ok: true, value: 'Avatar' });
  });

  it('rejects non-string', () => {
    expect(validateName(42)).toEqual({ ok: false, error: 'errors.name.type' });
    expect(validateName(null)).toEqual({ ok: false, error: 'errors.name.type' });
  });

  it('rejects empty / whitespace-only', () => {
    expect(validateName('')).toEqual({ ok: false, error: 'errors.name.empty' });
    expect(validateName('   ')).toEqual({ ok: false, error: 'errors.name.empty' });
  });

  it('rejects too long', () => {
    expect(validateName('x'.repeat(LIMITS.NAME_MAX + 1)).ok).toBe(false);
    expect(validateName('x'.repeat(LIMITS.NAME_MAX + 1)).error).toBe('errors.name.tooLong');
  });
});

describe('validatePrice', () => {
  it('accepts a numeric string and rounds to 2dp', () => {
    expect(validatePrice('12.345')).toEqual({ ok: true, value: 12.35 });
  });

  it('accepts a number', () => {
    expect(validatePrice(0)).toEqual({ ok: true, value: 0 });
  });

  it('rejects empty / null / undefined', () => {
    expect(validatePrice('').ok).toBe(false);
    expect(validatePrice(null).ok).toBe(false);
    expect(validatePrice(undefined).ok).toBe(false);
  });

  it('rejects NaN-y inputs', () => {
    expect(validatePrice('abc')).toEqual({ ok: false, error: 'errors.price.nan' });
    expect(validatePrice(Infinity)).toEqual({ ok: false, error: 'errors.price.nan' });
  });

  it('rejects negative', () => {
    expect(validatePrice(-1)).toEqual({ ok: false, error: 'errors.price.negative' });
  });

  it('rejects too high', () => {
    expect(validatePrice(LIMITS.PRICE_MAX + 1).ok).toBe(false);
    expect(validatePrice(LIMITS.PRICE_MAX + 1).error).toBe('errors.price.tooHigh');
  });
});

describe('validateService', () => {
  it('returns ok with normalised values when valid', () => {
    const res = validateService({ name: ' Inception ', price: '12.5' });
    expect(res.ok).toBe(true);
    expect(res.value).toEqual({ name: 'Inception', price: 12.5 });
    expect(res.errors).toEqual([]);
  });

  it('aggregates multiple errors', () => {
    const res = validateService({ name: '', price: -1 });
    expect(res.ok).toBe(false);
    expect(res.errors).toContain('errors.name.empty');
    expect(res.errors).toContain('errors.price.negative');
  });

  it('handles missing input object gracefully', () => {
    const res = validateService();
    expect(res.ok).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });
});

describe('escapeHtml', () => {
  it('escapes the five common dangerous chars', () => {
    expect(escapeHtml('<a href="x">&\'</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;',
    );
  });

  it('coerces non-strings to string before escaping', () => {
    expect(escapeHtml(42)).toBe('42');
  });
});
