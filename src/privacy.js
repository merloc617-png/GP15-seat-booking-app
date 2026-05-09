import './styles/main.css';

import * as i18n from './i18n/i18n.js';
import { LanguageSwitcher } from './ui/LanguageSwitcher.js';
import enLocale from './i18n/locales/en.json';
import zhLocale from './i18n/locales/zh.json';

i18n.init({
  resources: { en: enLocale, zh: zhLocale },
  defaultLocale: 'en',
  fallback: 'en',
  storage: window.localStorage,
});

function refreshLocaleSpecificBlocks() {
  const locale = i18n.getLocale();
  document.querySelectorAll('[data-locale]').forEach((el) => {
    el.hidden = el.getAttribute('data-locale') !== locale;
  });
}

i18n.applyTranslations(document);
refreshLocaleSpecificBlocks();

i18n.onChange(() => {
  i18n.applyTranslations(document);
  refreshLocaleSpecificBlocks();
});

const langBtn = document.getElementById('lang-toggle');
if (langBtn) {
  new LanguageSwitcher({
    button: langBtn,
    locales: ['en', 'zh'],
    labels: { en: 'English', zh: '中文' },
  }).mount();
}
