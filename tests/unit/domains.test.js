/**
 * Unit Tests for Domain Detection Functions
 *
 * Tests domain detection and CSP checking utilities
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');

// Mock window.location for testing
delete global.window;
global.window = { location: { hostname: '' } };

// Domain utilities to test (copied from modules/domains.js)
const DomainUtils = {
  isOnSupportedSite() {
    return this.isOnVocabulary() || this.isOnQuizlet();
  },

  isOnQuizlet() {
    return window.location.hostname.includes('quizlet.com');
  },

  isOnVocabulary() {
    return window.location.hostname.includes('vocabulary.com');
  },

  isOnStrictCSPSite() {
    const strictCSPDomains = [
      'accounts.google.com',
      'docs.google.com',
      'drive.google.com',
      'mail.google.com',
      'sheets.google.com',
      'slides.google.com',
      'sites.google.com',
      'classroom.google.com',
      'outlook.com',
      'outlook.live.com',
      'office.com',
      'onedrive.live.com',
      'teams.microsoft.com',
      'login.microsoftonline.com',
      'github.com',
      'gitlab.com',
      'bitbucket.org'
    ];

    const hostname = window.location.hostname;
    return strictCSPDomains.some(domain => hostname.includes(domain));
  }
};

describe('DomainUtils', () => {
  beforeEach(() => {
    // Reset hostname before each test
    window.location.hostname = '';
  });

  describe('isOnQuizlet', () => {
    test('should return true for quizlet.com', () => {
      window.location.hostname = 'quizlet.com';
      expect(DomainUtils.isOnQuizlet()).toBe(true);
    });

    test('should return true for www.quizlet.com', () => {
      window.location.hostname = 'www.quizlet.com';
      expect(DomainUtils.isOnQuizlet()).toBe(true);
    });

    test('should return true for subdomains', () => {
      window.location.hostname = 'learn.quizlet.com';
      expect(DomainUtils.isOnQuizlet()).toBe(true);
    });

    test('should return false for other domains', () => {
      window.location.hostname = 'example.com';
      expect(DomainUtils.isOnQuizlet()).toBe(false);
    });

    test('should return false for empty hostname', () => {
      window.location.hostname = '';
      expect(DomainUtils.isOnQuizlet()).toBe(false);
    });

    test('should match domains containing quizlet.com substring', () => {
      // Note: The function uses .includes() which matches substrings
      // So 'notquizlet.com' will match because it contains 'quizlet.com'
      window.location.hostname = 'notquizlet.com';
      expect(DomainUtils.isOnQuizlet()).toBe(true);
    });
  });

  describe('isOnVocabulary', () => {
    test('should return true for vocabulary.com', () => {
      window.location.hostname = 'vocabulary.com';
      expect(DomainUtils.isOnVocabulary()).toBe(true);
    });

    test('should return true for www.vocabulary.com', () => {
      window.location.hostname = 'www.vocabulary.com';
      expect(DomainUtils.isOnVocabulary()).toBe(true);
    });

    test('should return true for subdomains', () => {
      window.location.hostname = 'api.vocabulary.com';
      expect(DomainUtils.isOnVocabulary()).toBe(true);
    });

    test('should return false for other domains', () => {
      window.location.hostname = 'example.com';
      expect(DomainUtils.isOnVocabulary()).toBe(false);
    });

    test('should return false for empty hostname', () => {
      window.location.hostname = '';
      expect(DomainUtils.isOnVocabulary()).toBe(false);
    });

    test('should match domains containing vocabulary.com substring', () => {
      // Note: The function uses .includes() which matches substrings
      // So 'notvocabulary.com' will match because it contains 'vocabulary.com'
      window.location.hostname = 'notvocabulary.com';
      expect(DomainUtils.isOnVocabulary()).toBe(true);
    });
  });

  describe('isOnSupportedSite', () => {
    test('should return true for Quizlet', () => {
      window.location.hostname = 'quizlet.com';
      expect(DomainUtils.isOnSupportedSite()).toBe(true);
    });

    test('should return true for Vocabulary', () => {
      window.location.hostname = 'vocabulary.com';
      expect(DomainUtils.isOnSupportedSite()).toBe(true);
    });

    test('should return false for unsupported sites', () => {
      window.location.hostname = 'example.com';
      expect(DomainUtils.isOnSupportedSite()).toBe(false);
    });

    test('should return false for empty hostname', () => {
      window.location.hostname = '';
      expect(DomainUtils.isOnSupportedSite()).toBe(false);
    });
  });

  describe('isOnStrictCSPSite', () => {
    describe('Google domains', () => {
      test('should return true for accounts.google.com', () => {
        window.location.hostname = 'accounts.google.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });

      test('should return true for docs.google.com', () => {
        window.location.hostname = 'docs.google.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });

      test('should return true for drive.google.com', () => {
        window.location.hostname = 'drive.google.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });

      test('should return true for mail.google.com', () => {
        window.location.hostname = 'mail.google.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });

      test('should return true for sheets.google.com', () => {
        window.location.hostname = 'sheets.google.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });

      test('should return true for slides.google.com', () => {
        window.location.hostname = 'slides.google.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });

      test('should return true for classroom.google.com', () => {
        window.location.hostname = 'classroom.google.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });
    });

    describe('Microsoft domains', () => {
      test('should return true for outlook.com', () => {
        window.location.hostname = 'outlook.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });

      test('should return true for outlook.live.com', () => {
        window.location.hostname = 'outlook.live.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });

      test('should return true for office.com', () => {
        window.location.hostname = 'office.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });

      test('should return true for onedrive.live.com', () => {
        window.location.hostname = 'onedrive.live.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });

      test('should return true for teams.microsoft.com', () => {
        window.location.hostname = 'teams.microsoft.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });

      test('should return true for login.microsoftonline.com', () => {
        window.location.hostname = 'login.microsoftonline.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });
    });

    describe('Other CSP-restricted sites', () => {
      test('should return true for github.com', () => {
        window.location.hostname = 'github.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });

      test('should return true for gitlab.com', () => {
        window.location.hostname = 'gitlab.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });

      test('should return true for bitbucket.org', () => {
        window.location.hostname = 'bitbucket.org';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });
    });

    describe('Non-CSP sites', () => {
      test('should return false for regular websites', () => {
        window.location.hostname = 'example.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(false);
      });

      test('should return false for quizlet.com', () => {
        window.location.hostname = 'quizlet.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(false);
      });

      test('should return false for vocabulary.com', () => {
        window.location.hostname = 'vocabulary.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(false);
      });

      test('should return false for empty hostname', () => {
        window.location.hostname = '';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(false);
      });
    });

    describe('subdomain handling', () => {
      test('should return true for subdomains of CSP sites', () => {
        window.location.hostname = 'subdomain.docs.google.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });

      test('should return true for www prefix', () => {
        window.location.hostname = 'www.github.com';
        expect(DomainUtils.isOnStrictCSPSite()).toBe(true);
      });
    });
  });
});
