/**
 * @jest-environment jsdom
 */

/**
 * Unit Tests for Keyboard Module
 *
 * Tests the actual Keyboard module from extension/modules/keyboard.js
 * including init, cleanup, handleKeyDown, handleCommand, handleEscapeKey
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Keyboard } from '../../modules/keyboard.js';

describe('Keyboard Module', () => {
  let mockState;
  let mockDomCache;

  beforeEach(() => {
    mockState = {
      isProcessing: false,
      isPanelVisible: false,
      isAutoSolveMode: false,
      isShowingAnswer: false,
      isAskMode: false,
      answerFadeoutTimer: null
    };

    mockDomCache = {
      panel: {
        style: { display: 'none' }
      }
    };

    window.CaptureAI = {
      STATE: mockState,
      DOM_CACHE: mockDomCache,
      CONFIG: { RESULT_ID: 'captureai-result', PANEL_ID: 'captureai-panel' },
      STORAGE_KEYS: { ASK_MODE: 'captureai-ask-mode' },
      CaptureSystem: {
        startCapture: jest.fn(),
        quickCapture: jest.fn(),
        cancelSelection: jest.fn()
      },
      UICore: {
        togglePanelVisibility: jest.fn(),
        switchMode: jest.fn(),
        setPanelVisibility: jest.fn((visible) => {
          mockState.isPanelVisible = visible;
          mockDomCache.panel.style.display = visible ? 'block' : 'none';
        })
      },
      AutoSolve: {
        toggleAutoSolveMode: jest.fn()
      },
      UIStealthyResult: {
        hide: jest.fn()
      },
      StorageUtils: {
        setValue: jest.fn()
      }
    };

    // Clean up any previous bindings
    Keyboard.boundHandleKeyDown = null;
  });

  afterEach(() => {
    Keyboard.cleanup();
  });

  describe('init and cleanup', () => {
    test('should bind keydown event listener on init', () => {
      const spy = jest.spyOn(document, 'addEventListener');
      Keyboard.init();

      expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(Keyboard.boundHandleKeyDown).not.toBeNull();
      spy.mockRestore();
    });

    test('should remove keydown event listener on cleanup', () => {
      Keyboard.init();
      const removeSpy = jest.spyOn(document, 'removeEventListener');

      Keyboard.cleanup();

      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(Keyboard.boundHandleKeyDown).toBeNull();
      removeSpy.mockRestore();
    });

    test('should not throw on cleanup without init', () => {
      expect(() => Keyboard.cleanup()).not.toThrow();
    });
  });

  describe('handleKeyDown', () => {
    test('should call handleEscapeKey on Escape', () => {
      const spy = jest.spyOn(Keyboard, 'handleEscapeKey');
      Keyboard.handleKeyDown({ key: 'Escape' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should not call handleEscapeKey for other keys', () => {
      const spy = jest.spyOn(Keyboard, 'handleEscapeKey');
      Keyboard.handleKeyDown({ key: 'Enter' });
      Keyboard.handleKeyDown({ key: 'a' });
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('handleCommand', () => {
    test('should call startCapture for capture_shortcut when not processing', () => {
      Keyboard.handleCommand('capture_shortcut');
      expect(window.CaptureAI.CaptureSystem.startCapture).toHaveBeenCalled();
    });

    test('should not call startCapture when processing', () => {
      mockState.isProcessing = true;
      Keyboard.handleCommand('capture_shortcut');
      expect(window.CaptureAI.CaptureSystem.startCapture).not.toHaveBeenCalled();
    });

    test('should call quickCapture for quick_capture_shortcut', () => {
      Keyboard.handleCommand('quick_capture_shortcut');
      expect(window.CaptureAI.CaptureSystem.quickCapture).toHaveBeenCalled();
    });

    test('should call togglePanelVisibility for toggle_ui_shortcut', () => {
      Keyboard.handleCommand('toggle_ui_shortcut');
      expect(window.CaptureAI.UICore.togglePanelVisibility).toHaveBeenCalled();
    });

    test('should do nothing for unknown commands', () => {
      Keyboard.handleCommand('unknown_command');
      expect(window.CaptureAI.CaptureSystem.startCapture).not.toHaveBeenCalled();
      expect(window.CaptureAI.CaptureSystem.quickCapture).not.toHaveBeenCalled();
      expect(window.CaptureAI.UICore.togglePanelVisibility).not.toHaveBeenCalled();
    });

    test('should do nothing when window.CaptureAI is undefined', () => {
      window.CaptureAI = undefined;
      expect(() => Keyboard.handleCommand('capture_shortcut')).not.toThrow();
    });

    test('should do nothing when STATE is undefined', () => {
      window.CaptureAI = { STATE: undefined };
      expect(() => Keyboard.handleCommand('capture_shortcut')).not.toThrow();
    });

    test('should handle missing CaptureSystem gracefully', () => {
      window.CaptureAI.CaptureSystem = undefined;
      expect(() => Keyboard.handleCommand('capture_shortcut')).not.toThrow();
    });

    test('should handle missing UICore gracefully', () => {
      window.CaptureAI.UICore = undefined;
      expect(() => Keyboard.handleCommand('toggle_ui_shortcut')).not.toThrow();
    });
  });

  describe('handleEscapeKey', () => {
    test('should cancel selection if overlay exists', () => {
      const overlay = document.createElement('div');
      overlay.id = 'captureai-overlay';
      document.body.appendChild(overlay);

      Keyboard.handleEscapeKey();

      expect(window.CaptureAI.CaptureSystem.cancelSelection).toHaveBeenCalled();
      overlay.remove();
    });

    test('should clear processing state', () => {
      mockState.isProcessing = true;
      Keyboard.handleEscapeKey();
      expect(mockState.isProcessing).toBe(false);
    });

    test('should disable auto-solve first (stage 1)', () => {
      mockState.isAutoSolveMode = true;
      Keyboard.handleEscapeKey();
      expect(window.CaptureAI.AutoSolve.toggleAutoSolveMode).toHaveBeenCalledWith(false);
    });

    test('should not hide panel when disabling auto-solve', () => {
      mockState.isAutoSolveMode = true;
      mockState.isPanelVisible = true;
      mockDomCache.panel.style.display = 'block';

      Keyboard.handleEscapeKey();

      // Panel should stay visible (stage 1 only disables auto-solve)
      expect(mockDomCache.panel.style.display).toBe('block');
    });

    test('should hide panel when auto-solve already disabled (stage 2)', () => {
      mockState.isAutoSolveMode = false;
      mockState.isPanelVisible = true;

      Keyboard.handleEscapeKey();

      expect(mockDomCache.panel.style.display).toBe('none');
      expect(mockState.isPanelVisible).toBe(false);
    });

    test('should clear fadeout timer when showing answer', () => {
      mockState.isShowingAnswer = true;
      mockState.answerFadeoutTimer = 999;

      Keyboard.handleEscapeKey();

      expect(mockState.answerFadeoutTimer).toBeNull();
    });

    test('should exit ask mode if active', () => {
      mockState.isAskMode = true;

      Keyboard.handleEscapeKey();

      expect(mockState.isAskMode).toBe(false);
      expect(window.CaptureAI.StorageUtils.setValue).toHaveBeenCalledWith(
        'captureai-ask-mode',
        false
      );
      expect(window.CaptureAI.UICore.switchMode).toHaveBeenCalledWith(false);
    });
  });

  describe('getShortcutsHelp', () => {
    test('should return help text with all shortcuts', () => {
      const help = Keyboard.getShortcutsHelp();

      expect(help).toContain('Ctrl+Shift+X');
      expect(help).toContain('Ctrl+Shift+F');
      expect(help).toContain('Ctrl+Shift+E');
      expect(help).toContain('Escape');
    });
  });
});
