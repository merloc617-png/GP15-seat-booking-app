/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanguageSwitcher } from '../../src/ui/LanguageSwitcher.js';
import * as i18n from '../../src/i18n/i18n.js';
import enLocale from '../../src/i18n/locales/en.json';
import zhLocale from '../../src/i18n/locales/zh.json';

describe('LanguageSwitcher', () => {
  let button;
  let switcher;

  beforeEach(() => {
    // Reset i18n for each test
    i18n._resetForTests();
    i18n.init({
      resources: { en: enLocale, zh: zhLocale },
      defaultLocale: 'en',
      fallback: 'en',
      storage: null,
    });

    // Create button element
    button = document.createElement('button');
    button.id = 'lang-toggle';
    document.body.appendChild(button);

    // Create switcher instance
    switcher = new LanguageSwitcher({
      button,
      locales: ['en', 'zh'],
      labels: { en: 'English', zh: '中文' },
    });
  });

  it('should initialize with correct label based on current locale', () => {
    switcher.mount();
    
    // Since current locale is 'en', the button should show the next locale label ('中文')
    expect(button.textContent).toBe('中文');
  });

  it('should toggle to next locale when clicked', () => {
    switcher.mount();
    
    // Initially in 'en', so button shows '中文'
    expect(button.textContent).toBe('中文');
    expect(i18n.getLocale()).toBe('en');
    
    // Click to switch to 'zh'
    button.click();
    
    expect(i18n.getLocale()).toBe('zh');
    expect(button.textContent).toBe('English'); // Now showing the other option
  });

  it('should cycle back to first locale when at the end', () => {
    switcher.mount();
    
    // Switch to 'zh'
    button.click();
    expect(i18n.getLocale()).toBe('zh');
    expect(button.textContent).toBe('English');
    
    // Click again to cycle back to 'en'
    button.click();
    expect(i18n.getLocale()).toBe('en');
    expect(button.textContent).toBe('中文');
  });

  it('should update label when locale changes externally', () => {
    switcher.mount();
    
    // Change locale externally
    i18n.setLocale('zh');
    
    // Button label should update
    expect(button.textContent).toBe('English');
  });

  it('should apply translations to document when locale changes', () => {
    // Add an element with data-i18n attribute
    const element = document.createElement('div');
    element.setAttribute('data-i18n', 'app.title');
    document.body.appendChild(element);
    
    // Apply initial translations
    i18n.applyTranslations(document);
    
    switcher.mount();
    
    // Initially should be in English
    expect(element.textContent).toBe('Seat Booking');
    
    // Click to switch to Chinese
    button.click();
    
    // Element should now be translated to Chinese
    expect(element.textContent).toBe('座位预订');
  });

  it('should handle custom labels correctly', () => {
    const customButton = document.createElement('button');
    document.body.appendChild(customButton);
    
    const customSwitcher = new LanguageSwitcher({
      button: customButton,
      locales: ['en', 'zh'],
      labels: { en: 'EN', zh: 'ZH' },
    });
    
    customSwitcher.mount();
    
    expect(customButton.textContent).toBe('ZH');
    
    customButton.click();
    expect(customButton.textContent).toBe('EN');
  });

  it('should use locale code as label if not provided in labels object', () => {
    const customButton = document.createElement('button');
    document.body.appendChild(customButton);
    
    const customSwitcher = new LanguageSwitcher({
      button: customButton,
      locales: ['en', 'fr'],
      labels: { en: 'English' }, // French label not provided
    });
    
    customSwitcher.mount();
    
    // Should use 'fr' as the label since it's not in the labels object
    expect(customButton.textContent).toBe('fr');
  });

  it('should work with more than two locales', () => {
    const multiButton = document.createElement('button');
    document.body.appendChild(multiButton);
    
    // Initialize i18n with additional locale
    i18n._resetForTests();
    i18n.init({
      resources: { 
        en: enLocale, 
        zh: zhLocale,
        es: { 'app.title': 'Reserva de Asientos' } // Spanish
      },
      defaultLocale: 'en',
      fallback: 'en',
      storage: null,
    });
    
    const multiSwitcher = new LanguageSwitcher({
      button: multiButton,
      locales: ['en', 'zh', 'es'],
      labels: { en: 'English', zh: '中文', es: 'Español' },
    });
    
    multiSwitcher.mount();
    
    // Should start with 'en', showing next locale 'zh'
    expect(multiButton.textContent).toBe('中文');
    
    // Click to go to 'zh'
    multiButton.click();
    expect(i18n.getLocale()).toBe('zh');
    expect(multiButton.textContent).toBe('Español');
    
    // Click to go to 'es'
    multiButton.click();
    expect(i18n.getLocale()).toBe('es');
    expect(multiButton.textContent).toBe('English');
    
    // Click to cycle back to 'en'
    multiButton.click();
    expect(i18n.getLocale()).toBe('en');
    expect(multiButton.textContent).toBe('中文');
  });
});