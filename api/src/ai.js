/**
 * AI Handler
 * Handles AI requests through Cloudflare AI Gateway
 */

import { jsonResponse, fetchWithTimeout } from './utils';
import { AuthHandler } from './auth';
import { validateRequestBody } from './validation';
import { checkRateLimit, getClientIdentifier } from './ratelimit';

const PROMPTS = {
  SYSTEM:       'You are a helpful assistant.',
  SYSTEM_IMAGE: 'You are a helpful assistant. Do not select choices highlighted in red.',
  AUTO_SOLVE:       'Respond with ONLY a single digit — 1, 2, 3, or 4 — for the correct answer choice. Choices run left-to-right, then top-to-bottom. If there are not exactly 4 choices, respond with exactly: Invalid question.',
  AUTO_SOLVE_IMAGE: 'Respond with ONLY a single digit — 1, 2, 3, or 4 — for the correct answer choice. Choices run left-to-right, then top-to-bottom. Do not select choices highlighted in red. If there are not exactly 4 choices, respond with exactly: Invalid question.',
  ANSWER:       'Reply with the answer only.',
  ASK:          'You are a helpful assistant. Provide an accurate and clear answer.'
};

export class AIHandler {
  constructor(env, logger = null, ctx = null) {
    this.env = env;
    this.db = env.DB;
    this.logger = logger;
    this.ctx = ctx;
    this.auth = new AuthHandler(env, logger);
    this._userCol = null; // cached: 'email' or 'user_id'
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
   * Detect whether usage_records uses 'email' or 'user_id' column.
   * Caches result for the lifetime of this handler instance.
   */
  async getUserCol() {
    if (this._userCol) {
      return this._userCol;
    }
    const info = await this.db
      .prepare("SELECT name FROM pragma_table_info('usage_records') WHERE name = 'email'")
      .bind()
      .first();
    this._userCol = info ? 'email' : 'user_id';
    return this._userCol;
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
      // IP-based rate limit before authentication to prevent abuse
      const clientId = getClientIdentifier(request);
      const ipRateLimit = await checkRateLimit(
        `ai:${clientId}`,
        120, // IP-level abuse prevention (must exceed highest tier limit of 20/min)
        60000,
        this.env
      );
      if (ipRateLimit && ipRateLimit.error) {
        return jsonResponse(ipRateLimit, 429);
      }

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

      // Parse and validate request body with size limit (30MB for multi-image)
      const { question, imageData, ocrText, ocrConfidence, promptType, reasoningLevel, images } = await validateRequestBody(request, 30 * 1024 * 1024);

      // Validate images array size
      if (images && images.length > 3) {
        return jsonResponse({ error: 'Maximum 3 images allowed' }, 400);
      }

      // Validate - check if we have any valid input
      const hasQuestion = question && question.trim().length > 0;
      const hasImageData = imageData && imageData.length > 0;
      const hasOcrText = ocrText && ocrText.trim().length > 0;
      const hasImages = images && images.length > 0;

      if (!hasQuestion && !hasImageData && !hasOcrText && !hasImages) {
        return jsonResponse({ error: 'Question, image data, or OCR text required' }, 400);
      }

      // Build OpenAI payload
      const payload = this.buildPayload({
        question,
        imageData,
        ocrText,
        ocrConfidence,
        images,
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

      // Map reasoning level to human-readable format (matches UI slider labels)
      const reasoningLevelMap = {
        0: 'low',       // gpt-4.1-nano (no reasoning)
        1: 'medium',    // gpt-5-nano low reasoning
        2: 'high'       // gpt-5-nano medium reasoning
      };

      // Determine actual prompt type used (including _image variants)
      const actualPromptType = this.getActualPromptType(
        promptType || 'answer', imageData, ocrText, images
      );

      // Check if response was cached (header detection or sub-300ms response)
      const isCached = aiResponse.cached || responseTime < 300;

      // Record usage with ctx.waitUntil to ensure D1 write completes
      const parsed = parseInt(reasoningLevel);
      const level = Number.isNaN(parsed) ? 1 : parsed;
      const usagePromise = this.recordUsage({
        email: user.email,
        promptType: actualPromptType,
        model: reasoningLevelMap[level] || 'medium',
        inputTokens: isCached ? 0 : inputTokens,
        outputTokens: isCached ? 0 : outputTokens,
        cachedTokens: isCached ? 0 : cachedTokens,
        totalCost: isCached ? 0 : undefined,
        cached: isCached,
        responseTime
      }).catch(err => {
        console.error('Usage recording failed:', err?.message);
      });
      if (this.ctx) {
        this.ctx.waitUntil(usagePromise);
      } else {
        await usagePromise.catch(() => {});
      }

      return jsonResponse({
        answer,
        usage: {
          tokensUsed: aiResponse.usage?.total_tokens || 0,
          dailyLimit: usageCheck.limitType === 'per_day' ? usageCheck.limit : null,
          usedToday: usageCheck.limitType === 'per_day' ? usageCheck.used + 1 : null,
          limitType: usageCheck.limitType
        },
        cached: isCached,
        responseTime,
        model: payload.model
      });

    } catch (error) {
      console.error('AI completion error:', error);
      return jsonResponse({
        error: 'AI request failed'
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
      const col = await this.getUserCol();
      const today = new Date().toISOString().split('T')[0];
      const usageToday = await this.db
        .prepare(`
          SELECT COUNT(*) as count
          FROM usage_records
          WHERE ${col} = ? AND DATE(created_at) = ?
        `)
        .bind(user.email, today)
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
            WHERE ${col} = ? AND created_at > ?
          `)
          .bind(user.email, oneMinuteAgo)
          .first();

        const usedLastMinute = usageLastMinute?.count || 0;
        const rateLimit = parseInt(this.env.PRO_TIER_RATE_LIMIT_PER_MINUTE || '20');

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
      const col = await this.getUserCol();
      const analytics = await this.db
        .prepare(`
          WITH filtered_records AS (
            SELECT *
            FROM usage_records
            WHERE ${col} = ? AND created_at >= ?
          ),
          overall_stats AS (
            SELECT
              COUNT(*) as total_requests,
              SUM(input_tokens) as total_input_tokens,
              SUM(output_tokens) as total_output_tokens,
              SUM(total_cost) as total_cost,
              AVG(input_tokens) as avg_input_tokens,
              AVG(output_tokens) as avg_output_tokens,
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
            WHERE ${col} = ? AND created_at >= datetime('now', '-7 days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          )
          SELECT
            (SELECT json_group_object('overall', json_object(
              'total_requests', total_requests,
              'total_input_tokens', total_input_tokens,
              'total_output_tokens', total_output_tokens,
              'total_cost', total_cost,
              'avg_input_tokens', avg_input_tokens,
              'avg_output_tokens', avg_output_tokens,
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
        .bind(user.email, startDate, user.email)
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
  async checkUsageLimit(email, tier) {
    // Pro tier: Use Durable Object rate limiter for atomic check-and-increment
    if (tier === 'pro') {
      const rateLimit = parseInt(this.env.PRO_TIER_RATE_LIMIT_PER_MINUTE || '20');

      // Use Durable Object rate limiter to prevent race conditions
      const rateLimitResult = await checkRateLimit(
        `user:${email}`,
        rateLimit,
        60000, // 1 minute window
        this.env
      );

      if (rateLimitResult && rateLimitResult.error) {
        // Rate limit exceeded - use count from Durable Object (no DB query needed)
        return {
          allowed: false,
          used: rateLimit,
          limit: rateLimit,
          limitType: 'per_minute'
        };
      }

      // Allowed - use count from Durable Object instead of redundant DB query
      const usedInLastMinute = rateLimitResult?.count ?? 0;

      if (rateLimitResult?.count === null) {
        console.error('Rate limiter returned null count - possible Durable Object outage');
      }

      return {
        allowed: true,
        used: usedInLastMinute,
        limit: rateLimit,
        limitType: 'per_minute'
      };
    }

    // Free tier has daily limit
    const limit = parseInt(this.env.FREE_TIER_DAILY_LIMIT || '10');

    // Get today's usage
    const col = await this.getUserCol();
    const today = new Date().toISOString().split('T')[0];
    const result = await this.db
      .prepare(`
        SELECT COUNT(*) as count
        FROM usage_records
        WHERE ${col} = ? AND DATE(created_at) = ?
      `)
      .bind(email, today)
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
    const usageCheck = await this.checkUsageLimit(user.email, user.tier);

    return { user, usageCheck };
  }

  /**
   * Determine the actual prompt type used, including _image variants.
   */
  getActualPromptType(promptType, imageData, ocrText, images) {
    const hasImage = imageData || (images && images.length > 0);

    if (promptType === 'auto_solve') {
      return hasImage ? 'auto_solve_image' : 'auto_solve';
    }
    if (promptType === 'ask') {
      return hasImage ? 'ask_image' : 'ask';
    }
    // 'answer' mode
    if (ocrText && !hasImage) {
      return 'answer';
    }
    if (hasImage) {
      return 'answer_image';
    }
    return promptType;
  }

  /**
   * Calculate usage cost based on model pricing
   */
  calculateUsageCost({ model, inputTokens, outputTokens, cachedTokens, overrideCost }) {
    if (overrideCost !== undefined) {
      return overrideCost;
    }

    // Pricing per million tokens (matches UI slider: low/medium/high)
    const PRICING = {
      'low':    { input: 0.10, output: 0.40, cached: 0.025 },  // GPT-4.1-nano
      'medium': { input: 0.05, output: 0.40, cached: 0.005 },  // GPT-5-nano low
      'high':   { input: 0.05, output: 0.40, cached: 0.005 }   // GPT-5-nano medium
    };

    const pricing = PRICING[model] || PRICING['medium'];
    const regularInputTokens = inputTokens - (cachedTokens || 0);
    const inputCost = (regularInputTokens * pricing.input) / 1000000;
    const cachedCost = ((cachedTokens || 0) * pricing.cached) / 1000000;
    const outputCost = (outputTokens * pricing.output) / 1000000;
    return inputCost + cachedCost + outputCost;
  }

  /**
   * Insert a usage record into the database
   */
  async insertUsageRecord({ col, email, promptType, model, inputTokens, outputTokens, totalCost, cached, responseTime }) {
    await this.db
      .prepare(`
        INSERT INTO usage_records (
          ${col}, prompt_type, model, input_tokens, output_tokens,
          total_cost, cached, response_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(email, promptType, model, inputTokens, outputTokens, totalCost, cached ? 'yes' : 'no', responseTime)
      .run();
  }

  /**
   * Record usage in database with detailed token breakdown and cost calculation
   */
  async recordUsage({ email, promptType, model, inputTokens, outputTokens, cachedTokens, totalCost: overrideCost, cached = false, responseTime }) {
    const totalCost = this.calculateUsageCost({ model, inputTokens, outputTokens, cachedTokens, overrideCost });
    const col = await this.getUserCol();
    await this.insertUsageRecord({ col, email, promptType, model, inputTokens, outputTokens, totalCost, cached, responseTime });
  }

  /**
   * Build OpenAI payload
   */
  buildPayload(requestData, reasoningLevel) {
    const { question, imageData, ocrText, images, promptType } = requestData;

    // Reasoning level configurations (matches UI slider: Low / Medium / High)
    // 0 = Low → gpt-4.1-nano, no reasoning
    // 1 = Medium → gpt-5-nano, low reasoning effort
    // 2 = High → gpt-5-nano, medium reasoning effort
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

    if (promptType === 'ask' && (imageData || (images && images.length > 0))) {
      // Ask mode with image(s) — question is optional
      const contentParts = [];
      if (question) {
        contentParts.push({ type: 'text', text: question });
      }
      if (images && images.length > 0) {
        for (const img of images) {
          contentParts.push({ type: 'image_url', image_url: { url: img.imageData } });
        }
      } else if (imageData) {
        contentParts.push({ type: 'image_url', image_url: { url: imageData } });
      }
      messages = [
        { role: 'system', content: PROMPTS.ASK },
        { role: 'user', content: contentParts }
      ];
    } else if (promptType === 'ask' && question && ocrText && !imageData) {
      // Ask mode with OCR text only (no image)
      messages = [
        { role: 'system', content: PROMPTS.ASK },
        { role: 'user', content: buildPromptWithOCR(question) }
      ];
    } else if (promptType === 'ask' && question) {
      // Ask mode text-only
      messages = [
        { role: 'system', content: PROMPTS.ASK },
        { role: 'user', content: question }
      ];
    } else if (promptType === 'auto_solve') {
      // Auto-solve mode
      const hasImage = (images && images.length > 0) || imageData;
      if (hasImage) {
        const imageParts = images && images.length > 0
          ? images.map(img => ({ type: 'image_url', image_url: { url: img.imageData } }))
          : [{ type: 'image_url', image_url: { url: imageData } }];
        messages = [
          { role: 'system', content: PROMPTS.AUTO_SOLVE_IMAGE },
          { role: 'user', content: imageParts }
        ];
      } else {
        // Auto-solve with OCR only
        messages = [
          { role: 'system', content: PROMPTS.AUTO_SOLVE },
          { role: 'user', content: ocrText }
        ];
      }
    } else if (ocrText && !imageData && !(images && images.length > 0)) {
      // OCR text only, no image (normal answer mode)
      messages = [
        { role: 'system', content: PROMPTS.SYSTEM },
        { role: 'user', content: `${PROMPTS.ANSWER}\n\n${ocrText}` }
      ];
    } else if ((images && images.length > 0) || imageData) {
      // Image-based answer (fallback)
      const imageParts = images && images.length > 0
        ? images.map(img => ({ type: 'image_url', image_url: { url: img.imageData } }))
        : [{ type: 'image_url', image_url: { url: imageData } }];
      messages = [
        { role: 'system', content: PROMPTS.SYSTEM_IMAGE },
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPTS.ANSWER },
            ...imageParts
          ]
        }
      ];
    } else {
      // No image, no OCR - error case
      throw new Error('No image data or OCR text provided');
    }

    const payload = {
      model: config.model,
      messages
    };

    // Use different token parameter based on model
    let maxTokens = 2500;
    if (promptType === 'ask') {
      maxTokens = 4000;
    } else if (promptType === 'auto_solve') {
      maxTokens = 1500;
    }

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

    const response = await fetchWithTimeout(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    }, 30000); // 30 second timeout for AI requests

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI error (${response.status}): ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Check if cached (AI Gateway uses cf-aig-cache-status header)
    data.cached = response.headers.get('cf-aig-cache-status') === 'HIT';

    return data;
  }
}
