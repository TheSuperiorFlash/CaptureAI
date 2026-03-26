/**
 * Unit Tests for AuthService Module
 *
 * Tests authentication, caching, API communication,
 * and error handling for the CaptureAI license key system
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { resetChromeMocks, storageMock } from '../setup/chrome-mock.js';

let AuthService;

/**
 * Build a minimal mock Response object compatible with AuthService
 * @param {Object} options - Response configuration
 * @returns {Object} Mock response
 */
function mockResponse({
  ok = true,
  status = 200,
  statusText = 'OK',
  body = {},
  contentType = 'application/json'
} = {}) {
  return {
    ok,
    status,
    statusText,
    headers: { get: (name) => name === 'content-type' ? contentType : null },
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body))
  };
}

beforeEach(() => {
  resetChromeMocks();
  jest.resetModules();
  global.fetch.mockReset();

  // Restore default storage mock behavior after clearAllMocks wipes it.
  // Without this, storageMock.local.get returns undefined instead of
  // Promise.resolve({}), which breaks getLicenseKey / getBackendUrl.
  storageMock.local.get.mockImplementation((keys, callback) => {
    if (callback) { callback({}); return undefined; }
    return Promise.resolve({});
  });
  storageMock.local.set.mockImplementation((items, callback) => {
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  });
  storageMock.local.remove.mockImplementation((keys, callback) => {
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  });

  AuthService = require('../../modules/auth-service.js');
  // Reset the in-flight refresh tracker between tests
  AuthService._refreshInFlight = null;
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
describe('AuthService constants', () => {
  test('DEFAULT_BACKEND_URL points to production workers', () => {
    expect(AuthService.DEFAULT_BACKEND_URL)
      .toBe('https://api.captureai.dev');
  });

  test('REQUEST_TIMEOUT is 30 seconds', () => {
    expect(AuthService.REQUEST_TIMEOUT).toBe(30000);
  });

  test('CACHE_KEY is the expected storage key', () => {
    expect(AuthService.CACHE_KEY).toBe('captureai-user-cache');
  });

  test('CACHE_FRESHNESS_MS is 5 minutes', () => {
    expect(AuthService.CACHE_FRESHNESS_MS).toBe(5 * 60 * 1000);
  });

  test('CACHE_MAX_AGE_MS is 1 hour', () => {
    expect(AuthService.CACHE_MAX_AGE_MS).toBe(60 * 60 * 1000);
  });
});

// ---------------------------------------------------------------------------
// getBackendUrl
// ---------------------------------------------------------------------------
describe('AuthService.getBackendUrl', () => {
  test('returns stored URL when present in chrome.storage', async () => {
    storageMock.local.get.mockImplementation((keys, callback) => {
      const result = { 'captureai-backend-url': 'https://custom.backend.dev' };
      if (callback) { callback(result); return undefined; }
      return Promise.resolve(result);
    });

    const url = await AuthService.getBackendUrl();

    expect(url).toBe('https://custom.backend.dev');
  });

  test('returns default URL when nothing is stored', async () => {
    const url = await AuthService.getBackendUrl();

    expect(url).toBe('https://api.captureai.dev');
  });
});

// ---------------------------------------------------------------------------
// getLicenseKey
// ---------------------------------------------------------------------------
describe('AuthService.getLicenseKey', () => {
  test('returns stored license key', async () => {
    storageMock.local.get.mockImplementation((keys, callback) => {
      const result = { 'captureai-license-key': 'FREE-AAAA-BBBB-CCCC-DDDD' };
      if (callback) { callback(result); return undefined; }
      return Promise.resolve(result);
    });

    const key = await AuthService.getLicenseKey();

    expect(key).toBe('FREE-AAAA-BBBB-CCCC-DDDD');
  });

  test('returns null when no key is stored', async () => {
    const key = await AuthService.getLicenseKey();

    expect(key).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateKey
// ---------------------------------------------------------------------------
describe('AuthService.validateKey', () => {
  const fakeUser = { email: 'user@test.com', tier: 'basic' };

  test('stores key and user info on successful validation', async () => {
    global.fetch.mockResolvedValueOnce(
      mockResponse({ body: { user: fakeUser } })
    );

    const user = await AuthService.validateKey('FREE-1111-2222-3333-4444');

    expect(user).toEqual(fakeUser);
    expect(storageMock.local.set).toHaveBeenCalledWith({
      'captureai-license-key': 'FREE-1111-2222-3333-4444',
      'captureai-user-email': 'user@test.com',
      'captureai-user-tier': 'basic'
    });
  });

  test('throws on non-JSON response', async () => {
    global.fetch.mockResolvedValueOnce(
      mockResponse({
        body: '<html>Server Error</html>',
        contentType: 'text/html'
      })
    );

    await expect(AuthService.validateKey('BAD-KEY'))
      .rejects.toThrow('Backend returned non-JSON response');
  });

  test('throws with server error message on !ok JSON response', async () => {
    global.fetch.mockResolvedValueOnce(
      mockResponse({
        ok: false,
        status: 400,
        body: { error: 'Invalid license key' }
      })
    );

    await expect(AuthService.validateKey('INVALID-KEY'))
      .rejects.toThrow('Invalid license key');
  });

  test('wraps network errors with context', async () => {
    global.fetch.mockRejectedValueOnce(new Error('network timeout'));

    await expect(AuthService.validateKey('TEST-KEY'))
      .rejects.toThrow('Validation failed: network timeout');
  });
});

// ---------------------------------------------------------------------------
// clearKey
// ---------------------------------------------------------------------------
describe('AuthService.clearKey', () => {
  test('removes all relevant storage keys', async () => {
    await AuthService.clearKey();

    expect(storageMock.local.remove).toHaveBeenCalledWith([
      'captureai-license-key',
      'captureai-user-email',
      'captureai-user-tier',
      'captureai-user-cache',
      'captureai-last-usage'
    ]);
  });
});

// ---------------------------------------------------------------------------
// getCurrentUser
// ---------------------------------------------------------------------------
describe('AuthService.getCurrentUser', () => {
  const fakeUser = {
    email: 'pro@test.com',
    tier: 'pro'
  };

  function mockKeyInStorage() {
    storageMock.local.get.mockImplementation((keys, callback) => {
      const data = {
        'captureai-license-key': 'PRO-AAAA-BBBB-CCCC-DDDD'
      };
      const result = {};
      if (typeof keys === 'string') {
        result[keys] = data[keys] || undefined;
      } else if (Array.isArray(keys)) {
        keys.forEach(k => { result[k] = data[k] || undefined; });
      }
      if (callback) { callback(result); return undefined; }
      return Promise.resolve(result);
    });
  }

  test('returns user and updates storage/cache on success', async () => {
    mockKeyInStorage();
    global.fetch.mockResolvedValueOnce(mockResponse({ body: fakeUser }));

    const user = await AuthService.getCurrentUser();

    expect(user).toEqual(fakeUser);
    expect(storageMock.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'captureai-user-email': 'pro@test.com',
        'captureai-user-tier': 'pro'
      })
    );
  });

  test('clears key and throws on 401 response', async () => {
    mockKeyInStorage();
    global.fetch.mockResolvedValueOnce(
      mockResponse({ ok: false, status: 401 })
    );

    await expect(AuthService.getCurrentUser())
      .rejects.toThrow('License key is invalid or expired');
    expect(storageMock.local.remove).toHaveBeenCalled();
  });

  test('clears key and throws on 403 response', async () => {
    mockKeyInStorage();
    global.fetch.mockResolvedValueOnce(
      mockResponse({ ok: false, status: 403 })
    );

    await expect(AuthService.getCurrentUser())
      .rejects.toThrow('License key is invalid or expired');
    expect(storageMock.local.remove).toHaveBeenCalled();
  });

  test('throws generic error on other non-ok responses', async () => {
    mockKeyInStorage();
    global.fetch.mockResolvedValueOnce(
      mockResponse({ ok: false, status: 500 })
    );

    await expect(AuthService.getCurrentUser())
      .rejects.toThrow('Failed to fetch user info');
  });

  test('throws when no license key is stored', async () => {
    await expect(AuthService.getCurrentUser())
      .rejects.toThrow('No license key found');
  });
});

// ---------------------------------------------------------------------------
// getUsage
// ---------------------------------------------------------------------------
describe('AuthService.getUsage', () => {
  function mockKeyInStorage() {
    storageMock.local.get.mockImplementation((keys, callback) => {
      const data = { 'captureai-license-key': 'KEY-1111-2222-3333-4444' };
      const result = {};
      if (typeof keys === 'string') {
        result[keys] = data[keys] || undefined;
      }
      if (callback) { callback(result); return undefined; }
      return Promise.resolve(result);
    });
  }

  test('returns usage stats on success', async () => {
    mockKeyInStorage();
    const usage = { requests_today: 3, limit: 10 };
    global.fetch.mockResolvedValueOnce(mockResponse({ body: usage }));

    const result = await AuthService.getUsage();

    expect(result).toEqual(usage);
  });

  test('throws when no license key is stored', async () => {
    await expect(AuthService.getUsage())
      .rejects.toThrow('No license key found');
  });

  test('throws on non-ok response', async () => {
    mockKeyInStorage();
    global.fetch.mockResolvedValueOnce(
      mockResponse({ ok: false, status: 500 })
    );

    await expect(AuthService.getUsage())
      .rejects.toThrow('Failed to fetch usage statistics');
  });
});

// ---------------------------------------------------------------------------
// sendAIRequest
// ---------------------------------------------------------------------------
describe('AuthService.sendAIRequest', () => {
  const requestParams = {
    question: 'What is 2+2?',
    ocrText: 'Problem: 2+2',
    ocrConfidence: 95,
    promptType: 'answer',
    reasoningLevel: 1
  };

  function mockKeyInStorage() {
    storageMock.local.get.mockImplementation((keys, callback) => {
      const data = { 'captureai-license-key': 'PRO-AAAA-BBBB-CCCC-DDDD' };
      const result = {};
      if (typeof keys === 'string') {
        result[keys] = data[keys] || undefined;
      }
      if (callback) { callback(result); return undefined; }
      return Promise.resolve(result);
    });
  }

  test('returns AI response on success', async () => {
    mockKeyInStorage();
    const aiResponse = {
      answer: 'The answer is 4',
      usage: { total_tokens: 50 },
      cached: false,
      responseTime: 1200
    };
    global.fetch.mockResolvedValueOnce(mockResponse({ body: aiResponse }));

    const result = await AuthService.sendAIRequest(requestParams);

    expect(result).toEqual(aiResponse);
  });

  test('sends correct request body and headers', async () => {
    mockKeyInStorage();
    global.fetch.mockResolvedValueOnce(
      mockResponse({ body: { answer: 'ok' } })
    );

    await AuthService.sendAIRequest(requestParams);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/ai/complete'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'LicenseKey PRO-AAAA-BBBB-CCCC-DDDD',
          'Content-Type': 'application/json',
          'Priority': 'u=1'
        })
      })
    );
  });

  test('throws rate limit error on 429', async () => {
    mockKeyInStorage();
    global.fetch.mockResolvedValueOnce(
      mockResponse({
        ok: false,
        status: 429,
        body: { error: 'Daily limit reached (10/10)' }
      })
    );

    await expect(AuthService.sendAIRequest(requestParams))
      .rejects.toThrow('Daily limit reached (10/10)');
  });

  test('clears key on 401 auth error', async () => {
    mockKeyInStorage();
    global.fetch.mockResolvedValueOnce(
      mockResponse({
        ok: false,
        status: 401,
        body: { error: 'Unauthorized' }
      })
    );

    await expect(AuthService.sendAIRequest(requestParams))
      .rejects.toThrow('License key is invalid or expired');
    expect(storageMock.local.remove).toHaveBeenCalled();
  });

  test('clears key on 403 auth error', async () => {
    mockKeyInStorage();
    global.fetch.mockResolvedValueOnce(
      mockResponse({
        ok: false,
        status: 403,
        body: { error: 'Forbidden' }
      })
    );

    await expect(AuthService.sendAIRequest(requestParams))
      .rejects.toThrow('License key is invalid or expired');
    expect(storageMock.local.remove).toHaveBeenCalled();
  });

  test('throws backend error on 500', async () => {
    mockKeyInStorage();
    global.fetch.mockResolvedValueOnce(
      mockResponse({
        ok: false,
        status: 500,
        body: { error: 'AI gateway timeout' }
      })
    );

    await expect(AuthService.sendAIRequest(requestParams))
      .rejects.toThrow('Backend error: AI gateway timeout');
  });

  test('throws unavailable error on 503', async () => {
    mockKeyInStorage();
    global.fetch.mockResolvedValueOnce(
      mockResponse({
        ok: false,
        status: 503,
        body: { error: 'Service unavailable' }
      })
    );

    await expect(AuthService.sendAIRequest(requestParams))
      .rejects.toThrow('Backend is temporarily unavailable');
  });

  test('throws timeout error on AbortError', async () => {
    mockKeyInStorage();
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    global.fetch.mockRejectedValueOnce(abortError);

    await expect(AuthService.sendAIRequest(requestParams))
      .rejects.toThrow('Request timed out');
  });

  test('throws network error on TypeError from fetch', async () => {
    mockKeyInStorage();
    const networkError = new TypeError('Failed to fetch');
    global.fetch.mockRejectedValueOnce(networkError);

    await expect(AuthService.sendAIRequest(requestParams))
      .rejects.toThrow('Network error: Cannot reach backend');
  });

  test('throws when no license key is stored', async () => {
    await expect(AuthService.sendAIRequest(requestParams))
      .rejects.toThrow('No license key. Please activate CaptureAI.');
  });

  test('handles non-JSON error response', async () => {
    mockKeyInStorage();
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      headers: { get: () => 'text/html' },
      json: async () => { throw new Error('not JSON'); },
      text: async () => '<html>Bad Gateway</html>'
    });

    await expect(AuthService.sendAIRequest(requestParams))
      .rejects.toThrow('AI request failed (HTTP 502)');
  });
});

