import { describe, it, expect } from 'vitest';
import { Service } from '../../src/core/Service.js';

describe('Service', () => {
  it('creates a service with id, name, price, and empty seat arrays', () => {
    const s = new Service('Avatar', 12.5, { idGenerator: () => 'fixed-id' });
    expect(s.getId()).toBe('fixed-id');
    expect(s.getName()).toBe('Avatar');
    expect(s.getPrice()).toBe(12.5);
    expect(s.getReservedSeats()).toEqual([]);
    expect(s.getBookedSeats()).toEqual([]);
  });

  it('uses crypto.randomUUID() if available', () => {
    const s = new Service('a', 1);
    expect(typeof s.getId()).toBe('string');
    expect(s.getId().length).toBeGreaterThan(8);
  });

  it('accepts an explicit id from opts', () => {
    const s = new Service('a', 1, { id: 'svc-99' });
    expect(s.getId()).toBe('svc-99');
  });

  it('coerces name and price types', () => {
    const s = new Service(42, '7.5');
    expect(s.getName()).toBe('42');
    expect(s.getPrice()).toBe(7.5);
  });

  it('addReservedSeat is idempotent and rejects already-booked seats', () => {
    const s = new Service('a', 1);
    expect(s.addReservedSeat('s-A1-1-1')).toBe(true);
    expect(s.addReservedSeat('s-A1-1-1')).toBe(false);
    expect(s.getReservedSeats()).toEqual(['s-A1-1-1']);
    s.bookSeats();
    expect(s.addReservedSeat('s-A1-1-1')).toBe(false);
  });

  it('addReservedSeat coerces numeric input to string', () => {
    const s = new Service('a', 1);
    s.addReservedSeat(123);
    expect(s.getReservedSeats()).toEqual(['123']);
  });

  it('removeReservedSeat removes a seat by id and returns true', () => {
    const s = new Service('a', 1);
    s.addReservedSeat('s-1');
    s.addReservedSeat('s-2');
    expect(s.removeReservedSeat('s-1')).toBe(true);
    expect(s.getReservedSeats()).toEqual(['s-2']);
  });

  it('removeReservedSeat returns false when id is missing (no off-by-one bug)', () => {
    const s = new Service('a', 1);
    s.addReservedSeat('s-1');
    s.addReservedSeat('s-2');
    expect(s.removeReservedSeat('does-not-exist')).toBe(false);
    expect(s.getReservedSeats()).toEqual(['s-1', 's-2']);
  });

  it('clearReservedSeats empties the reserved list', () => {
    const s = new Service('a', 1);
    s.addReservedSeat('a');
    s.addReservedSeat('b');
    s.clearReservedSeats();
    expect(s.getReservedSeats()).toEqual([]);
  });

  it('bookSeats moves reserved into booked and returns the moved IDs', () => {
    const s = new Service('a', 1);
    s.addReservedSeat('a');
    s.addReservedSeat('b');
    const moved = s.bookSeats();
    expect(moved).toEqual(['a', 'b']);
    expect(s.getReservedSeats()).toEqual([]);
    expect(s.getBookedSeats()).toEqual(['a', 'b']);
  });

  it('bookSeats does not duplicate already-booked IDs', () => {
    const s = new Service('a', 1);
    s.setBookedSeatsArray(['a']);
    s.addReservedSeat('a');
    s.addReservedSeat('b');
    s.bookSeats();
    expect(s.getBookedSeats()).toEqual(['a', 'b']);
  });

  it('setName / setPrice update fields with coercion', () => {
    const s = new Service('a', 1);
    s.setName(123);
    s.setPrice('9.99');
    expect(s.getName()).toBe('123');
    expect(s.getPrice()).toBe(9.99);
  });

  it('getReservedSeats / getBookedSeats return defensive copies', () => {
    const s = new Service('a', 1);
    s.addReservedSeat('a');
    const reserved = s.getReservedSeats();
    reserved.push('mutation');
    expect(s.getReservedSeats()).toEqual(['a']);
  });

  it('toJSON round-trips through fromJSON', () => {
    const s = new Service('Inception', 14.99, { id: 'fixed' });
    s.addReservedSeat('s-1');
    s.bookSeats();
    const json = s.toJSON();
    expect(json).toEqual({
      _id: 'fixed',
      _name: 'Inception',
      _price: 14.99,
      _seatsBooked: ['s-1'],
    });
    const round = Service.fromJSON(json);
    expect(round.getId()).toBe('fixed');
    expect(round.getName()).toBe('Inception');
    expect(round.getPrice()).toBe(14.99);
    expect(round.getBookedSeats()).toEqual(['s-1']);
  });

  it('Service.fromJSON throws on non-object input', () => {
    expect(() => Service.fromJSON(null)).toThrow();
    expect(() => Service.fromJSON('not an obj')).toThrow();
  });

  it('Service.fromJSON tolerates missing fields', () => {
    const s = Service.fromJSON({ _id: 'x' });
    expect(s.getName()).toBe('');
    expect(s.getPrice()).toBe(0);
    expect(s.getBookedSeats()).toEqual([]);
  });

  it('setBookedSeatsArray coerces non-array to empty', () => {
    const s = new Service('a', 1);
    s.setBookedSeatsArray('not an array');
    expect(s.getBookedSeats()).toEqual([]);
  });
});
