var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-acU3Du/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/utils.js
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
__name(jsonResponse, "jsonResponse");
function handleCORS(request) {
  const allowedOrigins = [
    "https://thesuperiorflash.github.io"
  ];
  const isDev = typeof globalThis !== "undefined" && globalThis.env?.ENVIRONMENT === "development";
  if (isDev) {
    allowedOrigins.push("http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:3000");
  }
  const origin = request?.headers?.get("Origin") || "";
  let allowedOrigin = "null";
  if (origin) {
    if (allowedOrigins.includes(origin)) {
      allowedOrigin = origin;
    } else if (origin.startsWith("chrome-extension://")) {
      allowedOrigin = origin;
    } else if (origin.match(/^https:\/\/.*\.github\.io$/)) {
      allowedOrigin = origin;
    }
  }
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Credentials": "true"
    }
  });
}
__name(handleCORS, "handleCORS");
async function parseJSON(request) {
  try {
    return await request.json();
  } catch (error) {
    throw new Error("Invalid JSON body");
  }
}
__name(parseJSON, "parseJSON");
function generateUUID() {
  return crypto.randomUUID();
}
__name(generateUUID, "generateUUID");
function constantTimeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") {
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
__name(constantTimeCompare, "constantTimeCompare");

// src/validation.js
var ValidationError = class extends Error {
  static {
    __name(this, "ValidationError");
  }
  constructor(message, field = null) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
};
var MAX_BODY_SIZE = 1024 * 1024;
async function validateRequestBody(request, maxSize = MAX_BODY_SIZE) {
  try {
    const contentLength = request.headers.get("Content-Length");
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new ValidationError(`Request body too large. Maximum size: ${maxSize} bytes`);
    }
    const text = await request.text();
    if (text.length > maxSize) {
      throw new ValidationError(`Request body too large. Maximum size: ${maxSize} bytes`);
    }
    if (!text || text.trim() === "") {
      return {};
    }
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new ValidationError("Invalid JSON format");
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError("Failed to parse request body");
  }
}
__name(validateRequestBody, "validateRequestBody");
function validateEmail(email, required = true) {
  if (!email || email.trim() === "") {
    if (required) {
      throw new ValidationError("Email is required", "email");
    }
    return null;
  }
  if (typeof email !== "string") {
    throw new ValidationError("Email must be a string", "email");
  }
  email = email.trim();
  if (email.length > 320) {
    throw new ValidationError("Email is too long (max 320 characters)", "email");
  }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format", "email");
  }
  const [localPart, domain] = email.split("@");
  if (localPart.length > 64) {
    throw new ValidationError("Email local part is too long (max 64 characters)", "email");
  }
  if (domain.length > 255) {
    throw new ValidationError("Email domain is too long (max 255 characters)", "email");
  }
  const disposableDomains = ["tempmail.com", "throwaway.email", "guerrillamail.com"];
  if (disposableDomains.some((d) => domain.toLowerCase().endsWith(d))) {
    throw new ValidationError("Disposable email addresses are not allowed", "email");
  }
  return email.toLowerCase();
}
__name(validateEmail, "validateEmail");
function validateLicenseKey(licenseKey, required = true) {
  if (!licenseKey || licenseKey.trim() === "") {
    if (required) {
      throw new ValidationError("License key is required", "licenseKey");
    }
    return null;
  }
  if (typeof licenseKey !== "string") {
    throw new ValidationError("License key must be a string", "licenseKey");
  }
  const normalized = licenseKey.replace(/\s+/g, "").toUpperCase();
  if (normalized.length > 100) {
    throw new ValidationError("License key is too long", "licenseKey");
  }
  const licenseKeyRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (!licenseKeyRegex.test(normalized)) {
    throw new ValidationError("Invalid license key format. Expected format: XXXX-XXXX-XXXX-XXXX-XXXX", "licenseKey");
  }
  return normalized;
}
__name(validateLicenseKey, "validateLicenseKey");
function validateStripeSignature(signature) {
  if (!signature || typeof signature !== "string") {
    throw new ValidationError("Invalid webhook signature format");
  }
  const parts = signature.split(",");
  if (parts.length < 2) {
    throw new ValidationError("Invalid webhook signature format");
  }
  const signatureParts = {};
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (!key || !value) {
      throw new ValidationError("Invalid webhook signature format");
    }
    signatureParts[key] = value;
  }
  if (!signatureParts.t || !signatureParts.v1) {
    throw new ValidationError("Missing required signature components");
  }
  const timestamp = parseInt(signatureParts.t);
  if (isNaN(timestamp) || timestamp <= 0) {
    throw new ValidationError("Invalid signature timestamp");
  }
  if (!/^[a-f0-9]+$/i.test(signatureParts.v1)) {
    throw new ValidationError("Invalid signature format");
  }
  return signatureParts;
}
__name(validateStripeSignature, "validateStripeSignature");

