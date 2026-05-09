/**
 * Cookie / 本地存储同意横幅。
 * TODO: 接入 LocalStorageAdapter.enable/disable，文案与 privacy 页一致。
 */
export class CookieBanner {
  /**
   * @param {{ adapter: import('../storage/LocalStorageAdapter.js').LocalStorageAdapter, onAccept?: () => void, onReject?: () => void }} _deps
   */
  constructor(_deps) {
    // TODO
  }

  /** @param {ParentNode} [_parent] */
  mount(_parent = document.body) {
    // TODO: 未同意时挂载横幅；已同意则 no-op
  }
}
