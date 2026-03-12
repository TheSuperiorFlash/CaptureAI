/**
 * Unit Tests for Subscription Handler
 * Tests Stripe checkout, webhooks, payment verification, and subscription management
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../src/auth.js', () => ({
  AuthHandler: jest.fn().mockImplementation(() => ({
    authenticate: jest.fn().mockResolvedValue({
      userId: 'user-1',
      email: 'test@example.com',
      tier: 'pro',
      licenseKey: 'ABCD-EFGH-IJKL-MNOP-QRST',
      subscriptionStatus: 'active'
    }),
    generateLicenseKey: jest.fn().mockReturnValue('NEWK-EYGE-NERA-TEDH-ERE1'),
    sendLicenseKeyEmail: jest.fn().mockResolvedValue(true)
  }))
}));

jest.mock('../../src/validation.js', () => ({
  validateRequestBody: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
  validateEmail: jest.fn().mockImplementation((email) => email.toLowerCase().trim()),
  validateStripeSignature: jest.fn().mockReturnValue({
    t: String(Math.floor(Date.now() / 1000)),
    v1: 'valid-sig'
  }),
  ValidationError: class ValidationError extends Error {
    constructor(message, field) {
      super(message);
      this.field = field;
      this.name = 'ValidationError';
    }
  }
}));

jest.mock('../../src/ratelimit.js', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, count: 1 }),
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
  RateLimitPresets: {
    AUTH: { limit: 5, windowMs: 60000 },
    FREE_KEY_CREATION: { limit: 3, windowMs: 3600000 },
    LICENSE_VALIDATION: { limit: 10, windowMs: 60000 },
    CHECKOUT: { limit: 5, windowMs: 3600000 }
  }
}));

jest.mock('../../src/logger.js', () => ({
  logSubscription: jest.fn(),
  logWebhook: jest.fn(),
  logValidationError: jest.fn()
}));

import { SubscriptionHandler } from '../../src/subscription.js';
import { checkRateLimit } from '../../src/ratelimit.js';
import { validateRequestBody, validateStripeSignature } from '../../src/validation.js';

function createMockDB() {
  const mockFirst = jest.fn().mockResolvedValue(null);
  const mockRun = jest.fn().mockResolvedValue({ success: true });
  return {
    prepare: jest.fn().mockReturnValue({
      bind: jest.fn().mockReturnValue({
        first: mockFirst,
        run: mockRun,
        all: jest.fn().mockResolvedValue({ results: [] })
      })
    }),
    _mockFirst: mockFirst,
    _mockRun: mockRun
  };
}

function createMockEnv(overrides = {}) {
  return {
    DB: createMockDB(),
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
    STRIPE_PRICE_PRO: 'price_pro_123',
    RESEND_API_KEY: 'resend_key_123',
    EXTENSION_URL: 'https://captureai.dev',
    BASIC_TIER_DAILY_LIMIT: '50',
    RATE_LIMITER: {
      idFromName: jest.fn().mockReturnValue('mock-id'),
      get: jest.fn().mockReturnValue({
        fetch: jest.fn().mockResolvedValue({
          json: jest.fn().mockResolvedValue({ allowed: true, count: 1 })
        })
      })
    },
    ...overrides
  };
}

function createMockRequest(method = 'POST', headers = {}) {
  const headerMap = new Map(Object.entries({
    'Authorization': 'LicenseKey ABCD-EFGH-IJKL-MNOP-QRST',
    'CF-Connecting-IP': '127.0.0.1',
    ...headers
  }));
  return {
    url: 'https://api.captureai.workers.dev/api/subscription/create-checkout',
    method,
    headers: { get: (key) => headerMap.get(key) || null },
    text: jest.fn().mockResolvedValue('{}')
  };
}

describe('SubscriptionHandler', () => {
  let handler;
  let env;

  beforeEach(() => {
    env = createMockEnv();
    handler = new SubscriptionHandler(env);

    // Mock global fetch for Stripe API calls
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'cs_test_123', url: 'https://checkout.stripe.com/session' }),
      text: async () => '{}',
      headers: { get: () => null }
    });
  });

  describe('constructor', () => {
    test('should initialize with env', () => {
      expect(handler.env).toBe(env);
      expect(handler.db).toBe(env.DB);
      expect(handler.stripeKey).toBe('sk_test_123');
      expect(handler.webhookSecret).toBe('whsec_test_123');
    });
  });

  describe('getPlans', () => {
    test('should return basic and pro plans', async () => {
      const response = await handler.getPlans();
      const body = JSON.parse(await response.text());

      expect(body.plans).toHaveLength(2);
      expect(body.plans[0].tier).toBe('basic');
      expect(body.plans[0].price).toBe(1.49);
      expect(body.plans[1].tier).toBe('pro');
      expect(body.plans[1].price).toBe(9.99);
      expect(body.plans[1].recommended).toBe(true);
    });

    test('should use configured daily limit', async () => {
      env.BASIC_TIER_DAILY_LIMIT = '20';
      handler = new SubscriptionHandler(env);

      const response = await handler.getPlans();
      const body = JSON.parse(await response.text());

      expect(body.plans[0].dailyLimit).toBe(20);
    });
  });

  describe('createCheckout', () => {
    test('should return 429 when rate limited', async () => {
      checkRateLimit.mockResolvedValueOnce({
        error: 'Rate limit exceeded',
        message: 'Too many requests'
      });

      const request = createMockRequest();
      const response = await handler.createCheckout(request);
      expect(response.status).toBe(429);
    });

    test('should return 500 when price not configured', async () => {
      delete env.STRIPE_PRICE_PRO;
      handler = new SubscriptionHandler(env);

      const request = createMockRequest();
      const response = await handler.createCheckout(request);
      expect(response.status).toBe(500);

      const body = JSON.parse(await response.text());
      expect(body.error).toBe('Price not configured');
    });

    test('should create checkout with existing stripe customer', async () => {
      env.DB._mockFirst.mockResolvedValueOnce({
        stripe_customer_id: 'cus_existing'
      });

      const request = createMockRequest();
      const response = await handler.createCheckout(request);
      const body = JSON.parse(await response.text());

      expect(body.url).toBeDefined();
      expect(body.sessionId).toBeDefined();
    });

    test('should redirect to Stripe hosted invoice for active subscribers requesting a different plan', async () => {
      env.DB._mockFirst.mockResolvedValueOnce({
        id: 'user-123',
        tier: 'basic',
        subscription_status: 'active',
        stripe_subscription_id: 'sub_existing',
        stripe_customer_id: 'cus_existing'
      });

      jest.spyOn(handler, 'switchExistingSubscriptionTier').mockResolvedValue({
        url: 'https://invoice.stripe.com/i/acct_test/invst_123'
      });

      const request = createMockRequest();
      const response = await handler.createCheckout(request);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(body.url).toBe('https://invoice.stripe.com/i/acct_test/invst_123');
      expect(body.changedTier).toBe(true);
      expect(body.sessionId).toBe('tier_change_sub_existing');
      expect(handler.switchExistingSubscriptionTier).toHaveBeenCalledWith('sub_existing', 'pro', 'user-123');
    });

    test('should create new stripe customer when none exists', async () => {
      env.DB._mockFirst.mockResolvedValueOnce(null); // No existing user

      // First fetch creates customer, second creates checkout
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'cus_new' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'cs_test_456', url: 'https://checkout.stripe.com' })
        });

      const request = createMockRequest();
      const response = await handler.createCheckout(request);
      expect(response.status).toBe(200);
    });
  });

  describe('handleWebhook', () => {
    test('should return 400 when missing signature', async () => {
      const request = createMockRequest();
      request.headers.get = () => null; // No stripe-signature

      const response = await handler.handleWebhook(request);
      expect(response.status).toBe(400);
    });

    test('should return 400 when missing webhook secret', async () => {
      handler.webhookSecret = null;
      const request = createMockRequest('POST', {
        'stripe-signature': 't=123,v1=abc'
      });

      const response = await handler.handleWebhook(request);
      expect(response.status).toBe(400);
    });
  });

  describe('handleCheckoutCompleted', () => {
    test('should upgrade existing user to pro', async () => {
      env.DB._mockFirst.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
        license_key: 'ABCD-EFGH-IJKL-MNOP-QRST',
        tier: 'basic'
      });

      await handler.handleCheckoutCompleted({
        customer_email: 'test@example.com',
        customer: 'cus_123',
        subscription: 'sub_123'
      });

      expect(env.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users')
      );
    });

    test('should create new pro user when no existing user', async () => {
      env.DB._mockFirst
        .mockResolvedValueOnce(null)  // No existing user
        .mockResolvedValueOnce(null); // No key collision

      await handler.handleCheckoutCompleted({
        customer_email: 'new@example.com',
        customer: 'cus_new',
        subscription: 'sub_new'
      });

      expect(env.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users')
      );
    });

    test('should fetch email from Stripe customer when not in session', async () => {
      env.DB._mockFirst.mockResolvedValueOnce({
        id: 'user-1',
        license_key: 'KEY',
        tier: 'basic'
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'stripe@example.com' })
      });

      await handler.handleCheckoutCompleted({
        customer_email: null,
        customer: 'cus_123',
        subscription: 'sub_123'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('customers/cus_123'),
        expect.any(Object)
      );
    });

    test('should do nothing when no email available', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      // Should not throw
      await handler.handleCheckoutCompleted({
        customer_email: null,
        customer: null,
        subscription: 'sub_123'
      });
    });
  });

  describe('handlePaymentSucceeded', () => {
    test('should update subscription status to active', async () => {
      await handler.handlePaymentSucceeded({
        customer_email: 'test@example.com'
      });

      expect(env.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users')
      );
    });

    test('should skip update when no email', async () => {
      await handler.handlePaymentSucceeded({
        customer_email: null
      });

      // prepare is not called for the update
      expect(env.DB.prepare).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentFailed', () => {
    test('should set status to past_due', async () => {
      await handler.handlePaymentFailed({
        customer_email: 'test@example.com'
      });

      expect(env.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users')
      );
    });
  });

  describe('handleSubscriptionCancelled', () => {
    test('should downgrade tier', async () => {
      await handler.handleSubscriptionCancelled({
        id: 'sub_123'
      });

      expect(env.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users')
      );
    });
  });

  describe('handleSubscriptionUpdated', () => {
    test('should keep pro tier for active subscription', async () => {
      await handler.handleSubscriptionUpdated({
        id: 'sub_123',
        status: 'active'
      });

      expect(env.DB.prepare).toHaveBeenCalled();
    });

    test('should keep pro tier for trialing subscription', async () => {
      await handler.handleSubscriptionUpdated({
        id: 'sub_123',
        status: 'trialing'
      });

      expect(env.DB.prepare).toHaveBeenCalled();
    });

    test('should keep pro tier for past_due (grace period)', async () => {
      await handler.handleSubscriptionUpdated({
        id: 'sub_123',
        status: 'past_due'
      });

      expect(env.DB.prepare).toHaveBeenCalled();
    });

    test('should update status for cancelled subscription', async () => {
      await handler.handleSubscriptionUpdated({
        id: 'sub_123',
        status: 'canceled'
      });

      expect(env.DB.prepare).toHaveBeenCalled();
    });

    test('should update status for unpaid subscription', async () => {
      await handler.handleSubscriptionUpdated({
        id: 'sub_123',
        status: 'unpaid'
      });

      expect(env.DB.prepare).toHaveBeenCalled();
    });
  });

  describe('getPortal', () => {
    test('should return 401 when not authenticated', async () => {
      handler.auth.authenticate.mockResolvedValueOnce(null);

      const request = createMockRequest('GET');
      const response = await handler.getPortal(request);
      expect(response.status).toBe(401);
    });

    test('should return 400 when no stripe customer', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({ userId: 'user-1' });
      env.DB._mockFirst.mockResolvedValueOnce({ stripe_customer_id: null });

      const request = createMockRequest('GET');
      const response = await handler.getPortal(request);
      expect(response.status).toBe(400);
    });

    test('should return portal URL', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({ userId: 'user-1' });
      env.DB._mockFirst.mockResolvedValueOnce({ stripe_customer_id: 'cus_123' });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://billing.stripe.com/portal/123' })
      });

      const request = createMockRequest('GET');
      const response = await handler.getPortal(request);
      const body = JSON.parse(await response.text());

      expect(body.url).toContain('stripe.com');
    });
  });

  describe('verifyPayment', () => {
    test('should return 429 when rate limited', async () => {
      checkRateLimit.mockResolvedValueOnce({
        error: 'Rate limit exceeded',
        message: 'Too many requests'
      });

      const request = createMockRequest();
      const response = await handler.verifyPayment(request);
      expect(response.status).toBe(429);
    });

    test('should return 400 when sessionId missing', async () => {
      validateRequestBody.mockResolvedValueOnce({});

      const request = createMockRequest();
      const response = await handler.verifyPayment(request);
      expect(response.status).toBe(400);

      const body = JSON.parse(await response.text());
      expect(body.error).toBe('Session ID is required');
    });

    test('should return 400 for invalid session ID format', async () => {
      validateRequestBody.mockResolvedValueOnce({ sessionId: 'invalid_id' });

      const request = createMockRequest();
      const response = await handler.verifyPayment(request);
      expect(response.status).toBe(400);

      const body = JSON.parse(await response.text());
      expect(body.error).toBe('Invalid session ID format');
    });

    test('should accept cs_test_ session IDs', async () => {
      validateRequestBody.mockResolvedValueOnce({ sessionId: 'cs_test_abc123' });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          payment_status: 'paid',
          status: 'complete',
          customer_details: { email: 'test@example.com' }
        })
      });

      const request = createMockRequest();
      const response = await handler.verifyPayment(request);
      const body = JSON.parse(await response.text());

      expect(body.success).toBe(true);
      expect(body.email).toBe('test@example.com');
    });

    test('should accept cs_live_ session IDs', async () => {
      validateRequestBody.mockResolvedValueOnce({ sessionId: 'cs_live_xyz789' });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          payment_status: 'paid',
          status: 'complete',
          customer_email: 'live@example.com'
        })
      });

      const request = createMockRequest();
      const response = await handler.verifyPayment(request);
      const body = JSON.parse(await response.text());

      expect(body.success).toBe(true);
    });

    test('should return 400 when payment not completed', async () => {
      validateRequestBody.mockResolvedValueOnce({ sessionId: 'cs_test_pending' });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          payment_status: 'unpaid',
          status: 'open'
        })
      });

      const request = createMockRequest();
      const response = await handler.verifyPayment(request);
      expect(response.status).toBe(400);

      const body = JSON.parse(await response.text());
      expect(body.error).toBe('Payment not completed');
    });

    test('should return 400 when Stripe session retrieval fails', async () => {
      validateRequestBody.mockResolvedValueOnce({ sessionId: 'cs_test_invalid' });

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Not found' } })
      });

      const request = createMockRequest();
      const response = await handler.verifyPayment(request);
      expect(response.status).toBe(400);
    });
  });

  describe('verifyWebhookSignature', () => {
    test('should throw for old timestamps', async () => {
      const oldTimestamp = String(Math.floor(Date.now() / 1000) - 300); // 5 min ago
      validateStripeSignature.mockReturnValueOnce({
        t: oldTimestamp,
        v1: 'sig'
      });

      await expect(
        handler.verifyWebhookSignature('{}', 't=123,v1=abc')
      ).rejects.toThrow('Webhook timestamp too old');
    });

    test('should throw for future timestamps', async () => {
      const futureTimestamp = String(Math.floor(Date.now() / 1000) + 120); // 2 min future
      validateStripeSignature.mockReturnValueOnce({
        t: futureTimestamp,
        v1: 'sig'
      });

      await expect(
        handler.verifyWebhookSignature('{}', 't=123,v1=abc')
      ).rejects.toThrow('Webhook timestamp is in the future');
    });

    test('should set isSignatureError on timestamp errors', async () => {
      const oldTimestamp = String(Math.floor(Date.now() / 1000) - 300);
      validateStripeSignature.mockReturnValueOnce({
        t: oldTimestamp,
        v1: 'sig'
      });

      try {
        await handler.verifyWebhookSignature('{}', 't=123,v1=abc');
      } catch (err) {
        expect(err.isSignatureError).toBe(true);
      }
    });
  });

  describe('checkWebhookProcessed', () => {
    test('should return true when event exists', async () => {
      env.DB._mockFirst.mockResolvedValueOnce({ id: 1 });
      const result = await handler.checkWebhookProcessed('evt_123');
      expect(result).toBe(true);
    });

    test('should return false when event does not exist', async () => {
      env.DB._mockFirst.mockResolvedValueOnce(null);
      const result = await handler.checkWebhookProcessed('evt_new');
      expect(result).toBe(false);
    });

    test('should return false on DB error', async () => {
      env.DB.prepare.mockImplementationOnce(() => {
        throw new Error('DB error');
      });
      const result = await handler.checkWebhookProcessed('evt_err');
      expect(result).toBe(false);
    });
  });

  describe('markWebhookProcessed', () => {
    test('should insert event record', async () => {
      await handler.markWebhookProcessed('evt_123', '1234567890');
      expect(env.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO webhook_events')
      );
    });

    test('should not throw on DB error', async () => {
      env.DB.prepare.mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      // Should not throw
      await handler.markWebhookProcessed('evt_123', '1234567890');
    });
  });

  describe('handleWebhook - event routing', () => {
    test('should route checkout.session.completed event', async () => {
      const spy = jest.spyOn(handler, 'handleCheckoutCompleted').mockResolvedValue();
      handler.verifyWebhookSignature = jest.fn().mockResolvedValueOnce({
        id: 'evt_1',
        type: 'checkout.session.completed',
        data: { object: { customer_email: 'test@example.com', customer: 'cus_1', subscription: 'sub_1' } }
      });

      const request = createMockRequest('POST', { 'stripe-signature': 't=123,v1=abc' });
      const response = await handler.handleWebhook(request);
      expect(response.status).toBe(200);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should route invoice.payment_succeeded event', async () => {
      const spy = jest.spyOn(handler, 'handlePaymentSucceeded').mockResolvedValue();
      handler.verifyWebhookSignature = jest.fn().mockResolvedValueOnce({
        id: 'evt_2',
        type: 'invoice.payment_succeeded',
        data: { object: { customer_email: 'test@example.com' } }
      });

      const request = createMockRequest('POST', { 'stripe-signature': 't=123,v1=abc' });
      const response = await handler.handleWebhook(request);
      expect(response.status).toBe(200);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should route invoice.payment_failed event', async () => {
      const spy = jest.spyOn(handler, 'handlePaymentFailed').mockResolvedValue();
      handler.verifyWebhookSignature = jest.fn().mockResolvedValueOnce({
        id: 'evt_3',
        type: 'invoice.payment_failed',
        data: { object: { customer_email: 'test@example.com' } }
      });

      const request = createMockRequest('POST', { 'stripe-signature': 't=123,v1=abc' });
      const response = await handler.handleWebhook(request);
      expect(response.status).toBe(200);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should route customer.subscription.deleted event', async () => {
      const spy = jest.spyOn(handler, 'handleSubscriptionCancelled').mockResolvedValue();
      handler.verifyWebhookSignature = jest.fn().mockResolvedValueOnce({
        id: 'evt_4',
        type: 'customer.subscription.deleted',
        data: { object: { id: 'sub_123' } }
      });

      const request = createMockRequest('POST', { 'stripe-signature': 't=123,v1=abc' });
      const response = await handler.handleWebhook(request);
      expect(response.status).toBe(200);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should route customer.subscription.updated event', async () => {
      const spy = jest.spyOn(handler, 'handleSubscriptionUpdated').mockResolvedValue();
      handler.verifyWebhookSignature = jest.fn().mockResolvedValueOnce({
        id: 'evt_5',
        type: 'customer.subscription.updated',
        data: { object: { id: 'sub_123', status: 'active' } }
      });

      const request = createMockRequest('POST', { 'stripe-signature': 't=123,v1=abc' });
      const response = await handler.handleWebhook(request);
      expect(response.status).toBe(200);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should handle unknown event type gracefully', async () => {
      handler.verifyWebhookSignature = jest.fn().mockResolvedValueOnce({
        id: 'evt_6',
        type: 'some.unknown.event',
        data: { object: {} }
      });

      const request = createMockRequest('POST', { 'stripe-signature': 't=123,v1=abc' });
      const response = await handler.handleWebhook(request);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(body.received).toBe(true);
    });

    test('should return 400 for signature verification failure', async () => {
      const err = new Error('Signature verification failed');
      err.isSignatureError = true;
      handler.verifyWebhookSignature = jest.fn().mockRejectedValueOnce(err);

      const request = createMockRequest('POST', { 'stripe-signature': 't=123,v1=bad' });
      const response = await handler.handleWebhook(request);
      expect(response.status).toBe(400);
    });

    test('should return 200 for business logic errors to prevent retries', async () => {
      const err = new Error('Some business error');
      handler.verifyWebhookSignature = jest.fn().mockRejectedValueOnce(err);

      const request = createMockRequest('POST', { 'stripe-signature': 't=123,v1=abc' });
      const response = await handler.handleWebhook(request);
      expect(response.status).toBe(200);

      const body = JSON.parse(await response.text());
      expect(body.received).toBe(true);
    });
  });

  describe('Stripe API error handling', () => {
    test('createStripeCustomer should throw on API error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Invalid email' } })
      });

      await expect(handler.createStripeCustomer('bad@email'))
        .rejects.toThrow('Invalid email');
    });

    test('createStripeCustomer should throw default message on unknown error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: {} })
      });

      await expect(handler.createStripeCustomer('test@example.com'))
        .rejects.toThrow('Failed to create Stripe customer');
    });

    test('createStripeCheckout should throw on API error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Price not found' } })
      });

      await expect(handler.createStripeCheckout('cus_123', 'price_bad', 'test@example.com'))
        .rejects.toThrow('Price not found');
    });

    test('createBillingPortal should throw on API error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      await expect(handler.createBillingPortal('cus_123'))
        .rejects.toThrow('Failed to create portal session');
    });
  });

  describe('handleCheckoutCompleted - key collision retry', () => {
    test('should retry key generation on collision', async () => {
      // No existing user
      env.DB._mockFirst
        .mockResolvedValueOnce(null)  // No existing user (SELECT by email/customer)
        .mockResolvedValueOnce({ id: 1 }) // First key collision
        .mockResolvedValueOnce({ id: 1 }) // Second key collision
        .mockResolvedValueOnce(null);      // Third key is unique

      await handler.handleCheckoutCompleted({
        customer_email: 'new@example.com',
        customer: 'cus_new',
        subscription: 'sub_new'
      });

      // generateLicenseKey should be called at least 3 times (2 collisions + 1 success)
      expect(handler.auth.generateLicenseKey.mock.calls.length).toBeGreaterThanOrEqual(3);
      expect(env.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users')
      );
    });

    test('should send email after creating new pro user', async () => {
      env.DB._mockFirst
        .mockResolvedValueOnce(null)  // No existing user
        .mockResolvedValueOnce(null); // No key collision

      await handler.handleCheckoutCompleted({
        customer_email: 'new@example.com',
        customer: 'cus_new',
        subscription: 'sub_new'
      });

      expect(handler.auth.sendLicenseKeyEmail).toHaveBeenCalledWith(
        'new@example.com',
        expect.any(String),
        'pro',
        null,
        true
      );
    });

    test('should send email after upgrading existing user', async () => {
      env.DB._mockFirst.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
        license_key: 'EXIST-KEY1-KEY2-KEY3-KEY4',
        tier: 'basic'
      });

      await handler.handleCheckoutCompleted({
        customer_email: 'test@example.com',
        customer: 'cus_123',
        subscription: 'sub_123'
      });

      expect(handler.auth.sendLicenseKeyEmail).toHaveBeenCalledWith(
        'test@example.com',
        'EXIST-KEY1-KEY2-KEY3-KEY4',
        'pro',
        null,
        false
      );
    });
  });

  describe('handleSubscriptionUpdated - status mapping', () => {
    test('should update status for incomplete_expired subscription', async () => {
      await handler.handleSubscriptionUpdated({
        id: 'sub_123',
        status: 'incomplete_expired'
      });

      expect(env.DB.prepare).toHaveBeenCalled();
    });

    test('should update status for paused subscription', async () => {
      await handler.handleSubscriptionUpdated({
        id: 'sub_123',
        status: 'paused'
      });

      expect(env.DB.prepare).toHaveBeenCalled();
    });
  });

  describe('handlePaymentFailed - edge cases', () => {
    test('should not throw when no email provided', async () => {
      await expect(handler.handlePaymentFailed({
        customer_email: null
      })).resolves.not.toThrow();
    });
  });

  describe('handleSubscriptionCancelled - edge cases', () => {
    test('should handle DB error gracefully', async () => {
      env.DB.prepare.mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      // Should not throw
      await expect(handler.handleSubscriptionCancelled({
        id: 'sub_123'
      })).resolves.not.toThrow();
    });
  });

  describe('swapPlan', () => {
    function createAuthRequest() {
      const headerMap = new Map([
        ['Authorization', 'LicenseKey ABCD-EFGH-IJKL-MNOP-QRST'],
        ['CF-Connecting-IP', '127.0.0.1']
      ]);
      return {
        url: 'https://api.captureai.workers.dev/api/subscription/swap-plan',
        method: 'POST',
        headers: { get: (key) => headerMap.get(key) || null }
      };
    }

    test('should return 401 when not authenticated', async () => {
      handler.auth.authenticate.mockResolvedValueOnce(null);

      const request = createAuthRequest();
      const response = await handler.swapPlan(request);
      expect(response.status).toBe(401);
    });

    test('should return 400 when user is already on Pro', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        tier: 'pro'
      });

      env.DB._mockFirst.mockResolvedValueOnce({
        tier: 'pro',
        stripe_subscription_id: 'sub_123',
        stripe_customer_id: 'cus_123',
        email: 'test@example.com'
      });

      const request = createAuthRequest();
      const response = await handler.swapPlan(request);
      expect(response.status).toBe(400);

      const body = JSON.parse(await response.text());
      expect(body.error).toContain('Basic tier');
    });

    test('should return 400 when user has no Stripe subscription', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        tier: 'basic'
      });

      env.DB._mockFirst.mockResolvedValueOnce({
        tier: 'basic',
        stripe_subscription_id: null,
        stripe_customer_id: 'cus_123',
        email: 'test@example.com'
      });

      const request = createAuthRequest();
      const response = await handler.swapPlan(request);
      expect(response.status).toBe(400);

      const body = JSON.parse(await response.text());
      expect(body.error).toContain('No active subscription');
    });

    test('should return 500 when Stripe Checkout session creation fails', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        tier: 'basic'
      });

      env.DB._mockFirst.mockResolvedValueOnce({
        tier: 'basic',
        stripe_subscription_id: 'sub_123',
        stripe_customer_id: 'cus_123',
        email: 'test@example.com'
      });

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Cannot create session' } })
      });

      const request = createAuthRequest();
      const response = await handler.swapPlan(request);
      expect(response.status).toBe(500);
    });

    test('should return payment-success URL after upgrade', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        tier: 'basic'
      });

      env.DB._mockFirst.mockResolvedValueOnce({
        tier: 'basic',
        stripe_subscription_id: 'sub_123',
        stripe_customer_id: 'cus_123',
        email: 'test@example.com'
      });

      // 1. Fetch existing subscription
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: { data: [{ id: 'si_test' }] } })
      });
      
      // 2. Update subscription
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'active',
          latest_invoice: {
            status: 'paid',
            hosted_invoice_url: 'https://invoice.stripe.com/i/acct_test/invst_123',
            amount_due: 249,
            subtotal: 249,
            total: 249,
            currency: 'usd'
          }
        })
      });

      const request = createAuthRequest();
      const response = await handler.swapPlan(request);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(body.url).toContain('payment-success');
      expect(body.sessionId).toBe('upgrade_sub_123');
    });

    test('should return 429 when rate limited', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        tier: 'basic'
      });

      checkRateLimit.mockResolvedValueOnce({
        error: 'Rate limit exceeded',
        message: 'Too many requests'
      });

      const request = createAuthRequest();
      const response = await handler.swapPlan(request);
      expect(response.status).toBe(429);
    });
  });
});
