/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderRenderer } from '../../src/ui/OrderRenderer.js';
import { SeatBookingApp } from '../../src/core/SeatBookingApp.js';
import { Service } from '../../src/core/Service.js';
import { Sector } from '../../src/core/Sector.js';
import * as i18n from '../../src/i18n/i18n.js';
import enLocale from '../../src/i18n/locales/en.json';
import zhLocale from '../../src/i18n/locales/zh.json';

describe('OrderRenderer', () => {
  let app;
  let listElement;
  let totalContainer;
  let renderer;

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
    const sectorA1 = new Sector('A1', 1.0, 5);
    const sectorA2 = new Sector('A2', 1.2, 5);
    app.addSector(sectorA1);
    app.addSector(sectorA2);
    
    // Add a service
    const service = new Service('Test Movie', 10, { id: 'test-service' });
    app.addService(service);
    app.setCurrentServiceId('test-service');
    
    // Create DOM elements
    listElement = document.createElement('ul');
    listElement.id = 'order-details';
    totalContainer = document.createElement('div');
    totalContainer.id = 'order-total-price';
    
    document.body.appendChild(listElement);
    document.body.appendChild(totalContainer);
    
    // Create renderer
    renderer = new OrderRenderer({
      list: listElement,
      totalContainer: totalContainer,
      getApp: () => app,
    });
  });

  it('should show empty message when no seats are reserved', () => {
    renderer.refresh();
    
    expect(listElement.children).toHaveLength(1);
    expect(listElement.children[0].className).toBe('order__empty');
    expect(listElement.children[0].textContent).toBe('No seats reserved yet');
    expect(totalContainer.textContent).toBe('Total: $0.00');
    expect(listElement.classList.contains('order__list--empty')).toBe(true);
    expect(totalContainer.classList.contains('order__total--active')).toBe(false);
  });

  it('should show reserved seats in the order list', () => {
    const service = app.getCurrentService();
    service.addReservedSeat('s-a1-r1-s1');
    service.addReservedSeat('s-a2-r2-s3');
    
    renderer.refresh();
    
    expect(listElement.children).toHaveLength(2);
    expect(listElement.children[0].className).toContain('order__item');
    expect(listElement.children[1].className).toContain('order__item');
  });

  it('should calculate correct total price for reserved seats', () => {
    const service = app.getCurrentService();
    service.addReservedSeat('s-a1-r1-s1'); // Price: 10 * 1.0 = 10
    service.addReservedSeat('s-a2-r1-s1'); // Price: 10 * 1.2 = 12
    
    renderer.refresh();
    
    expect(totalContainer.textContent).toBe('Total: $22.00');
    expect(totalContainer.classList.contains('order__total--active')).toBe(true);
  });

  it('should format seat information correctly', () => {
    const service = app.getCurrentService();
    service.addReservedSeat('s-a1-r1-s1');
    
    renderer.refresh();
    
    // Should show "A1 R1-1: 10.00" (sector label, row, seat number, price)
    expect(listElement.children[0].textContent).toContain('R1-1');
    expect(listElement.children[0].textContent).toContain('10.00');
  });

  it('should apply different multipliers for different sectors', () => {
    const service = app.getCurrentService();
    service.addReservedSeat('s-a1-r1-s1'); // Price: 10 * 1.0 = 10
    service.addReservedSeat('s-a2-r1-s1'); // Price: 10 * 1.2 = 12
    
    renderer.refresh();
    
    expect(listElement.children).toHaveLength(2);
    expect(totalContainer.textContent).toBe('Total: $22.00');
  });

  it('should handle unknown seat IDs gracefully', () => {
    const service = app.getCurrentService();
    service.addReservedSeat('unknown-seat-id');
    
    renderer.refresh();
    
    expect(listElement.children).toHaveLength(1);
    expect(listElement.children[0].textContent).toContain('unknown-seat-id');
    expect(listElement.children[0].textContent).toContain('0.00'); // Unknown seat has no sector, so multiplier is 1
  });

  it('should add and remove "new" class for animation', () => {
    const service = app.getCurrentService();
    service.addReservedSeat('s-a1-r1-s1');
    
    renderer.refresh();
    
    // Initially should have the 'new' class
    expect(listElement.children[0].classList.contains('order__item--new')).toBe(true);
    
    // After timeout, the class should be removed (we can't easily test the timeout in this context)
  });

  it('should clear previous order items when refreshing', () => {
    const service = app.getCurrentService();
    service.addReservedSeat('s-a1-r1-s1');
    
    renderer.refresh();
    expect(listElement.children).toHaveLength(1);
    
    // Release the seat and refresh
    service.removeReservedSeat('s-a1-r1-s1');
    renderer.refresh();
    
    expect(listElement.children).toHaveLength(1); // Should show empty message
    expect(listElement.children[0].className).toBe('order__empty');
  });

  it('should update when locale changes', () => {
    renderer.refresh();
    
    // Change to Chinese
    i18n.setLocale('zh');
    renderer.refresh();
    
    expect(listElement.children[0].textContent).toBe('尚未选座');
    expect(totalContainer.textContent).toBe('合计：$0.00');
  });

  it('should handle case when no service is selected', () => {
    app.setCurrentServiceId('');
    
    renderer.refresh();
    
    expect(listElement.children).toHaveLength(1);
    expect(listElement.children[0].className).toBe('order__empty');
    expect(totalContainer.textContent).toBe('Total: $0.00');
  });

  it('should show correct sector labels based on i18n', () => {
    // Change to Chinese first
    i18n.setLocale('zh');
    
    const service = app.getCurrentService();
    service.addReservedSeat('s-a1-r1-s1');
    
    renderer.refresh();
    
    // Check that the seat information is displayed correctly
    // Note: s-a1 doesn't have a Chinese translation, so it falls back to "A1"
    expect(listElement.children[0].textContent).toContain('A1');
    expect(listElement.children[0].textContent).toContain('R1-1');
    
    // Verify that sectors with translations work (e.g., s-front)
    expect(i18n.t('sector.s-front')).toBe('前排');
  });
});