// ---------------------------------------------------------------------------
// createCheckoutSession
// ---------------------------------------------------------------------------
describe('AuthService.createCheckoutSession', () => {
  test('returns checkout URL on success', async () => {
    const checkoutData = { url: 'https://checkout.stripe.com/session123' };
    global.fetch.mockResolvedValueOnce(mockResponse({ body: checkoutData }));

    const result = await AuthService.createCheckoutSession('user@test.com');

    expect(result).toEqual(checkoutData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/subscription/create-checkout'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'user@test.com' })
      })
    );
  });

  test('throws on error response', async () => {
    global.fetch.mockResolvedValueOnce(
      mockResponse({
        ok: false,
        status: 400,
        body: { error: 'Invalid email' }
      })
    );

    await expect(AuthService.createCheckoutSession('bad'))
      .rejects.toThrow('Invalid email');
  });
});

// ---------------------------------------------------------------------------
// getPortalUrl
// ---------------------------------------------------------------------------
describe('AuthService.getPortalUrl', () => {
  function mockKeyInStorage() {
    storageMock.local.get.mockImplementation((keys, callback) => {
      const data = { 'captureai-license-key': 'PRO-AAAA-BBBB-CCCC-DDDD' };
      const result = {};
      if (typeof keys === 'string') {
        result[keys] = data[keys] || undefined;
      }
      if (callback) { callback(result); return undefined; }
      return Promise.resolve(result);
    });
  }

  test('returns portal URL on success', async () => {
    mockKeyInStorage();
    const portalData = { url: 'https://billing.stripe.com/portal123' };
    global.fetch.mockResolvedValueOnce(mockResponse({ body: portalData }));

    const result = await AuthService.getPortalUrl();

    expect(result).toEqual(portalData);
  });

  test('throws when no license key is stored', async () => {
    await expect(AuthService.getPortalUrl())
      .rejects.toThrow('No license key found');
  });
});

