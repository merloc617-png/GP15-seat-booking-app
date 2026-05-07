import { describe, it, expect, beforeEach } from 'vitest';
import { SeatBookingApp } from '../../src/core/SeatBookingApp.js';
import { Service } from '../../src/core/Service.js';
import { Sector } from '../../src/core/Sector.js';

describe('SeatBookingApp', () => {
  let app;

  beforeEach(() => {
    app = new SeatBookingApp('room-1');
  });

  it('reports the configured name', () => {
    expect(app.getName()).toBe('room-1');
  });

  it('addSector / getSectorsArray', () => {
    const s = new Sector('A1', 1, 3);
    app.addSector(s);
    expect(app.getSectorsArray()).toHaveLength(1);
    expect(app.getSectorsArray()[0]).toBe(s);
  });

  it('getSectorsArray returns a defensive copy', () => {
    app.addSector(new Sector('A1', 1, 1));
    const arr = app.getSectorsArray();
    arr.push('mutation');
    expect(app.getSectorsArray()).toHaveLength(1);
  });

  it('setPriceMultipliersArray builds entries from sectors', () => {
    app.addSector(new Sector('A1', 1.0, 1));
    app.addSector(new Sector('A2', 1.5, 1));
    app.setPriceMultipliersArray();
    expect(app.getPriceMultipliersArray()).toEqual([
      { sector: 's-A1', priceMultiplier: 1.0 },
      { sector: 's-A2', priceMultiplier: 1.5 },
    ]);
  });

  it('getPriceMultiplierFor returns 1 for unknown sectors (defensive default)', () => {
    expect(app.getPriceMultiplierFor('nope')).toBe(1);
  });

  it('getPriceMultiplierFor returns the right multiplier when known', () => {
    app.addSector(new Sector('A2', 1.5, 1));
    app.setPriceMultipliersArray();
    expect(app.getPriceMultiplierFor('s-A2')).toBe(1.5);
  });

  it('addService / getServicesArray / getCurrentService', () => {
    const a = new Service('Avatar', 10, { id: 'a' });
    const b = new Service('Inception', 11, { id: 'b' });
    app.addService(a);
    app.addService(b);
    expect(app.getServicesArray()).toHaveLength(2);
    app.setCurrentServiceId('b');
    expect(app.getCurrentServiceId()).toBe('b');
    expect(app.getCurrentService()).toBe(b);
  });

  it('removeServiceById removes and reselects the first remaining', () => {
    app.addService(new Service('A', 1, { id: 'a' }));
    app.addService(new Service('B', 1, { id: 'b' }));
    app.setCurrentServiceId('a');
    expect(app.removeServiceById('a')).toBe(true);
    expect(app.getCurrentServiceId()).toBe('b');
  });

  it('removeServiceById clears current id when the list becomes empty', () => {
    app.addService(new Service('A', 1, { id: 'a' }));
    app.setCurrentServiceId('a');
    app.removeServiceById('a');
    expect(app.getCurrentServiceId()).toBe('');
    expect(app.getCurrentService()).toBeUndefined();
  });

  it('removeServiceById returns false for unknown id', () => {
    expect(app.removeServiceById('ghost')).toBe(false);
  });

  it('setCurrentServiceId tolerates falsy input', () => {
    app.setCurrentServiceId(null);
    expect(app.getCurrentServiceId()).toBe('');
    app.setCurrentServiceId(undefined);
    expect(app.getCurrentServiceId()).toBe('');
  });

  it('loadServicesFromData rehydrates valid entries and skips malformed', () => {
    app.loadServicesFromData([
      { _id: 'a', _name: 'A', _price: 1, _seatsBooked: [] },
      null,
      'bad',
      { _id: 'b', _name: 'B', _price: 2, _seatsBooked: ['x'] },
    ]);
    expect(app.getServicesArray()).toHaveLength(2);
    expect(app.getServicesArray()[1].getBookedSeats()).toEqual(['x']);
  });

  it('loadServicesFromData ignores a non-array input', () => {
    app.loadServicesFromData('not array');
    expect(app.getServicesArray()).toEqual([]);
  });

  it('toJSON snapshots the app state', () => {
    app.addService(new Service('A', 1, { id: 'a' }));
    const json = app.toJSON();
    expect(json.name).toBe('room-1');
    expect(json.services).toHaveLength(1);
    expect(json.services[0]._id).toBe('a');
  });
});
