/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditLogger } from '../../src/audit/AuditLogger.js';

describe('AuditLogger', () => {
  let mockStorage;
  let mockConsole;
  let logger;

  beforeEach(() => {
    // Create mock storage
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    // Create mock console
    mockConsole = {
      warn: vi.fn(),
    };

    // Clear mocks
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      logger = new AuditLogger({ storage: mockStorage });

      expect(logger).toBeDefined();
      const entries = logger.getEntries();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries).toHaveLength(0);
    });

    it('should use custom namespace', () => {
      logger = new AuditLogger({ storage: mockStorage, namespace: 'custom' });

      logger.log('TEST_ACTION');

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'custom:auditTrail',
        expect.any(String)
      );
    });

    it('should use custom userId', () => {
      logger = new AuditLogger({ storage: mockStorage, userId: 'user123' });

      const entry = logger.log('TEST_ACTION');

      expect(entry.userId).toBe('user123');
    });

    it('should use custom sessionId', () => {
      logger = new AuditLogger({ storage: mockStorage, sessionId: 'session-abc' });

      const entry = logger.log('TEST_ACTION');

      expect(entry.sessionId).toBe('session-abc');
    });

    it('should generate sessionId when not provided', () => {
      logger = new AuditLogger({ storage: mockStorage });

      const entry = logger.log('TEST_ACTION');

      expect(entry.sessionId).toMatch(/^session-/);
    });

    it('should use custom maxEntries', () => {
      logger = new AuditLogger({ storage: mockStorage, maxEntries: 5 });

      // Add more than 5 entries
      for (let i = 0; i < 10; i++) {
        logger.log(`ACTION_${i}`);
      }

      const entries = logger.getEntries();
      expect(entries).toHaveLength(5);
    });

    it('should use default maxEntries when invalid value provided', () => {
      logger = new AuditLogger({ storage: mockStorage, maxEntries: -1 });

      for (let i = 0; i < 150; i++) {
        logger.log(`ACTION_${i}`);
      }

      const entries = logger.getEntries();
      expect(entries.length).toBeLessThanOrEqual(100); // DEFAULT_MAX_ENTRIES
    });

    it('should load existing logs from storage', () => {
      const existingLogs = [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          action: 'PREVIOUS_ACTION',
          userId: 'user1',
          sessionId: 'session-1',
          details: {},
        },
      ];

      mockStorage.getItem.mockReturnValue(JSON.stringify(existingLogs));

      logger = new AuditLogger({ storage: mockStorage });

      const entries = logger.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].action).toBe('PREVIOUS_ACTION');
    });

    it('should handle corrupted storage data gracefully', () => {
      mockStorage.getItem.mockReturnValue('invalid json');

      logger = new AuditLogger({ storage: mockStorage, console: mockConsole });

      const entries = logger.getEntries();
      expect(entries).toHaveLength(0);
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it('should handle non-array storage data', () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({ not: 'array' }));

      logger = new AuditLogger({ storage: mockStorage });

      const entries = logger.getEntries();
      expect(entries).toHaveLength(0);
    });

    it('should filter out invalid log entries', () => {
      const mixedLogs = [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          action: 'VALID_ACTION',
          userId: 'user1',
          sessionId: 'session-1',
          details: {},
        },
        'invalid',
        null,
        { timestamp: '2024-01-01T00:00:00.000Z' }, // Missing required fields
      ];

      mockStorage.getItem.mockReturnValue(JSON.stringify(mixedLogs));

      logger = new AuditLogger({ storage: mockStorage });

      const entries = logger.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].action).toBe('VALID_ACTION');
    });

    it('should work without storage (memory-only mode)', () => {
      logger = new AuditLogger({ storage: null });

      logger.log('TEST_ACTION');

      const entries = logger.getEntries();
      expect(entries).toHaveLength(1);
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });

    it('should use custom now function', () => {
      const fixedDate = new Date('2024-01-01T12:00:00.000Z');
      logger = new AuditLogger({
        storage: mockStorage,
        now: () => fixedDate,
      });

      const entry = logger.log('TEST_ACTION');

      expect(entry.timestamp).toBe('2024-01-01T12:00:00.000Z');
    });
  });

  describe('log', () => {
    beforeEach(() => {
      logger = new AuditLogger({ storage: mockStorage });
    });

    it('should create a log entry with correct structure', () => {
      const entry = logger.log('SEAT_BOOKED', { seatId: 's-a1-r1-s1', price: 10 });

      expect(entry).toHaveProperty('timestamp');
      expect(entry.action).toBe('SEAT_BOOKED');
      expect(entry.userId).toBe('anonymous');
      expect(entry.sessionId).toMatch(/^session-/);
      expect(entry.details).toEqual({ seatId: 's-a1-r1-s1', price: 10 });
    });

    it('should sanitize details by removing undefined values', () => {
      const entry = logger.log('ACTION', {
        valid: 'value',
        invalid: undefined,
        func: () => {},
      });

      expect(entry.details).toEqual({ valid: 'value' });
      expect(entry.details.invalid).toBeUndefined();
      expect(entry.details.func).toBeUndefined();
    });

    it('should handle empty details', () => {
      const entry = logger.log('ACTION');

      expect(entry.details).toEqual({});
    });

    it('should handle null details', () => {
      const entry = logger.log('ACTION', null);

      expect(entry.details).toEqual({});
    });

    it('should handle array details by returning empty object', () => {
      const entry = logger.log('ACTION', ['item1', 'item2']);

      expect(entry.details).toEqual({});
    });

    it('should convert action to string', () => {
      const entry = logger.log(123);

      expect(entry.action).toBe('123');
    });

    it('should handle empty action', () => {
      const entry = logger.log('');

      expect(entry.action).toBe('UNKNOWN_ACTION');
    });

    it('should persist to storage', () => {
      logger.log('TEST_ACTION');

      expect(mockStorage.setItem).toHaveBeenCalled();
      const storedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
      expect(storedData).toHaveLength(1);
      expect(storedData[0].action).toBe('TEST_ACTION');
    });

    it('should return a copy of the entry', () => {
      const entry = logger.log('TEST_ACTION', { key: 'value' });

      // Modify returned entry
      entry.details.key = 'modified';
      entry.action = 'MODIFIED';

      // Original should be unchanged
      const entries = logger.getEntries();
      expect(entries[0].action).toBe('TEST_ACTION');
      expect(entries[0].details.key).toBe('value');
    });

    it('should maintain log order', () => {
      logger.log('FIRST');
      logger.log('SECOND');
      logger.log('THIRD');

      const entries = logger.getEntries();
      expect(entries[0].action).toBe('FIRST');
      expect(entries[1].action).toBe('SECOND');
      expect(entries[2].action).toBe('THIRD');
    });

    it('should respect maxEntries limit', () => {
      logger = new AuditLogger({ storage: mockStorage, maxEntries: 3 });

      logger.log('A');
      logger.log('B');
      logger.log('C');
      logger.log('D');

      const entries = logger.getEntries();
      expect(entries).toHaveLength(3);
      expect(entries[0].action).toBe('B'); // Oldest removed
      expect(entries[2].action).toBe('D'); // Newest kept
    });

    it('should handle storage errors gracefully', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      logger = new AuditLogger({ storage: mockStorage, console: mockConsole });

      expect(() => logger.log('TEST_ACTION')).not.toThrow();
      expect(mockConsole.warn).toHaveBeenCalled();
    });
  });

  describe('getEntries', () => {
    beforeEach(() => {
      logger = new AuditLogger({ storage: mockStorage });
    });

    it('should return all log entries', () => {
      logger.log('ACTION_1');
      logger.log('ACTION_2');

      const entries = logger.getEntries();
      expect(entries).toHaveLength(2);
    });

    it('should return copies of entries', () => {
      logger.log('ACTION', { key: 'value' });

      const entries = logger.getEntries();
      entries[0].details.key = 'modified';

      const newEntries = logger.getEntries();
      expect(newEntries[0].details.key).toBe('value');
    });

    it('should return empty array when no logs', () => {
      const entries = logger.getEntries();
      expect(entries).toEqual([]);
    });
  });

  describe('clear', () => {
    beforeEach(() => {
      logger = new AuditLogger({ storage: mockStorage });
    });

    it('should clear all log entries', () => {
      logger.log('ACTION_1');
      logger.log('ACTION_2');

      logger.clear();

      expect(logger.getEntries()).toHaveLength(0);
    });

    it('should remove data from storage', () => {
      logger.clear();

      expect(mockStorage.removeItem).toHaveBeenCalledWith('sba:auditTrail');
    });

    it('should handle storage errors gracefully', () => {
      mockStorage.removeItem.mockImplementation(() => {
        throw new Error('Cannot remove');
      });

      logger = new AuditLogger({ storage: mockStorage, console: mockConsole });

      expect(() => logger.clear()).not.toThrow();
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it('should work without storage', () => {
      logger = new AuditLogger({ storage: null });
      logger.log('ACTION');

      expect(() => logger.clear()).not.toThrow();
      expect(logger.getEntries()).toHaveLength(0);
    });
  });

  describe('integration', () => {
    it('should handle complete workflow', () => {
      logger = new AuditLogger({
        storage: mockStorage,
        userId: 'test-user',
        maxEntries: 5,
      });

      // Log multiple actions
      logger.log('SERVICE_CREATED', { serviceName: 'Movie 1' });
      logger.log('SEAT_RESERVED', { seatId: 's-a1-r1-s1' });
      logger.log('SEATS_BOOKED', { count: 2 });

      const entries = logger.getEntries();
      expect(entries).toHaveLength(3);
      expect(entries[0].userId).toBe('test-user');
      expect(entries[0].action).toBe('SERVICE_CREATED');
      expect(entries[1].action).toBe('SEAT_RESERVED');
      expect(entries[2].action).toBe('SEATS_BOOKED');

      // Verify persistence
      expect(mockStorage.setItem).toHaveBeenCalledTimes(3);
    });

    it('should reload logs after constructor', () => {
      // Create a real in-memory storage simulation
      const storageData = new Map();
      const realMockStorage = {
        getItem: vi.fn((key) => storageData.get(key) || null),
        setItem: vi.fn((key, value) => storageData.set(key, value)),
        removeItem: vi.fn((key) => storageData.delete(key)),
      };

      // First logger instance creates logs
      const logger1 = new AuditLogger({ storage: realMockStorage });
      logger1.log('ACTION_1');
      logger1.log('ACTION_2');

      // Second logger instance should load existing logs
      const logger2 = new AuditLogger({ storage: realMockStorage });
      const entries = logger2.getEntries();

      expect(entries).toHaveLength(2);
      expect(entries[0].action).toBe('ACTION_1');
      expect(entries[1].action).toBe('ACTION_2');
    });
  });
});
