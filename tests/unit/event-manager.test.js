/**
 * @jest-environment jsdom
 */

/**
 * Unit Tests for EventManager Module
 *
 * Tests event listener tracking, cleanup, state reset,
 * error handling, and global error handlers
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { resetChromeMocks } from '../setup/chrome-mock.js';
import { EventManager } from '../../modules/event-manager.js';

describe('EventManager', () => {
  beforeEach(() => {
    resetChromeMocks();

    window.CaptureAI = {
      STATE: {
        eventListeners: [],
        answerFadeoutTimer: null,
        autoSolveTimer: null,
        isProcessing: false,
        isShowingAnswer: false,
        isDragging: false,
        currentPromptType: null,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        selectionBox: null
      },
      CONFIG: { DEBUG: false },
      DOM_CACHE: { panel: null, stealthyResult: null },
      UICore: { showMessage: jest.fn() },
      Keyboard: { cleanup: jest.fn() }
    };
  });

  afterEach(() => {
    // Clean up any DOM elements added during tests
    ['captureai-overlay', 'captureai-selection'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  });

  describe('init', () => {
    test('should add a beforeunload event listener to the window', () => {
      const addListenerSpy = jest.spyOn(window, 'addEventListener');

      EventManager.init();

      expect(addListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );

      addListenerSpy.mockRestore();
    });
  });

  describe('addEventListener', () => {
    test('should add a listener to the element and track it in STATE', () => {
      const element = document.createElement('div');
      const handler = jest.fn();

      const addSpy = jest.spyOn(element, 'addEventListener');

      EventManager.addEventListener(element, 'click', handler);

      expect(addSpy).toHaveBeenCalledWith('click', handler, {});
      expect(window.CaptureAI.STATE.eventListeners).toHaveLength(1);
      expect(window.CaptureAI.STATE.eventListeners[0]).toEqual({
        element,
        event: 'click',
        handler,
        options: {}
      });
    });

    test('should pass options through to the native addEventListener', () => {
      const element = document.createElement('div');
      const handler = jest.fn();
      const options = { capture: true, passive: true };

      const addSpy = jest.spyOn(element, 'addEventListener');

      EventManager.addEventListener(element, 'scroll', handler, options);

      expect(addSpy).toHaveBeenCalledWith('scroll', handler, options);
      expect(window.CaptureAI.STATE.eventListeners[0].options).toEqual(options);
    });

    test('should return early if element is null', () => {
      EventManager.addEventListener(null, 'click', jest.fn());

      expect(window.CaptureAI.STATE.eventListeners).toHaveLength(0);
    });

    test('should return early if event is empty', () => {
      const element = document.createElement('div');

      EventManager.addEventListener(element, '', jest.fn());

      expect(window.CaptureAI.STATE.eventListeners).toHaveLength(0);
    });

    test('should return early if handler is null', () => {
      const element = document.createElement('div');

      EventManager.addEventListener(element, 'click', null);

      expect(window.CaptureAI.STATE.eventListeners).toHaveLength(0);
    });

    test('should track multiple listeners', () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('span');

      EventManager.addEventListener(el1, 'click', jest.fn());
      EventManager.addEventListener(el2, 'mousemove', jest.fn());
      EventManager.addEventListener(el1, 'keydown', jest.fn());

      expect(window.CaptureAI.STATE.eventListeners).toHaveLength(3);
    });
  });

  describe('cleanup', () => {
    test('should remove all tracked event listeners', () => {
      const element = document.createElement('div');
      const handler = jest.fn();
      const removeSpy = jest.spyOn(element, 'removeEventListener');

      EventManager.addEventListener(element, 'click', handler);
      EventManager.cleanup();

      expect(removeSpy).toHaveBeenCalledWith('click', handler);
      expect(window.CaptureAI.STATE.eventListeners).toHaveLength(0);
    });

    test('should call Keyboard.cleanup', () => {
      EventManager.cleanup();

      expect(window.CaptureAI.Keyboard.cleanup).toHaveBeenCalled();
    });

    test('should clear answerFadeoutTimer', () => {
      const timerId = setTimeout(() => {}, 10000);
      window.CaptureAI.STATE.answerFadeoutTimer = timerId;
      const clearSpy = jest.spyOn(global, 'clearTimeout');

      EventManager.cleanup();

      expect(clearSpy).toHaveBeenCalledWith(timerId);
      expect(window.CaptureAI.STATE.answerFadeoutTimer).toBeNull();

      clearSpy.mockRestore();
    });

    test('should clear autoSolveTimer', () => {
      const timerId = setTimeout(() => {}, 10000);
      window.CaptureAI.STATE.autoSolveTimer = timerId;
      const clearSpy = jest.spyOn(global, 'clearTimeout');

      EventManager.cleanup();

      expect(clearSpy).toHaveBeenCalledWith(timerId);
      expect(window.CaptureAI.STATE.autoSolveTimer).toBeNull();

      clearSpy.mockRestore();
    });

    test('should not throw when timers are already null', () => {
      window.CaptureAI.STATE.answerFadeoutTimer = null;
      window.CaptureAI.STATE.autoSolveTimer = null;

      expect(() => EventManager.cleanup()).not.toThrow();
    });

    test('should handle listeners with missing element gracefully', () => {
      window.CaptureAI.STATE.eventListeners.push({
        element: null,
        event: 'click',
        handler: jest.fn()
      });

      expect(() => EventManager.cleanup()).not.toThrow();
      expect(window.CaptureAI.STATE.eventListeners).toHaveLength(0);
    });
  });

  describe('cleanupUI', () => {
    test('should remove panel from DOM and null DOM_CACHE.panel', () => {
      const panel = document.createElement('div');
      const removeSpy = jest.spyOn(panel, 'remove');
      window.CaptureAI.DOM_CACHE.panel = panel;

      EventManager.cleanupUI();

      expect(removeSpy).toHaveBeenCalled();
      expect(window.CaptureAI.DOM_CACHE.panel).toBeNull();
    });

    test('should remove stealthyResult from DOM and null reference', () => {
      const stealth = document.createElement('div');
      const removeSpy = jest.spyOn(stealth, 'remove');
      window.CaptureAI.DOM_CACHE.stealthyResult = stealth;

      EventManager.cleanupUI();

      expect(removeSpy).toHaveBeenCalled();
      expect(window.CaptureAI.DOM_CACHE.stealthyResult).toBeNull();
    });

    test('should remove captureai-overlay element from DOM', () => {
      const overlay = document.createElement('div');
      overlay.id = 'captureai-overlay';
      document.body.appendChild(overlay);

      EventManager.cleanupUI();

      expect(document.getElementById('captureai-overlay')).toBeNull();
    });

    test('should remove captureai-selection element from DOM', () => {
      const selection = document.createElement('div');
      selection.id = 'captureai-selection';
      document.body.appendChild(selection);

      EventManager.cleanupUI();

      expect(document.getElementById('captureai-selection')).toBeNull();
    });

    test('should not throw when DOM_CACHE elements are already null', () => {
      window.CaptureAI.DOM_CACHE.panel = null;
      window.CaptureAI.DOM_CACHE.stealthyResult = null;

      expect(() => EventManager.cleanupUI()).not.toThrow();
    });
  });

  describe('resetState', () => {
    test('should reset processing flags to defaults', () => {
      const { STATE } = window.CaptureAI;
      STATE.isProcessing = true;
      STATE.isShowingAnswer = true;
      STATE.isDragging = true;
      STATE.currentPromptType = 'auto_solve';

      EventManager.resetState();

      expect(STATE.isProcessing).toBe(false);
      expect(STATE.isShowingAnswer).toBe(false);
      expect(STATE.isDragging).toBe(false);
      expect(STATE.currentPromptType).toBeNull();
    });

    test('should reset all coordinates to zero', () => {
      const { STATE } = window.CaptureAI;
      STATE.startX = 100;
      STATE.startY = 200;
      STATE.endX = 300;
      STATE.endY = 400;

      EventManager.resetState();

      expect(STATE.startX).toBe(0);
      expect(STATE.startY).toBe(0);
      expect(STATE.endX).toBe(0);
      expect(STATE.endY).toBe(0);
    });

    test('should clear selectionBox reference', () => {
      window.CaptureAI.STATE.selectionBox = document.createElement('div');

      EventManager.resetState();

      expect(window.CaptureAI.STATE.selectionBox).toBeNull();
    });
  });

  describe('handleError', () => {
    test('should log error in DEBUG mode', () => {
      window.CaptureAI.CONFIG.DEBUG = true;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('test error');

      EventManager.handleError(error, 'TestContext');

      expect(consoleSpy).toHaveBeenCalledWith(
        'CaptureAI Error [TestContext]:',
        error
      );

      consoleSpy.mockRestore();
    });

    test('should not log error when DEBUG is false', () => {
      window.CaptureAI.CONFIG.DEBUG = false;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      EventManager.handleError(new Error('silent'), 'Ctx');

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test('should show user-friendly error message via UICore', () => {
      EventManager.handleError(new Error('internal'), 'Ctx');

      expect(window.CaptureAI.UICore.showMessage).toHaveBeenCalledWith(
        'An error occurred. Please try again.',
        'error'
      );
    });

    test('should call resetState to restore defaults', () => {
      const { STATE } = window.CaptureAI;
      STATE.isProcessing = true;
      STATE.isDragging = true;

      EventManager.handleError(new Error('fail'), 'Test');

      expect(STATE.isProcessing).toBe(false);
      expect(STATE.isDragging).toBe(false);
    });
  });

  describe('addGlobalErrorHandlers', () => {
    test('should add error and unhandledrejection listeners to window', () => {
      const addListenerSpy = jest.spyOn(window, 'addEventListener');

      EventManager.addGlobalErrorHandlers();

      const eventTypes = addListenerSpy.mock.calls.map(call => call[0]);
      expect(eventTypes).toContain('error');
      expect(eventTypes).toContain('unhandledrejection');

      addListenerSpy.mockRestore();
    });

    test('should handle extension errors via error event', () => {
      const showMessageSpy = window.CaptureAI.UICore.showMessage;

      EventManager.addGlobalErrorHandlers();

      const errorEvent = new ErrorEvent('error', {
        error: new Error('extension bug'),
        filename: 'chrome-extension://abc123/modules/test.js'
      });
      window.dispatchEvent(errorEvent);

      expect(showMessageSpy).toHaveBeenCalledWith(
        'An error occurred. Please try again.',
        'error'
      );
    });

    test('should ignore errors not from chrome-extension origin', () => {
      const showMessageSpy = window.CaptureAI.UICore.showMessage;

      EventManager.addGlobalErrorHandlers();

      const errorEvent = new ErrorEvent('error', {
        error: new Error('page bug'),
        filename: 'https://example.com/script.js'
      });
      window.dispatchEvent(errorEvent);

      expect(showMessageSpy).not.toHaveBeenCalled();
    });
  });
});
