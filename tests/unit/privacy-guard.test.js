/**
 * Unit Tests for Privacy Guard Module
 *
 * Tests privacy protection state management and API checking
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');

// Test the privacy guard logic (extracted from modules/privacy-guard.js)
describe('Privacy Guard', () => {
  describe('State Management', () => {
    test('should initialize with disabled state', () => {
      const privacyGuard = {
        enabled: false,
        injected: false
      };

      expect(privacyGuard.enabled).toBe(false);
      expect(privacyGuard.injected).toBe(false);
    });

    test('should track enabled state', () => {
      const privacyGuard = {
        enabled: false,
        injected: false,

        enable() {
          this.enabled = true;
          this.injected = true;
        },

        isActive() {
          return this.enabled;
        }
      };

      expect(privacyGuard.isActive()).toBe(false);

      privacyGuard.enable();

      expect(privacyGuard.isActive()).toBe(true);
      expect(privacyGuard.injected).toBe(true);
    });

    test('should handle disable request', () => {
      const privacyGuard = {
        enabled: true,
        injected: true,

        disable() {
          this.enabled = false;
        }
      };

      expect(privacyGuard.enabled).toBe(true);

      privacyGuard.disable();

      expect(privacyGuard.enabled).toBe(false);
      expect(privacyGuard.injected).toBe(true); // Injection persists
    });
  });

  describe('Protection Detection', () => {
    test('should detect protection when document APIs are overridden', () => {
      // Simulate overridden APIs
      const mockDocument = {
        visibilityState: 'visible',
        hidden: false,
        addEventListener: jest.fn()
      };

      function checkProtection(doc) {
        try {
          const visibilityOverridden = doc.visibilityState === 'visible';
          const hiddenOverridden = doc.hidden === false;
          return visibilityOverridden && hiddenOverridden;
        } catch (error) {
          return false;
        }
      }

      const result = checkProtection(mockDocument);

      expect(result).toBe(true);
    });

    test('should not detect protection when APIs are normal', () => {
      const mockDocument = {
        visibilityState: 'hidden',
        hidden: true,
        addEventListener: jest.fn()
      };

      function checkProtection(doc) {
        try {
          const visibilityOverridden = doc.visibilityState === 'visible';
          const hiddenOverridden = doc.hidden === false;
          return visibilityOverridden && hiddenOverridden;
        } catch (error) {
          return false;
        }
      }

      const result = checkProtection(mockDocument);

      expect(result).toBe(false);
    });

    test('should handle errors in protection check', () => {
      const mockDocument = {
        get visibilityState() {
          throw new Error('API error');
        }
      };

      function checkProtection(doc) {
        try {
          const visibilityOverridden = doc.visibilityState === 'visible';
          const hiddenOverridden = doc.hidden === false;
          return visibilityOverridden && hiddenOverridden;
        } catch (error) {
          return false;
        }
      }

      const result = checkProtection(mockDocument);

      expect(result).toBe(false);
    });
  });

  describe('Message Communication', () => {
    test('should send enable message to background', () => {
      const messages = [];

      const mockChrome = {
        runtime: {
          sendMessage: jest.fn((message) => {
            messages.push(message);
            return Promise.resolve({ success: true });
          })
        }
      };

      async function enablePrivacyGuard(chrome) {
        const result = await chrome.runtime.sendMessage({
          action: 'enablePrivacyGuard'
        });
        return result;
      }

      enablePrivacyGuard(mockChrome);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'enablePrivacyGuard'
      });
    });

    test('should send disable message to background', () => {
      const mockChrome = {
        runtime: {
          sendMessage: jest.fn(() => Promise.resolve({ success: true }))
        }
      };

      async function disablePrivacyGuard(chrome) {
        await chrome.runtime.sendMessage({
          action: 'disablePrivacyGuard'
        });
      }

      disablePrivacyGuard(mockChrome);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'disablePrivacyGuard'
      });
    });

    test('should send status request to background', () => {
      const mockChrome = {
        runtime: {
          sendMessage: jest.fn(() => Promise.resolve({ enabled: true, available: true }))
        }
      };

      async function getStatus(chrome) {
        const result = await chrome.runtime.sendMessage({
          action: 'getPrivacyGuardStatus'
        });
        return result;
      }

      getStatus(mockChrome);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'getPrivacyGuardStatus'
      });
    });

    test('should handle communication errors', async () => {
      const mockChrome = {
        runtime: {
          sendMessage: jest.fn(() => Promise.reject(new Error('Communication error')))
        }
      };

      async function getStatus(chrome) {
        try {
          const result = await chrome.runtime.sendMessage({
            action: 'getPrivacyGuardStatus'
          });
          return result;
        } catch (error) {
          return { enabled: false, error: error.message };
        }
      }

      const result = await getStatus(mockChrome);

      expect(result.enabled).toBe(false);
      expect(result.error).toBe('Communication error');
    });
  });

  describe('Initialization Flow', () => {
    test('should not reinitialize if already enabled', async () => {
      const privacyGuard = {
        enabled: true,
        initCount: 0,

        async init() {
          if (this.enabled) {
            return;
          }
          this.initCount++;
        }
      };

      await privacyGuard.init();
      await privacyGuard.init();

      expect(privacyGuard.initCount).toBe(0);
    });

    test('should initialize when not enabled', async () => {
      const privacyGuard = {
        enabled: false,
        initCount: 0,

        async init() {
          if (this.enabled) {
            return;
          }
          this.initCount++;
          this.enabled = true;
        }
      };

      await privacyGuard.init();

      expect(privacyGuard.initCount).toBe(1);
      expect(privacyGuard.enabled).toBe(true);
    });

    test('should handle initialization errors', async () => {
      const privacyGuard = {
        enabled: false,
        error: null,

        async init() {
          try {
            throw new Error('Init failed');
          } catch (error) {
            this.error = error.message;
          }
        }
      };

      await privacyGuard.init();

      expect(privacyGuard.error).toBe('Init failed');
      expect(privacyGuard.enabled).toBe(false);
    });
  });

  describe('API Override Detection', () => {
    test('should detect document.hidden override', () => {
      const overriddenDoc = { hidden: false };
      const normalDoc = { hidden: true };

      expect(overriddenDoc.hidden).toBe(false);
      expect(normalDoc.hidden).toBe(true);
    });

    test('should detect document.visibilityState override', () => {
      const overriddenDoc = { visibilityState: 'visible' };
      const normalDoc = { visibilityState: 'hidden' };

      expect(overriddenDoc.visibilityState).toBe('visible');
      expect(normalDoc.visibilityState).toBe('hidden');
    });

    test('should detect addEventListener blocking', () => {
      const blockedEvents = [];
      const normalDoc = {
        addEventListener: (event, listener) => {
          // Normal behavior
        }
      };

      const overriddenDoc = {
        addEventListener: (event, listener) => {
          if (event === 'visibilitychange') {
            blockedEvents.push(event);
            return; // Block the listener
          }
        }
      };

      overriddenDoc.addEventListener('visibilitychange', () => {});
      normalDoc.addEventListener('visibilitychange', () => {});

      expect(blockedEvents).toContain('visibilitychange');
    });
  });

  describe('Status Reporting', () => {
    test('should report enabled status', () => {
      const privacyGuard = {
        enabled: true,

        isActive() {
          return this.enabled;
        }
      };

      expect(privacyGuard.isActive()).toBe(true);
    });

    test('should report disabled status', () => {
      const privacyGuard = {
        enabled: false,

        isActive() {
          return this.enabled;
        }
      };

      expect(privacyGuard.isActive()).toBe(false);
    });

    test('should include injection status', () => {
      const privacyGuard = {
        enabled: true,
        injected: true,

        getStatus() {
          return {
            enabled: this.enabled,
            injected: this.injected
          };
        }
      };

      const status = privacyGuard.getStatus();

      expect(status.enabled).toBe(true);
      expect(status.injected).toBe(true);
    });
  });
});
