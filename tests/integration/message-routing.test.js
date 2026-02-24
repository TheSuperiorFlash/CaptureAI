/**
 * @jest-environment jsdom
 */

/**
 * Integration Tests: Message Routing
 * Tests message flow between popup → background → content script modules
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks, storageMock, tabsMock, runtimeMock } = require('../setup/chrome-mock');

let Messaging;

beforeEach(() => {
  resetChromeMocks();
  jest.resetModules();

  // Set up window.CaptureAI with all required modules
  window.CaptureAI = {
    STATE: {
      isPanelVisible: false,
      isAutoSolveMode: false,
      currentResponse: '',
      isProcessing: false,
      isShowingAnswer: false,
      isDragging: false,
      currentPromptType: null,
      eventListeners: [],
      selectionBox: null,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      askModeInstance: null,
      isForAskMode: false
    },
    STORAGE_KEYS: {
      LAST_CAPTURE_AREA: 'captureai-last-capture-area',
      API_KEY: 'captureai-api-key'
    },
    CONFIG: { DEBUG: false },
    PROMPT_TYPES: { ANSWER: 'answer', AUTO_SOLVE: 'auto_solve', ASK: 'ask' },
    CaptureSystem: {
      startCapture: jest.fn(),
      quickCapture: jest.fn().mockResolvedValue(undefined),
      wasVisible: false
    },
    UICore: {
      togglePanelVisibility: jest.fn(),
      showMessage: jest.fn(),
      displayAIResponse: jest.fn()
    },
    Keyboard: {
      handleCommand: jest.fn(),
      cleanup: jest.fn()
    },
    DomainUtils: {
      isOnSupportedSite: jest.fn().mockReturnValue(true)
    },
    StorageUtils: {
      getValue: jest.fn().mockResolvedValue(null)
    },
    DOM_CACHE: { panel: null, stealthyResult: null },
    AutoSolve: {
      handleAutoSolveResponse: jest.fn().mockResolvedValue(undefined)
    },
    ImageProcessing: {
      captureAndProcess: jest.fn().mockResolvedValue({
        hasError: false,
        imageData: 'base64data',
        ocrData: { text: 'test', confidence: 90 }
      })
    }
  };

  const mod = require('../../extension/modules/messaging.js');
  Messaging = mod.Messaging;
});

afterEach(() => {
  delete window.CaptureAI;
});

describe('Message Routing Integration', () => {
  describe('Popup → Content Script state sync', () => {
    test('should return full state when popup requests getState', async () => {
      window.CaptureAI.STATE.isPanelVisible = true;
      window.CaptureAI.STATE.isAutoSolveMode = true;
      window.CaptureAI.STATE.currentResponse = 'Last answer';
      window.CaptureAI.DomainUtils.isOnSupportedSite.mockReturnValue(true);
      window.CaptureAI.StorageUtils.getValue.mockResolvedValue({ x: 10, y: 20 });

      const sendResponse = jest.fn();
      const returnValue = Messaging.handleMessage(
        { action: 'getState' },
        {},
        sendResponse
      );

      // Should keep channel open for async storage
      expect(returnValue).toBe(true);

      // Wait for async storage call
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        state: {
          isPanelVisible: true,
          isAutoSolveMode: true,
          hasLastCaptureArea: true,
          isOnSupportedSite: true,
          currentResponse: 'Last answer'
        }
      });
    });
  });

  describe('Capture → Process → Display chain', () => {
    test('should start capture when popup sends startCapture', () => {
      const sendResponse = jest.fn();
      Messaging.handleMessage(
        { action: 'startCapture' },
        {},
        sendResponse
      );

      expect(window.CaptureAI.CaptureSystem.startCapture).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    test('should process image and display result', async () => {
      const sendResponse = jest.fn();
      Messaging.handleMessage(
        {
          action: 'processCapturedImage',
          imageUri: 'data:image/png;base64,test',
          startX: 0, startY: 0,
          width: 100, height: 100
        },
        {},
        sendResponse
      );

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(window.CaptureAI.ImageProcessing.captureAndProcess).toHaveBeenCalledWith(
        'data:image/png;base64,test',
        { startX: 0, startY: 0, width: 100, height: 100 }
      );

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({ hasError: false })
      );
    });

    test('should display response and trigger auto-solve handler', async () => {
      const sendResponse = jest.fn();
      Messaging.handleMessage(
        {
          action: 'displayResponse',
          response: 'Auto-solve answer',
          promptType: 'auto_solve'
        },
        {},
        sendResponse
      );

      await new Promise(resolve => setTimeout(resolve, 20));

      // State should be updated
      expect(window.CaptureAI.STATE.currentResponse).toBe('Auto-solve answer');
      expect(window.CaptureAI.STATE.isProcessing).toBe(false);

      // Auto-solve handler should be called
      expect(window.CaptureAI.AutoSolve.handleAutoSolveResponse)
        .toHaveBeenCalledWith('Auto-solve answer');

      // UI should display the response
      expect(window.CaptureAI.UICore.displayAIResponse).toHaveBeenCalled();

      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Keyboard command forwarding', () => {
    test('should forward keyboard commands to Keyboard module', () => {
      const sendResponse = jest.fn();
      Messaging.handleMessage(
        { action: 'keyboardCommand', command: 'capture_shortcut' },
        {},
        sendResponse
      );

      expect(window.CaptureAI.Keyboard.handleCommand)
        .toHaveBeenCalledWith('capture_shortcut');
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Background communication', () => {
    test('sendToBackground should send message via chrome.runtime', async () => {
      runtimeMock.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true, data: 'response' });
        return Promise.resolve({ success: true, data: 'response' });
      });

      const result = await Messaging.sendToBackground({
        action: 'testAction',
        data: 'testData'
      });

      expect(result).toEqual({ success: true, data: 'response' });
      expect(runtimeMock.sendMessage).toHaveBeenCalledWith(
        { action: 'testAction', data: 'testData' },
        expect.any(Function)
      );
    });

    test('sendToBackground should handle runtime errors', async () => {
      runtimeMock.lastError = { message: 'Extension context invalidated' };
      runtimeMock.sendMessage.mockImplementation((message, callback) => {
        callback(undefined);
        return Promise.resolve(undefined);
      });

      await expect(Messaging.sendToBackground({ action: 'test' }))
        .rejects.toThrow('Extension context invalidated');
    });
  });

  describe('Error resilience', () => {
    test('should handle missing CaptureSystem module', () => {
      delete window.CaptureAI.CaptureSystem;
      const sendResponse = jest.fn();

      Messaging.handleMessage(
        { action: 'startCapture' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'CaptureSystem not loaded'
      });
    });

    test('should handle missing UICore module', () => {
      delete window.CaptureAI.UICore;
      const sendResponse = jest.fn();

      Messaging.handleMessage(
        { action: 'togglePanel' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'UICore not available'
      });
    });

    test('should handle unknown actions gracefully', () => {
      const sendResponse = jest.fn();
      Messaging.handleMessage(
        { action: 'nonExistentAction' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown action'
      });
    });

    test('ping should always work regardless of module state', () => {
      delete window.CaptureAI;
      const sendResponse = jest.fn();

      // Ping is handled before checking CaptureAI
      Messaging.handleMessage(
        { action: 'ping' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });
  });
});