// ---------------------------------------------------------------------------
// getPlans
// ---------------------------------------------------------------------------
describe('AuthService.getPlans', () => {
  test('returns plans on success', async () => {
    const plansData = { plans: [{ id: 'pro', price: 999 }] };
    global.fetch.mockResolvedValueOnce(mockResponse({ body: plansData }));

    const result = await AuthService.getPlans();

    expect(result).toEqual(plansData);
  });

  test('throws on failure', async () => {
    global.fetch.mockResolvedValueOnce(
      mockResponse({ ok: false, status: 500 })
    );

    await expect(AuthService.getPlans())
      .rejects.toThrow('Failed to fetch plans');
  });
});

// ---------------------------------------------------------------------------
// Cache management (getCachedUser / setCachedUser / clearCachedUser)
// ---------------------------------------------------------------------------
describe('AuthService cache management', () => {
  test('getCachedUser returns null when cache is empty', async () => {
    const cached = await AuthService.getCachedUser();

    expect(cached).toBeNull();
  });

  test('setCachedUser stores user with timestamp', async () => {
    const user = { email: 'test@test.com', tier: 'pro' };
    const before = Date.now();

    await AuthService.setCachedUser(user);

    expect(storageMock.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'captureai-user-cache': expect.objectContaining({
          email: 'test@test.com',
          tier: 'pro',
          userData: user,
          updatedAt: expect.any(Number)
        })
      })
    );

    // Verify timestamp is reasonable
    const call = storageMock.local.set.mock.calls[0][0];
    const timestamp = call['captureai-user-cache'].updatedAt;
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(Date.now());
  });

  test('clearCachedUser removes cache key', async () => {
    await AuthService.clearCachedUser();

    expect(storageMock.local.remove)
      .toHaveBeenCalledWith('captureai-user-cache');
  });
});

