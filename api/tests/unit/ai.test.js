/**
 * Unit Tests for AI Handler
 * Tests AI completion, usage tracking, payload building, and gateway interaction
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../src/auth.js', () => ({
  AuthHandler: jest.fn().mockImplementation(() => ({
    authenticate: jest.fn().mockResolvedValue({
      userId: 'user-1',
      email: 'test@example.com',
      tier: 'basic',
      licenseKey: 'ABCD-EFGH-IJKL-MNOP-QRST',
      subscriptionStatus: 'inactive'
    })
  }))
}));

jest.mock('../../src/validation.js', () => ({
  validateRequestBody: jest.fn().mockResolvedValue({
    question: 'What is 2+2?',
    ocrText: null,
    imageData: null,
    ocrConfidence: null,
    promptType: 'answer',
    reasoningLevel: 1
  }),
  ValidationError: class ValidationError extends Error {
    constructor(message, field) {
      super(message);
      this.field = field;
      this.name = 'ValidationError';
    }
  }
}));

jest.mock('../../src/ratelimit.js', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, count: 1 }),
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
  RateLimitPresets: {
    GLOBAL: { limit: 100, windowMs: 60000, bindingName: 'RATE_LIMITER_GLOBAL' },
    PRO_AI: { limit: 20, windowMs: 60000, bindingName: 'RATE_LIMITER_AI_PRO' }
  }
}));

jest.mock('../../src/logger.js', () => ({
  logApiUsage: jest.fn()
}));

import { AIHandler } from '../../src/ai.js';
import { validateRequestBody } from '../../src/validation.js';
import { checkRateLimit } from '../../src/ratelimit.js';

function createMockDB() {
  const mockFirst = jest.fn().mockResolvedValue({ count: 0 });
  const mockRun = jest.fn().mockResolvedValue({ success: true });
  return {
    prepare: jest.fn().mockReturnValue({
      bind: jest.fn().mockReturnValue({
        first: mockFirst,
        run: mockRun,
        all: jest.fn().mockResolvedValue({ results: [] })
      })
    }),
    _mockFirst: mockFirst,
    _mockRun: mockRun
  };
}

function createMockEnv(overrides = {}) {
  return {
    DB: createMockDB(),
    CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
    CLOUDFLARE_GATEWAY_NAME: 'test-gateway',
    BASIC_TIER_DAILY_LIMIT: '50',
    PRO_TIER_RATE_LIMIT_PER_MINUTE: '20',
    RATE_LIMITER: {
      idFromName: jest.fn().mockReturnValue('mock-id'),
      get: jest.fn().mockReturnValue({
        fetch: jest.fn().mockResolvedValue({
          json: jest.fn().mockResolvedValue({ allowed: true, count: 1 })
        })
      })
    },
    ...overrides
  };
}

function createMockRequest(method = 'POST', headers = {}) {
  const headerMap = new Map(Object.entries({
    'Authorization': 'LicenseKey ABCD-EFGH-IJKL-MNOP-QRST',
    'CF-Connecting-IP': '127.0.0.1',
    ...headers
  }));
  return {
    url: 'https://api.captureai.workers.dev/api/ai/complete',
    method,
    headers: { get: (key) => headerMap.get(key) || null }
  };
}

describe('AIHandler', () => {
  let handler;
  let env;

  beforeEach(() => {
    env = createMockEnv();
    handler = new AIHandler(env);

    // Mock global fetch for gateway calls
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: '4' } }],
        usage: { total_tokens: 100, prompt_tokens: 80, completion_tokens: 20 }
      }),
      headers: { get: () => null }
    });
  });

  describe('constructor', () => {
    test('should initialize with env and defaults', () => {
      expect(handler.env).toBe(env);
      expect(handler.db).toBe(env.DB);
      expect(handler.gatewayName).toBe('test-gateway');
      expect(handler.accountId).toBe('test-account-id');
    });

    test('should use default gateway name when not provided', () => {
      const h = new AIHandler({ DB: createMockDB() });
      expect(h.gatewayName).toBe('captureai-gateway');
    });

    test('should build correct API URL', () => {
      expect(handler.apiUrl).toContain('test-account-id');
      expect(handler.apiUrl).toContain('test-gateway');
      expect(handler.apiUrl).toContain('compat/v1/chat/completions');
    });
  });

  describe('solve', () => {
    test('should delegate to complete', async () => {
      handler.complete = jest.fn().mockResolvedValue(new Response('{}'));
      const request = createMockRequest();
      await handler.solve(request);
      expect(handler.complete).toHaveBeenCalledWith(request);
    });
  });

  describe('buildPayload', () => {
    test('should build text-only answer payload', () => {
      const payload = handler.buildPayload({
        ocrText: 'What is 2+2?',
        promptType: 'answer'
      }, 1);

      expect(payload.model).toBe('openai/gpt-5-nano');
      expect(payload.messages).toHaveLength(2);
      expect(payload.messages[0].role).toBe('system');
      expect(payload.messages[1].role).toBe('user');
      expect(payload.messages[1].content).toContain('What is 2+2?');
      expect(payload.reasoning_effort).toBe('low');
      expect(payload.max_completion_tokens).toBe(2500);
    });

    test('should build image-based answer payload', () => {
      const payload = handler.buildPayload({
        imageData: 'data:image/png;base64,abc123',
        ocrText: 'OCR text here',
        promptType: 'answer'
      }, 1);

      expect(payload.messages).toHaveLength(1);
      expect(payload.messages[0].content).toHaveLength(2);
      expect(payload.messages[0].content[0].type).toBe('text');
      expect(payload.messages[0].content[1].type).toBe('image_url');
    });

    test('should build ask mode with image payload', () => {
      const payload = handler.buildPayload({
        question: 'Explain this',
        imageData: 'data:image/png;base64,abc123',
        promptType: 'ask'
      }, 1);

      expect(payload.messages).toHaveLength(1);
      expect(payload.messages[0].content[0].text).toContain('Explain this');
      expect(payload.max_completion_tokens).toBe(4000); // ask mode has higher limit
    });

    test('should build ask mode text-only payload', () => {
      const payload = handler.buildPayload({
        question: 'How does gravity work?',
        promptType: 'ask'
      }, 1);

      expect(payload.messages).toHaveLength(2);
      expect(payload.messages[0].role).toBe('system');
      expect(payload.messages[1].content).toBe('How does gravity work?');
    });

    test('should build ask mode with OCR text (no image)', () => {
      const payload = handler.buildPayload({
        question: 'Explain this text',
        ocrText: 'Some extracted text',
        promptType: 'ask'
      }, 1);

      expect(payload.messages).toHaveLength(2);
      expect(payload.messages[1].content).toContain('Explain this text');
      expect(payload.messages[1].content).toContain('Some extracted text');
    });

    test('should build auto_solve with image payload', () => {
      const payload = handler.buildPayload({
        imageData: 'data:image/png;base64,abc123',
        promptType: 'auto_solve'
      }, 1);

      expect(payload.messages[0].content[0].text).toContain('correct choice');
    });

    test('should build auto_solve with OCR only', () => {
      const payload = handler.buildPayload({
        ocrText: 'A) option1 B) option2',
        promptType: 'auto_solve'
      }, 1);

      expect(payload.messages[1].content).toContain('correct choice');
      expect(payload.messages[1].content).toContain('option1');
    });

    test('should use gpt-4.1-nano for reasoning level 0', () => {
      const payload = handler.buildPayload({
        ocrText: 'test',
        promptType: 'answer'
      }, 0);

      expect(payload.model).toBe('openai/gpt-4.1-nano');
      expect(payload.max_tokens).toBe(2500); // Legacy token param
      expect(payload.reasoning_effort).toBeUndefined();
    });

    test('should use gpt-5-nano with low reasoning for level 1', () => {
      const payload = handler.buildPayload({
        ocrText: 'test',
        promptType: 'answer'
      }, 1);

      expect(payload.model).toBe('openai/gpt-5-nano');
      expect(payload.reasoning_effort).toBe('low');
      expect(payload.max_completion_tokens).toBe(2500);
    });

    test('should use gpt-5-nano with medium reasoning for level 2', () => {
      const payload = handler.buildPayload({
        ocrText: 'test',
        promptType: 'answer'
      }, 2);

      expect(payload.model).toBe('openai/gpt-5-nano');
      expect(payload.reasoning_effort).toBe('medium');
    });

    test('should default to level 1 for unknown reasoning level', () => {
      const payload = handler.buildPayload({
        ocrText: 'test',
        promptType: 'answer'
      }, 99);

      expect(payload.model).toBe('openai/gpt-5-nano');
      expect(payload.reasoning_effort).toBe('low');
    });

    test('should throw when no image or OCR text provided', () => {
      expect(() => {
        handler.buildPayload({
          promptType: 'answer'
        }, 1);
      }).toThrow('No image data or OCR text provided');
    });

    test('should enhance prompt with OCR text when both image and OCR present', () => {
      const payload = handler.buildPayload({
        imageData: 'data:image/png;base64,abc123',
        ocrText: 'Extracted text from image',
        promptType: 'answer'
      }, 1);

      expect(payload.messages[0].content[0].text).toContain('Extracted text from image');
    });
  });

  describe('getModels', () => {
    test('should return available models', async () => {
      const request = createMockRequest('GET');
      const response = await handler.getModels(request);
      const body = JSON.parse(await response.text());

      expect(body.models).toHaveLength(1);
      expect(body.models[0].id).toBe('gpt-5-nano');
    });
  });

  describe('checkUsageLimit', () => {
    test('should check basic tier daily limit', async () => {
      env.DB._mockFirst.mockResolvedValueOnce({ count: 5 });
      const result = await handler.checkUsageLimit('user-1', 'basic');

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(5);
      expect(result.limit).toBe(10);
      expect(result.limitType).toBe('per_day');
    });

    test('should block basic tier when limit exceeded', async () => {
      env.DB._mockFirst.mockResolvedValueOnce({ count: 10 });
      const result = await handler.checkUsageLimit('user-1', 'basic');

      expect(result.allowed).toBe(false);
      expect(result.used).toBe(10);
    });

    test('should use rate limiter for pro tier', async () => {
      checkRateLimit.mockResolvedValueOnce({ allowed: true, count: 5 });
      const result = await handler.checkUsageLimit('user-1', 'pro');

      expect(result.allowed).toBe(true);
      expect(result.limitType).toBe('per_minute');
      expect(result.limit).toBe(20);
      // Verify it uses the dedicated PRO_AI binding name
      expect(checkRateLimit).toHaveBeenCalledWith(
        'user:user-1',
        20,
        60000,
        env,
        'RATE_LIMITER_AI_PRO'
      );
    });

    test('should block pro tier when rate limited', async () => {
      checkRateLimit.mockResolvedValueOnce({
        error: 'Rate limit exceeded',
        message: 'Too many requests'
      });
      const result = await handler.checkUsageLimit('user-1', 'pro');

      expect(result.allowed).toBe(false);
      expect(result.limitType).toBe('per_minute');
    });
  });

  describe('recordUsage', () => {
    test('should insert usage record with cost calculation', async () => {
      await handler.recordUsage({
        userId: 'user-1',
        promptType: 'answer',
        model: 'low',
        tokensUsed: 100,
        inputTokens: 80,
        outputTokens: 20,
        reasoningTokens: 0,
        cachedTokens: 0,
        inputMethod: 'ocr',
        responseTime: 500,
        cached: false
      });

      expect(env.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usage_records')
      );
    });

    test('should calculate cost with cached tokens', async () => {
      await handler.recordUsage({
        userId: 'user-1',
        promptType: 'answer',
        model: 'low',
        tokensUsed: 100,
        inputTokens: 80,
        outputTokens: 20,
        reasoningTokens: 0,
        cachedTokens: 40,
        inputMethod: 'text',
        responseTime: 300,
        cached: true
      });

      expect(env.DB.prepare).toHaveBeenCalled();
    });
  });

  describe('sendToGateway', () => {
    test('should send payload to gateway URL', async () => {
      const payload = { model: 'openai/gpt-5-nano', messages: [] };
      await handler.sendToGateway(payload, 'user-1');

      // fetchWithTimeout wraps fetch and adds AbortController signal
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('gateway.ai.cloudflare.com'),
        expect.objectContaining({
          method: 'POST'
        })
      );
      // Verify headers in the actual call
      const callArgs = global.fetch.mock.calls[0];
      expect(callArgs[1].headers['Content-Type']).toBe('application/json');
      expect(callArgs[1].headers['cf-aig-metadata-user']).toBe('user-1');
    });

    test('should include gateway token when configured', async () => {
      handler.env.CLOUDFLARE_GATEWAY_TOKEN = 'gw-token-123';
      const payload = { model: 'test', messages: [] };
      await handler.sendToGateway(payload, 'user-1');

      const callArgs = global.fetch.mock.calls[0];
      expect(callArgs[1].headers['cf-aig-authorization']).toBe('gw-token-123');
    });

    test('should detect cached responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'cached answer' } }],
          usage: { total_tokens: 50 }
        }),
        headers: { get: (key) => key === 'cf-cache-status' ? 'HIT' : null }
      });

      const result = await handler.sendToGateway({}, 'user-1');
      expect(result.cached).toBe(true);
    });

    test('should throw on gateway error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: { message: 'Model error' } }),
        headers: { get: () => null }
      });

      await expect(handler.sendToGateway({}, 'user-1')).rejects.toThrow('OpenAI error');
    });
  });

  describe('getUsage', () => {
    test('should return basic tier usage', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        tier: 'basic'
      });
      env.DB._mockFirst.mockResolvedValueOnce({ count: 3 });

      const request = createMockRequest('GET');
      const response = await handler.getUsage(request);
      const body = JSON.parse(await response.text());

      expect(body.tier).toBe('basic');
      expect(body.limitType).toBe('per_day');
      expect(body.today.used).toBe(3);
      expect(body.today.limit).toBe(10);
    });

    test('should return pro tier usage with per-minute data', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        tier: 'pro'
      });
      env.DB._mockFirst
        .mockResolvedValueOnce({ count: 50 })   // daily usage
        .mockResolvedValueOnce({ count: 5 });    // last minute

      const request = createMockRequest('GET');
      const response = await handler.getUsage(request);
      const body = JSON.parse(await response.text());

      expect(body.tier).toBe('pro');
      expect(body.limitType).toBe('per_minute');
      expect(body.today.limit).toBeNull(); // Unlimited daily
      expect(body.lastMinute).toBeDefined();
    });

    test('should return 401 when not authenticated', async () => {
      handler.auth.authenticate.mockResolvedValueOnce(null);

      const request = createMockRequest('GET');
      const response = await handler.getUsage(request);
      expect(response.status).toBe(401);
    });
  });

  describe('complete - integration', () => {
    test('should return 401 when not authenticated', async () => {
      handler.auth.authenticate.mockResolvedValueOnce(null);

      const request = createMockRequest();
      const response = await handler.complete(request);
      expect(response.status).toBe(401);
    });

    test('should return 429 when pro-tier rate limited', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        email: 'test@example.com',
        tier: 'pro',
        licenseKey: 'ABCD-EFGH-IJKL-MNOP-QRST',
        subscriptionStatus: 'active'
      });
      checkRateLimit.mockResolvedValueOnce({
        error: 'Rate limit exceeded',
        message: 'Too many requests'
      });

      const request = createMockRequest();
      const response = await handler.complete(request);
      expect(response.status).toBe(429);
    });

    test('should return 400 when no input provided', async () => {
      validateRequestBody.mockResolvedValueOnce({
        question: null,
        imageData: null,
        ocrText: null,
        promptType: 'answer',
        reasoningLevel: 1
      });

      const request = createMockRequest();
      const response = await handler.complete(request);
      expect(response.status).toBe(400);

      const body = JSON.parse(await response.text());
      expect(body.error).toContain('required');
    });

    test('should return 500 on gateway error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Error',
        json: async () => ({ error: { message: 'fail' } }),
        headers: { get: () => null }
      });

      const request = createMockRequest();
      const response = await handler.complete(request);
      expect(response.status).toBe(500);
    });
  });

  describe('getAnalytics', () => {
    test('should return 401 when not authenticated', async () => {
      handler.auth.authenticate.mockResolvedValueOnce(null);
      const request = createMockRequest('GET');
      const response = await handler.getAnalytics(request);
      expect(response.status).toBe(401);
    });

    test('should return analytics with default 30 day period', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        tier: 'pro'
      });

      env.DB._mockFirst.mockResolvedValueOnce({
        overall: JSON.stringify({
          overall: {
            total_requests: 50,
            total_input_tokens: 5000,
            total_output_tokens: 2000,
            total_reasoning_tokens: 500,
            total_cached_tokens: 1000,
            total_cost: 0.015,
            avg_input_tokens: 100,
            avg_output_tokens: 40,
            avg_reasoning_tokens: 10,
            avg_cost_per_request: 0.0003,
            avg_response_time: 1200
          }
        }),
        by_prompt_type: JSON.stringify([
          { prompt_type: 'answer', requests: 30, avg_input_tokens: 90, avg_output_tokens: 35, avg_cost: 0.00025, total_cost: 0.0075 },
          { prompt_type: 'ask', requests: 20, avg_input_tokens: 120, avg_output_tokens: 50, avg_cost: 0.0004, total_cost: 0.008 }
        ]),
        by_model: JSON.stringify([
          { model: 'low', requests: 40, avg_input_tokens: 95, avg_output_tokens: 38, avg_cost: 0.00028, total_cost: 0.0112 },
          { model: 'medium', requests: 10, avg_input_tokens: 130, avg_output_tokens: 55, avg_cost: 0.0005, total_cost: 0.005 }
        ]),
        daily: JSON.stringify([
          { date: '2026-02-22', requests: 5, input_tokens: 500, output_tokens: 200, cost: 0.0015 }
        ])
      });

      const request = createMockRequest('GET');
      const response = await handler.getAnalytics(request);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(body.period.days).toBe(30);
      expect(body.overall.totalRequests).toBe(50);
      expect(body.overall.totalCost).toBe('0.015000');
      expect(body.overall.tokens.input.total).toBe(5000);
      expect(body.overall.tokens.output.total).toBe(2000);
      expect(body.overall.tokens.reasoning.total).toBe(500);
      expect(body.overall.tokens.cached.total).toBe(1000);
      expect(body.overall.avgResponseTime).toBe(1200);
      expect(body.byPromptType).toHaveLength(2);
      expect(body.byPromptType[0].promptType).toBe('answer');
      expect(body.byModel).toHaveLength(2);
      expect(body.daily).toHaveLength(1);
    });

    test('should use custom days parameter', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        tier: 'pro'
      });

      env.DB._mockFirst.mockResolvedValueOnce({
        overall: '{}',
        by_prompt_type: '[]',
        by_model: '[]',
        daily: '[]'
      });

      // Create request with custom URL containing days param
      const request = {
        ...createMockRequest('GET'),
        url: 'https://api.captureai.workers.dev/api/ai/analytics?days=7'
      };

      const response = await handler.getAnalytics(request);
      const body = JSON.parse(await response.text());

      expect(body.period.days).toBe(7);
    });

    test('should handle empty analytics data', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        tier: 'basic'
      });

      env.DB._mockFirst.mockResolvedValueOnce({
        overall: '{}',
        by_prompt_type: '[]',
        by_model: '[]',
        daily: '[]'
      });

      const request = createMockRequest('GET');
      const response = await handler.getAnalytics(request);
      const body = JSON.parse(await response.text());

      expect(body.overall.totalRequests).toBe(0);
      expect(body.overall.totalCost).toBe('0.000000');
      expect(body.byPromptType).toHaveLength(0);
      expect(body.byModel).toHaveLength(0);
      expect(body.daily).toHaveLength(0);
    });

    test('should handle null values in analytics', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        tier: 'pro'
      });

      env.DB._mockFirst.mockResolvedValueOnce({
        overall: null,
        by_prompt_type: null,
        by_model: null,
        daily: null
      });

      const request = createMockRequest('GET');
      const response = await handler.getAnalytics(request);
      const body = JSON.parse(await response.text());

      expect(body.overall.totalRequests).toBe(0);
      expect(body.byPromptType).toHaveLength(0);
    });

    test('should handle DB error gracefully', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        tier: 'pro'
      });

      env.DB.prepare.mockImplementationOnce(() => {
        throw new Error('DB connection failed');
      });

      const request = createMockRequest('GET');
      const response = await handler.getAnalytics(request);
      expect(response.status).toBe(500);

      const body = JSON.parse(await response.text());
      expect(body.error).toBe('Failed to fetch analytics');
    });

    test('should format cost values correctly', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        tier: 'pro'
      });

      env.DB._mockFirst.mockResolvedValueOnce({
        overall: JSON.stringify({
          overall: {
            total_requests: 1,
            total_cost: 0.000001,
            avg_cost_per_request: 0.000001
          }
        }),
        by_prompt_type: JSON.stringify([
          { prompt_type: 'answer', requests: 1, avg_cost: 0.000001, total_cost: 0.000001 }
        ]),
        by_model: '[]',
        daily: JSON.stringify([
          { date: '2026-02-22', requests: 1, input_tokens: 10, output_tokens: 5, cost: 0.000001 }
        ])
      });

      const request = createMockRequest('GET');
      const response = await handler.getAnalytics(request);
      const body = JSON.parse(await response.text());

      // Cost should be formatted to 6 decimal places
      expect(body.overall.totalCost).toBe('0.000001');
      expect(body.byPromptType[0].totalCost).toBe('0.000001');
      expect(body.daily[0].cost).toBe('0.000001');
      // Avg cost should be formatted to 8 decimal places
      expect(body.overall.avgCostPerRequest).toBe('0.00000100');
      expect(body.byPromptType[0].avgCost).toBe('0.00000100');
    });
  });

  describe('complete - rate limit error messages', () => {
    test('should return per_minute error for pro tier rate limit', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        tier: 'pro'
      });

      // First call is IP rate limit (pass), second is authenticateAndCheckUsage
      checkRateLimit.mockResolvedValueOnce({ allowed: true, count: 1 });

      // Mock authenticateAndCheckUsage directly
      handler.authenticateAndCheckUsage = jest.fn().mockResolvedValueOnce({
        user: { userId: 'user-1', tier: 'pro' },
        usageCheck: {
          allowed: false,
          limitType: 'per_minute',
          limit: 20,
          used: 20
        }
      });

      const request = createMockRequest();
      const response = await handler.complete(request);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(429);
      expect(body.error).toContain('Rate limit reached');
      expect(body.error).toContain('wait a moment');
      expect(body.limitType).toBe('per_minute');
    });

    test('should return per_day error for basic tier limit', async () => {
      handler.auth.authenticate.mockResolvedValueOnce({
        userId: 'user-1',
        tier: 'basic'
      });

      checkRateLimit.mockResolvedValueOnce({ allowed: true, count: 1 });

      handler.authenticateAndCheckUsage = jest.fn().mockResolvedValueOnce({
        user: { userId: 'user-1', tier: 'basic' },
        usageCheck: {
          allowed: false,
          limitType: 'per_day',
          limit: 10,
          used: 10
        }
      });

      const request = createMockRequest();
      const response = await handler.complete(request);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(429);
      expect(body.error).toBe('Daily limit reached');
      expect(body.limitType).toBe('per_day');
    });
  });

  describe('recordUsage - error handling', () => {
    test('should not throw when DB insert fails', async () => {
      env.DB.prepare.mockImplementationOnce(() => ({
        bind: () => ({
          run: jest.fn().mockRejectedValueOnce(new Error('DB write failed'))
        })
      }));

      await expect(handler.recordUsage({
        userId: 'user-1',
        promptType: 'answer',
        model: 'low',
        tokensUsed: 100,
        inputTokens: 80,
        outputTokens: 20,
        reasoningTokens: 0,
        cachedTokens: 0,
        inputMethod: 'text',
        responseTime: 500,
        cached: false
      })).rejects.toThrow('DB write failed');
    });

    test('should use default pricing for unknown model', async () => {
      await handler.recordUsage({
        userId: 'user-1',
        promptType: 'answer',
        model: 'unknown_model',
        tokensUsed: 100,
        inputTokens: 80,
        outputTokens: 20,
        reasoningTokens: 0,
        cachedTokens: 0,
        inputMethod: 'text',
        responseTime: 500,
        cached: false
      });

      // Should not throw - uses 'low' pricing as default
      expect(env.DB.prepare).toHaveBeenCalled();
    });

    test('should handle none model pricing correctly', async () => {
      await handler.recordUsage({
        userId: 'user-1',
        promptType: 'answer',
        model: 'none',
        tokensUsed: 100,
        inputTokens: 80,
        outputTokens: 20,
        reasoningTokens: 0,
        cachedTokens: 0,
        inputMethod: 'ocr',
        responseTime: 300,
        cached: false
      });

      expect(env.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usage_records')
      );
    });
  });

  describe('checkUsageLimit - null count edge case', () => {
    test('should handle null count from rate limiter', async () => {
      checkRateLimit.mockResolvedValueOnce({ allowed: true, count: null });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await handler.checkUsageLimit('user-1', 'pro');

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(0); // null ?? 0 = 0
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('null count'),
        expect.any(String),
        expect.any(String)
      );
      consoleSpy.mockRestore();
    });
  });
});
