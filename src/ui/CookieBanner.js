import { t, applyTranslations, onChange as onLocaleChange } from '../i18n/i18n.js';

/**
 * Cookie/consent banner. Default = no consent (memory-only mode).
 * After accept, calls adapter.enable() and triggers a reload-of-data callback.
 */
export class CookieBanner {
  /**
   * @param {object} deps
   * @param {import('../storage/LocalStorageAdapter.js').LocalStorageAdapter} deps.adapter
   * @param {() => void} deps.onAccept
   * @param {() => void} deps.onReject
   */
  constructor({ adapter, onAccept, onReject }) {
    this._adapter = adapter;
    this._onAccept = onAccept || (() => {});
    this._onReject = onReject || (() => {});
    this._el = null;
  }

  mount(parent = document.body) {
    if (this._adapter.isEnabled()) return;
    if (this._isExplicitlyRejected()) return;
    this._el = this._build();
    parent.appendChild(this._el);
    applyTranslations(this._el);
    onLocaleChange(() => {
      if (this._el) applyTranslations(this._el);
    });
  }

  _isExplicitlyRejected() {
    try {
      return localStorage.getItem('sba-consent') === 'rejected';
    } catch {
      return false;
    }
  }

  _build() {
    const banner = document.createElement('aside');
    banner.id = 'cookie-banner';
    banner.classList.add('cookie-banner');
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-labelledby', 'cookie-banner-title');

    const title = document.createElement('h2');
    title.id = 'cookie-banner-title';
    title.classList.add('cookie-banner__title');
    title.setAttribute('data-i18n', 'consent.title');

    const body = document.createElement('p');
    body.classList.add('cookie-banner__body');
    const bodyText = document.createElement('span');
    bodyText.setAttribute('data-i18n', 'consent.body');
    body.appendChild(bodyText);
    body.appendChild(document.createTextNode(' '));
    const link = document.createElement('a');
    link.href = '/privacy.html';
    link.setAttribute('data-i18n', 'consent.privacyLink');
    body.appendChild(link);
    body.appendChild(document.createTextNode('.'));

    const actions = document.createElement('div');
    actions.classList.add('cookie-banner__actions');

    const accept = document.createElement('button');
    accept.type = 'button';
    accept.classList.add('btn', 'btn--primary');
    accept.setAttribute('data-i18n', 'consent.accept');
    accept.addEventListener('click', () => {
      this._adapter.enable();
      this._dismiss();
      this._onAccept();
    });

    const reject = document.createElement('button');
    reject.type = 'button';
    reject.classList.add('btn');
    reject.setAttribute('data-i18n', 'consent.reject');
    reject.addEventListener('click', () => {
      try {
        localStorage.setItem('sba-consent', 'rejected');
      } catch {
        /* private mode - ignore */
      }
      this._dismiss();
      this._onReject();
    });

    actions.append(accept, reject);
    banner.append(title, body, actions);
    return banner;
  }

  _dismiss() {
    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
      this._el = null;
    }
  }
}
