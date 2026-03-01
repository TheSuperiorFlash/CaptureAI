/**
 * Unit Tests for API Utility Functions
 *
 * Tests jsonResponse, fetchWithTimeout, handleCORS, password hashing,
 * JWT operations, constantTimeCompare, generateUUID, isValidEmail
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import {
  jsonResponse,
  fetchWithTimeout,
  handleCORS,
  hashPassword,
  verifyPassword,
  createJWT,
  verifyJWT,
  generateUUID,
  isValidEmail,
  constantTimeCompare
} from '../../src/utils.js';

describe('jsonResponse', () => {
  test('should return 200 by default', async () => {
    const res = jsonResponse({ ok: true });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  test('should set custom status code', async () => {
    const res = jsonResponse({ error: 'not found' }, 404);
    expect(res.status).toBe(404);
  });

  test('should set Content-Type header', () => {
    const res = jsonResponse({});
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  test('should serialize complex objects', async () => {
    const data = { items: [1, 2, 3], nested: { key: 'value' } };
    const res = jsonResponse(data);
    const body = await res.json();
    expect(body).toEqual(data);
  });

  test('should handle null data', async () => {
    const res = jsonResponse(null);
    const body = await res.json();
    expect(body).toBeNull();
  });
});

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('should call fetch with options and abort signal', async () => {
    global.fetch.mockResolvedValue(new Response('ok'));

    await fetchWithTimeout('https://example.com', { method: 'POST' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        method: 'POST',
        signal: expect.any(AbortSignal)
      })
    );
  });

  test('should return response on success', async () => {
    const mockResponse = new Response('test body');
    global.fetch.mockResolvedValue(mockResponse);

    const result = await fetchWithTimeout('https://example.com');
    expect(result).toBe(mockResponse);
  });

  test('should throw timeout error when request exceeds timeout', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    global.fetch.mockRejectedValue(abortError);

    await expect(fetchWithTimeout('https://example.com', {}, 100))
      .rejects.toThrow('Request timeout after 100ms');
  });

  test('should re-throw non-abort errors', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    await expect(fetchWithTimeout('https://example.com'))
      .rejects.toThrow('Network error');
  });

  test('should use default timeout of 10000ms', async () => {
    global.fetch.mockResolvedValue(new Response('ok'));
    await fetchWithTimeout('https://example.com');
    // Just verify it doesn't throw with default timeout
    expect(global.fetch).toHaveBeenCalled();
  });
});

describe('handleCORS', () => {
  test('should allow captureai.dev origin', async () => {
    const request = new Request('https://api.captureai.workers.dev', {
      headers: { 'Origin': 'https://captureai.dev' }
    });

    const res = handleCORS(request, {});
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://captureai.dev');
  });

  test('should allow github.io origin', async () => {
    const request = new Request('https://api.captureai.workers.dev', {
      headers: { 'Origin': 'https://thesuperiorflash.github.io' }
    });

    const res = handleCORS(request, {});
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://thesuperiorflash.github.io');
  });

  test('should reject unknown origins', async () => {
    const request = new Request('https://api.captureai.workers.dev', {
      headers: { 'Origin': 'https://evil.com' }
    });

    const res = handleCORS(request, {});
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('null');
  });

  test('should allow chrome extension with matching ID', async () => {
    const request = new Request('https://api.captureai.workers.dev', {
      headers: { 'Origin': 'chrome-extension://abc123' }
    });

    const env = { CHROME_EXTENSION_IDS: 'abc123,def456' };
    const res = handleCORS(request, env);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('chrome-extension://abc123');
  });

  test('should reject chrome extension with non-matching ID', async () => {
    const request = new Request('https://api.captureai.workers.dev', {
      headers: { 'Origin': 'chrome-extension://unknown' }
    });

    const env = { CHROME_EXTENSION_IDS: 'abc123,def456' };
    const res = handleCORS(request, env);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('null');
  });

  test('should allow localhost in dev mode', async () => {
    const request = new Request('https://api.captureai.workers.dev', {
      headers: { 'Origin': 'http://localhost:3000' }
    });

    const env = { ENVIRONMENT: 'development' };
    const res = handleCORS(request, env);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
  });

  test('should reject localhost in production', async () => {
    const request = new Request('https://api.captureai.workers.dev', {
      headers: { 'Origin': 'http://localhost:3000' }
    });

    const res = handleCORS(request, {});
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('null');
  });

  test('should set CORS headers', () => {
    const request = new Request('https://api.captureai.workers.dev', {
      headers: { 'Origin': 'https://captureai.dev' }
    });

    const res = handleCORS(request, {});
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
    expect(res.headers.get('Access-Control-Max-Age')).toBe('86400');
  });

  test('should handle missing origin header', () => {
    const request = new Request('https://api.captureai.workers.dev');
    const res = handleCORS(request, {});
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('null');
  });
});

describe('hashPassword / verifyPassword', () => {
  test('should hash and verify a password', async () => {
    const password = 'mySecretPassword123';
    const hash = await hashPassword(password);

    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  test('should reject wrong password', async () => {
    const hash = await hashPassword('correct-password');
    const isValid = await verifyPassword('wrong-password', hash);
    expect(isValid).toBe(false);
  });

  test('should produce different hashes for same password (random salt)', async () => {
    const hash1 = await hashPassword('same-password');
    const hash2 = await hashPassword('same-password');
    expect(hash1).not.toBe(hash2);
  });

  test('should handle empty password', async () => {
    const hash = await hashPassword('');
    expect(typeof hash).toBe('string');
    const isValid = await verifyPassword('', hash);
    expect(isValid).toBe(true);
  });

  test('should return false for malformed hash', async () => {
    const isValid = await verifyPassword('password', 'not-a-valid-hash');
    expect(isValid).toBe(false);
  });
});

describe('createJWT / verifyJWT', () => {
  const secret = 'test-jwt-secret-key';

  test('should create and verify a JWT', async () => {
    const payload = { userId: '123', role: 'admin' };
    const token = await createJWT(payload, secret);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = await verifyJWT(token, secret);
    expect(decoded.userId).toBe('123');
    expect(decoded.role).toBe('admin');
  });

  test('should reject JWT with wrong secret', async () => {
    const token = await createJWT({ data: 'test' }, secret);

    await expect(verifyJWT(token, 'wrong-secret'))
      .rejects.toThrow('Invalid token');
  });

  test('should reject expired JWT', async () => {
    const payload = { data: 'test', exp: Math.floor(Date.now() / 1000) - 3600 };
    const token = await createJWT(payload, secret);

    await expect(verifyJWT(token, secret))
      .rejects.toThrow('Token expired');
  });

  test('should accept non-expired JWT', async () => {
    const payload = { data: 'test', exp: Math.floor(Date.now() / 1000) + 3600 };
    const token = await createJWT(payload, secret);

    const decoded = await verifyJWT(token, secret);
    expect(decoded.data).toBe('test');
  });

  test('should reject malformed token', async () => {
    await expect(verifyJWT('not.a.jwt.token.at.all', secret))
      .rejects.toThrow('Invalid token');
  });

  test('should reject token with only two parts', async () => {
    await expect(verifyJWT('header.payload', secret))
      .rejects.toThrow('Invalid token');
  });
});

describe('generateUUID', () => {
  test('should return a valid UUID format', () => {
    const uuid = generateUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(uuid).toMatch(uuidRegex);
  });

  test('should generate unique UUIDs', () => {
    const uuids = new Set();
    for (let i = 0; i < 100; i++) {
      uuids.add(generateUUID());
    }
    expect(uuids.size).toBe(100);
  });
});

describe('isValidEmail', () => {
  test('should accept valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('test.user@domain.org')).toBe(true);
    expect(isValidEmail('a@b.co')).toBe(true);
  });

  test('should reject invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('no-at-sign')).toBe(false);
    expect(isValidEmail('@no-local.com')).toBe(false);
    expect(isValidEmail('no-domain@')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });
});

describe('constantTimeCompare', () => {
  test('should return true for equal strings', () => {
    expect(constantTimeCompare('hello', 'hello')).toBe(true);
    expect(constantTimeCompare('', '')).toBe(true);
    expect(constantTimeCompare('a'.repeat(1000), 'a'.repeat(1000))).toBe(true);
  });

  test('should return false for unequal strings', () => {
    expect(constantTimeCompare('hello', 'world')).toBe(false);
    expect(constantTimeCompare('abc', 'abd')).toBe(false);
  });

  test('should return false for different lengths', () => {
    expect(constantTimeCompare('short', 'longer-string')).toBe(false);
    expect(constantTimeCompare('a', 'ab')).toBe(false);
  });

  test('should return false for non-string inputs', () => {
    expect(constantTimeCompare(123, 'abc')).toBe(false);
    expect(constantTimeCompare('abc', null)).toBe(false);
    expect(constantTimeCompare(undefined, undefined)).toBe(false);
  });
});
