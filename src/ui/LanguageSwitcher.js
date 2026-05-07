import { getLocale, setLocale, applyTranslations, onChange } from '../i18n/i18n.js';

/**
 * A two-state language toggle. The button label always shows the *other*
 * language's name in its own script (so EN users see "中文", ZH users see "English").
 */
export class LanguageSwitcher {
  /**
   * @param {object} deps
   * @param {HTMLElement} deps.button
   * @param {string[]}    deps.locales  e.g. ['en', 'zh']
   * @param {Record<string,string>} [deps.labels]  locale->display label
   */
  constructor({ button, locales, labels }) {
    this._button = button;
    this._locales = locales;
    this._labels = labels || { en: 'English', zh: '中文' };
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
    this._button.setAttribute('aria-label', `Switch language to ${this._labels[other] || other}`);
  }
}
