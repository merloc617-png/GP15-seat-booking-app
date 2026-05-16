/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getSectorLabel } from '../../src/i18n/sectorLabels.js';
import * as i18n from '../../src/i18n/i18n.js';
import enLocale from '../../src/i18n/locales/en.json';
import zhLocale from '../../src/i18n/locales/zh.json';

describe('sectorLabels', () => {
  beforeEach(() => {
    // Reset i18n for each test
    i18n._resetForTests();
    i18n.init({
      resources: { en: enLocale, zh: zhLocale },
      defaultLocale: 'en',
      fallback: 'en',
      storage: null,
    });
  });

  describe('getSectorLabel', () => {
    it('should return translated label when translation exists', () => {
      const sector = {
        getId: () => 's-front',
        getName: () => 'front',
      };

      // In English
      expect(getSectorLabel(sector)).toBe('Front');

      // Change to Chinese
      i18n.setLocale('zh');
      expect(getSectorLabel(sector)).toBe('前排');
    });

    it('should fallback to sector name when translation key not found', () => {
      const sector = {
        getId: () => 's-custom',
        getName: () => 'Custom Sector',
      };

      // No translation for s-custom, should use getName()
      expect(getSectorLabel(sector)).toBe('Custom Sector');
    });

    it('should fallback to sectorId when getName is not available', () => {
      const sector = {
        getId: () => 's-vip',
      };

      // No translation and no getName, should use getId()
      expect(getSectorLabel(sector)).toBe('s-vip');
    });

    it('should handle sector object with sectorId property', () => {
      const sector = {
        sectorId: 's-a1',
        sectorName: 'A1',
      };

      // A1 has translation in both languages
      expect(getSectorLabel(sector)).toBe('A1');

      i18n.setLocale('zh');
      // s-a1 doesn't have Chinese translation, falls back to sectorName
      expect(getSectorLabel(sector)).toBe('A1');
    });

    it('should handle sector object with only sectorId', () => {
      const sector = {
        sectorId: 's-middle',
      };

      expect(getSectorLabel(sector)).toBe('Middle');

      i18n.setLocale('zh');
      expect(getSectorLabel(sector)).toBe('中排');
    });

    it('should handle empty/null sector gracefully', () => {
      expect(getSectorLabel(null)).toBe('');
      expect(getSectorLabel(undefined)).toBe('');
      expect(getSectorLabel({})).toBe('');
    });

    it('should handle sector with empty id and name', () => {
      const sector = {
        getId: () => '',
        getName: () => '',
      };

      expect(getSectorLabel(sector)).toBe('');
    });

    it('should prioritize getId over sectorId', () => {
      const sector = {
        getId: () => 's-front',
        sectorId: 's-back',
        getName: () => 'front',
        sectorName: 'back',
      };

      // Should use getId() result
      expect(getSectorLabel(sector)).toBe('Front');
    });

    it('should prioritize getName over sectorName', () => {
      const sector = {
        getId: () => 's-custom',
        getName: () => 'From getName',
        sectorName: 'From sectorName',
      };

      // Should use getName() as fallback
      expect(getSectorLabel(sector)).toBe('From getName');
    });

    it('should work with all translatable sectors in English', () => {
      const sectors = [
        { getId: () => 's-front', getName: () => 'front' },
        { getId: () => 's-middle', getName: () => 'middle' },
        { getId: () => 's-back', getName: () => 'back' },
      ];

      expect(getSectorLabel(sectors[0])).toBe('Front');
      expect(getSectorLabel(sectors[1])).toBe('Middle');
      expect(getSectorLabel(sectors[2])).toBe('Back');
    });

    it('should work with all translatable sectors in Chinese', () => {
      i18n.setLocale('zh');

      const sectors = [
        { getId: () => 's-front', getName: () => 'front' },
        { getId: () => 's-middle', getName: () => 'middle' },
        { getId: () => 's-back', getName: () => 'back' },
      ];

      expect(getSectorLabel(sectors[0])).toBe('前排');
      expect(getSectorLabel(sectors[1])).toBe('中排');
      expect(getSectorLabel(sectors[2])).toBe('后排');
    });

    it('should update label when locale changes', () => {
      const sector = {
        getId: () => 's-front',
        getName: () => 'front',
      };

      expect(getSectorLabel(sector)).toBe('Front');

      i18n.setLocale('zh');
      expect(getSectorLabel(sector)).toBe('前排');

      i18n.setLocale('en');
      expect(getSectorLabel(sector)).toBe('Front');
    });

    it('should handle non-existent translation keys gracefully', () => {
      const sector = {
        getId: () => 's-nonexistent',
        getName: () => 'My Custom Sector',
      };

      // Falls back to getName
      expect(getSectorLabel(sector)).toBe('My Custom Sector');
    });

    it('should use getId as final fallback when no name available', () => {
      const sector = {
        getId: () => 's-orphan',
      };

      expect(getSectorLabel(sector)).toBe('s-orphan');
    });
  });
});
