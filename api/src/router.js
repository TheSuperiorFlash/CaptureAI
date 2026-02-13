/**
 * Router - Handles request routing (License Key System)
 */

import { AuthHandler } from './auth';
import { AIHandler } from './ai';
import { SubscriptionHandler } from './subscription';
import { jsonResponse } from './utils';

export class Router {
  constructor(env, logger = null) {
    this.env = env;
    this.logger = logger;
    this.auth = new AuthHandler(env, logger);
    this.ai = new AIHandler(env, logger);
    this.subscription = new SubscriptionHandler(env, logger);
  }

  /**
   * Route incoming request
   */
  async route(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

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
    if (path === '/api/auth/create-free-key' && method === 'POST') {
      return this.auth.createFreeKey(request);
    }
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

    // Subscription routes
    if (path === '/api/subscription/create-checkout' && method === 'POST') {
      return this.subscription.createCheckout(request);
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
