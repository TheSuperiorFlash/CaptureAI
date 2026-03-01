/**
 * Unit Tests for Message Handlers (Backend Auth System)
 *
 * Tests background.js message handler functions that process
 * requests from content scripts and popup.
 * These now use AuthService for authentication instead of direct API key checks.
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks, storageMock, tabsMock, scriptingMock } = require('../setup/chrome-mock');
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

    sendResponseMock = jest.fn();

    mockSender = {
      tab: {
        id: 123,
        url: 'https://example.com'
      }
    };

    // Set up AuthService mock
    global.AuthService = {
      getLicenseKey: jest.fn().mockResolvedValue('TEST-KEY1-KEY2-KEY3-KEY4'),
      getCachedOrFreshUser: jest.fn().mockResolvedValue({
        user: { tier: 'free', subscription_status: 'inactive' }
      }),
      sendAIRequest: jest.fn().mockResolvedValue({
        answer: 'The answer is 42',
        usage: { total_tokens: 100 }
      })
    };

    // Mock storage to return reasoning level
    storageMock.local.get.mockImplementation((keys, callback) => {
      const result = {
        'captureai-reasoning-level': 1,
        'captureai-user-tier': 'pro',
        'captureai-settings': { privacyGuard: { enabled: true } }
      };
      if (callback) {
        callback(result);
        return undefined;
      }
      return Promise.resolve(result);
    });

    // Mock tabs.sendMessage
    tabsMock.sendMessage.mockImplementation((tabId, message, callback) => {
      if (callback) {
        callback({ success: true });
      }
      return Promise.resolve({ success: true });
    });

    // Mock tabs.captureVisibleTab
    tabsMock.captureVisibleTab.mockImplementation((windowId, options, callback) => {
      if (callback) {
        callback('data:image/png;base64,mockImageData');
      }
      return Promise.resolve('data:image/png;base64,mockImageData');
    });

    // Mock scripting API
    scriptingMock.executeScript.mockResolvedValue([{ result: true }]);
  });

  describe('handleAskQuestion', () => {
    test('should process text-only question', async () => {
      const request = {
        question: 'What is 2+2?'
      };

      await handleAskQuestion(request, mockSender, sendResponseMock);

      expect(global.AuthService.sendAIRequest).toHaveBeenCalled();
      expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
    });

    test('should process question with image', async () => {
      const request = {
        question: 'What is in this image?',
        imageData: 'data:image/png;base64,testdata'
      };

      await handleAskQuestion(request, mockSender, sendResponseMock);

      expect(global.AuthService.sendAIRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          question: 'What is in this image?',
          imageData: 'data:image/png;base64,testdata'
        })
      );
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

      expect(global.AuthService.sendAIRequest).not.toHaveBeenCalled();
    });

    test('should reject missing question', async () => {
      const request = {};

      await handleAskQuestion(request, mockSender, sendResponseMock);

      expect(sendResponseMock).toHaveBeenCalledWith({
        success: false,
        error: ERROR_MESSAGES.NO_QUESTION
      });
    });

    test('should display response to user via tabs.sendMessage', async () => {
      const request = { question: 'Test question' };

      await handleAskQuestion(request, mockSender, sendResponseMock);

      expect(tabsMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'displayResponse'
        }),
        expect.any(Function)
      );
    });

    test('should handle API errors gracefully', async () => {
      // sendToOpenAI/sendTextOnlyQuestion catch errors internally
      // and return formatted error strings, so handleAskQuestion
      // still succeeds but displays the error message to the user
      global.AuthService.sendAIRequest.mockRejectedValueOnce(
        new Error('Network error')
      );

      const request = { question: 'Test question' };

      await handleAskQuestion(request, mockSender, sendResponseMock);

      // Should display error string to user via tabs.sendMessage
      expect(tabsMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'displayResponse',
          response: expect.stringContaining('Error')
        }),
        expect.any(Function)
      );

      // Handler still returns success since sendTextOnlyQuestion
      // catches the error and returns a formatted error string
      expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('handleEnablePrivacyGuard', () => {
    test('should inject privacy guard script on valid URL for pro users', async () => {
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

    test('should reject non-pro users', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        const result = {
          'captureai-user-tier': 'free',
          'captureai-settings': { privacyGuard: { enabled: true } }
        };
        if (callback) {
          callback(result);
          return undefined;
        }
        return Promise.resolve(result);
      });

      const request = {};

      await handleEnablePrivacyGuard(request, mockSender, sendResponseMock);

      expect(scriptingMock.executeScript).not.toHaveBeenCalled();
      expect(sendResponseMock).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Pro tier')
      });
    });

    test('should reject when Privacy Guard is disabled in settings', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        const result = {
          'captureai-user-tier': 'pro',
          'captureai-settings': { privacyGuard: { enabled: false } }
        };
        if (callback) {
          callback(result);
          return undefined;
        }
        return Promise.resolve(result);
      });

      const request = {};

      await handleEnablePrivacyGuard(request, mockSender, sendResponseMock);

      expect(scriptingMock.executeScript).not.toHaveBeenCalled();
      expect(sendResponseMock).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('disabled')
      });
    });

    test('should reject injection on chrome:// URLs', async () => {
      mockSender.tab.url = 'chrome://extensions';

      const request = {};

      await handleEnablePrivacyGuard(request, mockSender, sendResponseMock);

      expect(scriptingMock.executeScript).not.toHaveBeenCalled();
      expect(sendResponseMock).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot inject on this page type'
      });
    });

    test('should reject injection on chrome-extension:// URLs', async () => {
      mockSender.tab.url = 'chrome-extension://abcdefg/popup.html';

      const request = {};

      await handleEnablePrivacyGuard(request, mockSender, sendResponseMock);

      expect(scriptingMock.executeScript).not.toHaveBeenCalled();
      expect(sendResponseMock).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot inject on this page type'
      });
    });

    test('should handle injection errors', async () => {
      scriptingMock.executeScript.mockRejectedValue(new Error('Injection failed'));

      const request = {};

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

  describe('handleCaptureArea', () => {
    const mockCaptureRequest = {
      coordinates: { startX: 0, startY: 0, width: 100, height: 100 },
      promptType: PROMPT_TYPES.ANSWER,
      isForAskMode: false
    };

    beforeEach(() => {
      // Override sendMessage so 'processCapturedImage' returns proper image data.
      tabsMock.sendMessage.mockImplementation((tabId, message, callback) => {
        if (message.action === 'processCapturedImage') {
          if (callback) {
            callback({
              success: true,
              compressedImageData: 'data:image/jpeg;base64,compressed',
              ocrData: { text: 'test question', confidence: 85, hasValidText: true, shouldFallbackToImage: false }
            });
          }
          return Promise.resolve({ success: true });
        }
        if (callback) callback({ success: true });
        return Promise.resolve({ success: true });
      });
    });

    test('captures screenshot, processes image, and sends to AI', async () => {
      await handleCaptureArea(mockCaptureRequest, mockSender, sendResponseMock);

      expect(tabsMock.captureVisibleTab).toHaveBeenCalled();
      expect(global.AuthService.sendAIRequest).toHaveBeenCalled();
      expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
    });

    test('returns image to content script when isForAskMode is true', async () => {
      const askModeRequest = { ...mockCaptureRequest, isForAskMode: true };

      await handleCaptureArea(askModeRequest, mockSender, sendResponseMock);

      // setAskModeImage is sent via Promise API (no callback argument)
      expect(tabsMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({ action: 'setAskModeImage' })
      );
      expect(global.AuthService.sendAIRequest).not.toHaveBeenCalled();
      expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
    });

    test('displays error and skips AI when processImage returns hasError', async () => {
      tabsMock.sendMessage.mockImplementation((tabId, message, callback) => {
        if (message.action === 'processCapturedImage') {
          if (callback) callback({ hasError: true, error: 'Processing failed: canvas error' });
          return Promise.resolve({ hasError: true });
        }
        if (callback) callback({ success: true });
        return Promise.resolve({ success: true });
      });

      await handleCaptureArea(mockCaptureRequest, mockSender, sendResponseMock);

      expect(global.AuthService.sendAIRequest).not.toHaveBeenCalled();
      expect(tabsMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({ action: 'displayResponse' }),
        expect.any(Function)
      );
      expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
    });

    test('defaults to ANSWER prompt type when promptType is absent', async () => {
      const requestNoPrompt = { coordinates: { startX: 0, startY: 0, width: 100, height: 100 } };

      await handleCaptureArea(requestNoPrompt, mockSender, sendResponseMock);

      expect(global.AuthService.sendAIRequest).toHaveBeenCalledWith(
        expect.objectContaining({ promptType: PROMPT_TYPES.ANSWER })
      );
    });

    test('passes imageData to AI when OCR confidence is too low (shouldFallbackToImage)', async () => {
      tabsMock.sendMessage.mockImplementation((tabId, message, callback) => {
        if (message.action === 'processCapturedImage') {
          if (callback) {
            callback({
              success: true,
              compressedImageData: 'data:image/jpeg;base64,compressed',
              ocrData: { text: '', confidence: 15, hasValidText: false, shouldFallbackToImage: true }
            });
          }
          return Promise.resolve({ success: true });
        }
        if (callback) callback({ success: true });
        return Promise.resolve({ success: true });
      });

      await handleCaptureArea(mockCaptureRequest, mockSender, sendResponseMock);

      expect(global.AuthService.sendAIRequest).toHaveBeenCalledWith(
        expect.objectContaining({ imageData: 'data:image/jpeg;base64,compressed' })
      );
    });
  });

  describe('handleTextSelection', () => {
    test('should process selected text via backend', async () => {
      const selectedText = 'Selected text to analyze';
      const tabId = 123;

      await handleTextSelection(selectedText, tabId);

      expect(global.AuthService.sendAIRequest).toHaveBeenCalled();
      expect(tabsMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          action: 'displayResponse'
        }),
        expect.any(Function)
      );
    });

    test('should handle API errors in text selection', async () => {
      global.AuthService.sendAIRequest.mockRejectedValueOnce(
        new Error('API error')
      );

      const selectedText = 'Test text';
      const tabId = 123;

      await handleTextSelection(selectedText, tabId);

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
