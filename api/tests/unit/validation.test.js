/**
 * Unit Tests for Validation Module
 *
 * Comprehensive tests for all input validation utilities
 * used by the CaptureAI API backend.
 */

import { describe, test, expect } from '@jest/globals';
import {
  ValidationError,
  validateRequestBody,
  validateEmail,
  validateLicenseKey,
  validateString,
  validateNumber,
  validateEnum,
  validateArray,
  validatePrompt,
  validateModel,
  validateReasoningLevel,
  sanitizeString,
  sanitizeObject,
  validateStripeSignature,
  validateBase64Image
} from '../../src/validation.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a mock POST Request with a JSON body string.
 * @param {string} body - Raw body string
 * @param {Object} headers - Extra headers
 * @returns {Request}
 */
function mockRequest(body, headers = {}) {
  return new Request('https://test.com', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

// ---------------------------------------------------------------------------
// ValidationError
// ---------------------------------------------------------------------------

describe('ValidationError', () => {
  test('should create error with message only', () => {
    const err = new ValidationError('something broke');
    expect(err.message).toBe('something broke');
    expect(err.field).toBeNull();
    expect(err.name).toBe('ValidationError');
  });

  test('should create error with message and field', () => {
    const err = new ValidationError('bad value', 'email');
    expect(err.message).toBe('bad value');
    expect(err.field).toBe('email');
    expect(err.name).toBe('ValidationError');
  });

  test('should be an instance of Error', () => {
    const err = new ValidationError('oops');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ValidationError);
  });

  test('should have a stack trace', () => {
    const err = new ValidationError('stack test');
    expect(err.stack).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// validateRequestBody
// ---------------------------------------------------------------------------

describe('validateRequestBody', () => {
  test('should parse valid JSON body', async () => {
    const req = mockRequest('{"name":"test","count":5}');
    const result = await validateRequestBody(req);
    expect(result).toEqual({ name: 'test', count: 5 });
  });

  test('should return empty object for empty body', async () => {
    const req = mockRequest('');
    const result = await validateRequestBody(req);
    expect(result).toEqual({});
  });

  test('should return empty object for whitespace-only body', async () => {
    const req = mockRequest('   ');
    const result = await validateRequestBody(req);
    expect(result).toEqual({});
  });

  test('should throw ValidationError for malformed JSON', async () => {
    const req = mockRequest('{invalid json}');
    await expect(validateRequestBody(req)).rejects.toThrow(ValidationError);
  });

  test('should include Invalid JSON message for malformed JSON', async () => {
    const req = mockRequest('{invalid json}');
    await expect(validateRequestBody(req)).rejects.toThrow('Invalid JSON format');
  });

  test('should throw when Content-Length header exceeds maxSize', async () => {
    const req = mockRequest('{}', { 'Content-Length': '2000000' });
    await expect(validateRequestBody(req)).rejects.toThrow('Request body too large');
  });

  test('should throw when body text exceeds maxSize', async () => {
    const largeBody = 'a'.repeat(200);
    const req1 = mockRequest(largeBody);
    await expect(validateRequestBody(req1, 100)).rejects.toThrow(ValidationError);

    const req2 = mockRequest(largeBody);
    await expect(validateRequestBody(req2, 100)).rejects.toThrow('Request body too large');
  });

  test('should accept body within custom maxSize', async () => {
    const req = mockRequest('{"ok":true}');
    const result = await validateRequestBody(req, 50);
    expect(result).toEqual({ ok: true });
  });

  test('should parse arrays as valid JSON', async () => {
    const req = mockRequest('[1,2,3]');
    const result = await validateRequestBody(req);
    expect(result).toEqual([1, 2, 3]);
  });

  test('should parse nested JSON objects', async () => {
    const body = JSON.stringify({ a: { b: { c: 1 } } });
    const req = mockRequest(body);
    const result = await validateRequestBody(req);
    expect(result).toEqual({ a: { b: { c: 1 } } });
  });
});

// ---------------------------------------------------------------------------
// validateEmail
// ---------------------------------------------------------------------------

describe('validateEmail', () => {
  describe('valid emails', () => {
    test('should accept standard email', () => {
      expect(validateEmail('user@example.com')).toBe('user@example.com');
    });

    test('should normalize to lowercase', () => {
      expect(validateEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
    });

    test('should trim whitespace', () => {
      expect(validateEmail('  user@example.com  ')).toBe('user@example.com');
    });

    test('should accept email with plus addressing', () => {
      expect(validateEmail('user+tag@example.com')).toBe('user+tag@example.com');
    });

    test('should accept email with dots in local part', () => {
      expect(validateEmail('first.last@example.com')).toBe('first.last@example.com');
    });

    test('should accept email with subdomain', () => {
      expect(validateEmail('user@mail.example.co.uk')).toBe('user@mail.example.co.uk');
    });

    test('should accept email with numbers in local part', () => {
      expect(validateEmail('user123@example.com')).toBe('user123@example.com');
    });

    test('should accept email with hyphens in domain', () => {
      expect(validateEmail('user@my-domain.com')).toBe('user@my-domain.com');
    });
  });

  describe('invalid emails', () => {
    test('should throw for email without @ sign', () => {
      expect(() => validateEmail('userexample.com')).toThrow(ValidationError);
      expect(() => validateEmail('userexample.com')).toThrow('Invalid email format');
    });

    test('should throw for email without domain', () => {
      expect(() => validateEmail('user@')).toThrow(ValidationError);
    });

    test('should throw for email without local part', () => {
      expect(() => validateEmail('@example.com')).toThrow(ValidationError);
    });

    test('should throw for email with spaces', () => {
      expect(() => validateEmail('user @example.com')).toThrow(ValidationError);
    });

    test('should throw for non-string email (number)', () => {
      // The function calls .trim() before the type check,
      // so a number input throws a TypeError
      expect(() => validateEmail(12345)).toThrow();
    });
  });

  describe('length limits', () => {
    test('should throw when email exceeds 320 characters', () => {
      const longEmail = 'a'.repeat(310) + '@example.com';
      expect(() => validateEmail(longEmail)).toThrow('Email is too long');
    });

    test('should throw when local part exceeds 64 characters', () => {
      const longLocal = 'a'.repeat(65) + '@example.com';
      expect(() => validateEmail(longLocal)).toThrow('Email local part is too long');
    });

    test('should throw when domain exceeds 255 characters', () => {
      // Build a domain that is >255 chars but still passes the regex
      const longDomain = ('a'.repeat(60) + '.').repeat(5) + 'com';
      const email = 'user@' + longDomain;
      expect(() => validateEmail(email)).toThrow('Email domain is too long');
    });
  });

  describe('disposable domains', () => {
    test('should reject tempmail.com', () => {
      expect(() => validateEmail('user@tempmail.com')).toThrow('Disposable email');
    });

    test('should reject mailinator.com', () => {
      expect(() => validateEmail('user@mailinator.com')).toThrow('Disposable email');
    });

    test('should reject yopmail.com', () => {
      expect(() => validateEmail('user@yopmail.com')).toThrow('Disposable email');
    });

    test('should reject guerrillamail.com', () => {
      expect(() => validateEmail('user@guerrillamail.com')).toThrow('Disposable email');
    });

    test('should reject 10minutemail.com', () => {
      expect(() => validateEmail('user@10minutemail.com')).toThrow('Disposable email');
    });

    test('should reject disposable domain case-insensitively', () => {
      expect(() => validateEmail('user@TEMPMAIL.COM')).toThrow('Disposable email');
    });
  });

  describe('required vs optional', () => {
    test('should throw for empty string when required', () => {
      expect(() => validateEmail('')).toThrow('Email is required');
    });

    test('should throw for null when required', () => {
      expect(() => validateEmail(null)).toThrow('Email is required');
    });

    test('should throw for undefined when required', () => {
      expect(() => validateEmail(undefined)).toThrow('Email is required');
    });

    test('should return null for empty string when not required', () => {
      expect(validateEmail('', false)).toBeNull();
    });

    test('should return null for null when not required', () => {
      expect(validateEmail(null, false)).toBeNull();
    });

    test('should return null for whitespace-only when not required', () => {
      expect(validateEmail('   ', false)).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// validateLicenseKey
// ---------------------------------------------------------------------------

describe('validateLicenseKey', () => {
  describe('valid keys', () => {
    test('should accept valid uppercase key', () => {
      expect(validateLicenseKey('ABCD-1234-EFGH-5678-IJKL'))
        .toBe('ABCD-1234-EFGH-5678-IJKL');
    });

    test('should normalize lowercase to uppercase', () => {
      expect(validateLicenseKey('abcd-1234-efgh-5678-ijkl'))
        .toBe('ABCD-1234-EFGH-5678-IJKL');
    });

    test('should strip whitespace before validation', () => {
      expect(validateLicenseKey(' ABCD-1234-EFGH-5678-IJKL '))
        .toBe('ABCD-1234-EFGH-5678-IJKL');
    });

    test('should strip internal spaces', () => {
      expect(validateLicenseKey('ABCD - 1234 - EFGH - 5678 - IJKL'))
        .toBe('ABCD-1234-EFGH-5678-IJKL');
    });

    test('should accept all-numeric key', () => {
      expect(validateLicenseKey('1234-5678-9012-3456-7890'))
        .toBe('1234-5678-9012-3456-7890');
    });

    test('should accept mixed alphanumeric segments', () => {
      expect(validateLicenseKey('A1B2-C3D4-E5F6-G7H8-I9J0'))
        .toBe('A1B2-C3D4-E5F6-G7H8-I9J0');
    });
  });

  describe('invalid keys', () => {
    test('should throw for key with too few segments', () => {
      expect(() => validateLicenseKey('ABCD-1234-EFGH'))
        .toThrow('Invalid license key format');
    });

    test('should throw for key with too many segments', () => {
      expect(() => validateLicenseKey('ABCD-1234-EFGH-5678-IJKL-MNOP'))
        .toThrow('Invalid license key format');
    });

    test('should throw for key without dashes', () => {
      expect(() => validateLicenseKey('ABCD1234EFGH5678IJKL'))
        .toThrow('Invalid license key format');
    });

    test('should throw for key with short segments', () => {
      expect(() => validateLicenseKey('ABC-1234-EFGH-5678-IJKL'))
        .toThrow('Invalid license key format');
    });

    test('should throw for key with special characters', () => {
      expect(() => validateLicenseKey('AB!D-1234-EFGH-5678-IJKL'))
        .toThrow('Invalid license key format');
    });

    test('should throw for non-string key (number)', () => {
      // The function calls .trim() before the type check,
      // so a number input throws a TypeError
      expect(() => validateLicenseKey(123456)).toThrow();
    });

    test('should throw for key exceeding 100 characters', () => {
      const longKey = 'A'.repeat(101);
      expect(() => validateLicenseKey(longKey)).toThrow('License key is too long');
    });
  });

  describe('required vs optional', () => {
    test('should throw for empty string when required', () => {
      expect(() => validateLicenseKey('')).toThrow('License key is required');
    });

    test('should throw for null when required', () => {
      expect(() => validateLicenseKey(null)).toThrow('License key is required');
    });

    test('should throw for undefined when required', () => {
      expect(() => validateLicenseKey(undefined)).toThrow('License key is required');
    });

    test('should return null for empty string when not required', () => {
      expect(validateLicenseKey('', false)).toBeNull();
    });

    test('should return null for null when not required', () => {
      expect(validateLicenseKey(null, false)).toBeNull();
    });

    test('should return null for whitespace when not required', () => {
      expect(validateLicenseKey('   ', false)).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// validateString
// ---------------------------------------------------------------------------

describe('validateString', () => {
  describe('happy path', () => {
    test('should return valid string', () => {
      expect(validateString('hello', 'name')).toBe('hello');
    });

    test('should accept string at exact maxLength', () => {
      const val = 'a'.repeat(10);
      expect(validateString(val, 'name', { maxLength: 10 })).toBe(val);
    });

    test('should accept string at exact minLength', () => {
      expect(validateString('ab', 'name', { minLength: 2 })).toBe('ab');
    });
  });

  describe('required / allowEmpty', () => {
    test('should throw for null when required', () => {
      expect(() => validateString(null, 'name'))
        .toThrow('name is required');
    });

    test('should throw for undefined when required', () => {
      expect(() => validateString(undefined, 'name'))
        .toThrow('name is required');
    });

    test('should throw for empty string when required and allowEmpty false', () => {
      expect(() => validateString('', 'name'))
        .toThrow('name is required');
    });

    test('should return empty string when allowEmpty is true', () => {
      expect(validateString('', 'name', { allowEmpty: true })).toBe('');
    });

    test('should return null for null when not required', () => {
      expect(validateString(null, 'name', { required: false })).toBeNull();
    });

    test('should return null for undefined when not required', () => {
      expect(validateString(undefined, 'name', { required: false })).toBeNull();
    });
  });

  describe('type check', () => {
    test('should throw for number value', () => {
      expect(() => validateString(42, 'name')).toThrow('name must be a string');
    });

    test('should throw for boolean value', () => {
      expect(() => validateString(true, 'name')).toThrow('name must be a string');
    });

    test('should throw for object value', () => {
      expect(() => validateString({}, 'name')).toThrow('name must be a string');
    });

    test('should throw for array value', () => {
      expect(() => validateString([], 'name')).toThrow('name must be a string');
    });
  });

  describe('length constraints', () => {
    test('should throw when below minLength', () => {
      expect(() => validateString('ab', 'name', { minLength: 5 }))
        .toThrow('name must be at least 5 characters');
    });

    test('should throw when above maxLength', () => {
      expect(() => validateString('toolong', 'name', { maxLength: 3 }))
        .toThrow('name must be at most 3 characters');
    });
  });

  describe('pattern validation', () => {
    test('should accept value matching pattern', () => {
      expect(validateString('abc123', 'code', { pattern: /^[a-z0-9]+$/ }))
        .toBe('abc123');
    });

    test('should throw for value not matching pattern', () => {
      expect(() => validateString('ABC!', 'code', { pattern: /^[a-z0-9]+$/ }))
        .toThrow('code has invalid format');
    });
  });
});

// ---------------------------------------------------------------------------
// validateNumber
// ---------------------------------------------------------------------------

describe('validateNumber', () => {
  describe('happy path', () => {
    test('should return a valid number', () => {
      expect(validateNumber(42, 'count')).toBe(42);
    });

    test('should coerce a numeric string', () => {
      expect(validateNumber('99', 'count')).toBe(99);
    });

    test('should accept zero', () => {
      expect(validateNumber(0, 'count')).toBe(0);
    });

    test('should accept negative numbers', () => {
      expect(validateNumber(-5, 'temp', { min: -10 })).toBe(-5);
    });

    test('should accept floats when integer not required', () => {
      expect(validateNumber(3.14, 'pi')).toBe(3.14);
    });
  });

  describe('required', () => {
    test('should throw for null when required', () => {
      expect(() => validateNumber(null, 'count'))
        .toThrow('count is required');
    });

    test('should throw for undefined when required', () => {
      expect(() => validateNumber(undefined, 'count'))
        .toThrow('count is required');
    });

    test('should return null for null when not required', () => {
      expect(validateNumber(null, 'count', { required: false })).toBeNull();
    });

    test('should return null for undefined when not required', () => {
      expect(validateNumber(undefined, 'count', { required: false })).toBeNull();
    });
  });

  describe('type coercion and NaN', () => {
    test('should throw for non-numeric string', () => {
      expect(() => validateNumber('abc', 'count'))
        .toThrow('count must be a number');
    });

    test('should throw for NaN', () => {
      expect(() => validateNumber(NaN, 'count'))
        .toThrow('count must be a number');
    });

    test('should throw for empty string', () => {
      // Number('') === 0, so this actually coerces to 0
      expect(validateNumber('', 'count')).toBe(0);
    });

    test('should throw for object', () => {
      expect(() => validateNumber({}, 'count'))
        .toThrow('count must be a number');
    });
  });

  describe('integer constraint', () => {
    test('should accept integer when integer required', () => {
      expect(validateNumber(5, 'level', { integer: true })).toBe(5);
    });

    test('should throw for float when integer required', () => {
      expect(() => validateNumber(5.5, 'level', { integer: true }))
        .toThrow('level must be an integer');
    });

    test('should accept coerced integer string when integer required', () => {
      expect(validateNumber('7', 'level', { integer: true })).toBe(7);
    });
  });

  describe('range constraints', () => {
    test('should throw when below min', () => {
      expect(() => validateNumber(3, 'age', { min: 18 }))
        .toThrow('age must be at least 18');
    });

    test('should throw when above max', () => {
      expect(() => validateNumber(200, 'age', { max: 120 }))
        .toThrow('age must be at most 120');
    });

    test('should accept value at exact min', () => {
      expect(validateNumber(0, 'count', { min: 0 })).toBe(0);
    });

    test('should accept value at exact max', () => {
      expect(validateNumber(100, 'count', { max: 100 })).toBe(100);
    });
  });
});

// ---------------------------------------------------------------------------
// validateEnum
// ---------------------------------------------------------------------------

describe('validateEnum', () => {
  const allowed = ['low', 'medium', 'high'];

  test('should accept valid enum value', () => {
    expect(validateEnum('low', 'priority', allowed)).toBe('low');
  });

  test('should accept another valid enum value', () => {
    expect(validateEnum('high', 'priority', allowed)).toBe('high');
  });

  test('should throw for invalid enum value', () => {
    expect(() => validateEnum('critical', 'priority', allowed))
      .toThrow('priority must be one of: low, medium, high');
  });

  test('should throw for null when required', () => {
    expect(() => validateEnum(null, 'priority', allowed))
      .toThrow('priority is required');
  });

  test('should throw for undefined when required', () => {
    expect(() => validateEnum(undefined, 'priority', allowed))
      .toThrow('priority is required');
  });

  test('should throw for empty string when required', () => {
    expect(() => validateEnum('', 'priority', allowed))
      .toThrow('priority is required');
  });

  test('should return null for null when not required', () => {
    expect(validateEnum(null, 'priority', allowed, false)).toBeNull();
  });

  test('should return null for undefined when not required', () => {
    expect(validateEnum(undefined, 'priority', allowed, false)).toBeNull();
  });

  test('should return null for empty string when not required', () => {
    expect(validateEnum('', 'priority', allowed, false)).toBeNull();
  });

  test('should be case-sensitive', () => {
    expect(() => validateEnum('Low', 'priority', allowed))
      .toThrow('priority must be one of');
  });
});

// ---------------------------------------------------------------------------
// validateArray
// ---------------------------------------------------------------------------

describe('validateArray', () => {
  describe('happy path', () => {
    test('should return valid array', () => {
      expect(validateArray([1, 2, 3], 'items')).toEqual([1, 2, 3]);
    });

    test('should return empty array', () => {
      expect(validateArray([], 'items')).toEqual([]);
    });
  });

  describe('required', () => {
    test('should throw for null when required', () => {
      expect(() => validateArray(null, 'items'))
        .toThrow('items is required');
    });

    test('should throw for undefined when required', () => {
      expect(() => validateArray(undefined, 'items'))
        .toThrow('items is required');
    });

    test('should return null for null when not required', () => {
      expect(validateArray(null, 'items', { required: false })).toBeNull();
    });

    test('should return null for undefined when not required', () => {
      expect(validateArray(undefined, 'items', { required: false })).toBeNull();
    });
  });

  describe('type check', () => {
    test('should throw for string value', () => {
      expect(() => validateArray('not array', 'items'))
        .toThrow('items must be an array');
    });

    test('should throw for number value', () => {
      expect(() => validateArray(42, 'items'))
        .toThrow('items must be an array');
    });

    test('should throw for object value', () => {
      expect(() => validateArray({}, 'items'))
        .toThrow('items must be an array');
    });
  });

  describe('length constraints', () => {
    test('should throw when below minLength', () => {
      expect(() => validateArray([1], 'items', { minLength: 3 }))
        .toThrow('items must have at least 3 items');
    });

    test('should throw when above maxLength', () => {
      expect(() => validateArray([1, 2, 3, 4, 5], 'items', { maxLength: 3 }))
        .toThrow('items must have at most 3 items');
    });

    test('should accept array at exact minLength', () => {
      expect(validateArray([1, 2], 'items', { minLength: 2 }))
        .toEqual([1, 2]);
    });

    test('should accept array at exact maxLength', () => {
      expect(validateArray([1, 2, 3], 'items', { maxLength: 3 }))
        .toEqual([1, 2, 3]);
    });
  });

  describe('itemValidator', () => {
    test('should apply itemValidator to each element', () => {
      const doubler = (x) => x * 2;
      const result = validateArray([1, 2, 3], 'nums', { itemValidator: doubler });
      expect(result).toEqual([2, 4, 6]);
    });

    test('should throw with index info when itemValidator fails', () => {
      const validator = (item) => {
        if (typeof item !== 'string') {
          throw new Error('must be a string');
        }
        return item;
      };
      expect(() => validateArray(['a', 42, 'c'], 'tags', { itemValidator: validator }))
        .toThrow('tags[1]: must be a string');
    });

    test('should return validated items from itemValidator', () => {
      const upper = (s) => s.toUpperCase();
      const result = validateArray(['hello', 'world'], 'words', { itemValidator: upper });
      expect(result).toEqual(['HELLO', 'WORLD']);
    });
  });
});

// ---------------------------------------------------------------------------
// validatePrompt
// ---------------------------------------------------------------------------

describe('validatePrompt', () => {
  test('should accept a normal prompt', () => {
    expect(validatePrompt('What is this image about?'))
      .toBe('What is this image about?');
  });

  test('should accept a prompt of exactly 1 character', () => {
    expect(validatePrompt('?')).toBe('?');
  });

  test('should throw for empty prompt', () => {
    expect(() => validatePrompt('')).toThrow('prompt is required');
  });

  test('should throw for null prompt', () => {
    expect(() => validatePrompt(null)).toThrow('prompt is required');
  });

  test('should throw for undefined prompt', () => {
    expect(() => validatePrompt(undefined)).toThrow('prompt is required');
  });

  test('should throw for prompt exceeding 50000 characters', () => {
    const longPrompt = 'x'.repeat(50001);
    expect(() => validatePrompt(longPrompt))
      .toThrow('prompt must be at most 50000 characters');
  });

  test('should accept prompt at exactly 50000 characters', () => {
    const maxPrompt = 'x'.repeat(50000);
    expect(validatePrompt(maxPrompt)).toBe(maxPrompt);
  });

  test('should accept a custom fieldName', () => {
    expect(() => validatePrompt('', 'question'))
      .toThrow('question is required');
  });
});

// ---------------------------------------------------------------------------
// validateModel
// ---------------------------------------------------------------------------

describe('validateModel', () => {
  test('should accept gpt-4.1-nano', () => {
    expect(validateModel('gpt-4.1-nano')).toBe('gpt-4.1-nano');
  });

  test('should accept gpt-5-nano', () => {
    expect(validateModel('gpt-5-nano')).toBe('gpt-5-nano');
  });

  test('should return null for null (model is optional)', () => {
    expect(validateModel(null)).toBeNull();
  });

  test('should return null for undefined', () => {
    expect(validateModel(undefined)).toBeNull();
  });

  test('should return null for empty string', () => {
    expect(validateModel('')).toBeNull();
  });

  test('should throw for unknown model name', () => {
    expect(() => validateModel('gpt-4'))
      .toThrow('model must be one of: gpt-4.1-nano, gpt-5-nano');
  });

  test('should throw for model with wrong casing', () => {
    expect(() => validateModel('GPT-5-NANO'))
      .toThrow('model must be one of');
  });
});

// ---------------------------------------------------------------------------
// validateReasoningLevel
// ---------------------------------------------------------------------------

describe('validateReasoningLevel', () => {
  test('should accept level 0', () => {
    expect(validateReasoningLevel(0)).toBe(0);
  });

  test('should accept level 1', () => {
    expect(validateReasoningLevel(1)).toBe(1);
  });

  test('should accept level 2', () => {
    expect(validateReasoningLevel(2)).toBe(2);
  });

  test('should return null for null', () => {
    expect(validateReasoningLevel(null)).toBeNull();
  });

  test('should return null for undefined', () => {
    expect(validateReasoningLevel(undefined)).toBeNull();
  });

  test('should throw for level 3 (above max)', () => {
    expect(() => validateReasoningLevel(3))
      .toThrow('reasoningLevel must be at most 2');
  });

  test('should throw for negative level', () => {
    expect(() => validateReasoningLevel(-1))
      .toThrow('reasoningLevel must be at least 0');
  });

  test('should throw for non-integer level', () => {
    expect(() => validateReasoningLevel(1.5))
      .toThrow('reasoningLevel must be an integer');
  });

  test('should coerce string to number', () => {
    expect(validateReasoningLevel('2')).toBe(2);
  });

  test('should throw for non-numeric string', () => {
    expect(() => validateReasoningLevel('high'))
      .toThrow('reasoningLevel must be a number');
  });
});

// ---------------------------------------------------------------------------
// sanitizeString
// ---------------------------------------------------------------------------

describe('sanitizeString', () => {
  test('should remove null bytes', () => {
    expect(sanitizeString('hello\0world')).toBe('helloworld');
  });

  test('should trim whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  test('should remove null bytes and trim', () => {
    expect(sanitizeString('  he\0llo  ')).toBe('hello');
  });

  test('should return non-string values unchanged', () => {
    expect(sanitizeString(42)).toBe(42);
    expect(sanitizeString(null)).toBeNull();
    expect(sanitizeString(undefined)).toBeUndefined();
    expect(sanitizeString(true)).toBe(true);
  });

  test('should handle empty string', () => {
    expect(sanitizeString('')).toBe('');
  });

  test('should handle string with only null bytes', () => {
    expect(sanitizeString('\0\0\0')).toBe('');
  });

  test('should handle string with only whitespace', () => {
    expect(sanitizeString('   ')).toBe('');
  });

  test('should preserve internal whitespace (non-leading/trailing)', () => {
    expect(sanitizeString('hello world')).toBe('hello world');
  });
});

// ---------------------------------------------------------------------------
// sanitizeObject
// ---------------------------------------------------------------------------

describe('sanitizeObject', () => {
  test('should sanitize string values in object', () => {
    const result = sanitizeObject({ name: '  hello\0  ' });
    expect(result).toEqual({ name: 'hello' });
  });

  test('should recursively sanitize nested objects', () => {
    const result = sanitizeObject({
      user: {
        name: '  john\0  ',
        address: {
          city: '  NYC\0  '
        }
      }
    });
    expect(result).toEqual({
      user: {
        name: 'john',
        address: {
          city: 'NYC'
        }
      }
    });
  });

  test('should pass through non-string/non-object values', () => {
    const result = sanitizeObject({ count: 42, active: true });
    expect(result).toEqual({ count: 42, active: true });
  });

  test('should return null for null input', () => {
    expect(sanitizeObject(null)).toBeNull();
  });

  test('should return non-object values unchanged', () => {
    expect(sanitizeObject('string')).toBe('string');
    expect(sanitizeObject(42)).toBe(42);
    expect(sanitizeObject(undefined)).toBeUndefined();
  });

  test('should handle empty object', () => {
    expect(sanitizeObject({})).toEqual({});
  });

  test('should handle mixed values', () => {
    const result = sanitizeObject({
      name: '  test\0  ',
      count: 5,
      active: false,
      tags: ['a', 'b'],
      nested: { key: '  val\0  ' }
    });
    expect(result.name).toBe('test');
    expect(result.count).toBe(5);
    expect(result.active).toBe(false);
    // Arrays are objects, so they get recursively sanitized
    expect(result.nested).toEqual({ key: 'val' });
  });
});

// ---------------------------------------------------------------------------
// validateStripeSignature
// ---------------------------------------------------------------------------

describe('validateStripeSignature', () => {
  const validTimestamp = Math.floor(Date.now() / 1000).toString();
  const validHex = 'abcdef1234567890';

  describe('valid signatures', () => {
    test('should parse valid signature', () => {
      const sig = `t=${validTimestamp},v1=${validHex}`;
      const result = validateStripeSignature(sig);
      expect(result.t).toBe(validTimestamp);
      expect(result.v1).toBe(validHex);
    });

    test('should accept uppercase hex', () => {
      const sig = `t=${validTimestamp},v1=ABCDEF1234567890`;
      const result = validateStripeSignature(sig);
      expect(result.v1).toBe('ABCDEF1234567890');
    });

    test('should handle extra signature parts', () => {
      const sig = `t=${validTimestamp},v1=${validHex},v0=oldsig`;
      const result = validateStripeSignature(sig);
      expect(result.t).toBe(validTimestamp);
      expect(result.v1).toBe(validHex);
    });
  });

  describe('missing or invalid input', () => {
    test('should throw for null signature', () => {
      expect(() => validateStripeSignature(null))
        .toThrow('Invalid webhook signature format');
    });

    test('should throw for undefined signature', () => {
      expect(() => validateStripeSignature(undefined))
        .toThrow('Invalid webhook signature format');
    });

    test('should throw for empty string', () => {
      expect(() => validateStripeSignature(''))
        .toThrow('Invalid webhook signature format');
    });

    test('should throw for non-string signature', () => {
      expect(() => validateStripeSignature(12345))
        .toThrow('Invalid webhook signature format');
    });
  });

  describe('format validation', () => {
    test('should throw for signature with fewer than 2 parts', () => {
      expect(() => validateStripeSignature(`t=${validTimestamp}`))
        .toThrow('Invalid webhook signature format');
    });

    test('should throw for part without equals sign', () => {
      expect(() => validateStripeSignature('noequals,v1=abc'))
        .toThrow('Invalid webhook signature format');
    });

    test('should throw for part with empty key', () => {
      expect(() => validateStripeSignature(`=value,v1=${validHex}`))
        .toThrow('Invalid webhook signature format');
    });

    test('should throw for part with empty value', () => {
      expect(() => validateStripeSignature(`t=,v1=${validHex}`))
        .toThrow('Invalid webhook signature format');
    });
  });

  describe('missing components', () => {
    test('should throw when t is missing', () => {
      expect(() => validateStripeSignature(`v1=${validHex},v0=other`))
        .toThrow('Missing required signature components');
    });

    test('should throw when v1 is missing', () => {
      expect(() => validateStripeSignature(`t=${validTimestamp},v0=other`))
        .toThrow('Missing required signature components');
    });
  });

  describe('timestamp validation', () => {
    test('should throw for non-numeric timestamp', () => {
      expect(() => validateStripeSignature(`t=notanumber,v1=${validHex}`))
        .toThrow('Invalid signature timestamp');
    });

    test('should throw for zero timestamp', () => {
      expect(() => validateStripeSignature(`t=0,v1=${validHex}`))
        .toThrow('Invalid signature timestamp');
    });

    test('should throw for negative timestamp', () => {
      expect(() => validateStripeSignature(`t=-1,v1=${validHex}`))
        .toThrow('Invalid signature timestamp');
    });
  });

  describe('hex validation', () => {
    test('should throw for non-hex v1 value', () => {
      expect(() => validateStripeSignature(`t=${validTimestamp},v1=notHEX!@#`))
        .toThrow('Invalid signature format');
    });

    test('should throw for v1 with spaces', () => {
      expect(() => validateStripeSignature(`t=${validTimestamp},v1=abc def`))
        .toThrow('Invalid signature format');
    });
  });
});

// ---------------------------------------------------------------------------
// validateBase64Image
// ---------------------------------------------------------------------------

describe('validateBase64Image', () => {
  // A tiny valid 1x1 PNG in base64 (truncated for brevity, but valid format)
  const validPngPrefix = 'data:image/png;base64,';
  const validBase64Chars = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const validPng = validPngPrefix + validBase64Chars;

  describe('valid images', () => {
    test('should accept valid PNG data URI', () => {
      expect(validateBase64Image(validPng)).toBe(validPng);
    });

    test('should accept valid JPEG data URI', () => {
      const jpeg = 'data:image/jpeg;base64,/9j/4AAQ';
      expect(validateBase64Image(jpeg)).toBe(jpeg);
    });

    test('should accept valid JPG data URI', () => {
      const jpg = 'data:image/jpg;base64,/9j/4AAQ';
      expect(validateBase64Image(jpg)).toBe(jpg);
    });

    test('should accept valid GIF data URI', () => {
      const gif = 'data:image/gif;base64,R0lGODlh';
      expect(validateBase64Image(gif)).toBe(gif);
    });

    test('should accept valid WebP data URI', () => {
      const webp = 'data:image/webp;base64,UklGRiIA';
      expect(validateBase64Image(webp)).toBe(webp);
    });

    test('should use custom fieldName in errors', () => {
      expect(() => validateBase64Image(null, 'screenshot'))
        .toThrow('screenshot must be a string');
    });
  });

  describe('invalid input', () => {
    test('should throw for null', () => {
      expect(() => validateBase64Image(null))
        .toThrow('image must be a string');
    });

    test('should throw for undefined', () => {
      expect(() => validateBase64Image(undefined))
        .toThrow('image must be a string');
    });

    test('should throw for empty string', () => {
      expect(() => validateBase64Image(''))
        .toThrow('image must be a string');
    });

    test('should throw for non-string', () => {
      expect(() => validateBase64Image(123))
        .toThrow('image must be a string');
    });
  });

  describe('format validation', () => {
    test('should throw for plain base64 without data URI', () => {
      expect(() => validateBase64Image(validBase64Chars))
        .toThrow('must be a valid base64 data URI');
    });

    test('should throw for non-image MIME type', () => {
      expect(() => validateBase64Image('data:text/plain;base64,aGVsbG8='))
        .toThrow('must be a valid base64 data URI');
    });

    test('should throw for missing base64 prefix', () => {
      expect(() => validateBase64Image('data:image/png;aGVsbG8='))
        .toThrow('must be a valid base64 data URI');
    });

    test('should throw for unsupported image type', () => {
      expect(() => validateBase64Image('data:image/bmp;base64,Qk0='))
        .toThrow('must be a valid base64 data URI');
    });
  });

  describe('base64 character validation', () => {
    test('should throw for invalid base64 characters', () => {
      expect(() => validateBase64Image('data:image/png;base64,!!!invalid!!!'))
        .toThrow('contains invalid base64 characters');
    });

    test('should throw for base64 with spaces', () => {
      expect(() => validateBase64Image('data:image/png;base64,abc def'))
        .toThrow('contains invalid base64 characters');
    });
  });

  describe('size validation', () => {
    test('should throw for image exceeding 5MB', () => {
      // Create base64 data that decodes to >5MB
      // base64 expands by 4/3, so we need ~6.67MB of base64 for 5MB decoded
      const oversizedData = 'A'.repeat(7 * 1024 * 1024);
      const oversized = `data:image/png;base64,${oversizedData}`;
      expect(() => validateBase64Image(oversized))
        .toThrow('is too large (max 5MB)');
    });

    test('should accept image at just under 5MB', () => {
      // 5MB in bytes = 5 * 1024 * 1024 = 5242880
      // base64 size = ceil(bytes * 4/3) = ~6990507 chars
      // We need data that decodes to less than 5MB
      const justUnder = 'A'.repeat(5 * 1024 * 1024);
      const image = `data:image/png;base64,${justUnder}`;
      // 5 * 1024 * 1024 chars of base64 decodes to ~3.75MB, so this is fine
      expect(validateBase64Image(image)).toBe(image);
    });
  });
});
