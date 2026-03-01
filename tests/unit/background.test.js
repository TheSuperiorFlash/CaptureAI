/**
 * Unit Tests for background.js — AI Config & Utility Functions
 *
 * Focuses on functions not covered by the existing screenshot.test.js,
 * openai-api.test.js, and message-handlers.test.js files:
 *   - getAIConfig: reasoning level → model/effort mapping
 *   - formatError: error message formatting
 *   - getStoredApiKey: storage retrieval
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks, storageMock, tabsMock, setRuntimeError, clearRuntimeError } = require('../setup/chrome-mock');
const {
  getAIConfig,
  formatError,
  getStoredApiKey,
  isValidUrl,
  processImage,
  OPENAI_CONFIG,
  PROMPT_TYPES
} = require('../../extension/background.js');

describe('background.js', () => {
  beforeEach(() => {
    resetChromeMocks();
    clearRuntimeError();
  });

  // ---------------------------------------------------------------------------
  // getAIConfig
  // ---------------------------------------------------------------------------

  describe('getAIConfig()', () => {
    test('level 0 → gpt-4.1-nano with no reasoning effort (legacy params)', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        if (callback) {
          callback({ 'captureai-reasoning-level': 0 });
          return undefined;
        }
        return Promise.resolve({ 'captureai-reasoning-level': 0 });
      });

      const config = await getAIConfig();

      expect(config.MODEL).toBe('gpt-4.1-nano');
      expect(config.REASONING_EFFORT).toBeNull();
      expect(config.USE_LEGACY_PARAMS).toBe(true);
    });

    test('level 1 → gpt-5-nano with low reasoning effort', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        if (callback) {
          callback({ 'captureai-reasoning-level': 1 });
          return undefined;
        }
        return Promise.resolve({ 'captureai-reasoning-level': 1 });
      });

      const config = await getAIConfig();

      expect(config.MODEL).toBe('gpt-5-nano');
      expect(config.REASONING_EFFORT).toBe('low');
      expect(config.USE_LEGACY_PARAMS).toBe(false);
    });

    test('level 2 → gpt-5-nano with medium reasoning effort', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        if (callback) {
          callback({ 'captureai-reasoning-level': 2 });
          return undefined;
        }
        return Promise.resolve({ 'captureai-reasoning-level': 2 });
      });

      const config = await getAIConfig();

      expect(config.MODEL).toBe('gpt-5-nano');
      expect(config.REASONING_EFFORT).toBe('medium');
      expect(config.USE_LEGACY_PARAMS).toBe(false);
    });

    test('missing level (undefined) defaults to medium (level 1)', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        if (callback) {
          callback({}); // no key present
          return undefined;
        }
        return Promise.resolve({});
      });

      const config = await getAIConfig();

      expect(config.MODEL).toBe('gpt-5-nano');
      expect(config.REASONING_EFFORT).toBe('low');
    });

    test('invalid level (e.g. 99) falls back to medium (level 1)', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        if (callback) {
          callback({ 'captureai-reasoning-level': 99 });
          return undefined;
        }
        return Promise.resolve({ 'captureai-reasoning-level': 99 });
      });

      const config = await getAIConfig();

      expect(config.MODEL).toBe('gpt-5-nano');
      expect(config.REASONING_EFFORT).toBe('low');
    });

    test('returns OPENAI_CONFIG base properties in the result', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        if (callback) {
          callback({ 'captureai-reasoning-level': 1 });
          return undefined;
        }
        return Promise.resolve({ 'captureai-reasoning-level': 1 });
      });

      const config = await getAIConfig();

      expect(config).toHaveProperty('API_URL');
      expect(config).toHaveProperty('MAX_TOKENS');
      expect(config.MAX_TOKENS).toEqual(OPENAI_CONFIG.MAX_TOKENS);
    });

    test('falls back to medium config when storage throws', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        if (callback) {
          throw new Error('Storage unavailable');
        }
        return Promise.reject(new Error('Storage unavailable'));
      });

      const config = await getAIConfig();

      // Should return the medium fallback without throwing
      expect(config.MODEL).toBe('gpt-5-nano');
      expect(config.REASONING_EFFORT).toBe('low');
      expect(config.USE_LEGACY_PARAMS).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // formatError
  // ---------------------------------------------------------------------------

  describe('formatError()', () => {
    test('prepends "Error: " to the message', () => {
      expect(formatError('Something went wrong')).toBe('Error: Something went wrong');
    });

    test('handles empty string', () => {
      expect(formatError('')).toBe('Error: ');
    });

    test('handles message that already starts with Error', () => {
      expect(formatError('Error: nested')).toBe('Error: Error: nested');
    });
  });

  // ---------------------------------------------------------------------------
  // getStoredApiKey
  // ---------------------------------------------------------------------------

  describe('getStoredApiKey()', () => {
    test('returns stored API key when present', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'captureai-api-key': 'sk-test-key-123' });
      });

      const key = await getStoredApiKey();

      expect(key).toBe('sk-test-key-123');
    });

    test('returns empty string when API key is not set', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const key = await getStoredApiKey();

      expect(key).toBe('');
    });

    test('returns empty string when storage value is undefined', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'captureai-api-key': undefined });
      });

      const key = await getStoredApiKey();

      expect(key).toBe('');
    });

    test('queries chrome.storage.local with the correct key', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      await getStoredApiKey();

      expect(storageMock.local.get).toHaveBeenCalledWith(
        ['captureai-api-key'],
        expect.any(Function)
      );
    });
  });

  // ---------------------------------------------------------------------------
  // isValidUrl
  // ---------------------------------------------------------------------------

  describe('isValidUrl()', () => {
    test('accepts http:// URLs', () => {
      expect(isValidUrl('http://example.com/page')).toBe(true);
    });

    test('accepts https:// URLs', () => {
      expect(isValidUrl('https://example.com/page?q=1')).toBe(true);
    });

    test('rejects chrome:// URLs', () => {
      expect(isValidUrl('chrome://extensions')).toBe(false);
    });

    test('rejects chrome-extension:// URLs', () => {
      expect(isValidUrl('chrome-extension://abcdefgh/popup.html')).toBe(false);
    });

    test('rejects Chrome Web Store URLs', () => {
      expect(isValidUrl('https://chrome.google.com/webstore/detail/ext/id')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // processImage
  // ---------------------------------------------------------------------------

  describe('processImage()', () => {
    const mockSender = { tab: { id: 42 } };
    const mockRequest = {
      coordinates: { startX: 10, startY: 20, width: 300, height: 200 }
    };

    test('resolves with the content script response', async () => {
      tabsMock.sendMessage.mockImplementationOnce((tabId, message, callback) => {
        callback({ success: true, compressedImageData: 'data:image/jpeg;base64,out' });
      });

      const result = await processImage('data:image/png;base64,uri', mockRequest, mockSender);

      expect(result).toEqual({ success: true, compressedImageData: 'data:image/jpeg;base64,out' });
      expect(tabsMock.sendMessage).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          action: 'processCapturedImage',
          startX: 10,
          startY: 20,
          width: 300,
          height: 200
        }),
        expect.any(Function)
      );
    });

    test('rejects when chrome.runtime.lastError is set', async () => {
      tabsMock.sendMessage.mockImplementationOnce((tabId, message, callback) => {
        setRuntimeError('Tab was discarded');
        callback(null);
      });

      await expect(processImage('data:image/png;base64,uri', mockRequest, mockSender))
        .rejects.toThrow('Error processing image');

      clearRuntimeError();
    });
  });

  // ---------------------------------------------------------------------------
  // PROMPT_TYPES constants
  // ---------------------------------------------------------------------------

  describe('PROMPT_TYPES constants', () => {
    test('has ANSWER, AUTO_SOLVE and ASK keys', () => {
      expect(PROMPT_TYPES.ANSWER).toBeDefined();
      expect(PROMPT_TYPES.AUTO_SOLVE).toBeDefined();
      expect(PROMPT_TYPES.ASK).toBeDefined();
    });

    test('values are distinct strings', () => {
      const values = Object.values(PROMPT_TYPES);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });
});
