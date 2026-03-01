/**
 * Unit Tests for OpenAI API Functions (Backend Auth System)
 *
 * Tests sendToOpenAI and sendTextOnlyQuestion functions
 * These now use AuthService.sendAIRequest() instead of direct fetch calls
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks, storageMock } = require('../setup/chrome-mock');
const {
  PROMPT_TYPES,
  OPENAI_CONFIG,
  ERROR_MESSAGES,
  formatError,
  sendToOpenAI,
  sendTextOnlyQuestion
} = require('../../background.js');

describe('sendToOpenAI', () => {
  const mockImageData = 'data:image/png;base64,iVBORw0KGgo';

  beforeEach(() => {
    resetChromeMocks();

    // Mock storage to return default reasoning level
    storageMock.local.get.mockImplementation((keys, callback) => {
      const result = { 'captureai-reasoning-level': 1 };
      if (callback) {
        callback(result);
        return undefined;
      }
      return Promise.resolve(result);
    });

    // Ensure AuthService global is properly set up
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
  });

  describe('successful API calls', () => {
    test('should return AI response for ANSWER prompt', async () => {
      const result = await sendToOpenAI(
        { imageData: mockImageData },
        null,
        PROMPT_TYPES.ANSWER
      );

      expect(result).toBe('The answer is 42');
      expect(global.AuthService.sendAIRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          promptType: PROMPT_TYPES.ANSWER,
          imageData: mockImageData
        })
      );
    });

    test('should return AI response for AUTO_SOLVE prompt', async () => {
      global.AuthService.sendAIRequest.mockResolvedValueOnce({
        answer: '2',
        usage: { total_tokens: 50 }
      });

      const result = await sendToOpenAI(
        { imageData: mockImageData },
        null,
        PROMPT_TYPES.AUTO_SOLVE
      );

      expect(result).toBe('2');
    });

    test('should return AI response for ASK prompt with question', async () => {
      global.AuthService.sendAIRequest.mockResolvedValueOnce({
        answer: 'This is a diagram of a circle',
        usage: { total_tokens: 80 }
      });

      const result = await sendToOpenAI(
        { imageData: mockImageData, question: 'What is this?' },
        null,
        PROMPT_TYPES.ASK
      );

      expect(result).toBe('This is a diagram of a circle');
      expect(global.AuthService.sendAIRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          question: 'What is this?'
        })
      );
    });

    test('should handle empty answer with fallback message', async () => {
      global.AuthService.sendAIRequest.mockResolvedValueOnce({
        answer: '',
        usage: { total_tokens: 10 }
      });

      const result = await sendToOpenAI(
        { imageData: mockImageData },
        null
      );

      expect(result).toBe('No response found');
    });

    test('should handle null answer with fallback message', async () => {
      global.AuthService.sendAIRequest.mockResolvedValueOnce({
        usage: { total_tokens: 10 }
      });

      const result = await sendToOpenAI(
        { imageData: mockImageData },
        null
      );

      expect(result).toBe('No response found');
    });

    test('should include OCR text in request payload', async () => {
      await sendToOpenAI(
        {
          imageData: mockImageData,
          ocrText: 'Extracted text from image',
          ocrConfidence: 85
        },
        null
      );

      expect(global.AuthService.sendAIRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          ocrText: 'Extracted text from image',
          ocrConfidence: 85
        })
      );
    });

    test('should not include empty question in payload', async () => {
      await sendToOpenAI(
        { imageData: mockImageData, question: '   ' },
        null
      );

      const payload = global.AuthService.sendAIRequest.mock.calls[0][0];
      expect(payload.question).toBeUndefined();
    });

    test('should cache usage data in storage', async () => {
      await sendToOpenAI(
        { imageData: mockImageData },
        null
      );

      expect(storageMock.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'captureai-last-usage': expect.objectContaining({
            data: { total_tokens: 100 }
          })
        })
      );
    });

    test('should include reasoning level in payload', async () => {
      await sendToOpenAI(
        { imageData: mockImageData },
        null
      );

      const payload = global.AuthService.sendAIRequest.mock.calls[0][0];
      expect(payload.reasoningLevel).toBeDefined();
    });
  });

  describe('error handling', () => {
    test('should return error when AuthService is undefined', async () => {
      const savedAuthService = global.AuthService;
      delete global.AuthService;

      const result = await sendToOpenAI(
        { imageData: mockImageData },
        null
      );

      expect(result).toContain('Error:');
      expect(result).toContain('Authentication service not available');

      global.AuthService = savedAuthService;
    });

    test('should return error when no license key', async () => {
      global.AuthService.getLicenseKey.mockResolvedValueOnce(null);

      const result = await sendToOpenAI(
        { imageData: mockImageData },
        null
      );

      expect(result).toContain('Error:');
      expect(result).toContain('activate CaptureAI');
    });

    test('should return error when no cached user', async () => {
      global.AuthService.getCachedOrFreshUser.mockResolvedValueOnce({
        user: null
      });

      const result = await sendToOpenAI(
        { imageData: mockImageData },
        null
      );

      expect(result).toContain('Error:');
      expect(result).toContain('activate CaptureAI');
    });

    test('should handle API request errors', async () => {
      global.AuthService.sendAIRequest.mockRejectedValueOnce(
        new Error('Network failure')
      );

      const result = await sendToOpenAI(
        { imageData: mockImageData },
        null
      );

      expect(result).toContain('Error:');
    });

    test('should handle rate limit errors from backend', async () => {
      global.AuthService.sendAIRequest.mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      );

      const result = await sendToOpenAI(
        { imageData: mockImageData },
        null
      );

      expect(result).toContain('Error:');
      expect(result).toContain('Rate limit exceeded');
    });
  });
});

describe('sendTextOnlyQuestion', () => {
  beforeEach(() => {
    resetChromeMocks();

    storageMock.local.get.mockImplementation((keys, callback) => {
      const result = { 'captureai-reasoning-level': 1 };
      if (callback) {
        callback(result);
        return undefined;
      }
      return Promise.resolve(result);
    });

    global.AuthService = {
      getLicenseKey: jest.fn().mockResolvedValue('TEST-KEY1-KEY2-KEY3-KEY4'),
      getCachedOrFreshUser: jest.fn().mockResolvedValue({
        user: { tier: 'free', subscription_status: 'inactive' }
      }),
      sendAIRequest: jest.fn().mockResolvedValue({
        answer: 'Paris is the capital of France',
        usage: { total_tokens: 50 }
      })
    };
  });

  describe('successful API calls', () => {
    test('should return AI response for text question', async () => {
      const result = await sendTextOnlyQuestion('What is the capital of France?');

      expect(result).toBe('Paris is the capital of France');
      expect(global.AuthService.sendAIRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          question: 'What is the capital of France?',
          promptType: PROMPT_TYPES.ASK
        })
      );
    });

    test('should not include image data in text-only request', async () => {
      await sendTextOnlyQuestion('test question');

      const payload = global.AuthService.sendAIRequest.mock.calls[0][0];
      expect(payload.imageData).toBeUndefined();
    });

    test('should handle empty response content', async () => {
      global.AuthService.sendAIRequest.mockResolvedValueOnce({
        answer: '',
        usage: {}
      });

      const result = await sendTextOnlyQuestion('test');

      expect(result).toBe('No response found');
    });
  });

  describe('error handling', () => {
    test('should return error when AuthService unavailable', async () => {
      const savedAuthService = global.AuthService;
      delete global.AuthService;

      const result = await sendTextOnlyQuestion('test');

      expect(result).toContain('Error:');
      expect(result).toContain('Authentication service not available');

      global.AuthService = savedAuthService;
    });

    test('should return error when no license key', async () => {
      global.AuthService.getLicenseKey.mockResolvedValueOnce(null);

      const result = await sendTextOnlyQuestion('test');

      expect(result).toContain('Error:');
      expect(result).toContain('activate CaptureAI');
    });

    test('should handle API errors', async () => {
      global.AuthService.sendAIRequest.mockRejectedValueOnce(
        new Error('Connection timeout')
      );

      const result = await sendTextOnlyQuestion('test');

      expect(result).toContain('Error:');
    });
  });
});
