/**
 * Tiny i18n module - no dependencies.
 *
 * Public API:
 *   init({ resources, defaultLocale, storage })
 *   t(key, vars?)
 *   setLocale(locale)
 *   getLocale()
 *   onChange(cb) -> unsubscribe
 *   applyTranslations(root) - scans [data-i18n] and [data-i18n-attr]
 */

const state = {
    resources: {},
    locale: 'en',
    fallback: 'en',
    storage: null,
    listeners: new Set(),
};

const STORAGE_KEY = 'sba-locale';

/**
 * @param {{
 *   resources: Record<string, Record<string, string>>,
 *   defaultLocale?: string,
 *   fallback?: string,
 *   storage?: Storage|null,
 * }} options
 */
export function init(options = {}) {
    state.resources = options.resources || {};
    state.fallback = options.fallback || 'en';
    state.storage = options.storage === undefined ? null : options.storage;

    let initial = options.defaultLocale || state.fallback;
    if (state.storage) {
        try {
            const saved = state.storage.getItem(STORAGE_KEY);
            if (saved && state.resources[saved]) initial = saved;
        } catch {
            /* ignore */
        }
    }
    state.locale = state.resources[initial] ? initial : state.fallback;
}

export function getLocale() {
    return state.locale;
}

export function getAvailableLocales() {
    return Object.keys(state.resources);
}

export function setLocale(locale) {
    if (!state.resources[locale]) return false;
    state.locale = locale;
    if (state.storage) {
        try {
            state.storage.setItem(STORAGE_KEY, locale);
        } catch {
            /* ignore */
        }
    }
    state.listeners.forEach((cb) => {
        try {
            cb(locale);
        } catch {
            /* ignore listener errors */
        }
    });
    return true;
}

export function onChange(cb) {
    state.listeners.add(cb);
    return () => state.listeners.delete(cb);
}

/**
 * Translate a key. Falls back to fallback locale, then to the key itself.
 * Supports {placeholder} interpolation.
 * @param {string} key
 * @param {Record<string, string|number>} [vars]
 */
export function t(key, vars) {
    const dict = state.resources[state.locale] || {};
    const fallbackDict = state.resources[state.fallback] || {};
    let template = dict[key];
    if (template === undefined) template = fallbackDict[key];
    if (template === undefined) template = key;
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_, name) =>
        Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : `{${name}}`,
    );
}

/**
 * Walk the DOM under `root` and translate every element annotated with
 *  - data-i18n="key"          -> sets textContent
 *  - data-i18n-attr="attr:key" -> sets attribute (multiple comma-separated allowed)
 *  - data-i18n-html="key"     -> sets innerHTML (only safe pre-vetted strings)
 *  - data-i18n-meta="key"     -> sets meta content attribute
 *
 * @param {ParentNode} [root=document]
 */
export function applyTranslations(root) {
    const scope = root || (typeof document !== 'undefined' ? document : null);
    if (!scope) return;

    scope.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });

    scope.querySelectorAll('[data-i18n-attr]').forEach((el) => {
        const spec = el.getAttribute('data-i18n-attr') || '';
        spec.split(',').forEach((pair) => {
            const [attr, key] = pair.split(':').map((s) => s && s.trim());
            if (attr && key) el.setAttribute(attr, t(key));
        });
    });

    // Handle meta description translation
    scope.querySelectorAll('[data-i18n-meta]').forEach((el) => {
        const key = el.getAttribute('data-i18n-meta');
        if (key) {
            el.setAttribute('content', t(key));
        }
    });

    if (scope.documentElement) {
        scope.documentElement.setAttribute('lang', state.locale);
    } else if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('lang', state.locale);
    }
}

/* For tests only */
export function _resetForTests() {
    state.resources = {};
    state.locale = 'en';
    state.fallback = 'en';
    state.storage = null;
    state.listeners.clear();
}
