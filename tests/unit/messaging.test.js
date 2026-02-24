/**
 * @jest-environment jsdom
 */

/**
 * Unit Tests for Messaging Module
 *
 * Tests Chrome extension message handling, routing,
 * and background communication
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { resetChromeMocks, runtimeMock } from '../setup/chrome-mock.js';
import { Messaging } from '../../modules/messaging.js';

describe('Messaging', () => {
  let sendResponse;

  beforeEach(() => {
    resetChromeMocks();
    sendResponse = jest.fn();

    window.CaptureAI = {
      STATE: {
        isPanelVisible: false,
        isAutoSolveMode: false,
        currentResponse: '',
        isProcessing: false,
        eventListeners: []
      },
      STORAGE_KEYS: { LAST_CAPTURE_AREA: 'captureai-last-capture-area' },
      CONFIG: { DEBUG: false },
      PROMPT_TYPES: { AUTO_SOLVE: 'auto_solve' },
      CaptureSystem: {
        startCapture: jest.fn(),
        quickCapture: jest.fn().mockResolvedValue(undefined)
      },
      UICore: {
        togglePanelVisibility: jest.fn(),
        showMessage: jest.fn(),
        displayAIResponse: jest.fn()
      },
      Keyboard: { handleCommand: jest.fn() },
      DomainUtils: { isOnSupportedSite: jest.fn().mockReturnValue(false) },
      StorageUtils: { getValue: jest.fn().mockResolvedValue(null) },
      DOM_CACHE: { panel: null },
      AutoSolve: {
        handleAutoSolveResponse: jest.fn().mockResolvedValue(undefined)
      },
      ImageProcessing: {
        captureAndProcess: jest.fn().mockResolvedValue({ success: true })
      }
    };
  });

  describe('init', () => {
    test('should register a message listener via chrome.runtime.onMessage', () => {
      Messaging.init();

      expect(runtimeMock.onMessage.addListener).toHaveBeenCalledTimes(1);
      expect(typeof runtimeMock.onMessage.addListener.mock.calls[0][0]).toBe('function');
    });
  });

  describe('handleMessage - ping', () => {
    test('should respond with success true', () => {
      const result = Messaging.handleMessage(
        { action: 'ping' }, {}, sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({ success: true });
      expect(result).toBe(false);
    });
  });

  describe('handleMessage - getState', () => {
    test('should return true to keep message channel open', () => {
      const result = Messaging.handleMessage(
        { action: 'getState' }, {}, sendResponse
      );

      expect(result).toBe(true);
    });

    test('should respond with state including isPanelVisible and isAutoSolveMode', async () => {
      window.CaptureAI.STATE.isPanelVisible = true;
      window.CaptureAI.STATE.isAutoSolveMode = true;

      Messaging.handleMessage({ action: 'getState' }, {}, sendResponse);

      // StorageUtils.getValue returns a Promise; wait for it
      await Promise.resolve();

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          state: expect.objectContaining({
            isPanelVisible: true,
            isAutoSolveMode: true
          })
        })
      );
    });

    test('should set hasLastCaptureArea true when storage has a value', async () => {
      window.CaptureAI.StorageUtils.getValue.mockResolvedValue({ x: 10 });

      Messaging.handleMessage({ action: 'getState' }, {}, sendResponse);
      await Promise.resolve();

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          state: expect.objectContaining({ hasLastCaptureArea: true })
        })
      );
    });

    test('should set hasLastCaptureArea false when storage returns null', async () => {
      window.CaptureAI.StorageUtils.getValue.mockResolvedValue(null);

      Messaging.handleMessage({ action: 'getState' }, {}, sendResponse);
      await Promise.resolve();

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          state: expect.objectContaining({ hasLastCaptureArea: false })
        })
      );
    });

    test('should respond with error when modules are not loaded', () => {
      window.CaptureAI = undefined;

      const result = Messaging.handleMessage(
        { action: 'getState' }, {}, sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Modules not loaded yet'
      });
      expect(result).toBe(false);
    });

    test('should fallback when StorageUtils is unavailable', () => {
      window.CaptureAI.StorageUtils = null;

      Messaging.handleMessage({ action: 'getState' }, {}, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          state: expect.objectContaining({ hasLastCaptureArea: false })
        })
      );
    });

    test('should handle storage getValue rejection gracefully', async () => {
      window.CaptureAI.StorageUtils.getValue.mockRejectedValue(
        new Error('storage error')
      );

      Messaging.handleMessage({ action: 'getState' }, {}, sendResponse);

      // Need a microtask tick for the catch to fire
      await new Promise(r => setTimeout(r, 0));

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          state: expect.objectContaining({ hasLastCaptureArea: false })
        })
      );
    });

    test('should include isOnSupportedSite from DomainUtils', async () => {
      window.CaptureAI.DomainUtils.isOnSupportedSite.mockReturnValue(true);

      Messaging.handleMessage({ action: 'getState' }, {}, sendResponse);
      await Promise.resolve();

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          state: expect.objectContaining({ isOnSupportedSite: true })
        })
      );
    });
  });

  describe('handleMessage - startCapture', () => {
    test('should call CaptureSystem.startCapture and respond with success', () => {
      const result = Messaging.handleMessage(
        { action: 'startCapture' }, {}, sendResponse
      );

      expect(window.CaptureAI.CaptureSystem.startCapture).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
      expect(result).toBe(false);
    });

    test('should respond with error when CaptureSystem is not loaded', () => {
      window.CaptureAI.CaptureSystem = undefined;

      const result = Messaging.handleMessage(
        { action: 'startCapture' }, {}, sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'CaptureSystem not loaded'
      });
      expect(result).toBe(false);
    });

    test('should respond with error when startCapture throws', () => {
      window.CaptureAI.CaptureSystem.startCapture.mockImplementation(() => {
        throw new Error('capture failed');
      });

      Messaging.handleMessage({ action: 'startCapture' }, {}, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'capture failed'
      });
    });
  });

  describe('handleMessage - quickCapture', () => {
    test('should return true to keep message channel open for async', () => {
      const result = Messaging.handleMessage(
        { action: 'quickCapture' }, {}, sendResponse
      );

      expect(result).toBe(true);
    });

    test('should call CaptureSystem.quickCapture and respond with success', async () => {
      Messaging.handleMessage({ action: 'quickCapture' }, {}, sendResponse);
      await Promise.resolve();

      expect(window.CaptureAI.CaptureSystem.quickCapture).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    test('should respond with error when CaptureSystem is not loaded', () => {
      window.CaptureAI.CaptureSystem = undefined;

      const result = Messaging.handleMessage(
        { action: 'quickCapture' }, {}, sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'CaptureSystem not loaded'
      });
      expect(result).toBe(false);
    });

    test('should respond with error when quickCapture rejects', async () => {
      window.CaptureAI.CaptureSystem.quickCapture.mockRejectedValue(
        new Error('quick capture error')
      );

      Messaging.handleMessage({ action: 'quickCapture' }, {}, sendResponse);
      await new Promise(r => setTimeout(r, 0));

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'quick capture error'
      });
    });
  });

  describe('handleMessage - togglePanel', () => {
    test('should call UICore.togglePanelVisibility and respond with success', () => {
      const result = Messaging.handleMessage(
        { action: 'togglePanel' }, {}, sendResponse
      );

      expect(window.CaptureAI.UICore.togglePanelVisibility).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
      expect(result).toBe(false);
    });

    test('should respond with error when UICore is unavailable', () => {
      window.CaptureAI.UICore = undefined;

      const result = Messaging.handleMessage(
        { action: 'togglePanel' }, {}, sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'UICore not available'
      });
      expect(result).toBe(false);
    });
  });

  describe('handleMessage - setAutoSolve', () => {
    test('should update STATE.isAutoSolveMode and respond with success', () => {
      const result = Messaging.handleMessage(
        { action: 'setAutoSolve', isAutoSolveMode: true }, {}, sendResponse
      );

      expect(window.CaptureAI.STATE.isAutoSolveMode).toBe(true);
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
      expect(result).toBe(false);
    });

    test('should update DOM toggle element when it exists', () => {
      const toggle = document.createElement('input');
      toggle.id = 'auto-solve-toggle';
      toggle.type = 'checkbox';
      toggle.checked = false;
      document.body.appendChild(toggle);

      Messaging.handleMessage(
        { action: 'setAutoSolve', isAutoSolveMode: true }, {}, sendResponse
      );

      expect(toggle.checked).toBe(true);

      toggle.remove();
    });
  });

  describe('handleMessage - showCapturingMessage', () => {
    test('should call UICore.showMessage with Capturing text', () => {
      const result = Messaging.handleMessage(
        { action: 'showCapturingMessage' }, {}, sendResponse
      );

      expect(window.CaptureAI.UICore.showMessage).toHaveBeenCalledWith(
        'Capturing...', false
      );
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
      expect(result).toBe(false);
    });
  });

  describe('handleMessage - showProcessingMessage', () => {
    test('should call UICore.showMessage with Processing text', () => {
      const result = Messaging.handleMessage(
        { action: 'showProcessingMessage' }, {}, sendResponse
      );

      expect(window.CaptureAI.UICore.showMessage).toHaveBeenCalledWith(
        'Processing...', false
      );
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
      expect(result).toBe(false);
    });
  });

  describe('handleMessage - displayResponse', () => {
    test('should return true to keep message channel open for async', () => {
      const result = Messaging.handleMessage(
        { action: 'displayResponse', response: 'Answer here' }, {}, sendResponse
      );

      expect(result).toBe(true);
    });

    test('should update STATE and call displayRegularResponse', async () => {
      Messaging.handleMessage(
        { action: 'displayResponse', response: 'test answer' }, {}, sendResponse
      );
      await new Promise(r => setTimeout(r, 0));

      expect(window.CaptureAI.STATE.isProcessing).toBe(false);
      expect(window.CaptureAI.STATE.currentResponse).toBe('test answer');
      expect(window.CaptureAI.UICore.displayAIResponse).toHaveBeenCalledWith(
        'test answer', false
      );
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    test('should trigger auto-solve handler when promptType is AUTO_SOLVE', async () => {
      Messaging.handleMessage(
        {
          action: 'displayResponse',
          response: 'auto answer',
          promptType: 'auto_solve'
        },
        {},
        sendResponse
      );
      await new Promise(r => setTimeout(r, 0));

      expect(
        window.CaptureAI.AutoSolve.handleAutoSolveResponse
      ).toHaveBeenCalledWith('auto answer');
    });

    test('should return false when window.CaptureAI is undefined', () => {
      window.CaptureAI = undefined;

      const result = Messaging.handleMessage(
        { action: 'displayResponse', response: 'x' }, {}, sendResponse
      );

      expect(result).toBe(false);
    });
  });

  describe('handleMessage - keyboardCommand', () => {
    test('should forward command to Keyboard.handleCommand', () => {
      const result = Messaging.handleMessage(
        { action: 'keyboardCommand', command: 'toggle-panel' },
        {},
        sendResponse
      );

      expect(window.CaptureAI.Keyboard.handleCommand).toHaveBeenCalledWith(
        'toggle-panel'
      );
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
      expect(result).toBe(false);
    });

    test('should respond with error when Keyboard module is not loaded', () => {
      window.CaptureAI.Keyboard = undefined;

      const result = Messaging.handleMessage(
        { action: 'keyboardCommand', command: 'test' }, {}, sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Keyboard module not loaded'
      });
      expect(result).toBe(false);
    });
  });

  describe('handleMessage - debugLogImage', () => {
    test('should log image data and respond with success', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = Messaging.handleMessage(
        { action: 'debugLogImage', imageData: 'data:image/png;base64,abc' },
        {},
        sendResponse
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'CaptureAI Debug - Captured Image Data:'
      );
      expect(consoleSpy).toHaveBeenCalledWith('data:image/png;base64,abc');
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
      expect(result).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('handleMessage - unknown action', () => {
    test('should respond with error for unrecognized actions', () => {
      const result = Messaging.handleMessage(
        { action: 'nonExistentAction' }, {}, sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown action'
      });
      expect(result).toBe(false);
    });
  });

  describe('sendToBackground', () => {
    test('should resolve with response on success', async () => {
      runtimeMock.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true, data: 'test' });
      });

      const response = await Messaging.sendToBackground({ action: 'test' });

      expect(runtimeMock.sendMessage).toHaveBeenCalledWith(
        { action: 'test' },
        expect.any(Function)
      );
      expect(response).toEqual({ success: true, data: 'test' });
    });

    test('should reject when chrome.runtime.lastError is set', async () => {
      runtimeMock.sendMessage.mockImplementation((message, callback) => {
        runtimeMock.lastError = { message: 'Extension context invalidated' };
        callback(undefined);
        runtimeMock.lastError = null;
      });

      await expect(
        Messaging.sendToBackground({ action: 'fail' })
      ).rejects.toThrow('Extension context invalidated');
    });
  });

  describe('displayRegularResponse', () => {
    test('should call UICore.displayAIResponse for normal responses', () => {
      Messaging.displayRegularResponse('The answer is 42');

      expect(
        window.CaptureAI.UICore.displayAIResponse
      ).toHaveBeenCalledWith('The answer is 42', false);
    });

    test('should set isError true for responses starting with Error:', () => {
      Messaging.displayRegularResponse('Error: something went wrong');

      expect(
        window.CaptureAI.UICore.displayAIResponse
      ).toHaveBeenCalledWith('Error: something went wrong', true);
    });

    test('should set isError true for responses containing failed', () => {
      Messaging.displayRegularResponse('Request failed due to timeout');

      expect(
        window.CaptureAI.UICore.displayAIResponse
      ).toHaveBeenCalledWith('Request failed due to timeout', true);
    });

    test('should fallback to showMessage when displayAIResponse is unavailable', () => {
      window.CaptureAI.UICore.displayAIResponse = undefined;

      Messaging.displayRegularResponse('fallback response');

      expect(window.CaptureAI.UICore.showMessage).toHaveBeenCalledWith(
        'fallback response', false
      );
    });
  });
});
