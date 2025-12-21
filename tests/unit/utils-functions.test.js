/**
 * Unit Tests for Utils Module
 *
 * Tests general utility functions
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Utils } from '../../modules/utils.js';

describe('Utils', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should execute function immediately if wait time elapsed', () => {
      // Note: This debounce implementation executes immediately if shouldExecute is true
      const mockFn = jest.fn();
      const debouncedFn = Utils.debounce(mockFn, 100);

      debouncedFn();

      // Function executes immediately on first call
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should execute on first call then queue subsequent calls', () => {
      // Note: This implementation executes immediately then queues subsequent calls
      const mockFn = jest.fn();
      const debouncedFn = Utils.debounce(mockFn, 100);

      debouncedFn(); // Executes immediately
      debouncedFn(); // Queued
      debouncedFn(); // Queued, cancels previous

      jest.advanceTimersByTime(50);
      debouncedFn(); // Queued, cancels previous

      jest.advanceTimersByTime(100);

      // First call executed immediately, last queued call executed after timeout
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should execute multiple times with sufficient wait', () => {
      const mockFn = jest.fn();
      const debouncedFn = Utils.debounce(mockFn, 100);

      debouncedFn();
      jest.advanceTimersByTime(100);

      debouncedFn();
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should pass arguments to debounced function', () => {
      const mockFn = jest.fn();
      const debouncedFn = Utils.debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2', 123);

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });

    test('should preserve context (this)', () => {
      const obj = {
        value: 42,
        fn: jest.fn(function() {
          return this.value;
        })
      };

      obj.debouncedFn = Utils.debounce(obj.fn, 100);
      obj.debouncedFn();

      jest.advanceTimersByTime(100);

      expect(obj.fn).toHaveBeenCalled();
    });

    test('should handle zero wait time', () => {
      const mockFn = jest.fn();
      const debouncedFn = Utils.debounce(mockFn, 0);

      debouncedFn();

      jest.advanceTimersByTime(0);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should execute first call immediately then last queued call', () => {
      // Note: First call executes immediately, then queued calls are debounced
      const mockFn = jest.fn();
      const debouncedFn = Utils.debounce(mockFn, 100);

      debouncedFn('first'); // Executes immediately
      jest.advanceTimersByTime(50);

      debouncedFn('second'); // Queued
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
      expect(mockFn).toHaveBeenNthCalledWith(2, 'second');
    });
  });

  describe('generateId', () => {
    test('should generate a string ID', () => {
      const id = Utils.generateId();

      expect(typeof id).toBe('string');
    });

    test('should start with captureai_ prefix', () => {
      const id = Utils.generateId();

      expect(id).toMatch(/^captureai_/);
    });

    test('should generate unique IDs', () => {
      const ids = new Set();

      for (let i = 0; i < 100; i++) {
        ids.add(Utils.generateId());
      }

      expect(ids.size).toBe(100);
    });

    test('should generate ID with expected length', () => {
      const id = Utils.generateId();

      // captureai_ (10 chars) + random part (9 chars) = 19 chars
      expect(id.length).toBe(19);
    });

    test('should only contain valid characters', () => {
      const id = Utils.generateId();

      expect(id).toMatch(/^captureai_[a-z0-9]+$/);
    });

    test('should generate different IDs on consecutive calls', () => {
      const id1 = Utils.generateId();
      const id2 = Utils.generateId();

      expect(id1).not.toBe(id2);
    });
  });

  describe('delay', () => {
    test('should return a promise', () => {
      const result = Utils.delay(100);

      expect(result).toBeInstanceOf(Promise);
    });

    test('should resolve after specified time', async () => {
      const start = Date.now();

      await Utils.delay(50);

      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow small margin
      expect(elapsed).toBeLessThan(100);
    });

    test('should resolve with undefined', async () => {
      const result = await Utils.delay(10);

      expect(result).toBeUndefined();
    });

    test('should handle zero delay', async () => {
      const start = Date.now();

      await Utils.delay(0);

      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(20);
    });

    test('should work with multiple concurrent delays', async () => {
      const start = Date.now();

      await Promise.all([
        Utils.delay(50),
        Utils.delay(50),
        Utils.delay(50)
      ]);

      const elapsed = Date.now() - start;

      // Should run in parallel, not serially
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('isElementVisible', () => {
    let mockElement;

    beforeEach(() => {
      // Mock element with getBoundingClientRect
      mockElement = {
        getBoundingClientRect: jest.fn(() => ({
          width: 100,
          height: 100,
          top: 0,
          left: 0,
          right: 100,
          bottom: 100
        }))
      };

      // Mock getComputedStyle
      global.getComputedStyle = jest.fn(() => ({
        display: 'block',
        visibility: 'visible'
      }));
    });

    test('should return false for null element', () => {
      expect(Utils.isElementVisible(null)).toBe(false);
    });

    test('should return false for undefined element', () => {
      expect(Utils.isElementVisible(undefined)).toBe(false);
    });

    test('should return true for visible element', () => {
      expect(Utils.isElementVisible(mockElement)).toBe(true);
    });

    test('should return false for element with zero width', () => {
      mockElement.getBoundingClientRect.mockReturnValue({
        width: 0,
        height: 100,
        top: 0,
        left: 0
      });

      expect(Utils.isElementVisible(mockElement)).toBe(false);
    });

    test('should return false for element with zero height', () => {
      mockElement.getBoundingClientRect.mockReturnValue({
        width: 100,
        height: 0,
        top: 0,
        left: 0
      });

      expect(Utils.isElementVisible(mockElement)).toBe(false);
    });

    test('should return false for element with display:none', () => {
      global.getComputedStyle.mockReturnValue({
        display: 'none',
        visibility: 'visible'
      });

      expect(Utils.isElementVisible(mockElement)).toBe(false);
    });

    test('should return false for element with visibility:hidden', () => {
      global.getComputedStyle.mockReturnValue({
        display: 'block',
        visibility: 'hidden'
      });

      expect(Utils.isElementVisible(mockElement)).toBe(false);
    });

    test('should return true for element with positive dimensions and visible styles', () => {
      mockElement.getBoundingClientRect.mockReturnValue({
        width: 200,
        height: 150,
        top: 0,
        left: 0
      });

      global.getComputedStyle.mockReturnValue({
        display: 'flex',
        visibility: 'visible'
      });

      expect(Utils.isElementVisible(mockElement)).toBe(true);
    });
  });

  describe('sanitizeHTML', () => {
    beforeEach(() => {
      // Mock document.createElement
      global.document = {
        createElement: jest.fn((tag) => {
          const element = {
            textContent: '',
            innerHTML: ''
          };

          // Simulate textContent setting innerHTML
          Object.defineProperty(element, 'textContent', {
            set: function(value) {
              this._text = value;
              // Simulate browser escaping HTML
              this.innerHTML = value
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');
            },
            get: function() {
              return this._text;
            }
          });

          return element;
        })
      };
    });

    test('should escape HTML tags', () => {
      const result = Utils.sanitizeHTML('<script>alert("xss")</script>');

      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    test('should escape angle brackets', () => {
      const result = Utils.sanitizeHTML('<div>content</div>');

      expect(result).toBe('&lt;div&gt;content&lt;/div&gt;');
    });

    test('should escape quotes', () => {
      const result = Utils.sanitizeHTML('text with "quotes" and \'apostrophes\'');

      expect(result).toBe('text with &quot;quotes&quot; and &#x27;apostrophes&#x27;');
    });

    test('should escape ampersands', () => {
      const result = Utils.sanitizeHTML('foo & bar');

      expect(result).toBe('foo &amp; bar');
    });

    test('should handle plain text without changes', () => {
      const result = Utils.sanitizeHTML('plain text');

      expect(result).toBe('plain text');
    });

    test('should handle empty string', () => {
      const result = Utils.sanitizeHTML('');

      expect(result).toBe('');
    });

    test('should handle complex HTML', () => {
      const input = '<img src=x onerror="alert(1)">';
      const result = Utils.sanitizeHTML(input);

      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).not.toContain('<img');
    });
  });

  describe('getElementCoordinates', () => {
    let mockElement;

    beforeEach(() => {
      global.window = {
        scrollX: 0,
        scrollY: 0
      };

      mockElement = {
        getBoundingClientRect: jest.fn(() => ({
          left: 100,
          top: 50,
          width: 200,
          height: 150,
          right: 300,
          bottom: 200
        }))
      };
    });

    test('should return element coordinates', () => {
      const coords = Utils.getElementCoordinates(mockElement);

      expect(coords).toEqual({
        x: 100,
        y: 50,
        width: 200,
        height: 150
      });
    });

    test('should include scroll offset', () => {
      global.window.scrollX = 50;
      global.window.scrollY = 100;

      const coords = Utils.getElementCoordinates(mockElement);

      expect(coords).toEqual({
        x: 150, // 100 + 50
        y: 150, // 50 + 100
        width: 200,
        height: 150
      });
    });

    test('should handle element at origin', () => {
      mockElement.getBoundingClientRect.mockReturnValue({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100
      });

      const coords = Utils.getElementCoordinates(mockElement);

      expect(coords).toEqual({
        x: 0,
        y: 0,
        width: 100,
        height: 100
      });
    });

    test('should handle negative coordinates', () => {
      mockElement.getBoundingClientRect.mockReturnValue({
        left: -50,
        top: -25,
        width: 100,
        height: 100,
        right: 50,
        bottom: 75
      });

      const coords = Utils.getElementCoordinates(mockElement);

      expect(coords.x).toBe(-50);
      expect(coords.y).toBe(-25);
    });

    test('should handle fractional values', () => {
      mockElement.getBoundingClientRect.mockReturnValue({
        left: 100.5,
        top: 50.7,
        width: 200.3,
        height: 150.9
      });

      const coords = Utils.getElementCoordinates(mockElement);

      expect(coords.x).toBe(100.5);
      expect(coords.y).toBe(50.7);
      expect(coords.width).toBe(200.3);
      expect(coords.height).toBe(150.9);
    });
  });

  describe('isInViewport', () => {
    beforeEach(() => {
      global.window = {
        innerWidth: 1920,
        innerHeight: 1080
      };
    });

    test('should return true for coordinates within viewport', () => {
      expect(Utils.isInViewport(100, 100)).toBe(true);
      expect(Utils.isInViewport(960, 540)).toBe(true);
    });

    test('should return true for origin', () => {
      expect(Utils.isInViewport(0, 0)).toBe(true);
    });

    test('should return true for bottom-right corner', () => {
      expect(Utils.isInViewport(1920, 1080)).toBe(true);
    });

    test('should return false for negative x', () => {
      expect(Utils.isInViewport(-1, 100)).toBe(false);
    });

    test('should return false for negative y', () => {
      expect(Utils.isInViewport(100, -1)).toBe(false);
    });

    test('should return false for x beyond viewport', () => {
      expect(Utils.isInViewport(1921, 100)).toBe(false);
    });

    test('should return false for y beyond viewport', () => {
      expect(Utils.isInViewport(100, 1081)).toBe(false);
    });

    test('should return false for both coordinates beyond viewport', () => {
      expect(Utils.isInViewport(2000, 2000)).toBe(false);
    });

    test('should handle small viewport', () => {
      global.window.innerWidth = 320;
      global.window.innerHeight = 568;

      expect(Utils.isInViewport(100, 100)).toBe(true);
      expect(Utils.isInViewport(400, 100)).toBe(false);
      expect(Utils.isInViewport(100, 600)).toBe(false);
    });

    test('should handle fractional coordinates', () => {
      expect(Utils.isInViewport(100.5, 100.5)).toBe(true);
      expect(Utils.isInViewport(1920.1, 1080.1)).toBe(false);
    });
  });

  describe('isAskModeActive', () => {
    beforeEach(() => {
      global.document = {
        getElementById: jest.fn()
      };
    });

    test('should return falsy value when container not found', () => {
      // Note: Implementation returns null when element not found (null && ... = null)
      global.document.getElementById.mockReturnValue(null);

      expect(Utils.isAskModeActive()).toBeFalsy();
    });

    test('should return false when container is hidden', () => {
      global.document.getElementById.mockReturnValue({
        style: { display: 'none' }
      });

      expect(Utils.isAskModeActive()).toBe(false);
    });

    test('should return true when container is visible', () => {
      global.document.getElementById.mockReturnValue({
        style: { display: 'block' }
      });

      expect(Utils.isAskModeActive()).toBe(true);
    });

    test('should check for correct element ID', () => {
      global.document.getElementById.mockReturnValue(null);

      Utils.isAskModeActive();

      expect(global.document.getElementById).toHaveBeenCalledWith('ask-mode-container');
    });

    test('should handle various display values', () => {
      const displayValues = ['block', 'flex', 'inline', 'inline-block', ''];

      displayValues.forEach(display => {
        global.document.getElementById.mockReturnValue({
          style: { display }
        });

        // All non-'none' values should return true
        expect(Utils.isAskModeActive()).toBe(display !== 'none');
      });
    });

    test('should return truthy for undefined display', () => {
      // Note: undefined !== 'none' evaluates to true
      global.document.getElementById.mockReturnValue({
        style: {}
      });

      expect(Utils.isAskModeActive()).toBeTruthy();
    });
  });

  describe('Integration Tests', () => {
    test('should chain utility functions', async () => {
      const id = Utils.generateId();

      expect(id).toMatch(/^captureai_/);

      await Utils.delay(10);

      const id2 = Utils.generateId();

      expect(id2).not.toBe(id);
    });

    test('should handle coordinates and viewport together', () => {
      global.window = {
        innerWidth: 1920,
        innerHeight: 1080,
        scrollX: 100,
        scrollY: 50
      };

      const mockElement = {
        getBoundingClientRect: () => ({
          left: 500,
          top: 300,
          width: 200,
          height: 150
        })
      };

      const coords = Utils.getElementCoordinates(mockElement);

      expect(Utils.isInViewport(coords.x, coords.y)).toBe(true);
    });
  });
});
