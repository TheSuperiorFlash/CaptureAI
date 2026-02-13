/**
 * Privacy Guard Module
 * Coordinates privacy protection and interfaces with MAIN world injection
 */

export const PrivacyGuard = {
  enabled: false,
  injected: false,

  /**
   * Initialize privacy protection
   * Checks if MAIN world script successfully overrode APIs
   * Requires Pro tier subscription and enabled in settings
   */
  async init() {
    if (this.enabled) {
      return;
    }

    // Check if user has Pro tier access
    const hasProAccess = await this.checkProAccess();
    if (!hasProAccess) {
      if (window.CaptureAI?.CONFIG?.DEBUG) {
        console.log('⚠️ Privacy Guard: Pro tier required');
      }
      return;
    }

    // Check if Privacy Guard is enabled in settings
    const isEnabledInSettings = await this.checkSettings();
    if (!isEnabledInSettings) {
      if (window.CaptureAI?.CONFIG?.DEBUG) {
        console.log('⚠️ Privacy Guard: Disabled in settings');
      }
      return;
    }

    // Check if inject.js successfully overrode the APIs
    // If APIs are overridden, Privacy Guard is active
    const isProtected = this.checkProtection();

    if (isProtected) {
      this.enabled = true;
      this.injected = true;

      if (window.CaptureAI?.CONFIG?.DEBUG) {
        console.log('✅ Privacy Guard: Active and protecting');
      }
    } else {
      // Try to inject if not already protected
      try {
        const result = await chrome.runtime.sendMessage({
          action: 'enablePrivacyGuard'
        });

        if (result?.success) {
          this.enabled = true;
          this.injected = true;
        }
      } catch (error) {
        if (window.CaptureAI?.CONFIG?.DEBUG) {
          console.warn('Privacy Guard: Could not inject MAIN world script', error);
        }
      }
    }
  },

  /**
   * Check if user has Pro tier access
   * Uses cached tier from storage to avoid API calls on every page load
   */
  async checkProAccess() {
    try {
      // Get cached tier from storage
      const result = await chrome.storage.local.get('captureai-user-tier');
      const tier = result['captureai-user-tier'];

      return tier === 'pro';
    } catch (error) {
      if (window.CaptureAI?.CONFIG?.DEBUG) {
        console.error('Privacy Guard: Error checking tier', error);
      }
      return false;
    }
  },

  /**
   * Check if Privacy Guard is enabled in settings
   */
  async checkSettings() {
    try {
      const result = await chrome.storage.local.get('captureai-settings');
      const settings = result['captureai-settings'] || {};

      return settings.privacyGuard?.enabled === true;
    } catch (error) {
      if (window.CaptureAI?.CONFIG?.DEBUG) {
        console.error('Privacy Guard: Error checking settings', error);
      }
      return false;
    }
  },

  /**
   * Check if privacy protection is active by testing API overrides
   */
  checkProtection() {
    try {
      // Check if the property descriptor on Document.prototype has been replaced
      // by inject.js. The native descriptor is on Document.prototype but has
      // a different getter than what inject.js installs.
      const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');

      // If inject.js ran, the descriptor will be non-configurable (we set configurable: false)
      // The native browser descriptor IS configurable, so this is a reliable check
      if (descriptor && descriptor.configurable === false) {
        return true;
      }

      // Fallback: check if hidden descriptor is also locked
      const hiddenDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
      if (hiddenDescriptor && hiddenDescriptor.configurable === false) {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  },

  /**
   * Disable privacy protection
   */
  async disable() {
    if (!this.enabled) {
      return;
    }

    try {
      await chrome.runtime.sendMessage({
        action: 'disablePrivacyGuard'
      });

      this.enabled = false;
    } catch (error) {
      console.error('Privacy Guard disable error:', error);
    }
  },

  /**
   * Check if privacy protection is active
   */
  isActive() {
    return this.enabled;
  },

  /**
   * Get privacy protection status
   */
  async getStatus() {
    try {
      const result = await chrome.runtime.sendMessage({
        action: 'getPrivacyGuardStatus'
      });
      return result;
    } catch (error) {
      console.error('Privacy Guard status error:', error);
      return { enabled: false };
    }
  }
};
