import { t } from '../i18n/i18n.js';
import { getSectorLabel } from '../i18n/sectorLabels.js';

export class OrderRenderer {
  /**
   * @param {{ list: HTMLElement, totalContainer: HTMLElement, getApp: () => import('../core/SeatBookingApp.js').SeatBookingApp }} deps
   */
  constructor(deps) {
    this.list = deps.list;
    this.totalContainer = deps.totalContainer;
    this.getApp = deps.getApp;
  }

  refresh() {
    const app = this.getApp();
    const service = app.getCurrentService();
    const reserved = service?.getReservedSeats() ?? [];
    this.list.innerHTML = '';

    if (!service || reserved.length === 0) {
      const item = document.createElement('li');
      item.className = 'order__empty';
      item.setAttribute('role', 'listitem');
      item.textContent = t('order.empty');
      this.list.appendChild(item);
      this.list.classList.add('order__list--empty');
      this.totalContainer.textContent = t('order.total', { total: '0.00' });
      this.totalContainer.classList.remove('order__total--active');
      return;
    }

    this.list.classList.remove('order__list--empty');
    this.totalContainer.classList.add('order__total--active');

    let total = 0;
    reserved.forEach((seatId) => {
      const seat = findSeat(app, seatId);
      const multiplier = app.getPriceMultiplierFor(seat?.sectorId ?? '');
      const price = service.getPrice() * multiplier;
      total += price;

      const item = document.createElement('li');
      item.className = 'order__item order__item--new';
      item.setAttribute('role', 'listitem');
      item.textContent = seat
        ? `${getSectorLabel(seat)} R${seat.row}-${seat.number}: ${price.toFixed(2)}`
        : `${seatId}: ${price.toFixed(2)}`;
      this.list.appendChild(item);
      window.setTimeout(() => item.classList.remove('order__item--new'), 600);
    });

    this.totalContainer.textContent = t('order.total', { total: total.toFixed(2) });
  }
}

function findSeat(app, seatId) {
  for (const sector of app.getSectorsArray()) {
    const seat = sector.getSeats().find((item) => item.id === seatId);
    if (seat) return seat;
  }
  return undefined;
}
