import { describe, it, expect, beforeEach } from 'vitest';
import { SeatBookingApp } from '../src/core/SeatBookingApp.js';
import { Sector } from '../src/core/Sector.js';
import { Service } from '../src/core/Service.js';
import { AuditLogger } from '../src/audit/AuditLogger.js';
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

  it('validateService accepts valid service data', () => {
    const r = validateService({ name: 'Any', price: 9 });
    expect(r.ok).toBe(true);
    expect(r.value).toEqual({ name: 'Any', price: 9 });
  });

  it('i18n round-trip', () => {
    expect(t('skeleton.notice')).toBeTruthy();
    setLocale('zh');
    expect(getLocale()).toBe('zh');
    expect(t('app.title')).toBe(zhLocale['app.title']);
  });

  it('AuditLogger writes structured audit entries', () => {
    const storage = createMemoryStorage();
    const logger = new AuditLogger({
      storage,
      namespace: 'test-room',
      userId: 'user-1',
      sessionId: 'session-1',
      now: () => new Date('2026-05-10T12:00:00.000Z'),
    });

    const entry = logger.log('SEAT_RESERVED', {
      serviceId: 'svc-demo',
      seatId: 's-front-r1-s1',
      ignored: undefined,
    });

    expect(entry).toEqual({
      timestamp: '2026-05-10T12:00:00.000Z',
      action: 'SEAT_RESERVED',
      userId: 'user-1',
      sessionId: 'session-1',
      details: {
        serviceId: 'svc-demo',
        seatId: 's-front-r1-s1',
      },
    });
    expect(JSON.parse(storage.getItem('test-room:auditTrail'))).toEqual([entry]);
  });

  it('AuditLogger keeps only the latest max entries', () => {
    const logger = new AuditLogger({
      storage: createMemoryStorage(),
      namespace: 'test-room',
      sessionId: 'session-1',
      maxEntries: 2,
      now: () => new Date('2026-05-10T12:00:00.000Z'),
    });

    logger.log('FIRST');
    logger.log('SECOND');
    logger.log('THIRD');

    expect(logger.getEntries().map((entry) => entry.action)).toEqual(['SECOND', 'THIRD']);
  });
});

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}
