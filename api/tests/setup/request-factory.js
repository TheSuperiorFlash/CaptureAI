/**
 * Request Factory for API Tests
 *
 * Creates mock Request objects matching Cloudflare Workers Request interface.
 */

/**
 * Create a mock Request object
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method (default: 'GET')
 * @param {string} options.url - Request URL (default: 'https://api.captureai.dev/')
 * @param {Object} options.headers - Request headers
 * @param {Object|string} options.body - Request body (will be JSON.stringify if object)
 * @param {string} options.ip - Client IP address
 * @returns {Request} Mock request object
 */
export function createMockRequest(options = {}) {
  const {
    method = 'GET',
    url = 'https://api.captureai.dev/',
    headers = {},
    body = null,
    ip = '127.0.0.1'
  } = options;

  const allHeaders = {
    'CF-Connecting-IP': ip,
    'User-Agent': 'CaptureAI-Test/1.0',
    'Origin': 'https://captureai.dev',
    ...headers
  };

  if (body && !allHeaders['Content-Type']) {
    allHeaders['Content-Type'] = 'application/json';
  }

  const requestBody = body && typeof body === 'object' ? JSON.stringify(body) : body;

  return new Request(url, {
    method,
    headers: allHeaders,
    body: method !== 'GET' && method !== 'HEAD' ? requestBody : undefined
  });
}

/**
 * Create a POST request with JSON body
 * @param {string} path - URL path
 * @param {Object} body - Request body
 * @param {Object} extraHeaders - Additional headers
 * @returns {Request}
 */
export function createPostRequest(path, body, extraHeaders = {}) {
  return createMockRequest({
    method: 'POST',
    url: `https://api.captureai.dev${path}`,
    body,
    headers: extraHeaders
  });
}

/**
 * Create a GET request
 * @param {string} path - URL path
 * @param {Object} extraHeaders - Additional headers
 * @returns {Request}
 */
export function createGetRequest(path, extraHeaders = {}) {
  return createMockRequest({
    method: 'GET',
    url: `https://api.captureai.dev${path}`,
    headers: extraHeaders
  });
}

/**
 * Create an authenticated request with license key header
 * @param {string} method - HTTP method
 * @param {string} path - URL path
 * @param {Object} options - Additional options
 * @param {string} options.licenseKey - License key (default: test key)
 * @param {Object} options.body - Request body for POST
 * @returns {Request}
 */
export function createAuthenticatedRequest(method, path, options = {}) {
  const {
    licenseKey = 'TEST-AAAA-BBBB-CCCC-DDDD',
    body = null
  } = options;

  return createMockRequest({
    method,
    url: `https://api.captureai.dev${path}`,
    body,
    headers: {
      'Authorization': `LicenseKey ${licenseKey}`
    }
  });
}

/**
 * Create a webhook request with Stripe signature
 * @param {Object} body - Webhook event body
 * @param {string} signature - Stripe-Signature header value
 * @returns {Request}
 */
export function createWebhookRequest(body, signature = '') {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request('https://api.captureai.dev/api/subscription/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': signature,
      'CF-Connecting-IP': '127.0.0.1'
    },
    body: bodyStr
  });
}