// ---------------------------------------------------------------------------
// getCachedOrFreshUser
// ---------------------------------------------------------------------------
describe('AuthService.getCachedOrFreshUser', () => {
  const fakeUser = { email: 'cached@test.com', tier: 'pro' };

  function mockCacheAge(ageMs) {
    storageMock.local.get.mockImplementation((keys, callback) => {
      const result = {
        'captureai-user-cache': {
          email: fakeUser.email,
          tier: fakeUser.tier,
          userData: fakeUser,
          updatedAt: Date.now() - ageMs
        }
      };
      if (callback) { callback(result); return undefined; }
      return Promise.resolve(result);
    });
  }

  test('returns fresh cache without refresh flag (age < 5 min)', async () => {
    mockCacheAge(60 * 1000); // 1 minute old

    const result = await AuthService.getCachedOrFreshUser();

    expect(result.user).toEqual(fakeUser);
    expect(result.fromCache).toBe(true);
    expect(result.needsRefresh).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('returns stale cache with refresh flag (5 min < age < 1 hr)', async () => {
    mockCacheAge(10 * 60 * 1000); // 10 minutes old

    const result = await AuthService.getCachedOrFreshUser();

    expect(result.user).toEqual(fakeUser);
    expect(result.fromCache).toBe(true);
    expect(result.needsRefresh).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('calls API when cache is expired (age > 1 hr)', async () => {
    // First call returns expired cache, second call is for getLicenseKey
    // in getCurrentUser, third for getBackendUrl
    const expiredAge = 2 * 60 * 60 * 1000; // 2 hours
    const storageData = {
      'captureai-user-cache': {
        email: fakeUser.email,
        tier: fakeUser.tier,
        userData: fakeUser,
        updatedAt: Date.now() - expiredAge
      },
      'captureai-license-key': 'PRO-AAAA-BBBB-CCCC-DDDD'
    };

    storageMock.local.get.mockImplementation((keys, callback) => {
      const result = {};
      if (typeof keys === 'string') {
        result[keys] = storageData[keys] || undefined;
      }
      if (callback) { callback(result); return undefined; }
      return Promise.resolve(result);
    });

    const freshUser = { email: 'fresh@test.com', tier: 'pro' };
    global.fetch.mockResolvedValueOnce(mockResponse({ body: freshUser }));

    const result = await AuthService.getCachedOrFreshUser();

    expect(result.user).toEqual(freshUser);
    expect(result.fromCache).toBe(false);
    expect(result.needsRefresh).toBe(false);
  });

  test('returns null user when no cache and API fails', async () => {
    // No cache, no license key => getCurrentUser throws
    const result = await AuthService.getCachedOrFreshUser();

    expect(result.user).toBeNull();
    expect(result.fromCache).toBe(false);
    expect(result.needsRefresh).toBe(false);
  });

  test('returns expired cache with allowStale option', async () => {
    mockCacheAge(2 * 60 * 60 * 1000); // 2 hours old

    const result = await AuthService.getCachedOrFreshUser({
      allowStale: true
    });

    expect(result.user).toEqual(fakeUser);
    expect(result.fromCache).toBe(true);
    expect(result.needsRefresh).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// refreshUserCache
// ---------------------------------------------------------------------------
describe('AuthService.refreshUserCache', () => {
  test('deduplicates concurrent refresh calls', async () => {
    const storageData = {
      'captureai-license-key': 'PRO-AAAA-BBBB-CCCC-DDDD'
    };
    storageMock.local.get.mockImplementation((keys, callback) => {
      const result = {};
      if (typeof keys === 'string') {
        result[keys] = storageData[keys] || undefined;
      }
      if (callback) { callback(result); return undefined; }
      return Promise.resolve(result);
    });

    const user = { email: 'test@test.com', tier: 'basic' };
    global.fetch.mockResolvedValue(mockResponse({ body: user }));

    // Fire two concurrent refreshes
    const [result1, result2] = await Promise.all([
      AuthService.refreshUserCache(),
      AuthService.refreshUserCache()
    ]);

    // Both should resolve to the same user (only one API call)
    expect(result1).toEqual(user);
    expect(result2).toEqual(user);
    // fetch called once for the single getCurrentUser call
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('returns null when getCurrentUser fails', async () => {
    // No key in storage => getCurrentUser throws
    const result = await AuthService.refreshUserCache();

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isActivated
// ---------------------------------------------------------------------------
describe('AuthService.isActivated', () => {
  test('returns false when no license key exists', async () => {
    const result = await AuthService.isActivated();

    expect(result).toBe(false);
  });

  test('returns true when cache is fresh and key exists', async () => {
    const storageData = {
      'captureai-license-key': 'PRO-AAAA-BBBB-CCCC-DDDD',
      'captureai-user-cache': {
        email: 'user@test.com',
        tier: 'pro',
        updatedAt: Date.now() - 60 * 1000, // 1 minute ago
        userData: { email: 'user@test.com', tier: 'pro' }
      }
    };

    storageMock.local.get.mockImplementation((keys, callback) => {
      const result = {};
      if (typeof keys === 'string') {
        result[keys] = storageData[keys] || undefined;
      }
      if (callback) { callback(result); return undefined; }
      return Promise.resolve(result);
    });

    const result = await AuthService.isActivated();

    expect(result).toBe(true);
    // Should not have called fetch since cache was valid
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('falls back to API when cache is expired', async () => {
    const storageData = {
      'captureai-license-key': 'PRO-AAAA-BBBB-CCCC-DDDD',
      'captureai-user-cache': {
        email: 'user@test.com',
        tier: 'pro',
        updatedAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        userData: { email: 'user@test.com', tier: 'pro' }
      }
    };

    storageMock.local.get.mockImplementation((keys, callback) => {
      const result = {};
      if (typeof keys === 'string') {
        result[keys] = storageData[keys] || undefined;
      }
      if (callback) { callback(result); return undefined; }
      return Promise.resolve(result);
    });

    const user = { email: 'user@test.com', tier: 'pro' };
    global.fetch.mockResolvedValueOnce(mockResponse({ body: user }));

    const result = await AuthService.isActivated();

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });

  test('returns false when API call fails and cache is expired', async () => {
    const storageData = {
      'captureai-license-key': 'EXPIRED-KEY-1111-2222-3333',
      'captureai-user-cache': {
        email: 'user@test.com',
        tier: 'pro',
        updatedAt: Date.now() - 2 * 60 * 60 * 1000,
        userData: { email: 'user@test.com', tier: 'pro' }
      }
    };

    storageMock.local.get.mockImplementation((keys, callback) => {
      const result = {};
      if (typeof keys === 'string') {
        result[keys] = storageData[keys] || undefined;
      }
      if (callback) { callback(result); return undefined; }
      return Promise.resolve(result);
    });

    global.fetch.mockResolvedValueOnce(
      mockResponse({ ok: false, status: 401 })
    );

    const result = await AuthService.isActivated();

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// requestFreeKey
// ---------------------------------------------------------------------------
describe('AuthService.requestFreeKey', () => {
  test('validates and returns key when backend returns it', async () => {
    const freeKey = 'FREE-AAAA-BBBB-CCCC-DDDD';
    const fakeUser = { email: 'new@test.com', tier: 'basic' };

    // First fetch: create-free-key
    global.fetch.mockResolvedValueOnce(
      mockResponse({ body: { licenseKey: freeKey } })
    );
    // Second fetch: validateKey calls validate-key endpoint
    global.fetch.mockResolvedValueOnce(
      mockResponse({ body: { user: fakeUser } })
    );

    const result = await AuthService.requestFreeKey('new@test.com');

    expect(result).toBe(freeKey);
    // Verify validateKey was called (second fetch)
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('returns null when key is emailed instead', async () => {
    global.fetch.mockResolvedValueOnce(
      mockResponse({ body: { message: 'Key sent to email' } })
    );

    const result = await AuthService.requestFreeKey('new@test.com');

    expect(result).toBeNull();
  });

  test('throws on error response', async () => {
    global.fetch.mockResolvedValueOnce(
      mockResponse({
        ok: false,
        status: 400,
        body: { error: 'Email already has a key' }
      })
    );

    await expect(AuthService.requestFreeKey('existing@test.com'))
      .rejects.toThrow('Email already has a key');
  });

  test('sends undefined email when not provided', async () => {
    global.fetch.mockResolvedValueOnce(
      mockResponse({ body: { message: 'Key sent' } })
    );

    await AuthService.requestFreeKey();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/create-free-key'),
      expect.objectContaining({
        body: JSON.stringify({ email: undefined })
      })
    );
  });
});

// ---------------------------------------------------------------------------
// fetchWithTimeout
// ---------------------------------------------------------------------------
describe('AuthService.fetchWithTimeout', () => {
  test('returns response on successful fetch', async () => {
    const expected = mockResponse({ body: { ok: true } });
    global.fetch.mockResolvedValueOnce(expected);

    const response = await AuthService.fetchWithTimeout(
      'https://api.test.dev/endpoint'
    );

    expect(response).toBe(expected);
  });

  test('passes signal to fetch for abort support', async () => {
    global.fetch.mockResolvedValueOnce(mockResponse());

    await AuthService.fetchWithTimeout(
      'https://api.test.dev/endpoint',
      { method: 'GET' },
      5000
    );

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test.dev/endpoint',
      expect.objectContaining({
        method: 'GET',
        signal: expect.any(Object)
      })
    );
  });
});
