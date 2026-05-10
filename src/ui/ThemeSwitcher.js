const STORAGE_KEY = 'sba-theme';
const THEMES = ['light', 'dark'];

export class ThemeSwitcher {
  /**
   * @param {{ button: HTMLElement, storage?: Storage|null }} deps
   */
  constructor(deps) {
    this._button = deps.button;
    this._storage =
      Object.prototype.hasOwnProperty.call(deps, 'storage') ? deps.storage : typeof window !== 'undefined' ? window.localStorage : null;
  }

  mount() {
    this._setTheme(this._getInitialTheme(), { persist: false });
    this._button.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      this._setTheme(next);
    });
  }

  _getInitialTheme() {
    try {
      const saved = this._storage?.getItem(STORAGE_KEY);
      if (THEMES.includes(saved)) return saved;
    } catch {
      /* Ignore storage access errors. */
    }

    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  _setTheme(theme, opts = {}) {
    const next = THEMES.includes(theme) ? theme : 'light';
    document.documentElement.dataset.theme = next;
    this._button.dataset.theme = next;
    this._button.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    this._button.setAttribute('title', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');

    if (opts.persist === false) return;
    try {
      this._storage?.setItem(STORAGE_KEY, next);
    } catch {
      /* Ignore storage access errors. */
    }
  }
}
