/**
 * Router - Handles request routing (License Key System)
 */

import { AuthHandler } from './auth';
import { AIHandler } from './ai';
import { SubscriptionHandler } from './subscription';
import { jsonResponse } from './utils';
import { checkRateLimit, getClientIdentifier, RateLimitPresets } from './ratelimit';

export class Router {
  constructor(env, logger = null, ctx = null) {
    this.env = env;
    this.logger = logger;
    this.auth = new AuthHandler(env, logger);
    this.ai = new AIHandler(env, logger, ctx);
    this.subscription = new SubscriptionHandler(env, logger);
  }

  /**
   * Route incoming request
   */
  async route(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Global rate limit - applied to every endpoint before routing
    const clientId = getClientIdentifier(request);
    const globalLimit = await checkRateLimit(
      clientId,
      RateLimitPresets.GLOBAL.limit,
      RateLimitPresets.GLOBAL.windowMs,
      this.env,
      RateLimitPresets.GLOBAL.bindingName
    );
    if (globalLimit && globalLimit.error) {
      // Standards-compliant 429 response with Retry-After and X-RateLimit-* headers
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');

      if (globalLimit.retryAfter !== undefined && globalLimit.retryAfter !== null) {
        let retryAfterValue = globalLimit.retryAfter;

        if (typeof retryAfterValue === 'number' && Number.isFinite(retryAfterValue)) {
          retryAfterValue = String(Math.ceil(retryAfterValue));
        } else {
          retryAfterValue = String(retryAfterValue);
        }

        headers.set('Retry-After', retryAfterValue);
      }

      if (typeof globalLimit.limit === 'number') {
        headers.set('X-RateLimit-Limit', String(globalLimit.limit));
      }
      if (typeof globalLimit.remaining === 'number') {
        headers.set('X-RateLimit-Remaining', String(globalLimit.remaining));
      }
      if (globalLimit.reset !== undefined && globalLimit.reset !== null) {
        headers.set('X-RateLimit-Reset', String(globalLimit.reset));
      }

      return new Response(JSON.stringify(globalLimit), {
        status: 429,
        headers
      });
    }

    // Root / Health check
    if (path === '/' && method === 'GET') {
      return jsonResponse({
        status: 'CaptureAI License Key Backend is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    }

    // Health check (alternative)
    if (path === '/health' && method === 'GET') {
      return jsonResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'CaptureAI Workers Backend',
        version: '1.0.0'
      });
    }

    // License Key Authentication routes
    if (path === '/api/auth/validate-key' && method === 'POST') {
      return this.auth.validateKey(request);
    }
    if (path === '/api/auth/me' && method === 'GET') {
      return this.auth.getCurrentUser(request);
    }
    // AI routes
    if (path === '/api/ai/solve' && method === 'POST') {
      return this.ai.solve(request);
    }
    if (path === '/api/ai/complete' && method === 'POST') {
      return this.ai.complete(request);
    }
    if (path === '/api/ai/usage' && method === 'GET') {
      return this.ai.getUsage(request);
    }
    if (path === '/api/ai/models' && method === 'GET') {
      return this.ai.getModels(request);
    }
    if (path === '/api/ai/analytics' && method === 'GET') {
      return this.ai.getAnalytics(request);
    }
    if (path === '/api/ai/total-usage' && method === 'GET') {
      return this.ai.getTotalUsage(request);
    }

    // Subscription routes
    if (path === '/api/subscription/create-checkout' && method === 'POST') {
      return this.subscription.createCheckout(request);
    }
    if (path === '/api/subscription/change-tier' && method === 'POST') {
      return this.subscription.changeTier(request);
    }
    if (path === '/api/subscription/webhook' && method === 'POST') {
      return this.subscription.handleWebhook(request);
    }
    if (path === '/api/subscription/portal' && method === 'GET') {
      return this.subscription.getPortal(request);
    }
    if (path === '/api/subscription/plans' && method === 'GET') {
      return this.subscription.getPlans(request);
    }
    if (path === '/api/subscription/verify-payment' && method === 'POST') {
      return this.subscription.verifyPayment(request);
    }

    // 404 Not Found (don't leak path to prevent reconnaissance)
    return jsonResponse(
      { error: 'Route not found' },
      404
    );
  }
}
