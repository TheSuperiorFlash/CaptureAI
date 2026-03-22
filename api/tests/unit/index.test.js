/**
 * Unit Tests for Worker Entry Point (index.js)
 * Tests environment validation, CORS, security headers, and request handling
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// jest.mock factories run before variable declarations, so define mocks inline
jest.mock('../../src/router.js', () => ({
  Router: jest.fn().mockImplementation(() => ({
    route: jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    )
  }))
}));

jest.mock('../../src/logger.js', () => ({
  createRequestLogger: jest.fn().mockReturnValue({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    security: jest.fn()
  }),
  logCorsRejection: jest.fn()
}));

jest.mock('../../src/utils.js', () => ({
  handleCORS: jest.fn().mockReturnValue(
    new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    })
  )
}));

import indexModule from '../../src/index.js';
import { handleCORS } from '../../src/utils.js';
import { createRequestLogger } from '../../src/logger.js';

const worker = indexModule;

function createRequest(url, method = 'GET', headers = {}) {
  const headerMap = new Map(Object.entries(headers));
  return {
    url: `https://api.captureai.workers.dev${url}`,
    method,
    headers: {
      get: (key) => headerMap.get(key) || null,
      entries: () => headerMap.entries()
    }
  };
}

function createFullEnv(overrides = {}) {
  return {
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
    STRIPE_PRICE_BASIC_WEEKLY: 'price_basic_weekly',
    STRIPE_PRICE_BASIC_MONTHLY: 'price_basic_monthly',
    STRIPE_PRICE_PRO_WEEKLY: 'price_pro_weekly',
    STRIPE_PRICE_PRO_MONTHLY: 'price_pro_monthly',
    DB: {},
    ENVIRONMENT: 'development',
    ...overrides
  };
}

describe('Worker Entry Point', () => {
  let env;
  let ctx;

  beforeEach(() => {
    env = createFullEnv();
    ctx = {};
  });

  describe('validateEnvironment', () => {
    test('should pass with all required env vars', async () => {
      const request = createRequest('/health');
      const response = await worker.fetch(request, env, ctx);
      expect(response.status).toBe(200);
    });

    test('should return 500 when STRIPE_SECRET_KEY is missing', async () => {
      delete env.STRIPE_SECRET_KEY;
      const request = createRequest('/health');
      const response = await worker.fetch(request, env, ctx);
      expect(response.status).toBe(500);

      const body = JSON.parse(await response.text());
      expect(body.error).toBe('Server configuration error');
    });

    test('should return 500 when STRIPE_WEBHOOK_SECRET is missing', async () => {
      delete env.STRIPE_WEBHOOK_SECRET;
      const request = createRequest('/health');
      const response = await worker.fetch(request, env, ctx);
      expect(response.status).toBe(500);
    });

    test.each([
      'STRIPE_PRICE_BASIC_WEEKLY',
      'STRIPE_PRICE_BASIC_MONTHLY',
      'STRIPE_PRICE_PRO_WEEKLY',
      'STRIPE_PRICE_PRO_MONTHLY',
    ])('should return 500 when %s is missing', async (priceKey) => {
      delete env[priceKey];
      const request = createRequest('/health');
      const response = await worker.fetch(request, env, ctx);
      expect(response.status).toBe(500);
    });

    test('should pass when optional RESEND_API_KEY is missing', async () => {
      const request = createRequest('/health');
      const response = await worker.fetch(request, env, ctx);
      expect(response.status).toBe(200);
    });
  });

  describe('CORS preflight', () => {
    test('should handle OPTIONS requests', async () => {
      const request = createRequest('/api/auth/me', 'OPTIONS', {
        'Origin': 'https://captureai.dev'
      });
      await worker.fetch(request, env, ctx);
      expect(handleCORS).toHaveBeenCalled();
    });
  });

  describe('Request handling', () => {
    test('should create request logger', async () => {
      const request = createRequest('/health');
      await worker.fetch(request, env, ctx);
      expect(createRequestLogger).toHaveBeenCalledWith(env, request);
    });

    test('should route requests through Router', async () => {
      const request = createRequest('/health');
      const response = await worker.fetch(request, env, ctx);
      expect(response.status).toBe(200);
    });
  });

  describe('Security headers', () => {
    test('should add X-Content-Type-Options header', async () => {
      const request = createRequest('/health');
      const response = await worker.fetch(request, env, ctx);
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    test('should add X-Frame-Options header', async () => {
      const request = createRequest('/health');
      const response = await worker.fetch(request, env, ctx);
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    test('should add X-XSS-Protection header', async () => {
      const request = createRequest('/health');
      const response = await worker.fetch(request, env, ctx);
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    test('should add Strict-Transport-Security header', async () => {
      const request = createRequest('/health');
      const response = await worker.fetch(request, env, ctx);
      expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=');
    });

    test('should add Referrer-Policy header', async () => {
      const request = createRequest('/health');
      const response = await worker.fetch(request, env, ctx);
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    test('should add Permissions-Policy header', async () => {
      const request = createRequest('/health');
      const response = await worker.fetch(request, env, ctx);
      expect(response.headers.get('Permissions-Policy')).toContain('geolocation=()');
    });
  });

  describe('CORS headers on responses', () => {
    test('should add CORS headers for allowed origin', async () => {
      const request = createRequest('/health', 'GET', {
        'Origin': 'https://captureai.dev'
      });
      const response = await worker.fetch(request, env, ctx);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined();
    });

    test('should set null origin for disallowed origins', async () => {
      const request = createRequest('/health', 'GET', {
        'Origin': 'https://evil.com'
      });
      const response = await worker.fetch(request, env, ctx);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('null');
    });

    test('should allow captureai.dev origin', async () => {
      const request = createRequest('/health', 'GET', {
        'Origin': 'https://captureai.dev'
      });
      const response = await worker.fetch(request, env, ctx);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://captureai.dev');
    });

    test('should reject thesuperiorflash.github.io origin', async () => {
      const request = createRequest('/health', 'GET', {
        'Origin': 'https://thesuperiorflash.github.io'
      });
      const response = await worker.fetch(request, env, ctx);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('null');
    });

    test('should allow localhost in development mode', async () => {
      env.ENVIRONMENT = 'development';
      const request = createRequest('/health', 'GET', {
        'Origin': 'http://localhost:3000'
      });
      const response = await worker.fetch(request, env, ctx);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
    });

    test('should not allow localhost in production', async () => {
      env.ENVIRONMENT = 'production';
      const request = createRequest('/health', 'GET', {
        'Origin': 'http://localhost:3000'
      });
      const response = await worker.fetch(request, env, ctx);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('null');
    });

    test('should allow chrome extension with valid ID', async () => {
      env.CHROME_EXTENSION_IDS = 'abc123,def456';
      const request = createRequest('/health', 'GET', {
        'Origin': 'chrome-extension://abc123'
      });
      const response = await worker.fetch(request, env, ctx);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('chrome-extension://abc123');
    });

    test('should reject chrome extension with invalid ID', async () => {
      env.CHROME_EXTENSION_IDS = 'abc123,def456';
      const request = createRequest('/health', 'GET', {
        'Origin': 'chrome-extension://evil789'
      });
      const response = await worker.fetch(request, env, ctx);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('null');
    });

    test('should allow any chrome extension in dev mode without IDs', async () => {
      env.ENVIRONMENT = 'development';
      delete env.CHROME_EXTENSION_IDS;
      const request = createRequest('/health', 'GET', {
        'Origin': 'chrome-extension://anyid'
      });
      const response = await worker.fetch(request, env, ctx);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('chrome-extension://anyid');
    });
  });
});
