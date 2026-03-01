/**
 * Environment Factory for API Tests
 *
 * Creates mock Cloudflare Workers `env` objects with all required bindings.
 */

import { createMockD1 } from './mocks/d1-mock.js';
import { createMockDurableObjectNamespace } from './mocks/durable-objects-mock.js';

/**
 * Create a complete mock env object
 * @param {Object} overrides - Override specific env values
 * @returns {Object} Mock env matching wrangler.toml bindings
 */
export function createMockEnv(overrides = {}) {
  return {
    // D1 database binding
    DB: createMockD1(),

    // Durable Object binding
    RATE_LIMITER: createMockDurableObjectNamespace(),

    // Required secrets
    STRIPE_SECRET_KEY: 'sk_test_mock_key_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_mock_secret_456',
    STRIPE_PRICE_PRO: 'price_test_pro_789',

    // Optional secrets (email)
    RESEND_API_KEY: 're_test_mock_resend_key',
    FROM_EMAIL: 'test@captureai.dev',

    // Environment variables (from wrangler.toml)
    CLOUDFLARE_ACCOUNT_ID: 'mock-account-id',
    CLOUDFLARE_GATEWAY_NAME: 'captureai-gateway',
    FREE_TIER_DAILY_LIMIT: '10',
    PRO_TIER_RATE_LIMIT_PER_MINUTE: '60',
    EXTENSION_URL: 'https://captureai.dev',
    CHROME_EXTENSION_IDS: 'mock-ext-id-aaa,mock-ext-id-bbb',

    ...overrides
  };
}

/**
 * Create an env with minimal required config only
 * @param {Object} overrides - Override specific env values
 * @returns {Object} Minimal mock env
 */
export function createMinimalEnv(overrides = {}) {
  return {
    DB: createMockD1(),
    STRIPE_SECRET_KEY: 'sk_test_mock',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_mock',
    STRIPE_PRICE_PRO: 'price_test_mock',
    ...overrides
  };
}

/**
 * Create an env missing required secrets (for validation testing)
 * @param {string[]} missingKeys - Keys to omit
 * @returns {Object} Incomplete mock env
 */
export function createIncompleteEnv(missingKeys = []) {
  const env = createMockEnv();
  for (const key of missingKeys) {
    delete env[key];
  }
  return env;
}
