import { describe, it, expect, beforeEach } from 'vitest';
import { SeatBookingApp } from '../src/core/SeatBookingApp.js';
import { Sector } from '../src/core/Sector.js';
import { Service } from '../src/core/Service.js';
import { LocalStorageAdapter } from '../src/storage/LocalStorageAdapter.js';
import { validateService } from '../src/validation/validators.js';
import { init, t, getLocale, setLocale, _resetForTests } from '../src/i18n/i18n.js';
import enLocale from '../src/i18n/locales/en.json';
import zhLocale from '../src/i18n/locales/zh.json';

describe('skeleton smoke', () => {
  beforeEach(() => {
    _resetForTests();
    init({
      resources: { en: enLocale, zh: zhLocale },
      defaultLocale: 'en',
      fallback: 'en',
      storage: null,
    });
  });

  it('SeatBookingApp exposes instance name', () => {
    expect(new SeatBookingApp('room1').getName()).toBe('room1');
  });

  it('Sector / Service are constructible (stubs)', () => {
    expect(new Sector('A1', 1, 5).getId()).toBeDefined();
    expect(new Service('Film', 10).getName()).toBe('Film');
  });

  it('LocalStorageAdapter is disabled until implemented', () => {
    expect(new LocalStorageAdapter({ storage: null }).isEnabled()).toBe(false);
  });

  it('validateService is stubbed', () => {
    const r = validateService({ name: 'Any', price: 9 });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('errors.todo');
  });

  it('i18n round-trip', () => {
    expect(t('skeleton.notice')).toBeTruthy();
    setLocale('zh');
    expect(getLocale()).toBe('zh');
    expect(t('app.title')).toBe(zhLocale['app.title']);
  });
});
