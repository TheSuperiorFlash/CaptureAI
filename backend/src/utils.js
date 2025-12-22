/**
 * Utility functions
 */

/**
 * Create JSON response
 */
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Handle CORS preflight
 */
export function handleCORS(request) {
  // List of allowed origins
  const allowedOrigins = [
    'https://thesuperiorflash.github.io',
    'https://captureai.dev',
  ];

  // Development/testing origins (only if in dev mode)
  const isDev = typeof globalThis !== 'undefined' && globalThis.env?.ENVIRONMENT === 'development';
  if (isDev) {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000');
  }

  // Get origin from request
  const origin = request?.headers?.get('Origin') || '';

  // Check if origin is allowed
  let allowedOrigin = 'null';
  if (origin) {
    // Exact match for standard origins
    if (allowedOrigins.includes(origin)) {
      allowedOrigin = origin;
    }
    // Chrome extension support (all extensions allowed)
    else if (origin.startsWith('chrome-extension://')) {
      allowedOrigin = origin;
    }
    // Match GitHub Pages subdomain
    else if (origin.match(/^https:\/\/.*\.github\.io$/)) {
      allowedOrigin = origin;
    }
  }

  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true',
    }
  });
}

/**
 * Parse JSON body safely with validation
 * @deprecated Use validateRequestBody from validation.js instead
 */
export async function parseJSON(request) {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON body');
  }
}

/**
 * Hash password using Web Crypto API
 * Note: Workers don't have bcrypt, so we use PBKDF2
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Import key
  const key = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // Derive bits (hash)
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );

  // Combine salt + hash
  const hashArray = new Uint8Array(hashBuffer);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  // Return base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password, hash) {
  try {
    // Decode hash
    const combined = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const originalHash = combined.slice(16);

    // Hash password with same salt
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    const key = await crypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      256
    );

    const newHash = new Uint8Array(hashBuffer);

    // Compare
    if (originalHash.length !== newHash.length) return false;

    for (let i = 0; i < originalHash.length; i++) {
      if (originalHash[i] !== newHash[i]) return false;
    }

    return true;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Create JWT token using Web Crypto API
 */
export async function createJWT(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = await sign(message, secret);

  return `${message}.${signature}`;
}

/**
 * Verify JWT token
 */
export async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');

    const [encodedHeader, encodedPayload, signature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;

    // Verify signature
    const expectedSignature = await sign(message, secret);
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload));

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    return payload;
  } catch (error) {
    throw new Error('Invalid token: ' + error.message);
  }
}

/**
 * Sign message with HMAC-SHA256
 */
async function sign(message, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );

  return base64UrlEncode(signature);
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(data) {
  let base64;

  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    // ArrayBuffer
    base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  }

  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

/**
 * Generate random UUID
 */
export function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
