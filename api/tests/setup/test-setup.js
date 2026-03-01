/**
 * Global Test Setup for CaptureAI API
 *
 * Sets up the Node.js environment to simulate Cloudflare Workers runtime.
 */

import { setupCryptoMock } from './mocks/crypto-mock.js';

// Set up Web Crypto API (used by auth, webhooks, JWT)
setupCryptoMock();

// Mock global fetch for external API calls (Stripe, Resend, AI Gateway)
global.fetch = jest.fn(async () => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
