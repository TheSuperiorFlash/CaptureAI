/**
 * Durable Object for Distributed Rate Limiting
 * Provides consistent rate limiting across all Worker instances
 */

export class RateLimiterDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.requests = new Map();
  }

  /**
   * Handle requests to the Durable Object
   */
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/check') {
      return this.checkRateLimit(request);
    } else if (url.pathname === '/reset') {
      return this.resetRateLimit(request);
    }

    return new Response('Not found', { status: 404 });
  }

  /**
   * Check rate limit for a key
   */
  async checkRateLimit(request) {
    try {
      const { key, limit, windowMs } = await request.json();

      if (!key || !limit || !windowMs) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const now = Date.now();

      // Get or create record for this key
      let record = await this.state.storage.get(key);

      if (!record) {
        // First request for this key
        record = {
          count: 1,
          resetAt: now + windowMs
        };
        await this.state.storage.put(key, record);

        // Schedule cleanup alarm if not already set
        const currentAlarm = await this.state.storage.getAlarm();
        if (!currentAlarm) {
          await this.state.storage.setAlarm(Date.now() + 3600000);
        }

        return new Response(
          JSON.stringify({
            allowed: true,
            remaining: limit - 1,
            resetAt: record.resetAt
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if window has expired
      if (now > record.resetAt) {
        record = {
          count: 1,
          resetAt: now + windowMs
        };
        await this.state.storage.put(key, record);

        return new Response(
          JSON.stringify({
            allowed: true,
            remaining: limit - 1,
            resetAt: record.resetAt
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Within window
      if (record.count < limit) {
        record.count++;
        await this.state.storage.put(key, record);

        return new Response(
          JSON.stringify({
            allowed: true,
            remaining: limit - record.count,
            resetAt: record.resetAt
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Rate limit exceeded
      return new Response(
        JSON.stringify({
          allowed: false,
          remaining: 0,
          resetAt: record.resetAt
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Internal error', message: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  /**
   * Reset rate limit for a key (admin use)
   */
  async resetRateLimit(request) {
    try {
      const { key } = await request.json();

      if (!key) {
        return new Response(
          JSON.stringify({ error: 'Missing key parameter' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await this.state.storage.delete(key);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Internal error', message: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  /**
   * Alarm handler for cleanup (optional)
   */
  async alarm() {
    // Clean up expired entries
    const now = Date.now();
    const allKeys = await this.state.storage.list();

    for (const [key, record] of allKeys) {
      if (now > record.resetAt + 3600000) { // Keep for 1 hour after expiry
        await this.state.storage.delete(key);
      }
    }

    // Schedule next cleanup in 1 hour
    await this.state.storage.setAlarm(Date.now() + 3600000);
  }
}
