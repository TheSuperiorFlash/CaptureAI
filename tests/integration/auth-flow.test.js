/**
 * Integration Tests: Authentication Flow
 * Tests the full auth lifecycle: key request → validation → caching → usage → logout
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks, storageMock } = require('../setup/chrome-mock');

// Track storage state across operations
let storageState;

// Mock fetch globally
global.fetch = jest.fn();

let AuthService;

beforeEach(() => {
  resetChromeMocks();
  jest.resetModules();
  global.fetch.mockReset();
  storageState = {};

  // Simulate realistic storage behavior
  storageMock.local.get.mockImplementation((keys, callback) => {
    const result = {};
    const keyList = Array.isArray(keys) ? keys : [keys];
    keyList.forEach(k => {
      if (storageState[k] !== undefined) {
        result[k] = storageState[k];
      }
    });
    if (callback) { callback(result); return undefined; }
    return Promise.resolve(result);
  });

  storageMock.local.set.mockImplementation((items, callback) => {
    Object.assign(storageState, items);
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  });

  storageMock.local.remove.mockImplementation((keys, callback) => {
    const keyList = Array.isArray(keys) ? keys : [keys];
    keyList.forEach(k => delete storageState[k]);
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  });

  AuthService = require('../../extension/modules/auth-service.js');
});

describe('Auth Flow Integration', () => {
  const MOCK_LICENSE_KEY = 'ABCD-EFGH-IJKL-MNOP-QRST';
  const MOCK_USER = {
    email: 'user@example.com',
    tier: 'free',
    subscription_status: 'inactive'
  };

  function mockFetchJSON(data, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: { get: () => 'application/json' },
      json: async () => data,
      text: async () => JSON.stringify(data)
    };
  }

  describe('Full lifecycle: request → validate → use → logout', () => {
    test('should request free key, validate it, use it for AI, then logout', async () => {
      // Step 1: Request free key
      global.fetch
        .mockResolvedValueOnce(mockFetchJSON({ licenseKey: MOCK_LICENSE_KEY }))
        // Step 1b: validateKey is called internally by requestFreeKey
        .mockResolvedValueOnce(mockFetchJSON({ user: MOCK_USER }));

      const key = await AuthService.requestFreeKey('user@example.com');
      expect(key).toBe(MOCK_LICENSE_KEY);

      // Verify key and user info stored
      expect(storageState['captureai-license-key']).toBe(MOCK_LICENSE_KEY);
      expect(storageState['captureai-user-email']).toBe('user@example.com');
      expect(storageState['captureai-user-tier']).toBe('free');

      // Step 2: Get current user (uses stored key)
      global.fetch.mockResolvedValueOnce(mockFetchJSON(MOCK_USER));
      const user = await AuthService.getCurrentUser();
      expect(user.email).toBe('user@example.com');

      // Verify the auth header was sent
      const lastCall = global.fetch.mock.calls[2];
      expect(lastCall[0]).toContain('/api/auth/me');
      expect(lastCall[1].headers.Authorization).toBe(`LicenseKey ${MOCK_LICENSE_KEY}`);

      // Step 3: Send AI request
      global.fetch.mockResolvedValueOnce(mockFetchJSON({
        answer: 'The answer is 42',
        usage: { total_tokens: 100 }
      }));

      const aiResult = await AuthService.sendAIRequest({
        question: 'What is 6 * 7?',
        promptType: 'ask',
        reasoningLevel: 0
      });
      expect(aiResult.answer).toBe('The answer is 42');

      // Verify AI request used correct auth
      const aiCall = global.fetch.mock.calls[3];
      expect(aiCall[0]).toContain('/api/ai/complete');
      expect(aiCall[1].headers.Authorization).toBe(`LicenseKey ${MOCK_LICENSE_KEY}`);

      // Step 4: Logout
      await AuthService.clearKey();

      // Verify all auth data cleared
      expect(storageState['captureai-license-key']).toBeUndefined();
      expect(storageState['captureai-user-email']).toBeUndefined();
      expect(storageState['captureai-user-tier']).toBeUndefined();
      expect(storageState['captureai-user-cache']).toBeUndefined();

      // Step 5: After logout, getLicenseKey should return null
      const keyAfterLogout = await AuthService.getLicenseKey();
      expect(keyAfterLogout).toBeNull();
    });
  });

  describe('Cache lifecycle', () => {
    test('should use fresh cache, then stale cache, then refresh', async () => {
      // Setup: Validate key to populate storage
      global.fetch.mockResolvedValueOnce(mockFetchJSON({ user: MOCK_USER }));
      await AuthService.validateKey(MOCK_LICENSE_KEY);

      // Set fresh cache
      await AuthService.setCachedUser(MOCK_USER);

      // Read 1: Should return from fresh cache (no API call)
      const result1 = await AuthService.getCachedOrFreshUser();
      expect(result1.user.email).toBe('user@example.com');
      expect(result1.fromCache).toBe(true);
      expect(result1.needsRefresh).toBe(false);

      // Simulate cache aging (6 minutes old - stale but not expired)
      const cached = storageState['captureai-user-cache'];
      cached.updatedAt = Date.now() - (6 * 60 * 1000);
      storageState['captureai-user-cache'] = cached;

      const result2 = await AuthService.getCachedOrFreshUser();
      expect(result2.fromCache).toBe(true);
      expect(result2.needsRefresh).toBe(true);

      // Simulate cache aging (2 hours old - expired)
      cached.updatedAt = Date.now() - (2 * 60 * 60 * 1000);
      storageState['captureai-user-cache'] = cached;

      // Should make API call for expired cache
      global.fetch.mockResolvedValueOnce(mockFetchJSON(MOCK_USER));
      const result3 = await AuthService.getCachedOrFreshUser();
      expect(result3.fromCache).toBe(false);
      expect(result3.needsRefresh).toBe(false);
    });
  });

  describe('Error recovery', () => {
    test('should clear key on 401 and require re-validation', async () => {
      // Setup key
      storageState['captureai-license-key'] = MOCK_LICENSE_KEY;
      storageState['captureai-user-tier'] = 'free';

      // API returns 401 - expired key
      global.fetch.mockResolvedValueOnce(mockFetchJSON(
        { error: 'Invalid key' }, 401
      ));

      await expect(AuthService.getCurrentUser())
        .rejects.toThrow('invalid or expired');

      // Key should be cleared
      expect(storageState['captureai-license-key']).toBeUndefined();
    });

    test('should handle rate limit on AI request', async () => {
      storageState['captureai-license-key'] = MOCK_LICENSE_KEY;

      global.fetch.mockResolvedValueOnce(mockFetchJSON(
        { error: 'Daily limit reached. Upgrade to Pro for unlimited access.' },
        429
      ));

      await expect(AuthService.sendAIRequest({
        question: 'test',
        promptType: 'ask'
      })).rejects.toThrow('Daily limit reached');

      // Key should NOT be cleared on rate limit
      expect(storageState['captureai-license-key']).toBe(MOCK_LICENSE_KEY);
    });
  });

  describe('Pro tier upgrade flow', () => {
    test('should handle free → pro upgrade via checkout', async () => {
      // Start as free user
      storageState['captureai-license-key'] = MOCK_LICENSE_KEY;
      storageState['captureai-user-tier'] = 'free';

      // Create checkout session
      global.fetch.mockResolvedValueOnce(mockFetchJSON({
        url: 'https://checkout.stripe.com/c/pay_xxx'
      }));

      const checkout = await AuthService.createCheckoutSession('user@example.com');
      expect(checkout.url).toContain('stripe.com');

      // After payment, getCurrentUser returns pro
      const proUser = { ...MOCK_USER, tier: 'pro', subscription_status: 'active' };
      global.fetch.mockResolvedValueOnce(mockFetchJSON(proUser));

      const user = await AuthService.getCurrentUser();
      expect(user.tier).toBe('pro');

      // Storage should be updated
      expect(storageState['captureai-user-tier']).toBe('pro');
    });
  });
});
