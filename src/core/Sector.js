/**
 * 分区领域模型（无 DOM）。
 * TODO: 从旧 Sector 迁入：行数、座位 ID、倍率；渲染交给 ui/SeatRenderer。
 */
export class Sector {
  /**
   * @param {string} _name
   * @param {number} [_priceMultiplier]
   * @param {...number} _seatsInRow
   */
  constructor(_name, _priceMultiplier = 1, ..._seatsInRow) {
    // TODO
    this._id = 's-TODO';
    this._priceMultiplier = 1;
    this._rowCounts = [];
    this._seats = [];
  }

  getId() {
    return this._id;
  }

  getPriceMultiplier() {
    return this._priceMultiplier;
  }

  setPriceMultiplier(_priceMultiplier) {
    // TODO
  }

  getRowCount() {
    return 0;
  }

  getRowCounts() {
    return [];
  }

  getSeats() {
    return [];
  }

  getName() {
    return 'TODO';
  }
}
