/**
 * Unit Tests for Edge Cases
 *
 * Comprehensive edge case testing for critical functions
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks, storageMock, tabsMock, setRuntimeError } = require('../setup/chrome-mock');
const {
  isValidUrl,
  captureScreenshot,
  getStoredApiKey
} = require('../../background.js');

describe('Edge Cases', () => {
  beforeEach(() => {
    resetChromeMocks();
  });

  describe('isValidUrl - complex URLs', () => {
    test('should handle URLs with maximum length', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000);
      expect(isValidUrl(longUrl)).toBe(true);
    });

    test('should handle URLs with many query parameters', () => {
      const url = 'https://example.com?' + Array(100).fill(0).map((_, i) => `param${i}=value${i}`).join('&');
      expect(isValidUrl(url)).toBe(true);
    });

    test('should handle URLs with special characters in path', () => {
      expect(isValidUrl('https://example.com/path%20with%20spaces')).toBe(true);
      expect(isValidUrl('https://example.com/path?q=test+query')).toBe(true);
      expect(isValidUrl('https://example.com/#section')).toBe(true);
    });

    test('should handle URLs with auth credentials', () => {
      expect(isValidUrl('https://user:pass@example.com')).toBe(true);
    });

    test('should handle URLs with non-standard ports', () => {
      expect(isValidUrl('https://example.com:8443')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://example.com:65535')).toBe(true);
    });

    test('should handle IPv4 addresses', () => {
      expect(isValidUrl('http://192.168.1.1')).toBe(true);
      expect(isValidUrl('https://10.0.0.1:8080')).toBe(true);
    });

    test('should handle IPv6 addresses', () => {
      expect(isValidUrl('http://[::1]')).toBe(true);
      expect(isValidUrl('https://[2001:db8::1]')).toBe(true);
    });

    test('should handle internationalized domain names', () => {
      expect(isValidUrl('https://münchen.de')).toBe(true);
      expect(isValidUrl('https://中国.cn')).toBe(true);
    });

    test('should reject empty string', () => {
      expect(isValidUrl('')).toBe(false);
    });

    test('should reject single character', () => {
      expect(isValidUrl('h')).toBe(false);
    });

    test('should reject whitespace only', () => {
      expect(isValidUrl('   ')).toBe(false);
    });
  });

  describe('captureScreenshot - error scenarios', () => {
    test('should handle very large screenshot data', async () => {
      const largeImageData = 'data:image/png;base64,' + 'A'.repeat(1000000);
      tabsMock.captureVisibleTab.mockImplementation((windowId, options, callback) => {
        callback(largeImageData);
      });

      const result = await captureScreenshot();
      expect(result.length).toBeGreaterThan(1000000);
    });

    test('should handle null image data', async () => {
      tabsMock.captureVisibleTab.mockImplementation((windowId, options, callback) => {
        callback(null);
      });

      const result = await captureScreenshot();
      expect(result).toBeNull();
    });

    test('should handle undefined image data', async () => {
      tabsMock.captureVisibleTab.mockImplementation((windowId, options, callback) => {
        callback(undefined);
      });

      const result = await captureScreenshot();
      expect(result).toBeUndefined();
    });
  });

  describe('getStoredApiKey - edge cases', () => {
    test('should handle very long API keys', async () => {
      const longKey = 'sk-' + 'A'.repeat(1000);
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'captureai-api-key': longKey });
      });

      const result = await getStoredApiKey();
      expect(result).toBe(longKey);
      expect(result.length).toBeGreaterThan(1000);
    });

    test('should handle API keys with special characters', async () => {
      const specialKey = 'sk-test!@#$%^&*()_+-=[]{}|;:,.<>?';
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'captureai-api-key': specialKey });
      });

      const result = await getStoredApiKey();
      expect(result).toBe(specialKey);
    });

    test('should handle API keys with unicode', async () => {
      const unicodeKey = 'sk-测试-🔑-key';
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'captureai-api-key': unicodeKey });
      });

      const result = await getStoredApiKey();
      expect(result).toBe(unicodeKey);
    });

    test('should handle boolean false as stored value (falsy, returns empty string)', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'captureai-api-key': false });
      });

      const result = await getStoredApiKey();
      // Function uses || operator, so falsy values return empty string
      expect(result).toBe('');
    });

    test('should handle number zero as stored value (falsy, returns empty string)', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'captureai-api-key': 0 });
      });

      const result = await getStoredApiKey();
      // Function uses || operator, so falsy values return empty string
      expect(result).toBe('');
    });

    test('should handle empty object response', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const result = await getStoredApiKey();
      expect(result).toBe('');
    });
  });

  describe('Type coercion and boundary values', () => {
    test('isValidUrl should handle URL with only protocol', () => {
      // Note: .startsWith() will return true for these
      expect(isValidUrl('http://')).toBe(true);
      expect(isValidUrl('https://')).toBe(true);
    });

    test('isValidUrl should handle protocol without slashes', () => {
      expect(isValidUrl('http:example.com')).toBe(false);
      expect(isValidUrl('https:example.com')).toBe(false);
    });
  });
});
