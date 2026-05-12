import './styles/main.css';

import * as i18n from './i18n/i18n.js';
import enLocale from './i18n/locales/en.json';
import zhLocale from './i18n/locales/zh.json';
import { getSectorLabel } from './i18n/sectorLabels.js';
import { AuditLogger } from './audit/AuditLogger.js';
import { SeatBookingApp } from './core/SeatBookingApp.js';
import { Sector } from './core/Sector.js';
import { Service } from './core/Service.js';
import { LocalStorageAdapter } from './storage/LocalStorageAdapter.js';
import { CookieBanner } from './ui/CookieBanner.js';
import { LanguageSwitcher } from './ui/LanguageSwitcher.js';
import { OrderRenderer } from './ui/OrderRenderer.js';
import { SeatRenderer } from './ui/SeatRenderer.js';
import { ThemeSwitcher } from './ui/ThemeSwitcher.js';
import { validateService } from './validation/validators.js';

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

  const app = createDefaultApp();

  const storage = new LocalStorageAdapter({ namespace: 'sba' });
  if (storage.isEnabled()) {
    app.loadServicesFromData(storage.loadServices(app.getName()));
  }

  const auditLogger = new AuditLogger({
    storage: typeof window !== 'undefined' ? window.localStorage : null,
    namespace: app.getName(),
  });
  const seatsEl = document.getElementById('seats');
  const orderList = document.getElementById('order-details');
  const orderTotal = document.getElementById('order-total-price');
  const serviceSelect = document.getElementById('services-list');
  const serviceName = document.getElementById('service-name');
  const servicePrice = document.getElementById('service-price');
  const bookButton = document.getElementById('book-seats-btn');
  const addButton = document.getElementById('service-add-btn');
  const updateButton = document.getElementById('service-update-btn');
  const deleteButton = document.getElementById('service-delete-btn');
  const errorsEl = document.getElementById('settings-errors');

  const orderRenderer =
    orderList && orderTotal
      ? new OrderRenderer({
          list: orderList,
          totalContainer: orderTotal,
          getApp: () => app,
        })
      : null;

  const seatRenderer = seatsEl
    ? new SeatRenderer({
        container: seatsEl,
        getApp: () => app,
        onChange: (event) => {
          auditLogger.log(event.action, {
            serviceId: event.serviceId,
            seatId: event.seatId,
          });
          orderRenderer?.refresh();
        },
      })
    : null;

  new CookieBanner({
    adapter: storage,
    onAccept: () => persist(storage, app),
  }).mount();

  renderServiceSelect(app, serviceSelect);
  renderCurrentServiceForm(app, serviceName, servicePrice);
  renderSectorsList(app);
  seatRenderer?.renderAllSectors();
  orderRenderer?.refresh();

  serviceSelect?.addEventListener('change', () => {
    app.setCurrentServiceId(serviceSelect.value);
    clearErrors(errorsEl);
    renderCurrentServiceForm(app, serviceName, servicePrice);
    seatRenderer?.refresh();
    orderRenderer?.refresh();
  });

  addButton?.addEventListener('click', () => {
    const result = readServiceForm(serviceName, servicePrice);
    if (!result.ok) {
      showErrors(errorsEl, result.errors);
      return;
    }
    const service = new Service(result.value.name, result.value.price);
    app.addService(service);
    app.setCurrentServiceId(service.getId());
    auditLogger.log('SERVICE_CREATED', {
      serviceId: service.getId(),
      serviceName: service.getName(),
      price: service.getPrice(),
    });
    persist(storage, app);
    refreshUi(app, { serviceSelect, serviceName, servicePrice, seatRenderer, orderRenderer });
    clearErrors(errorsEl);
  });

  updateButton?.addEventListener('click', () => {
    const service = app.getCurrentService();
    if (!service) {
      showErrors(errorsEl, ['errors.noService']);
      return;
    }
    const result = readServiceForm(serviceName, servicePrice);
    if (!result.ok) {
      showErrors(errorsEl, result.errors);
      return;
    }
    const before = {
      serviceName: service.getName(),
      price: service.getPrice(),
    };
    service.setName(result.value.name);
    service.setPrice(result.value.price);
    auditLogger.log('SERVICE_UPDATED', {
      serviceId: service.getId(),
      before,
      after: {
        serviceName: service.getName(),
        price: service.getPrice(),
      },
    });
    persist(storage, app);
    refreshUi(app, { serviceSelect, serviceName, servicePrice, seatRenderer, orderRenderer });
    clearErrors(errorsEl);
  });

  deleteButton?.addEventListener('click', () => {
    const service = app.getCurrentService();
    if (!service) {
      showErrors(errorsEl, ['errors.noService']);
      return;
    }
    const removedService = {
      serviceId: service.getId(),
      serviceName: service.getName(),
      price: service.getPrice(),
      bookedSeats: service.getBookedSeats(),
      reservedSeats: service.getReservedSeats(),
    };
    app.removeServiceById(service.getId());
    auditLogger.log('SERVICE_DELETED', removedService);
    persist(storage, app);
    refreshUi(app, { serviceSelect, serviceName, servicePrice, seatRenderer, orderRenderer });
    clearErrors(errorsEl);
  });

  bookButton?.addEventListener('click', () => {
    const service = app.getCurrentService();
    const bookedSeats = service?.bookSeats() ?? [];
    if (service && bookedSeats.length > 0) {
      auditLogger.log('SEATS_BOOKED', {
        serviceId: service.getId(),
        seats: bookedSeats,
      });
    }
    persist(storage, app);
    seatRenderer?.refresh();
    orderRenderer?.refresh();
  });

  i18n.applyTranslations(document);

  const langBtn = document.getElementById('lang-toggle');
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    new ThemeSwitcher({
      button: themeBtn,
      storage: typeof window !== 'undefined' ? window.localStorage : null,
    }).mount();
  }

  if (langBtn) {
    new LanguageSwitcher({
      button: langBtn,
      locales: ['en', 'zh'],
      labels: { en: 'English', zh: '中文' },
    }).mount();
  }

  i18n.onChange(() => {
    i18n.applyTranslations(document);
    renderSectorsList(app);
    seatRenderer?.refresh();
    orderRenderer?.refresh();
  });
}

