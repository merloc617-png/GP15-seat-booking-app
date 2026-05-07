import { Service } from './Service.js';

/**
 * SeatBookingApp - now a slim state coordinator.
 * Renderers (ui/*Renderer.js) read from this; storage adapter persists from this.
 * No DOM access here.
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

  // -------- sectors --------
  addSector(sector) {
    this._sectors.push(sector);
  }

  getSectorsArray() {
    return [...this._sectors];
  }

  setPriceMultipliersArray() {
    this._priceMultipliers = this._sectors.map((sector) => ({
      sector: sector.getId(),
      priceMultiplier: sector.getPriceMultiplier(),
    }));
  }

  getPriceMultipliersArray() {
    return this._priceMultipliers.map((m) => ({ ...m }));
  }

  /**
   * Find the multiplier for a given sector ID. Returns 1 if unknown
   * (defensive fallback instead of throwing).
   * @param {string} sectorId
   */
  getPriceMultiplierFor(sectorId) {
    const found = this._priceMultipliers.find((m) => m.sector === sectorId);
    return found ? found.priceMultiplier : 1;
  }

  // -------- services --------
  addService(service) {
    this._services.push(service);
  }

  getServicesArray() {
    return [...this._services];
  }

  removeServiceById(serviceId) {
    const idx = this._services.findIndex((s) => s.getId() === serviceId);
    if (idx === -1) return false;
    this._services.splice(idx, 1);
    if (this._currentServiceId === serviceId) {
      this._currentServiceId = this._services.length
        ? this._services[0].getId()
        : '';
    }
    return true;
  }

  setCurrentServiceId(serviceId) {
    this._currentServiceId = serviceId || '';
  }

  getCurrentServiceId() {
    return this._currentServiceId;
  }

  getCurrentService() {
    return this._services.find((s) => s.getId() === this._currentServiceId);
  }

  /**
   * Hydrate services from plain data. Used by storage adapter.
   * @param {Array<object>} arr
   */
  loadServicesFromData(arr) {
    if (!Array.isArray(arr)) return;
    for (const obj of arr) {
      try {
        this._services.push(Service.fromJSON(obj));
      } catch {
        /* skip malformed entry */
      }
    }
  }

  /**
   * Plain-data snapshot for persistence.
   */
  toJSON() {
    return {
      name: this._name,
      services: this._services.map((s) => s.toJSON()),
    };
  }
}
