/**
 * License Key Authentication Handler
 * Handles license key validation and user management
 */

import { jsonResponse, parseJSON, generateUUID, fetchWithTimeout } from './utils';
import { validateRequestBody, validateEmail, validateLicenseKey, ValidationError } from './validation';
import { logAuth, logLicenseCreation, logValidationError } from './logger';
import { checkRateLimit, getClientIdentifier, RateLimitPresets } from './ratelimit';

export class AuthHandler {
  constructor(env, logger = null) {
    this.env = env;
    this.db = env.DB;
    this.logger = logger;
  }

  /**
   * Generate a unique license key
   * Format: XXXX-XXXX-XXXX-XXXX-XXXX
   * Uses cryptographically secure random number generation
   */
  generateLicenseKey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like I, O, 0, 1
    const segments = 5;
    const segmentLength = 4;

    let key = '';
    for (let i = 0; i < segments; i++) {
      if (i > 0) key += '-';
      for (let j = 0; j < segmentLength; j++) {
        // Use cryptographically secure random number generation
        const randomValues = crypto.getRandomValues(new Uint8Array(1));
        const randomIndex = randomValues[0] % chars.length;
        key += chars.charAt(randomIndex);
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
      // Rate limiting - prevent brute force attacks
      const clientId = getClientIdentifier(request);
      const rateLimitError = await checkRateLimit(
        `validate:${clientId}`,
        RateLimitPresets.LICENSE_VALIDATION.limit,
        RateLimitPresets.LICENSE_VALIDATION.windowMs,
        this.env
      );
      if (rateLimitError) {
        return jsonResponse(rateLimitError, 429);
      }

      const body = await validateRequestBody(request);
      const normalizedKey = validateLicenseKey(body.licenseKey, true);

      // Find user by license key
      const user = await this.db
        .prepare('SELECT * FROM users WHERE license_key = ?')
        .bind(normalizedKey)
        .first();

      if (!user) {
        if (this.logger) logAuth(this.logger, false, null);
        return jsonResponse({ error: 'Invalid license key' }, 401);
      }

      // Update last validated timestamp
      await this.db
        .prepare('UPDATE users SET last_validated_at = datetime(\'now\') WHERE id = ?')
        .bind(user.id)
        .run();

      if (this.logger) logAuth(this.logger, true, user.id);

      return jsonResponse({
        message: 'License key validated successfully',
        user: {
          id: user.id,
          email: user.email,
          tier: user.tier,
          subscriptionStatus: user.subscription_status,
          licenseKey: user.license_key
        }
      });

    } catch (error) {
      if (this.logger) this.logger.error('License validation error', error);
      if (error instanceof ValidationError) {
        if (this.logger) logValidationError(this.logger, error.field, error);
        return jsonResponse({ error: error.message, field: error.field }, 400);
      }
      return jsonResponse({ error: 'Validation failed' }, 500);
    }
  }

