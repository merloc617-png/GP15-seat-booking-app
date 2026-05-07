import './styles/main.css';

import { Sector } from './core/Sector.js';
import { SeatBookingApp } from './core/SeatBookingApp.js';
import { Service } from './core/Service.js';
import { LocalStorageAdapter } from './storage/LocalStorageAdapter.js';
import { validateService } from './validation/validators.js';
import * as i18n from './i18n/i18n.js';
import { SeatRenderer } from './ui/SeatRenderer.js';
import { OrderRenderer } from './ui/OrderRenderer.js';
import { SettingsRenderer } from './ui/SettingsRenderer.js';
import { CookieBanner } from './ui/CookieBanner.js';
import { LanguageSwitcher } from './ui/LanguageSwitcher.js';

import enLocale from './i18n/locales/en.json';
import zhLocale from './i18n/locales/zh.json';

async function bootstrap() {
  /* ---------------- i18n ---------------- */
  i18n.init({
    resources: { en: enLocale, zh: zhLocale },
    defaultLocale: navigator.language.startsWith('zh') ? 'zh' : 'en',
    fallback: 'en',
    storage: window.localStorage,
  });

  /* ---------------- domain state ---------------- */
  const app = new SeatBookingApp('showingRoom1');
  app.addSector(new Sector('A1', 1.0, 20, 20));
  app.addSector(new Sector('A2', 1.2, 20, 20, 20));
  app.addSector(new Sector('B1', 1.2, 20, 20, 20, 20));
  app.addSector(new Sector('B1L', 1.4, 1, 1, 1, 1, 1, 1));
  app.addSector(new Sector('B2L', 1.4, 1, 1, 1, 1, 1, 1));
  app.addSector(new Sector('C1L', 1.5, 12));
  app.setPriceMultipliersArray();

  /* ---------------- storage (consent-gated) ---------------- */
  const storage = new LocalStorageAdapter({ namespace: 'sba' });
  if (storage.isEnabled()) {
    app.loadServicesFromData(storage.loadServices(app.getName()));
  }

  /* ---------------- DOM refs ---------------- */
  const $ = (id) => document.getElementById(id);
  const seatsEl = $('seats');
  const dropdown = $('services-list');
  const nameInput = $('service-name');
  const priceInput = $('service-price');
  const sectorsList = $('sectors-list');
  const errorRegion = $('settings-errors');
  const orderList = $('order-details');
  const totalEl = $('order-total-price');
  const langBtn = $('lang-toggle');

  /* ---------------- renderers ---------------- */
  const settingsRenderer = new SettingsRenderer({
    dropdown, nameInput, priceInput, sectorsList, errorRegion, getApp: () => app,
  });

  const orderRenderer = new OrderRenderer({
    list: orderList, totalContainer: totalEl, getApp: () => app,
  });

  const seatRenderer = new SeatRenderer({
    container: seatsEl, getApp: () => app, onChange: () => orderRenderer.refresh(),
  });

  function renderAll() {
    settingsRenderer.refreshAll();
    seatRenderer.renderAllSectors();
    orderRenderer.refresh();
    i18n.applyTranslations(document);
  }

  /* ---------------- consent UI ---------------- */
  new CookieBanner({
    adapter: storage,
    onAccept: () => {
      const res = storage.saveServices(app.getName(), app.getServicesArray().map((s) => s.toJSON()));
      if (!res.ok) console.warn('Storage save failed:', res.reason);
    },
  }).mount();

  /* ---------------- language switcher ---------------- */
  new LanguageSwitcher({
    button: langBtn,
    locales: ['en', 'zh'],
    labels: { en: 'English', zh: '中文' },
  }).mount();

  i18n.onChange(() => {
    i18n.applyTranslations(document);
    seatRenderer.refresh();
    orderRenderer.refresh();
  });

  /* ---------------- input event wiring ---------------- */
  dropdown.addEventListener('change', (e) => {
    app.setCurrentServiceId(e.target.value);
    settingsRenderer.renderCurrentServiceData();
    seatRenderer.refresh();
    orderRenderer.refresh();
  });

  $('service-add-btn').addEventListener('click', (e) => {
    e.preventDefault();
    const payload = { name: nameInput.value, price: priceInput.value };
    const res = validateService(payload);
    if (!res.ok) {
      settingsRenderer.showErrors(res.errors);
      return;
    }
    settingsRenderer.clearErrors();
    const svc = new Service(res.value.name, res.value.price);
    app.addService(svc);
    app.setCurrentServiceId(svc.getId());
    persist(storage, app);
    renderAll();
  });

  $('service-update-btn').addEventListener('click', (e) => {
    e.preventDefault();
    const current = app.getCurrentService();
    if (!current) {
      settingsRenderer.showErrors(['errors.noService']);
      return;
    }
    const res = validateService({ name: nameInput.value, price: priceInput.value });
    if (!res.ok) {
      settingsRenderer.showErrors(res.errors);
      return;
    }
    settingsRenderer.clearErrors();
    current.setName(res.value.name);
    current.setPrice(res.value.price);
    persist(storage, app);
    renderAll();
  });

  $('service-delete-btn').addEventListener('click', (e) => {
    e.preventDefault();
    const id = app.getCurrentServiceId();
    if (!id) {
      settingsRenderer.showErrors(['errors.noService']);
      return;
    }
    settingsRenderer.clearErrors();
    app.removeServiceById(id);
    persist(storage, app);
    renderAll();
  });

  $('book-seats-btn').addEventListener('click', (e) => {
    e.preventDefault();
    const current = app.getCurrentService();
    if (!current) {
      settingsRenderer.showErrors(['errors.noService']);
      return;
    }
    current.bookSeats();
    persist(storage, app);
    renderAll();
  });

  /* initial paint */
  renderAll();
}

function persist(storage, app) {
  if (!storage.isEnabled()) return;
  const res = storage.saveServices(
    app.getName(),
    app.getServicesArray().map((s) => s.toJSON()),
  );
  if (!res.ok) console.warn('Storage save failed:', res.reason);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