// src/logger.js
var LogLevel = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  SECURITY: "SECURITY",
  AUDIT: "AUDIT"
};
var Logger = class _Logger {
  static {
    __name(this, "Logger");
  }
  constructor(env, context = {}) {
    this.env = env;
    this.context = context;
    this.minLevel = env?.LOG_LEVEL || "INFO";
  }
  /**
   * Format log entry with structured data
   */
  formatLog(level, message, data = {}) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...data
    };
    if (this.env?.ENVIRONMENT === "development") {
      logEntry.env = "development";
    }
    return logEntry;
  }
  /**
   * Check if log level should be output
   */
  shouldLog(level) {
    const levels = ["DEBUG", "INFO", "WARN", "ERROR", "SECURITY", "AUDIT"];
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
      severity: "high"
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
    return new _Logger(this.env, {
      ...this.context,
      ...additionalContext
    });
  }
};
function createRequestLogger(env, request) {
  const url = new URL(request.url);
  const context = {
    requestId: crypto.randomUUID(),
    method: request.method,
    path: url.pathname,
    userAgent: request.headers.get("User-Agent") || "unknown",
    origin: request.headers.get("Origin") || "unknown",
    ip: request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown"
  };
  return new Logger(env, context);
}
__name(createRequestLogger, "createRequestLogger");
function logAuth(logger, success, userId = null, method = "license_key") {
  if (success) {
    logger.audit("authentication_success", {
      userId,
      method
    });
  } else {
    logger.security("authentication_failed", {
      userId,
      method,
      reason: "invalid_credentials"
    });
  }
}
__name(logAuth, "logAuth");
function logLicenseCreation(logger, userId, email, tier) {
  logger.audit("license_created", {
    userId,
    email,
    tier,
    action: "create_license"
  });
}
__name(logLicenseCreation, "logLicenseCreation");
function logSubscription(logger, action, data = {}) {
  logger.audit(`subscription_${action}`, {
    ...data,
    category: "subscription"
  });
}
__name(logSubscription, "logSubscription");
function logValidationError(logger, field, error) {
  logger.warn("validation_error", {
    field,
    error: error.message,
    category: "validation"
  });
}
__name(logValidationError, "logValidationError");

