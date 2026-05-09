/**
 * 应用状态协调器（领域层，无 DOM）。
 * TODO: 从旧 seat-booking-app.js 迁入：分区、服务、当前场次、价格倍率快照。
 */
export class SeatBookingApp {
  constructor(name) {
    this._name = String(name);
    this._sectors = [];
    this._priceMultipliers = [];
    this._services = [];
    this._currentServiceId = '';
  }

  getName() {
    return this._name;
  }

  /** @param {import('./Sector.js').Sector} _sector */
  addSector(_sector) {
    // TODO
  }

  getSectorsArray() {
    // TODO: return defensive copy of sectors
    return [];
  }

  setPriceMultipliersArray() {
    // TODO: rebuild from sectors
  }

  getPriceMultipliersArray() {
    return [];
  }

  /** @param {string} _sectorId */
  getPriceMultiplierFor(_sectorId) {
    // TODO
    return 1;
  }

  /** @param {import('./Service.js').Service} _service */
  addService(_service) {
    // TODO
  }

  getServicesArray() {
    return [];
  }

  /** @param {string} _serviceId */
  removeServiceById(_serviceId) {
    // TODO
    return false;
  }

  setCurrentServiceId(_serviceId) {
    // TODO
  }

  getCurrentServiceId() {
    return this._currentServiceId;
  }

  getCurrentService() {
    return undefined;
  }

  /** @param {Array<object>} _arr */
  loadServicesFromData(_arr) {
    // TODO: Service.fromJSON
  }

  toJSON() {
    // TODO
    return { name: this._name, services: [] };
  }
}
