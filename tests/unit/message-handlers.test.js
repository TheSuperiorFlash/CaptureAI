/**
 * Unit Tests for Message Handlers
 *
 * Tests background.js message handler functions that process
 * requests from content scripts and popup
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks, storageMock, tabsMock, runtimeMock, scriptingMock } = require('../setup/chrome-mock');
const {
  handleCaptureArea,
  handleAskQuestion,
  handleEnablePrivacyGuard,
  handleDisablePrivacyGuard,
  handleGetPrivacyGuardStatus,
  handleTextSelection,
  PROMPT_TYPES,
  ERROR_MESSAGES
} = require('../../background.js');

describe('Message Handlers', () => {
  let sendResponseMock;
  let mockSender;

  beforeEach(() => {
    resetChromeMocks();
    global.fetch = require('jest-fetch-mock');
    fetch.resetMocks();

    // Mock sendResponse callback
    sendResponseMock = jest.fn();

    // Mock sender object
    mockSender = {
      tab: {
        id: 123,
        url: 'https://example.com'
      }
    };

    // Mock storage to return API key and reasoning level
    storageMock.local.get.mockImplementation((keys, callback) => {
      const result = {
        'captureai-api-key': 'sk-test-key-12345',
        'captureai-reasoning-level': 1
      };
      if (callback) {
        callback(result);
        return undefined;
      }
      return Promise.resolve(result);
    });

    // Mock tabs.sendMessage to not throw errors
    tabsMock.sendMessage.mockImplementation((tabId, message, callback) => {
      if (callback) {
        callback({ success: true });
      }
      return Promise.resolve({ success: true });
    });

    // Mock tabs.captureVisibleTab
    tabsMock.captureVisibleTab.mockImplementation((windowId, options, callback) => {
      callback('data:image/png;base64,mockImageData');
    });

    // Mock scripting API
    scriptingMock.executeScript.mockResolvedValue([{ result: true }]);
  });

  describe('handleCaptureArea', () => {
    test('should successfully capture and process screenshot', async () => {
      const request = {
        coordinates: {
          startX: 10,
          startY: 20,
          width: 100,
          height: 50
        },
        promptType: PROMPT_TYPES.ANSWER
      };

      // Mock successful fetch response
      fetch.mockResponseOnce(JSON.stringify({
        choices: [{ message: { content: 'The answer is 42' } }]
      }));

      await handleCaptureArea(request, mockSender, sendResponseMock);

      // Should send capturing message
      expect(tabsMock.sendMessage).toHaveBeenCalledWith(
        123,
        { action: 'showCapturingMessage' },
        expect.any(Function)
      );

      // Should capture screenshot
      expect(tabsMock.captureVisibleTab).toHaveBeenCalled();

      // Should respond with success
      expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
    });

    test('should handle ask mode and return image data', async () => {
      const request = {
        coordinates: {
          startX: 0,
          startY: 0,
          width: 100,
          height: 100
        },
        isForAskMode: true
      };

      // Mock image processing to return compressed image data
      tabsMock.sendMessage.mockImplementation((tabId, message, callback) => {
        if (message.action === 'processCapturedImage') {
          if (callback) {
            callback({ compressedImageData: 'data:image/png;base64,compressed' });
          }
          return Promise.resolve({ compressedImageData: 'data:image/png;base64,compressed' });
        }
        if (callback) {
          callback({ success: true });
        }
        return Promise.resolve({ success: true });
      });

      await handleCaptureArea(request, mockSender, sendResponseMock);

      // Should send image data back to content script
      expect(tabsMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'setAskModeImage',
          imageData: 'data:image/png;base64,compressed'
        })
      );

      expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
    });

    test('should handle capture errors', async () => {
      const request = {
        coordinates: {
          startX: 0,
          startY: 0,
          width: 100,
          height: 100
        }
      };

      // Mock capture failure
      tabsMock.captureVisibleTab.mockImplementation((windowId, options, callback) => {
        throw new Error('Capture failed');
      });

      await handleCaptureArea(request, mockSender, sendResponseMock);

      expect(sendResponseMock).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Capture failed')
      });
    });

    test('should handle image processing errors', async () => {
      const request = {
        coordinates: {
          startX: 0,
          startY: 0,
          width: 100,
          height: 100
        }
      };

      // Mock sendMessage to return error from image processing
      tabsMock.sendMessage.mockImplementation((tabId, message, callback) => {
        if (message.action === 'processCapturedImage') {
          if (callback) {
            callback({ hasError: true, error: 'Invalid dimensions' });
          }
          return Promise.resolve({ hasError: true, error: 'Invalid dimensions' });
        }
        if (callback) {
          callback({ success: true });
        }
        return Promise.resolve({ success: true });
      });

      await handleCaptureArea(request, mockSender, sendResponseMock);

      expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('handleAskQuestion', () => {
    test('should process text-only question', async () => {
      const request = {
        question: 'What is 2+2?'
      };

      fetch.mockResponseOnce(JSON.stringify({
        choices: [{ message: { content: '4' } }]
      }));

      await handleAskQuestion(request, mockSender, sendResponseMock);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST'
        })
      );

      expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
    });

    test('should process question with image', async () => {
      const request = {
        question: 'What is in this image?',
        imageData: 'data:image/png;base64,testdata'
      };

      fetch.mockResponseOnce(JSON.stringify({
        choices: [{ message: { content: 'A cat' } }]
      }));

      await handleAskQuestion(request, mockSender, sendResponseMock);

      expect(fetch).toHaveBeenCalled();
      expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
    });

    test('should reject empty question', async () => {
      const request = {
        question: '   '
      };

      await handleAskQuestion(request, mockSender, sendResponseMock);

      expect(sendResponseMock).toHaveBeenCalledWith({
        success: false,
        error: ERROR_MESSAGES.NO_QUESTION
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    test('should reject missing question', async () => {
      const request = {};

      await handleAskQuestion(request, mockSender, sendResponseMock);

      expect(sendResponseMock).toHaveBeenCalledWith({
        success: false,
        error: ERROR_MESSAGES.NO_QUESTION
      });
    });

    test('should handle missing API key', async () => {
      const request = {
        question: 'Test question'
      };

      // Mock no API key
      storageMock.local.get.mockImplementation((keys, callback) => {
        const result = { 'captureai-api-key': '' };
        if (callback) {
          callback(result);
          return undefined;
        }
        return Promise.resolve(result);
      });

      await handleAskQuestion(request, mockSender, sendResponseMock);

      expect(sendResponseMock).toHaveBeenCalledWith({
        success: false,
        error: ERROR_MESSAGES.NO_API_KEY
      });
    });

    test('should handle API errors', async () => {
      const request = {
        question: 'Test question'
      };

      fetch.mockReject(new Error('Network error'));

      await handleAskQuestion(request, mockSender, sendResponseMock);

      // Should display error message to user via tabs.sendMessage
      expect(tabsMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'displayResponse',
          response: expect.stringContaining('Error')
        }),
        expect.any(Function)
      );

      // Should still call sendResponse (error was handled)
      expect(sendResponseMock).toHaveBeenCalled();
    });
  });

  describe('handleEnablePrivacyGuard', () => {
    test('should inject privacy guard script on valid URL', async () => {
      const request = {};

      await handleEnablePrivacyGuard(request, mockSender, sendResponseMock);

      expect(scriptingMock.executeScript).toHaveBeenCalledWith({
        target: { tabId: 123 },
        files: ['inject.js'],
        world: 'MAIN',
        injectImmediately: true
      });

      expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
    });

    test('should reject injection on chrome:// URLs', async () => {
      const request = {};
      mockSender.tab.url = 'chrome://extensions';

      await handleEnablePrivacyGuard(request, mockSender, sendResponseMock);

      expect(scriptingMock.executeScript).not.toHaveBeenCalled();
      expect(sendResponseMock).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot inject on this page type'
      });
    });

    test('should reject injection on chrome-extension:// URLs', async () => {
      const request = {};
      mockSender.tab.url = 'chrome-extension://abcdefg/popup.html';

      await handleEnablePrivacyGuard(request, mockSender, sendResponseMock);

      expect(scriptingMock.executeScript).not.toHaveBeenCalled();
      expect(sendResponseMock).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot inject on this page type'
      });
    });

    test('should handle injection errors', async () => {
      const request = {};

      scriptingMock.executeScript.mockRejectedValue(new Error('Injection failed'));

      await handleEnablePrivacyGuard(request, mockSender, sendResponseMock);

      expect(sendResponseMock).toHaveBeenCalledWith({
        success: false,
        error: 'Injection failed'
      });
    });
  });

  describe('handleDisablePrivacyGuard', () => {
    test('should acknowledge disable request', async () => {
      const request = {};

      await handleDisablePrivacyGuard(request, mockSender, sendResponseMock);

      expect(sendResponseMock).toHaveBeenCalledWith({
        success: true,
        note: 'Privacy guard persists until page reload'
      });
    });
  });

  describe('handleGetPrivacyGuardStatus', () => {
    test('should return available status', async () => {
      const request = {};

      await handleGetPrivacyGuardStatus(request, mockSender, sendResponseMock);

      expect(sendResponseMock).toHaveBeenCalledWith({
        enabled: true,
        available: true
      });
    });
  });

  describe('handleTextSelection', () => {
    test('should process selected text', async () => {
      const selectedText = 'Selected text to analyze';
      const tabId = 123;

      fetch.mockResponseOnce(JSON.stringify({
        choices: [{ message: { content: 'Analysis result' } }]
      }));

      await handleTextSelection(selectedText, tabId);

      expect(fetch).toHaveBeenCalled();
      expect(tabsMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'displayResponse'
        }),
        expect.any(Function)
      );
    });

    test('should handle empty selected text', async () => {
      const selectedText = '';
      const tabId = 123;

      await handleTextSelection(selectedText, tabId);

      // Should still try to process (API will handle empty text)
      expect(fetch).toHaveBeenCalled();
    });

    test('should handle API errors in text selection', async () => {
      const selectedText = 'Test text';
      const tabId = 123;

      fetch.mockReject(new Error('API error'));

      await handleTextSelection(selectedText, tabId);

      // Should display error message
      expect(tabsMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'displayResponse',
          response: expect.stringContaining('Error')
        }),
        expect.any(Function)
      );
    });
  });
});