  /**
   * Get user info by license key
   * Used internally by other handlers
   */
  async getUserByLicenseKey(licenseKey) {
    try {
      const normalizedKey = licenseKey.replace(/\s+/g, '').toUpperCase();

      const user = await this.db
        .prepare('SELECT * FROM users WHERE license_key = ?')
        .bind(normalizedKey)
        .first();

      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Authenticate request using license key in header
   * Header: Authorization: LicenseKey YOUR-KEY-HERE
   */
  async authenticate(request) {
    try {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('LicenseKey ')) {
        return null;
      }

      const licenseKey = authHeader.substring(11); // Remove 'LicenseKey '
      const user = await this.getUserByLicenseKey(licenseKey);

      if (!user) {
        return null;
      }

      // Check subscription status for Pro users
      if (user.tier === 'pro' && user.subscription_status !== 'active') {
        if (this.logger) {
          this.logger.security('Pro user with inactive subscription attempted access', {
            userId: user.id,
            subscriptionStatus: user.subscription_status
          });
        }
        return null; // Treat as unauthorized
      }

      // Return user data in JWT-like format for compatibility
      return {
        userId: user.id,
        email: user.email,
        tier: user.tier,
        licenseKey: user.license_key,
        subscriptionStatus: user.subscription_status
      };

    } catch (error) {
      console.error('Authentication error:', error);
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
        return jsonResponse({ error: 'Not authenticated' }, 401);
      }

      // Get full user data
      const userData = await this.db
        .prepare('SELECT id, email, tier, license_key, subscription_status, created_at FROM users WHERE id = ?')
        .bind(user.userId)
        .first();

      if (!userData) {
        return jsonResponse({ error: 'User not found' }, 404);
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
      console.error('Get user error:', error);
      return jsonResponse({ error: 'Failed to fetch user' }, 500);
    }
  }

  /**
   * Create a new free license key
   * POST /api/auth/create-free-key
   * Required: email - to prevent abuse and track free tier users
   */
  async createFreeKey(request) {
    try {
      // Rate limiting - prevent abuse of free key creation
      const clientId = getClientIdentifier(request);
      const rateLimitError = await checkRateLimit(
        `freekey:${clientId}`,
        RateLimitPresets.FREE_KEY_CREATION.limit,
        RateLimitPresets.FREE_KEY_CREATION.windowMs,
        this.env
      );
      if (rateLimitError) {
        return jsonResponse(rateLimitError, 429);
      }

      const body = await validateRequestBody(request);
      const normalizedEmail = validateEmail(body.email, true);

      // Check if email already has a free key
      const existingUser = await this.db
        .prepare('SELECT license_key, tier FROM users WHERE LOWER(email) = ? AND tier = ?')
        .bind(normalizedEmail, 'free')
        .first();

      if (existingUser) {
        // Resend email with existing key (don't return it in response to prevent enumeration)
        if (this.env.RESEND_API_KEY) {
          await this.sendLicenseKeyEmail(normalizedEmail, existingUser.license_key, 'free');
        }

        // Return same response as new key creation to prevent email enumeration
        return jsonResponse({
          message: 'Free license key created successfully. Please check your email.',
          tier: 'free'
        }, 201);
      }

      // Generate unique license key
      let licenseKey;
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        licenseKey = this.generateLicenseKey();

        // Check if key already exists
        const existing = await this.db
          .prepare('SELECT id FROM users WHERE license_key = ?')
          .bind(licenseKey)
          .first();

        if (!existing) break;
        attempts++;
      }

      if (attempts >= maxAttempts) {
        return jsonResponse({ error: 'Failed to generate unique license key' }, 500);
      }

      // Create user with free tier
      const userId = generateUUID();
      await this.db
        .prepare('INSERT INTO users (id, license_key, email, tier, subscription_status) VALUES (?, ?, ?, ?, ?)')
        .bind(userId, licenseKey, normalizedEmail, 'free', 'inactive')
        .run();

      if (this.logger) logLicenseCreation(this.logger, userId, normalizedEmail, 'free');

      // If email service configured, send the key
      let emailSent = false;
      if (this.env.RESEND_API_KEY) {
        emailSent = await this.sendLicenseKeyEmail(normalizedEmail, licenseKey, 'free');
      }

      // Return appropriate message based on email status
      if (!this.env.RESEND_API_KEY) {
        return jsonResponse({
          message: 'Free license key created successfully. Email service not configured.',
          licenseKey, // Include key in response if email can't be sent
          tier: 'free'
        }, 201);
      } else if (!emailSent) {
        return jsonResponse({
          message: 'Free license key created but email delivery failed. Please contact support.',
          tier: 'free',
          emailFailed: true
        }, 201);
      }

      return jsonResponse({
        message: 'Free license key created successfully. Please check your email.',
        tier: 'free'
      }, 201);

    } catch (error) {
      if (this.logger) this.logger.error('Create free key error', error);
      if (error instanceof ValidationError) {
        if (this.logger) logValidationError(this.logger, error.field, error);
        return jsonResponse({ error: error.message, field: error.field }, 400);
      }
      return jsonResponse({ error: 'Failed to create license key' }, 500);
    }
  }

