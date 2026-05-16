import { t } from '../i18n/i18n.js';
import { getSectorLabel } from '../i18n/sectorLabels.js';

export class SeatRenderer {
  /**
   * @param {{ container: HTMLElement, getApp: () => import('../core/SeatBookingApp.js').SeatBookingApp, onChange?: (event: { action: string, seatId: string, serviceId: string, row?: string, seat?: string }) => void }} deps
   */
  constructor(deps) {
    this.container = deps.container;
    this.getApp = deps.getApp;
    this.onChange = deps.onChange || (() => {});
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.container.addEventListener('click', this.handleClick);
    this.container.addEventListener('keydown', this.handleKeyDown);
  }

  renderAllSectors() {
    const app = this.getApp();
    const sectors = app.getSectorsArray();
    this.container.innerHTML = '';
    this.container.className = 'seat-map';
    // Remove role="grid" as the internal structure doesn't meet grid requirements
    this.container.setAttribute('aria-label', t('seats.aria'));

    const fragment = document.createDocumentFragment();
    sectors.forEach((sector) => {
      fragment.appendChild(this.createSectorElement(sector));
    });
    this.container.appendChild(fragment);
    this.refresh();
  }

  refresh() {
    const app = this.getApp();
    const service = app.getCurrentService();
    const reserved = new Set(service?.getReservedSeats() ?? []);
    const booked = new Set(service?.getBookedSeats() ?? []);

    this.container.querySelectorAll('[data-seat-id]').forEach((button) => {
      const seatId = button.getAttribute('data-seat-id') || '';
      const sectorId = button.getAttribute('data-sector-id') || '';
      const row = button.getAttribute('data-row') || '';
      const seat = button.getAttribute('data-seat') || '';
      const price = formatPrice((service?.getPrice() ?? 0) * app.getPriceMultiplierFor(sectorId));
      const isBooked = booked.has(seatId);
      const isReserved = reserved.has(seatId);

      button.classList.toggle('seat--reserved', isReserved);
      button.classList.toggle('seat--booked', isBooked);
      button.disabled = isBooked || !service;
      button.setAttribute('aria-pressed', String(isReserved));
      button.setAttribute(
        'aria-label',
        isBooked
          ? t('seat.aria.booked', { row, seat })
          : t(isReserved ? 'seat.aria.reserved' : 'seat.aria.available', { row, seat, price }),
      );
    });

    app.getSectorsArray().forEach((sector) => {
      const section = this.container.querySelector(`[data-sector-section-id="${sector.getId()}"]`);
      const title = section?.querySelector?.('.seat-sector__title');
      const label = getSectorLabel(sector);
      if (section) section.setAttribute('aria-label', label);
      if (title) title.textContent = label;
    });
  }

  createSectorElement(sector) {
    const section = document.createElement('section');
    section.className = 'seat-sector sector';
    section.dataset.sectorSectionId = sector.getId();
    section.dataset.sectorName = sector.getName();
    section.style.gridArea = sector.getName();
    section.setAttribute('aria-label', getSectorLabel(sector));

    const title = document.createElement('h2');
    title.className = 'seat-sector__title';
    title.textContent = getSectorLabel(sector);
    section.appendChild(title);

    const seats = sector.getSeats();
    sector.getRowCounts().forEach((count, rowIndex) => {
      const row = document.createElement('div');
      row.className = 'seat-row row';
      // 移除 role="row"，因为父元素不再是 grid
      row.style.setProperty('--seat-count', String(count));

      const label = document.createElement('span');
      label.className = 'seat-row__label';
      label.textContent = String(rowIndex + 1);
      row.appendChild(label);

      seats
        .filter((seat) => seat.row === rowIndex + 1)
        .forEach((seat) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'seat';
          button.textContent = '';
          button.dataset.seatId = seat.id;
          button.dataset.sectorId = seat.sectorId;
          button.dataset.row = String(seat.row);
          button.dataset.seat = String(seat.number);
          // 移除 role="gridcell"，因为父元素不再是 grid
          row.appendChild(button);
        });

      if (count > 0) section.appendChild(row);
    });

    return section;
  }

  handleClick(event) {
    const button = event.target.closest?.('[data-seat-id]');
    if (!button || !this.container.contains(button)) return;
    this.toggleSeat(button.getAttribute('data-seat-id'));
  }

  handleKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const button = event.target.closest?.('[data-seat-id]');
    if (!button) return;
    event.preventDefault();
    this.toggleSeat(button.getAttribute('data-seat-id'));
  }

  toggleSeat(seatId) {
    const service = this.getApp().getCurrentService();
    const button = seatId ? this.container.querySelector(`[data-seat-id="${seatId}"]`) : null;
    const row = button?.getAttribute('data-row') ?? '';
    const seat = button?.getAttribute('data-seat') ?? '';

    if (!service) {
      this.onChange({ action: 'NO_SERVICE', seatId: seatId ?? '', row, seat, serviceId: '' });
      return;
    }
    if (!seatId || service.getBookedSeats().includes(seatId)) return;

    const wasReleased = service.removeReservedSeat(seatId);
    if (!wasReleased) service.addReservedSeat(seatId);
    this.refresh();
    this.onChange({
      action: wasReleased ? 'SEAT_RESERVATION_RELEASED' : 'SEAT_RESERVED',
      seatId,
      serviceId: service.getId(),
      row,
      seat,
    });
  }
}

function formatPrice(value) {
  return Number(value).toFixed(2);
}
