export class Service {
  /**
   * @param {string} name
   * @param {number|string} price
   * @param {{ id?: string, idGenerator?: () => string }} [opts]
   */
  constructor(name, price, opts = {}) {
    this._id = opts.id || (opts.idGenerator ? opts.idGenerator() : createServiceId());
    this._name = String(name);
    this._price = normalizePrice(price);
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
    this._price = normalizePrice(price);
  }

  getReservedSeats() {
    return [...this._seatsReserved];
  }

  getBookedSeats() {
    return [...this._seatsBooked];
  }

  /** @param {string} seatId */
  addReservedSeat(seatId) {
    const id = String(seatId || '');
    if (!id || this._seatsBooked.includes(id) || this._seatsReserved.includes(id)) return false;
    this._seatsReserved.push(id);
    return true;
  }

  /** @param {string} seatId */
  removeReservedSeat(seatId) {
    const index = this._seatsReserved.indexOf(String(seatId));
    if (index === -1) return false;
    this._seatsReserved.splice(index, 1);
    return true;
  }

  clearReservedSeats() {
    this._seatsReserved = [];
  }

  bookSeats() {
    const bookedNow = [];
    this._seatsReserved.forEach((seatId) => {
      if (!this._seatsBooked.includes(seatId)) {
        this._seatsBooked.push(seatId);
        bookedNow.push(seatId);
      }
    });
    this.clearReservedSeats();
    return bookedNow;
  }

  setBookedSeatsArray(arr) {
    this._seatsBooked = Array.isArray(arr) ? [...new Set(arr.map(String).filter(Boolean))] : [];
  }

  toJSON() {
    return {
      _id: this._id,
      _name: this._name,
      _price: this._price,
      _seatsBooked: this.getBookedSeats(),
    };
  }

  /** @param {object} obj */
  static fromJSON(obj) {
    if (!obj || typeof obj !== 'object') throw new Error('Service.fromJSON: invalid service data');
    const service = new Service(obj._name ?? obj.name ?? '', obj._price ?? obj.price ?? 0, {
      id: obj._id ?? obj.id,
    });
    service.setBookedSeatsArray(obj._seatsBooked ?? obj.seatsBooked ?? []);
    return service;
  }
}

function createServiceId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `svc-${crypto.randomUUID()}`;
  return `svc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePrice(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
