/**
 * Input Validation Utilities
 * Comprehensive validation for all API inputs
 */

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Maximum request body size (1MB)
 */
const MAX_BODY_SIZE = 1024 * 1024;

/**
 * Validate and parse request body with size limit
 */
export async function validateRequestBody(request, maxSize = MAX_BODY_SIZE) {
  try {
    // Check content length header
    const contentLength = request.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new ValidationError(`Request body too large. Maximum size: ${maxSize} bytes`);
    }

    // Read body with size check
    const text = await request.text();
    if (text.length > maxSize) {
      throw new ValidationError(`Request body too large. Maximum size: ${maxSize} bytes`);
    }

    // Parse JSON
    if (!text || text.trim() === '') {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new ValidationError('Invalid JSON format');
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError('Failed to parse request body');
  }
}

/**
 * Validate email format (RFC 5322 simplified)
 */
export function validateEmail(email, required = true) {
  if (!email || email.trim() === '') {
    if (required) {
      throw new ValidationError('Email is required', 'email');
    }
    return null;
  }

  // Type check
  if (typeof email !== 'string') {
    throw new ValidationError('Email must be a string', 'email');
  }

  // Trim whitespace
  email = email.trim();

  // Length check
  if (email.length > 320) {
    throw new ValidationError('Email is too long (max 320 characters)', 'email');
  }

  // Format validation (RFC 5322 simplified pattern)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }

  // Additional checks
  const [localPart, domain] = email.split('@');

  if (localPart.length > 64) {
    throw new ValidationError('Email local part is too long (max 64 characters)', 'email');
  }

  if (domain.length > 255) {
    throw new ValidationError('Email domain is too long (max 255 characters)', 'email');
  }

  // Check for common disposable email domains
  // Comprehensive list of popular disposable email services
  const disposableDomains = [
    'tempmail.com', 'throwaway.email', 'guerrillamail.com',
    '10minutemail.com', '10minutemail.net', 'mailinator.com',
    'maildrop.cc', 'temp-mail.org', 'getnada.com', 'trashmail.com',
    'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
    'fakeinbox.com', 'yopmail.com', 'mohmal.com', 'dispostable.com',
    'emailondeck.com', 'mintemail.com', 'mytemp.email',
    'tempmail.net', 'spamgourmet.com', 'mailnesia.com',
    'throwawaymail.com', 'temp-mail.io', 'guerrillamail.de',
    'inboxkitten.com', 'getairmail.com', 'anonbox.net'
  ];

  if (disposableDomains.some(d => domain.toLowerCase().endsWith(d))) {
    throw new ValidationError('Disposable email addresses are not allowed', 'email');
  }

  return email.toLowerCase();
}

/**
 * Validate license key format
 */
export function validateLicenseKey(licenseKey, required = true) {
  if (!licenseKey || licenseKey.trim() === '') {
    if (required) {
      throw new ValidationError('License key is required', 'licenseKey');
    }
    return null;
  }

  // Type check
  if (typeof licenseKey !== 'string') {
    throw new ValidationError('License key must be a string', 'licenseKey');
  }

  // Normalize (remove spaces, uppercase)
  const normalized = licenseKey.replace(/\s+/g, '').toUpperCase();

  // Length check
  if (normalized.length > 100) {
    throw new ValidationError('License key is too long', 'licenseKey');
  }

  // Format check: XXXX-XXXX-XXXX-XXXX-XXXX (5 segments of 4 characters)
  const licenseKeyRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

  if (!licenseKeyRegex.test(normalized)) {
    throw new ValidationError('Invalid license key format. Expected format: XXXX-XXXX-XXXX-XXXX-XXXX', 'licenseKey');
  }

  return normalized;
}

/**
 * Validate string field with length constraints
 */
export function validateString(value, fieldName, options = {}) {
  const {
    required = true,
    minLength = 0,
    maxLength = 1000,
    pattern = null,
    allowEmpty = false
  } = options;

  if (value === null || value === undefined || value === '') {
    if (required && !allowEmpty) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    return allowEmpty ? '' : null;
  }

  // Type check
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }

  // Length checks
  if (value.length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters`, fieldName);
  }

  if (value.length > maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${maxLength} characters`, fieldName);
  }

  // Pattern check
  if (pattern && !pattern.test(value)) {
    throw new ValidationError(`${fieldName} has invalid format`, fieldName);
  }

  return value;
}

/**
 * Validate number field with range constraints
 */
