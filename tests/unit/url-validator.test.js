/**
 * Unit Tests for isValidUrl() function
 *
 * Tests URL validation for content script injection
 */

const { describe, test, expect } = require('@jest/globals');

/**
 * Check if URL is valid for content script injection
 * (Copy of function from background.js for testing)
 */
function isValidUrl(url) {
  return (url.startsWith('http://') || url.startsWith('https://')) &&
         !url.startsWith('chrome://') &&
         !url.startsWith('chrome-extension://') &&
         !url.startsWith('chrome.google.com');
}

describe('isValidUrl', () => {
  describe('valid URLs', () => {
    test('should accept http URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    test('should accept https URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    test('should accept URLs with paths', () => {
      expect(isValidUrl('https://example.com/path/to/page')).toBe(true);
    });

    test('should accept URLs with query parameters', () => {
      expect(isValidUrl('https://example.com?query=test&foo=bar')).toBe(true);
    });

    test('should accept URLs with fragments', () => {
      expect(isValidUrl('https://example.com/page#section')).toBe(true);
    });

    test('should accept URLs with port numbers', () => {
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://example.com:8080')).toBe(true);
    });

    test('should accept URLs with subdomains', () => {
      expect(isValidUrl('https://www.example.com')).toBe(true);
      expect(isValidUrl('https://api.example.com')).toBe(true);
      expect(isValidUrl('https://sub.domain.example.com')).toBe(true);
    });

    test('should accept localhost URLs', () => {
      expect(isValidUrl('http://localhost')).toBe(true);
      expect(isValidUrl('http://127.0.0.1')).toBe(true);
    });
  });

  describe('invalid URLs - Chrome internal', () => {
    test('should reject chrome:// URLs', () => {
      expect(isValidUrl('chrome://extensions')).toBe(false);
      expect(isValidUrl('chrome://settings')).toBe(false);
      expect(isValidUrl('chrome://flags')).toBe(false);
    });

    test('should reject chrome-extension:// URLs', () => {
      expect(isValidUrl('chrome-extension://abcdefghijklmnop')).toBe(false);
      expect(isValidUrl('chrome-extension://abc123/popup.html')).toBe(false);
    });

    test('should reject chrome.google.com URLs', () => {
      expect(isValidUrl('chrome.google.com/webstore')).toBe(false);
      expect(isValidUrl('chrome.google.com')).toBe(false);
    });
  });

  describe('invalid URLs - Other protocols', () => {
    test('should reject file:// URLs', () => {
      expect(isValidUrl('file:///C:/path/to/file.html')).toBe(false);
      expect(isValidUrl('file:///home/user/file.html')).toBe(false);
    });

    test('should reject ftp:// URLs', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false);
    });

    test('should reject data: URLs', () => {
      expect(isValidUrl('data:text/html,<h1>Hello</h1>')).toBe(false);
    });

    test('should reject javascript: URLs', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });

    test('should reject about: URLs', () => {
      expect(isValidUrl('about:blank')).toBe(false);
      expect(isValidUrl('about:config')).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should reject empty string', () => {
      expect(isValidUrl('')).toBe(false);
    });

    test('should reject URLs without protocol', () => {
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('www.example.com')).toBe(false);
    });

    test('should handle case sensitivity', () => {
      // Chrome URLs should be case-insensitive rejected
      expect(isValidUrl('CHROME://extensions')).toBe(false);
      expect(isValidUrl('Chrome://settings')).toBe(false);

      // Note: The actual function is case-sensitive
      // In real usage, browsers normalize URLs to lowercase
      // So uppercase HTTP/HTTPS won't match .startsWith('http://')
      expect(isValidUrl('HTTP://example.com')).toBe(false);
      expect(isValidUrl('HTTPS://example.com')).toBe(false);

      // Lowercase should work
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    test('should reject URLs starting with chrome.google.com in any context', () => {
      expect(isValidUrl('chrome.google.com/webstore/detail/abc')).toBe(false);
    });

    test('should accept http URL that contains "chrome" in domain', () => {
      // Should be valid - chrome is just part of domain name
      expect(isValidUrl('https://chrome-tools.example.com')).toBe(true);
      expect(isValidUrl('https://mychrome.com')).toBe(true);
    });

    test('should handle malformed URLs gracefully', () => {
      // These won't match our criteria
      expect(isValidUrl('ht tp://example.com')).toBe(false);
      expect(isValidUrl('https:/example.com')).toBe(false);
      expect(isValidUrl('https//example.com')).toBe(false);
    });
  });
});
