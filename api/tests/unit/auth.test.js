/**
 * Unit Tests for AuthHandler
 *
 * Comprehensive tests for license key authentication,
 * user management, and email sending in the CaptureAI API backend.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { AuthHandler } from '../../src/auth.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../src/ratelimit.js', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, count: 0 }),
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
  RateLimitPresets: {
    LICENSE_VALIDATION: { limit: 10, windowMs: 60000 },
    FREE_KEY_CREATION: { limit: 3, windowMs: 3600000 }
  }
}));

jest.mock('../../src/validation.js', () => {
  class ValidationError extends Error {
    constructor(message, field = null) {
      super(message);
      this.name = 'ValidationError';
      this.field = field;
    }
  }

  return {
    ValidationError,
    validateRequestBody: jest.fn().mockResolvedValue({}),
    validateEmail: jest.fn().mockImplementation((email) => email.trim().toLowerCase()),
    validateLicenseKey: jest.fn().mockImplementation((key) => key.replace(/\s+/g, '').toUpperCase())
  };
});

jest.mock('../../src/logger.js', () => ({
  logAuth: jest.fn(),
  logLicenseCreation: jest.fn(),
  logValidationError: jest.fn()
}));

jest.mock('../../src/utils.js', () => ({
  jsonResponse: jest.fn((data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }),
  parseJSON: jest.fn(),
  generateUUID: jest.fn().mockReturnValue('test-uuid-1234'),
  fetchWithTimeout: jest.fn()
}));

// Import mocked modules for per-test configuration
import { checkRateLimit, getClientIdentifier } from '../../src/ratelimit.js';
import { validateRequestBody, validateEmail, validateLicenseKey, ValidationError } from '../../src/validation.js';
import { logAuth, logLicenseCreation, logValidationError } from '../../src/logger.js';
import { jsonResponse, generateUUID, fetchWithTimeout } from '../../src/utils.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a mock D1 database with configurable responses per query pattern
 */
function createMockDB() {
  const responses = new Map();

  const db = {
    _responses: responses,

    setResponse(pattern, response) {
      responses.set(pattern, response);
    },

    reset() {
      responses.clear();
    },

    prepare: jest.fn(function (sql) {
      const statement = {
        _sql: sql,
        _bindings: [],

        bind: jest.fn(function (...params) {
          statement._bindings = params;
          return statement;
        }),

        first: jest.fn(async function () {
          for (const [pattern, resp] of responses) {
            if (sql.includes(pattern)) {
              return resp;
            }
          }
          return null;
        }),

        run: jest.fn(async function () {
          return { success: true, meta: { changes: 1 } };
        }),

        all: jest.fn(async function () {
          for (const [pattern, resp] of responses) {
            if (sql.includes(pattern)) {
              return { results: Array.isArray(resp) ? resp : [resp] };
            }
          }
          return { results: [] };
        })
      };

      return statement;
    })
  };

  return db;
}

/**
 * Create a mock Request with optional headers and body
 */
function mockRequest(options = {}) {
  const {
    method = 'POST',
    body = null,
    headers = {}
  } = options;

  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has('CF-Connecting-IP')) {
    requestHeaders.set('CF-Connecting-IP', '127.0.0.1');
  }

  return new Request('https://api.captureai.dev/api/auth/test', {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : null
  });
}

/**
 * Create a mock logger with all expected methods
 */
function createMockLogger() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    security: jest.fn(),
    audit: jest.fn()
  };
}

/**
 * Parse the JSON body of a Response
 */
async function parseResponse(response) {
  return JSON.parse(await response.text());
}

/**
 * Sample user record as it would come from D1
 */
const SAMPLE_BASIC_USER = {
  id: 'user-123',
  email: 'test@example.com',
  tier: 'basic',
  license_key: 'ABCD-EFGH-IJKL-MNOP-QRST',
  subscription_status: 'inactive',
  created_at: '2024-01-01T00:00:00.000Z'
};

const SAMPLE_ACTIVE_BASIC_USER = {
  ...SAMPLE_BASIC_USER,
  subscription_status: 'active'
};

const SAMPLE_PRO_USER = {
  id: 'user-456',
  email: 'pro@example.com',
  tier: 'pro',
  license_key: 'WXYZ-1234-5678-ABCD-EFGH',
  subscription_status: 'active',
  created_at: '2024-01-01T00:00:00.000Z'
};

