/**
 * Global Test Setup
 *
 * Runs before all tests to set up the testing environment
 */

import { setupChromeMock } from './chrome-mock.js';
import fetchMock from 'jest-fetch-mock';

// Set up Chrome API mocks globally
setupChromeMock();

// Set up fetch mock globally
global.fetch = fetchMock;
global.fetch.enableMocks();

// Mock Service Worker APIs not available in Node
global.self = global;

// Mock importScripts to set up globals that background.js expects
global.importScripts = jest.fn((...scripts) => {
  for (const script of scripts) {
    if (script.includes('auth-service')) {
      // Provide mock AuthService global
      if (typeof global.AuthService === 'undefined') {
        global.AuthService = {
          DEFAULT_BACKEND_URL: 'https://api.captureai.workers.dev',
          REQUEST_TIMEOUT: 30000,
          CACHE_KEY: 'captureai-user-cache',
          CACHE_FRESHNESS_MS: 300000,
          CACHE_MAX_AGE_MS: 3600000,
          fetchWithTimeout: jest.fn(),
          getLicenseKey: jest.fn().mockResolvedValue('TEST-KEY1-KEY2-KEY3-KEY4'),
          getCachedOrFreshUser: jest.fn().mockResolvedValue({
            user: { tier: 'basic', subscription_status: 'inactive' }
          }),
          refreshUserCache: jest.fn().mockResolvedValue(undefined),
          sendAIRequest: jest.fn().mockResolvedValue({
            answer: 'Mock AI response',
            usage: { total_tokens: 100 }
          }),
          validateLicenseKey: jest.fn().mockResolvedValue({ valid: true }),
          createFreeKey: jest.fn().mockResolvedValue({ license_key: 'TEST-KEY1-KEY2-KEY3-KEY4' })
        };
      }
    }
    if (script.includes('migration')) {
      if (typeof global.Migration === 'undefined') {
        global.Migration = {
          checkAndMigrate: jest.fn().mockResolvedValue(undefined)
        };
      }
    }
  }
});

// Mock AbortController if not available
if (typeof global.AbortController === 'undefined') {
  global.AbortController = class AbortController {
    constructor() {
      this.signal = { aborted: false };
    }
    abort() {
      this.signal.aborted = true;
    }
  };
}
