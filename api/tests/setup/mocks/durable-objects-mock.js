/**
 * Mock Cloudflare Durable Objects for Rate Limiting
 *
 * Mocks the RATE_LIMITER Durable Object namespace and stub.
 */

/**
 * Create a mock Durable Object namespace
 * @param {Object} options - Configuration options
 * @param {boolean} options.allowed - Whether rate limit check allows (default: true)
 * @param {number} options.count - Current count to return (default: 1)
 * @returns {Object} Mock Durable Object namespace
 */
export function createMockDurableObjectNamespace(options = {}) {
  const { allowed = true, count = 1 } = options;

  const stubResponse = {
    allowed,
    count,
    remaining: allowed ? 59 : 0,
    resetAt: Date.now() + 60000
  };

  const stub = {
    fetch: jest.fn(async () => {
      return new Response(JSON.stringify(stubResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    })
  };

  const namespace = {
    idFromName: jest.fn((name) => ({ name })),
    get: jest.fn(() => stub),
    _stub: stub,
    _setResponse(response) {
      stubResponse.allowed = response.allowed ?? stubResponse.allowed;
      stubResponse.count = response.count ?? stubResponse.count;
      stubResponse.remaining = response.remaining ?? stubResponse.remaining;
    }
  };

  return namespace;
}

/**
 * Create a mock Durable Object state (for testing RateLimiterDO class)
 * @returns {Object} Mock state with storage
 */
export function createMockDurableObjectState() {
  const storage = new Map();

  return {
    storage: {
      get: jest.fn(async (key) => storage.get(key)),
      put: jest.fn(async (key, value) => storage.set(key, value)),
      delete: jest.fn(async (key) => storage.delete(key)),
      list: jest.fn(async () => storage),
      _data: storage
    },
    blockConcurrencyWhile: jest.fn(async (fn) => fn()),
    id: { toString: () => 'mock-do-id' }
  };
}
