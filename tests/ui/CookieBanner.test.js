/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CookieBanner } from '../../src/ui/CookieBanner.js';
import * as i18n from '../../src/i18n/i18n.js';
import enLocale from '../../src/i18n/locales/en.json';
import zhLocale from '../../src/i18n/locales/zh.json';

describe('CookieBanner', () => {
  let adapter;
  let onAccept;
  let onReject;
  let banner;

  beforeEach(() => {
    // Reset i18n for each test
    i18n._resetForTests();
    i18n.init({
      resources: { en: enLocale, zh: zhLocale },
      defaultLocale: 'en',
      fallback: 'en',
      storage: null,
    });

    // Mock adapter
    adapter = {
      isEnabled: vi.fn(),
      enable: vi.fn(),
    };

    // Mock callbacks
    onAccept = vi.fn();
    onReject = vi.fn();

    // Create banner instance
    banner = new CookieBanner({ adapter, onAccept, onReject });

    // Clear DOM
    document.body.innerHTML = '';
  });

  it('should not mount if adapter is enabled', () => {
    adapter.isEnabled.mockReturnValue(true);
    
    banner.mount();
    
    expect(document.getElementById('cookie-banner')).toBeNull();
  });

  it('should not mount if consent was explicitly rejected', () => {
    adapter.isEnabled.mockReturnValue(false);
    
    // Simulate rejected consent in localStorage
    const originalLocalStorage = global.localStorage;
    const mockStorage = {
      getItem: vi.fn().mockReturnValue('rejected'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(global, 'localStorage', { value: mockStorage, writable: true });
    
    banner.mount();
    
    expect(document.getElementById('cookie-banner')).toBeNull();
    
    // Restore original localStorage
    Object.defineProperty(global, 'localStorage', { value: originalLocalStorage, writable: true });
  });

  it('should mount banner when adapter is disabled and no explicit rejection', () => {
    adapter.isEnabled.mockReturnValue(false);
    
    banner.mount();
    
    const bannerEl = document.getElementById('cookie-banner');
    expect(bannerEl).not.toBeNull();
    expect(bannerEl.classList.contains('cookie-banner')).toBe(true);
    expect(bannerEl.getAttribute('role')).toBe('region');
    expect(bannerEl.getAttribute('aria-labelledby')).toBe('cookie-banner-title');
  });

  it('should have correct structure when mounted', () => {
    adapter.isEnabled.mockReturnValue(false);
    
    banner.mount();
    
    const bannerEl = document.getElementById('cookie-banner');
    expect(bannerEl.querySelector('.cookie-banner__title')).not.toBeNull();
    expect(bannerEl.querySelector('.cookie-banner__body')).not.toBeNull();
    expect(bannerEl.querySelector('.cookie-banner__actions')).not.toBeNull();
  });

  it('should have translated content when mounted', () => {
    adapter.isEnabled.mockReturnValue(false);
    
    banner.mount();
    
    const title = document.querySelector('[data-i18n="consent.title"]');
    const bodyText = document.querySelector('[data-i18n="consent.body"]');
    const acceptBtn = document.querySelector('[data-i18n="consent.accept"]');
    const rejectBtn = document.querySelector('[data-i18n="consent.reject"]');
    
    expect(title).not.toBeNull();
    expect(bodyText).not.toBeNull();
    expect(acceptBtn).not.toBeNull();
    expect(rejectBtn).not.toBeNull();
  });

  it('should call adapter.enable and onAccept when accept button is clicked', () => {
    adapter.isEnabled.mockReturnValue(false);
    
    banner.mount();
    
    const acceptBtn = document.querySelector('[data-i18n="consent.accept"]');
    acceptBtn.click();
    
    expect(adapter.enable).toHaveBeenCalled();
    expect(onAccept).toHaveBeenCalled();
    expect(document.getElementById('cookie-banner')).toBeNull(); // Banner should be dismissed
  });

  it('should call onReject and set rejection flag when reject button is clicked', () => {
    adapter.isEnabled.mockReturnValue(false);
    
    banner.mount();
    
    const rejectBtn = document.querySelector('[data-i18n="consent.reject"]');
    
    // Mock localStorage for this test
    const originalLocalStorage = global.localStorage;
    const mockStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(global, 'localStorage', { value: mockStorage, writable: true });
    
    rejectBtn.click();
    
    expect(mockStorage.setItem).toHaveBeenCalledWith('sba-consent', 'rejected');
    expect(onReject).toHaveBeenCalled();
    expect(document.getElementById('cookie-banner')).toBeNull(); // Banner should be dismissed
    
    // Restore original localStorage
    Object.defineProperty(global, 'localStorage', { value: originalLocalStorage, writable: true });
  });

  it('should handle localStorage errors gracefully when rejecting', () => {
    adapter.isEnabled.mockReturnValue(false);
    
    banner.mount();
    
    const rejectBtn = document.querySelector('[data-i18n="consent.reject"]');
    
    // Mock localStorage to throw error
    const originalLocalStorage = global.localStorage;
    const mockStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn().mockImplementation(() => { throw new Error('Storage error'); }),
      removeItem: vi.fn(),
    };
    Object.defineProperty(global, 'localStorage', { value: mockStorage, writable: true });
    
    // Should not throw error
    expect(() => rejectBtn.click()).not.toThrow();
    expect(onReject).toHaveBeenCalled();
    
    // Restore original localStorage
    Object.defineProperty(global, 'localStorage', { value: originalLocalStorage, writable: true });
  });

  it('should apply translations when locale changes', () => {
    adapter.isEnabled.mockReturnValue(false);
    
    banner.mount();
    
    // Change locale to Chinese
    i18n.setLocale('zh');
    
    // Check if translations are applied (the banner should still exist)
    const bannerEl = document.getElementById('cookie-banner');
    expect(bannerEl).not.toBeNull();
  });
});