/**
 * Structured Logging System
 * Provides consistent, searchable logging across the application
 */

/**
 * Log levels
 */
export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SECURITY: 'SECURITY',
  AUDIT: 'AUDIT'
};

/**
 * Logger class with structured output
 */
export class Logger {
  constructor(env, context = {}) {
    this.env = env;
    this.context = context;
    this.minLevel = env?.LOG_LEVEL || 'INFO';
  }

  /**
   * Format log entry with structured data
   */
  formatLog(level, message, data = {}) {
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...data
    };

    // Add environment info in development
    if (this.env?.ENVIRONMENT === 'development') {
      logEntry.env = 'development';
    }

    return logEntry;
  }

  /**
   * Check if log level should be output
   */
  shouldLog(level) {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'SECURITY', 'AUDIT'];
    const minIndex = levels.indexOf(this.minLevel);
    const currentIndex = levels.indexOf(level);
    return currentIndex >= minIndex;
  }

  /**
   * Output log to console
   */
  output(logEntry) {
    const { level, ...data } = logEntry;

    switch (level) {
      case LogLevel.ERROR:
      case LogLevel.SECURITY:
        console.error(JSON.stringify(logEntry));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(logEntry));
        break;
      default:
        console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Debug log
   */
  debug(message, data = {}) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    this.output(this.formatLog(LogLevel.DEBUG, message, data));
  }

  /**
   * Info log
   */
  info(message, data = {}) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    this.output(this.formatLog(LogLevel.INFO, message, data));
  }

  /**
   * Warning log
   */
  warn(message, data = {}) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    this.output(this.formatLog(LogLevel.WARN, message, data));
  }

  /**
   * Error log
   */
  error(message, error = null, data = {}) {
    const errorData = {
      ...data
    };

    if (error) {
      errorData.error = {
        message: error.message,
        name: error.name,
        stack: error.stack
      };
    }

    this.output(this.formatLog(LogLevel.ERROR, message, errorData));
  }

  /**
   * Security event log
   */
  security(message, data = {}) {
    this.output(this.formatLog(LogLevel.SECURITY, message, {
      ...data,
      severity: 'high'
    }));
  }

  /**
   * Audit log for critical business events
   */
  audit(action, data = {}) {
    this.output(this.formatLog(LogLevel.AUDIT, action, {
      ...data,
      auditEvent: true
    }));
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext) {
    return new Logger(this.env, {
      ...this.context,
      ...additionalContext
    });
  }
}

/**
 * Request logger middleware
 * Adds request-specific context to all logs
 */
export function createRequestLogger(env, request) {
  const url = new URL(request.url);

  const context = {
    requestId: crypto.randomUUID(),
    method: request.method,
    path: url.pathname,
    userAgent: request.headers.get('User-Agent') || 'unknown',
    origin: request.headers.get('Origin') || 'unknown',
    ip: request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For') ||
        'unknown'
  };

  return new Logger(env, context);
}

/**
 * Log authentication event
 */
export function logAuth(logger, success, userId = null, method = 'license_key') {
  if (success) {
    logger.audit('authentication_success', {
      userId,
      method
    });
  } else {
    logger.security('authentication_failed', {
      userId,
      method,
      reason: 'invalid_credentials'
    });
  }
}

/**
 * Log license key creation
 */
export function logLicenseCreation(logger, userId, email, tier) {
  logger.audit('license_created', {
    userId,
    email,
    tier,
    action: 'create_license'
  });
}

/**
 * Log subscription event
 */
export function logSubscription(logger, action, data = {}) {
  logger.audit(`subscription_${action}`, {
    ...data,
    category: 'subscription'
  });
}

/**
 * Log API usage
 */
export function logApiUsage(logger, endpoint, userId, tier, responseTime) {
  logger.info('api_request', {
    endpoint,
    userId,
    tier,
    responseTime,
    category: 'usage'
  });
}

/**
 * Log rate limit event
 */
export function logRateLimit(logger, userId, tier, limit, current) {
  logger.warn('rate_limit_approached', {
    userId,
    tier,
    limit,
    current,
    percentage: Math.round((current / limit) * 100)
  });
}

/**
 * Log rate limit exceeded
 */
export function logRateLimitExceeded(logger, userId, tier) {
  logger.security('rate_limit_exceeded', {
    userId,
    tier,
    action: 'blocked'
  });
}

/**
 * Log validation error
 */
export function logValidationError(logger, field, error) {
  logger.warn('validation_error', {
    field,
    error: error.message,
    category: 'validation'
  });
}

/**
 * Log database operation
 */
export function logDatabaseOp(logger, operation, table, duration = null) {
  const data = {
    operation,
    table,
    category: 'database'
  };

  if (duration !== null) {
    data.duration = duration;
  }

  logger.debug('database_operation', data);
}

/**
 * Log webhook event
 */
export function logWebhook(logger, event, success, data = {}) {
  if (success) {
    logger.audit('webhook_processed', {
      event,
      ...data,
      category: 'webhook'
    });
  } else {
    logger.error('webhook_failed', null, {
      event,
      ...data,
      category: 'webhook'
    });
  }
}

/**
 * Log CORS rejection
 */
export function logCorsRejection(logger, origin) {
  logger.security('cors_rejected', {
    origin,
    reason: 'origin_not_allowed'
  });
}

/**
 * Sanitize sensitive data from logs
 */
export function sanitizeLogData(data) {
  const sanitized = { ...data };

  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'secret',
    'licenseKey',
    'stripeKey',
    'creditCard'
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Redact partial license key (show only last 4 chars)
  if (sanitized.license_key && typeof sanitized.license_key === 'string') {
    const key = sanitized.license_key;
    sanitized.license_key = `****-****-****-****-${key.slice(-4)}`;
  }

  // Recursively sanitize nested objects
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeLogData(value);
    }
  }

  return sanitized;
}
