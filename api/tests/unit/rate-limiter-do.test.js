/**
 * Unit Tests for RateLimiterDO Durable Object
 * Tests distributed rate limiting via Cloudflare Durable Objects
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { RateLimiterDO } from '../../src/durable-objects/RateLimiter.js';

function createMockState() {
  const storage = new Map();
  return {
    storage: {
      get: async (key) => storage.get(key) || null,
      put: async (key, value) => storage.set(key, value),
      delete: async (key) => storage.delete(key),
      list: async () => storage,
      setAlarm: async () => {}
    },
    _storage: storage
  };
}

function createRequest(url, body) {
  return {
    url,
    method: 'POST',
    json: async () => body
  };
}

describe('RateLimiterDO', () => {
  let state;
  let rateLimiter;

  beforeEach(() => {
    state = createMockState();
    rateLimiter = new RateLimiterDO(state, {});
  });

  describe('constructor', () => {
    test('should initialize with state and env', () => {
      expect(rateLimiter.state).toBe(state);
      expect(rateLimiter.env).toEqual({});
      expect(rateLimiter.requests).toBeInstanceOf(Map);
    });
  });

  describe('fetch routing', () => {
    test('should route /check to checkRateLimit', async () => {
      const request = createRequest('https://rate-limiter/check', {
        key: 'test-key',
        limit: 10,
        windowMs: 60000
      });

      const response = await rateLimiter.fetch(request);
      expect(response.status).toBe(200);

      const data = JSON.parse(await response.text());
      expect(data.allowed).toBe(true);
    });

    test('should route /reset to resetRateLimit', async () => {
      const request = createRequest('https://rate-limiter/reset', {
        key: 'test-key'
      });

      const response = await rateLimiter.fetch(request);
      expect(response.status).toBe(200);

      const data = JSON.parse(await response.text());
      expect(data.success).toBe(true);
    });

    test('should return 404 for unknown paths', async () => {
      const request = createRequest('https://rate-limiter/unknown', {});
      const response = await rateLimiter.fetch(request);
      expect(response.status).toBe(404);
    });
  });

  describe('checkRateLimit', () => {
    test('should allow first request and set count to 1', async () => {
      const request = createRequest('https://rate-limiter/check', {
        key: 'user:123',
        limit: 10,
        windowMs: 60000
      });

      const response = await rateLimiter.fetch(request);
      const data = JSON.parse(await response.text());

      expect(data.allowed).toBe(true);
      expect(data.count).toBe(1);
      expect(data.remaining).toBe(9);
      expect(data.resetAt).toBeDefined();
    });

    test('should increment count on subsequent requests', async () => {
      const makeRequest = () => createRequest('https://rate-limiter/check', {
        key: 'user:456',
        limit: 10,
        windowMs: 60000
      });

      // First request
      await rateLimiter.fetch(makeRequest());

      // Second request
      const response = await rateLimiter.fetch(makeRequest());
      const data = JSON.parse(await response.text());

      expect(data.allowed).toBe(true);
      expect(data.count).toBe(2);
      expect(data.remaining).toBe(8);
    });

    test('should block when limit is reached', async () => {
      const makeRequest = () => createRequest('https://rate-limiter/check', {
        key: 'user:789',
        limit: 3,
        windowMs: 60000
      });

      // Use up all 3 requests
      await rateLimiter.fetch(makeRequest());
      await rateLimiter.fetch(makeRequest());
      await rateLimiter.fetch(makeRequest());

      // 4th request should be blocked
      const response = await rateLimiter.fetch(makeRequest());
      const data = JSON.parse(await response.text());

      expect(data.allowed).toBe(false);
      expect(data.count).toBe(3);
      expect(data.remaining).toBe(0);
    });

    test('should reset after window expires', async () => {
      const now = Date.now();
      // Pre-seed storage with expired record
      await state.storage.put('expired-key', {
        count: 5,
        resetAt: now - 1000 // Expired 1 second ago
      });

      const request = createRequest('https://rate-limiter/check', {
        key: 'expired-key',
        limit: 10,
        windowMs: 60000
      });

      const response = await rateLimiter.fetch(request);
      const data = JSON.parse(await response.text());

      expect(data.allowed).toBe(true);
      expect(data.count).toBe(1); // Reset to 1
      expect(data.remaining).toBe(9);
    });

    test('should track different keys independently', async () => {
      const requestA = createRequest('https://rate-limiter/check', {
        key: 'user-a',
        limit: 2,
        windowMs: 60000
      });
      const requestB = createRequest('https://rate-limiter/check', {
        key: 'user-b',
        limit: 2,
        windowMs: 60000
      });

      // Use up user-a's limit
      await rateLimiter.fetch(requestA);
      await rateLimiter.fetch(requestA);

      // user-a should be blocked
      const responseA = await rateLimiter.fetch(requestA);
      const dataA = JSON.parse(await responseA.text());
      expect(dataA.allowed).toBe(false);

      // user-b should still be allowed
      const responseB = await rateLimiter.fetch(requestB);
      const dataB = JSON.parse(await responseB.text());
      expect(dataB.allowed).toBe(true);
      expect(dataB.count).toBe(1);
    });

    test('should return 400 when missing key parameter', async () => {
      const request = createRequest('https://rate-limiter/check', {
        limit: 10,
        windowMs: 60000
      });

      const response = await rateLimiter.fetch(request);
      expect(response.status).toBe(400);

      const data = JSON.parse(await response.text());
      expect(data.error).toBe('Missing required parameters');
    });

    test('should return 400 when missing limit parameter', async () => {
      const request = createRequest('https://rate-limiter/check', {
        key: 'test',
        windowMs: 60000
      });

      const response = await rateLimiter.fetch(request);
      expect(response.status).toBe(400);
    });

    test('should return 400 when missing windowMs parameter', async () => {
      const request = createRequest('https://rate-limiter/check', {
        key: 'test',
        limit: 10
      });

      const response = await rateLimiter.fetch(request);
      expect(response.status).toBe(400);
    });

    test('should return 500 on internal error', async () => {
      // Make json() throw
      const request = {
        url: 'https://rate-limiter/check',
        method: 'POST',
        json: async () => { throw new Error('Parse error'); }
      };

      const response = await rateLimiter.fetch(request);
      expect(response.status).toBe(500);

      const data = JSON.parse(await response.text());
      expect(data.error).toBe('Internal error');
      expect(data.message).toBe('Parse error');
    });

    test('should allow exactly limit requests', async () => {
      const limit = 5;
      const makeRequest = () => createRequest('https://rate-limiter/check', {
        key: 'exact-limit',
        limit,
        windowMs: 60000
      });

      // Make exactly `limit` requests - all should be allowed
      for (let i = 0; i < limit; i++) {
        const response = await rateLimiter.fetch(makeRequest());
        const data = JSON.parse(await response.text());
        expect(data.allowed).toBe(true);
        expect(data.count).toBe(i + 1);
      }

      // limit+1 should be blocked
      const response = await rateLimiter.fetch(makeRequest());
      const data = JSON.parse(await response.text());
      expect(data.allowed).toBe(false);
    });
  });

  describe('resetRateLimit', () => {
    test('should reset a key', async () => {
      // First add some requests
      const checkRequest = createRequest('https://rate-limiter/check', {
        key: 'reset-test',
        limit: 10,
        windowMs: 60000
      });
      await rateLimiter.fetch(checkRequest);
      await rateLimiter.fetch(checkRequest);

      // Reset
      const resetRequest = createRequest('https://rate-limiter/reset', {
        key: 'reset-test'
      });
      const resetResponse = await rateLimiter.fetch(resetRequest);
      const resetData = JSON.parse(await resetResponse.text());
      expect(resetData.success).toBe(true);

      // Verify reset - next check should show count=1
      const response = await rateLimiter.fetch(checkRequest);
      const data = JSON.parse(await response.text());
      expect(data.count).toBe(1);
    });

    test('should return 400 when missing key', async () => {
      const request = createRequest('https://rate-limiter/reset', {});

      const response = await rateLimiter.fetch(request);
      expect(response.status).toBe(400);

      const data = JSON.parse(await response.text());
      expect(data.error).toBe('Missing key parameter');
    });

    test('should return 500 on error', async () => {
      const request = {
        url: 'https://rate-limiter/reset',
        method: 'POST',
        json: async () => { throw new Error('Parse error'); }
      };

      const response = await rateLimiter.fetch(request);
      expect(response.status).toBe(500);
    });

    test('should handle resetting non-existent key gracefully', async () => {
      const request = createRequest('https://rate-limiter/reset', {
        key: 'nonexistent'
      });

      const response = await rateLimiter.fetch(request);
      expect(response.status).toBe(200);
      const data = JSON.parse(await response.text());
      expect(data.success).toBe(true);
    });
  });

  describe('alarm', () => {
    test('should clean up expired entries', async () => {
      const now = Date.now();

      // Add expired entry (expired more than 1 hour ago)
      await state.storage.put('old-key', {
        count: 5,
        resetAt: now - 7200000 // 2 hours ago
      });

      // Add recent entry (not yet eligible for cleanup)
      await state.storage.put('recent-key', {
        count: 3,
        resetAt: now - 1000 // 1 second ago (within 1 hour grace)
      });

      await rateLimiter.alarm();

      // Old key should be deleted
      const oldRecord = await state.storage.get('old-key');
      expect(oldRecord).toBeNull();

      // Recent key should remain
      const recentRecord = await state.storage.get('recent-key');
      expect(recentRecord).not.toBeNull();
      expect(recentRecord.count).toBe(3);
    });

    test('should keep entries within grace period', async () => {
      const now = Date.now();

      // Entry expired 30 minutes ago (within 1 hour grace)
      await state.storage.put('grace-key', {
        count: 2,
        resetAt: now - 1800000
      });

      await rateLimiter.alarm();

      const record = await state.storage.get('grace-key');
      expect(record).not.toBeNull();
    });
  });
});
