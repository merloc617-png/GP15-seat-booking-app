/**
 * SeatRenderer - the only module that paints seats and listens for seat
 * interactions. Builds a semantic ARIA grid and uses ONE delegated
 * click + keydown listener on the container (Deficiency 4 fix).
 *
 * Status differentiation uses BOTH colour and a textual symbol/icon
 * (Deficiency 1: avoid "colour as the sole signal").
 */
import { t } from '../i18n/i18n.js';

const SEAT_SELECTOR = '.seat';

export class SeatRenderer {
  /**
   * @param {object} deps
   * @param {HTMLElement} deps.container        the #seats <div>
   * @param {() => import('../core/SeatBookingApp.js').SeatBookingApp} deps.getApp
   * @param {() => void} deps.onChange  notify other renderers (order list, etc.)
   */
  constructor({ container, getApp, onChange }) {
    this._container = container;
    this._getApp = getApp;
    this._onChange = onChange || (() => {});
    this._delegationBound = false;
  }

  /**
   * Render every sector's seats. Replaces existing children.
   */
  renderAllSectors() {
    const app = this._getApp();
    this._container.innerHTML = '';
    this._container.setAttribute('role', 'grid');
    this._container.setAttribute('aria-label', t('seats.aria'));

    for (const sector of app.getSectorsArray()) {
      this._container.appendChild(this._buildSectorElement(sector));
    }

    this._refreshSeatStates();
    this._bindDelegation();
  }

  _buildSectorElement(sector) {
    const sectorEl = document.createElement('div');
    sectorEl.classList.add('sector');
    sectorEl.id = sector.getId();
    sectorEl.style.gridArea = sector.getName();
    sectorEl.setAttribute('role', 'rowgroup');

    const seats = sector.getSeats();
    for (let r = 1; r <= sector.getRowCount(); r++) {
      const rowEl = document.createElement('div');
      rowEl.classList.add('row');
      rowEl.id = `${sector.getId()}-${r}`;
      rowEl.setAttribute('role', 'row');

      for (const seat of seats) {
        if (seat.row !== rowEl.id) continue;
        rowEl.appendChild(this._buildSeatElement(seat));
      }
      sectorEl.appendChild(rowEl);
    }

    const label = document.createElement('span');
    label.textContent = sector.getId();
    label.classList.add('sector__label');
    sectorEl.appendChild(label);

    return sectorEl;
  }

  _buildSeatElement(seat) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('seat');
    btn.id = seat.seat;
    btn.dataset.sector = seat.sector;
    btn.dataset.row = seat.row;
    btn.setAttribute('role', 'gridcell');
    btn.setAttribute('aria-pressed', 'false');
    /* Symbol provides a non-colour cue (a11y best practice). */
    const visual = document.createElement('span');
    visual.classList.add('seat__visual');
    visual.setAttribute('aria-hidden', 'true');
    visual.textContent = '';
    btn.appendChild(visual);
    return btn;
  }

  /**
   * Walk every seat and re-paint state from the current Service.
   */
  _refreshSeatStates() {
    const app = this._getApp();
    const current = app.getCurrentService();
    const reserved = current ? current.getReservedSeats() : [];
    const booked = current ? current.getBookedSeats() : [];
    const price = current ? Number(current.getPrice()) : 0;

    this._container.querySelectorAll(SEAT_SELECTOR).forEach((btn) => {
      const seatId = btn.id;
      const sectorId = btn.dataset.sector;
      const mult = app.getPriceMultiplierFor(sectorId);
      const seatPrice = (price * mult).toFixed(2);
      const visual = btn.querySelector('.seat__visual');

      btn.classList.remove('seat--reserved', 'seat--booked');
      btn.disabled = false;
      btn.tabIndex = -1;

      if (booked.includes(seatId)) {
        btn.classList.add('seat--booked');
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute(
          'aria-label',
          t('seat.aria.booked', { row: btn.dataset.row, seat: seatId, price: seatPrice }),
        );
        btn.disabled = true;
        if (visual) visual.textContent = 'X';
      } else if (reserved.includes(seatId)) {
        btn.classList.add('seat--reserved');
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute(
          'aria-label',
          t('seat.aria.reserved', { row: btn.dataset.row, seat: seatId, price: seatPrice }),
        );
        if (visual) visual.textContent = '✓';
      } else {
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute(
          'aria-label',
          t('seat.aria.available', { row: btn.dataset.row, seat: seatId, price: seatPrice }),
        );
        if (visual) visual.textContent = '';
      }
    });

    /* one seat is in the tab order at a time (roving tabindex pattern) */
    const first = this._container.querySelector(`${SEAT_SELECTOR}:not([disabled])`);
    if (first) first.tabIndex = 0;
  }

  /** Public refresh after external state changes. */
  refresh() {
    this._refreshSeatStates();
  }

  _bindDelegation() {
    if (this._delegationBound) return;
    this._delegationBound = true;

    this._container.addEventListener('click', (e) => {
      const seat = e.target.closest(SEAT_SELECTOR);
      if (!seat || seat.disabled) return;
      this._toggleSeat(seat);
    });

    this._container.addEventListener('keydown', (e) => {
      const seat = e.target.closest(SEAT_SELECTOR);
      if (!seat) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!seat.disabled) this._toggleSeat(seat);
        return;
      }
      const arrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
      if (arrow.includes(e.key)) {
        e.preventDefault();
        this._moveFocus(seat, e.key);
      }
    });
  }

  _toggleSeat(seatEl) {
    const app = this._getApp();
    const current = app.getCurrentService();
    if (!current) return;
    if (current.getReservedSeats().includes(seatEl.id)) {
      current.removeReservedSeat(seatEl.id);
    } else {
      current.addReservedSeat(seatEl.id);
    }
    this._refreshSeatStates();
    this._onChange();
  }

  _moveFocus(fromSeat, direction) {
    const seats = Array.from(this._container.querySelectorAll(SEAT_SELECTOR));
    const idx = seats.indexOf(fromSeat);
    if (idx === -1) return;
    let nextIdx = idx;
    if (direction === 'ArrowLeft') nextIdx = Math.max(0, idx - 1);
    if (direction === 'ArrowRight') nextIdx = Math.min(seats.length - 1, idx + 1);
    if (direction === 'ArrowUp') nextIdx = Math.max(0, idx - 10);
    if (direction === 'ArrowDown') nextIdx = Math.min(seats.length - 1, idx + 10);
    const next = seats[nextIdx];
    if (!next) return;
    seats.forEach((s) => (s.tabIndex = -1));
    next.tabIndex = 0;
    next.focus();
  }
}
