/**
 * AI Handler
 * Handles AI requests through Cloudflare AI Gateway
 */

import { jsonResponse, parseJSON } from './utils';
import { AuthHandler } from './auth';

export class AIHandler {
  constructor(env) {
    this.env = env;
    this.db = env.DB;
    this.auth = new AuthHandler(env);
    this.gatewayName = env.CLOUDFLARE_GATEWAY_NAME || 'captureai-gateway';

    // Get account ID from env or extract from worker URL
    this.accountId = env.CLOUDFLARE_ACCOUNT_ID || this.extractAccountId(env);

    // Build gateway URL using provider-specific endpoint
    // Cloudflare docs: https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/{provider}
    // For OpenAI, we append the OpenAI API path after the provider
    this.apiUrl = `https://gateway.ai.cloudflare.com/v1/${this.accountId}/${this.gatewayName}/compat/v1/chat/completions`;
  }

  extractAccountId(env) {
    // Account ID should be set in wrangler.toml
    // This is a fallback
    return env.CLOUDFLARE_ACCOUNT_ID || 'YOUR_ACCOUNT_ID';
  }

  /**
   * AI solve request (alias for complete)
   * POST /api/ai/solve
   */
  async solve(request) {
    return this.complete(request);
  }

  /**
   * AI completion request
   * POST /api/ai/complete
   */
  async complete(request) {
    try {
      // Authenticate
      const user = await this.auth.authenticate(request);
      if (!user) {
        return jsonResponse({ error: 'Not authenticated' }, 401);
      }

      // Check usage limit
      const usageCheck = await this.checkUsageLimit(user.userId, user.tier);
      if (!usageCheck.allowed) {
        const errorMessage = usageCheck.limitType === 'per_minute'
          ? 'Rate limit reached. Please wait a moment before trying again.'
          : 'Daily limit reached';

        return jsonResponse({
          error: errorMessage,
          limit: usageCheck.limit,
          used: usageCheck.used,
          tier: user.tier,
          limitType: usageCheck.limitType
        }, 429);
      }

      // Parse request
      const { question, imageData, promptType, reasoningLevel } = await parseJSON(request);

      // Validate
      if (!question && !imageData) {
        return jsonResponse({ error: 'Question or image data required' }, 400);
      }

      // Build OpenAI payload
      const payload = this.buildPayload({
        question,
        imageData,
        promptType: promptType || 'answer'
      }, reasoningLevel || 1);

      // Send to AI Gateway
      const startTime = Date.now();
      const aiResponse = await this.sendToGateway(payload, user.userId);
      const responseTime = Date.now() - startTime;

      // Extract answer
      const answer = aiResponse.choices[0]?.message?.content?.trim() || 'No response found';

      // Record usage
      await this.recordUsage({
        userId: user.userId,
        promptType: promptType || 'answer',
        model: payload.model,
        tokensUsed: aiResponse.usage?.total_tokens || 0,
        responseTime,
        cached: aiResponse.cached || false
      });

      return jsonResponse({
        answer,
        usage: {
          tokensUsed: aiResponse.usage?.total_tokens || 0,
          remainingToday: usageCheck.limitType === 'per_day' ? usageCheck.limit - usageCheck.used - 1 : null,
          dailyLimit: usageCheck.limitType === 'per_day' ? usageCheck.limit : null,
          usedToday: usageCheck.limitType === 'per_day' ? usageCheck.used + 1 : null,
          limitType: usageCheck.limitType
        },
        cached: aiResponse.cached || false,
        responseTime,
        model: payload.model
      });

    } catch (error) {
      console.error('AI completion error:', error);
      return jsonResponse({
        error: 'AI request failed',
        message: error.message
      }, 500);
    }
  }

  /**
   * Get usage statistics
   * GET /api/ai/usage
   */
  async getUsage(request) {
    try {
      const user = await this.auth.authenticate(request);
      if (!user) {
        return jsonResponse({ error: 'Not authenticated' }, 401);
      }

      // Get today's usage
      const today = new Date().toISOString().split('T')[0];
      const usageToday = await this.db
        .prepare(`
          SELECT COUNT(*) as count
          FROM usage_records
          WHERE user_id = ? AND DATE(created_at) = ?
        `)
        .bind(user.userId, today)
        .first();

      const used = usageToday?.count || 0;

      // Free tier: 10/day, Pro tier: unlimited daily (rate limited per minute)
      if (user.tier === 'pro') {
        // For Pro users, show per-minute usage
        const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
        const usageLastMinute = await this.db
          .prepare(`
            SELECT COUNT(*) as count
            FROM usage_records
            WHERE user_id = ? AND created_at > ?
          `)
          .bind(user.userId, oneMinuteAgo)
          .first();

        const usedLastMinute = usageLastMinute?.count || 0;
        const rateLimit = parseInt(this.env.PRO_TIER_RATE_LIMIT_PER_MINUTE || '60');

        return jsonResponse({
          today: {
            used,
            limit: null,  // Unlimited daily
            remaining: null,
            percentage: 0
          },
          lastMinute: {
            used: usedLastMinute,
            limit: rateLimit,
            remaining: Math.max(0, rateLimit - usedLastMinute),
            percentage: Math.round((usedLastMinute / rateLimit) * 100)
          },
          tier: user.tier,
          limitType: 'per_minute'
        });
      } else {
        // Free tier
        const dailyLimit = parseInt(this.env.FREE_TIER_DAILY_LIMIT || '10');

        return jsonResponse({
          today: {
            used,
            limit: dailyLimit,
            remaining: Math.max(0, dailyLimit - used),
            percentage: Math.round((used / dailyLimit) * 100)
          },
          tier: user.tier,
          limitType: 'per_day'
        });
      }

    } catch (error) {
      console.error('Usage fetch error:', error);
      return jsonResponse({ error: 'Failed to fetch usage' }, 500);
    }
  }

