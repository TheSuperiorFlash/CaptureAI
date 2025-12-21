/**
 * CaptureAI Cloudflare Workers Backend
 * Main entry point for the Worker
 */

import { Router } from './router';
import { handleCORS } from './utils';

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    try {
      // Create router instance
      const router = new Router(env);

      // Route the request
      const response = await router.route(request);

      // Add CORS headers to all responses
      return addCORSHeaders(response);

    } catch (error) {
      console.error('Worker error:', error);

      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error.message
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getCORSHeaders()
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
 */
function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}
