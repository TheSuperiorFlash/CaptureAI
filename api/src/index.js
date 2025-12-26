/**
 * CaptureAI Cloudflare Workers Backend
 * Main entry point for the Worker
 */

import { Router } from './router';
import { handleCORS } from './utils';
import { createRequestLogger, logCorsRejection } from './logger';

// Export Durable Object for rate limiting
export { RateLimiterDO } from './durable-objects/RateLimiter.js';

/**
 * Validate required environment variables at startup
 * Throws error if critical config is missing
 */
function validateEnvironment(env) {
  const required = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_PRO'];
  const missing = required.filter(key => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Set them with: wrangler secret put <NAME>`);
  }

  // Warn about optional but recommended vars
  const recommended = ['RESEND_API_KEY', 'FROM_EMAIL'];
  const missingRecommended = recommended.filter(key => !env[key]);

  if (missingRecommended.length > 0) {
    console.warn(`Warning: Missing recommended environment variables: ${missingRecommended.join(', ')}. Email functionality may not work.`);
  }
}

export default {
  async fetch(request, env, ctx) {
    // Validate environment on first request (will throw if critical vars missing)
    try {
      validateEnvironment(env);
    } catch (error) {
      console.error('Environment validation failed:', error.message);
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          message: 'Backend is not properly configured. Please contact administrator.'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Create request logger
    const logger = createRequestLogger(env, request);
    const startTime = Date.now();

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      logger.debug('CORS preflight request');
      return handleCORS(request, env);
    }

    try {
      logger.info('Request received');

      // Create router instance
      const router = new Router(env, logger);

      // Route the request
      const response = await router.route(request);

      // Log response
      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        status: response.status,
        duration
      });

      // Add CORS headers to all responses
      return addCORSHeaders(response, request, env);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Worker error', error, { duration });

      return new Response(
        JSON.stringify({
          error: 'Internal server error'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getCORSHeaders(request, env)
          }
        }
      );
    }
  }
};

/**
 * Add CORS headers to response
 */
function addCORSHeaders(response, request, env) {
  const newResponse = new Response(response.body, response);

  // Add CORS headers
  Object.entries(getCORSHeaders(request, env)).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });

  // Add security headers
  addSecurityHeaders(newResponse);

  return newResponse;
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response) {
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Enforce HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (restrict features)
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  return response;
}

/**
 * Get CORS headers
 * Restricts requests to trusted origins only
 */
function getCORSHeaders(request, env) {
  // List of allowed origins
  const allowedOrigins = [
    'https://captureai.dev',
  ];

  // Development/testing origins (only if in dev mode)
  const isDev = env?.ENVIRONMENT === 'development';
  if (isDev) {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000');
  }

  // Get origin from request
  const origin = request?.headers?.get('Origin') || '';

  // Check if origin is allowed
  let allowedOrigin = 'null';
  if (origin) {
    // Exact match for standard origins
    if (allowedOrigins.includes(origin)) {
      allowedOrigin = origin;
    }
    // Chrome extension support - only allow specific extension IDs
    else if (origin.startsWith('chrome-extension://')) {
      const extensionIds = env?.CHROME_EXTENSION_IDS;
      if (extensionIds) {
        // Support comma-separated list of extension IDs
        const allowedExtensionIds = extensionIds.split(',').map(id => id.trim());
        const allowedExtensions = allowedExtensionIds.map(id => `chrome-extension://${id}`);

        if (allowedExtensions.includes(origin)) {
          allowedOrigin = origin;
        }
      } else if (isDev) {
        // In development, allow any extension for testing
        allowedOrigin = origin;
      }
    }
    // Match GitHub Pages subdomain
    else if (origin.match(/^https:\/\/.*\.github\.io$/)) {
      allowedOrigin = origin;
    }
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
}