function createDefaultApp() {
  const app = new SeatBookingApp('showingRoom1');
  app.addSector(new Sector('Front', 1, 8, 10, 10));
  app.addSector(new Sector('Middle', 1.2, 12, 12, 12, 12));
  app.addSector(new Sector('Back', 0.9, 10, 10, 8));

  const demo = new Service('Demo Movie', 45, { id: 'svc-demo' });
  demo.setBookedSeatsArray(['s-middle-r2-s6', 's-middle-r2-s7', 's-front-r1-s3']);
  app.addService(demo);
  return app;
}

function renderServiceSelect(app, select) {
  if (!select) return;
  select.innerHTML = '';
  app.getServicesArray().forEach((service) => {
    const option = document.createElement('option');
    option.value = service.getId();
    option.textContent = service.getName();
    option.selected = service.getId() === app.getCurrentServiceId();
    select.appendChild(option);
  });
}

function refreshUi(app, refs) {
  renderServiceSelect(app, refs.serviceSelect);
  renderCurrentServiceForm(app, refs.serviceName, refs.servicePrice);
  refs.seatRenderer?.refresh();
  refs.orderRenderer?.refresh();
}

function readServiceForm(nameInput, priceInput) {
  return validateService({
    name: nameInput?.value ?? '',
    price: priceInput?.value ?? '',
  });
}

function showErrors(container, errorKeys) {
  if (!container) return;
  container.innerHTML = '';
  const title = document.createElement('strong');
  title.textContent = i18n.t('errors.title');
  container.appendChild(title);

  const list = document.createElement('ul');
  errorKeys.forEach((key) => {
    const item = document.createElement('li');
    item.textContent = i18n.t(key);
    list.appendChild(item);
  });
  container.appendChild(list);
  container.hidden = false;
}

function clearErrors(container) {
  if (!container) return;
  container.hidden = true;
  container.innerHTML = '';
}

function renderCurrentServiceForm(app, nameInput, priceInput) {
  const service = app.getCurrentService();
  if (nameInput) nameInput.value = service?.getName() ?? '';
  if (priceInput) priceInput.value = service ? String(service.getPrice()) : '';
}

function renderSectorsList(app) {
  const list = document.getElementById('sectors-list');
  if (!list) return;
  list.innerHTML = '';
  app.getSectorsArray().forEach((sector) => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = getSectorLabel(sector);
    const multiplier = document.createElement('span');
    multiplier.textContent = `x${sector.getPriceMultiplier()}`;
    item.append(name, multiplier);
    list.appendChild(item);
  });
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
