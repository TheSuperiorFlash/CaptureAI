/**
 * @jest-environment jsdom
 */

/**
 * Unit Tests for Privacy Guard Module
 *
 * Tests the actual PrivacyGuard module from extension/modules/privacy-guard.js
 * including checkProtection, isActive, disable, checkProAccess, checkSettings
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { PrivacyGuard } from '../../modules/privacy-guard.js';

describe('Privacy Guard Module', () => {
  beforeEach(() => {
    // Reset PrivacyGuard state
    PrivacyGuard.enabled = false;
    PrivacyGuard.injected = false;

    // Set up window.CaptureAI
    window.CaptureAI = {
      CONFIG: { DEBUG: false }
    };

    // Reset chrome mocks
    chrome.storage.local.get.mockReset();
    chrome.runtime.sendMessage.mockReset();
  });

  describe('isActive', () => {
    test('should return false when disabled', () => {
      expect(PrivacyGuard.isActive()).toBe(false);
    });

    test('should return true when enabled', () => {
      PrivacyGuard.enabled = true;
      expect(PrivacyGuard.isActive()).toBe(true);
    });
  });

  describe('checkProtection', () => {
    let origGetOwnPD;

    beforeEach(() => {
      origGetOwnPD = Object.getOwnPropertyDescriptor;
    });

    afterEach(() => {
      Object.getOwnPropertyDescriptor = origGetOwnPD;
    });

    test('should return false when descriptors are configurable', () => {
      Object.getOwnPropertyDescriptor = (obj, prop) => {
        if (obj === Document.prototype && (prop === 'visibilityState' || prop === 'hidden')) {
          return { get: () => 'visible', configurable: true };
        }
        return origGetOwnPD(obj, prop);
      };

      const result = PrivacyGuard.checkProtection();
      expect(result).toBe(false);
    });

    test('should return true when visibilityState descriptor is non-configurable', () => {
      Object.getOwnPropertyDescriptor = (obj, prop) => {
        if (obj === Document.prototype && prop === 'visibilityState') {
          return { get: () => 'visible', configurable: false };
        }
        return origGetOwnPD(obj, prop);
      };

      const result = PrivacyGuard.checkProtection();
      expect(result).toBe(true);
    });

    test('should return true when hidden descriptor is non-configurable', () => {
      Object.getOwnPropertyDescriptor = (obj, prop) => {
        if (obj === Document.prototype && prop === 'visibilityState') {
          return { get: () => 'visible', configurable: true };
        }
        if (obj === Document.prototype && prop === 'hidden') {
          return { get: () => false, configurable: false };
        }
        return origGetOwnPD(obj, prop);
      };

      const result = PrivacyGuard.checkProtection();
      expect(result).toBe(true);
    });

    test('should return false when no descriptor exists', () => {
      Object.getOwnPropertyDescriptor = (obj, prop) => {
        if (obj === Document.prototype && (prop === 'visibilityState' || prop === 'hidden')) {
          return undefined;
        }
        return origGetOwnPD(obj, prop);
      };

      const result = PrivacyGuard.checkProtection();
      expect(result).toBe(false);
    });

    test('should return false when error is thrown', () => {
      Object.getOwnPropertyDescriptor = () => { throw new Error('Test error'); };

      const result = PrivacyGuard.checkProtection();
      expect(result).toBe(false);
    });
  });

  describe('checkProAccess', () => {
    test('should return true when tier is pro', async () => {
      chrome.storage.local.get.mockResolvedValue({ 'captureai-user-tier': 'pro' });

      const result = await PrivacyGuard.checkProAccess();
      expect(result).toBe(true);
    });

    test('should return false when tier is free', async () => {
      chrome.storage.local.get.mockResolvedValue({ 'captureai-user-tier': 'free' });

      const result = await PrivacyGuard.checkProAccess();
      expect(result).toBe(false);
    });

    test('should return false when tier is not set', async () => {
      chrome.storage.local.get.mockResolvedValue({});

      const result = await PrivacyGuard.checkProAccess();
      expect(result).toBe(false);
    });

    test('should return false on storage error', async () => {
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const result = await PrivacyGuard.checkProAccess();
      expect(result).toBe(false);
    });
  });

  describe('checkSettings', () => {
    test('should return true when privacy guard enabled in settings', async () => {
      chrome.storage.local.get.mockResolvedValue({
        'captureai-settings': { privacyGuard: { enabled: true } }
      });

      const result = await PrivacyGuard.checkSettings();
      expect(result).toBe(true);
    });

    test('should return false when privacy guard disabled in settings', async () => {
      chrome.storage.local.get.mockResolvedValue({
        'captureai-settings': { privacyGuard: { enabled: false } }
      });

      const result = await PrivacyGuard.checkSettings();
      expect(result).toBe(false);
    });

    test('should return false when settings are empty', async () => {
      chrome.storage.local.get.mockResolvedValue({});

      const result = await PrivacyGuard.checkSettings();
      expect(result).toBe(false);
    });

    test('should return false when privacyGuard key missing', async () => {
      chrome.storage.local.get.mockResolvedValue({
        'captureai-settings': {}
      });

      const result = await PrivacyGuard.checkSettings();
      expect(result).toBe(false);
    });

    test('should return false on storage error', async () => {
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const result = await PrivacyGuard.checkSettings();
      expect(result).toBe(false);
    });
  });

  describe('disable', () => {
    test('should do nothing when already disabled', async () => {
      PrivacyGuard.enabled = false;

      await PrivacyGuard.disable();

      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    test('should send disable message when enabled', async () => {
      PrivacyGuard.enabled = true;
      chrome.runtime.sendMessage.mockResolvedValue({ success: true });

      await PrivacyGuard.disable();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'disablePrivacyGuard'
      });
      expect(PrivacyGuard.enabled).toBe(false);
    });

    test('should handle send message error gracefully', async () => {
      PrivacyGuard.enabled = true;
      chrome.runtime.sendMessage.mockRejectedValue(new Error('Send error'));

      await PrivacyGuard.disable();

      // Should not throw, enabled state may remain true due to error
      expect(PrivacyGuard.enabled).toBe(true);
    });
  });

  describe('getStatus', () => {
    test('should return status from background', async () => {
      chrome.runtime.sendMessage.mockResolvedValue({ enabled: true, injected: true });

      const status = await PrivacyGuard.getStatus();

      expect(status).toEqual({ enabled: true, injected: true });
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'getPrivacyGuardStatus'
      });
    });

    test('should return disabled status on error', async () => {
      chrome.runtime.sendMessage.mockRejectedValue(new Error('Error'));

      const status = await PrivacyGuard.getStatus();

      expect(status).toEqual({ enabled: false });
    });
  });

  describe('init', () => {
    test('should skip if already enabled', async () => {
      PrivacyGuard.enabled = true;

      await PrivacyGuard.init();

      expect(chrome.storage.local.get).not.toHaveBeenCalled();
    });

    test('should not enable when not pro tier', async () => {
      chrome.storage.local.get.mockResolvedValue({});

      await PrivacyGuard.init();

      expect(PrivacyGuard.enabled).toBe(false);
    });

    test('should not enable when settings disabled', async () => {
      chrome.storage.local.get
        .mockResolvedValueOnce({ 'captureai-user-tier': 'pro' })
        .mockResolvedValueOnce({ 'captureai-settings': { privacyGuard: { enabled: false } } });

      await PrivacyGuard.init();

      expect(PrivacyGuard.enabled).toBe(false);
    });

    test('should try to inject when pro and settings enabled but not protected', async () => {
      jest.spyOn(PrivacyGuard, 'checkProtection').mockReturnValue(false);
      chrome.storage.local.get
        .mockResolvedValueOnce({ 'captureai-user-tier': 'pro' })
        .mockResolvedValueOnce({ 'captureai-settings': { privacyGuard: { enabled: true } } });
      chrome.runtime.sendMessage.mockResolvedValue({ success: true });

      await PrivacyGuard.init();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'enablePrivacyGuard'
      });
      expect(PrivacyGuard.enabled).toBe(true);
      expect(PrivacyGuard.injected).toBe(true);
    });

    test('should enable directly when protection already active', async () => {
      jest.spyOn(PrivacyGuard, 'checkProtection').mockReturnValue(true);
      chrome.storage.local.get
        .mockResolvedValueOnce({ 'captureai-user-tier': 'pro' })
        .mockResolvedValueOnce({ 'captureai-settings': { privacyGuard: { enabled: true } } });

      await PrivacyGuard.init();

      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
      expect(PrivacyGuard.enabled).toBe(true);
      expect(PrivacyGuard.injected).toBe(true);
    });

    test('should handle injection failure', async () => {
      jest.spyOn(PrivacyGuard, 'checkProtection').mockReturnValue(false);
      chrome.storage.local.get
        .mockResolvedValueOnce({ 'captureai-user-tier': 'pro' })
        .mockResolvedValueOnce({ 'captureai-settings': { privacyGuard: { enabled: true } } });
      chrome.runtime.sendMessage.mockRejectedValue(new Error('Injection failed'));

      await PrivacyGuard.init();

      expect(PrivacyGuard.enabled).toBe(false);
    });

    test('should handle injection returning unsuccessful', async () => {
      jest.spyOn(PrivacyGuard, 'checkProtection').mockReturnValue(false);
      chrome.storage.local.get
        .mockResolvedValueOnce({ 'captureai-user-tier': 'pro' })
        .mockResolvedValueOnce({ 'captureai-settings': { privacyGuard: { enabled: true } } });
      chrome.runtime.sendMessage.mockResolvedValue({ success: false });

      await PrivacyGuard.init();

      expect(PrivacyGuard.enabled).toBe(false);
    });
  });

  describe('module exports', () => {
    test('should export PrivacyGuard object', () => {
      expect(PrivacyGuard).toBeDefined();
      expect(typeof PrivacyGuard.init).toBe('function');
      expect(typeof PrivacyGuard.checkProtection).toBe('function');
      expect(typeof PrivacyGuard.isActive).toBe('function');
      expect(typeof PrivacyGuard.disable).toBe('function');
      expect(typeof PrivacyGuard.getStatus).toBe('function');
    });
  });
});
