/**
 * Unit Tests for Storage Functions
 *
 * Tests Chrome storage API wrapper functions
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks, storageMock } = require('../setup/chrome-mock');

/**
 * Get stored API key from Chrome storage
 * (Copy of function from background.js for testing)
 */
async function getStoredApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['captureai-api-key'], (result) => {
      resolve(result['captureai-api-key'] || '');
    });
  });
}

describe('getStoredApiKey', () => {
  beforeEach(() => {
    resetChromeMocks();
  });

  test('should return API key when it exists', async () => {
    const mockApiKey = 'sk-test123456789abcdef';

    storageMock.local.get.mockImplementation((keys, callback) => {
      callback({ 'captureai-api-key': mockApiKey });
    });

    const result = await getStoredApiKey();

    expect(result).toBe(mockApiKey);
    expect(storageMock.local.get).toHaveBeenCalledWith(
      ['captureai-api-key'],
      expect.any(Function)
    );
    expect(storageMock.local.get).toHaveBeenCalledTimes(1);
  });

  test('should return empty string when API key does not exist', async () => {
    storageMock.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    const result = await getStoredApiKey();

    expect(result).toBe('');
  });

  test('should return empty string when API key is null', async () => {
    storageMock.local.get.mockImplementation((keys, callback) => {
      callback({ 'captureai-api-key': null });
    });

    const result = await getStoredApiKey();

    expect(result).toBe('');
  });

  test('should return empty string when API key is undefined', async () => {
    storageMock.local.get.mockImplementation((keys, callback) => {
      callback({ 'captureai-api-key': undefined });
    });

    const result = await getStoredApiKey();

    expect(result).toBe('');
  });

  test('should handle empty storage result', async () => {
    storageMock.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    const result = await getStoredApiKey();

    expect(result).toBe('');
  });

  test('should preserve whitespace in API key', async () => {
    const apiKeyWithSpaces = '  sk-test123  ';

    storageMock.local.get.mockImplementation((keys, callback) => {
      callback({ 'captureai-api-key': apiKeyWithSpaces });
    });

    const result = await getStoredApiKey();

    expect(result).toBe(apiKeyWithSpaces);
  });
});
