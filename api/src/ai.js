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
      // Authenticate and check usage limit in a single query (optimization)
      const { user, usageCheck } = await this.authenticateAndCheckUsage(request);
      if (!user) {
        return jsonResponse({ error: 'Not authenticated' }, 401);
      }

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
      const { question, imageData, ocrText, ocrConfidence, promptType, reasoningLevel } = await parseJSON(request);

      // Validate - check if we have any valid input
      const hasQuestion = question && question.trim().length > 0;
      const hasImageData = imageData && imageData.length > 0;
      const hasOcrText = ocrText && ocrText.trim().length > 0;

      if (!hasQuestion && !hasImageData && !hasOcrText) {
        return jsonResponse({ error: 'Question, image data, or OCR text required' }, 400);
      }

      // Build OpenAI payload
      const payload = this.buildPayload({
        question,
        imageData,
        ocrText,
        ocrConfidence,
        promptType: promptType || 'answer'
      }, reasoningLevel !== undefined ? reasoningLevel : 1);

      // Send to AI Gateway
      const startTime = Date.now();
      const aiResponse = await this.sendToGateway(payload, user.userId);
      const responseTime = Date.now() - startTime;

      // Extract answer
      const answer = aiResponse.choices[0]?.message?.content?.trim() || 'No response found';

      // Extract token usage details
      const usage = aiResponse.usage || {};
      const inputTokens = usage.prompt_tokens || 0;
      const outputTokens = usage.completion_tokens || 0;
      const reasoningTokens = usage.completion_tokens_details?.reasoning_tokens || 0;
      const cachedTokens = usage.prompt_tokens_details?.cached_tokens || 0;

      // Determine input method (OCR, image, or text-only)
      const inputMethod = hasOcrText && !hasImageData ? 'ocr' :
                          hasImageData ? 'image' : 'text';

      // Map reasoning level to human-readable format
      const reasoningLevelMap = {
        0: 'none',      // gpt-4.1-nano (no reasoning)
        1: 'low',       // gpt-5-nano low reasoning
        2: 'medium'     // gpt-5-nano medium reasoning
      };

      // Record usage with detailed token breakdown (optimization #13: non-blocking)
      this.recordUsage({
        userId: user.userId,
        promptType: promptType || 'answer',
        model: reasoningLevelMap[reasoningLevel] || 'low',
        tokensUsed: usage.total_tokens || 0,
        inputTokens,
        outputTokens,
        reasoningTokens,
        cachedTokens,
        inputMethod,
        responseTime,
        cached: aiResponse.cached || false
      }).catch(error => {
        // Log error but don't fail the request
        console.error('Usage recording failed:', error);
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
   * Get cost analytics and usage statistics
   * GET /api/ai/analytics
   */
  async getAnalytics(request) {
    try {
      const user = await this.auth.authenticate(request);
      if (!user) {
        return jsonResponse({ error: 'Not authenticated' }, 401);
      }

      // Get query parameters for filtering
      const url = new URL(request.url);
      const days = parseInt(url.searchParams.get('days') || '30'); // Default 30 days
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Optimized: Single query with CTEs to get all analytics in one DB call
      const analytics = await this.db
        .prepare(`
          WITH filtered_records AS (
            SELECT *
            FROM usage_records
            WHERE user_id = ? AND created_at >= ?
          ),
          overall_stats AS (
            SELECT
              COUNT(*) as total_requests,
              SUM(input_tokens) as total_input_tokens,
              SUM(output_tokens) as total_output_tokens,
              SUM(reasoning_tokens) as total_reasoning_tokens,
              SUM(cached_tokens) as total_cached_tokens,
              SUM(total_cost) as total_cost,
              AVG(input_tokens) as avg_input_tokens,
              AVG(output_tokens) as avg_output_tokens,
              AVG(reasoning_tokens) as avg_reasoning_tokens,
              AVG(total_cost) as avg_cost_per_request,
              AVG(response_time) as avg_response_time
            FROM filtered_records
          ),
          by_prompt AS (
            SELECT
              prompt_type,
              COUNT(*) as requests,
              AVG(input_tokens) as avg_input_tokens,
              AVG(output_tokens) as avg_output_tokens,
              AVG(total_cost) as avg_cost,
              SUM(total_cost) as total_cost
            FROM filtered_records
            GROUP BY prompt_type
          ),
          by_model_stats AS (
            SELECT
              model,
              COUNT(*) as requests,
              AVG(input_tokens) as avg_input_tokens,
              AVG(output_tokens) as avg_output_tokens,
              AVG(total_cost) as avg_cost,
              SUM(total_cost) as total_cost
            FROM filtered_records
            GROUP BY model
          ),
          daily_breakdown AS (
            SELECT
              DATE(created_at) as date,
              COUNT(*) as requests,
              SUM(input_tokens) as input_tokens,
              SUM(output_tokens) as output_tokens,
              SUM(total_cost) as cost
            FROM usage_records
            WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          )
          SELECT
            (SELECT json_group_object('overall', json_object(
              'total_requests', total_requests,
              'total_input_tokens', total_input_tokens,
              'total_output_tokens', total_output_tokens,
              'total_reasoning_tokens', total_reasoning_tokens,
              'total_cached_tokens', total_cached_tokens,
              'total_cost', total_cost,
              'avg_input_tokens', avg_input_tokens,
              'avg_output_tokens', avg_output_tokens,
              'avg_reasoning_tokens', avg_reasoning_tokens,
              'avg_cost_per_request', avg_cost_per_request,
              'avg_response_time', avg_response_time
            )) FROM overall_stats) as overall,
            (SELECT json_group_array(json_object(
              'prompt_type', prompt_type,
              'requests', requests,
              'avg_input_tokens', avg_input_tokens,
              'avg_output_tokens', avg_output_tokens,
              'avg_cost', avg_cost,
              'total_cost', total_cost
            )) FROM by_prompt) as by_prompt_type,
            (SELECT json_group_array(json_object(
              'model', model,
              'requests', requests,
              'avg_input_tokens', avg_input_tokens,
              'avg_output_tokens', avg_output_tokens,
              'avg_cost', avg_cost,
              'total_cost', total_cost
            )) FROM by_model_stats) as by_model,
            (SELECT json_group_array(json_object(
              'date', date,
              'requests', requests,
              'input_tokens', input_tokens,
              'output_tokens', output_tokens,
              'cost', cost
            )) FROM daily_breakdown) as daily
        `)
        .bind(user.userId, startDate, user.userId)
        .first();

      // Parse JSON results
      const overall = JSON.parse(analytics.overall || '{}').overall || {};
      const byPromptType = JSON.parse(analytics.by_prompt_type || '[]');
      const byModel = JSON.parse(analytics.by_model || '[]');
      const dailyStats = JSON.parse(analytics.daily || '[]');

      return jsonResponse({
        period: {
          days,
          start: startDate,
          end: new Date().toISOString()
        },
        overall: {
          totalRequests: overall.total_requests || 0,
          totalCost: parseFloat(overall.total_cost || 0).toFixed(6),
          avgCostPerRequest: parseFloat(overall.avg_cost_per_request || 0).toFixed(8),
          tokens: {
            input: {
              total: overall.total_input_tokens || 0,
              average: Math.round(overall.avg_input_tokens || 0)
            },
            output: {
              total: overall.total_output_tokens || 0,
              average: Math.round(overall.avg_output_tokens || 0)
            },
            reasoning: {
              total: overall.total_reasoning_tokens || 0,
              average: Math.round(overall.avg_reasoning_tokens || 0)
            },
            cached: {
              total: overall.total_cached_tokens || 0
            }
          },
          avgResponseTime: Math.round(overall.avg_response_time || 0)
        },
        byPromptType: byPromptType.map(row => ({
          promptType: row.prompt_type,
          requests: row.requests,
          avgInputTokens: Math.round(row.avg_input_tokens || 0),
          avgOutputTokens: Math.round(row.avg_output_tokens || 0),
          avgCost: parseFloat(row.avg_cost || 0).toFixed(8),
          totalCost: parseFloat(row.total_cost || 0).toFixed(6)
        })),
        byModel: byModel.map(row => ({
          model: row.model,
          requests: row.requests,
          avgInputTokens: Math.round(row.avg_input_tokens || 0),
          avgOutputTokens: Math.round(row.avg_output_tokens || 0),
          avgCost: parseFloat(row.avg_cost || 0).toFixed(8),
          totalCost: parseFloat(row.total_cost || 0).toFixed(6)
        })),
        daily: dailyStats.map(row => ({
          date: row.date,
          requests: row.requests,
          inputTokens: row.input_tokens,
          outputTokens: row.output_tokens,
          cost: parseFloat(row.cost || 0).toFixed(6)
        }))
      });

    } catch (error) {
      console.error('Analytics fetch error:', error);
      return jsonResponse({ error: 'Failed to fetch analytics' }, 500);
    }
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
   * Authenticate and check usage limit in a single operation (optimization #3)
   * Combines authentication and usage check to reduce DB roundtrips
   */
  async authenticateAndCheckUsage(request) {
    // First authenticate
    const user = await this.auth.authenticate(request);
    if (!user) {
      return { user: null, usageCheck: null };
    }

    // Then check usage limit
    const usageCheck = await this.checkUsageLimit(user.userId, user.tier);

    return { user, usageCheck };
  }

  /**
   * Record usage in database with detailed token breakdown and cost calculation
   */
  async recordUsage({
    userId,
    promptType,
    model,
    tokensUsed,
    inputTokens,
    outputTokens,
    reasoningTokens,
    cachedTokens,
    inputMethod,
    responseTime,
    cached
  }) {
    // Pricing per million tokens (based on reasoning level)
    // model field now stores: 'none' (gpt-4.1-nano), 'low' (gpt-5-nano), 'medium' (gpt-5-nano)
    const PRICING = {
      'none': {         // GPT-4.1-nano (no reasoning)
        input: 0.10,    // $0.10 per 1M input tokens
        output: 0.40,   // $0.40 per 1M output tokens
        cached: 0.025   // $0.025 per 1M cached tokens (75% discount)
      },
      'low': {          // GPT-5-nano with low reasoning
        input: 0.05,    // $0.05 per 1M input tokens
        output: 0.40,   // $0.40 per 1M output tokens (reasoning tokens count as output)
        cached: 0.005   // $0.005 per 1M cached tokens (90% discount)
      },
      'medium': {       // GPT-5-nano with medium reasoning
        input: 0.05,    // $0.05 per 1M input tokens
        output: 0.40,   // $0.40 per 1M output tokens (reasoning tokens count as output)
        cached: 0.005   // $0.005 per 1M cached tokens (90% discount)
      }
    };

    // Get pricing for the reasoning level (default to 'low')
    const modelPricing = PRICING[model] || PRICING['low'];

    // Calculate costs (convert from per million to per token)
    // Note: reasoning tokens are billed as output tokens
    const regularInputTokens = inputTokens - (cachedTokens || 0);
    const inputCost = (regularInputTokens * modelPricing.input) / 1000000;
    const cachedCost = ((cachedTokens || 0) * modelPricing.cached) / 1000000;
    const outputCost = (outputTokens * modelPricing.output) / 1000000;
    const totalCost = inputCost + cachedCost + outputCost;

    await this.db
      .prepare(`
        INSERT INTO usage_records (
          user_id,
          prompt_type,
          model,
          tokens_used,
          input_tokens,
          output_tokens,
          reasoning_tokens,
          cached_tokens,
          total_cost,
          response_time,
          cached
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        userId,
        promptType,
        model,
        tokensUsed,
        inputTokens,
        outputTokens,
        reasoningTokens || 0,
        cachedTokens || 0,
        totalCost,
        responseTime,
        cached ? 1 : 0
      )
      .run();
  }

  /**
   * Build OpenAI payload
   */
  buildPayload(requestData, reasoningLevel) {
    const { question, imageData, ocrText, ocrConfidence, promptType } = requestData;

    // Reasoning level configurations
    // 0 = Low (gpt-4.1-nano, no reasoning)
    // 1 = Medium (gpt-5-nano, low reasoning)
    // 2 = High (gpt-5-nano, medium reasoning)
    const configs = {
      0: { model: 'openai/gpt-4.1-nano', reasoningEffort: null, useLegacyTokenParam: true },  // Legacy model, no reasoning
      1: { model: 'openai/gpt-5-nano', reasoningEffort: 'low', useLegacyTokenParam: false },
      2: { model: 'openai/gpt-5-nano', reasoningEffort: 'medium', useLegacyTokenParam: false }
    };

    const config = configs[reasoningLevel] || configs[1]; // Default to medium

    let messages = [];

    // Helper to build enhanced prompt with OCR text
    const buildPromptWithOCR = (basePrompt) => {
      if (ocrText && ocrText.trim().length > 0) {
        return `${basePrompt}\n\nExtracted text from image:\n${ocrText}`;
      }
      return basePrompt;
    };

    if (promptType === 'ask' && question && imageData) {
      // Ask mode with image - include OCR text if available
      const enhancedQuestion = buildPromptWithOCR(question);
      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: enhancedQuestion },
          { type: 'image_url', image_url: { url: imageData } }
        ]
      }];
    } else if (promptType === 'ask' && question && ocrText && !imageData) {
      // Ask mode with OCR text only (no image)
      messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: buildPromptWithOCR(question) }
      ];
    } else if (promptType === 'ask' && question) {
      // Ask mode text-only
      messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: question }
      ];
    } else if (promptType === 'auto_solve') {
      // Auto-solve mode
      const basePrompt = 'Answer with only the number (1, 2, 3, or 4) of the correct choice.';
      const enhancedPrompt = buildPromptWithOCR(basePrompt);

      if (imageData) {
        // Auto-solve with image
        messages = [{
          role: 'user',
          content: [
            { type: 'text', text: enhancedPrompt },
            { type: 'image_url', image_url: { url: imageData } }
          ]
        }];
      } else {
        // Auto-solve with OCR only
        messages = [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: enhancedPrompt }
        ];
      }
    } else if (ocrText && !imageData) {
      // OCR text only, no image (normal answer mode)
      const basePrompt = 'Reply with answer only.';
      messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: buildPromptWithOCR(basePrompt) }
      ];
    } else if (imageData) {
      // Image-based answer (fallback)
      const basePrompt = 'Reply with answer only.';
      const enhancedPrompt = buildPromptWithOCR(basePrompt);
      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: enhancedPrompt },
          { type: 'image_url', image_url: { url: imageData } }
        ]
      }];
    } else {
      // No image, no OCR - error case
      throw new Error('No image data or OCR text provided');
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
