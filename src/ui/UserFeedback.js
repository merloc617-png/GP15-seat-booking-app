import { t } from '../i18n/i18n.js';

const DEFAULT_DURATION_MS = 4500;

/**
 * Visible, non-blocking UX feedback (toast banner).
 * Complements inline validation (#settings-errors) for success and informational messages.
 */
export class UserFeedback {
  /**
   * @param {{ container: HTMLElement, durationMs?: number }} deps
   */
  constructor(deps) {
    this.container = deps.container;
    this.durationMs = deps.durationMs ?? DEFAULT_DURATION_MS;
    this.hideTimer = null;
  }

  /**
   * @param {{ messageKey: string, params?: Record<string, string | number>, type?: 'success' | 'error' | 'info' }} options
   */
  show({ messageKey, params = {}, type = 'info' }) {
    if (!this.container) return;
    const message = t(messageKey, params);
    this.container.textContent = message;
    this.container.className = `app-feedback app-feedback--${type} app-feedback--visible`;
    this.container.hidden = false;

    window.clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => this.hide(), this.durationMs);
  }

  hide() {
    if (!this.container) return;
    this.container.classList.remove('app-feedback--visible');
    this.container.hidden = true;
    this.container.textContent = '';
  }
}
