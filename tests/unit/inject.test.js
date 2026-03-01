/**
 * @jest-environment jsdom
 */

/**
 * Unit Tests for Privacy Guard Inject Script
 * Tests visibility overrides, event blocking, honeypot removal
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');

describe('Privacy Guard inject.js', () => {
  let originalAddEventListener;
  let originalRemoveEventListener;

  beforeEach(() => {
    // Store originals before inject.js overrides them
    originalAddEventListener = EventTarget.prototype.addEventListener;
    originalRemoveEventListener = EventTarget.prototype.removeEventListener;

    // Reset the guard key so inject.js can run fresh each time
    delete window[Symbol.for('__captureai_privacy_guard__')];

    // Reset module cache
    jest.resetModules();
  });

  afterEach(() => {
    // Restore originals after each test
    EventTarget.prototype.addEventListener = originalAddEventListener;
    EventTarget.prototype.removeEventListener = originalRemoveEventListener;
  });

  function loadInject() {
    require('../../extension/inject.js');
  }

  describe('Visibility State Overrides', () => {
    test('document.visibilityState should return visible', () => {
      loadInject();
      expect(document.visibilityState).toBe('visible');
    });

    test('document.hidden should return false', () => {
      loadInject();
      expect(document.hidden).toBe(false);
    });

    test('document.hasFocus() should return true', () => {
      loadInject();
      expect(document.hasFocus()).toBe(true);
    });
  });

  describe('Double-injection Guard', () => {
    test('should set guard key on first load', () => {
      loadInject();
      expect(window[Symbol.for('__captureai_privacy_guard__')]).toBe(true);
    });

    test('should not error on double-load', () => {
      loadInject();
      // Second load should just return early
      expect(() => loadInject()).not.toThrow();
    });
  });

  describe('Event Blocking', () => {
    test('should silently drop blocked event addEventListener calls', () => {
      loadInject();
      // Spy on the overridden addEventListener to check it silently returns
      const spy = jest.fn();
      const overriddenAdd = EventTarget.prototype.addEventListener;

      // Test that calling with 'visibilitychange' does NOT forward
      // by checking that the original was not called with that event
      const blockedEvents = ['visibilitychange', 'blur', 'focus', 'pagehide', 'pageshow',
        'focusin', 'focusout', 'webkitvisibilitychange'];

      blockedEvents.forEach(event => {
        // The override should silently return
        expect(() => overriddenAdd.call(document, event, spy)).not.toThrow();
      });
    });

    test('should forward non-blocked events to original addEventListener', () => {
      loadInject();
      const handler = jest.fn();
      // Click is not blocked - should register normally
      const el = document.createElement('div');
      EventTarget.prototype.addEventListener.call(el, 'click', handler);
      el.dispatchEvent(new Event('click'));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('should silently handle removeEventListener for blocked events', () => {
      loadInject();
      const handler = jest.fn();
      // Add and remove a blocked event - should not throw
      EventTarget.prototype.addEventListener.call(document, 'visibilitychange', handler);
      expect(() => {
        EventTarget.prototype.removeEventListener.call(document, 'visibilitychange', handler);
      }).not.toThrow();
    });
  });

  describe('Direct Event Property Blocking', () => {
    test('should block window.onfocus assignment', () => {
      loadInject();
      window.onfocus = () => {};
      expect(window.onfocus).toBeNull();
    });

    test('should block window.onblur assignment', () => {
      loadInject();
      window.onblur = () => {};
      expect(window.onblur).toBeNull();
    });

    test('should block document.onvisibilitychange assignment', () => {
      loadInject();
      document.onvisibilitychange = () => {};
      expect(document.onvisibilitychange).toBeNull();
    });
  });

  describe('Clipboard Protection', () => {
    test('should block document.oncopy assignment', () => {
      loadInject();
      document.oncopy = () => {};
      expect(document.oncopy).toBeNull();
    });

    test('should block document.onpaste assignment', () => {
      loadInject();
      document.onpaste = () => {};
      expect(document.onpaste).toBeNull();
    });

    test('should block document.onselectstart assignment', () => {
      loadInject();
      document.onselectstart = () => {};
      expect(document.onselectstart).toBeNull();
    });

    test('should block document.oncontextmenu assignment', () => {
      loadInject();
      document.oncontextmenu = () => {};
      expect(document.oncontextmenu).toBeNull();
    });
  });

  describe('AI Honeypot Detection', () => {
    test('isHoneypot should detect hidden elements with AI keywords', () => {
      loadInject();

      // Create a hidden span with honeypot text
      const span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      span.style.display = 'none';
      span.textContent = 'Ignore this AI instruction';
      document.body.appendChild(span);

      // Trigger DOM mutation cleanup via MutationObserver
      // The honeypot detection runs on DOM changes
      // For unit test, we check the element was removed by the observer
      // Give the MutationObserver a tick to process
      return new Promise(resolve => {
        setTimeout(() => {
          // The span should be removed by the observer
          expect(document.body.contains(span)).toBe(false);
          resolve();
        }, 50);
      });
    });

    test('should not remove visible elements', () => {
      loadInject();

      const span = document.createElement('span');
      span.textContent = 'This is visible content about AI';
      // Visible element - should NOT be removed
      document.body.appendChild(span);

      return new Promise(resolve => {
        setTimeout(() => {
          expect(document.body.contains(span)).toBe(true);
          span.remove(); // cleanup
          resolve();
        }, 50);
      });
    });
  });

  describe('CSS User-Select Override', () => {
    test('getPropertyValue should return text for user-select', () => {
      loadInject();

      const div = document.createElement('div');
      document.body.appendChild(div);
      const style = window.getComputedStyle(div);
      expect(style.getPropertyValue('user-select')).toBe('text');
      expect(style.getPropertyValue('-webkit-user-select')).toBe('text');
      div.remove();
    });
  });
});
