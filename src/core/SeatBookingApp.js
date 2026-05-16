import { Service } from './Service.js';

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

  /** @param {import('./Sector.js').Sector} sector */
  addSector(sector) {
    this._sectors.push(sector);
    this.setPriceMultipliersArray();
  }

  getSectorsArray() {
    return [...this._sectors];
  }

  setPriceMultipliersArray() {
    this._priceMultipliers = this._sectors.map((sector) => ({
      sectorId: sector.getId(),
      multiplier: sector.getPriceMultiplier(),
    }));
  }

  getPriceMultipliersArray() {
    return this._priceMultipliers.map((item) => ({ ...item }));
  }

  /** @param {string} sectorId */
  getPriceMultiplierFor(sectorId) {
    return this._priceMultipliers.find((item) => item.sectorId === sectorId)?.multiplier ?? 1;
  }

  /** @param {import('./Service.js').Service} service */
  addService(service) {
    this._services.push(service);
    if (!this._currentServiceId) this._currentServiceId = service.getId();
  }

  getServicesArray() {
    return [...this._services];
  }

  /** @param {string} serviceId */
  removeServiceById(serviceId) {
    const index = this._services.findIndex((service) => service.getId() === serviceId);
    if (index === -1) return false;
    this._services.splice(index, 1);
    if (this._currentServiceId === serviceId) {
      this._currentServiceId = this._services[0]?.getId() ?? '';
    }
    return true;
  }

  setCurrentServiceId(serviceId) {
    if (this._services.some((service) => service.getId() === serviceId)) {
      this._currentServiceId = serviceId;
      return true;
    }
    return false;
  }

  getCurrentServiceId() {
    return this._currentServiceId;
  }

  getCurrentService() {
    return this._services.find((service) => service.getId() === this._currentServiceId);
  }

  /** @param {Array<object>} arr */
  loadServicesFromData(arr) {
    this._services = [];
    this._currentServiceId = '';
    if (!Array.isArray(arr)) return;
    arr.forEach((item) => {
      try {
        this.addService(Service.fromJSON(item));
      } catch {
        /* Skip invalid stored services. */
      }
    });
  }

  toJSON() {
    return { name: this._name, services: this._services.map((service) => service.toJSON()) };
  }
}
