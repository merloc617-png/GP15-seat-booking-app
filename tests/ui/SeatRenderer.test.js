/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SeatRenderer } from '../../src/ui/SeatRenderer.js';
import { SeatBookingApp } from '../../src/core/SeatBookingApp.js';
import { Service } from '../../src/core/Service.js';
import { Sector } from '../../src/core/Sector.js';
import * as i18n from '../../src/i18n/i18n.js';
import enLocale from '../../src/i18n/locales/en.json';
import zhLocale from '../../src/i18n/locales/zh.json';

describe('SeatRenderer', () => {
  let app;
  let container;
  let renderer;
  let onChangeCallback;

  beforeEach(() => {
    // Reset i18n for each test
    i18n._resetForTests();
    i18n.init({
      resources: { en: enLocale, zh: zhLocale },
      defaultLocale: 'en',
      fallback: 'en',
      storage: null,
    });

    // Create a test app with sectors and services
    app = new SeatBookingApp('test-room');
    
    // Add sectors
    const sectorA1 = new Sector('A1', 1.0, 3);
    const sectorA2 = new Sector('A2', 1.2, 2);
    app.addSector(sectorA1);
    app.addSector(sectorA2);
    
    // Add a service
    const service = new Service('Test Movie', 10, { id: 'test-service' });
    app.addService(service);
    app.setCurrentServiceId('test-service');
    
    // Create DOM container
    container = document.createElement('div');
    container.id = 'seats';
    document.body.appendChild(container);
    
    // Mock onChange callback
    onChangeCallback = vi.fn();
    
    // Create renderer
    renderer = new SeatRenderer({
      container,
      getApp: () => app,
      onChange: onChangeCallback,
    });
  });

  it('should render all sectors when renderAllSectors is called', () => {
    renderer.renderAllSectors();
    
    const sectors = container.querySelectorAll('.seat-sector');
    expect(sectors).toHaveLength(2);
  });

  it('should set correct ARIA attributes on container', () => {
    renderer.renderAllSectors();
    
    expect(container.getAttribute('role')).toBe('grid');
    expect(container.getAttribute('aria-label')).toBe('Cinema seat map. Use arrow keys to move, Enter or Space to reserve.');
  });

  it('should create seat buttons with correct data attributes', () => {
    renderer.renderAllSectors();
    
    const seats = container.querySelectorAll('[data-seat-id]');
    expect(seats.length).toBeGreaterThan(0);
    
    // Check first seat has required attributes
    const firstSeat = seats[0];
    expect(firstSeat.getAttribute('data-seat-id')).toBeDefined();
    expect(firstSeat.getAttribute('data-sector-id')).toBeDefined();
    expect(firstSeat.getAttribute('data-row')).toBeDefined();
    expect(firstSeat.getAttribute('data-seat')).toBeDefined();
  });

  it('should refresh seat states based on service reservations', () => {
    const service = app.getCurrentService();
    service.addReservedSeat('s-a1-r1-s1');
    
    renderer.renderAllSectors();
    renderer.refresh();
    
    const reservedSeat = container.querySelector('[data-seat-id="s-a1-r1-s1"]');
    expect(reservedSeat.classList.contains('seat--reserved')).toBe(true);
    expect(reservedSeat.getAttribute('aria-pressed')).toBe('true');
  });

  it('should mark booked seats as disabled', () => {
    const service = app.getCurrentService();
    service.setBookedSeatsArray(['s-a1-r1-s2']);
    
    renderer.renderAllSectors();
    renderer.refresh();
    
    const bookedSeat = container.querySelector('[data-seat-id="s-a1-r1-s2"]');
    expect(bookedSeat.classList.contains('seat--booked')).toBe(true);
    expect(bookedSeat.disabled).toBe(true);
  });

  it('should update aria-labels correctly for different seat states', () => {
    const service = app.getCurrentService();
    service.addReservedSeat('s-a1-r1-s1');
    service.setBookedSeatsArray(['s-a1-r1-s2']);
    
    renderer.renderAllSectors();
    renderer.refresh();
    
    const availableSeat = container.querySelector('[data-seat-id="s-a1-r1-s3"]');
    const reservedSeat = container.querySelector('[data-seat-id="s-a1-r1-s1"]');
    const bookedSeat = container.querySelector('[data-seat-id="s-a1-r1-s2"]');
    
    expect(availableSeat.getAttribute('aria-label')).toContain('available');
    expect(reservedSeat.getAttribute('aria-label')).toContain('reserved');
    expect(bookedSeat.getAttribute('aria-label')).toContain('booked');
  });

  it('should toggle seat reservation on click', () => {
    renderer.renderAllSectors();
    
    const seat = container.querySelector('[data-seat-id="s-a1-r1-s1"]');
    seat.click();
    
    expect(onChangeCallback).toHaveBeenCalledWith(expect.objectContaining({
      action: 'SEAT_RESERVED',
      seatId: 's-a1-r1-s1',
      serviceId: 'test-service'
    }));
    
    const service = app.getCurrentService();
    expect(service.getReservedSeats()).toContain('s-a1-r1-s1');
  });

  it('should release seat reservation on second click', () => {
    renderer.renderAllSectors();
    
    const seat = container.querySelector('[data-seat-id="s-a1-r1-s1"]');
    
    // First click - reserve
    seat.click();
    expect(app.getCurrentService().getReservedSeats()).toContain('s-a1-r1-s1');
    
    // Second click - release
    seat.click();
    expect(onChangeCallback).toHaveBeenCalledWith(expect.objectContaining({
      action: 'SEAT_RESERVATION_RELEASED',
      seatId: 's-a1-r1-s1',
      serviceId: 'test-service'
    }));
    expect(app.getCurrentService().getReservedSeats()).not.toContain('s-a1-r1-s1');
  });

  it('should not toggle booked seats', () => {
    const service = app.getCurrentService();
    service.setBookedSeatsArray(['s-a1-r1-s1']);
    
    renderer.renderAllSectors();
    
    const seat = container.querySelector('[data-seat-id="s-a1-r1-s1"]');
    seat.click();
    
    // Should not call onChange for booked seats
    expect(onChangeCallback).not.toHaveBeenCalled();
  });

  it('should handle keyboard events (Enter key)', () => {
    renderer.renderAllSectors();
    renderer.refresh();
    
    const seat = container.querySelector('[data-seat-id="s-a1-r1-s1"]');
    const event = new KeyboardEvent('keydown', { 
      key: 'Enter',
      bubbles: true,
      cancelable: true
    });
    seat.dispatchEvent(event);
    
    expect(onChangeCallback).toHaveBeenCalledWith(expect.objectContaining({
      action: 'SEAT_RESERVED',
      seatId: 's-a1-r1-s1',
      serviceId: 'test-service'
    }));
  });

  it('should handle keyboard events (Space key)', () => {
    renderer.renderAllSectors();
    renderer.refresh();
    
    const seat = container.querySelector('[data-seat-id="s-a1-r1-s1"]');
    const event = new KeyboardEvent('keydown', { 
      key: ' ',
      bubbles: true,
      cancelable: true
    });
    seat.dispatchEvent(event);
    
    expect(onChangeCallback).toHaveBeenCalledWith(expect.objectContaining({
      action: 'SEAT_RESERVED',
      seatId: 's-a1-r1-s1',
      serviceId: 'test-service'
    }));
  });

  it('should not respond to other keyboard keys', () => {
    renderer.renderAllSectors();
    
    const seat = container.querySelector('[data-seat-id="s-a1-r1-s1"]');
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    seat.dispatchEvent(event);
    
    expect(onChangeCallback).not.toHaveBeenCalled();
  });

  it('should show NO_SERVICE action when no service is selected', () => {
    // Create a new renderer without any services
    const emptyApp = new SeatBookingApp('empty-room');
    const emptySector = new Sector('A1', 1.0, 3);
    emptyApp.addSector(emptySector);
    
    const emptyContainer = document.createElement('div');
    document.body.appendChild(emptyContainer);
    const emptyCallback = vi.fn();
    
    const emptyRenderer = new SeatRenderer({
      container: emptyContainer,
      getApp: () => emptyApp,
      onChange: emptyCallback,
    });
    
    emptyRenderer.renderAllSectors();
    emptyRenderer.refresh();
    
    const seat = emptyContainer.querySelector('[data-seat-id]');
    expect(seat).not.toBeNull();
    
    // Verify no service is selected
    expect(emptyApp.getCurrentService()).toBeUndefined();
    
    // Directly call toggleSeat to test the logic
    const seatId = seat.getAttribute('data-seat-id');
    emptyRenderer.toggleSeat(seatId);
    
    // Should trigger onChange with NO_SERVICE
    expect(emptyCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'NO_SERVICE',
        seatId: seatId,
        serviceId: '',
        row: '1',
        seat: '1'
      })
    );
  });

  it('should update sector labels with i18n translations', () => {
    // Create a sector with a translatable ID (s-front)
    const translatableApp = new SeatBookingApp('translatable-room');
    const frontSector = new Sector('front', 1.0, 3); // This will have ID "s-front"
    translatableApp.addSector(frontSector);
    
    const translatableContainer = document.createElement('div');
    document.body.appendChild(translatableContainer);
    
    // Change to Chinese before rendering
    i18n.setLocale('zh');
    
    const translatableRenderer = new SeatRenderer({
      container: translatableContainer,
      getApp: () => translatableApp,
      onChange: vi.fn(),
    });
    
    translatableRenderer.renderAllSectors();
    
    const sectorTitle = translatableContainer.querySelector('.seat-sector__title');
    // The sector "front" should be translated to "前排" in Chinese
    expect(sectorTitle.textContent).toBe('前排');
  });

  it('should calculate prices with correct multipliers', () => {
    renderer.renderAllSectors();
    renderer.refresh();
    
    // Query for actual seat buttons (they have data-seat-id attribute)
    const seats = container.querySelectorAll('[data-seat-id]');
    expect(seats.length).toBeGreaterThan(0);
    
    // Find seats from different sectors
    const a1Seats = Array.from(seats).filter(s => s.getAttribute('data-sector-id') === 's-a1');
    const a2Seats = Array.from(seats).filter(s => s.getAttribute('data-sector-id') === 's-a2');
    
    expect(a1Seats.length).toBeGreaterThan(0);
    expect(a2Seats.length).toBeGreaterThan(0);
    
    const a1Seat = a1Seats[0];
    const a2Seat = a2Seats[0];
    
    // A1 has multiplier 1.0, so price should be 10.00
    // A2 has multiplier 1.2, so price should be 12.00
    expect(a1Seat.getAttribute('aria-label')).toContain('$10.00');
    expect(a2Seat.getAttribute('aria-label')).toContain('$12.00');
  });

  it('should create proper DOM structure for sectors', () => {
    renderer.renderAllSectors();
    
    const sectors = container.querySelectorAll('.seat-sector');
    sectors.forEach(sector => {
      expect(sector.querySelector('.seat-sector__title')).not.toBeNull();
      expect(sector.querySelectorAll('.seat-row').length).toBeGreaterThan(0);
    });
  });

  it('should handle clicks outside of seat elements gracefully', () => {
    renderer.renderAllSectors();
    
    // Click on the container itself (not a seat)
    container.click();
    
    // Should not trigger onChange
    expect(onChangeCallback).not.toHaveBeenCalled();
  });
});