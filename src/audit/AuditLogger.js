const DEFAULT_NAMESPACE = 'sba';
const DEFAULT_MAX_ENTRIES = 100;

export class AuditLogger {
  /**
   * @param {{
   *   storage?: Storage|null,
   *   namespace?: string,
   *   userId?: string,
   *   sessionId?: string,
   *   maxEntries?: number,
   *   now?: () => Date,
   *   console?: Pick<Console, 'warn'>|null,
   * }} [opts]
   */
  constructor(opts = {}) {
    this._storage =
      Object.prototype.hasOwnProperty.call(opts, 'storage') ? opts.storage : typeof window !== 'undefined' ? window.localStorage : null;
    this._namespace = opts.namespace || DEFAULT_NAMESPACE;
    this._userId = opts.userId || 'anonymous';
    this._sessionId = opts.sessionId || createSessionId();
    this._maxEntries = normalizeMaxEntries(opts.maxEntries);
    this._now = opts.now || (() => new Date());
    this._console = Object.prototype.hasOwnProperty.call(opts, 'console') ? opts.console : typeof console !== 'undefined' ? console : null;
    this._logs = this._readStoredLogs();
  }

  /**
   * @param {string} action
   * @param {Record<string, unknown>} [details]
   * @returns {{ timestamp: string, action: string, userId: string, sessionId: string, details: Record<string, unknown> }}
   */
  log(action, details = {}) {
    const entry = {
      timestamp: this._now().toISOString(),
      action: String(action || 'UNKNOWN_ACTION'),
      userId: this._userId,
      sessionId: this._sessionId,
      details: sanitizeDetails(details),
    };

    this._logs.push(entry);
    this._logs = this._logs.slice(-this._maxEntries);
    this._persist();
    return { ...entry, details: { ...entry.details } };
  }

  getEntries() {
    return this._logs.map((entry) => ({
      ...entry,
      details: { ...entry.details },
    }));
  }

  clear() {
    this._logs = [];
    if (!this._storage) return;
    try {
      this._storage.removeItem(this._key());
    } catch (error) {
      this._warn('Audit log clear failed:', error);
    }
  }

  _readStoredLogs() {
    if (!this._storage) return [];
    try {
      const raw = this._storage.getItem(this._key());
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(isAuditEntry).slice(-this._maxEntries) : [];
    } catch (error) {
      this._warn('Audit log read failed:', error);
      return [];
    }
  }

  _persist() {
    if (!this._storage) return;
    try {
      this._storage.setItem(this._key(), JSON.stringify(this._logs));
    } catch (error) {
      this._warn('Audit log save failed:', error);
    }
  }

  _key() {
    return `${this._namespace}:auditTrail`;
  }

  _warn(...args) {
    this._console?.warn?.(...args);
  }
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `session-${crypto.randomUUID()}`;
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMaxEntries(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_MAX_ENTRIES;
}

function sanitizeDetails(details) {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return {};
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined && typeof value !== 'function'),
  );
}

function isAuditEntry(entry) {
  return (
    entry &&
    typeof entry === 'object' &&
    typeof entry.timestamp === 'string' &&
    typeof entry.action === 'string' &&
    typeof entry.userId === 'string' &&
    typeof entry.sessionId === 'string' &&
    entry.details &&
    typeof entry.details === 'object' &&
    !Array.isArray(entry.details)
  );
}
