/**
 * Unit Tests for Router Module
 * Tests request routing to correct handlers
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock handlers
const mockAuth = {
  validateKey: jest.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'validated' }))),
  getCurrentUser: jest.fn().mockResolvedValue(new Response(JSON.stringify({ id: '123' })))
};

const mockAI = {
  solve: jest.fn().mockResolvedValue(new Response(JSON.stringify({ answer: 'test' }))),
  complete: jest.fn().mockResolvedValue(new Response(JSON.stringify({ answer: 'test' }))),
  getUsage: jest.fn().mockResolvedValue(new Response(JSON.stringify({ used: 0 }))),
  getModels: jest.fn().mockResolvedValue(new Response(JSON.stringify({ models: [] }))),
  getAnalytics: jest.fn().mockResolvedValue(new Response(JSON.stringify({ analytics: {} })))
};

const mockSubscription = {
  createCheckout: jest.fn().mockResolvedValue(new Response(JSON.stringify({ url: 'https://checkout.stripe.com' }))),
  handleWebhook: jest.fn().mockResolvedValue(new Response(JSON.stringify({ received: true }))),
  getPortal: jest.fn().mockResolvedValue(new Response(JSON.stringify({ url: 'https://portal.stripe.com' }))),
  getPlans: jest.fn().mockResolvedValue(new Response(JSON.stringify({ plans: [] }))),
  verifyPayment: jest.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }))),
  swapPlan: jest.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, tier: 'pro' })))
};

jest.mock('../../src/auth.js', () => ({
  AuthHandler: jest.fn().mockImplementation(() => mockAuth)
}));

jest.mock('../../src/ai.js', () => ({
  AIHandler: jest.fn().mockImplementation(() => mockAI)
}));

jest.mock('../../src/subscription.js', () => ({
  SubscriptionHandler: jest.fn().mockImplementation(() => mockSubscription)
}));

// Mock ratelimit to allow by default; individual tests override as needed
const mockCheckRateLimit = jest.fn().mockResolvedValue({ allowed: true, count: 0 });
const mockGetClientIdentifier = jest.fn().mockReturnValue('127.0.0.1');
jest.mock('../../src/ratelimit.js', () => ({
  checkRateLimit: (...args) => mockCheckRateLimit(...args),
  getClientIdentifier: (...args) => mockGetClientIdentifier(...args),
  RateLimitPresets: {
    GLOBAL: { limit: 100, windowMs: 60000, bindingName: 'RATE_LIMITER_GLOBAL' }
  }
}));

import { Router } from '../../src/router.js';

function createRequest(url, method = 'GET') {
  return {
    url: `https://api.captureai.dev${url}`,
    method,
    headers: new Map()
  };
}

async function getBody(response) {
  return JSON.parse(await response.text());
}

describe('Router', () => {
  let router;
  let mockEnv;

  beforeEach(() => {
    mockEnv = {
      DB: {},
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_WEBHOOK_SECRET: 'whsec_123'
    };
    router = new Router(mockEnv);
    // Replace handler instances with our mocks
    router.auth = mockAuth;
    router.ai = mockAI;
    router.subscription = mockSubscription;
    // Reset rate limit mock to allow by default
    mockCheckRateLimit.mockResolvedValue({ allowed: true, count: 0 });
  });

  describe('constructor', () => {
    test('should initialize with env', () => {
      expect(router.env).toBe(mockEnv);
    });

    test('should pass logger to constructor', () => {
      const mockLogger = { info: jest.fn() };
      const r = new Router(mockEnv, mockLogger);
      expect(r.logger).toBe(mockLogger);
    });
  });

  describe('Global rate limiting', () => {
    test('should return 429 when global rate limit is exceeded', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please slow down.',
        retryAfter: 60
      });

      const request = createRequest('/health');
      const response = await router.route(request);

      expect(response.status).toBe(429);
      const body = await getBody(response);
      expect(body.error).toBe('Rate limit exceeded');
      expect(response.headers.get('Retry-After')).toBe('60');
    });

    test('should include X-RateLimit-* headers when metadata is present', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please slow down.',
        retryAfter: 30,
        limit: 60,
        remaining: 0,
        reset: 1700000030
      });

      const request = createRequest('/health');
      const response = await router.route(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('30');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('X-RateLimit-Reset')).toBe('1700000030');
    });

    test('should omit Retry-After header when retryAfter is null', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please slow down.',
        retryAfter: null
      });

      const request = createRequest('/health');
      const response = await router.route(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBeNull();
    });

    test('should apply global rate limit before routing', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please slow down.',
        retryAfter: 60
      });

      const request = createRequest('/api/auth/validate-key', 'POST');
      const response = await router.route(request);

      // Should be blocked before reaching the auth handler
      expect(response.status).toBe(429);
      expect(mockAuth.validateKey).not.toHaveBeenCalled();
    });

    test('should pass through when global rate limit allows request', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ allowed: true, count: 1 });

      const request = createRequest('/health');
      const response = await router.route(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Health check routes', () => {
    test('GET / should return running status', async () => {
      const request = createRequest('/');
      const response = await router.route(request);
      const body = await getBody(response);

      expect(body.status).toContain('CaptureAI');
      expect(body.version).toBe('1.0.0');
      expect(body.timestamp).toBeDefined();
    });

    test('GET /health should return ok', async () => {
      const request = createRequest('/health');
      const response = await router.route(request);
      const body = await getBody(response);

      expect(body.status).toBe('ok');
      expect(body.service).toBe('CaptureAI Workers Backend');
      expect(body.version).toBe('1.0.0');
    });

    test('POST / should return 404', async () => {
      const request = createRequest('/', 'POST');
      const response = await router.route(request);
      expect(response.status).toBe(404);
    });
  });

  describe('Auth routes', () => {
    test('POST /api/auth/create-free-key returns 404 (route removed)', async () => {
      const request = createRequest('/api/auth/create-free-key', 'POST');
      const response = await router.route(request);
      expect(response.status).toBe(404);
    });

    test('POST /api/auth/validate-key routes to auth.validateKey', async () => {
      const request = createRequest('/api/auth/validate-key', 'POST');
      await router.route(request);
      expect(mockAuth.validateKey).toHaveBeenCalledWith(request);
    });

    test('GET /api/auth/me routes to auth.getCurrentUser', async () => {
      const request = createRequest('/api/auth/me');
      await router.route(request);
      expect(mockAuth.getCurrentUser).toHaveBeenCalledWith(request);
    });


    test('POST /api/auth/me returns 404 (wrong method)', async () => {
      const request = createRequest('/api/auth/me', 'POST');
      const response = await router.route(request);
      expect(response.status).toBe(404);
    });
  });

  describe('AI routes', () => {
    test('POST /api/ai/solve routes to ai.solve', async () => {
      const request = createRequest('/api/ai/solve', 'POST');
      await router.route(request);
      expect(mockAI.solve).toHaveBeenCalledWith(request);
    });

    test('POST /api/ai/complete routes to ai.complete', async () => {
      const request = createRequest('/api/ai/complete', 'POST');
      await router.route(request);
      expect(mockAI.complete).toHaveBeenCalledWith(request);
    });

    test('GET /api/ai/usage routes to ai.getUsage', async () => {
      const request = createRequest('/api/ai/usage');
      await router.route(request);
      expect(mockAI.getUsage).toHaveBeenCalledWith(request);
    });

    test('GET /api/ai/models routes to ai.getModels', async () => {
      const request = createRequest('/api/ai/models');
      await router.route(request);
      expect(mockAI.getModels).toHaveBeenCalledWith(request);
    });

    test('GET /api/ai/analytics routes to ai.getAnalytics', async () => {
      const request = createRequest('/api/ai/analytics');
      await router.route(request);
      expect(mockAI.getAnalytics).toHaveBeenCalledWith(request);
    });

    test('GET /api/ai/solve returns 404 (wrong method)', async () => {
      const request = createRequest('/api/ai/solve', 'GET');
      const response = await router.route(request);
      expect(response.status).toBe(404);
    });
  });

  describe('Subscription routes', () => {
    test('POST /api/subscription/create-checkout routes correctly', async () => {
      const request = createRequest('/api/subscription/create-checkout', 'POST');
      await router.route(request);
      expect(mockSubscription.createCheckout).toHaveBeenCalledWith(request);
    });

    test('POST /api/subscription/webhook routes correctly', async () => {
      const request = createRequest('/api/subscription/webhook', 'POST');
      await router.route(request);
      expect(mockSubscription.handleWebhook).toHaveBeenCalledWith(request);
    });

    test('GET /api/subscription/portal routes correctly', async () => {
      const request = createRequest('/api/subscription/portal');
      await router.route(request);
      expect(mockSubscription.getPortal).toHaveBeenCalledWith(request);
    });

    test('GET /api/subscription/plans routes correctly', async () => {
      const request = createRequest('/api/subscription/plans');
      await router.route(request);
      expect(mockSubscription.getPlans).toHaveBeenCalledWith(request);
    });

    test('POST /api/subscription/verify-payment routes correctly', async () => {
      const request = createRequest('/api/subscription/verify-payment', 'POST');
      await router.route(request);
      expect(mockSubscription.verifyPayment).toHaveBeenCalledWith(request);
    });

    test('POST /api/subscription/swap-plan routes correctly', async () => {
      const request = createRequest('/api/subscription/swap-plan', 'POST');
      await router.route(request);
      expect(mockSubscription.swapPlan).toHaveBeenCalledWith(request);
    });
  });

  describe('404 handling', () => {
    test('should return 404 for unknown paths', async () => {
      const request = createRequest('/api/unknown');
      const response = await router.route(request);
      expect(response.status).toBe(404);

      const body = await getBody(response);
      expect(body.error).toBe('Route not found');
    });

    test('should not leak path info in 404', async () => {
      const request = createRequest('/api/secret/admin/panel');
      const response = await router.route(request);
      const body = await getBody(response);

      expect(body.error).toBe('Route not found');
      expect(JSON.stringify(body)).not.toContain('secret');
    });

    test('should return 404 for paths with extra segments', async () => {
      const request = createRequest('/api/auth/create-free-key/extra', 'POST');
      const response = await router.route(request);
      expect(response.status).toBe(404);
    });
  });
});
