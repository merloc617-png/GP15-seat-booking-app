/**
 * 场次 / 影片领域模型（无 DOM）。
 * TODO: 从旧 Service 迁入：预订/已售座位 ID、bookSeats、序列化。
 */
export class Service {
  /**
   * @param {string} _name
   * @param {number|string} _price
   * @param {{ id?: string, idGenerator?: () => string }} [_opts]
   */
  constructor(_name, _price, _opts = {}) {
    // TODO
    this._id = 'svc-todo';
    this._name = String(_name);
    this._price = Number(_price) || 0;
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

  setName(_name) {
    // TODO
  }

  setPrice(_price) {
    // TODO
  }

  getReservedSeats() {
    return [];
  }

  getBookedSeats() {
    return [];
  }

  /** @param {string} _seatId */
  addReservedSeat(_seatId) {
    // TODO
    return false;
  }

  /** @param {string} _seatId */
  removeReservedSeat(_seatId) {
    // TODO
    return false;
  }

  clearReservedSeats() {
    // TODO
  }

  bookSeats() {
    // TODO
    return [];
  }

  setBookedSeatsArray(_arr) {
    // TODO
  }

  toJSON() {
    return {
      _id: this._id,
      _name: this._name,
      _price: this._price,
      _seatsBooked: [],
    };
  }

  /** @param {object} _obj */
  static fromJSON(_obj) {
    // TODO: validate shape, throw on invalid
    throw new Error('Service.fromJSON: TODO — implement rehydration');
  }
}