// src/auth.js
var AuthHandler = class {
  static {
    __name(this, "AuthHandler");
  }
  constructor(env, logger = null) {
    this.env = env;
    this.db = env.DB;
    this.logger = logger;
  }
  /**
   * Generate a unique license key
   * Format: XXXX-XXXX-XXXX-XXXX-XXXX
   */
  generateLicenseKey() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const segments = 5;
    const segmentLength = 4;
    let key = "";
    for (let i = 0; i < segments; i++) {
      if (i > 0) key += "-";
      for (let j = 0; j < segmentLength; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    return key;
  }
  /**
   * Validate and activate license key
   * POST /api/auth/validate-key
   */
  async validateKey(request) {
    try {
      const body = await validateRequestBody(request);
      const normalizedKey = validateLicenseKey(body.licenseKey, true);
      const user = await this.db.prepare("SELECT * FROM users WHERE license_key = ?").bind(normalizedKey).first();
      if (!user) {
        if (this.logger) logAuth(this.logger, false, null);
        return jsonResponse({ error: "Invalid license key" }, 401);
      }
      await this.db.prepare("UPDATE users SET last_validated_at = datetime('now') WHERE id = ?").bind(user.id).run();
      if (this.logger) logAuth(this.logger, true, user.id);
      return jsonResponse({
        message: "License key validated successfully",
        user: {
          id: user.id,
          email: user.email,
          tier: user.tier,
          subscriptionStatus: user.subscription_status,
          licenseKey: user.license_key
        }
      });
    } catch (error) {
      if (this.logger) this.logger.error("License validation error", error);
      if (error instanceof ValidationError) {
        if (this.logger) logValidationError(this.logger, error.field, error);
        return jsonResponse({ error: error.message, field: error.field }, 400);
      }
      return jsonResponse({ error: "Validation failed" }, 500);
    }
  }
  /**
   * Get user info by license key
   * Used internally by other handlers
   */
  async getUserByLicenseKey(licenseKey) {
    try {
      const normalizedKey = licenseKey.replace(/\s+/g, "").toUpperCase();
      const user = await this.db.prepare("SELECT * FROM users WHERE license_key = ?").bind(normalizedKey).first();
      return user;
    } catch (error) {
      console.error("Get user error:", error);
      return null;
    }
  }
  /**
   * Authenticate request using license key in header
   * Header: Authorization: LicenseKey YOUR-KEY-HERE
   */
  async authenticate(request) {
    try {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("LicenseKey ")) {
        return null;
      }
      const licenseKey = authHeader.substring(11);
      const user = await this.getUserByLicenseKey(licenseKey);
      if (!user) {
        return null;
      }
      return {
        userId: user.id,
        email: user.email,
        tier: user.tier,
        licenseKey: user.license_key
      };
    } catch (error) {
      console.error("Authentication error:", error);
      return null;
    }
  }
  /**
   * Get current user info
   * GET /api/auth/me
   */
  async getCurrentUser(request) {
    try {
      const user = await this.authenticate(request);
      if (!user) {
        return jsonResponse({ error: "Not authenticated" }, 401);
      }
      const userData = await this.db.prepare("SELECT id, email, tier, license_key, subscription_status, created_at FROM users WHERE id = ?").bind(user.userId).first();
      if (!userData) {
        return jsonResponse({ error: "User not found" }, 404);
      }
      return jsonResponse({
        id: userData.id,
        email: userData.email,
        tier: userData.tier,
        licenseKey: userData.license_key,
        subscriptionStatus: userData.subscription_status,
        createdAt: userData.created_at
      });
    } catch (error) {
      console.error("Get user error:", error);
      return jsonResponse({ error: "Failed to fetch user" }, 500);
    }
  }
  /**
   * Create a new free license key
   * POST /api/auth/create-free-key
   * Required: email - to prevent abuse and track free tier users
   */
  async createFreeKey(request) {
    try {
      const body = await validateRequestBody(request);
      const normalizedEmail = validateEmail(body.email, true);
      const existingUser = await this.db.prepare("SELECT license_key, tier FROM users WHERE LOWER(email) = ? AND tier = ?").bind(normalizedEmail, "free").first();
      if (existingUser) {
        return jsonResponse({
          message: "Using existing free license key for this email",
          licenseKey: existingUser.license_key,
          tier: "free",
          existing: true
        }, 200);
      }
      let licenseKey;
      let attempts = 0;
      const maxAttempts = 10;
      while (attempts < maxAttempts) {
        licenseKey = this.generateLicenseKey();
        const existing = await this.db.prepare("SELECT id FROM users WHERE license_key = ?").bind(licenseKey).first();
        if (!existing) break;
        attempts++;
      }
      if (attempts >= maxAttempts) {
        return jsonResponse({ error: "Failed to generate unique license key" }, 500);
      }
      const userId = generateUUID();
      await this.db.prepare("INSERT INTO users (id, license_key, email, tier, subscription_status) VALUES (?, ?, ?, ?, ?)").bind(userId, licenseKey, normalizedEmail, "free", "inactive").run();
      if (this.logger) logLicenseCreation(this.logger, userId, normalizedEmail, "free");
      if (this.env.RESEND_API_KEY) {
        await this.sendLicenseKeyEmail(normalizedEmail, licenseKey, "free");
      }
      return jsonResponse({
        message: "Free license key created successfully",
        licenseKey,
        tier: "free"
      }, 201);
    } catch (error) {
      if (this.logger) this.logger.error("Create free key error", error);
      if (error instanceof ValidationError) {
        if (this.logger) logValidationError(this.logger, error.field, error);
        return jsonResponse({ error: error.message, field: error.field }, 400);
      }
      return jsonResponse({ error: "Failed to create license key" }, 500);
    }
  }
  /**
   * Send license key via email using Resend
   */
  async sendLicenseKeyEmail(email, licenseKey, tier) {
    try {
      if (!this.env.RESEND_API_KEY) {
        console.warn("Resend API key not configured, skipping email");
        return;
      }
      const subject = tier === "pro" ? "Your CaptureAI Pro License Key" : "Your CaptureAI Free License Key";
      const textContent = tier === "pro" ? `Welcome to CaptureAI Pro!

Thank you for upgrading to CaptureAI Pro!

YOUR LICENSE KEY:
${licenseKey}

How to activate:
1. Open the CaptureAI extension
2. Click "Enter License Key"
3. Copy and paste your license key above
4. Start using CaptureAI!

Pro Features:
- Unlimited requests (60 per minute)
- GPT-5 Nano AI model
- Priority support

Keep this email safe - you'll need your license key to use CaptureAI.

---
CaptureAI - AI-Powered Screenshot Analysis
https://thesuperiorflash.github.io/CaptureAI` : `Welcome to CaptureAI!

Thank you for trying CaptureAI!

YOUR LICENSE KEY:
${licenseKey}

How to activate:
1. Open the CaptureAI extension
2. Click "Enter License Key"
3. Copy and paste your license key above
4. Start using CaptureAI!

Free tier includes 10 requests per day. Upgrade to Pro for unlimited access!

Keep this email safe - you'll need your license key to use CaptureAI.

---
CaptureAI - AI-Powered Screenshot Analysis
https://thesuperiorflash.github.io/CaptureAI`;
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                CaptureAI ${tier === "pro" ? "Pro" : ""}
              </h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                Welcome to CaptureAI!
              </h2>
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.6;">
                Thank you for ${tier === "pro" ? "upgrading to CaptureAI Pro" : "trying CaptureAI"}! Here's your license key to get started.
              </p>

              <!-- License Key Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; border: 2px solid #e9ecef; text-align: center;">
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                      Your License Key
                    </p>
                    <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; color: #667eea; letter-spacing: 2px; word-break: break-all;">
                      ${licenseKey}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Instructions -->
              <h3 style="margin: 30px 0 15px; color: #333333; font-size: 18px; font-weight: 600;">
                How to activate:
              </h3>
              <ol style="margin: 0; padding-left: 20px; color: #555555; font-size: 16px; line-height: 1.8;">
                <li>Open the CaptureAI Chrome extension</li>
                <li>Click "Enter License Key"</li>
                <li>Copy and paste your license key from above</li>
                <li>Start using CaptureAI!</li>
              </ol>

              ${tier === "pro" ? `
              <!-- Pro Features -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 100%); padding: 25px; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px; color: #333333; font-size: 18px; font-weight: 600;">
                      Your Pro Features:
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 16px; line-height: 1.8;">
                      <li>Unlimited requests (60 per minute)</li>
                      <li>GPT-5 Nano AI model</li>
                      <li>Priority support</li>
                    </ul>
                  </td>
                </tr>
              </table>
              ` : `
              <p style="margin: 30px 0 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; color: #856404; font-size: 14px; line-height: 1.6; border-radius: 4px;">
                <strong>Free tier includes 10 requests per day.</strong><br>
                Upgrade to Pro for unlimited access!
              </p>
              `}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                <strong>Keep this email safe</strong> - you'll need your license key to use CaptureAI.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                CaptureAI - AI-Powered Screenshot Analysis<br>
                <a href="https://thesuperiorflash.github.io/CaptureAI" style="color: #667eea; text-decoration: none;">Visit our website</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      await this.sendEmailViaResend(email, subject, htmlContent, textContent, tier);
    } catch (error) {
      console.error("Email sending error:", error);
    }
  }
  /**
   * Send email via Resend
   */
  async sendEmailViaResend(email, subject, htmlContent, textContent, tier = "free") {
    console.log("Attempting to send email via Resend to:", email);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: this.env.FROM_EMAIL || "CaptureAI <noreply@captureai.app>",
        to: [email],
        subject,
        html: htmlContent,
        text: textContent,
        headers: {
          "X-Entity-Ref-ID": crypto.randomUUID()
        },
        tags: [
          {
            name: "category",
            value: tier === "pro" ? "license_pro" : "license_free"
          }
        ]
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      if (this.logger) {
        this.logger.error("Resend email error", null, { error: errorText });
      }
      console.error("Resend error:", errorText);
    } else {
      if (this.logger) {
        this.logger.info("Email sent successfully", { provider: "resend", to: email });
      }
    }
  }
};

