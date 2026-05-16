export class Sector {
  /**
   * @param {string} name
   * @param {number} [priceMultiplier]
   * @param {...number} seatsInRow
   */
  constructor(name, priceMultiplier = 1, ...seatsInRow) {
    this._name = String(name || 'Sector').trim() || 'Sector';
    this._id = `s-${this._name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'sector'}`;
    this._priceMultiplier = normalizeMultiplier(priceMultiplier);
    this._rowCounts = seatsInRow.map((count) => Math.max(0, Math.floor(Number(count) || 0)));
    this._seats = this._rowCounts.flatMap((count, rowIndex) =>
      Array.from({ length: count }, (_, seatIndex) => ({
        id: `${this._id}-r${rowIndex + 1}-s${seatIndex + 1}`,
        sectorId: this._id,
        sectorName: this._name,
        row: rowIndex + 1,
        number: seatIndex + 1,
      })),
    );
  }

  getId() {
    return this._id;
  }

  getPriceMultiplier() {
    return this._priceMultiplier;
  }

  setPriceMultiplier(priceMultiplier) {
    this._priceMultiplier = normalizeMultiplier(priceMultiplier);
  }

  getRowCount() {
    return this._rowCounts.length;
  }

  getRowCounts() {
    return [...this._rowCounts];
  }

  getSeats() {
    return this._seats.map((seat) => ({ ...seat }));
  }

  getName() {
    return this._name;
  }
}

function normalizeMultiplier(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
