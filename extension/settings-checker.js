/**
 * Settings Checker - MAIN World Injection
 *
 * This script runs FIRST in the MAIN world (document_start)
 * BEFORE inject.js to check if Privacy Guard is enabled.
 *
 * Sets window.__CAPTUREAI_PRIVACY_GUARD_ENABLED__ flag
 * that inject.js uses to conditionally apply protections.
 */

(function() {
  'use strict';

  // Default to enabled (secure-by-default approach)
  // If storage fails or settings unavailable, Privacy Guard stays active
  window.__CAPTUREAI_PRIVACY_GUARD_ENABLED__ = true;

  try {
    chrome.storage.local.get('captureai-settings', function(result) {
      try {
        const settings = result['captureai-settings'] || {};

        // Only disable if explicitly set to false
        const isEnabled = settings.privacyGuard?.enabled !== false;
        window.__CAPTUREAI_PRIVACY_GUARD_ENABLED__ = isEnabled;
      } catch (error) {
        // If anything fails, keep Privacy Guard enabled
        window.__CAPTUREAI_PRIVACY_GUARD_ENABLED__ = true;
      }
    });
  } catch (error) {
    // If chrome.storage access fails, keep Privacy Guard enabled
    window.__CAPTUREAI_PRIVACY_GUARD_ENABLED__ = true;
  }
})();