const SAMPLE_PRO_USER_INACTIVE = {
  ...SAMPLE_PRO_USER,
  id: 'user-789',
  subscription_status: 'canceled'
};

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('AuthHandler', () => {
  let db;
  let env;
  let handler;
  let logger;

  beforeEach(() => {
    db = createMockDB();
    logger = createMockLogger();
    env = {
      DB: db,
      RESEND_API_KEY: 'test-resend-key',
      FROM_EMAIL: 'CaptureAI <no-reply@captureai.dev>'
    };
    handler = new AuthHandler(env, logger);

    // Reset all mock implementations to defaults
    checkRateLimit.mockResolvedValue({ allowed: true, count: 0 });
    getClientIdentifier.mockReturnValue('127.0.0.1');
    validateRequestBody.mockResolvedValue({});
    validateEmail.mockImplementation((email) => email.trim().toLowerCase());
    validateLicenseKey.mockImplementation((key) => key.replace(/\s+/g, '').toUpperCase());
    generateUUID.mockReturnValue('test-uuid-1234');
    fetchWithTimeout.mockResolvedValue(
      new Response(JSON.stringify({ id: 'email-123' }), { status: 200 })
    );
  });

  // -------------------------------------------------------------------------
  // constructor
  // -------------------------------------------------------------------------

  describe('constructor', () => {
    test('should store env and db references', () => {
      expect(handler.env).toBe(env);
      expect(handler.db).toBe(db);
    });

    test('should store logger when provided', () => {
      expect(handler.logger).toBe(logger);
    });

    test('should default logger to null when not provided', () => {
      const handlerNoLogger = new AuthHandler(env);
      expect(handlerNoLogger.logger).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // generateLicenseKey
  // -------------------------------------------------------------------------

  describe('generateLicenseKey', () => {
    test('should return a string in XXXX-XXXX-XXXX-XXXX-XXXX format', () => {
      const key = handler.generateLicenseKey();
      const segments = key.split('-');

      expect(segments).toHaveLength(5);
      segments.forEach((segment) => {
        expect(segment).toHaveLength(4);
      });
    });

    test('should only contain valid characters', () => {
      const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const key = handler.generateLicenseKey();
      const charsOnly = key.replace(/-/g, '');

      for (const char of charsOnly) {
        expect(validChars).toContain(char);
      }
    });

    test('should not contain confusing characters (I, O, 0, 1)', () => {
      // Generate multiple keys to increase confidence
      for (let i = 0; i < 20; i++) {
        const key = handler.generateLicenseKey();
        expect(key).not.toMatch(/[IO01]/);
      }
    });

    test('should have exactly 24 characters (20 chars + 4 dashes)', () => {
      const key = handler.generateLicenseKey();
      expect(key).toHaveLength(24);
    });

    test('should produce unique keys on successive calls', () => {
      const keys = new Set();
      for (let i = 0; i < 50; i++) {
        keys.add(handler.generateLicenseKey());
      }
      // Extremely unlikely to get duplicates from a 32^20 keyspace
      expect(keys.size).toBe(50);
    });

    test('should match the full license key regex', () => {
      const key = handler.generateLicenseKey();
      expect(key).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    });
  });

  // -------------------------------------------------------------------------
  // validateKey
  // -------------------------------------------------------------------------

  describe('validateKey', () => {
    test('should return 200 with user data for a valid key', async () => {
      validateRequestBody.mockResolvedValue({ licenseKey: SAMPLE_BASIC_USER.license_key });
      validateLicenseKey.mockReturnValue(SAMPLE_BASIC_USER.license_key);
      db.setResponse('SELECT * FROM users WHERE license_key', SAMPLE_BASIC_USER);

      const request = mockRequest({ body: { licenseKey: SAMPLE_BASIC_USER.license_key } });
      const response = await handler.validateKey(request);
      const body = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(body.message).toBe('License key validated successfully');
      expect(body.user.id).toBe(SAMPLE_BASIC_USER.id);
      expect(body.user.email).toBe(SAMPLE_BASIC_USER.email);
      expect(body.user.tier).toBe('basic');
      expect(body.user.licenseKey).toBe(SAMPLE_BASIC_USER.license_key);
    });

    test('should log successful authentication', async () => {
      validateRequestBody.mockResolvedValue({ licenseKey: SAMPLE_BASIC_USER.license_key });
      validateLicenseKey.mockReturnValue(SAMPLE_BASIC_USER.license_key);
      db.setResponse('SELECT * FROM users WHERE license_key', SAMPLE_BASIC_USER);

      const request = mockRequest();
      await handler.validateKey(request);

      expect(logAuth).toHaveBeenCalledWith(logger, true, SAMPLE_BASIC_USER.id);
    });

    test('should return 401 for an invalid license key', async () => {
      validateRequestBody.mockResolvedValue({ licenseKey: 'XXXX-XXXX-XXXX-XXXX-XXXX' });
      validateLicenseKey.mockReturnValue('XXXX-XXXX-XXXX-XXXX-XXXX');
      // DB returns null (no user found)

      const request = mockRequest();
      const response = await handler.validateKey(request);
      const body = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(body.error).toBe('Invalid license key');
    });

    test('should log failed authentication for invalid key', async () => {
      validateRequestBody.mockResolvedValue({ licenseKey: 'XXXX-XXXX-XXXX-XXXX-XXXX' });
      validateLicenseKey.mockReturnValue('XXXX-XXXX-XXXX-XXXX-XXXX');

      const request = mockRequest();
      await handler.validateKey(request);

      expect(logAuth).toHaveBeenCalledWith(logger, false, null);
    });

    test('should return 429 when rate limited', async () => {
      checkRateLimit.mockResolvedValue({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again in 30 seconds.',
        retryAfter: 30
      });

      const request = mockRequest();
      const response = await handler.validateKey(request);
      const body = await parseResponse(response);

      expect(response.status).toBe(429);
      expect(body.error).toBe('Rate limit exceeded');
    });

    test('should return 400 for a ValidationError', async () => {
      validateRequestBody.mockResolvedValue({ licenseKey: 'bad' });
      validateLicenseKey.mockImplementation(() => {
        throw new ValidationError('Invalid license key format', 'licenseKey');
      });

      const request = mockRequest();
      const response = await handler.validateKey(request);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid license key format');
      expect(body.field).toBe('licenseKey');
    });

    test('should log ValidationError details', async () => {
      const validationErr = new ValidationError('License key is required', 'licenseKey');
      validateRequestBody.mockResolvedValue({ licenseKey: '' });
      validateLicenseKey.mockImplementation(() => { throw validationErr; });

      const request = mockRequest();
      await handler.validateKey(request);

      expect(logValidationError).toHaveBeenCalledWith(logger, 'licenseKey', validationErr);
    });

    test('should return 500 for unexpected DB errors', async () => {
      validateRequestBody.mockResolvedValue({ licenseKey: 'ABCD-EFGH-IJKL-MNOP-QRST' });
      validateLicenseKey.mockReturnValue('ABCD-EFGH-IJKL-MNOP-QRST');
      db.prepare.mockImplementation(() => { throw new Error('DB connection lost'); });

      const request = mockRequest();
      const response = await handler.validateKey(request);
      const body = await parseResponse(response);

      expect(response.status).toBe(500);
      expect(body.error).toBe('Validation failed');
    });

    test('should not log auth when no logger is provided', async () => {
      const handlerNoLogger = new AuthHandler(env);
      validateRequestBody.mockResolvedValue({ licenseKey: 'XXXX-XXXX-XXXX-XXXX-XXXX' });
      validateLicenseKey.mockReturnValue('XXXX-XXXX-XXXX-XXXX-XXXX');

      const request = mockRequest();
      await handlerNoLogger.validateKey(request);

      // logAuth should not be called since logger is null
      expect(logAuth).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // getUserByLicenseKey
  // -------------------------------------------------------------------------

  describe('getUserByLicenseKey', () => {
    test('should return user when found', async () => {
      db.setResponse('SELECT * FROM users WHERE license_key', SAMPLE_BASIC_USER);

      const user = await handler.getUserByLicenseKey('ABCD-EFGH-IJKL-MNOP-QRST');
      expect(user).toEqual(SAMPLE_BASIC_USER);
    });

    test('should return null when user not found', async () => {
      // DB returns null by default (no response set)
      const user = await handler.getUserByLicenseKey('XXXX-XXXX-XXXX-XXXX-XXXX');
      expect(user).toBeNull();
    });

    test('should normalize key by trimming whitespace', async () => {
      db.setResponse('SELECT * FROM users WHERE license_key', SAMPLE_BASIC_USER);

      await handler.getUserByLicenseKey('  ABCD-EFGH-IJKL-MNOP-QRST  ');

      const bindCall = db.prepare.mock.results[0].value.bind;
      expect(bindCall).toHaveBeenCalledWith('ABCD-EFGH-IJKL-MNOP-QRST');
    });

    test('should normalize key to uppercase', async () => {
      db.setResponse('SELECT * FROM users WHERE license_key', SAMPLE_BASIC_USER);

      await handler.getUserByLicenseKey('abcd-efgh-ijkl-mnop-qrst');

      const bindCall = db.prepare.mock.results[0].value.bind;
      expect(bindCall).toHaveBeenCalledWith('ABCD-EFGH-IJKL-MNOP-QRST');
    });

    test('should return null on database error', async () => {
      db.prepare.mockImplementation(() => {
        throw new Error('DB error');
      });

      const user = await handler.getUserByLicenseKey('ABCD-EFGH-IJKL-MNOP-QRST');
      expect(user).toBeNull();
    });

    test('should strip internal whitespace from key', async () => {
      db.setResponse('SELECT * FROM users WHERE license_key', SAMPLE_BASIC_USER);

      await handler.getUserByLicenseKey('ABCD - EFGH - IJKL - MNOP - QRST');

      const bindCall = db.prepare.mock.results[0].value.bind;
      expect(bindCall).toHaveBeenCalledWith('ABCD-EFGH-IJKL-MNOP-QRST');
    });
  });

  // -------------------------------------------------------------------------
  // authenticate
  // -------------------------------------------------------------------------

  describe('authenticate', () => {
    test('should return user data for valid Authorization header', async () => {
      db.setResponse('SELECT * FROM users WHERE license_key', SAMPLE_ACTIVE_BASIC_USER);

      const request = mockRequest({
        headers: { Authorization: `LicenseKey ${SAMPLE_ACTIVE_BASIC_USER.license_key}` }
      });
      const user = await handler.authenticate(request);

      expect(user).toEqual({
        userId: SAMPLE_ACTIVE_BASIC_USER.id,
        email: SAMPLE_ACTIVE_BASIC_USER.email,
        tier: 'basic',
        licenseKey: SAMPLE_ACTIVE_BASIC_USER.license_key,
        subscriptionStatus: 'active'
      });
    });

    test('should return null when Authorization header is missing', async () => {
      const request = mockRequest({ headers: {} });
      const user = await handler.authenticate(request);
      expect(user).toBeNull();
    });

    test('should return null when Authorization header has wrong prefix', async () => {
      const request = mockRequest({
        headers: { Authorization: 'Bearer some-token' }
      });
      const user = await handler.authenticate(request);
      expect(user).toBeNull();
    });

    test('should return null when user not found in DB', async () => {
      // No response set, DB returns null
      const request = mockRequest({
        headers: { Authorization: 'LicenseKey XXXX-XXXX-XXXX-XXXX-XXXX' }
      });
      const user = await handler.authenticate(request);
      expect(user).toBeNull();
    });

    test('should return null for pro user with inactive subscription', async () => {
      db.setResponse('SELECT * FROM users WHERE license_key', SAMPLE_PRO_USER_INACTIVE);

      const request = mockRequest({
        headers: { Authorization: `LicenseKey ${SAMPLE_PRO_USER_INACTIVE.license_key}` }
      });
      const user = await handler.authenticate(request);
      expect(user).toBeNull();
    });

    test('should log security event for user with non-active subscription', async () => {
      db.setResponse('SELECT * FROM users WHERE license_key', SAMPLE_PRO_USER_INACTIVE);

      const request = mockRequest({
        headers: { Authorization: `LicenseKey ${SAMPLE_PRO_USER_INACTIVE.license_key}` }
      });
      await handler.authenticate(request);

      expect(logger.security).toHaveBeenCalledWith(
        'User with non-active subscription attempted access',
        expect.objectContaining({
          userId: SAMPLE_PRO_USER_INACTIVE.id,
          subscriptionStatus: 'canceled'
        })
      );
    });

    test('should clamp past_due user to basic tier regardless of stored tier', async () => {
      const pastDueProUser = { ...SAMPLE_PRO_USER, subscription_status: 'past_due' };
      db.setResponse('SELECT * FROM users WHERE license_key', pastDueProUser);

      const request = mockRequest({
        headers: { Authorization: `LicenseKey ${pastDueProUser.license_key}` }
      });
      const user = await handler.authenticate(request);

      expect(user).not.toBeNull();
      expect(user.tier).toBe('basic');
      expect(user.subscriptionStatus).toBe('past_due');
    });

    test('should deny access for any unexpected subscription status', async () => {
      const unknownStatusUser = { ...SAMPLE_PRO_USER, subscription_status: 'trialing' };
      db.setResponse('SELECT * FROM users WHERE license_key', unknownStatusUser);

      const request = mockRequest({
        headers: { Authorization: `LicenseKey ${unknownStatusUser.license_key}` }
      });
      const user = await handler.authenticate(request);

      expect(user).toBeNull();
    });

    test('should return user data for pro user with active subscription', async () => {
      db.setResponse('SELECT * FROM users WHERE license_key', SAMPLE_PRO_USER);

      const request = mockRequest({
        headers: { Authorization: `LicenseKey ${SAMPLE_PRO_USER.license_key}` }
      });
      const user = await handler.authenticate(request);

      expect(user).not.toBeNull();
      expect(user.tier).toBe('pro');
      expect(user.subscriptionStatus).toBe('active');
    });

    test('should return null on unexpected error', async () => {
      db.prepare.mockImplementation(() => {
        throw new Error('Connection refused');
      });

      const request = mockRequest({
        headers: { Authorization: 'LicenseKey ABCD-EFGH-IJKL-MNOP-QRST' }
      });
      const user = await handler.authenticate(request);
      expect(user).toBeNull();
    });

    test('should extract license key after "LicenseKey " prefix (11 chars)', async () => {
      db.setResponse('SELECT * FROM users WHERE license_key', SAMPLE_BASIC_USER);

      const key = 'ABCD-EFGH-IJKL-MNOP-QRST';
      const request = mockRequest({
        headers: { Authorization: `LicenseKey ${key}` }
      });
      await handler.authenticate(request);

      // Verify the key passed to getUserByLicenseKey
      const bindCall = db.prepare.mock.results[0].value.bind;
      expect(bindCall).toHaveBeenCalledWith(key.toUpperCase());
    });

    test('should not log security event when no logger is provided', async () => {
      const handlerNoLogger = new AuthHandler(env);
      db.setResponse('SELECT * FROM users WHERE license_key', SAMPLE_PRO_USER_INACTIVE);

      const request = mockRequest({
        headers: { Authorization: `LicenseKey ${SAMPLE_PRO_USER_INACTIVE.license_key}` }
      });
      await handlerNoLogger.authenticate(request);

      expect(logger.security).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // getCurrentUser
  // -------------------------------------------------------------------------

  describe('getCurrentUser', () => {
    test('should return full user data for authenticated user', async () => {
      db.setResponse('SELECT * FROM users WHERE license_key', SAMPLE_ACTIVE_BASIC_USER);
      db.setResponse('SELECT id, email, tier, license_key', SAMPLE_ACTIVE_BASIC_USER);

      const request = mockRequest({
        headers: { Authorization: `LicenseKey ${SAMPLE_ACTIVE_BASIC_USER.license_key}` }
      });
      const response = await handler.getCurrentUser(request);
      const body = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(body.id).toBe(SAMPLE_ACTIVE_BASIC_USER.id);
      expect(body.email).toBe(SAMPLE_ACTIVE_BASIC_USER.email);
      expect(body.tier).toBe('basic');
      expect(body.licenseKey).toBe(SAMPLE_ACTIVE_BASIC_USER.license_key);
      expect(body.createdAt).toBe(SAMPLE_ACTIVE_BASIC_USER.created_at);
    });

    test('should return 401 when not authenticated', async () => {
      const request = mockRequest({ headers: {} });
      const response = await handler.getCurrentUser(request);
      const body = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(body.error).toBe('Not authenticated');
    });

    test('should return 404 when user not found in DB after authentication', async () => {
      // First query (authenticate) finds user, second query (full data) returns null
      db.setResponse('SELECT * FROM users WHERE license_key', SAMPLE_ACTIVE_BASIC_USER);
      // Do not set a response for the SELECT id query, so it returns null

      const request = mockRequest({
        headers: { Authorization: `LicenseKey ${SAMPLE_ACTIVE_BASIC_USER.license_key}` }
      });

      // We need the second prepare call to return null. Override prepare to
      // return different results on successive calls.
      let callCount = 0;
      db.prepare.mockImplementation((sql) => {
        callCount++;
        return {
          bind: jest.fn().mockReturnThis(),
          first: jest.fn(async () => {
            // First call: authenticate -> return user
            // Second call: full user data -> return null
            if (callCount === 1) return SAMPLE_ACTIVE_BASIC_USER;
            return null;
          }),
          run: jest.fn(async () => ({ success: true }))
        };
      });

      const response = await handler.getCurrentUser(request);
      const body = await parseResponse(response);

      expect(response.status).toBe(404);
      expect(body.error).toBe('User not found');
    });

    test('should return 500 on unexpected error', async () => {
      // Make authenticate succeed but the DB call inside getCurrentUser fail
      let callCount = 0;
      db.prepare.mockImplementation((sql) => {
        callCount++;
        if (callCount === 1) {
          // authenticate's getUserByLicenseKey
          return {
            bind: jest.fn().mockReturnThis(),
            first: jest.fn(async () => SAMPLE_ACTIVE_BASIC_USER),
            run: jest.fn(async () => ({ success: true }))
          };
        }
        // Second call: throw error
        throw new Error('DB failure');
      });

      const request = mockRequest({
        headers: { Authorization: `LicenseKey ${SAMPLE_ACTIVE_BASIC_USER.license_key}` }
      });
      const response = await handler.getCurrentUser(request);
      const body = await parseResponse(response);

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch user');
    });

    test('should return pro user data for authenticated pro user', async () => {
      db.setResponse('SELECT * FROM users WHERE license_key', SAMPLE_PRO_USER);
      db.setResponse('SELECT id, email, tier, license_key', SAMPLE_PRO_USER);

      const request = mockRequest({
        headers: { Authorization: `LicenseKey ${SAMPLE_PRO_USER.license_key}` }
      });
      const response = await handler.getCurrentUser(request);
      const body = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(body.tier).toBe('pro');
      expect(body.subscriptionStatus).toBe('active');
    });
  });


  // -------------------------------------------------------------------------
  // sendLicenseKeyEmail
  // -------------------------------------------------------------------------

  describe('sendLicenseKeyEmail', () => {
    test('should send basic tier email via Resend', async () => {
      const result = await handler.sendLicenseKeyEmail('user@test.com', 'ABCD-1234-EFGH-5678-IJKL', 'basic');

      expect(result).toBe(true);
      expect(fetchWithTimeout).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String)
        }),
        5000
      );
    });

    test('should send pro tier email with correct subject', async () => {
      const result = await handler.sendLicenseKeyEmail('pro@test.com', 'WXYZ-1234-5678-ABCD-EFGH', 'pro');

      expect(result).toBe(true);

      const callBody = JSON.parse(fetchWithTimeout.mock.calls[0][1].body);
      expect(callBody.subject).toBe('Your CaptureAI Pro License Key');
    });

    test('should send basic tier email with correct subject', async () => {
      await handler.sendLicenseKeyEmail('user@test.com', 'ABCD-1234-EFGH-5678-IJKL', 'basic');

      const callBody = JSON.parse(fetchWithTimeout.mock.calls[0][1].body);
      expect(callBody.subject).toBe('Your CaptureAI Basic License Key');
    });

    test('should return false when RESEND_API_KEY is not configured', async () => {
      env.RESEND_API_KEY = undefined;
      handler = new AuthHandler(env, logger);

      const result = await handler.sendLicenseKeyEmail('user@test.com', 'ABCD-1234-EFGH-5678-IJKL', 'basic');
      expect(result).toBe(false);
    });

    test('should return false when Resend API returns an error', async () => {
      fetchWithTimeout.mockResolvedValue(
        new Response('Forbidden', { status: 403 })
      );

      const result = await handler.sendLicenseKeyEmail('user@test.com', 'ABCD-1234-EFGH-5678-IJKL', 'basic');
      expect(result).toBe(false);
    });

    test('should return false on network failure', async () => {
      fetchWithTimeout.mockRejectedValue(new Error('Network error'));

      const result = await handler.sendLicenseKeyEmail('user@test.com', 'ABCD-1234-EFGH-5678-IJKL', 'basic');
      expect(result).toBe(false);
    });

    test('should log error on failure when logger is present', async () => {
      fetchWithTimeout.mockRejectedValue(new Error('Timeout'));

      await handler.sendLicenseKeyEmail('user@test.com', 'ABCD-1234-EFGH-5678-IJKL', 'basic');

      // The error is caught inside sendEmailViaResend, which logs it
      expect(logger.error).toHaveBeenCalledWith(
        'Resend email request failed',
        expect.any(Error)
      );
    });

    test('should include license key tag for basic tier', async () => {
      await handler.sendLicenseKeyEmail('user@test.com', 'ABCD-1234-EFGH-5678-IJKL', 'basic');

      const callBody = JSON.parse(fetchWithTimeout.mock.calls[0][1].body);
      expect(callBody.tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'category', value: 'license_basic' })
        ])
      );
    });

    test('should include license key tag for pro tier', async () => {
      await handler.sendLicenseKeyEmail('pro@test.com', 'WXYZ-1234-5678-ABCD-EFGH', 'pro');

      const callBody = JSON.parse(fetchWithTimeout.mock.calls[0][1].body);
      expect(callBody.tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'category', value: 'license_pro' })
        ])
      );
    });

    test('should include license key in the email text content for basic tier', async () => {
      const licenseKey = 'ABCD-1234-EFGH-5678-IJKL';
      await handler.sendLicenseKeyEmail('user@test.com', licenseKey, 'basic');

      const callBody = JSON.parse(fetchWithTimeout.mock.calls[0][1].body);
      expect(callBody.text).toContain(licenseKey);
    });

    test('should include license key in the email text content for pro tier', async () => {
      const licenseKey = 'WXYZ-1234-5678-ABCD-EFGH';
      await handler.sendLicenseKeyEmail('pro@test.com', licenseKey, 'pro');

      const callBody = JSON.parse(fetchWithTimeout.mock.calls[0][1].body);
      expect(callBody.text).toContain(licenseKey);
    });

    test('should use FROM_EMAIL env variable when set', async () => {
      env.FROM_EMAIL = 'Custom <custom@captureai.dev>';
      handler = new AuthHandler(env, logger);

      await handler.sendLicenseKeyEmail('user@test.com', 'ABCD-1234-EFGH-5678-IJKL', 'basic');

      const callBody = JSON.parse(fetchWithTimeout.mock.calls[0][1].body);
      expect(callBody.from).toBe('Custom <custom@captureai.dev>');
    });

    test('should use default FROM_EMAIL when env var is not set', async () => {
      env.FROM_EMAIL = undefined;
      handler = new AuthHandler(env, logger);

      await handler.sendLicenseKeyEmail('user@test.com', 'ABCD-1234-EFGH-5678-IJKL', 'basic');

      const callBody = JSON.parse(fetchWithTimeout.mock.calls[0][1].body);
      expect(callBody.from).toBe('CaptureAI <no-reply@captureai.dev>');
    });
  });

  // -------------------------------------------------------------------------
  // generateProEmailHTML
  // -------------------------------------------------------------------------

  describe('generateProEmailHTML', () => {
    test('should return an HTML string', () => {
      const html = handler.generateProEmailHTML('ABCD-1234-EFGH-5678-IJKL');
      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
    });

    test('should include the license key in the HTML', () => {
      const licenseKey = 'TEST-KEY1-KEY2-KEY3-KEY4';
      const html = handler.generateProEmailHTML(licenseKey);
      expect(html).toContain(licenseKey);
    });

    test('should include Pro subscription messaging', () => {
      const html = handler.generateProEmailHTML('ABCD-1234-EFGH-5678-IJKL');
      expect(html).toContain('Pro subscription');
    });

    test('should include the next charge date', () => {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const html = handler.generateProEmailHTML('ABCD-1234-EFGH-5678-IJKL', nextMonth);
      // The date should be approximately one month from now
      const expectedYear = nextMonth.getFullYear().toString();
      expect(html).toContain(expectedYear);
    });

    test('should include account management link', () => {
      const html = handler.generateProEmailHTML('ABCD-1234-EFGH-5678-IJKL');
      expect(html).toContain('https://captureai.dev/activate');
    });

    test('should include CaptureAI branding', () => {
      const html = handler.generateProEmailHTML('ABCD-1234-EFGH-5678-IJKL');
      expect(html).toContain('CaptureAI');
      expect(html).toContain('captureai.dev');
    });
  });

  // -------------------------------------------------------------------------
  // sendEmailViaResend
  // -------------------------------------------------------------------------

  describe('sendEmailViaResend', () => {
    test('should return true on successful send', async () => {
      fetchWithTimeout.mockResolvedValue(
        new Response(JSON.stringify({ id: 'email-abc' }), { status: 200 })
      );

      const result = await handler.sendEmailViaResend(
        'user@test.com', 'Test Subject', '<h1>HTML</h1>', 'Text content', 'basic'
      );
      expect(result).toBe(true);
    });

    test('should call fetchWithTimeout with correct URL', async () => {
      await handler.sendEmailViaResend(
        'user@test.com', 'Test Subject', '<h1>HTML</h1>', 'Text content', 'basic'
      );

      expect(fetchWithTimeout).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.any(Object),
        5000
      );
    });

    test('should include Authorization header with RESEND_API_KEY', async () => {
      await handler.sendEmailViaResend(
        'user@test.com', 'Test Subject', '<h1>HTML</h1>', 'Text content', 'basic'
      );

      const options = fetchWithTimeout.mock.calls[0][1];
      expect(options.headers.Authorization).toBe('Bearer test-resend-key');
    });

    test('should send correct email payload', async () => {
      await handler.sendEmailViaResend(
        'recipient@test.com', 'My Subject', '<h1>Hello</h1>', 'Hello text', 'pro'
      );

      const body = JSON.parse(fetchWithTimeout.mock.calls[0][1].body);
      expect(body.to).toEqual(['recipient@test.com']);
      expect(body.subject).toBe('My Subject');
      expect(body.html).toBe('<h1>Hello</h1>');
      expect(body.text).toBe('Hello text');
    });

    test('should include X-Entity-Ref-ID header in email', async () => {
      await handler.sendEmailViaResend(
        'user@test.com', 'Test', '<p>test</p>', 'test', 'basic'
      );

      const body = JSON.parse(fetchWithTimeout.mock.calls[0][1].body);
      expect(body.headers).toBeDefined();
      expect(body.headers['X-Entity-Ref-ID']).toBeDefined();
    });

    test('should return false when API returns error status', async () => {
      fetchWithTimeout.mockResolvedValue(
        new Response('Bad Request', { status: 400 })
      );

      const result = await handler.sendEmailViaResend(
        'user@test.com', 'Test', '<p>test</p>', 'test'
      );
      expect(result).toBe(false);
    });

    test('should log error when API returns error status', async () => {
      fetchWithTimeout.mockResolvedValue(
        new Response('Unauthorized', { status: 401 })
      );

      await handler.sendEmailViaResend(
        'user@test.com', 'Test', '<p>test</p>', 'test'
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Resend email error',
        null,
        expect.objectContaining({ status: 401 })
      );
    });

    test('should return false on network failure', async () => {
      fetchWithTimeout.mockRejectedValue(new Error('Request timeout after 5000ms'));

      const result = await handler.sendEmailViaResend(
        'user@test.com', 'Test', '<p>test</p>', 'test'
      );
      expect(result).toBe(false);
    });

    test('should log error on network failure', async () => {
      const networkError = new Error('Connection refused');
      fetchWithTimeout.mockRejectedValue(networkError);

      await handler.sendEmailViaResend(
        'user@test.com', 'Test', '<p>test</p>', 'test'
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Resend email request failed',
        networkError
      );
    });

    test('should log success with email ID on successful send', async () => {
      fetchWithTimeout.mockResolvedValue(
        new Response(JSON.stringify({ id: 'resend-email-id-99' }), { status: 200 })
      );

      await handler.sendEmailViaResend(
        'user@test.com', 'Test', '<p>test</p>', 'test'
      );

      expect(logger.info).toHaveBeenCalledWith(
        'Email sent successfully',
        expect.objectContaining({
          provider: 'resend',
          id: 'resend-email-id-99'
        })
      );
    });

    test('should default tier tag to basic when not specified', async () => {
      await handler.sendEmailViaResend(
        'user@test.com', 'Test', '<p>test</p>', 'test'
      );

      const body = JSON.parse(fetchWithTimeout.mock.calls[0][1].body);
      expect(body.tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'category', value: 'license_basic' })
        ])
      );
    });

    test('should set license_pro tag for pro tier', async () => {
      await handler.sendEmailViaResend(
        'user@test.com', 'Test', '<p>test</p>', 'test', 'pro'
      );

      const body = JSON.parse(fetchWithTimeout.mock.calls[0][1].body);
      expect(body.tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'category', value: 'license_pro' })
        ])
      );
    });
  });
});
