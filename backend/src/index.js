/**
 * CaptureAI Cloudflare Workers Backend
 * Main entry point for the Worker
 */

import { Router } from './router';
import { handleCORS } from './utils';
import { createRequestLogger, logCorsRejection } from './logger';

export default {
  async fetch(request, env, ctx) {
    // Create request logger
    const logger = createRequestLogger(env, request);
    const startTime = Date.now();

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      logger.debug('CORS preflight request');
      return handleCORS(request);
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
      return addCORSHeaders(response, request);

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
            ...getCORSHeaders(request)
          }
        }
      );
    }
  }
};

/**
 * Add CORS headers to response
 */
function addCORSHeaders(response) {
  const newResponse = new Response(response.body, response);

  // Add CORS headers
  Object.entries(getCORSHeaders()).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });

  return newResponse;
}

/**
 * Get CORS headers
 * Restricts requests to trusted origins only
 */
function getCORSHeaders(request) {
  // List of allowed origins
  const allowedOrigins = [
    'https://thesuperiorflash.github.io',
    'https://captureai.dev',
  ];

  // Development/testing origins (only if in dev mode)
  const isDev = typeof globalThis !== 'undefined' && globalThis.env?.ENVIRONMENT === 'development';
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
    // Chrome extension support (all extensions allowed)
    else if (origin.startsWith('chrome-extension://')) {
      allowedOrigin = origin;
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
