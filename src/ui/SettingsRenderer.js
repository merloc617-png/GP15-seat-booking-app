import { t } from '../i18n/i18n.js';

/**
 * Renders the settings panel: services dropdown, current-service form,
 * sector multipliers list, and a live error region.
 */
export class SettingsRenderer {
  /**
   * @param {object} deps
   * @param {HTMLSelectElement} deps.dropdown
   * @param {HTMLInputElement}  deps.nameInput
   * @param {HTMLInputElement}  deps.priceInput
   * @param {HTMLElement}       deps.sectorsList
   * @param {HTMLElement}       deps.errorRegion  aria-live="polite"
   * @param {() => import('../core/SeatBookingApp.js').SeatBookingApp} deps.getApp
   */
  constructor({ dropdown, nameInput, priceInput, sectorsList, errorRegion, getApp }) {
    this._dropdown = dropdown;
    this._nameInput = nameInput;
    this._priceInput = priceInput;
    this._sectorsList = sectorsList;
    this._errorRegion = errorRegion;
    this._getApp = getApp;
  }

  renderServicesList() {
    const app = this._getApp();
    const services = app.getServicesArray();
    const currentId = app.getCurrentServiceId();

    this._dropdown.innerHTML = '';
    if (services.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '—';
      opt.disabled = true;
      opt.selected = true;
      this._dropdown.appendChild(opt);
      this._dropdown.disabled = true;
    } else {
      this._dropdown.disabled = false;
      for (const svc of services) {
        const opt = document.createElement('option');
        opt.value = svc.getId();
        opt.textContent = svc.getName();
        if (svc.getId() === currentId) opt.selected = true;
        this._dropdown.appendChild(opt);
      }
      if (!app.getCurrentService() && services.length > 0) {
        app.setCurrentServiceId(services[0].getId());
        this._dropdown.value = services[0].getId();
      }
    }
  }

  renderCurrentServiceData() {
    const app = this._getApp();
    const current = app.getCurrentService();
    if (current) {
      this._nameInput.value = current.getName();
      this._priceInput.value = current.getPrice();
    } else {
      this._nameInput.value = '';
      this._priceInput.value = '';
    }
  }

  renderSectorsList() {
    this._sectorsList.innerHTML = '';
    const multipliers = this._getApp().getPriceMultipliersArray();
    for (const m of multipliers) {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = m.sector;
      const price = document.createElement('input');
      price.type = 'number';
      price.step = '0.1';
      price.min = '0';
      price.id = `price-${m.sector}`;
      price.value = m.priceMultiplier;
      const label = document.createElement('label');
      label.classList.add('sr-only');
      label.setAttribute('for', price.id);
      label.textContent = `${m.sector} multiplier`;
      li.append(name, label, price);
      this._sectorsList.appendChild(li);
    }
  }

  /**
   * Show validation errors in an aria-live region.
   * @param {string[]} errorKeys i18n keys
   */
  showErrors(errorKeys) {
    this._errorRegion.innerHTML = '';
    if (!errorKeys || errorKeys.length === 0) {
      this._errorRegion.hidden = true;
      return;
    }
    this._errorRegion.hidden = false;
    const title = document.createElement('p');
    title.classList.add('errors__title');
    title.textContent = t('errors.title');
    this._errorRegion.appendChild(title);
    const ul = document.createElement('ul');
    for (const key of errorKeys) {
      const li = document.createElement('li');
      li.textContent = t(key);
      ul.appendChild(li);
    }
    this._errorRegion.appendChild(ul);
  }

  clearErrors() {
    this.showErrors([]);
  }

  refreshAll() {
    this.renderServicesList();
    this.renderCurrentServiceData();
    this.renderSectorsList();
  }
}
