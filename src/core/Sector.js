/**
 * Sector domain model. Zero DOM dependencies (rendering moved to ui/SeatRenderer.js).
 * A Sector groups rows of seats with a price multiplier.
 */
export class Sector {
  /**
   * @param {string} name      e.g. "A1"
   * @param {number} priceMultiplier
   * @param {...number} seatsInRow  number of seats in each row
   */
  constructor(name, priceMultiplier = 1, ...seatsInRow) {
    this._id = `s-${String(name)}`;
    this._priceMultiplier = Number(priceMultiplier);
    this._rowCounts = seatsInRow.map(Number);
    this._seats = this._buildSeats();
  }

  _buildSeats() {
    const seats = [];
    for (let i = 1; i <= this._rowCounts.length; i++) {
      const rowId = `${this._id}-${i}`;
      for (let j = 1; j <= this._rowCounts[i - 1]; j++) {
        seats.push({
          sector: this._id,
          row: rowId,
          seat: `${rowId}-${j}`,
        });
      }
    }
    return seats;
  }

  getId() {
    return this._id;
  }

  getPriceMultiplier() {
    return this._priceMultiplier;
  }

  setPriceMultiplier(priceMultiplier) {
    this._priceMultiplier = Number(priceMultiplier);
  }

  getRowCount() {
    return this._rowCounts.length;
  }

  getRowCounts() {
    return [...this._rowCounts];
  }

  getSeats() {
    return this._seats.map((s) => ({ ...s }));
  }

  /**
   * Get the human-readable name (without "s-" prefix).
   */
  getName() {
    return this._id.startsWith('s-') ? this._id.slice(2) : this._id;
  }
}
