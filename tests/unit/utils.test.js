/**
 * Unit Tests for Utility Functions
 *
 * Tests general utility helper functions
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');

// Utility functions to test
const Utils = {
  generateId() {
    return 'captureai_' + Math.random().toString(36).substr(2, 9);
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  debounce(func, wait) {
    let timeout;
    let lastCallTime = 0;

    return function executedFunction(...args) {
      const now = Date.now();
      const shouldExecute = now - lastCallTime >= wait;

      const later = () => {
        clearTimeout(timeout);
        lastCallTime = Date.now();
        func.apply(this, args);
      };

      clearTimeout(timeout);

      if (shouldExecute) {
        later();
      } else {
        timeout = setTimeout(later, wait - (now - lastCallTime));
      }
    };
  }
};

describe('Utils', () => {
  describe('generateId', () => {
    test('should generate ID with correct prefix', () => {
      const id = Utils.generateId();
      expect(id).toMatch(/^captureai_/);
    });

    test('should generate unique IDs', () => {
      const id1 = Utils.generateId();
      const id2 = Utils.generateId();
      const id3 = Utils.generateId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    test('should generate IDs of consistent format', () => {
      const id = Utils.generateId();
      // Should be: captureai_ + 9 alphanumeric characters
      expect(id.length).toBeLessThanOrEqual(20);
      expect(id.length).toBeGreaterThanOrEqual(10);
    });

    test('should only contain valid characters', () => {
      const id = Utils.generateId();
      expect(id).toMatch(/^captureai_[a-z0-9]+$/);
    });
  });

  describe('delay', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should resolve after specified time', async () => {
      const promise = Utils.delay(1000);

      jest.advanceTimersByTime(999);
      await Promise.resolve(); // Tick

      jest.advanceTimersByTime(1);
      await expect(promise).resolves.toBeUndefined();
    });

    test('should not resolve before specified time', async () => {
      let resolved = false;
      Utils.delay(1000).then(() => { resolved = true; });

      jest.advanceTimersByTime(500);
      await Promise.resolve();

      expect(resolved).toBe(false);
    });

    test('should handle zero delay', async () => {
      const promise = Utils.delay(0);
      jest.advanceTimersByTime(0);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = Utils.debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should pass arguments correctly', () => {
      const mockFn = jest.fn();
      const debouncedFn = Utils.debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2');

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    test('should handle rapid calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = Utils.debounce(mockFn, 100);

      // First call - executes immediately since lastCallTime was 0
      debouncedFn();
      const firstCallCount = mockFn.mock.calls.length;

      // Rapid calls within wait period - should be debounced
      jest.advanceTimersByTime(50);
      debouncedFn();
      jest.advanceTimersByTime(40);
      debouncedFn();

      // Should still have same count (or +1 if second call executed at 100ms)
      expect(mockFn).toHaveBeenCalledTimes(firstCallCount);

      // Advance past debounce period to execute pending call
      jest.advanceTimersByTime(20); // Total: 110ms

      // Now the final debounced call should have executed
      expect(mockFn.mock.calls.length).toBeGreaterThan(firstCallCount);
    });

    test('should execute after wait time has passed', () => {
      const mockFn = jest.fn();
      const debouncedFn = Utils.debounce(mockFn, 100);

      debouncedFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(150);
      debouncedFn();

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});
