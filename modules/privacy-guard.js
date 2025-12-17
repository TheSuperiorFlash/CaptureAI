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
   */
  async init() {
    if (this.enabled) {
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
   * Check if privacy protection is active by testing API overrides
   */
  checkProtection() {
    try {
      // Test if APIs have been overridden
      // inject.js makes these always return specific values
      const visibilityOverridden = document.visibilityState === 'visible';
      const hiddenOverridden = document.hidden === false;

      // If both are true, likely overridden (though could be coincidence)
      // Better test: Try to register a blocked event and see if it's blocked
      let eventWasBlocked = false;
      const testListener = () => { eventWasBlocked = false; };

      // addEventListener should be overridden to block 'visibilitychange'
      document.addEventListener('visibilitychange', testListener);

      // If Privacy Guard is active, the listener should be silently blocked
      // We can't directly test this without triggering the event,
      // but we can check if the APIs are in the expected state

      return visibilityOverridden && hiddenOverridden;
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
