import { describe, it, expect } from 'vitest';
import { Sector } from '../../src/core/Sector.js';

describe('Sector', () => {
  it('prefixes id with "s-"', () => {
    const s = new Sector('A1', 1.0, 5);
    expect(s.getId()).toBe('s-a1');
    expect(s.getName()).toBe('A1');
  });

  it('builds the correct number of seats', () => {
    const s = new Sector('A1', 1.0, 3, 4);
    expect(s.getSeats()).toHaveLength(7);
  });

  it('seat IDs follow the pattern sectorId-row-seat', () => {
    const s = new Sector('A1', 1.0, 2);
    const seats = s.getSeats();
    expect(seats[0].id).toBe('s-a1-r1-s1');
    expect(seats[1].id).toBe('s-a1-r1-s2');
  });

  it('seats are tagged with their sector and row', () => {
    const s = new Sector('B2', 1.5, 1, 2);
    const seats = s.getSeats();
    expect(seats[0]).toEqual({
      id: 's-b2-r1-s1',
      sectorId: 's-b2',
      sectorName: 'B2',
      row: 1,
      number: 1,
    });
    expect(seats[1].row).toBe(2);
  });

  it('getRowCount and getRowCounts reflect the constructor args', () => {
    const s = new Sector('A1', 1, 5, 6, 7);
    expect(s.getRowCount()).toBe(3);
    expect(s.getRowCounts()).toEqual([5, 6, 7]);
  });

  it('setPriceMultiplier coerces to a number', () => {
    const s = new Sector('A1', 1, 1);
    s.setPriceMultiplier('2.5');
    expect(s.getPriceMultiplier()).toBe(2.5);
  });

  it('getSeats and getRowCounts return defensive copies', () => {
    const s = new Sector('A1', 1, 1, 1);
    const seats = s.getSeats();
    seats[0].id = 'mutated';
    expect(s.getSeats()[0].id).not.toBe('mutated');

    const rc = s.getRowCounts();
    rc.push(99);
    expect(s.getRowCounts()).toHaveLength(2);
  });

  it('defaults priceMultiplier to 1', () => {
    const s = new Sector('A1', undefined, 1);
    expect(s.getPriceMultiplier()).toBe(1);
  });
});
