/**
 * Rate Limiting Utilities
 * Uses Cloudflare's native Rate Limiting API with Durable Objects fallback
 * https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
 */

/**
 * Check rate limit using a single binding (native API or Durable Object fallback)
 * @param {string} identifier - Unique identifier (IP, email, license key)
 * @param {number} limit - Max requests (used by DO fallback and for retryAfter calculation)
 * @param {number} windowMs - Time window in ms (used by DO fallback and for retryAfter calculation)
 * @param {object} binding - Rate limit binding from env
 * @returns {object} - Error response if rate limited, success response if allowed
 */
async function checkRateLimitBinding(identifier, limit, windowMs, binding) {
  // Native Cloudflare Rate Limiting API (binding exposes a .limit() method)
  if (typeof binding.limit === 'function') {
    const { success } = await binding.limit({ key: identifier });
    if (!success) {
      return {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please slow down.',
        retryAfter: Math.ceil(windowMs / 1000)
      };
    }
    return { allowed: true, count: null };
  }

  // Legacy Durable Objects fallback
  const id = binding.idFromName(identifier);
  const stub = binding.get(id);

  const response = await stub.fetch('https://rate-limiter/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: identifier, limit, windowMs })
  });

  const result = await response.json();

  if (!result.allowed) {
    const resetInSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
    return {
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${resetInSeconds} seconds.`,
      retryAfter: resetInSeconds,
      resetAt: new Date(result.resetAt).toISOString()
    };
  }

  return { allowed: true, count: result.count ?? 0 };
}

/**
 * In-memory fallback rate limiter (for backwards compatibility and testing)
 */
class InMemoryRateLimiter {
  constructor() {
    this.requests = new Map();
  }

  check(key, limit, windowMs) {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record) {
      this.requests.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs
      };
    }

    if (now > record.resetAt) {
      this.requests.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs
      };
    }

    if (record.count < limit) {
      record.count++;
      return {
        allowed: true,
        remaining: limit - record.count,
        resetAt: record.resetAt
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt
    };
  }

  reset(key) {
    this.requests.delete(key);
  }
}

let inMemoryLimiter = null;

function getInMemoryLimiter() {
  if (!inMemoryLimiter) {
    inMemoryLimiter = new InMemoryRateLimiter();
  }
  return inMemoryLimiter;
}

/**
 * Rate limit middleware for endpoints
 * Uses Cloudflare native Rate Limiting API if binding available, falls back to
 * Durable Objects, then in-memory.
 * @param {string} identifier - Unique identifier (IP, license key, user ID)
 * @param {number} limit - Max requests (used for in-memory fallback and retryAfter)
 * @param {number} windowMs - Time window in milliseconds (used for in-memory fallback)
 * @param {object} env - Environment object (optional, required for native/DO rate limiting)
 * @param {string} bindingName - Name of the rate limiting binding in env (default: 'RATE_LIMITER')
 * @returns {Promise<object>} - Error response if rate limited, success object if allowed
 */
export async function checkRateLimit(identifier, limit, windowMs, env = null, bindingName = 'RATE_LIMITER') {
  // Use named binding if available (native Cloudflare API or Durable Object)
  if (env && env[bindingName]) {
    try {
      return await checkRateLimitBinding(identifier, limit, windowMs, env[bindingName]);
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if rate limiter is unavailable
      return { allowed: true, count: null };
    }
  }

  // Fallback to in-memory rate limiting
  const limiter = getInMemoryLimiter();
  const result = limiter.check(identifier, limit, windowMs);

  if (!result.allowed) {
    const resetInSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
    return {
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${resetInSeconds} seconds.`,
      retryAfter: resetInSeconds,
      resetAt: new Date(result.resetAt).toISOString()
    };
  }

  return { allowed: true, count: limit - result.remaining };
}

/**
 * Get client identifier from request
 * Uses IP address as identifier
 */
export function getClientIdentifier(request) {
  // Try CF-Connecting-IP (Cloudflare's real IP header)
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) {
    return cfIp;
  }

  // Try X-Forwarded-For
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    // Get first IP in the chain
    return xForwardedFor.split(',')[0].trim();
  }

  // Try X-Real-IP
  const xRealIp = request.headers.get('X-Real-IP');
  if (xRealIp) {
    return xRealIp;
  }

  // Fallback to 'unknown' (not ideal but prevents crashes)
  return 'unknown';
}

/**
 * Rate limit configuration presets
 * bindingName maps to a [[ratelimits]] entry in wrangler.toml
 */
export const RateLimitPresets = {
  // Authentication endpoints - 5 requests per minute per IP
  AUTH: {
    limit: 5,
    windowMs: 60000, // 1 minute
    bindingName: 'RATE_LIMITER_AUTH'
  },
  // Free key creation - 3 requests per minute per IP
  FREE_KEY_CREATION: {
    limit: 3,
    windowMs: 60000, // 1 minute — Cloudflare native rate limiting period must be 10 or 60 seconds
    bindingName: 'RATE_LIMITER_FREE_KEY'
  },
  // License validation - 10 requests per minute per IP
  LICENSE_VALIDATION: {
    limit: 10,
    windowMs: 60000, // 1 minute
    bindingName: 'RATE_LIMITER_LICENSE'
  },
  // Checkout creation - 5 requests per minute per IP
  CHECKOUT: {
    limit: 5,
    windowMs: 60000, // 1 minute — Cloudflare native rate limiting period must be 10 or 60 seconds
    bindingName: 'RATE_LIMITER_CHECKOUT'
  },
  // Global rate limit applied to every endpoint - 100 requests per minute per IP
  GLOBAL: {
    limit: 100,
    windowMs: 60000, // 1 minute
    bindingName: 'RATE_LIMITER_GLOBAL'
  }
};
