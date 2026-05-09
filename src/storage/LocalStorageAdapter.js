/**
 * 本地存储适配器（唯一接触 localStorage 的模块）。
 * TODO: 同意门控、读写服务列表、配额与 try/catch。
 */
export class LocalStorageAdapter {
  /** @param {{ storage?: Storage|null, namespace?: string }} [opts] */
  constructor(opts = {}) {
    this._storage =
      Object.prototype.hasOwnProperty.call(opts, 'storage') ? opts.storage : typeof window !== 'undefined' ? window.localStorage : null;
    this._namespace = opts.namespace || 'sba';
  }

  isEnabled() {
    // TODO: 读取同意状态
    return false;
  }

  enable() {
    // TODO
  }

  disable() {
    // TODO
  }

  /** @returns {{ ok: boolean, reason?: string }} */
  saveServices(_appName, _services) {
    // TODO
    return { ok: false, reason: 'skeleton-not-implemented' };
  }

  /** @param {string} _appName */
  loadServices(_appName) {
    // TODO
    return [];
  }
}
