/**
 * LocalStorageAdapter - the only module that touches `localStorage`.
 *
 * Two responsibilities cleanly separated from domain logic:
 *   1. Defensive I/O (try/catch around JSON.parse and setItem, quota handling).
 *   2. Consent gating (GDPR/PECR): nothing is persisted until the user has
 *      explicitly opted in via the cookie banner.
 */
const CONSENT_KEY = 'sba-consent';

export class LocalStorageAdapter {
  /**
   * @param {object} [opts]
   * @param {Storage} [opts.storage]   inject for testing (defaults to window.localStorage)
   * @param {string}  [opts.namespace] key prefix
   */
  constructor(opts = {}) {
    this._storage = Object.prototype.hasOwnProperty.call(opts, 'storage')
        ? opts.storage
        : (typeof window !== 'undefined' ? window.localStorage : null);
    this._namespace = opts.namespace || 'sba';
    this._enabled = this._readConsent();
  }

  _readConsent() {
    if (!this._storage) return false;
    try {
      return this._storage.getItem(CONSENT_KEY) === 'granted';
    } catch {
      return false;
    }
  }

  /** Has the user opted in? */
  isEnabled() {
    return this._enabled;
  }

  /** Grant consent and unlock writes. */
  enable() {
    this._enabled = true;
    if (!this._storage) return;
    try {
      this._storage.setItem(CONSENT_KEY, 'granted');
    } catch {
      /* swallow quota / privacy-mode errors */
    }
  }

  /** Withdraw consent and clear any persisted data for this namespace. */
  disable() {
    this._enabled = false;
    if (!this._storage) return;
    try {
      const toRemove = [];
      for (let i = 0; i < this._storage.length; i++) {
        const k = this._storage.key(i);
        if (k && (k.startsWith(`${this._namespace}-`) || k === CONSENT_KEY)) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => this._storage.removeItem(k));
    } catch {
      /* ignore */
    }
  }

  _key(suffix) {
    return `${this._namespace}-${suffix}`;
  }

  /**
   * Persist services for the named app instance. No-op without consent.
   * @returns {{ ok: boolean, reason?: string }}
   */
  saveServices(appName, services) {
    if (!this._enabled) return { ok: false, reason: 'no-consent' };
    if (!this._storage) return { ok: false, reason: 'no-storage' };
    try {
      const payload = JSON.stringify(services);
      this._storage.setItem(this._key(`services-${appName}`), payload);
      return { ok: true };
    } catch (err) {
      const reason =
          err && err.name === 'QuotaExceededError' ? 'quota-exceeded' : 'io-error';
      return { ok: false, reason };
    }
  }

  /**
   * Read services list. Returns [] for any error state (corrupt JSON,
   * missing key, blocked storage).
   */
  loadServices(appName) {
    if (!this._storage) return [];
    let raw;
    try {
      raw = this._storage.getItem(this._key(`services-${appName}`));
    } catch {
      return [];
    }
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
