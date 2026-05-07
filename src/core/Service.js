/**
 * Service domain model. Zero DOM dependencies, fully unit-testable.
 * A "Service" represents a movie/event with a base price and reserved/booked seats.
 *
 * Notable change from the original: `_seatsReserved` now stores seat IDs (strings)
 * exclusively, eliminating the type-confusion bug where it mixed DOM elements
 * and string IDs.
 */
export class Service {
  /**
   * @param {string} name
   * @param {number|string} price
   * @param {{ id?: string, idGenerator?: () => string }} [opts]
   */
  constructor(name, price, opts = {}) {
    const generateId =
      opts.idGenerator ||
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? () => crypto.randomUUID()
        : () => `svc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    this._id = opts.id || generateId();
    this._name = String(name);
    this._price = Number(price);
    this._seatsReserved = [];
    this._seatsBooked = [];
  }

  getId() {
    return this._id;
  }

  getName() {
    return this._name;
  }

  getPrice() {
    return this._price;
  }

  setName(name) {
    this._name = String(name);
  }

  setPrice(price) {
    this._price = Number(price);
  }

  getReservedSeats() {
    return [...this._seatsReserved];
  }

  getBookedSeats() {
    return [...this._seatsBooked];
  }

  /**
   * Reserve a seat by ID (idempotent). Returns true if added, false if already reserved or booked.
   * @param {string} seatId
   */
  addReservedSeat(seatId) {
    const id = String(seatId);
    if (this._seatsBooked.includes(id) || this._seatsReserved.includes(id)) {
      return false;
    }
    this._seatsReserved.push(id);
    return true;
  }

  /**
   * Remove a reserved seat by ID. Defensive: handles missing ID without
   * the original `splice(-1, 1)` bug that wrongly trimmed the last element.
   * @param {string} seatId
   * @returns {boolean} true if removed
   */
  removeReservedSeat(seatId) {
    const id = String(seatId);
    const index = this._seatsReserved.indexOf(id);
    if (index === -1) return false;
    this._seatsReserved.splice(index, 1);
    return true;
  }

  clearReservedSeats() {
    this._seatsReserved = [];
  }

  /**
   * Move all currently reserved seats into the booked array.
   * @returns {string[]} the IDs that were just booked
   */
  bookSeats() {
    const newlyBooked = [...this._seatsReserved];
    for (const id of newlyBooked) {
      if (!this._seatsBooked.includes(id)) this._seatsBooked.push(id);
    }
    this.clearReservedSeats();
    return newlyBooked;
  }

  setBookedSeatsArray(arr) {
    this._seatsBooked = Array.isArray(arr) ? arr.map(String) : [];
  }

  /**
   * Plain-data representation for persistence.
   */
  toJSON() {
    return {
      _id: this._id,
      _name: this._name,
      _price: this._price,
      _seatsBooked: this._seatsBooked,
    };
  }

  /**
   * Rehydrate a Service from a stored plain object.
   */
  static fromJSON(obj) {
    if (!obj || typeof obj !== 'object') {
      throw new TypeError('Service.fromJSON expects a plain object');
    }
    const svc = new Service(obj._name ?? '', obj._price ?? 0, { id: obj._id });
    svc.setBookedSeatsArray(obj._seatsBooked ?? []);
    return svc;
  }
}