// src/ai.js
var AIHandler = class {
  static {
    __name(this, "AIHandler");
  }
  constructor(env) {
    this.env = env;
    this.db = env.DB;
    this.auth = new AuthHandler(env);
    this.gatewayName = env.CLOUDFLARE_GATEWAY_NAME || "captureai-gateway";
    this.accountId = env.CLOUDFLARE_ACCOUNT_ID || this.extractAccountId(env);
    this.apiUrl = `https://gateway.ai.cloudflare.com/v1/${this.accountId}/${this.gatewayName}/compat/v1/chat/completions`;
  }
  extractAccountId(env) {
    return env.CLOUDFLARE_ACCOUNT_ID || "YOUR_ACCOUNT_ID";
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
      const user = await this.auth.authenticate(request);
      if (!user) {
        return jsonResponse({ error: "Not authenticated" }, 401);
      }
      const usageCheck = await this.checkUsageLimit(user.userId, user.tier);
      if (!usageCheck.allowed) {
        const errorMessage = usageCheck.limitType === "per_minute" ? "Rate limit reached. Please wait a moment before trying again." : "Daily limit reached";
        return jsonResponse({
          error: errorMessage,
          limit: usageCheck.limit,
          used: usageCheck.used,
          tier: user.tier,
          limitType: usageCheck.limitType
        }, 429);
      }
      const { question, imageData, promptType, reasoningLevel } = await parseJSON(request);
      if (!question && !imageData) {
        return jsonResponse({ error: "Question or image data required" }, 400);
      }
      const payload = this.buildPayload({
        question,
        imageData,
        promptType: promptType || "answer"
      }, reasoningLevel || 1);
      const startTime = Date.now();
      const aiResponse = await this.sendToGateway(payload, user.userId);
      const responseTime = Date.now() - startTime;
      const answer = aiResponse.choices[0]?.message?.content?.trim() || "No response found";
      await this.recordUsage({
        userId: user.userId,
        promptType: promptType || "answer",
        model: payload.model,
        tokensUsed: aiResponse.usage?.total_tokens || 0,
        responseTime,
        cached: aiResponse.cached || false
      });
      return jsonResponse({
        answer,
        usage: {
          tokensUsed: aiResponse.usage?.total_tokens || 0,
          remainingToday: usageCheck.limitType === "per_day" ? usageCheck.limit - usageCheck.used - 1 : null,
          dailyLimit: usageCheck.limitType === "per_day" ? usageCheck.limit : null,
          usedToday: usageCheck.limitType === "per_day" ? usageCheck.used + 1 : null,
          limitType: usageCheck.limitType
        },
        cached: aiResponse.cached || false,
        responseTime,
        model: payload.model
      });
    } catch (error) {
      console.error("AI completion error:", error);
      return jsonResponse({
        error: "AI request failed",
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
        return jsonResponse({ error: "Not authenticated" }, 401);
      }
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const usageToday = await this.db.prepare(`
          SELECT COUNT(*) as count
          FROM usage_records
          WHERE user_id = ? AND DATE(created_at) = ?
        `).bind(user.userId, today).first();
      const used = usageToday?.count || 0;
      if (user.tier === "pro") {
        const oneMinuteAgo = new Date(Date.now() - 6e4).toISOString();
        const usageLastMinute = await this.db.prepare(`
            SELECT COUNT(*) as count
            FROM usage_records
            WHERE user_id = ? AND created_at > ?
          `).bind(user.userId, oneMinuteAgo).first();
        const usedLastMinute = usageLastMinute?.count || 0;
        const rateLimit = parseInt(this.env.PRO_TIER_RATE_LIMIT_PER_MINUTE || "60");
        return jsonResponse({
          today: {
            used,
            limit: null,
            // Unlimited daily
            remaining: null,
            percentage: 0
          },
          lastMinute: {
            used: usedLastMinute,
            limit: rateLimit,
            remaining: Math.max(0, rateLimit - usedLastMinute),
            percentage: Math.round(usedLastMinute / rateLimit * 100)
          },
          tier: user.tier,
          limitType: "per_minute"
        });
      } else {
        const dailyLimit = parseInt(this.env.FREE_TIER_DAILY_LIMIT || "10");
        return jsonResponse({
          today: {
            used,
            limit: dailyLimit,
            remaining: Math.max(0, dailyLimit - used),
            percentage: Math.round(used / dailyLimit * 100)
          },
          tier: user.tier,
          limitType: "per_day"
        });
      }
    } catch (error) {
      console.error("Usage fetch error:", error);
      return jsonResponse({ error: "Failed to fetch usage" }, 500);
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
          id: "gpt-5-nano",
          name: "GPT-5 Nano",
          description: "Fast and efficient reasoning",
          tier: "all"
        }
      ]
    });
  }
  /**
   * Check if user is within usage limits
   */
  async checkUsageLimit(userId, tier) {
    if (tier === "pro") {
      const rateLimit = parseInt(this.env.PRO_TIER_RATE_LIMIT_PER_MINUTE || "30");
      const oneMinuteAgo = new Date(Date.now() - 6e4).toISOString();
      const result2 = await this.db.prepare(`
          SELECT COUNT(*) as count
          FROM usage_records
          WHERE user_id = ? AND created_at > ?
        `).bind(userId, oneMinuteAgo).first();
      const usedInLastMinute = result2?.count || 0;
      return {
        allowed: usedInLastMinute < rateLimit,
        used: usedInLastMinute,
        limit: rateLimit,
        limitType: "per_minute"
      };
    }
    const limit = parseInt(this.env.FREE_TIER_DAILY_LIMIT || "10");
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const result = await this.db.prepare(`
        SELECT COUNT(*) as count
        FROM usage_records
        WHERE user_id = ? AND DATE(created_at) = ?
      `).bind(userId, today).first();
    const used = result?.count || 0;
    return {
      allowed: used < limit,
      used,
      limit,
      limitType: "per_day"
    };
  }
  /**
   * Record usage in database
   */
  async recordUsage({ userId, promptType, model, tokensUsed, responseTime, cached }) {
    await this.db.prepare(`
        INSERT INTO usage_records (user_id, prompt_type, model, tokens_used, response_time, cached)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(userId, promptType, model, tokensUsed, responseTime, cached ? 1 : 0).run();
  }
  /**
   * Build OpenAI payload
   */
  buildPayload(requestData, reasoningLevel) {
    const { question, imageData, promptType } = requestData;
    const configs = {
      0: { model: "openai/gpt-4.1-nano", reasoningEffort: null },
      // Legacy model, no reasoning
      1: { model: "openai/gpt-5-nano", reasoningEffort: "low" },
      2: { model: "openai/gpt-5-nano", reasoningEffort: "medium" }
    };
    const config = configs[reasoningLevel] || configs[1];
    let messages = [];
    if (promptType === "ask" && question && imageData) {
      messages = [{
        role: "user",
        content: [
          { type: "text", text: question },
          { type: "image_url", image_url: { url: imageData } }
        ]
      }];
    } else if (promptType === "ask" && question) {
      messages = [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: question }
      ];
    } else if (promptType === "auto_solve" && imageData) {
      messages = [{
        role: "user",
        content: [
          { type: "text", text: "Answer with only the number (1, 2, 3, or 4) of the correct choice." },
          { type: "image_url", image_url: { url: imageData } }
        ]
      }];
    } else {
      messages = [{
        role: "user",
        content: [
          { type: "text", text: "Reply with answer only." },
          { type: "image_url", image_url: { url: imageData } }
        ]
      }];
    }
    const payload = {
      model: config.model,
      messages
    };
    const maxTokens = promptType === "ask" ? 4e3 : 2500;
    if (config.useLegacyTokenParam) {
      payload.max_tokens = maxTokens;
    } else {
      payload.max_completion_tokens = maxTokens;
    }
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
      "Content-Type": "application/json",
      "cf-aig-metadata-user": userId
    };
    if (this.env.CLOUDFLARE_GATEWAY_TOKEN) {
      headers["cf-aig-authorization"] = this.env.CLOUDFLARE_GATEWAY_TOKEN;
    }
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI error (${response.status}): ${error.error?.message || response.statusText}`);
    }
    const data = await response.json();
    const cfCacheStatus = response.headers.get("cf-cache-status");
    if (cfCacheStatus === "HIT") {
      data.cached = true;
    }
    return data;
  }
};

