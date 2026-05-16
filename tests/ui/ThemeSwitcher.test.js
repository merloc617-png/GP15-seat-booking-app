/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeSwitcher } from '../../src/ui/ThemeSwitcher.js';

describe('ThemeSwitcher', () => {
  let button;
  let switcher;
  let mockStorage;

  beforeEach(() => {
    // Create button element
    button = document.createElement('button');
    button.id = 'theme-toggle';
    document.body.appendChild(button);

    // Create mock storage
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    // Clear any existing theme
    delete document.documentElement.dataset.theme;
  });

  it('should initialize with light theme by default', () => {
    mockStorage.getItem.mockReturnValue(null);
    
    switcher = new ThemeSwitcher({ button, storage: mockStorage });
    switcher.mount();
    
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(button.dataset.theme).toBe('light');
  });

  it('should initialize with dark theme if system prefers dark', () => {
    mockStorage.getItem.mockReturnValue(null);
    
    // Mock matchMedia to prefer dark mode
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    
    switcher = new ThemeSwitcher({ button, storage: mockStorage });
    switcher.mount();
    
    expect(document.documentElement.dataset.theme).toBe('dark');
    
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
  });

  it('should load saved theme from storage', () => {
    mockStorage.getItem.mockReturnValue('dark');
    
    switcher = new ThemeSwitcher({ button, storage: mockStorage });
    switcher.mount();
    
    expect(mockStorage.getItem).toHaveBeenCalledWith('sba-theme');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(button.dataset.theme).toBe('dark');
  });

  it('should toggle to dark theme when clicked from light', () => {
    mockStorage.getItem.mockReturnValue(null);
    
    switcher = new ThemeSwitcher({ button, storage: mockStorage });
    switcher.mount();
    
    expect(document.documentElement.dataset.theme).toBe('light');
    
    button.click();
    
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(button.dataset.theme).toBe('dark');
    expect(mockStorage.setItem).toHaveBeenCalledWith('sba-theme', 'dark');
  });

  it('should toggle to light theme when clicked from dark', () => {
    mockStorage.getItem.mockReturnValue('dark');
    
    switcher = new ThemeSwitcher({ button, storage: mockStorage });
    switcher.mount();
    
    expect(document.documentElement.dataset.theme).toBe('dark');
    
    button.click();
    
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(button.dataset.theme).toBe('light');
    expect(mockStorage.setItem).toHaveBeenCalledWith('sba-theme', 'light');
  });

  it('should update aria-label and title attributes correctly', () => {
    mockStorage.getItem.mockReturnValue(null);
    
    switcher = new ThemeSwitcher({ button, storage: mockStorage });
    switcher.mount();
    
    // Initially light theme
    expect(button.getAttribute('aria-label')).toBe('Switch to dark mode');
    expect(button.getAttribute('title')).toBe('Switch to dark mode');
    
    // Click to switch to dark
    button.click();
    
    expect(button.getAttribute('aria-label')).toBe('Switch to light mode');
    expect(button.getAttribute('title')).toBe('Switch to light mode');
  });

  it('should persist theme changes to storage', () => {
    mockStorage.getItem.mockReturnValue(null);
    
    switcher = new ThemeSwitcher({ button, storage: mockStorage });
    switcher.mount();
    
    button.click();
    
    expect(mockStorage.setItem).toHaveBeenCalledWith('sba-theme', 'dark');
  });

  it('should handle storage errors gracefully', () => {
    mockStorage.getItem.mockReturnValue(null);
    mockStorage.setItem.mockImplementation(() => { throw new Error('Storage error'); });
    
    switcher = new ThemeSwitcher({ button, storage: mockStorage });
    
    // Should not throw error during mount or click
    expect(() => switcher.mount()).not.toThrow();
    expect(() => button.click()).not.toThrow();
  });

  it('should ignore invalid saved themes', () => {
    mockStorage.getItem.mockReturnValue('invalid-theme');
    
    switcher = new ThemeSwitcher({ button, storage: mockStorage });
    switcher.mount();
    
    // Should default to light theme
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('should work without storage (null storage)', () => {
    switcher = new ThemeSwitcher({ button, storage: null });
    switcher.mount();
    
    expect(document.documentElement.dataset.theme).toBe('light');
    
    button.click();
    
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('should work without storage (undefined storage)', () => {
    switcher = new ThemeSwitcher({ button });
    switcher.mount();
    
    expect(document.documentElement.dataset.theme).toBe('light');
    
    button.click();
    
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('should not persist theme on initial mount', () => {
    mockStorage.getItem.mockReturnValue(null);
    
    switcher = new ThemeSwitcher({ button, storage: mockStorage });
    switcher.mount();
    
    // setItem should not be called on initial mount (only on theme change)
    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });

  it('should cycle between light and dark themes multiple times', () => {
    mockStorage.getItem.mockReturnValue(null);
    
    switcher = new ThemeSwitcher({ button, storage: mockStorage });
    switcher.mount();
    
    // Start: light
    expect(document.documentElement.dataset.theme).toBe('light');
    
    // First click: dark
    button.click();
    expect(document.documentElement.dataset.theme).toBe('dark');
    
    // Second click: light
    button.click();
    expect(document.documentElement.dataset.theme).toBe('light');
    
    // Third click: dark
    button.click();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('should handle window object not being available', () => {
    // This test simulates SSR environment
    const originalWindow = global.window;
    delete global.window;
    
    mockStorage.getItem.mockReturnValue(null);
    
    switcher = new ThemeSwitcher({ button, storage: mockStorage });
    switcher.mount();
    
    expect(document.documentElement.dataset.theme).toBe('light');
    
    // Restore window
    global.window = originalWindow;
  });
});