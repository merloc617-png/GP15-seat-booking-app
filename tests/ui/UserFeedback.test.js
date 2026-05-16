/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserFeedback } from '../../src/ui/UserFeedback.js';
import * as i18n from '../../src/i18n/i18n.js';
import enLocale from '../../src/i18n/locales/en.json';
import zhLocale from '../../src/i18n/locales/zh.json';

describe('UserFeedback', () => {
  let container;
  let feedback;

  beforeEach(() => {
    // Reset i18n for each test
    i18n._resetForTests();
    i18n.init({
      resources: { en: enLocale, zh: zhLocale },
      defaultLocale: 'en',
      fallback: 'en',
      storage: null,
    });

    // Create container element
    container = document.createElement('div');
    container.id = 'app-feedback';
    document.body.appendChild(container);

    // Create feedback instance with short duration for testing
    feedback = new UserFeedback({ container, durationMs: 100 });
  });

  it('should show message with correct text content', () => {
    feedback.show({ messageKey: 'feedback.seatSelected', params: { row: '1', seat: '5' } });
    
    expect(container.textContent).toBe('Seat 1-5 added to your order.');
  });

  it('should apply correct CSS classes when showing', () => {
    feedback.show({ messageKey: 'feedback.seatSelected', params: { row: '1', seat: '5' } });
    
    expect(container.className).toContain('app-feedback');
    expect(container.className).toContain('app-feedback--info');
    expect(container.className).toContain('app-feedback--visible');
  });

  it('should not be hidden when showing', () => {
    feedback.show({ messageKey: 'feedback.seatSelected', params: { row: '1', seat: '5' } });
    
    expect(container.hidden).toBe(false);
  });

  it('should hide after specified duration', () => {
    vi.useFakeTimers();
    
    feedback.show({ messageKey: 'feedback.seatSelected', params: { row: '1', seat: '5' } });
    
    // Initially visible
    expect(container.className).toContain('app-feedback--visible');
    expect(container.hidden).toBe(false);
    
    // Advance timer past duration
    vi.advanceTimersByTime(150);
    
    // Should be hidden now
    expect(container.className).not.toContain('app-feedback--visible');
    expect(container.hidden).toBe(true);
    
    vi.useRealTimers();
  });

  it('should clear text content when hiding', () => {
    vi.useFakeTimers();
    
    feedback.show({ messageKey: 'feedback.seatSelected', params: { row: '1', seat: '5' } });
    expect(container.textContent).toBe('Seat 1-5 added to your order.');
    
    vi.advanceTimersByTime(150);
    
    expect(container.textContent).toBe('');
    
    vi.useRealTimers();
  });

  it('should support different message types (success)', () => {
    feedback.show({ 
      messageKey: 'feedback.serviceAdded', 
      params: { name: 'Test Movie' },
      type: 'success' 
    });
    
    expect(container.className).toContain('app-feedback--success');
    expect(container.textContent).toBe('"Test Movie" added successfully.');
  });

  it('should support different message types (error)', () => {
    feedback.show({ 
      messageKey: 'feedback.bookingEmpty', 
      type: 'error' 
    });
    
    expect(container.className).toContain('app-feedback--error');
    expect(container.textContent).toBe('Select at least one seat before buying.');
  });

  it('should default to info type when not specified', () => {
    feedback.show({ messageKey: 'feedback.seatSelected', params: { row: '1', seat: '5' } });
    
    expect(container.className).toContain('app-feedback--info');
  });

  it('should use default duration when not specified', () => {
    const defaultContainer = document.createElement('div');
    document.body.appendChild(defaultContainer);
    const defaultFeedback = new UserFeedback({ container: defaultContainer });
    
    vi.useFakeTimers();
    
    defaultFeedback.show({ messageKey: 'feedback.seatSelected', params: { row: '1', seat: '5' } });
    expect(defaultContainer.className).toContain('app-feedback--visible');
    
    // Default duration is 4500ms, so should still be visible at 4000ms
    vi.advanceTimersByTime(4000);
    expect(defaultContainer.className).toContain('app-feedback--visible');
    
    // Should be hidden after default duration
    vi.advanceTimersByTime(600);
    expect(defaultContainer.className).not.toContain('app-feedback--visible');
    
    vi.useRealTimers();
  });

  it('should cancel previous timer when showing new message', () => {
    vi.useFakeTimers();
    
    feedback.show({ messageKey: 'feedback.seatSelected', params: { row: '1', seat: '5' } });
    
    // Advance time but not enough to hide
    vi.advanceTimersByTime(50);
    
    // Show another message
    feedback.show({ messageKey: 'feedback.serviceAdded', params: { name: 'New Movie' } });
    
    // Should still be visible
    expect(container.className).toContain('app-feedback--visible');
    
    // Advance to original timeout
    vi.advanceTimersByTime(60);
    
    // Should still be visible because timer was reset
    expect(container.className).toContain('app-feedback--visible');
    
    // Advance past new timeout
    vi.advanceTimersByTime(100);
    
    // Now should be hidden
    expect(container.className).not.toContain('app-feedback--visible');
    
    vi.useRealTimers();
  });

  it('should handle missing translation keys gracefully', () => {
    feedback.show({ messageKey: 'non.existent.key' });
    
    expect(container.textContent).toBe('non.existent.key');
  });

  it('should not throw error when container is null', () => {
    const nullFeedback = new UserFeedback({ container: null });
    
    expect(() => {
      nullFeedback.show({ messageKey: 'feedback.seatSelected', params: { row: '1', seat: '5' } });
    }).not.toThrow();
    
    expect(() => {
      nullFeedback.hide();
    }).not.toThrow();
  });

  it('should translate messages based on current locale', () => {
    feedback.show({ messageKey: 'feedback.seatSelected', params: { row: '1', seat: '5' } });
    expect(container.textContent).toBe('Seat 1-5 added to your order.');
    
    // Change to Chinese
    i18n.setLocale('zh');
    feedback.show({ messageKey: 'feedback.seatSelected', params: { row: '1', seat: '5' } });
    expect(container.textContent).toBe('已将 1 排 5 号加入订单。');
  });

  it('should hide immediately when hide() is called', () => {
    feedback.show({ messageKey: 'feedback.seatSelected', params: { row: '1', seat: '5' } });
    expect(container.className).toContain('app-feedback--visible');
    
    feedback.hide();
    
    expect(container.className).not.toContain('app-feedback--visible');
    expect(container.hidden).toBe(true);
    expect(container.textContent).toBe('');
  });

  it('should interpolate multiple parameters correctly', () => {
    feedback.show({ 
      messageKey: 'feedback.bookingSuccess', 
      params: { count: 3 } 
    });
    
    expect(container.textContent).toBe('Purchased 3 ticket(s). Enjoy the show!');
  });

  it('should leave unknown placeholders unchanged', () => {
    feedback.show({ 
      messageKey: 'feedback.seatSelected', 
      params: { other: 'X' } 
    });
    
    // Since we didn't provide 'row' and 'seat', they should remain as placeholders
    expect(container.textContent).toContain('{row}');
    expect(container.textContent).toContain('{seat}');
  });

  it('should work with numeric parameter values', () => {
    feedback.show({ 
      messageKey: 'feedback.bookingSuccess', 
      params: { count: 5 } 
    });
    
    expect(container.textContent).toBe('Purchased 5 ticket(s). Enjoy the show!');
  });
});