// src/subscription.js
var SubscriptionHandler = class {
  static {
    __name(this, "SubscriptionHandler");
  }
  constructor(env, logger = null) {
    this.env = env;
    this.db = env.DB;
    this.auth = new AuthHandler(env, logger);
    this.stripeKey = env.STRIPE_SECRET_KEY;
    this.webhookSecret = env.STRIPE_WEBHOOK_SECRET;
    this.logger = logger;
  }
  /**
   * Create Stripe checkout session for Pro tier
   * POST /api/subscription/create-checkout
   */
  async createCheckout(request) {
    try {
      const body = await validateRequestBody(request);
      const email = validateEmail(body.email, true);
      const priceId = this.env.STRIPE_PRICE_PRO;
      if (!priceId) {
        return jsonResponse({ error: "Price not configured" }, 500);
      }
      let customerId;
      const existingUser = await this.db.prepare("SELECT stripe_customer_id FROM users WHERE email = ?").bind(email).first();
      if (existingUser?.stripe_customer_id) {
        customerId = existingUser.stripe_customer_id;
      } else {
        const customer = await this.createStripeCustomer(email);
        customerId = customer.id;
      }
      const session = await this.createStripeCheckout(customerId, priceId, email);
      if (this.logger) {
        logSubscription(this.logger, "checkout_created", {
          email,
          sessionId: session.id
        });
      }
      return jsonResponse({
        url: session.url,
        sessionId: session.id
      });
    } catch (error) {
      if (this.logger) this.logger.error("Checkout creation error", error);
      if (error instanceof ValidationError) {
        if (this.logger) logValidationError(this.logger, error.field, error);
        return jsonResponse({ error: error.message, field: error.field }, 400);
      }
      return jsonResponse({ error: "Failed to create checkout" }, 500);
    }
  }
  /**
   * Handle Stripe webhook events
   * POST /api/subscription/webhook
   */
  async handleWebhook(request) {
    try {
      const signature = request.headers.get("stripe-signature");
      const body = await request.text();
      if (!signature || !this.webhookSecret) {
        console.error("Missing signature or webhook secret");
        return jsonResponse({ error: "Webhook verification failed" }, 400);
      }
      const event = await this.verifyWebhookSignature(body, signature);
      switch (event.type) {
        case "checkout.session.completed": {
          await this.handleCheckoutCompleted(event.data.object);
          break;
        }
        case "invoice.payment_succeeded": {
          await this.handlePaymentSucceeded(event.data.object);
          break;
        }
        case "invoice.payment_failed": {
          await this.handlePaymentFailed(event.data.object);
          break;
        }
        case "customer.subscription.deleted": {
          await this.handleSubscriptionCancelled(event.data.object);
          break;
        }
        case "customer.subscription.updated": {
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        }
      }
      return jsonResponse({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      return jsonResponse({ error: "Webhook failed" }, 500);
    }
  }
  /**
   * Handle successful checkout - generate and send license key
   */
  async handleCheckoutCompleted(session) {
    try {
      let customerEmail = session.customer_email || session.customer_details?.email;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      if (!customerEmail && customerId) {
        const customerResponse = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
          headers: {
            "Authorization": `Bearer ${this.stripeKey}`
          }
        });
        if (customerResponse.ok) {
          const customer = await customerResponse.json();
          customerEmail = customer.email;
        }
      }
      if (!customerEmail) {
        console.error("No customer email in checkout session or customer object");
        return;
      }
      let user = await this.db.prepare("SELECT * FROM users WHERE email = ? OR stripe_customer_id = ?").bind(customerEmail, customerId).first();
      if (user) {
        await this.db.prepare(`
            UPDATE users
            SET tier = ?,
                subscription_status = ?,
                stripe_customer_id = ?,
                stripe_subscription_id = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `).bind("pro", "active", customerId, subscriptionId, user.id).run();
        console.log(`Upgraded user ${customerEmail} to Pro tier`);
        if (this.env.RESEND_API_KEY) {
          await this.auth.sendLicenseKeyEmail(customerEmail, user.license_key, "pro");
        }
      } else {
        let licenseKey;
        let attempts = 0;
        while (attempts < 10) {
          licenseKey = this.auth.generateLicenseKey();
          const existing = await this.db.prepare("SELECT id FROM users WHERE license_key = ?").bind(licenseKey).first();
          if (!existing) break;
          attempts++;
        }
        const userId = generateUUID();
        await this.db.prepare(`
            INSERT INTO users (id, license_key, email, tier, stripe_customer_id, stripe_subscription_id, subscription_status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(userId, licenseKey, customerEmail, "pro", customerId, subscriptionId, "active").run();
        console.log(`Created new Pro user ${customerEmail} with license key`);
        if (this.env.RESEND_API_KEY) {
          await this.auth.sendLicenseKeyEmail(customerEmail, licenseKey, "pro");
        }
      }
    } catch (error) {
      console.error("Checkout completion error:", error);
    }
  }
  /**
   * Handle successful payment (monthly renewal)
   */
  async handlePaymentSucceeded(invoice) {
    try {
      const customerEmail = invoice.customer_email;
      if (customerEmail) {
        await this.db.prepare("UPDATE users SET subscription_status = ?, tier = ? WHERE email = ?").bind("active", "pro", customerEmail).run();
      }
    } catch (error) {
      console.error("Payment succeeded handler error:", error);
    }
  }
  /**
   * Handle failed payment
   */
  async handlePaymentFailed(invoice) {
    try {
      const customerEmail = invoice.customer_email;
      if (customerEmail) {
        await this.db.prepare("UPDATE users SET subscription_status = ? WHERE email = ?").bind("past_due", customerEmail).run();
      }
    } catch (error) {
      console.error("Payment failed handler error:", error);
    }
  }
  /**
   * Handle subscription cancellation
   */
  async handleSubscriptionCancelled(subscription) {
    try {
      const subscriptionId = subscription.id;
      await this.db.prepare("UPDATE users SET tier = ?, subscription_status = ? WHERE stripe_subscription_id = ?").bind("free", "cancelled", subscriptionId).run();
    } catch (error) {
      console.error("Subscription cancellation handler error:", error);
    }
  }
  /**
   * Handle subscription update
   */
  async handleSubscriptionUpdated(subscription) {
    try {
      const subscriptionId = subscription.id;
      const status = subscription.status;
      const newTier = status === "active" ? "pro" : "free";
      const subscriptionStatus = status === "active" ? "active" : "inactive";
      await this.db.prepare("UPDATE users SET tier = ?, subscription_status = ? WHERE stripe_subscription_id = ?").bind(newTier, subscriptionStatus, subscriptionId).run();
    } catch (error) {
      console.error("Subscription update handler error:", error);
    }
  }
  /**
   * Get billing portal URL (for managing subscription)
   * GET /api/subscription/portal
   */
  async getPortal(request) {
    try {
      const user = await this.auth.authenticate(request);
      if (!user) {
        return jsonResponse({ error: "Not authenticated" }, 401);
      }
      const userData = await this.db.prepare("SELECT stripe_customer_id FROM users WHERE id = ?").bind(user.userId).first();
      if (!userData?.stripe_customer_id) {
        return jsonResponse({ error: "No subscription found" }, 400);
      }
      const portal = await this.createBillingPortal(userData.stripe_customer_id);
      return jsonResponse({ url: portal.url });
    } catch (error) {
      console.error("Portal error:", error);
      return jsonResponse({ error: "Failed to create portal" }, 500);
    }
  }
  /**
   * Get available plans
   * GET /api/subscription/plans
   */
  async getPlans(request) {
    return jsonResponse({
      plans: [
        {
          tier: "free",
          name: "Free",
          price: 0,
          dailyLimit: parseInt(this.env.FREE_TIER_DAILY_LIMIT || "10"),
          features: []
        },
        {
          tier: "pro",
          name: "Pro",
          price: 9.99,
          dailyLimit: null,
          rateLimit: "60 per minute",
          features: ["Unlimited requests", "GPT-5 Nano", "60 requests/minute"],
          recommended: true
        }
      ]
    });
  }
  /**
   * Create Stripe customer
   */
  async createStripeCustomer(email) {
    const response = await fetch("https://api.stripe.com/v1/customers", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        email
      })
    });
    if (!response.ok) {
      const error = await response.json();
      console.error("Stripe customer creation failed:", error);
      throw new Error(error.error?.message || "Failed to create Stripe customer");
    }
    return await response.json();
  }
  /**
   * Create Stripe checkout session
   */
  async createStripeCheckout(customerId, priceId, email) {
    const params = {
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      mode: "subscription",
      success_url: `${this.env.EXTENSION_URL || "https://thesuperiorflash.github.io/CaptureAI"}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.env.EXTENSION_URL || "https://thesuperiorflash.github.io/CaptureAI"}/activate.html`
    };
    if (customerId) {
      params.customer = customerId;
    } else {
      params.customer_email = email;
    }
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(params)
    });
    if (!response.ok) {
      const error = await response.json();
      console.error("Stripe checkout creation failed:", error);
      throw new Error(error.error?.message || "Failed to create checkout session");
    }
    return await response.json();
  }
  /**
   * Create billing portal session
   */
  async createBillingPortal(customerId) {
    const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: `${this.env.EXTENSION_URL || "https://thesuperiorflash.github.io/CaptureAI"}/activate.html`
      })
    });
    if (!response.ok) {
      throw new Error("Failed to create portal session");
    }
    return await response.json();
  }
  /**
   * Verify Stripe webhook signature using HMAC SHA256
   * Includes replay attack detection with processed event tracking
   */
  async verifyWebhookSignature(payload, signature) {
    const signatureParts = validateStripeSignature(signature);
    const timestamp = signatureParts.t;
    const expectedSignature = signatureParts.v1;
    const currentTime = Math.floor(Date.now() / 1e3);
    const timeDiff = currentTime - parseInt(timestamp);
    if (timeDiff > 120) {
      if (this.logger) {
        this.logger.security("Webhook timestamp too old", {
          timeDiff,
          timestamp,
          currentTime
        });
      }
      throw new Error("Webhook timestamp too old (max 2 minutes)");
    }
    if (timeDiff < -30) {
      if (this.logger) {
        this.logger.security("Webhook timestamp in future", {
          timeDiff,
          timestamp,
          currentTime
        });
      }
      throw new Error("Webhook timestamp is in the future");
    }
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(this.webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedPayload)
    );
    const computedSignature = Array.from(new Uint8Array(signatureBytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
    if (!constantTimeCompare(computedSignature, expectedSignature)) {
      if (this.logger) {
        this.logger.security("Webhook signature verification failed");
      }
      throw new Error("Signature verification failed");
    }
    const event = JSON.parse(payload);
    const eventId = event.id;
    if (eventId) {
      const processed = await this.checkWebhookProcessed(eventId);
      if (processed) {
        if (this.logger) {
          this.logger.security("Duplicate webhook detected (replay attack)", {
            eventId,
            eventType: event.type
          });
        }
        throw new Error("Webhook already processed");
      }
      await this.markWebhookProcessed(eventId, timestamp);
    }
    return event;
  }
  /**
   * Check if webhook event has been processed
   */
  async checkWebhookProcessed(eventId) {
    try {
      const result = await this.db.prepare("SELECT id FROM webhook_events WHERE event_id = ?").bind(eventId).first();
      return !!result;
    } catch (error) {
      if (this.logger) {
        this.logger.warn("Webhook tracking table may not exist", { error: error.message });
      }
      return false;
    }
  }
  /**
   * Mark webhook event as processed
   */
  async markWebhookProcessed(eventId, timestamp) {
    try {
      await this.db.prepare("INSERT INTO webhook_events (event_id, processed_at, webhook_timestamp) VALUES (?, datetime('now'), ?)").bind(eventId, timestamp).run();
    } catch (error) {
      if (this.logger) {
        this.logger.error("Failed to mark webhook as processed", error, { eventId });
      }
    }
  }
};

// src/router.js
var Router = class {
  static {
    __name(this, "Router");
  }
  constructor(env, logger = null) {
    this.env = env;
    this.logger = logger;
    this.auth = new AuthHandler(env, logger);
    this.ai = new AIHandler(env, logger);
    this.subscription = new SubscriptionHandler(env, logger);
  }
  /**
   * Route incoming request
   */
  async route(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (path === "/" && method === "GET") {
      return jsonResponse({
        status: "CaptureAI License Key Backend is running",
        version: "1.0.0",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    if (path === "/health" && method === "GET") {
      return jsonResponse({
        status: "ok",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        service: "CaptureAI Workers Backend",
        version: "1.0.0"
      });
    }
    if (path === "/api/auth/create-free-key" && method === "POST") {
      return this.auth.createFreeKey(request);
    }
    if (path === "/api/auth/validate-key" && method === "POST") {
      return this.auth.validateKey(request);
    }
    if (path === "/api/auth/me" && method === "GET") {
      return this.auth.getCurrentUser(request);
    }
    if (path === "/api/auth/usage" && method === "GET") {
      return this.ai.getUsage(request);
    }
    if (path === "/api/ai/solve" && method === "POST") {
      return this.ai.solve(request);
    }
    if (path === "/api/ai/complete" && method === "POST") {
      return this.ai.complete(request);
    }
    if (path === "/api/ai/usage" && method === "GET") {
      return this.ai.getUsage(request);
    }
    if (path === "/api/ai/models" && method === "GET") {
      return this.ai.getModels(request);
    }
    if (path === "/api/subscription/create-checkout" && method === "POST") {
      return this.subscription.createCheckout(request);
    }
    if (path === "/api/subscription/webhook" && method === "POST") {
      return this.subscription.handleWebhook(request);
    }
    if (path === "/api/subscription/portal" && method === "GET") {
      return this.subscription.getPortal(request);
    }
    if (path === "/api/subscription/plans" && method === "GET") {
      return this.subscription.getPlans(request);
    }
    return jsonResponse(
      { error: "Route not found", path },
      404
    );
  }
};

// src/index.js
var src_default = {
  async fetch(request, env, ctx) {
    const logger = createRequestLogger(env, request);
    const startTime = Date.now();
    if (request.method === "OPTIONS") {
      logger.debug("CORS preflight request");
      return handleCORS(request);
    }
    try {
      logger.info("Request received");
      const router = new Router(env, logger);
      const response = await router.route(request);
      const duration = Date.now() - startTime;
      logger.info("Request completed", {
        status: response.status,
        duration
      });
      return addCORSHeaders(response, request);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Worker error", error, { duration });
      return new Response(
        JSON.stringify({
          error: "Internal server error"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...getCORSHeaders(request)
          }
        }
      );
    }
  }
};
function addCORSHeaders(response) {
  const newResponse = new Response(response.body, response);
  Object.entries(getCORSHeaders()).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  return newResponse;
}
__name(addCORSHeaders, "addCORSHeaders");
function getCORSHeaders(request) {
  const allowedOrigins = [
    "https://thesuperiorflash.github.io"
  ];
  const isDev = typeof globalThis !== "undefined" && globalThis.env?.ENVIRONMENT === "development";
  if (isDev) {
    allowedOrigins.push("http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:3000");
  }
  const origin = request?.headers?.get("Origin") || "";
  let allowedOrigin = "null";
  if (origin) {
    if (allowedOrigins.includes(origin)) {
      allowedOrigin = origin;
    } else if (origin.startsWith("chrome-extension://")) {
      allowedOrigin = origin;
    } else if (origin.match(/^https:\/\/.*\.github\.io$/)) {
      allowedOrigin = origin;
    }
  }
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true"
  };
}
__name(getCORSHeaders, "getCORSHeaders");

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-acU3Du/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-acU3Du/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
