/**
 * Domain detection and CSP checking utilities
 */

export const DomainUtils = {
  /**
   * Check if current site supports auto-solve functionality
   * @returns {boolean}
   */
  isOnSupportedSite() {
    return this.isOnVocabulary() || this.isOnQuizlet();
  },

  /**
   * Check if current site is Quizlet
   * @returns {boolean}
   */
  isOnQuizlet() {
    return window.location.hostname.includes('quizlet.com');
  },

  /**
   * Check if current site is Vocabulary.com
   * @returns {boolean}
   */
  isOnVocabulary() {
    return window.location.hostname.includes('vocabulary.com');
  },

  /**
   * Check if current site has strict CSP that blocks web workers
   * @returns {boolean}
   */
  isOnStrictCSPSite() {
    const strictCSPDomains = [
      // Google services
      'accounts.google.com',
      'docs.google.com',
      'drive.google.com',
      'mail.google.com',
      'sheets.google.com',
      'slides.google.com',
      'sites.google.com',
      'classroom.google.com',

      // Microsoft services
      'outlook.com',
      'outlook.live.com',
      'office.com',
      'onedrive.live.com',
      'teams.microsoft.com',

      // Banking and financial
      'bankofamerica.com',
      'chase.com',
      'wellsfargo.com',
      'paypal.com',
      'amazon.com',

      // Educational platforms
      'canvas.instructure.com',
      'blackboard.com',
      'moodle.org',
      'schoology.com',

      // Social media
      'facebook.com',
      'twitter.com',
      'linkedin.com',
      'instagram.com',

      // Other secure sites
      'github.com',
      'gitlab.com',
      'stackoverflow.com'
    ];

    const hostname = window.location.hostname.toLowerCase();
    return strictCSPDomains.some(domain => hostname.includes(domain));
  },

  /**
   * Check if URL is valid for extension functionality
   * @param {string} url - URL to check
   * @returns {boolean}
   */
  isValidUrl(url) {
    return (url.startsWith('http://') || url.startsWith('https://')) &&
           !url.startsWith('chrome://') &&
           !url.startsWith('chrome-extension://') &&
           !url.startsWith('chrome.google.com');
  }
};
