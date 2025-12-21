/**
 * Unit Tests for Domain Utils Module
 *
 * Tests domain detection and CSP checking utilities
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { DomainUtils } from '../../modules/domains.js';

describe('DomainUtils', () => {
  let originalLocation;

  beforeEach(() => {
    // Save original location
    originalLocation = global.window?.location;

    // Mock window.location
    delete global.window;
    global.window = {
      location: {
        hostname: '',
        href: ''
      }
    };
  });

  afterEach(() => {
    // Restore original location
    if (originalLocation) {
      global.window.location = originalLocation;
    }
  });

  describe('isOnQuizlet', () => {
    test('should return true for quizlet.com', () => {
      global.window.location.hostname = 'quizlet.com';

      expect(DomainUtils.isOnQuizlet()).toBe(true);
    });

    test('should return true for subdomains of quizlet.com', () => {
      global.window.location.hostname = 'www.quizlet.com';

      expect(DomainUtils.isOnQuizlet()).toBe(true);
    });

    test('should return true for quizlet.com with path', () => {
      global.window.location.hostname = 'quizlet.com';

      expect(DomainUtils.isOnQuizlet()).toBe(true);
    });

    test('should return false for non-quizlet domains', () => {
      global.window.location.hostname = 'google.com';

      expect(DomainUtils.isOnQuizlet()).toBe(false);
    });

    test('should return false for empty hostname', () => {
      global.window.location.hostname = '';

      expect(DomainUtils.isOnQuizlet()).toBe(false);
    });

    test('should match domains containing quizlet', () => {
      // Note: Uses .includes() so will match partial strings
      global.window.location.hostname = 'notquizlet.com';

      expect(DomainUtils.isOnQuizlet()).toBe(true);
    });
  });

  describe('isOnVocabulary', () => {
    test('should return true for vocabulary.com', () => {
      global.window.location.hostname = 'vocabulary.com';

      expect(DomainUtils.isOnVocabulary()).toBe(true);
    });

    test('should return true for subdomains of vocabulary.com', () => {
      global.window.location.hostname = 'www.vocabulary.com';

      expect(DomainUtils.isOnVocabulary()).toBe(true);
    });

    test('should return true for vocabulary.com with path', () => {
      global.window.location.hostname = 'vocabulary.com';

      expect(DomainUtils.isOnVocabulary()).toBe(true);
    });

    test('should return false for non-vocabulary domains', () => {
      global.window.location.hostname = 'google.com';

      expect(DomainUtils.isOnVocabulary()).toBe(false);
    });

    test('should return false for empty hostname', () => {
      global.window.location.hostname = '';

      expect(DomainUtils.isOnVocabulary()).toBe(false);
    });

    test('should match domains containing vocabulary', () => {
      // Note: Uses .includes() so will match partial strings
      global.window.location.hostname = 'notvocabulary.com';

      expect(DomainUtils.isOnVocabulary()).toBe(true);
    });
  });

  describe('isOnSupportedSite', () => {
    test('should return true for quizlet.com', () => {
      global.window.location.hostname = 'quizlet.com';

      expect(DomainUtils.isOnSupportedSite()).toBe(true);
    });

    test('should return true for vocabulary.com', () => {
      global.window.location.hostname = 'vocabulary.com';

      expect(DomainUtils.isOnSupportedSite()).toBe(true);
    });

    test('should return false for unsupported site', () => {
      global.window.location.hostname = 'google.com';

      expect(DomainUtils.isOnSupportedSite()).toBe(false);
    });

    test('should return false for empty hostname', () => {
      global.window.location.hostname = '';

      expect(DomainUtils.isOnSupportedSite()).toBe(false);
    });

    test('should work with subdomains', () => {
      global.window.location.hostname = 'www.quizlet.com';
      expect(DomainUtils.isOnSupportedSite()).toBe(true);

      global.window.location.hostname = 'app.vocabulary.com';
      expect(DomainUtils.isOnSupportedSite()).toBe(true);
    });
  });

  describe('isOnStrictCSPSite', () => {
    // Google services
    test('should detect Google domains', () => {
      const googleDomains = [
        'accounts.google.com',
        'docs.google.com',
        'drive.google.com',
        'mail.google.com',
        'sheets.google.com',
        'slides.google.com',
        'sites.google.com',
        'classroom.google.com'
      ];

      googleDomains.forEach(domain => {
        global.window.location.hostname = domain;
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });
    });

    // Microsoft services
    test('should detect Microsoft domains', () => {
      const msftDomains = [
        'outlook.com',
        'outlook.live.com',
        'office.com',
        'onedrive.live.com',
        'teams.microsoft.com'
      ];

      msftDomains.forEach(domain => {
        global.window.location.hostname = domain;
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });
    });

    // Banking and financial
    test('should detect banking domains', () => {
      const bankDomains = [
        'bankofamerica.com',
        'chase.com',
        'wellsfargo.com',
        'paypal.com',
        'amazon.com'
      ];

      bankDomains.forEach(domain => {
        global.window.location.hostname = domain;
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });
    });

    // Educational platforms
    test('should detect educational platforms', () => {
      const eduDomains = [
        'canvas.instructure.com',
        'blackboard.com',
        'moodle.org',
        'schoology.com'
      ];

      eduDomains.forEach(domain => {
        global.window.location.hostname = domain;
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });
    });

    // Social media
    test('should detect social media domains', () => {
      const socialDomains = [
        'facebook.com',
        'twitter.com',
        'linkedin.com',
        'instagram.com'
      ];

      socialDomains.forEach(domain => {
        global.window.location.hostname = domain;
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });
    });

    // Developer platforms
    test('should detect developer platforms', () => {
      const devDomains = [
        'github.com',
        'gitlab.com',
        'stackoverflow.com'
      ];

      devDomains.forEach(domain => {
        global.window.location.hostname = domain;
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });
    });

    test('should handle case insensitivity', () => {
      global.window.location.hostname = 'GITHUB.COM';

      expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
    });

    test('should handle mixed case', () => {
      global.window.location.hostname = 'GitHub.Com';

      expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
    });

    test('should detect subdomains of strict CSP sites', () => {
      global.window.location.hostname = 'subdomain.github.com';

      expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
    });

    test('should return false for non-CSP sites', () => {
      const normalDomains = [
        'example.com',
        'quizlet.com',
        'vocabulary.com',
        'localhost',
        'test.local'
      ];

      normalDomains.forEach(domain => {
        global.window.location.hostname = domain;
        expect(DomainUtils.isOnStrictCSPSite()).toBe(false);
      });
    });

    test('should return false for empty hostname', () => {
      global.window.location.hostname = '';

      expect(DomainUtils.isOnStrictCSPSite()).toBe(false);
    });

    test('should match partial domain names due to includes()', () => {
      // Note: Uses .includes() so will match partial strings
      global.window.location.hostname = 'notgithub.com';

      expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
    });

    test('should match domains that include the CSP domain', () => {
      global.window.location.hostname = 'www.github.com';

      expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
    });
  });

  describe('isValidUrl', () => {
    // Valid HTTP URLs
    test('should accept http URLs', () => {
      expect(DomainUtils.isValidUrl('http://example.com')).toBe(true);
    });

    test('should accept https URLs', () => {
      expect(DomainUtils.isValidUrl('https://example.com')).toBe(true);
    });

    test('should accept URLs with paths', () => {
      expect(DomainUtils.isValidUrl('https://example.com/path/to/page')).toBe(true);
    });

    test('should accept URLs with query parameters', () => {
      expect(DomainUtils.isValidUrl('https://example.com?foo=bar&baz=qux')).toBe(true);
    });

    test('should accept URLs with fragments', () => {
      expect(DomainUtils.isValidUrl('https://example.com#section')).toBe(true);
    });

    test('should accept URLs with port numbers', () => {
      expect(DomainUtils.isValidUrl('http://localhost:3000')).toBe(true);
      expect(DomainUtils.isValidUrl('https://example.com:8080')).toBe(true);
    });

    test('should accept URLs with subdomains', () => {
      expect(DomainUtils.isValidUrl('https://subdomain.example.com')).toBe(true);
      expect(DomainUtils.isValidUrl('http://www.example.com')).toBe(true);
    });

    test('should accept localhost URLs', () => {
      expect(DomainUtils.isValidUrl('http://localhost')).toBe(true);
      expect(DomainUtils.isValidUrl('https://localhost')).toBe(true);
    });

    test('should accept IP addresses', () => {
      expect(DomainUtils.isValidUrl('http://192.168.1.1')).toBe(true);
      expect(DomainUtils.isValidUrl('https://10.0.0.1')).toBe(true);
    });

    // Invalid URLs - Chrome internal
    test('should reject chrome:// URLs', () => {
      expect(DomainUtils.isValidUrl('chrome://extensions')).toBe(false);
      expect(DomainUtils.isValidUrl('chrome://settings')).toBe(false);
    });

    test('should reject chrome-extension:// URLs', () => {
      expect(DomainUtils.isValidUrl('chrome-extension://abcdefg/popup.html')).toBe(false);
    });

    test('should reject chrome.google.com URLs', () => {
      expect(DomainUtils.isValidUrl('chrome.google.com/webstore')).toBe(false);
      expect(DomainUtils.isValidUrl('chrome.google.com')).toBe(false);
    });

    // Invalid URLs - Other protocols
    test('should reject file:// URLs', () => {
      expect(DomainUtils.isValidUrl('file:///C:/Users/file.txt')).toBe(false);
    });

    test('should reject ftp:// URLs', () => {
      expect(DomainUtils.isValidUrl('ftp://ftp.example.com')).toBe(false);
    });

    test('should reject data: URLs', () => {
      expect(DomainUtils.isValidUrl('data:text/html,<h1>Test</h1>')).toBe(false);
    });

    test('should reject javascript: URLs', () => {
      expect(DomainUtils.isValidUrl('javascript:alert(1)')).toBe(false);
    });

    test('should reject about: URLs', () => {
      expect(DomainUtils.isValidUrl('about:blank')).toBe(false);
    });

    // Edge cases
    test('should reject empty string', () => {
      expect(DomainUtils.isValidUrl('')).toBe(false);
    });

    test('should reject URLs without protocol', () => {
      expect(DomainUtils.isValidUrl('example.com')).toBe(false);
      expect(DomainUtils.isValidUrl('www.example.com')).toBe(false);
    });

    test('should handle case sensitivity', () => {
      expect(DomainUtils.isValidUrl('HTTP://example.com')).toBe(false);
      expect(DomainUtils.isValidUrl('HTTPS://example.com')).toBe(false);
      expect(DomainUtils.isValidUrl('http://EXAMPLE.COM')).toBe(true);
    });

    test('should reject malformed URLs', () => {
      expect(DomainUtils.isValidUrl('ht tp://example.com')).toBe(false);
      expect(DomainUtils.isValidUrl('http:/example.com')).toBe(false);
    });

    test('should handle URLs with authentication', () => {
      expect(DomainUtils.isValidUrl('https://user:pass@example.com')).toBe(true);
    });

    test('should handle URLs with encoded characters', () => {
      expect(DomainUtils.isValidUrl('https://example.com/path%20with%20spaces')).toBe(true);
    });

    test('should handle very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000);
      expect(DomainUtils.isValidUrl(longUrl)).toBe(true);
    });

    test('should reject URLs starting with chrome.google.com', () => {
      expect(DomainUtils.isValidUrl('chrome.google.com/extensions')).toBe(false);
    });

    test('should accept http URL that contains "chrome" in domain', () => {
      expect(DomainUtils.isValidUrl('https://chrome-fans.example.com')).toBe(true);
    });

    test('should accept URLs starting with http even if malformed', () => {
      // Simple startsWith check, doesn't validate full URL structure
      expect(DomainUtils.isValidUrl('http://https://example.com')).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should correctly identify supported sites without CSP', () => {
      global.window.location.hostname = 'quizlet.com';

      expect(DomainUtils.isOnSupportedSite()).toBe(true);
      expect(DomainUtils.isOnStrictCSPSite()).toBe(false);
    });

    test('should correctly identify unsupported sites with CSP', () => {
      global.window.location.hostname = 'github.com';

      expect(DomainUtils.isOnSupportedSite()).toBe(false);
      expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
    });

    test('should correctly identify unsupported sites without CSP', () => {
      global.window.location.hostname = 'example.com';

      expect(DomainUtils.isOnSupportedSite()).toBe(false);
      expect(DomainUtils.isOnStrictCSPSite()).toBe(false);
    });

    test('should handle subdomain variations', () => {
      global.window.location.hostname = 'subdomain.quizlet.com';

      expect(DomainUtils.isOnQuizlet()).toBe(true);
      expect(DomainUtils.isOnVocabulary()).toBe(false);
      expect(DomainUtils.isOnSupportedSite()).toBe(true);
    });
  });
});