  /**
   * Get available models
   * GET /api/ai/models
   */
  async getModels(request) {
    return jsonResponse({
      models: [
        {
          id: 'gpt-5-nano',
          name: 'GPT-5 Nano',
          description: 'Fast and efficient reasoning',
          tier: 'all'
        }
      ]
    });
  }

  /**
   * Check if user is within usage limits
   */
  async checkUsageLimit(userId, tier) {
    // Pro tier: Rate limited to 30 requests per minute
    if (tier === 'pro') {
      const rateLimit = parseInt(this.env.PRO_TIER_RATE_LIMIT_PER_MINUTE || '30');

      // Get requests from last minute
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      const result = await this.db
        .prepare(`
          SELECT COUNT(*) as count
          FROM usage_records
          WHERE user_id = ? AND created_at > ?
        `)
        .bind(userId, oneMinuteAgo)
        .first();

      const usedInLastMinute = result?.count || 0;

      return {
        allowed: usedInLastMinute < rateLimit,
        used: usedInLastMinute,
        limit: rateLimit,
        limitType: 'per_minute'
      };
    }

    // Free tier has daily limit
    const limit = parseInt(this.env.FREE_TIER_DAILY_LIMIT || '10');

    // Get today's usage
    const today = new Date().toISOString().split('T')[0];
    const result = await this.db
      .prepare(`
        SELECT COUNT(*) as count
        FROM usage_records
        WHERE user_id = ? AND DATE(created_at) = ?
      `)
      .bind(userId, today)
      .first();

    const used = result?.count || 0;

    return {
      allowed: used < limit,
      used,
      limit,
      limitType: 'per_day'
    };
  }

  /**
   * Record usage in database
   */
  async recordUsage({ userId, promptType, model, tokensUsed, responseTime, cached }) {
    await this.db
      .prepare(`
        INSERT INTO usage_records (user_id, prompt_type, model, tokens_used, response_time, cached)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(userId, promptType, model, tokensUsed, responseTime, cached ? 1 : 0)
      .run();
  }

  /**
   * Build OpenAI payload
   */
  buildPayload(requestData, reasoningLevel) {
    const { question, imageData, promptType } = requestData;

    // Reasoning level configurations
    // 0 = Low (gpt-4.1-nano, no reasoning)
    // 1 = Medium (gpt-5-nano, low reasoning)
    // 2 = High (gpt-5-nano, medium reasoning)
    const configs = {
      0: { model: 'openai/gpt-4.1-nano', reasoningEffort: null },  // Legacy model, no reasoning
      1: { model: 'openai/gpt-5-nano', reasoningEffort: 'low' },
      2: { model: 'openai/gpt-5-nano', reasoningEffort: 'medium' }
    };

    const config = configs[reasoningLevel] || configs[1]; // Default to medium

    let messages = [];

    if (promptType === 'ask' && question && imageData) {
      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: question },
          { type: 'image_url', image_url: { url: imageData } }
        ]
      }];
    } else if (promptType === 'ask' && question) {
      messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: question }
      ];
    } else if (promptType === 'auto_solve' && imageData) {
      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: 'Answer with only the number (1, 2, 3, or 4) of the correct choice.' },
          { type: 'image_url', image_url: { url: imageData } }
        ]
      }];
    } else {
      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: 'Reply with answer only.' },
          { type: 'image_url', image_url: { url: imageData } }
        ]
      }];
    }

    const payload = {
        model: config.model,
        messages
    };

    // Use different token parameter based on model
    const maxTokens = promptType === 'ask' ? 4000 : 2500;

    if (config.useLegacyTokenParam) {
        // gpt-4.1-mini uses max_tokens
        payload.max_tokens = maxTokens;
    } else {
        // gpt-5-nano uses max_completion_tokens
        payload.max_completion_tokens = maxTokens;
    }

    // Add reasoning_effort only for gpt-5-nano models (level 1 and 2)
    if (config.reasoningEffort) {
        payload.reasoning_effort = config.reasoningEffort;
    }

    return payload;
}

  /**
   * Send request to Cloudflare AI Gateway
   */
  async sendToGateway(payload, userId) {
      const headers = {
          'Content-Type': 'application/json',
          'cf-aig-metadata-user': userId
      };

      // Add gateway token if using authenticated AI Gateway
      if (this.env.CLOUDFLARE_GATEWAY_TOKEN) {
          headers['cf-aig-authorization'] = this.env.CLOUDFLARE_GATEWAY_TOKEN;
      }

      const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI error (${response.status}): ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Check if cached
    const cfCacheStatus = response.headers.get('cf-cache-status');
    if (cfCacheStatus === 'HIT') {
      data.cached = true;
    }

    return data;
  }
}
