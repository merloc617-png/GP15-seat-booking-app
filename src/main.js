import './styles/main.css';

import * as i18n from './i18n/i18n.js';
import enLocale from './i18n/locales/en.json';
import zhLocale from './i18n/locales/zh.json';
import { LanguageSwitcher } from './ui/LanguageSwitcher.js';
import { SeatBookingApp } from './core/SeatBookingApp.js';

/**
 * 最小启动：i18n + 语言切换 + 座位区占位文案。
 * TODO: 注入 LocalStorageAdapter、CookieBanner、SettingsRenderer / SeatRenderer / OrderRenderer，
 *       并绑定 #services-list、表单按钮、#book-seats-btn（逻辑可参考仓库内 new-seat-booking）。
 */
function bootstrap() {
  i18n.init({
    resources: { en: enLocale, zh: zhLocale },
    defaultLocale:
      typeof navigator !== 'undefined' && String(navigator.language || '').toLowerCase().startsWith('zh')
        ? 'zh'
        : 'en',
    fallback: 'en',
    storage: typeof window !== 'undefined' ? window.localStorage : null,
  });

  const seatsEl = document.getElementById('seats');
  if (seatsEl) {
    seatsEl.innerHTML = '<p class="skeleton-banner" data-i18n="skeleton.notice"></p>';
  }

  i18n.applyTranslations(document);

  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    new LanguageSwitcher({
      button: langBtn,
      locales: ['en', 'zh'],
      labels: { en: 'English', zh: '中文' },
    }).mount();
  }

  i18n.onChange(() => {
    i18n.applyTranslations(document);
  });

  const app = new SeatBookingApp('showingRoom1');
  void app;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
