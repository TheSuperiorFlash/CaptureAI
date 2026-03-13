/**
 * License Key Authentication Handler
 * Handles license key validation and user management
 */

import { jsonResponse, fetchWithTimeout } from './utils';
import { validateRequestBody, validateEmail, validateLicenseKey, ValidationError } from './validation';
import { logAuth, logValidationError } from './logger';
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
      if (i > 0) {
        key += '-';
      }
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
        this.env,
        RateLimitPresets.LICENSE_VALIDATION.bindingName
      );
      if (rateLimitError && rateLimitError.error) {
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
        if (this.logger) {
          logAuth(this.logger, false, null);
        }
        return jsonResponse({ error: 'Invalid license key' }, 401);
      }

      if (this.logger) {
        logAuth(this.logger, true, user.id);
      }

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
      if (this.logger) {
        this.logger.error('License validation error', error);
      }
      if (error instanceof ValidationError) {
        if (this.logger) {
          logValidationError(this.logger, error.field, error);
        }
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
   * Get user info by email
   * Used internally for login verification
   */
  async getUserByEmail(email) {
    try {
      const user = await this.db
        .prepare('SELECT * FROM users WHERE email = ?')
        .bind(email)
        .first();

      return user;
    } catch (error) {
      console.error('Get user by email error:', error);
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

      // All users require an active subscription
      if (user.subscription_status !== 'active') {
        if (this.logger) {
          this.logger.security('User with inactive subscription attempted access', {
            userId: user.id,
            tier: user.tier,
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
   * Authenticate request allowing inactive/cancelled subscriptions.
   * Used for account management endpoints where cancelled users need access.
   * Header: Authorization: LicenseKey YOUR-KEY-HERE
   */
  async authenticateAccount(request) {
    try {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('LicenseKey ')) {
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
        licenseKey: user.license_key,
        subscriptionStatus: user.subscription_status
      };

    } catch (error) {
      console.error('Account authentication error:', error);
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
   * Send license key via email using Resend
   * @param {string} email
   * @param {string} licenseKey
   * @param {string} tier
   * @param {Date|null} nextBillingDate - Actual next billing date from Stripe (Pro only)
   * @param {boolean} isNewUser - Whether this is a new user (shows install instructions)
   * @returns {boolean} - True if email sent successfully, false otherwise
   */
  async sendLicenseKeyEmail(email, licenseKey, tier, nextBillingDate = null, isNewUser = false) {
    try {
      // Check if Resend is configured
      if (!this.env.RESEND_API_KEY) {
        console.warn('Resend API key not configured, skipping email');
        return false;
      }

      const tierNames = { pro: 'Pro', basic: 'Basic' };
      const tierDisplay = tierNames[tier] || tier;

      const subject = tier === 'pro'
        ? 'Your CaptureAI Pro License Key'
        : tier === 'basic'
          ? 'Your CaptureAI Basic License Key'
          : 'Your CaptureAI License Key';

      // Use paid subscription email for pro and basic tiers
      if (tier === 'pro' || tier === 'basic') {
        let billingDate;
        if (nextBillingDate instanceof Date) {
          billingDate = nextBillingDate;
        } else {
          const d = new Date();
          // Basic is billed weekly; Pro is billed monthly
          if (tier === 'basic') {
            d.setDate(d.getDate() + 7);
          } else {
            d.setMonth(d.getMonth() + 1);
          }
          billingDate = d;
        }
        const formattedDate = billingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const htmlContent = this.generateProEmailHTML(licenseKey, billingDate, isNewUser, tierDisplay);

        const textContent = `Thanks for starting your ${tierDisplay} subscription.

Your payment method has been charged. The next charge will be on ${formattedDate}.

You can modify your payment method or cancel your subscription anytime by visiting your account page at https://captureai.dev/activate

Your License Key
${licenseKey}
${isNewUser ? '\nInstall and activate the extension at https://captureai.dev/activate\n' : ''}
Need help? Visit our help page: https://captureai.dev/help`;

        return await this.sendEmailViaResend(email, subject, htmlContent, textContent, tier);
      }

      // Plain text version for unknown/fallback tier
      const textContent = `Welcome to CaptureAI

CaptureAI is your AI-powered screenshot assistant, ready to analyze images, extract text, and answer questions you capture instantly.

Your License Key
${licenseKey}

Install and activate the extension at https://captureai.dev/activate

Upgrade to Pro for unlimited access and advanced features.

Need help? Visit our help page: https://captureai.dev/help`;

      // HTML version - fallback email
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
          <!-- CaptureAI Logo Header (outside card) -->
          <table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
            <tbody>
              <tr>
                <td style="padding: 30px 30px 0 30px;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
                    <tr>
                      <td style="padding-right: 6px; vertical-align: middle;">
                        <img src="https://captureai.dev/logo.png" style="display: block; height: auto; border: 0; width: 32px; height: 32px;" width="32" height="32" alt="CaptureAI" title="CaptureAI">
                      </td>
                      <td style="vertical-align: middle;">
                        <h2 style="margin: 0; color: #29261b; direction: ltr; font-family: 'Helvetica Now', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 400; letter-spacing: normal; line-height: 120%;">CaptureAI</h2>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Main content box -->
          <table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
            <tbody>
              <tr>
                <td style="padding: 20px 30px 0 30px;">
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
                                <h1 style="margin: 0 0 8px 0; color: #29261b; direction: ltr; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 600; letter-spacing: normal; line-height: 120%; text-align: left;">Welcome to CaptureAI</h1>
                              </td>
                            </tr>
                          </table>

                          <!-- Description text -->
                          <table class="text_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                            <tr>
                              <td class="pad" style="padding: 0 0 24px 0;">
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                  <div style="font-size: 16px; color: #666666; line-height: 1.5;">
                                    <p style="margin: 0;">CaptureAI is your AI-powered screenshot assistant, ready to analyze images, extract text, and answer questions you capture instantly.</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </table>

                          <!-- Install link (after description) -->
                          <table class="text_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                            <tr>
                              <td class="pad" style="padding: 0 0 32px 0;">
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                  <div style="font-size: 16px; color: #666666; line-height: 1.5;">
                                    <p style="margin: 0;">Install and activate the extension at <a href="https://captureai.dev/activate" style="color: #218aff; text-decoration: none;">captureai.dev/activate</a>.</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </table>

                                  <!-- License Key -->
                                  <table class="text_block block-4" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                                    <tr>
                                      <td class="pad" style="padding: 0 0 32px 0;">
                                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                          <div style="font-size: 14px; color: #666666; line-height: 1.2; margin-bottom: 8px;">
                                            <p style="margin: 0;">Your License Key</p>
                                          </div>
                                          <div style="font-size: 16px; color: #218aff; line-height: 1.2; font-weight: 600;">
                                            <p style="margin: 0;">${licenseKey}</p>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>

                                  <!-- Upgrade Benefits -->
                                  <table class="text_block block-5" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                                    <tr>
                                      <td class="pad" style="padding: 0;">
                                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                          <div style="font-size: 16px; color: #666666; line-height: 1.6;">
                                            <p style="margin: 0 0 12px 0;"><strong>Ready to upgrade?</strong> Pro gets you:</p>
                                            <p style="margin: 0 0 8px 0;">• Unlimited requests (20 per minute)</p>
                                            <p style="margin: 0 0 8px 0;">• Privacy Guard to hide extension activity</p>
                                            <p style="margin: 0 0 8px 0;">• Auto-Solve mode for instant answers</p>
                                            <p style="margin: 0 0 8px 0;">• Ask Mode for follow-up questions</p>
                                            <p style="margin: 0;">Plus priority support</p>
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
                                    <p style="margin: 0; text-align: center;">Need help? Visit our <a href="https://captureai.dev/help" style="color: #218aff; text-decoration: none;">help page</a>.</p>
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
        this.logger.error('Email sending failed', error, { tier });
      }
      return false; // Email failed
    }
  }

  /**
   * Generate paid tier email HTML
   * @param {string} licenseKey
   * @param {Date|null} nextBillingDate - Actual next billing date from Stripe
   * @param {boolean} isNewUser - Whether to include install instructions
   * @param {string} tierName - Display name for the tier (e.g. 'Pro', 'Basic')
   */
  generateProEmailHTML(licenseKey, nextBillingDate, isNewUser = false, tierName = 'Pro') {
    const validDate = nextBillingDate instanceof Date ? nextBillingDate : null;
    const formattedDate = validDate
      ? validDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'TBD';

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
                                  <!-- Logo and text on same line -->
                                  <table class="logo_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
                                    <tr>
                                      <td class="pad" style="width: 100%; padding: 0 0 12px 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0;">
                                          <tr>
                                            <td style="padding-right: 6px; vertical-align: middle;">
                                              <img src="https://captureai.dev/logo.png" style="display: block; height: auto; border: 0; width: 32px; height: 32px;" width="32" height="32" alt="CaptureAI" title="CaptureAI">
                                            </td>
                                            <td style="vertical-align: middle;">
                                              <h2 style="margin: 0; color: #29261b; direction: ltr; font-family: 'Helvetica Now', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 400; letter-spacing: normal; line-height: 120%;">CaptureAI</h2>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>

                                  <!-- Thank you message -->
                                  <table class="text_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                                    <tr>
                                      <td class="pad" style="padding: 0 0 8px 0;">
                                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                          <div style="font-size: 16px; color: #29261b; line-height: 1.5;">
                                            <p style="margin: 0;">Thanks for starting your ${tierName} subscription.</p>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>

                                  ${isNewUser ? `
                                  <!-- Install link (new users only) -->
                                  <table class="text_block block-2b" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                                    <tr>
                                      <td class="pad" style="padding: 0 0 16px 0;">
                                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                          <div style="font-size: 16px; color: #666666; line-height: 1.5;">
                                            <p style="margin: 0;">Install and activate the extension at <a href="https://captureai.dev/activate" style="color: #218aff; text-decoration: none;">captureai.dev/activate</a>.</p>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>
                                  ` : ''}

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
                                      <td class="pad" style="padding: 0 0 ${isNewUser ? '16' : '32'}px 0;">
                                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                          <div style="font-size: 15px; color: #666666; line-height: 1.5;">
                                            <p style="margin: 0;">You can modify your payment method or cancel your subscription anytime by visiting your <a href="https://captureai.dev/activate" style="color: #218aff; text-decoration: underline;">account page</a>.</p>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>

                                  <!-- License Key -->
                                  <table class="text_block block-5" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
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
                                    <p style="margin: 0; text-align: center;">Need help? Visit our <a href="https://captureai.dev/help" style="color: #218aff; text-decoration: none;">help page</a>.</p>
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
  async sendEmailViaResend(email, subject, htmlContent, textContent, tier = 'basic') {
    console.log('Attempting to send email via Resend');

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
            'X-Entity-Ref-ID': crypto.randomUUID()
          },
          tags: [
            {
              name: 'category',
              value: tier === 'pro' ? 'license_pro' : 'license_basic'
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
        this.logger.info('Email sent successfully', { provider: 'resend', id: result.id });
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
