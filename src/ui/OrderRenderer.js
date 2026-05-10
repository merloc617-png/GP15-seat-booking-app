import { t } from '../i18n/i18n.js';

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
      item.textContent = t('order.empty');
      this.list.appendChild(item);
      this.totalContainer.textContent = t('order.total', { total: '0.00' });
      return;
    }

    let total = 0;
    reserved.forEach((seatId) => {
      const seat = findSeat(app, seatId);
      const multiplier = app.getPriceMultiplierFor(seat?.sectorId ?? '');
      const price = service.getPrice() * multiplier;
      total += price;

      const item = document.createElement('li');
      item.textContent = seat
        ? `${seat.sectorName} R${seat.row}-${seat.number}: ${price.toFixed(2)}`
        : `${seatId}: ${price.toFixed(2)}`;
      this.list.appendChild(item);
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
