import { getLocale, setLocale, applyTranslations, onChange } from '../i18n/i18n.js';

/**
 * 语言切换按钮。
 * TODO: 可改为下拉或多语言列表；完善 aria。
 */
export class LanguageSwitcher {
  /**
   * @param {{ button: HTMLElement, locales: string[], labels?: Record<string, string> }} deps
   */
  constructor(deps) {
    this._button = deps.button;
    this._locales = deps.locales;
    this._labels = deps.labels || { en: 'English', zh: '中文' };
  }

  mount() {
    this._button.addEventListener('click', () => {
      const idx = this._locales.indexOf(getLocale());
      const next = this._locales[(idx + 1) % this._locales.length];
      setLocale(next);
      applyTranslations(document);
      this._refreshLabel();
    });
    onChange(() => this._refreshLabel());
    this._refreshLabel();
  }

  _refreshLabel() {
    const idx = this._locales.indexOf(getLocale());
    const other = this._locales[(idx + 1) % this._locales.length];
    this._button.textContent = this._labels[other] || other;
  }
}
