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
import { UserFeedback } from './ui/UserFeedback.js';
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
  const sectorsList = document.getElementById('sectors-list');
  const feedbackEl = document.getElementById('app-feedback');
  const feedback = feedbackEl ? new UserFeedback({ container: feedbackEl }) : null;

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
          if (event.action === 'SEAT_RESERVED') {
            feedback?.show({
              messageKey: 'feedback.seatSelected',
              params: { row: event.row, seat: event.seat },
              type: 'info',
            });
          } else if (event.action === 'SEAT_RESERVATION_RELEASED') {
            feedback?.show({
              messageKey: 'feedback.seatReleased',
              params: { row: event.row, seat: event.seat },
              type: 'info',
            });
          } else if (event.action === 'NO_SERVICE') {
            feedback?.show({ messageKey: 'feedback.noService', type: 'error' });
          }
        },
      })
    : null;

  new CookieBanner({
    adapter: storage,
    onAccept: () => persist(storage, app),
  }).mount();

  renderServiceSelect(app, serviceSelect);
  renderCurrentServiceForm(app, serviceName, servicePrice);
  renderSectorsList(app, sectorsList);
  seatRenderer?.renderAllSectors();
  orderRenderer?.refresh();

  sectorsList?.addEventListener('change', (event) => {
    const input = event.target.closest?.('[data-sector-multiplier-id]');
    if (!input || !sectorsList.contains(input)) return;

    const value = Number(input.value);
    
    // Validate: must be a finite number >= 0.1
    if (!Number.isFinite(value) || value < 0.1) {
      input.setAttribute('aria-invalid', 'true');
      // Restore to previous valid value or default
      const sector = app.getSectorsArray().find((item) => item.getId() === input.dataset.sectorMultiplierId);
      if (sector) {
        input.value = String(sector.getPriceMultiplier());
      }
      feedback?.show({ messageKey: 'feedback.invalidMultiplier', type: 'error' });
      return;
    }

    // Round to 1 decimal place
    const roundedValue = Math.round(value * 10) / 10;
    input.value = String(roundedValue);
    input.removeAttribute('aria-invalid');
    
    const sector = app.getSectorsArray().find((item) => item.getId() === input.dataset.sectorMultiplierId);
    if (!sector) return;
    sector.setPriceMultiplier(roundedValue);
    app.setPriceMultipliersArray();
    seatRenderer?.refresh();
    orderRenderer?.refresh();
  });

  serviceSelect?.addEventListener('change', () => {
    app.setCurrentServiceId(serviceSelect.value);
    clearErrors(errorsEl);
    renderCurrentServiceForm(app, serviceName, servicePrice);
    seatRenderer?.refresh();
    orderRenderer?.refresh();
    const name = app.getCurrentService()?.getName();
    if (name) {
      feedback?.show({ messageKey: 'feedback.serviceSwitched', params: { name }, type: 'info' });
    }
  });

  addButton?.addEventListener('click', () => {
    const result = readServiceForm(serviceName, servicePrice, app.getServicesArray());
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
    feedback?.show({
      messageKey: 'feedback.serviceAdded',
      params: { name: service.getName() },
      type: 'success',
    });
  });

  updateButton?.addEventListener('click', () => {
    const service = app.getCurrentService();
    if (!service) {
      showErrors(errorsEl, ['errors.noService']);
      return;
    }
    const result = readServiceForm(serviceName, servicePrice, app.getServicesArray(), service.getId());
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
    feedback?.show({
      messageKey: 'feedback.serviceUpdated',
      params: { name: service.getName() },
      type: 'success',
    });
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
    feedback?.show({
      messageKey: 'feedback.serviceDeleted',
      params: { name: removedService.serviceName },
      type: 'success',
    });
  });

  bookButton?.addEventListener('click', () => {
    const service = app.getCurrentService();
    if (!service) {
      feedback?.show({ messageKey: 'feedback.noService', type: 'error' });
      return;
    }
    const reservedCount = service.getReservedSeats().length;
    if (reservedCount === 0) {
      feedback?.show({ messageKey: 'feedback.bookingEmpty', type: 'error' });
      return;
    }
    const bookedSeats = service.bookSeats();
    if (bookedSeats.length > 0) {
      auditLogger.log('SEATS_BOOKED', {
        serviceId: service.getId(),
        seats: bookedSeats,
      });
      feedback?.show({
        messageKey: 'feedback.bookingSuccess',
        params: { count: bookedSeats.length },
        type: 'success',
      });
      pulseBookedSeats(bookedSeats);
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
    renderSectorsList(app, sectorsList);
    seatRenderer?.refresh();
    orderRenderer?.refresh();
  });
}

function createDefaultApp() {
  const app = new SeatBookingApp('showingRoom1');
  app.addSector(new Sector('A1', 1, 20, 20));
  app.addSector(new Sector('A2', 1.2, 20, 20, 20));
  app.addSector(new Sector('B1', 1.2, 20, 20, 20, 20));
  app.addSector(new Sector('B1L', 1.4, 1, 1, 1, 1, 1, 1));
  app.addSector(new Sector('B2L', 1.4, 1, 1, 1, 1, 1, 1));
  app.addSector(new Sector('C1L', 1.5, 12));

  const demo = new Service('Demo Movie', 45, { id: 'svc-demo' });
  demo.setBookedSeatsArray([
    's-a1-r2-s5',
    's-a1-r2-s6',
    's-a1-r2-s7',
    's-a1-r2-s8',
    's-a1-r2-s9',
    's-a2-r1-s3',
    's-a2-r1-s5',
    's-a2-r1-s7',
  ]);
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

function readServiceForm(nameInput, priceInput, existingServices = [], excludeServiceId = null) {
  const servicesToCheck = excludeServiceId
    ? existingServices.filter(s => s.getId() !== excludeServiceId)
    : existingServices;
    
  return validateService({
    name: nameInput?.value ?? '',
    price: priceInput?.value ?? '',
  }, servicesToCheck);
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

function pulseBookedSeats(seatIds) {
  seatIds.forEach((seatId) => {
    const button = document.querySelector(`[data-seat-id="${seatId}"]`);
    if (!button) return;
    button.classList.add('seat--just-booked');
    window.setTimeout(() => button.classList.remove('seat--just-booked'), 700);
  });
}

function renderSectorsList(app, list = document.getElementById('sectors-list')) {
  if (!list) return;
  list.innerHTML = '';
  app.getSectorsArray().forEach((sector) => {
    const item = document.createElement('li');
    item.setAttribute('role', 'listitem');
    const name = document.createElement('span');
    name.textContent = getSectorLabel(sector);
    const multiplier = document.createElement('input');
    multiplier.className = 'sectors__multiplier';
    multiplier.type = 'number';
    multiplier.min = '0.1';
    multiplier.step = '0.1';
    multiplier.value = String(sector.getPriceMultiplier());
    multiplier.dataset.sectorMultiplierId = sector.getId();
    multiplier.setAttribute('aria-label', `${getSectorLabel(sector)} price multiplier`);
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
