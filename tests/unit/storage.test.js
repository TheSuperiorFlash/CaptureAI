/**
 * Unit Tests for Storage Functions
 *
 * Tests Chrome storage API wrapper functions
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks, storageMock } = require('../setup/chrome-mock');
const { getStoredApiKey, STORAGE_KEY_API_KEY } = require('../../background.js');

describe('getStoredApiKey', () => {
  beforeEach(() => {
    resetChromeMocks();
  });

  test('should return API key when it exists', async () => {
    const mockApiKey = 'sk-test123456789abcdef';

    storageMock.local.get.mockImplementation((keys, callback) => {
      callback({ [STORAGE_KEY_API_KEY]: mockApiKey });
    });

    const result = await getStoredApiKey();

    expect(result).toBe(mockApiKey);
    expect(storageMock.local.get).toHaveBeenCalledWith(
      [STORAGE_KEY_API_KEY],
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
      callback({ [STORAGE_KEY_API_KEY]: null });
    });

    const result = await getStoredApiKey();

    expect(result).toBe('');
  });

  test('should return empty string when API key is undefined', async () => {
    storageMock.local.get.mockImplementation((keys, callback) => {
      callback({ [STORAGE_KEY_API_KEY]: undefined });
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
      callback({ [STORAGE_KEY_API_KEY]: apiKeyWithSpaces });
    });

    const result = await getStoredApiKey();

    expect(result).toBe(apiKeyWithSpaces);
  });
});
