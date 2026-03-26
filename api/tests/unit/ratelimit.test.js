/**
 * Unit Tests for Rate Limiting Module
 *
 * Comprehensive tests for checkRateLimit, getClientIdentifier,
 * and RateLimitPresets used by the CaptureAI API backend.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimitPresets
} from '../../src/ratelimit.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a mock env using the native Cloudflare Rate Limiting API.
 * The binding exposes a .limit() method that returns { success }.
 * @param {boolean} success - Whether the rate limit check succeeds
 * @param {string} bindingName - The binding name to create (default: 'RATE_LIMITER_GLOBAL')
 * @param {object} extra - Extra fields to include in the limit() response (e.g. reset, limit, remaining)
 */
function createMockNativeEnv(success, bindingName = 'RATE_LIMITER_GLOBAL', extra = {}) {
  return {
    [bindingName]: {
      limit: jest.fn().mockResolvedValue({ success, ...extra })
    }
  };
}

/**
 * Create a mock env whose native limit() rejects with an error.
 */
function createFailingNativeEnv(error, bindingName = 'RATE_LIMITER_GLOBAL') {
  return {
    [bindingName]: {
      limit: jest.fn().mockRejectedValue(error)
    }
  };
}

/**
 * Create a Request object with specific headers for getClientIdentifier tests.
 */
function mockRequestWithHeaders(headers = {}) {
  return new Request('https://api.captureai.dev/', {
    headers
  });
}

// ---------------------------------------------------------------------------
// checkRateLimit - Native Cloudflare Rate Limiting API path
// ---------------------------------------------------------------------------

