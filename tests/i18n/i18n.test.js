/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as i18n from '../../src/i18n/i18n.js';

const RESOURCES = {
  en: {
    hello: 'Hello',
    greet: 'Hi {name}',
    onlyEn: 'EN-only',
  },
  zh: {
    hello: '你好',
    greet: '你好 {name}',
  },
};

function memStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

describe('i18n module', () => {
  beforeEach(() => {
    i18n._resetForTests();
  });

  it('init with defaultLocale + fallback', () => {
    i18n.init({ resources: RESOURCES, defaultLocale: 'zh', fallback: 'en' });
    expect(i18n.getLocale()).toBe('zh');
    expect(i18n.getAvailableLocales()).toEqual(['en', 'zh']);
  });

  it('falls back to fallback when defaultLocale is missing', () => {
    i18n.init({ resources: RESOURCES, defaultLocale: 'fr', fallback: 'en' });
    expect(i18n.getLocale()).toBe('en');
  });

  it('t returns translation in current locale', () => {
    i18n.init({ resources: RESOURCES, defaultLocale: 'zh', fallback: 'en' });
    expect(i18n.t('hello')).toBe('你好');
  });

  it('t falls back to fallback locale for missing keys', () => {
    i18n.init({ resources: RESOURCES, defaultLocale: 'zh', fallback: 'en' });
    expect(i18n.t('onlyEn')).toBe('EN-only');
  });

  it('t returns the key itself when translation entirely missing', () => {
    i18n.init({ resources: RESOURCES });
    expect(i18n.t('missing.key')).toBe('missing.key');
  });

  it('t interpolates {placeholders}', () => {
    i18n.init({ resources: RESOURCES, defaultLocale: 'en' });
    expect(i18n.t('greet', { name: 'Alex' })).toBe('Hi Alex');
  });

  it('t leaves unknown placeholders alone', () => {
    i18n.init({ resources: RESOURCES, defaultLocale: 'en' });
    expect(i18n.t('greet', { other: 'Alex' })).toBe('Hi {name}');
  });

  it('setLocale notifies listeners', () => {
    i18n.init({ resources: RESOURCES, defaultLocale: 'en' });
    const cb = vi.fn();
    i18n.onChange(cb);
    i18n.setLocale('zh');
    expect(cb).toHaveBeenCalledWith('zh');
  });

  it('setLocale rejects unknown locales', () => {
    i18n.init({ resources: RESOURCES, defaultLocale: 'en' });
    expect(i18n.setLocale('jp')).toBe(false);
    expect(i18n.getLocale()).toBe('en');
  });

  it('listener errors do not break setLocale', () => {
    i18n.init({ resources: RESOURCES, defaultLocale: 'en' });
    i18n.onChange(() => { throw new Error('bad listener'); });
    expect(() => i18n.setLocale('zh')).not.toThrow();
  });

  it('storage round-trips locale across init', () => {
    const storage = memStorage();
    i18n.init({ resources: RESOURCES, storage, defaultLocale: 'en' });
    i18n.setLocale('zh');
    i18n._resetForTests();
    i18n.init({ resources: RESOURCES, storage, defaultLocale: 'en' });
    expect(i18n.getLocale()).toBe('zh');
  });

  it('applyTranslations replaces textContent for [data-i18n] elements and updates <html lang>', () => {
    i18n.init({ resources: RESOURCES, defaultLocale: 'zh', fallback: 'en' });
    document.body.innerHTML = `
      <div>
        <span data-i18n="hello"></span>
        <button data-i18n="greet"></button>
      </div>
    `;
    i18n.applyTranslations(document);
    expect(document.querySelector('[data-i18n="hello"]').textContent).toBe('你好');
    expect(document.documentElement.getAttribute('lang')).toBe('zh');
  });

  it('applyTranslations sets attributes via [data-i18n-attr]', () => {
    i18n.init({ resources: RESOURCES, defaultLocale: 'en' });
    document.body.innerHTML = `
      <button data-i18n-attr="aria-label:hello, title:hello"></button>
    `;
    i18n.applyTranslations(document);
    const btn = document.querySelector('button');
    expect(btn.getAttribute('aria-label')).toBe('Hello');
    expect(btn.getAttribute('title')).toBe('Hello');
  });

  it('unsubscribe stops further calls', () => {
    i18n.init({ resources: RESOURCES, defaultLocale: 'en' });
    const cb = vi.fn();
    const off = i18n.onChange(cb);
    off();
    i18n.setLocale('zh');
    expect(cb).not.toHaveBeenCalled();
  });
});