  /**
   * Send license key via email using Resend
   * @returns {boolean} - True if email sent successfully, false otherwise
   */
  async sendLicenseKeyEmail(email, licenseKey, tier) {
    try {
      // Check if Resend is configured
      if (!this.env.RESEND_API_KEY) {
        console.warn('Resend API key not configured, skipping email');
        return false;
      }

      const subject = tier === 'pro'
        ? 'Your CaptureAI Pro License Key'
        : 'Your CaptureAI Free License Key';

      // Use separate function for Pro tier email
      if (tier === 'pro') {
        const htmlContent = this.generateProEmailHTML(licenseKey);
        const nextChargeDate = new Date();
        nextChargeDate.setMonth(nextChargeDate.getMonth() + 1);
        const formattedDate = nextChargeDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const textContent = `Thanks for starting your Pro subscription.

Your payment method has been charged. The next charge will be on ${formattedDate}.

You can modify your payment method or cancel your subscription anytime by visiting the Stripe billing settings page.

YOUR LICENSE KEY:
${licenseKey}

For any further questions, visit our website: https://captureai.dev`;

        return await this.sendEmailViaResend(email, subject, htmlContent, textContent, tier);
      }

      // Plain text version for free tier (prevents spam filtering)
      const textContent = `Welcome to CaptureAI!

Thank you for trying CaptureAI!

YOUR LICENSE KEY:
${licenseKey}

How to activate:
1. Open the CaptureAI extension
2. Click "Enter License Key"
3. Copy and paste your license key above
4. Start using CaptureAI!

You're currently using the free tier. Upgrade to Pro for unlimited access!

Keep this email safe - you'll need your license key to use CaptureAI.

---
CaptureAI - AI-Powered Screenshot Analysis
https://captureai.dev`;

      // HTML version - Anthropic-style email template for free tier
      const htmlContent = `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
  <title></title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
  </style>
</head>
<body style="background-color: #fafaf8; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
  <table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; background-color: #fafaf8;">
    <tbody>
      <tr>
        <td>
          <!-- Logo and CaptureAI text header -->
          <table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
            <tbody>
              <tr>
                <td>
                  <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; background-color: #fafaf8; border-radius: 0; color: #000; width: 600px; margin: 0 auto;" width="600">
                    <tbody>
                      <tr>
                        <td class="column column-1" width="100%" style="mso-table-lspace: 0; mso-table-rspace: 0; font-weight: 400; text-align: left; padding-bottom: 10px; padding-top: 10px; vertical-align: top; border-top: 0; border-right: 0; border-bottom: 0; border-left: 0;">
                          <table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
                            <tr>
                              <td class="pad" style="padding-bottom: 30px; padding-left: 25px; padding-top: 30px; width: 100%; padding-right: 0;" width="100%">
                                <div class="alignment" align="left" style="line-height: 10px;">
                                  <div class="alignment" align="left" style="line-height: 10px;">
                                    <img src="https://captureai.dev/assets/logo-email.png" style="display: block; height: auto; border: 0; width: 180px;" width="180" alt="CaptureAI logo" title="CaptureAI logo" height="auto">
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- First white box: Welcome and License Key -->
          <table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
            <tbody>
              <tr>
                <td style="padding: 0 30px 0 30px;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; border-radius: 8px; box-shadow: 0 2px 5px 0 rgb(50 50 93 / 10%), 0 1px 1px 0 rgb(0 0 0 / 7%); width: 540px; margin: 0 auto;" width="540">
                    <tbody>
                      <tr>
                        <td style="border-radius: 8px; background-color: #e3e8ee; padding: 1px;">
                          <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; background-color: #ffffff; border-radius: 8px; color: #000; width: 100%;" width="100%">
                    <tbody>
                      <tr>
                        <td class="column column-1" width="100%" style="mso-table-lspace: 0; mso-table-rspace: 0; font-weight: 400; text-align: left; padding: 40px; vertical-align: top; border-top: 0; border-right: 0; border-bottom: 0; border-left: 0;">
                          <!-- Welcome heading -->
                          <table class="heading_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
                            <tr>
                              <td class="pad" style="width: 100%; padding: 0;">
                                <h1 style="margin: 0 0 8px 0; color: #29261b; direction: ltr; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 600; letter-spacing: normal; line-height: 120%; text-align: left;">
                                  ${tier === 'pro' ? 'Welcome to CaptureAI Pro' : 'Welcome to CaptureAI'}
                                </h1>
                              </td>
                            </tr>
                          </table>

                          <!-- Description text -->
                          <table class="text_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                            <tr>
                              <td class="pad" style="padding: 0 0 32px 0;">
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                  <div style="font-size: 16px; color: #666666; line-height: 1.2;">
                                    <p style="margin: 0;">
                                      CaptureAI is your AI-powered screenshot assistant, ready to analyze images, extract text, and answer questions you capture instantly.
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </table>

                          <!-- License Key -->
                          <table class="text_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                            <tr>
                              <td class="pad" style="padding: 0;">
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                  <div style="font-size: 14px; color: #666666; line-height: 1.2; margin-bottom: 8px;">
                                    <p style="margin: 0;">Your License Key</p>
                                  </div>
                                  <div style="font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #218aff; line-height: 1.2; font-weight: 600;">
                                    <p style="margin: 0;">${licenseKey}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Spacer between boxes -->
          <table class="row" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
            <tbody>
              <tr>
                <td height="20" style="font-size: 1px; line-height: 1px; mso-line-height-rule: exactly;">&nbsp;</td>
              </tr>
            </tbody>
          </table>

          <!-- Second white box: Activation Instructions and Features -->
          <table class="row row-3" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
            <tbody>
              <tr>
                <td style="padding: 0 30px;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; border-radius: 8px; box-shadow: 0 2px 5px 0 rgb(50 50 93 / 10%), 0 1px 1px 0 rgb(0 0 0 / 7%); width: 540px; margin: 0 auto;" width="540">
                    <tbody>
                      <tr>
                        <td style="border-radius: 8px; background-color: #e3e8ee; padding: 1px;">
                          <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; background-color: #ffffff; border-radius: 8px; color: #000; width: 100%;" width="100%">
                    <tbody>
                      <tr>
                        <td class="column column-1" width="100%" style="mso-table-lspace: 0; mso-table-rspace: 0; font-weight: 400; text-align: left; padding: 40px; vertical-align: top; border-top: 0; border-right: 0; border-bottom: 0; border-left: 0;">
                          <!-- Activation heading -->
                          <table class="heading_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
                            <tr>
                              <td class="pad" style="width: 100%; padding: 0 0 16px 0;">
                                <h2 style="margin: 0; color: #29261b; direction: ltr; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 600; letter-spacing: normal; line-height: 120%; text-align: left;">How to use</h2>
                              </td>
                            </tr>
                          </table>

                          <!-- Activation steps -->
                          <table class="text_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                            <tr>
                              <td class="pad" style="padding: 0 0 32px 0;">
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                  <div style="font-size: 16px; color: #666666; line-height: 1.7;">
                                    <div style="margin-bottom: 8px;">1. Install the CaptureAI extension</div>
                                    <div style="margin-bottom: 8px;">2. Paste your license key from above</div>
                                    <div style="margin-bottom: 8px;">3. Click "Activate"</div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </table>

                          ${tier === 'pro' ? `
                          <!-- Pro Features Gradient Box -->
                          <table class="text_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                            <tr>
                              <td class="pad" style="padding: 0 0 32px 0;">
                                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 24px;">
                                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                    <div style="font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 16px;">Your Pro Features</div>
                                    <div style="font-size: 15px; color: #ffffff; line-height: 1.8; opacity: 0.95;">
                                      <div>• Unlimited requests (60 per minute)</div>
                                      <div>• Access to GPT-5 Nano AI model</div>
                                      <div>• Priority support</div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </table>
                          ` : `
                          <!-- Upgrade Prompt Gradient Box -->
                          <table class="text_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                            <tr>
                              <td class="pad" style="padding: 0 0 32px 0;">
                                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 24px; text-align: center;">
                                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                    <div style="font-size: 15px; color: #ffffff; line-height: 1.6;">
                                      <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">You're currently using the free tier</div>
                                      <div style="opacity: 0.95;">Upgrade to Pro for unlimited access and advanced features</div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </table>
                          `}

                        </td>
                      </tr>
                    </tbody>
                  </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Footer -->
          <table class="row row-4" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
            <tbody>
              <tr>
                <td>
                  <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; background-color: #fafaf8; border-radius: 0; color: #000; width: 600px; margin: 0 auto;" width="600">
                    <tbody>
                      <tr>
                        <td class="column column-1" width="100%" style="mso-table-lspace: 0; mso-table-rspace: 0; font-weight: 400; text-align: center; padding-bottom: 40px; padding-top: 20px; vertical-align: top; border-top: 0; border-right: 0; border-bottom: 0; border-left: 0;">
                          <table class="text_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                            <tr>
                              <td class="pad" style="padding: 0 30px;">
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                  <div style="font-size: 13px; color: #a3a299; line-height: 1.6;">
                                    <p style="margin: 0; text-align: center;">Questions? <a href="https://captureai.dev" style="color: #218aff; text-decoration: none;">Visit our website</a></p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

      // Send via Resend
      return await this.sendEmailViaResend(email, subject, htmlContent, textContent, tier);

    } catch (error) {
      console.error('Email sending error:', error);
      if (this.logger) {
        this.logger.error('Email sending failed', error, { email, tier });
      }
      return false; // Email failed
    }
  }

  /**
   * Generate Pro tier email HTML
   */
  generateProEmailHTML(licenseKey) {
    // Calculate next charge date (1 month from now)
    const nextChargeDate = new Date();
    nextChargeDate.setMonth(nextChargeDate.getMonth() + 1);
    const formattedDate = nextChargeDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
  <title></title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
  </style>
</head>
<body style="background-color: #fafaf8; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
  <table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; background-color: #fafaf8;">
    <tbody>
      <tr>
        <td>
          <!-- Main content box -->
          <table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
            <tbody>
              <tr>
                <td style="padding: 40px 30px 0 30px;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; border-radius: 8px; box-shadow: 0 2px 5px 0 rgb(50 50 93 / 10%), 0 1px 1px 0 rgb(0 0 0 / 7%); width: 540px; margin: 0 auto;" width="540">
                    <tbody>
                      <tr>
                        <td style="border-radius: 8px; background-color: #e3e8ee; padding: 1px;">
                          <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; background-color: #ffffff; border-radius: 8px; color: #000; width: 100%;" width="100%">
                            <tbody>
                              <tr>
                                <td class="column column-1" width="100%" style="mso-table-lspace: 0; mso-table-rspace: 0; font-weight: 400; text-align: left; padding: 40px; vertical-align: top; border-top: 0; border-right: 0; border-bottom: 0; border-left: 0;">
                                  <!-- CaptureAI Logo -->
                                  <table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
                                    <tr>
                                      <td class="pad" style="width: 100%; padding: 0 0 12px 0;">
                                        <div class="alignment" align="left" style="line-height: 10px;">
                                          <img src="https://captureai.dev/assets/logo-email.png" style="display: block; height: auto; border: 0; width: 220px;" width="220" alt="CaptureAI" title="CaptureAI" height="auto">
                                        </div>
                                      </td>
                                    </tr>
                                  </table>

                                  <!-- Thank you message -->
                                  <table class="text_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                                    <tr>
                                      <td class="pad" style="padding: 0 0 16px 0;">
                                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                          <div style="font-size: 16px; color: #29261b; line-height: 1.5;">
                                            <p style="margin: 0;">Thanks for starting your Pro subscription.</p>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>

                                  <!-- Charge information -->
                                  <table class="text_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                                    <tr>
                                      <td class="pad" style="padding: 0 0 16px 0;">
                                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                          <div style="font-size: 15px; color: #666666; line-height: 1.5;">
                                            <p style="margin: 0;">Your payment method has been charged. The next charge will be on <strong>${formattedDate}</strong>.</p>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>

                                  <!-- Billing settings link -->
                                  <table class="text_block block-4" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                                    <tr>
                                      <td class="pad" style="padding: 0 0 32px 0;">
                                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                          <div style="font-size: 15px; color: #666666; line-height: 1.5;">
                                            <p style="margin: 0;">You can modify your payment method or cancel your subscription anytime by visiting the Stripe <a href="https://billing.stripe.com/p/login/test_123" style="color: #218aff; text-decoration: underline;">billing settings</a> page.</p>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>

                                  <!-- License Key -->
                                  <table class="text_block block-5" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                                    <tr>
                                      <td class="pad" style="padding: 0 0 32px 0;">
                                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                          <div style="font-size: 14px; color: #666666; line-height: 1.2; margin-bottom: 8px;">
                                            <p style="margin: 0;">Your License Key</p>
                                          </div>
                                          <div style="font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #218aff; line-height: 1.2; font-weight: 600;">
                                            <p style="margin: 0;">${licenseKey}</p>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>

                                  <!-- Pro Features Gradient Box with Grid -->
                                  <table class="text_block block-6" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                                    <tr>
                                      <td class="pad" style="padding: 0;">
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Footer -->
          <table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
            <tbody>
              <tr>
                <td>
                  <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; background-color: #fafaf8; border-radius: 0; color: #000; width: 600px; margin: 0 auto;" width="600">
                    <tbody>
                      <tr>
                        <td class="column column-1" width="100%" style="mso-table-lspace: 0; mso-table-rspace: 0; font-weight: 400; text-align: center; padding-bottom: 40px; padding-top: 20px; vertical-align: top; border-top: 0; border-right: 0; border-bottom: 0; border-left: 0;">
                          <table class="text_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                            <tr>
                              <td class="pad" style="padding: 0 30px;">
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                  <div style="font-size: 13px; color: #a3a299; line-height: 1.6;">
                                    <p style="margin: 0; text-align: center;">For any further questions, visit our <a href="https://captureai.dev" style="color: #218aff; text-decoration: none;">website</a>.</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
  }

  /**
   * Send email via Resend
   * @returns {boolean} - True if email sent successfully, false otherwise
   */
  async sendEmailViaResend(email, subject, htmlContent, textContent, tier = 'free') {
    console.log('Attempting to send email via Resend to:', email);

    try {
      const response = await fetchWithTimeout('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: this.env.FROM_EMAIL || 'CaptureAI <no-reply@mail.captureai.dev>',
          to: [email],
          subject: subject,
          html: htmlContent,
          text: textContent,
          headers: {
            'X-Entity-Ref-ID': crypto.randomUUID(),
          },
          tags: [
            {
              name: 'category',
              value: tier === 'pro' ? 'license_pro' : 'license_free'
            }
          ]
        })
      }, 5000); // 5 second timeout for email API

      console.log('Resend API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Resend API error response:', errorText);
        if (this.logger) {
          this.logger.error('Resend email error', null, { error: errorText, status: response.status });
        }
        return false;
      }

      const result = await response.json();
      console.log('Email sent successfully! Resend response:', result);
      if (this.logger) {
        this.logger.info('Email sent successfully', { provider: 'resend', to: email, id: result.id });
      }
      return true;

    } catch (error) {
      console.error('Resend API request failed:', error);
      if (this.logger) {
        this.logger.error('Resend email request failed', error);
      }
      return false;
    }
  }

}
