import { t } from '../i18n/i18n.js';

/**
 * Renders the order panel: list of reserved seats + total.
 */
export class OrderRenderer {
  /**
   * @param {object} deps
   * @param {HTMLElement} deps.list           the <ul id="order-details">
   * @param {HTMLElement} deps.totalContainer the <span id="order-total-price">
   * @param {() => import('../core/SeatBookingApp.js').SeatBookingApp} deps.getApp
   */
  constructor({ list, totalContainer, getApp }) {
    this._list = list;
    this._total = totalContainer;
    this._getApp = getApp;
  }

  refresh() {
    const app = this._getApp();
    const current = app.getCurrentService();
    this._list.innerHTML = '';
    this._total.innerHTML = '';

    if (!current) return;

    const reserved = current.getReservedSeats();
    const basePrice = Number(current.getPrice());
    let total = 0;

    if (reserved.length === 0) {
      const li = document.createElement('li');
      li.classList.add('order__empty');
      li.textContent = t('order.empty');
      this._list.appendChild(li);
    } else {
      for (const seatId of reserved) {
        const seatEl = document.getElementById(seatId);
        const sectorId = seatEl ? seatEl.dataset.sector : null;
        const multiplier = sectorId ? app.getPriceMultiplierFor(sectorId) : 1;
        const seatPrice = Number((basePrice * multiplier).toFixed(2));
        total += seatPrice;

        const li = document.createElement('li');
        const idSpan = document.createElement('span');
        idSpan.textContent = seatId;
        const priceSpan = document.createElement('span');
        priceSpan.textContent = `$${seatPrice.toFixed(2)}`;
        li.append(idSpan, priceSpan);
        this._list.appendChild(li);
      }
    }

    const totalSpan = document.createElement('span');
    totalSpan.textContent = t('order.total', { total: total.toFixed(2) });
    this._total.appendChild(totalSpan);
  }
}
