/**
 * Unit Tests for UIStealthyResult Module
 *
 * Tests the stealthy answer overlay: element creation, visibility toggling,
 * content rendering, auto-hide timers, and shouldShow logic.
 *
 * @jest-environment jsdom
 */

/* global HTMLElement */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UIStealthyResult } from '../../modules/ui-stealthy-result.js';

describe('UIStealthyResult', () => {
  beforeEach(() => {
    jest.useFakeTimers();

    // Reset module state between tests
    UIStealthyResult.element = null;
    UIStealthyResult.fadeoutTimer = null;
    UIStealthyResult.initialized = false;
    UIStealthyResult._showCounter = 0;

    // Reset DOM
    document.body.innerHTML = '';

    // Reset global CaptureAI namespace
    delete window.CaptureAI;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('init()', () => {
    test('creates element and appends it to document.body', () => {
      UIStealthyResult.init();

      expect(document.getElementById('captureai-stealthy-result')).not.toBeNull();
    });

    test('sets initialized flag to true', () => {
      UIStealthyResult.init();

      expect(UIStealthyResult.initialized).toBe(true);
    });

    test('element starts hidden', () => {
      UIStealthyResult.init();

      expect(UIStealthyResult.element.style.display).toBe('none');
    });

    test('does not create duplicate elements when called twice', () => {
      UIStealthyResult.init();
      UIStealthyResult.init();

      expect(document.querySelectorAll('[id="captureai-stealthy-result"]').length).toBe(1);
    });

    test('uses CONFIG.STEALTHY_RESULT_ID when CaptureAI CONFIG is present', () => {
      window.CaptureAI = { CONFIG: { STEALTHY_RESULT_ID: 'custom-stealthy-id' } };

      UIStealthyResult.init();

      expect(document.getElementById('custom-stealthy-id')).not.toBeNull();
    });

    test('caches element in CaptureAI.STATE.uiElements when STATE is available', () => {
      window.CaptureAI = {
        STATE: { uiElements: {} }
      };

      UIStealthyResult.init();

      expect(window.CaptureAI.STATE.uiElements.stealthyResult).toBe(UIStealthyResult.element);
    });

    test('caches element in CaptureAI.DOM_CACHE when available', () => {
      window.CaptureAI = {
        DOM_CACHE: {}
      };

      UIStealthyResult.init();

      expect(window.CaptureAI.DOM_CACHE.stealthyResult).toBe(UIStealthyResult.element);
    });
  });

  describe('show()', () => {
    test('sets textContent to the message', () => {
      UIStealthyResult.init();

      UIStealthyResult.show('Test message');

      expect(UIStealthyResult.element.textContent).toBe('Test message');
    });

    test('renders message as plain text (not parsed as markup)', () => {
      UIStealthyResult.init();
      const rawString = '<b>bold</b>';

      UIStealthyResult.show(rawString);

      // textContent preserves raw string; no child elements should be created
      expect(UIStealthyResult.element.textContent).toBe(rawString);
      expect(UIStealthyResult.element.querySelector('b')).toBeNull();
    });

    test('makes the element visible', () => {
      UIStealthyResult.init();

      UIStealthyResult.show('Hello');

      expect(UIStealthyResult.element.style.display).toBe('block');
      expect(UIStealthyResult.element.style.opacity).toBe('1');
    });

    test('uses error color when isError is true', () => {
      UIStealthyResult.init();

      UIStealthyResult.show('Oops', true);

      expect(UIStealthyResult.element.style.getPropertyValue('color')).toContain('255, 100, 100');
    });

    test('uses normal color when isError is false (default)', () => {
      UIStealthyResult.init();

      UIStealthyResult.show('All good', false);

      expect(UIStealthyResult.element.style.getPropertyValue('color')).toContain('150, 150, 150');
    });

    test('calls init() automatically if element is not yet initialized', () => {
      expect(UIStealthyResult.element).toBeNull();

      UIStealthyResult.show('Auto init');

      expect(UIStealthyResult.initialized).toBe(true);
      expect(UIStealthyResult.element.textContent).toBe('Auto init');
    });

    test('hides element after 2500ms via fadeout timer', () => {
      UIStealthyResult.init();
      UIStealthyResult.show('Fading out');

      jest.advanceTimersByTime(2500);

      expect(UIStealthyResult.element.style.opacity).toBe('0');
    });

    test('removes display after opacity transition completes (3000ms)', () => {
      UIStealthyResult.init();
      UIStealthyResult.show('Gone');

      jest.advanceTimersByTime(3000);

      expect(UIStealthyResult.element.style.display).toBe('none');
    });

    test('cancels stale timer when show() is called again before hide', () => {
      UIStealthyResult.init();
      UIStealthyResult.show('First');

      // Advance partway, then show again
      jest.advanceTimersByTime(1000);
      UIStealthyResult.show('Second');

      // Advance past original 2500ms — element should still be visible
      jest.advanceTimersByTime(2000);

      // The first timer was cancelled; element should still be visible (opacity=1)
      expect(UIStealthyResult.element.style.opacity).toBe('1');
    });

    test('updates STATE.answerFadeoutTimer when CaptureAI STATE is present', () => {
      window.CaptureAI = {
        STATE: { answerFadeoutTimer: null, uiElements: {} }
      };
      UIStealthyResult.init();

      UIStealthyResult.show('With state');

      expect(window.CaptureAI.STATE.answerFadeoutTimer).not.toBeNull();
    });
  });

  describe('hide()', () => {
    test('hides element immediately', () => {
      UIStealthyResult.init();
      UIStealthyResult.show('Visible');

      UIStealthyResult.hide();

      expect(UIStealthyResult.element.style.display).toBe('none');
      expect(UIStealthyResult.element.style.opacity).toBe('0');
    });

    test('cancels pending fadeout timer', () => {
      UIStealthyResult.init();
      UIStealthyResult.show('Cancel me');

      UIStealthyResult.hide();

      expect(UIStealthyResult.fadeoutTimer).toBeNull();
    });

    test('does nothing if element is not yet initialized', () => {
      expect(() => UIStealthyResult.hide()).not.toThrow();
    });

    test('clears STATE.answerFadeoutTimer when CaptureAI STATE is present', () => {
      window.CaptureAI = {
        STATE: { answerFadeoutTimer: 999, uiElements: {} }
      };
      UIStealthyResult.init();
      UIStealthyResult.show('Hide me');

      UIStealthyResult.hide();

      expect(window.CaptureAI.STATE.answerFadeoutTimer).toBeNull();
    });
  });

  describe('shouldShow()', () => {
    test('returns true when CaptureAI.STATE is absent', () => {
      delete window.CaptureAI;

      expect(UIStealthyResult.shouldShow()).toBe(true);
    });

    test('returns true when panel is not visible', () => {
      window.CaptureAI = { STATE: { isPanelVisible: false } };

      expect(UIStealthyResult.shouldShow()).toBe(true);
    });

    test('returns false when panel is visible', () => {
      window.CaptureAI = { STATE: { isPanelVisible: true } };

      expect(UIStealthyResult.shouldShow()).toBe(false);
    });
  });

  describe('getElement()', () => {
    test('returns null before init', () => {
      expect(UIStealthyResult.getElement()).toBeNull();
    });

    test('returns the DOM element after init', () => {
      UIStealthyResult.init();

      const el = UIStealthyResult.getElement();

      expect(el).toBeInstanceOf(HTMLElement);
      expect(el.id).toBe('captureai-stealthy-result');
    });
  });
});