describe('checkRateLimit with native Cloudflare Rate Limiting API', () => {
  test('should return allowed when native binding succeeds', async () => {
    const env = createMockNativeEnv(true);
    const result = await checkRateLimit('192.168.1.1', 10, 60000, env, 'RATE_LIMITER_GLOBAL');

    expect(result.allowed).toBe(true);
  });

  test('should call binding.limit with the identifier as key', async () => {
    const env = createMockNativeEnv(true);
    await checkRateLimit('user-123', 10, 60000, env, 'RATE_LIMITER_GLOBAL');

    expect(env.RATE_LIMITER_GLOBAL.limit).toHaveBeenCalledWith({ key: 'user-123' });
  });

  test('should use the specified bindingName from env', async () => {
    const env = createMockNativeEnv(true, 'RATE_LIMITER_LICENSE');
    const result = await checkRateLimit('192.168.1.1', 10, 60000, env, 'RATE_LIMITER_LICENSE');

    expect(env.RATE_LIMITER_LICENSE.limit).toHaveBeenCalledWith({ key: '192.168.1.1' });
    expect(result.allowed).toBe(true);
  });

  test('should return rate limit error when native binding returns success: false', async () => {
    const env = createMockNativeEnv(false);
    const result = await checkRateLimit('192.168.1.1', 10, 60000, env, 'RATE_LIMITER_GLOBAL');

    expect(result.error).toBe('Rate limit exceeded');
    expect(result.message).toMatch(/Too many requests/);
  });

  test('should return retryAfter null when native binding does not provide reset', async () => {
    const env = createMockNativeEnv(false);
    const result = await checkRateLimit('192.168.1.1', 10, 60000, env, 'RATE_LIMITER_GLOBAL');

    // Native binding returned no reset field, so retryAfter should be null
    expect(result.retryAfter).toBeNull();
  });

  test('should calculate retryAfter from reset timestamp when provided', async () => {
    const resetTs = Date.now() + 30000; // 30 seconds from now
    const env = createMockNativeEnv(false, 'RATE_LIMITER_GLOBAL', { reset: resetTs });
    const result = await checkRateLimit('192.168.1.1', 10, 60000, env, 'RATE_LIMITER_GLOBAL');

    expect(result.retryAfter).toBeGreaterThan(0);
    expect(result.retryAfter).toBeLessThanOrEqual(30);
  });

  test('should calculate retryAfter from reset Date object when provided', async () => {
    const resetDate = new Date(Date.now() + 30000);
    const env = createMockNativeEnv(false, 'RATE_LIMITER_GLOBAL', { reset: resetDate });
    const result = await checkRateLimit('192.168.1.1', 10, 60000, env, 'RATE_LIMITER_GLOBAL');

    expect(result.retryAfter).toBeGreaterThan(0);
    expect(result.retryAfter).toBeLessThanOrEqual(30);
  });

  test('should extract count, limit, remaining from native response when available', async () => {
    const env = createMockNativeEnv(true, 'RATE_LIMITER_GLOBAL', { limit: 60, remaining: 55 });
    const result = await checkRateLimit('192.168.1.1', 10, 60000, env, 'RATE_LIMITER_GLOBAL');

    expect(result.allowed).toBe(true);
    expect(result.count).toBe(5); // limit - remaining
    expect(result.limit).toBe(60);
    expect(result.remaining).toBe(55);
  });

  test('should return count: null when native response has no limit/remaining', async () => {
    const env = createMockNativeEnv(true);
    const result = await checkRateLimit('192.168.1.1', 10, 60000, env, 'RATE_LIMITER_GLOBAL');

    expect(result.allowed).toBe(true);
    expect(result.count).toBeNull();
  });

  test('should include resetAt as ISO string when reset is a Date object', async () => {
    const resetDate = new Date(Date.now() + 60000);
    const env = createMockNativeEnv(true, 'RATE_LIMITER_GLOBAL', { reset: resetDate });
    const result = await checkRateLimit('192.168.1.1', 10, 60000, env, 'RATE_LIMITER_GLOBAL');

    expect(result.resetAt).toBe(resetDate.toISOString());
  });

  test('should include resetAt as-is when reset is a number', async () => {
    const resetTs = Date.now() + 60000;
    const env = createMockNativeEnv(true, 'RATE_LIMITER_GLOBAL', { reset: resetTs });
    const result = await checkRateLimit('192.168.1.1', 10, 60000, env, 'RATE_LIMITER_GLOBAL');

    expect(result.resetAt).toBe(resetTs);
  });

  test('should fail open when native binding throws an error', async () => {
    const env = createFailingNativeEnv(new Error('Service unavailable'));
    const result = await checkRateLimit('192.168.1.1', 10, 60000, env, 'RATE_LIMITER_GLOBAL');

    expect(result.allowed).toBe(true);
    expect(result.count).toBeNull();
  });

  test('should fall back to in-memory when env is null', async () => {
    const result = await checkRateLimit('native-null-env', 10, 60000, null);

    expect(result.allowed).toBe(true);
  });

  test('should fall back to in-memory when bindingName is null', async () => {
    const env = { RATE_LIMITER_GLOBAL: { limit: jest.fn() } };
    const result = await checkRateLimit('native-null-binding', 10, 60000, env, null);

    expect(result.allowed).toBe(true);
  });

  test('should fall back to in-memory when binding is not found in env', async () => {
    const env = { OTHER_BINDING: {} };
    const result = await checkRateLimit('native-missing-binding', 10, 60000, env, 'RATE_LIMITER_GLOBAL');

    expect(result.allowed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// checkRateLimit - In-memory fallback
// ---------------------------------------------------------------------------

describe('checkRateLimit with in-memory fallback', () => {
  test('should allow first request', async () => {
    const result = await checkRateLimit('inmem-first-req', 5, 60000);

    expect(result.allowed).toBe(true);
    expect(result.count).toBe(1);
  });

  test('should allow requests within the limit', async () => {
    const key = 'inmem-within-limit';
    const limit = 5;

    for (let i = 0; i < limit; i++) {
      const result = await checkRateLimit(key, limit, 60000);
      expect(result.allowed).toBe(true);
      expect(result.count).toBe(i + 1);
    }
  });

  test('should block request that exceeds the limit', async () => {
    const key = 'inmem-exceed-limit';
    const limit = 3;

    // Use up all allowed requests
    for (let i = 0; i < limit; i++) {
      await checkRateLimit(key, limit, 60000);
    }

    // Next request should be blocked
    const result = await checkRateLimit(key, limit, 60000);

    expect(result.error).toBe('Rate limit exceeded');
    expect(result.message).toMatch(/Too many requests/);
    expect(result.retryAfter).toBeGreaterThan(0);
    expect(result.resetAt).toBeDefined();
  });

  test('should return correct error message format when rate limited', async () => {
    const key = 'inmem-error-format';
    const limit = 1;

    await checkRateLimit(key, limit, 60000);
    const result = await checkRateLimit(key, limit, 60000);

    expect(result.error).toBe('Rate limit exceeded');
    expect(result.message).toMatch(/^Too many requests\. Please try again in \d+ seconds\.$/);
    expect(typeof result.retryAfter).toBe('number');
    expect(typeof result.resetAt).toBe('string');
  });

  test('should return resetAt as ISO string when rate limited', async () => {
    const key = 'inmem-iso-resetat';
    const limit = 1;

    await checkRateLimit(key, limit, 60000);
    const result = await checkRateLimit(key, limit, 60000);

    // Verify resetAt is a valid ISO date string
    const parsed = new Date(result.resetAt);
    expect(parsed.toISOString()).toBe(result.resetAt);
  });

  test('should track different keys independently', async () => {
    const keyA = 'inmem-independent-a';
    const keyB = 'inmem-independent-b';
    const limit = 2;

    // Exhaust limit for key A
    await checkRateLimit(keyA, limit, 60000);
    await checkRateLimit(keyA, limit, 60000);

    // Key A should be blocked
    const resultA = await checkRateLimit(keyA, limit, 60000);
    expect(resultA.error).toBe('Rate limit exceeded');

    // Key B should still be allowed
    const resultB = await checkRateLimit(keyB, limit, 60000);
    expect(resultB.allowed).toBe(true);
    expect(resultB.count).toBe(1);
  });

  test('should reset count after window expires', async () => {
    const key = 'inmem-window-expire';
    const limit = 2;
    const windowMs = 100; // 100ms window for fast test

    // Use up the limit
    await checkRateLimit(key, limit, windowMs);
    await checkRateLimit(key, limit, windowMs);

    // Should be blocked
    const blocked = await checkRateLimit(key, limit, windowMs);
    expect(blocked.error).toBe('Rate limit exceeded');

    // Wait for the window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should be allowed again
    const result = await checkRateLimit(key, limit, windowMs);
    expect(result.allowed).toBe(true);
    expect(result.count).toBe(1);
  });

  test('should fall back to in-memory when env is null', async () => {
    const result = await checkRateLimit('inmem-null-env', 10, 60000, null);

    expect(result.allowed).toBe(true);
    expect(result.count).toBe(1);
  });

  test('should fall back to in-memory when env is empty object', async () => {
    const result = await checkRateLimit('inmem-empty-env', 10, 60000, {});

    expect(result.allowed).toBe(true);
    expect(result.count).toBe(1);
  });

  test('should fall back to in-memory when env has no matching binding', async () => {
    const env = { OTHER_BINDING: 'something' };
    const result = await checkRateLimit('inmem-no-binding', 10, 60000, env);

    expect(result.allowed).toBe(true);
    expect(result.count).toBe(1);
  });

  test('should increment count correctly across multiple requests', async () => {
    const key = 'inmem-count-increment';
    const limit = 5;

    const result1 = await checkRateLimit(key, limit, 60000);
    expect(result1.count).toBe(1);

    const result2 = await checkRateLimit(key, limit, 60000);
    expect(result2.count).toBe(2);

    const result3 = await checkRateLimit(key, limit, 60000);
    expect(result3.count).toBe(3);
  });

  test('should allow exactly limit number of requests', async () => {
    const key = 'inmem-exact-limit';
    const limit = 3;

    // Requests 1 through limit should all be allowed
    for (let i = 1; i <= limit; i++) {
      const result = await checkRateLimit(key, limit, 60000);
      expect(result.allowed).toBe(true);
      expect(result.count).toBe(i);
    }

    // Request limit+1 should be blocked
    const blocked = await checkRateLimit(key, limit, 60000);
    expect(blocked.error).toBe('Rate limit exceeded');
  });

  test('should use singleton in-memory limiter across calls', async () => {
    const keyX = 'inmem-singleton-x';
    const keyY = 'inmem-singleton-y';

    // Make requests with two different keys
    await checkRateLimit(keyX, 10, 60000);
    await checkRateLimit(keyY, 10, 60000);

    // Both should show state preserved (count increments)
    const resultX = await checkRateLimit(keyX, 10, 60000);
    expect(resultX.count).toBe(2);

    const resultY = await checkRateLimit(keyY, 10, 60000);
    expect(resultY.count).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getClientIdentifier
// ---------------------------------------------------------------------------

describe('getClientIdentifier', () => {
  test('should return CF-Connecting-IP when present', () => {
    const request = mockRequestWithHeaders({
      'CF-Connecting-IP': '203.0.113.50'
    });
    expect(getClientIdentifier(request)).toBe('203.0.113.50');
  });

  test('should return first IP from X-Forwarded-For when CF-Connecting-IP absent', () => {
    const request = mockRequestWithHeaders({
      'X-Forwarded-For': '10.0.0.1, 10.0.0.2, 10.0.0.3'
    });
    expect(getClientIdentifier(request)).toBe('10.0.0.1');
  });

  test('should trim whitespace from X-Forwarded-For first IP', () => {
    const request = mockRequestWithHeaders({
      'X-Forwarded-For': '  10.0.0.1 , 10.0.0.2'
    });
    expect(getClientIdentifier(request)).toBe('10.0.0.1');
  });

  test('should return single IP from X-Forwarded-For without commas', () => {
    const request = mockRequestWithHeaders({
      'X-Forwarded-For': '10.0.0.1'
    });
    expect(getClientIdentifier(request)).toBe('10.0.0.1');
  });

  test('should return X-Real-IP when CF-Connecting-IP and X-Forwarded-For absent', () => {
    const request = mockRequestWithHeaders({
      'X-Real-IP': '172.16.0.1'
    });
    expect(getClientIdentifier(request)).toBe('172.16.0.1');
  });

  test('should return unknown when no IP headers are present', () => {
    const request = mockRequestWithHeaders({});
    expect(getClientIdentifier(request)).toBe('unknown');
  });

  test('should return unknown when only unrelated headers are present', () => {
    const request = mockRequestWithHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token'
    });
    expect(getClientIdentifier(request)).toBe('unknown');
  });

  test('should prioritize CF-Connecting-IP over X-Forwarded-For', () => {
    const request = mockRequestWithHeaders({
      'CF-Connecting-IP': '1.1.1.1',
      'X-Forwarded-For': '2.2.2.2'
    });
    expect(getClientIdentifier(request)).toBe('1.1.1.1');
  });

  test('should prioritize CF-Connecting-IP over X-Real-IP', () => {
    const request = mockRequestWithHeaders({
      'CF-Connecting-IP': '1.1.1.1',
      'X-Real-IP': '3.3.3.3'
    });
    expect(getClientIdentifier(request)).toBe('1.1.1.1');
  });

  test('should prioritize X-Forwarded-For over X-Real-IP', () => {
    const request = mockRequestWithHeaders({
      'X-Forwarded-For': '2.2.2.2',
      'X-Real-IP': '3.3.3.3'
    });
    expect(getClientIdentifier(request)).toBe('2.2.2.2');
  });

  test('should prioritize CF-Connecting-IP when all three headers present', () => {
    const request = mockRequestWithHeaders({
      'CF-Connecting-IP': '1.1.1.1',
      'X-Forwarded-For': '2.2.2.2',
      'X-Real-IP': '3.3.3.3'
    });
    expect(getClientIdentifier(request)).toBe('1.1.1.1');
  });

  test('should handle IPv6 addresses', () => {
    const request = mockRequestWithHeaders({
      'CF-Connecting-IP': '2001:db8::1'
    });
    expect(getClientIdentifier(request)).toBe('2001:db8::1');
  });

  test('should handle IPv6 in X-Forwarded-For chain', () => {
    const request = mockRequestWithHeaders({
      'X-Forwarded-For': '2001:db8::1, 2001:db8::2'
    });
    expect(getClientIdentifier(request)).toBe('2001:db8::1');
  });
});

// ---------------------------------------------------------------------------
// RateLimitPresets
// ---------------------------------------------------------------------------

describe('RateLimitPresets', () => {
  test('should have AUTH preset with correct values', () => {
    expect(RateLimitPresets.AUTH).toMatchObject({
      limit: 5,
      windowMs: 60000,
      bindingName: 'RATE_LIMITER_AUTH'
    });
  });

  test('should have LICENSE_VALIDATION preset with correct values', () => {
    expect(RateLimitPresets.LICENSE_VALIDATION).toMatchObject({
      limit: 10,
      windowMs: 60000,
      bindingName: 'RATE_LIMITER_LICENSE'
    });
  });

  test('should have CHECKOUT preset with correct values', () => {
    expect(RateLimitPresets.CHECKOUT).toMatchObject({
      limit: 10,
      windowMs: 60000,
      bindingName: 'RATE_LIMITER_CHECKOUT'
    });
  });

  test('should have GLOBAL preset with correct values', () => {
    expect(RateLimitPresets.GLOBAL).toMatchObject({
      limit: 60,
      windowMs: 60000,
      bindingName: 'RATE_LIMITER_GLOBAL'
    });
  });

  test('should have PRO_AI preset with correct values', () => {
    expect(RateLimitPresets.PRO_AI).toMatchObject({
      limit: 20,
      windowMs: 60000,
      bindingName: 'RATE_LIMITER_AI_PRO'
    });
  });

  test('should have exactly 5 presets', () => {
    expect(Object.keys(RateLimitPresets)).toHaveLength(5);
  });

  test('should have limit, windowMs, and bindingName in every preset', () => {
    for (const [name, preset] of Object.entries(RateLimitPresets)) {
      expect(typeof preset.limit).toBe('number');
      expect(typeof preset.windowMs).toBe('number');
      expect(typeof preset.bindingName).toBe('string');
      expect(preset.limit).toBeGreaterThan(0);
      expect(preset.windowMs).toBeGreaterThan(0);
      expect(preset.bindingName.length).toBeGreaterThan(0);
    }
  });

  test('all presets should use a 60-second window (period must be 10 or 60 per Cloudflare docs)', () => {
    for (const [name, preset] of Object.entries(RateLimitPresets)) {
      expect(preset.windowMs).toBe(60 * 1000);
    }
  });

  test('each preset should have a unique bindingName', () => {
    const names = Object.values(RateLimitPresets).map(p => p.bindingName);
    expect(new Set(names).size).toBe(names.length);
  });
});

