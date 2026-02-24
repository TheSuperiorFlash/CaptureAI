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
