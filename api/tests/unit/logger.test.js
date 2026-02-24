/**
 * Unit Tests for Logger Module
 * Tests structured logging, PII redaction, and specialized loggers
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import {
  Logger,
  LogLevel,
  createRequestLogger,
  logAuth,
  logLicenseCreation,
  logSubscription,
  logApiUsage,
  logRateLimit,
  logRateLimitExceeded,
  logValidationError,
  logDatabaseOp,
  logWebhook,
  logCorsRejection,
  sanitizeLogData
} from '../../src/logger.js';

describe('LogLevel', () => {
  test('should have all expected log levels', () => {
    expect(LogLevel.DEBUG).toBe('DEBUG');
    expect(LogLevel.INFO).toBe('INFO');
    expect(LogLevel.WARN).toBe('WARN');
    expect(LogLevel.ERROR).toBe('ERROR');
    expect(LogLevel.SECURITY).toBe('SECURITY');
    expect(LogLevel.AUDIT).toBe('AUDIT');
  });

  test('should have exactly 6 levels', () => {
    expect(Object.keys(LogLevel)).toHaveLength(6);
  });
});

describe('Logger', () => {
  let logger;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { LOG_LEVEL: 'DEBUG', ENVIRONMENT: 'development' };
    logger = new Logger(mockEnv);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('constructor', () => {
    test('should set env and context', () => {
      const ctx = { requestId: '123' };
      const l = new Logger(mockEnv, ctx);
      expect(l.env).toBe(mockEnv);
      expect(l.context).toEqual(ctx);
    });

    test('should default minLevel to INFO if not set', () => {
      const l = new Logger({});
      expect(l.minLevel).toBe('INFO');
    });

    test('should use LOG_LEVEL from env', () => {
      const l = new Logger({ LOG_LEVEL: 'ERROR' });
      expect(l.minLevel).toBe('ERROR');
    });

    test('should handle null env', () => {
      const l = new Logger(null);
      expect(l.minLevel).toBe('INFO');
    });
  });

  describe('shouldLog', () => {
    test('should allow levels at or above minLevel', () => {
      logger.minLevel = 'WARN';
      expect(logger.shouldLog('DEBUG')).toBe(false);
      expect(logger.shouldLog('INFO')).toBe(false);
      expect(logger.shouldLog('WARN')).toBe(true);
      expect(logger.shouldLog('ERROR')).toBe(true);
      expect(logger.shouldLog('SECURITY')).toBe(true);
      expect(logger.shouldLog('AUDIT')).toBe(true);
    });

    test('should allow all levels when minLevel is DEBUG', () => {
      logger.minLevel = 'DEBUG';
      expect(logger.shouldLog('DEBUG')).toBe(true);
      expect(logger.shouldLog('INFO')).toBe(true);
      expect(logger.shouldLog('AUDIT')).toBe(true);
    });

    test('should block all but AUDIT when minLevel is AUDIT', () => {
      logger.minLevel = 'AUDIT';
      expect(logger.shouldLog('DEBUG')).toBe(false);
      expect(logger.shouldLog('INFO')).toBe(false);
      expect(logger.shouldLog('WARN')).toBe(false);
      expect(logger.shouldLog('ERROR')).toBe(false);
      expect(logger.shouldLog('SECURITY')).toBe(false);
      expect(logger.shouldLog('AUDIT')).toBe(true);
    });
  });

  describe('formatLog', () => {
    test('should include timestamp, level, and message', () => {
      const entry = logger.formatLog('INFO', 'test message');
      expect(entry.timestamp).toBeDefined();
      expect(entry.level).toBe('INFO');
      expect(entry.message).toBe('test message');
    });

    test('should include additional data', () => {
      const entry = logger.formatLog('INFO', 'test', { userId: '123' });
      expect(entry.userId).toBe('123');
    });

    test('should include context from constructor', () => {
      const l = new Logger(mockEnv, { requestId: 'req-1' });
      const entry = l.formatLog('INFO', 'test');
      expect(entry.requestId).toBe('req-1');
    });

    test('should add env field in development', () => {
      const entry = logger.formatLog('INFO', 'test');
      expect(entry.env).toBe('development');
    });

    test('should not add env field in production', () => {
      const l = new Logger({ ENVIRONMENT: 'production' });
      const entry = l.formatLog('INFO', 'test');
      expect(entry.env).toBeUndefined();
    });

    test('should sanitize data to prevent PII leaks', () => {
      const entry = logger.formatLog('INFO', 'test', { password: 'secret123' });
      expect(entry.password).toBe('[REDACTED]');
    });
  });

  describe('output', () => {
    test('should use console.error for ERROR level', () => {
      logger.output({ level: LogLevel.ERROR, message: 'err' });
      expect(console.error).toHaveBeenCalled();
    });

    test('should use console.error for SECURITY level', () => {
      logger.output({ level: LogLevel.SECURITY, message: 'sec' });
      expect(console.error).toHaveBeenCalled();
    });

    test('should use console.warn for WARN level', () => {
      logger.output({ level: LogLevel.WARN, message: 'warn' });
      expect(console.warn).toHaveBeenCalled();
    });

    test('should use console.log for INFO level', () => {
      logger.output({ level: LogLevel.INFO, message: 'info' });
      expect(console.log).toHaveBeenCalled();
    });

    test('should use console.log for DEBUG level', () => {
      logger.output({ level: LogLevel.DEBUG, message: 'debug' });
      expect(console.log).toHaveBeenCalled();
    });

    test('should use console.log for AUDIT level', () => {
      logger.output({ level: LogLevel.AUDIT, message: 'audit' });
      expect(console.log).toHaveBeenCalled();
    });

    test('should output JSON string', () => {
      logger.output({ level: LogLevel.INFO, message: 'test' });
      const arg = console.log.mock.calls[0][0];
      expect(() => JSON.parse(arg)).not.toThrow();
    });
  });

  describe('debug', () => {
    test('should log at DEBUG level', () => {
      logger.debug('debug message');
      expect(console.log).toHaveBeenCalled();
      const parsed = JSON.parse(console.log.mock.calls[0][0]);
      expect(parsed.level).toBe('DEBUG');
      expect(parsed.message).toBe('debug message');
    });

    test('should not log when minLevel is above DEBUG', () => {
      logger.minLevel = 'INFO';
      logger.debug('should not appear');
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    test('should log at INFO level', () => {
      logger.info('info message', { key: 'value' });
      expect(console.log).toHaveBeenCalled();
      const parsed = JSON.parse(console.log.mock.calls[0][0]);
      expect(parsed.level).toBe('INFO');
      expect(parsed.key).toBe('value');
    });
  });

  describe('warn', () => {
    test('should log at WARN level', () => {
      logger.warn('warning message');
      expect(console.warn).toHaveBeenCalled();
      const parsed = JSON.parse(console.warn.mock.calls[0][0]);
      expect(parsed.level).toBe('WARN');
    });
  });

  describe('error', () => {
    test('should log at ERROR level with error object', () => {
      const err = new Error('test error');
      logger.error('error occurred', err);
      expect(console.error).toHaveBeenCalled();
      const parsed = JSON.parse(console.error.mock.calls[0][0]);
      expect(parsed.level).toBe('ERROR');
      expect(parsed.error.message).toBe('test error');
      expect(parsed.error.name).toBe('Error');
      expect(parsed.error.stack).toBeDefined();
    });

    test('should log at ERROR level without error object', () => {
      logger.error('error occurred');
      expect(console.error).toHaveBeenCalled();
      const parsed = JSON.parse(console.error.mock.calls[0][0]);
      expect(parsed.error).toBeUndefined();
    });

    test('should include additional data', () => {
      logger.error('error occurred', null, { context: 'auth' });
      const parsed = JSON.parse(console.error.mock.calls[0][0]);
      expect(parsed.context).toBe('auth');
    });
  });

  describe('security', () => {
    test('should log at SECURITY level with high severity', () => {
      logger.security('security event', { ip: '1.2.3.4' });
      expect(console.error).toHaveBeenCalled();
      const parsed = JSON.parse(console.error.mock.calls[0][0]);
      expect(parsed.level).toBe('SECURITY');
      expect(parsed.severity).toBe('high');
      expect(parsed.ip).toBe('1.2.3.4');
    });
  });

  describe('audit', () => {
    test('should log at AUDIT level with auditEvent flag', () => {
      logger.audit('user_created', { userId: '123' });
      expect(console.log).toHaveBeenCalled();
      const parsed = JSON.parse(console.log.mock.calls[0][0]);
      expect(parsed.level).toBe('AUDIT');
      expect(parsed.message).toBe('user_created');
      expect(parsed.auditEvent).toBe(true);
      expect(parsed.userId).toBe('123');
    });
  });

  describe('child', () => {
    test('should create child logger with additional context', () => {
      const parent = new Logger(mockEnv, { requestId: 'req-1' });
      const child = parent.child({ userId: 'user-1' });

      expect(child).toBeInstanceOf(Logger);
      expect(child.context.requestId).toBe('req-1');
      expect(child.context.userId).toBe('user-1');
    });

    test('child should inherit env from parent', () => {
      const parent = new Logger(mockEnv);
      const child = parent.child({ extra: true });
      expect(child.env).toBe(mockEnv);
    });

    test('child context should override parent context for same keys', () => {
      const parent = new Logger(mockEnv, { key: 'parent' });
      const child = parent.child({ key: 'child' });
      expect(child.context.key).toBe('child');
    });
  });
});

describe('sanitizeLogData', () => {
  test('should redact password field', () => {
    const result = sanitizeLogData({ password: 'secret123' });
    expect(result.password).toBe('[REDACTED]');
  });

  test('should redact token field', () => {
    const result = sanitizeLogData({ token: 'abc123' });
    expect(result.token).toBe('[REDACTED]');
  });

  test('should redact apiKey field', () => {
    const result = sanitizeLogData({ apiKey: 'sk-12345' });
    expect(result.apiKey).toBe('[REDACTED]');
  });

  test('should redact secret field', () => {
    const result = sanitizeLogData({ secret: 'shh' });
    expect(result.secret).toBe('[REDACTED]');
  });

  test('should redact licenseKey field', () => {
    const result = sanitizeLogData({ licenseKey: 'ABCD-EFGH-IJKL-MNOP-QRST' });
    expect(result.licenseKey).toBe('[REDACTED]');
  });

  test('should redact stripeKey field', () => {
    const result = sanitizeLogData({ stripeKey: 'sk_test_123' });
    expect(result.stripeKey).toBe('[REDACTED]');
  });

  test('should redact creditCard field', () => {
    const result = sanitizeLogData({ creditCard: '4111111111111111' });
    expect(result.creditCard).toBe('[REDACTED]');
  });

  test('should mask license_key showing last 4 chars', () => {
    const result = sanitizeLogData({ license_key: 'ABCD-EFGH-IJKL-MNOP-QRST' });
    expect(result.license_key).toBe('****-****-****-****-QRST');
  });

  test('should handle short license_key', () => {
    const result = sanitizeLogData({ license_key: 'AB' });
    expect(result.license_key).toBe('****-****-****-****-AB');
  });

  test('should not modify non-sensitive fields', () => {
    const result = sanitizeLogData({ userId: '123', action: 'login' });
    expect(result.userId).toBe('123');
    expect(result.action).toBe('login');
  });

  test('should recursively sanitize nested objects', () => {
    const result = sanitizeLogData({
      user: {
        name: 'John',
        password: 'secret',
        settings: {
          apiKey: 'key123'
        }
      }
    });
    expect(result.user.name).toBe('John');
    expect(result.user.password).toBe('[REDACTED]');
    expect(result.user.settings.apiKey).toBe('[REDACTED]');
  });

  test('should not modify arrays', () => {
    const result = sanitizeLogData({ tags: ['a', 'b'] });
    expect(result.tags).toEqual(['a', 'b']);
  });

  test('should handle null values', () => {
    const result = sanitizeLogData({ key: null });
    expect(result.key).toBeNull();
  });

  test('should handle empty object', () => {
    const result = sanitizeLogData({});
    expect(result).toEqual({});
  });

  test('should not mutate original data', () => {
    const original = { password: 'secret', name: 'test' };
    sanitizeLogData(original);
    expect(original.password).toBe('secret');
  });
});

describe('createRequestLogger', () => {
  test('should create logger with request context', () => {
    const mockEnv = { LOG_LEVEL: 'DEBUG' };
    const headerMap = new Map([
      ['User-Agent', 'Mozilla/5.0'],
      ['Origin', 'https://captureai.dev'],
      ['CF-Connecting-IP', '1.2.3.4']
    ]);
    const mockRequest = {
      url: 'https://api.example.com/api/auth/me?foo=bar',
      method: 'GET',
      headers: { get: (key) => headerMap.get(key) || null }
    };

    const reqLogger = createRequestLogger(mockEnv, mockRequest);

    expect(reqLogger).toBeInstanceOf(Logger);
    expect(reqLogger.context.method).toBe('GET');
    expect(reqLogger.context.path).toBe('/api/auth/me');
    expect(reqLogger.context.requestId).toBeDefined();
  });

  test('should extract IP from CF-Connecting-IP header', () => {
    const headers = new Map([
      ['CF-Connecting-IP', '10.0.0.1'],
      ['User-Agent', 'test'],
      ['Origin', 'https://test.com']
    ]);
    const request = {
      url: 'https://api.example.com/test',
      method: 'POST',
      headers: { get: (key) => headers.get(key) || null }
    };

    const reqLogger = createRequestLogger({}, request);
    expect(reqLogger.context.ip).toBe('10.0.0.1');
  });

  test('should fall back to X-Forwarded-For when no CF-Connecting-IP', () => {
    const headers = new Map([
      ['X-Forwarded-For', '192.168.1.1'],
      ['User-Agent', 'test'],
      ['Origin', 'https://test.com']
    ]);
    const request = {
      url: 'https://api.example.com/test',
      method: 'POST',
      headers: { get: (key) => headers.get(key) || null }
    };

    const reqLogger = createRequestLogger({}, request);
    expect(reqLogger.context.ip).toBe('192.168.1.1');
  });

  test('should use unknown when no IP headers present', () => {
    const request = {
      url: 'https://api.example.com/test',
      method: 'POST',
      headers: { get: () => null }
    };

    const reqLogger = createRequestLogger({}, request);
    expect(reqLogger.context.ip).toBe('unknown');
  });
});

describe('Specialized Loggers', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger({ LOG_LEVEL: 'DEBUG' });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('logAuth', () => {
    test('should log successful auth as audit', () => {
      logAuth(logger, true, 'user-123', 'license_key');
      const parsed = JSON.parse(console.log.mock.calls[0][0]);
      expect(parsed.level).toBe('AUDIT');
      expect(parsed.message).toBe('authentication_success');
      expect(parsed.userId).toBe('user-123');
      expect(parsed.method).toBe('license_key');
    });

    test('should log failed auth as security event', () => {
      logAuth(logger, false, 'user-456');
      const parsed = JSON.parse(console.error.mock.calls[0][0]);
      expect(parsed.level).toBe('SECURITY');
      expect(parsed.message).toBe('authentication_failed');
      expect(parsed.reason).toBe('invalid_credentials');
    });
  });

  describe('logLicenseCreation', () => {
    test('should log license creation as audit', () => {
      logLicenseCreation(logger, 'user-1', 'test@example.com', 'free');
      const parsed = JSON.parse(console.log.mock.calls[0][0]);
      expect(parsed.level).toBe('AUDIT');
      expect(parsed.message).toBe('license_created');
      expect(parsed.userId).toBe('user-1');
      expect(parsed.tier).toBe('free');
      expect(parsed.action).toBe('create_license');
    });
  });

  describe('logSubscription', () => {
    test('should log subscription action as audit', () => {
      logSubscription(logger, 'created', { userId: 'u1', plan: 'pro' });
      const parsed = JSON.parse(console.log.mock.calls[0][0]);
      expect(parsed.level).toBe('AUDIT');
      expect(parsed.message).toBe('subscription_created');
      expect(parsed.category).toBe('subscription');
      expect(parsed.userId).toBe('u1');
    });
  });

  describe('logApiUsage', () => {
    test('should log API usage as info', () => {
      logApiUsage(logger, '/api/ai/complete', 'user-1', 'pro', 150);
      const parsed = JSON.parse(console.log.mock.calls[0][0]);
      expect(parsed.level).toBe('INFO');
      expect(parsed.message).toBe('api_request');
      expect(parsed.endpoint).toBe('/api/ai/complete');
      expect(parsed.responseTime).toBe(150);
      expect(parsed.category).toBe('usage');
    });
  });

  describe('logRateLimit', () => {
    test('should log rate limit warning', () => {
      logRateLimit(logger, 'user-1', 'free', 10, 8);
      const parsed = JSON.parse(console.warn.mock.calls[0][0]);
      expect(parsed.level).toBe('WARN');
      expect(parsed.message).toBe('rate_limit_approached');
      expect(parsed.percentage).toBe(80);
    });

    test('should calculate percentage correctly', () => {
      logRateLimit(logger, 'user-1', 'pro', 60, 30);
      const parsed = JSON.parse(console.warn.mock.calls[0][0]);
      expect(parsed.percentage).toBe(50);
    });
  });

  describe('logRateLimitExceeded', () => {
    test('should log rate limit exceeded as security event', () => {
      logRateLimitExceeded(logger, 'user-1', 'free');
      const parsed = JSON.parse(console.error.mock.calls[0][0]);
      expect(parsed.level).toBe('SECURITY');
      expect(parsed.message).toBe('rate_limit_exceeded');
      expect(parsed.action).toBe('blocked');
    });
  });

  describe('logValidationError', () => {
    test('should log validation error as warning', () => {
      logValidationError(logger, 'email', new Error('Invalid email'));
      const parsed = JSON.parse(console.warn.mock.calls[0][0]);
      expect(parsed.level).toBe('WARN');
      expect(parsed.message).toBe('validation_error');
      expect(parsed.field).toBe('email');
      expect(parsed.error).toBe('Invalid email');
      expect(parsed.category).toBe('validation');
    });
  });

  describe('logDatabaseOp', () => {
    test('should log database operation as debug', () => {
      logDatabaseOp(logger, 'SELECT', 'users', 5);
      const parsed = JSON.parse(console.log.mock.calls[0][0]);
      expect(parsed.level).toBe('DEBUG');
      expect(parsed.message).toBe('database_operation');
      expect(parsed.operation).toBe('SELECT');
      expect(parsed.table).toBe('users');
      expect(parsed.duration).toBe(5);
    });

    test('should omit duration when null', () => {
      logDatabaseOp(logger, 'INSERT', 'users');
      const parsed = JSON.parse(console.log.mock.calls[0][0]);
      expect(parsed.duration).toBeUndefined();
    });
  });

  describe('logWebhook', () => {
    test('should log successful webhook as audit', () => {
      logWebhook(logger, 'checkout.session.completed', true, { sessionId: 'cs_123' });
      const parsed = JSON.parse(console.log.mock.calls[0][0]);
      expect(parsed.level).toBe('AUDIT');
      expect(parsed.message).toBe('webhook_processed');
      expect(parsed.event).toBe('checkout.session.completed');
      expect(parsed.category).toBe('webhook');
    });

    test('should log failed webhook as error', () => {
      logWebhook(logger, 'invoice.payment_failed', false, { reason: 'bad sig' });
      const parsed = JSON.parse(console.error.mock.calls[0][0]);
      expect(parsed.level).toBe('ERROR');
      expect(parsed.message).toBe('webhook_failed');
      expect(parsed.category).toBe('webhook');
    });
  });

  describe('logCorsRejection', () => {
    test('should log CORS rejection as security event', () => {
      logCorsRejection(logger, 'https://evil.com');
      const parsed = JSON.parse(console.error.mock.calls[0][0]);
      expect(parsed.level).toBe('SECURITY');
      expect(parsed.message).toBe('cors_rejected');
      expect(parsed.origin).toBe('https://evil.com');
      expect(parsed.reason).toBe('origin_not_allowed');
    });
  });
});
