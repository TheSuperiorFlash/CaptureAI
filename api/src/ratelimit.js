/**
 * Rate Limiting Utilities
 * Uses Cloudflare's native Rate Limiting API
 * https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
 */

/**
 * In-memory rate limiter for local development and testing (no binding available)
 */
class InMemoryRateLimiter {
  constructor() {
    this.requests = new Map();
  }

  check(key, limit, windowMs) {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record) {
      this.requests.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    if (now > record.resetAt) {
      this.requests.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    if (record.count < limit) {
      record.count++;
      return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
    }

    return { allowed: false, remaining: 0, resetAt: record.resetAt };
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
 * Uses Cloudflare native Rate Limiting API if binding available, falls back to in-memory.
 * @param {string} identifier - Unique identifier (IP, license key, user ID)
 * @param {number} limit - Max requests (used for in-memory fallback and retryAfter)
 * @param {number} windowMs - Time window in milliseconds (used for in-memory fallback)
 * @param {object} env - Environment object (optional, required for native rate limiting)
 * @param {string} bindingName - Name of the rate limiting binding in env (required when using native rate limiting; no default to prevent silent in-memory fallback)
 * @returns {Promise<object>} - Error response if rate limited, success object if allowed
 */
export async function checkRateLimit(identifier, limit, windowMs, env = null, bindingName = null) {
  // Use named native Cloudflare Rate Limiting binding if available
  // NOTE: In native mode, limit/windowMs are not used for enforcement.
  // They may still be passed by callers (e.g. for in-memory fallback),
  // but the binding's own [[ratelimits]] configuration is authoritative.
  if (env && bindingName && env[bindingName]) {
    try {
      const limitResult = await env[bindingName].limit({ key: identifier });
      const { success } = limitResult || {};
      if (!success) {
        let retryAfter = null;

        if (limitResult && limitResult.reset) {
          let resetTime = null;

          if (limitResult.reset instanceof Date) {
            resetTime = limitResult.reset.getTime();
          } else if (typeof limitResult.reset === 'number') {
            resetTime = limitResult.reset;
          }

          if (resetTime != null) {
            retryAfter = Math.max(
              0,
              Math.ceil((resetTime - Date.now()) / 1000)
            );
          }
        }

        return {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please slow down.',
          retryAfter
        };
      }

      const response = { allowed: true, count: null };

      if (
        limitResult &&
        typeof limitResult.limit === 'number' &&
        typeof limitResult.remaining === 'number'
      ) {
        response.count = limitResult.limit - limitResult.remaining;
        response.limit = limitResult.limit;
        response.remaining = limitResult.remaining;
      }

      if (limitResult && limitResult.reset) {
        if (limitResult.reset instanceof Date) {
          response.resetAt = limitResult.reset.toISOString();
        } else {
          response.resetAt = limitResult.reset;
        }
      }

      return response;
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if rate limiter is unavailable
      return { allowed: true, count: null };
    }
  }

  // Fallback to in-memory rate limiting (local dev / testing)
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
 * Conservative limits based on endpoint sensitivity.
 * bindingName maps to a [[ratelimits]] entry in wrangler.toml
 * (period must be 10 or 60 seconds per Cloudflare docs)
 */
export const RateLimitPresets = {
  // Sensitive auth endpoint — highly conservative: 5 req/min per IP
  AUTH: {
    limit: 5,
    windowMs: 60000,
    bindingName: 'RATE_LIMITER_AUTH'
  },
  // Low-traffic/sensitive endpoint — 10 req/min per IP
  LICENSE_VALIDATION: {
    limit: 10,
    windowMs: 60000,
    bindingName: 'RATE_LIMITER_LICENSE'
  },
  // Low-traffic/sensitive third-party integration — 10 req/min per IP
  CHECKOUT: {
    limit: 10,
    windowMs: 60000,
    bindingName: 'RATE_LIMITER_CHECKOUT'
  },
  // Global limit applied to every endpoint — 60 req/min per IP
  GLOBAL: {
    limit: 60,
    windowMs: 60000,
    bindingName: 'RATE_LIMITER_GLOBAL'
  },
  // Pro-tier per-user AI rate limit — 20 req/min per user
  PRO_AI: {
    limit: 20,
    windowMs: 60000,
    bindingName: 'RATE_LIMITER_AI_PRO'
  }
};
