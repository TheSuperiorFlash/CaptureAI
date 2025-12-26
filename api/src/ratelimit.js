/**
 * Rate Limiting Utilities
 * Distributed rate limiting using Cloudflare Durable Objects
 */

/**
 * Check rate limit using Durable Objects for distributed consistency
 * @param {string} identifier - Unique identifier (IP, email, license key)
 * @param {number} limit - Max requests
 * @param {number} windowMs - Time window in milliseconds
 * @param {object} env - Environment object with RATE_LIMITER binding
 * @returns {object|null} - Error response if rate limited, null if allowed
 */
async function checkRateLimitDO(identifier, limit, windowMs, env) {
  try {
    // Get Durable Object ID from identifier (consistent hashing)
    const id = env.RATE_LIMITER.idFromName(identifier);
    const stub = env.RATE_LIMITER.get(id);

    // Call the Durable Object
    const response = await fetch(stub.url + '/check', {
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

    return null; // Allowed
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request if rate limiter is unavailable
    return null;
  }
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
 * Automatically uses Durable Objects if available, falls back to in-memory
 * @param {string} identifier - Unique identifier (IP, email, license key)
 * @param {number} limit - Max requests
 * @param {number} windowMs - Time window in milliseconds
 * @param {object} env - Environment object (optional, required for Durable Objects)
 * @returns {Promise<object|null>} - Error response if rate limited, null if allowed
 */
export async function checkRateLimit(identifier, limit, windowMs, env = null) {
  // Use Durable Objects if available
  if (env && env.RATE_LIMITER) {
    return await checkRateLimitDO(identifier, limit, windowMs, env);
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

  return null; // Allowed
}

/**
 * Get client identifier from request
 * Uses IP address as identifier
 */
export function getClientIdentifier(request) {
  // Try CF-Connecting-IP (Cloudflare's real IP header)
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) return cfIp;

  // Try X-Forwarded-For
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    // Get first IP in the chain
    return xForwardedFor.split(',')[0].trim();
  }

  // Try X-Real-IP
  const xRealIp = request.headers.get('X-Real-IP');
  if (xRealIp) return xRealIp;

  // Fallback to 'unknown' (not ideal but prevents crashes)
  return 'unknown';
}

/**
 * Rate limit configuration presets
 */
export const RateLimitPresets = {
  // Authentication endpoints - 5 requests per minute per IP
  AUTH: {
    limit: 5,
    windowMs: 60000, // 1 minute
  },
  // Free key creation - 3 requests per hour per IP
  FREE_KEY_CREATION: {
    limit: 3,
    windowMs: 3600000, // 1 hour
  },
  // License validation - 10 requests per minute per IP
  LICENSE_VALIDATION: {
    limit: 10,
    windowMs: 60000, // 1 minute
  },
  // Checkout creation - 5 requests per hour per IP
  CHECKOUT: {
    limit: 5,
    windowMs: 3600000, // 1 hour
  },
};