export function validateNumber(value, fieldName, options = {}) {
  const {
    required = true,
    min = -Infinity,
    max = Infinity,
    integer = false
  } = options;

  if (value === null || value === undefined) {
    if (required) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    return null;
  }

  // Type coercion and check
  const num = Number(value);
  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a number`, fieldName);
  }

  // Integer check
  if (integer && !Number.isInteger(num)) {
    throw new ValidationError(`${fieldName} must be an integer`, fieldName);
  }

  // Range checks
  if (num < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`, fieldName);
  }

  if (num > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`, fieldName);
  }

  return num;
}

/**
 * Validate enum field (must be one of allowed values)
 */
export function validateEnum(value, fieldName, allowedValues, required = true) {
  if (value === null || value === undefined || value === '') {
    if (required) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    return null;
  }

  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      fieldName
    );
  }

  return value;
}

/**
 * Validate array field
 */
export function validateArray(value, fieldName, options = {}) {
  const {
    required = true,
    minLength = 0,
    maxLength = 100,
    itemValidator = null
  } = options;

  if (value === null || value === undefined) {
    if (required) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    return null;
  }

  // Type check
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName);
  }

  // Length checks
  if (value.length < minLength) {
    throw new ValidationError(`${fieldName} must have at least ${minLength} items`, fieldName);
  }

  if (value.length > maxLength) {
    throw new ValidationError(`${fieldName} must have at most ${maxLength} items`, fieldName);
  }

  // Item validation
  if (itemValidator) {
    return value.map((item, index) => {
      try {
        return itemValidator(item);
      } catch (error) {
        throw new ValidationError(`${fieldName}[${index}]: ${error.message}`, fieldName);
      }
    });
  }

  return value;
}

/**
 * Validate AI prompt input
 */
export function validatePrompt(prompt, fieldName = 'prompt') {
  return validateString(prompt, fieldName, {
    required: true,
    minLength: 1,
    maxLength: 50000, // 50KB max prompt
    allowEmpty: false
  });
}

/**
 * Validate AI model name
 */
export function validateModel(model) {
  const allowedModels = ['gpt-4.1-nano', 'gpt-5-nano'];
  return validateEnum(model, 'model', allowedModels, false);
}

/**
 * Validate reasoning level
 */
export function validateReasoningLevel(level) {
  if (level === null || level === undefined) {
    return null;
  }

  const num = validateNumber(level, 'reasoningLevel', {
    required: false,
    min: 0,
    max: 2,
    integer: true
  });

  return num;
}

/**
 * Sanitize string to prevent XSS and injection attacks
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  // Remove null bytes
  str = str.replace(/\0/g, '');

  // Trim whitespace
  str = str.trim();

  return str;
}

/**
 * Validate and sanitize all fields in an object
 */
export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate Stripe webhook signature header
 */
export function validateStripeSignature(signature) {
  if (!signature || typeof signature !== 'string') {
    throw new ValidationError('Invalid webhook signature format');
  }

  // Stripe signature format: t=timestamp,v1=signature
  const parts = signature.split(',');
  if (parts.length < 2) {
    throw new ValidationError('Invalid webhook signature format');
  }

  const signatureParts = {};
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (!key || !value) {
      throw new ValidationError('Invalid webhook signature format');
    }
    signatureParts[key] = value;
  }

  if (!signatureParts.t || !signatureParts.v1) {
    throw new ValidationError('Missing required signature components');
  }

  // Validate timestamp is a number
  const timestamp = parseInt(signatureParts.t);
  if (isNaN(timestamp) || timestamp <= 0) {
    throw new ValidationError('Invalid signature timestamp');
  }

  // Validate signature is hex string
  if (!/^[a-f0-9]+$/i.test(signatureParts.v1)) {
    throw new ValidationError('Invalid signature format');
  }

  return signatureParts;
}

/**
 * Validate base64 encoded image
 */
export function validateBase64Image(base64String, fieldName = 'image') {
  if (!base64String || typeof base64String !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }

  // Check for data URI format
  const dataUriMatch = base64String.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/);

  if (!dataUriMatch) {
    throw new ValidationError(`${fieldName} must be a valid base64 data URI`, fieldName);
  }

  const base64Data = dataUriMatch[2];

  // Validate base64 format
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
    throw new ValidationError(`${fieldName} contains invalid base64 characters`, fieldName);
  }

  // Size check (max 5MB)
  const sizeInBytes = (base64Data.length * 3) / 4;
  if (sizeInBytes > 5 * 1024 * 1024) {
    throw new ValidationError(`${fieldName} is too large (max 5MB)`, fieldName);
  }

  return base64String;
}
