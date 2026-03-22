/**
 * Subscription Handler (License Key System)
 * Handles Stripe subscription payments and license key generation
 */

import { jsonResponse, parseJSON, generateUUID, constantTimeCompare, fetchWithTimeout } from './utils';
import { AuthHandler } from './auth';
import { validateRequestBody, validateEmail, validateStripeSignature, validateVerificationCode, ValidationError } from './validation';
import { logSubscription, logWebhook, logValidationError } from './logger';
import { checkRateLimit, getClientIdentifier, RateLimitPresets } from './ratelimit';

export class SubscriptionHandler {
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
      // Rate limiting - prevent checkout spam
      const clientId = getClientIdentifier(request);
      const rateLimitError = await checkRateLimit(
        `checkout:${clientId}`,
        RateLimitPresets.CHECKOUT.limit,
        RateLimitPresets.CHECKOUT.windowMs,
        this.env,
        RateLimitPresets.CHECKOUT.bindingName
      );
      if (rateLimitError && rateLimitError.error) {
        return jsonResponse(rateLimitError, 429);
      }

      const body = await validateRequestBody(request);
      const email = validateEmail(body.email, true);
      let tier;
      if (body.tier === undefined || body.tier === null) {
        tier = 'pro';
      } else if (body.tier === 'basic' || body.tier === 'pro') {
        tier = body.tier;
      } else {
        return jsonResponse({ error: 'Invalid tier. Must be "basic" or "pro"' }, 400);
      }

      let billingPeriod;
      if (body.billingPeriod === undefined || body.billingPeriod === null) {
        billingPeriod = 'weekly';
      } else if (body.billingPeriod === 'weekly' || body.billingPeriod === 'monthly') {
        billingPeriod = body.billingPeriod;
      } else {
        return jsonResponse({ error: 'Invalid billingPeriod. Must be "weekly" or "monthly"' }, 400);
      }

      const priceId = this.getPriceId(tier, billingPeriod);
      if (!priceId) {
        return jsonResponse({ error: 'Price not configured' }, 500);
      }

      // Look up the existing user so we can reuse their Stripe customer and detect upgrades
      let customerId;
      let existingSubscriptionId = null;
      const existingUser = await this.db
        .prepare('SELECT id, stripe_customer_id, stripe_subscription_id, subscription_status, tier FROM users WHERE email = ?')
        .bind(email)
        .first();

      // Block same-plan re-subscription (same tier + same billing period) when the user already has a live subscription.
      // 'inactive' is CaptureAI's sentinel for a canceled/cleared subscription.
      const existingBillingPeriod = existingUser?.billing_period || 'weekly';
      if (
        existingUser?.stripe_subscription_id &&
        existingUser?.tier === tier &&
        existingBillingPeriod === billingPeriod &&
        existingUser?.subscription_status !== 'inactive'
      ) {
        const tierLabel = tier === 'pro' ? 'Pro' : 'Basic';
        const periodLabel = billingPeriod === 'monthly' ? 'monthly' : 'weekly';
        return jsonResponse({
          error: `You already have an active ${tierLabel} (${periodLabel}) subscription. To switch plans, select a different option.`,
          alreadySubscribed: true,
          currentTier: existingUser.tier,
          currentBillingPeriod: existingBillingPeriod
        }, 409);
      }

      // Any subscriber requesting a different tier or billing period goes through
      // the two-step preview+confirm flow regardless of subscription_status.
      if (
        existingUser?.stripe_subscription_id &&
        (existingUser?.tier !== tier || existingBillingPeriod !== billingPeriod)
      ) {
        existingSubscriptionId = existingUser.stripe_subscription_id;

        if (!body.confirmed) {
          // Step 1: return price preview — no charge, no invoice created
          try {
            const preview = await this.previewSubscriptionTierChange(existingSubscriptionId, tier, billingPeriod);
            return jsonResponse({ requiresConfirmation: true, tier, billingPeriod, ...preview });
          } catch (previewError) {
            if (!this.isStripeMissingResourceError(previewError)) {
              throw previewError;
            }
            // Stale subscription ID — clear and fall through to fresh checkout
            await this.db
              .prepare("UPDATE users SET stripe_subscription_id = ?, subscription_status = ?, updated_at = datetime('now') WHERE id = ?")
              .bind(null, 'inactive', existingUser.id).run();
          }
        } else {
          // Step 2: confirmed — verify OTP, then redirect to Stripe Customer Portal to complete the plan change
          const verificationCode = validateVerificationCode(body.verificationCode, true);
          const planKey = `${tier}_${billingPeriod}`;
          const codeValid = await this.consumeVerificationCode(email, verificationCode, 'tier_switch', planKey);
          if (!codeValid) {
            return jsonResponse({ error: 'Invalid or expired verification code' }, 403);
          }

          try {
            const portalUrl = await this.createPortalWithPlanChange(existingUser.stripe_customer_id, existingSubscriptionId, tier, billingPeriod);
            return jsonResponse({ url: portalUrl, sessionId: 'tier_change_' + existingSubscriptionId });
          } catch (portalError) {
            if (!this.isStripeMissingResourceError(portalError)) {
              throw portalError;
            }
            // Stale subscription ID — clear and fall through to fresh checkout
            await this.db
              .prepare("UPDATE users SET stripe_subscription_id = ?, subscription_status = ?, updated_at = datetime('now') WHERE id = ?")
              .bind(null, 'inactive', existingUser.id).run();
          }
        }
      }

      if (existingUser?.stripe_customer_id) {
        customerId = existingUser.stripe_customer_id;
      } else {
        const customer = await this.createStripeCustomer(email);
        customerId = customer.id;
      }

      // Create checkout session for normal flow
      let session;
      try {
        session = await this.createStripeCheckout(customerId, priceId, email, tier, billingPeriod);
      } catch (checkoutError) {
        // Stripe sandbox migration can leave stale customer IDs in DB.
        // Create a fresh customer and retry checkout once.
        if (!customerId || !this.isStripeMissingResourceError(checkoutError)) {
          throw checkoutError;
        }

        const customer = await this.createStripeCustomer(email);
        customerId = customer.id;

        if (existingUser?.id) {
          await this.db
            .prepare(`
              UPDATE users
              SET stripe_customer_id = ?,
                  stripe_subscription_id = ?,
                  subscription_status = ?,
                  updated_at = datetime('now')
              WHERE id = ?
            `)
            .bind(customerId, null, 'inactive', existingUser.id)
            .run();
        }

        session = await this.createStripeCheckout(customerId, priceId, email, tier, billingPeriod);
      }

      if (this.logger) {
        logSubscription(this.logger, 'checkout_created', {
          email,
          sessionId: session.id
        });
      }

      return jsonResponse({
        url: session.url,
        sessionId: session.id
      });

    } catch (error) {
      if (this.logger) {
        this.logger.error('Checkout creation error', error);
      }
      if (error instanceof ValidationError) {
        if (this.logger) {
          logValidationError(this.logger, error.field, error);
        }
        return jsonResponse({ error: error.message, field: error.field }, 400);
      }

      if (error?.stripeCode || error?.stripeType) {
        return jsonResponse({
          error: error.message || 'Stripe checkout failed',
          code: error.stripeCode || 'stripe_error'
        }, 400);
      }

      return jsonResponse({ error: 'Failed to create checkout' }, 500);
    }
  }

  /**
   * Generate a cryptographically secure 6-digit verification code
   */
  generateVerificationCode() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return String(array[0] % 1000000).padStart(6, '0');
  }

  /**
   * Send email verification code for tier switch confirmation
   * POST /api/subscription/send-verification
   */
  async sendVerification(request) {
    try {
      const clientId = getClientIdentifier(request);
      const rateLimitError = await checkRateLimit(
        `verify:${clientId}`,
        RateLimitPresets.AUTH.limit,
        RateLimitPresets.AUTH.windowMs,
        this.env,
        RateLimitPresets.AUTH.bindingName
      );
      if (rateLimitError && rateLimitError.error) {
        return jsonResponse(rateLimitError, 429);
      }

      const body = await validateRequestBody(request);
      const email = validateEmail(body.email, true);
      const tier = body.tier;
      const billingPeriod = body.billingPeriod === 'monthly' ? 'monthly' : 'weekly';

      if (tier !== 'basic' && tier !== 'pro') {
        return jsonResponse({ error: 'Invalid tier' }, 400);
      }

      // Verify user exists with an active subscription requesting a different plan
      const existingUser = await this.db
        .prepare('SELECT id, tier, billing_period, stripe_subscription_id FROM users WHERE email = ?')
        .bind(email)
        .first();

      const existingBillingPeriod = existingUser?.billing_period || 'weekly';
      const isSamePlan = existingUser?.tier === tier && existingBillingPeriod === billingPeriod;

      if (!existingUser?.stripe_subscription_id || isSamePlan) {
        // Don't reveal whether the email exists — return generic success
        return jsonResponse({ success: true, message: 'If an account exists, a verification code has been sent' });
      }

      // Invalidate previous unused codes for this email+action
      await this.db
        .prepare('UPDATE verification_codes SET used = 1 WHERE email = ? AND action = ? AND used = 0')
        .bind(email, 'tier_switch')
        .run();

      // Generate and store code with 10-minute TTL.
      // planKey encodes both tier and billing period for precise matching at confirmation.
      const planKey = `${tier}_${billingPeriod}`;
      const code = this.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await this.db
        .prepare('INSERT INTO verification_codes (email, code, action, tier, expires_at) VALUES (?, ?, ?, ?, ?)')
        .bind(email, code, 'tier_switch', planKey, expiresAt)
        .run();

      // Send code via email
      if (this.env.RESEND_API_KEY) {
        const tierLabel = tier === 'pro' ? 'Pro' : 'Basic';
        const periodLabel = billingPeriod === 'monthly' ? 'monthly' : 'weekly';
        const subject = `CaptureAI — Verify your plan change to ${tierLabel} (${periodLabel})`;
        const textContent = `CaptureAI Verification Code: ${code}\n\nEnter this code to confirm your plan change to ${tierLabel} (${periodLabel}).\nThis code expires in 10 minutes.\n\nIf you did not request this change, ignore this email.`;

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

                                  <table class="text_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                                    <tr>
                                      <td class="pad" style="padding: 0 0 16px 0;">
                                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                          <div style="font-size: 16px; color: #29261b; line-height: 1.5;">
                                            <p style="margin: 0;">You requested to switch to the <strong>${tierLabel}</strong> plan. Enter this code to confirm your plan change:</p>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>

                                  <table class="text_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                                    <tr>
                                      <td class="pad" style="padding: 16px 0 24px 0;">
                                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                          <div style="font-size: 32px; font-family: 'SF Mono', Monaco, monospace; color: #218aff; letter-spacing: 8px; font-weight: 600; line-height: 1.2;">
                                            <p style="margin: 0;">${code}</p>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>

                                  <table class="text_block block-4" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0; word-break: break-word;">
                                    <tr>
                                      <td class="pad" style="padding: 0;">
                                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                                          <div style="font-size: 14px; color: #666666; line-height: 1.5;">
                                            <p style="margin: 0;">This code expires in 10 minutes. If you did not request this change, you can safely ignore this email.</p>
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

        await this.auth.sendEmailViaResend(email, subject, htmlContent, textContent, tier);
      }

      if (this.logger) {
        logSubscription(this.logger, 'verification_sent', { email, tier });
      }

      return jsonResponse({ success: true, message: 'If an account exists, a verification code has been sent' });

    } catch (error) {
      console.error('Send verification error:', error);
      if (error instanceof ValidationError) {
        return jsonResponse({ error: error.message, field: error.field }, 400);
      }
      return jsonResponse({ error: 'Failed to send verification code' }, 500);
    }
  }

  /**
   * Validate a verification code from the database
   * @returns {boolean} True if code is valid and has been consumed
   */
  async consumeVerificationCode(email, code, action, tier) {
    const row = await this.db
      .prepare(
        'SELECT id FROM verification_codes WHERE email = ? AND code = ? AND action = ? AND tier = ? AND used = 0 AND expires_at > datetime(\'now\')'
      )
      .bind(email, code, action, tier)
      .first();

    if (!row) {
      return false;
    }

    // Mark as used (single-use)
    await this.db
      .prepare('UPDATE verification_codes SET used = 1 WHERE id = ?')
      .bind(row.id)
      .run();

    return true;
  }

  /**
   * Validate a login verification code (tier is NULL for login codes)
   * @returns {boolean} True if code is valid and has been consumed
   */
  async consumeLoginCode(email, code) {
    const row = await this.db
      .prepare(
        'SELECT id FROM verification_codes WHERE email = ? AND code = ? AND action = \'login\' AND tier IS NULL AND used = 0 AND expires_at > datetime(\'now\')'
      )
      .bind(email, code)
      .first();

    if (!row) {
      return false;
    }

    await this.db
      .prepare('UPDATE verification_codes SET used = 1 WHERE id = ?')
      .bind(row.id)
      .run();

    return true;
  }

  /**
   * Send a login verification code via email
   * POST /api/auth/send-login-code
   */
  async sendLoginCode(request) {
    try {
      const clientId = getClientIdentifier(request);
      const rateLimitError = await checkRateLimit(
        `login:${clientId}`,
        RateLimitPresets.AUTH.limit,
        RateLimitPresets.AUTH.windowMs,
        this.env,
        RateLimitPresets.AUTH.bindingName
      );
      if (rateLimitError && rateLimitError.error) {
        return jsonResponse(rateLimitError, 429);
      }

      const body = await validateRequestBody(request);
      const email = validateEmail(body.email, true);

      // Check user exists (any subscription status)
      const existingUser = await this.db
        .prepare('SELECT id FROM users WHERE email = ?')
        .bind(email)
        .first();

      if (!existingUser) {
        // Don't reveal whether the email exists
        return jsonResponse({ success: true, message: 'If an account exists, a login code has been sent' });
      }

      // Invalidate previous unused login codes for this email
      await this.db
        .prepare('UPDATE verification_codes SET used = 1 WHERE email = ? AND action = ? AND used = 0')
        .bind(email, 'login')
        .run();

      // Generate and store code with 10-minute TTL
      const code = this.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await this.db
        .prepare('INSERT INTO verification_codes (email, code, action, tier, expires_at) VALUES (?, ?, ?, ?, ?)')
        .bind(email, code, 'login', null, expiresAt)
        .run();

      // Send code via email
      if (this.env.RESEND_API_KEY) {
        const subject = 'CaptureAI — Sign in to your account';
        const textContent = `Your CaptureAI sign-in code: ${code}\n\nEnter this code to access your account.\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email.`;

        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>* { box-sizing: border-box; } body { margin: 0; padding: 0; }</style>
</head>
<body style="background-color: #fafaf8; margin: 0; padding: 0;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #fafaf8;">
    <tbody><tr><td>
      <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tbody><tr><td style="padding: 40px 30px 0 30px;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-radius: 8px; box-shadow: 0 2px 5px 0 rgb(50 50 93 / 10%), 0 1px 1px 0 rgb(0 0 0 / 7%); width: 540px; margin: 0 auto;" width="540">
            <tbody><tr><td style="border-radius: 8px; background-color: #e3e8ee; padding: 1px;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 8px; color: #000; width: 100%;" width="100%">
                <tbody><tr><td style="padding: 40px;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr><td style="padding: 0 0 12px 0;">
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="padding-right: 6px; vertical-align: middle;">
                            <img src="https://captureai.dev/logo.png" style="display: block; width: 32px; height: 32px;" width="32" height="32" alt="CaptureAI">
                          </td>
                          <td style="vertical-align: middle;">
                            <span style="color: #303030; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif; font-size: 17px; font-weight: 700; letter-spacing: -0.2px;">CaptureAI</span>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif; padding-top: 8px;">
                    <p style="font-size: 15px; color: #303030; font-weight: 600; margin: 0 0 16px 0;">Sign in to your account</p>
                    <p style="font-size: 14px; color: #525f7f; line-height: 1.6; margin: 0 0 24px 0;">Use the code below to sign in to your CaptureAI account. This code expires in 10 minutes.</p>
                    <div style="background-color: #f6f9fc; border: 1px solid #e3e8ee; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                      <span style="font-family: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #303030;">${code}</span>
                    </div>
                    <p style="font-size: 13px; color: #a3a299; line-height: 1.6; margin: 0;">If you didn't request this code, you can safely ignore this email.</p>
                  </div>
                </td></tr>
              </table>
            </td></tr></tbody>
          </table>
        </td></tr></tbody>
      </table>
      <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tbody><tr><td style="padding: 20px 30px 40px 30px;">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif; text-align: center;">
            <p style="font-size: 13px; color: #a3a299; line-height: 1.6; margin: 0;">Need help? Visit our <a href="https://captureai.dev/help" style="color: #218aff; text-decoration: none;">help page</a>.</p>
          </div>
        </td></tr></tbody>
      </table>
    </td></tr></tbody>
  </table>
</body>
</html>`;

        await this.auth.sendEmailViaResend(email, subject, htmlContent, textContent);
      }

      if (this.logger) {
        logSubscription(this.logger, 'login_code_sent', { email });
      }

      return jsonResponse({ success: true, message: 'If an account exists, a login code has been sent' });

    } catch (error) {
      console.error('Send login code error:', error);
      if (error instanceof ValidationError) {
        return jsonResponse({ error: error.message, field: error.field }, 400);
      }
      return jsonResponse({ error: 'Failed to send login code' }, 500);
    }
  }

  /**
   * Verify a login code and return user data + license key
   * POST /api/auth/verify-login
   */
  async verifyLogin(request) {
    try {
      const clientId = getClientIdentifier(request);
      const rateLimitError = await checkRateLimit(
        `login-verify:${clientId}`,
        RateLimitPresets.AUTH.limit,
        RateLimitPresets.AUTH.windowMs,
        this.env,
        RateLimitPresets.AUTH.bindingName
      );
      if (rateLimitError && rateLimitError.error) {
        return jsonResponse(rateLimitError, 429);
      }

      const body = await validateRequestBody(request);
      const email = validateEmail(body.email, true);
      const code = validateVerificationCode(body.code, true);

      const codeValid = await this.consumeLoginCode(email, code);
      if (!codeValid) {
        return jsonResponse({ error: 'Invalid or expired verification code' }, 401);
      }

      // Get user by email
      const user = await this.auth.getUserByEmail(email);
      if (!user) {
        return jsonResponse({ error: 'Account not found' }, 404);
      }

      if (this.logger) {
        logSubscription(this.logger, 'login_verified', { email });
      }

      return jsonResponse({
        user: {
          email: user.email,
          tier: user.tier,
          subscriptionStatus: user.subscription_status,
          createdAt: user.created_at
        },
        licenseKey: user.license_key
      });

    } catch (error) {
      console.error('Verify login error:', error);
      if (error instanceof ValidationError) {
        return jsonResponse({ error: error.message, field: error.field }, 400);
      }
      return jsonResponse({ error: 'Login verification failed' }, 500);
    }
  }

  /**
   * Clean up expired or used verification codes
   */
  async cleanupVerificationCodes() {
    await this.db
      .prepare("DELETE FROM verification_codes WHERE expires_at < datetime('now') OR used = 1")
      .run();
  }

  /**
   * Append an immutable row to the subscription_events audit log.
   * Never throws — failures are logged and swallowed so callers are not disrupted.
   */
  async logSubscriptionEvent({ email, eventType, fromTier = null, toTier = null, fromStatus = null, toStatus = null, stripeEventId = null, metadata = null }) {
    try {
      await this.db
        .prepare(`
          INSERT INTO subscription_events
            (email, event_type, from_tier, to_tier, from_status, to_status, stripe_event_id, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          email, eventType, fromTier, toTier, fromStatus, toStatus,
          stripeEventId,
          metadata ? JSON.stringify(metadata) : null
        )
        .run();
    } catch (error) {
      console.error('Audit log write failed (non-fatal):', error);
    }
  }

  /**
   * Handle Stripe webhook events
   * POST /api/subscription/webhook
   */
  async handleWebhook(request) {
    try {
      const signature = request.headers.get('stripe-signature');
      const body = await request.text();

      // Verify webhook signature for security
      if (!signature || !this.webhookSecret) {
        console.error('Missing signature or webhook secret');
        return jsonResponse({ error: 'Webhook verification failed' }, 400);
      }

      // Verify the webhook signature
      const event = await this.verifyWebhookSignature(body, signature);

      switch (event.type) {
        case 'checkout.session.completed': {
          await this.handleCheckoutCompleted(event.data.object);
          break;
        }

        case 'invoice.payment_succeeded': {
          await this.handlePaymentSucceeded(event.data.object);
          break;
        }

        case 'invoice.payment_failed': {
          await this.handlePaymentFailed(event.data.object);
          break;
        }

        case 'customer.subscription.deleted': {
          await this.handleSubscriptionCancelled(event.data.object);
          break;
        }

        case 'customer.subscription.updated': {
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        }

        case 'charge.refunded': {
          await this.handleChargeRefunded(event.data.object);
          break;
        }

        case 'charge.dispute.created': {
          await this.handleDisputeCreated(event.data.object);
          break;
        }
      }

      return jsonResponse({ received: true });

    } catch (error) {
      console.error('Webhook error:', error);
      // Return 200 for business logic errors to prevent Stripe retries
      // Only signature verification failures should return 400
      if (error.isSignatureError) {
        return jsonResponse({ error: 'Webhook verification failed' }, 400);
      }
      return jsonResponse({ error: 'Internal server error', received: true }, 200);
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

      // If email not in session, fetch from Stripe customer
      if (!customerEmail && customerId) {
        const customerResponse = await fetchWithTimeout(`https://api.stripe.com/v1/customers/${customerId}`, {
          headers: {
            'Authorization': `Bearer ${this.stripeKey}`
          }
        }, 5000);

        if (customerResponse.ok) {
          const customer = await customerResponse.json();
          customerEmail = customer.email;
        }
      }

      if (!customerEmail) {
        console.error('No customer email in checkout session or customer object');
        return;
      }

      // Check if user already exists (by email OR stripe_customer_id)
      const user = await this.db
        .prepare('SELECT * FROM users WHERE email = ? OR stripe_customer_id = ?')
        .bind(customerEmail, customerId)
        .first();

      // Fetch subscription from Stripe to get the real next billing date
      let nextBillingDate = null;
      if (subscriptionId) {
        try {
          const subResponse = await fetchWithTimeout(
            `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
            { headers: { 'Authorization': `Bearer ${this.stripeKey}` } },
            5000
          );
          if (subResponse.ok) {
            const sub = await subResponse.json();
            if (sub.current_period_end) {
              nextBillingDate = new Date(sub.current_period_end * 1000);
            }
          }
        } catch (err) {
          console.error('Failed to fetch subscription for billing date:', err);
        }
      }

      // Determine purchased tier and billing period from checkout session metadata
      const purchasedTier = (session.metadata?.tier === 'basic' || session.metadata?.tier === 'pro')
        ? session.metadata.tier
        : 'pro';
      const purchasedBillingPeriod = session.metadata?.billing_period === 'monthly' ? 'monthly' : 'weekly';

      if (user) {
        // User exists - set to purchased tier and billing period
        const prevTier = user.tier;
        const prevStatus = user.subscription_status;
        await this.db
          .prepare(`
            UPDATE users
            SET tier = ?,
                billing_period = ?,
                subscription_status = ?,
                stripe_customer_id = ?,
                stripe_subscription_id = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `)
          .bind(purchasedTier, purchasedBillingPeriod, 'active', customerId, subscriptionId, user.id)
          .run();

        await this.logSubscriptionEvent({
          email: customerEmail,
          eventType: 'checkout_completed',
          fromTier: prevTier,
          toTier: purchasedTier,
          fromStatus: prevStatus,
          toStatus: 'active',
          stripeEventId: session.id
        }).catch(err => console.error('Audit log failed:', err));

        console.log(`Updated user ${customerEmail} to ${purchasedTier} tier`);

        // Send upgrade email with existing license key (not a new user)
        if (this.env.RESEND_API_KEY) {
          await this.auth.sendLicenseKeyEmail(customerEmail, user.license_key, purchasedTier, nextBillingDate, false);
        }

      } else {
        // New user - generate license key and create account
        let licenseKey;
        let attempts = 0;

        while (attempts < 10) {
          licenseKey = this.auth.generateLicenseKey();

          const existing = await this.db
            .prepare('SELECT id FROM users WHERE license_key = ?')
            .bind(licenseKey)
            .first();

          if (!existing) {
            break;
          }
          attempts++;
        }

        const userId = generateUUID();
        await this.db
          .prepare(`
            INSERT INTO users (id, license_key, email, tier, billing_period, stripe_customer_id, stripe_subscription_id, subscription_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(userId, licenseKey, customerEmail, purchasedTier, purchasedBillingPeriod, customerId, subscriptionId, 'active')
          .run();

        await this.logSubscriptionEvent({
          email: customerEmail,
          eventType: 'signup',
          toTier: purchasedTier,
          toStatus: 'active',
          stripeEventId: session.id
        }).catch(err => console.error('Audit log failed:', err));

        console.log(`Created new ${purchasedTier} user ${customerEmail} with license key`);

        // Send welcome email with license key (new user)
        if (this.env.RESEND_API_KEY) {
          await this.auth.sendLicenseKeyEmail(customerEmail, licenseKey, purchasedTier, nextBillingDate, true);
        }
      }

    } catch (error) {
      console.error('Checkout completion error:', error);
    }
  }

  /**
   * Handle successful payment (monthly renewal)
   */
  async handlePaymentSucceeded(invoice) {
    try {
      const customerEmail = invoice.customer_email;
      if (!customerEmail) return;

      const subscriptionId = invoice.subscription;
      let newTier = null;

      // Fetch the subscription to get the current price and sync tier.
      // Proration invoices (billing_reason=subscription_update) don't have a
      // type:'subscription' line item, so we can't read tier from the invoice
      // itself — fetching the subscription is the only reliable approach.
      if (subscriptionId) {
        try {
          const subResponse = await fetchWithTimeout(
            `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
            { headers: { 'Authorization': `Bearer ${this.stripeKey}` } },
            5000
          );
          if (subResponse.ok) {
            const subscription = await subResponse.json();
            const priceId = subscription.items?.data?.[0]?.price?.id;
            if (priceId === this.env.STRIPE_PRICE_BASIC) newTier = 'basic';
            else if (priceId === this.env.STRIPE_PRICE_PRO) newTier = 'pro';
          }
        } catch (fetchErr) {
          console.error('Failed to fetch subscription in payment handler:', fetchErr);
        }
      }

      if (newTier && subscriptionId) {
        await this.db
          .prepare("UPDATE users SET subscription_status = 'active', tier = ?, stripe_subscription_id = ?, updated_at = datetime('now') WHERE LOWER(email) = LOWER(?)")
          .bind(newTier, subscriptionId, customerEmail)
          .run();
      } else {
        await this.db
          .prepare("UPDATE users SET subscription_status = 'active', updated_at = datetime('now') WHERE LOWER(email) = LOWER(?)")
          .bind(customerEmail)
          .run();
      }

      await this.logSubscriptionEvent({
        email: customerEmail,
        eventType: 'payment_succeeded',
        toTier: newTier,
        toStatus: 'active',
        stripeEventId: invoice.id
      }).catch(err => console.error('Audit log failed:', err));
    } catch (error) {
      console.error('Payment succeeded handler error:', error);
    }
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(invoice) {
    try {
      const customerEmail = invoice.customer_email;

      if (customerEmail) {
        await this.db
          .prepare("UPDATE users SET subscription_status = ?, updated_at = datetime('now') WHERE LOWER(email) = LOWER(?)")
          .bind('past_due', customerEmail)
          .run();

        await this.logSubscriptionEvent({
          email: customerEmail,
          eventType: 'payment_failed',
          toStatus: 'past_due',
          stripeEventId: invoice.id,
          // billing_reason distinguishes upgrade failures from renewal failures:
          // 'subscription_update' = proration on tier change; 'subscription_cycle' = renewal
          metadata: invoice.billing_reason ? { billing_reason: invoice.billing_reason } : null
        }).catch(err => console.error('Audit log failed:', err));
      }
    } catch (error) {
      console.error('Payment failed handler error:', error);
    }
  }

  /**
   * Handle subscription cancellation
   */
  async handleSubscriptionCancelled(subscription) {
    try {
      const subscriptionId = subscription.id;

      const user = await this.db
        .prepare('SELECT email, tier, subscription_status FROM users WHERE stripe_subscription_id = ?')
        .bind(subscriptionId)
        .first();

      await this.db
        .prepare("UPDATE users SET subscription_status = ?, tier = ?, updated_at = datetime('now') WHERE stripe_subscription_id = ?")
        .bind('cancelled', 'basic', subscriptionId)
        .run();

      if (user) {
        await this.logSubscriptionEvent({
          email: user.email,
          eventType: 'cancelled',
          fromTier: user.tier,
          fromStatus: user.subscription_status,
          toStatus: 'cancelled',
          stripeEventId: subscription.id
        }).catch(err => console.error('Audit log failed:', err));
      }
    } catch (error) {
      console.error('Subscription cancellation handler error:', error);
    }
  }

  /**
   * Handle charge refund — revoke access only for full refunds. Partial refunds
   * (e.g. goodwill credits) leave the subscription intact.
   */
  async handleChargeRefunded(charge) {
    try {
      const customerId = charge.customer;
      if (!customerId) {
        return;
      }

      // Only revoke access when the entire charge amount has been refunded.
      // charge.amount_refunded < charge.amount means a partial refund.
      if (charge.amount_refunded < charge.amount) {
        return;
      }

      const user = await this.db
        .prepare('SELECT email, tier, subscription_status, stripe_subscription_id FROM users WHERE stripe_customer_id = ?')
        .bind(customerId)
        .first();

      if (!user) {
        return;
      }

      await this.db
        .prepare("UPDATE users SET subscription_status = ?, tier = ?, stripe_subscription_id = ?, updated_at = datetime('now') WHERE stripe_customer_id = ?")
        .bind('cancelled', 'basic', null, customerId)
        .run();

      await this.logSubscriptionEvent({
        email: user.email,
        eventType: 'refund',
        fromTier: user.tier,
        fromStatus: user.subscription_status,
        toStatus: 'cancelled',
        stripeEventId: charge.id,
        metadata: { amount_refunded: charge.amount_refunded, currency: charge.currency }
      }).catch(err => console.error('Audit log failed:', err));
    } catch (error) {
      console.error('Charge refund handler error:', error);
    }
  }

  /**
   * Handle payment dispute (chargeback) — revoke access immediately and log
   * the event. Chargebacks are a strong fraud signal and continuing to provide
   * service during an active dispute creates financial risk.
   */
  async handleDisputeCreated(dispute) {
    try {
      const chargeId = dispute.charge;
      if (!chargeId) {
        return;
      }

      // Fetch the charge to get the customer ID
      const chargeResponse = await fetchWithTimeout(
        `https://api.stripe.com/v1/charges/${chargeId}`,
        { headers: { 'Authorization': `Bearer ${this.stripeKey}` } },
        5000
      );

      if (!chargeResponse.ok) {
        console.error('Dispute handler: failed to fetch charge', chargeId);
        return;
      }

      const charge = await chargeResponse.json();
      const customerId = charge.customer;
      if (!customerId) {
        return;
      }

      const user = await this.db
        .prepare('SELECT email, tier, subscription_status FROM users WHERE stripe_customer_id = ?')
        .bind(customerId)
        .first();

      if (!user) {
        return;
      }

      // Revoke access on chargeback — mirrors the refund handler behaviour.
      await this.db
        .prepare("UPDATE users SET subscription_status = ?, tier = ?, stripe_subscription_id = ?, updated_at = datetime('now') WHERE stripe_customer_id = ?")
        .bind('cancelled', 'basic', null, customerId)
        .run();

      await this.logSubscriptionEvent({
        email: user.email,
        eventType: 'chargeback',
        fromTier: user.tier,
        fromStatus: user.subscription_status,
        toStatus: 'cancelled',
        stripeEventId: dispute.id,
        metadata: { amount: dispute.amount, currency: dispute.currency, reason: dispute.reason }
      }).catch(err => console.error('Audit log failed:', err));
    } catch (error) {
      console.error('Dispute handler error:', error);
    }
  }

  /**
   * Handle subscription update
   */
  async handleSubscriptionUpdated(subscription) {
    try {
      const subscriptionId = subscription.id;
      const customerId = subscription.customer;
      const status = subscription.status;

      // Map Stripe subscription statuses to subscription_status
      // active, trialing = access allowed
      // past_due = access allowed but flagged
      // unpaid, canceled, incomplete_expired, paused = access denied
      const subscriptionStatus = status === 'past_due' ? 'past_due'
        : ['active', 'trialing'].includes(status) ? 'active'
          : 'inactive';

      // Try subscription ID first; fall back to customer ID in case the subscription
      // ID changed (e.g. plan interval switch via portal creating a new subscription).
      let user = await this.db
        .prepare('SELECT id, email, tier, subscription_status FROM users WHERE stripe_subscription_id = ?')
        .bind(subscriptionId)
        .first();

      if (!user && customerId) {
        user = await this.db
          .prepare('SELECT id, email, tier, subscription_status FROM users WHERE stripe_customer_id = ?')
          .bind(customerId)
          .first();
      }

      if (!user) {
        console.error('handleSubscriptionUpdated: no user found for subscription', subscriptionId, 'customer', customerId);
        return;
      }

      if (subscriptionStatus === 'inactive') {
        // Revoke tier access when subscription lapses
        await this.db
          .prepare("UPDATE users SET subscription_status = ?, tier = ?, stripe_subscription_id = ?, updated_at = datetime('now') WHERE id = ?")
          .bind(subscriptionStatus, 'basic', subscriptionId, user.id)
          .run();

        await this.logSubscriptionEvent({
          email: user.email,
          eventType: 'subscription_lapsed',
          fromTier: user.tier,
          fromStatus: user.subscription_status,
          toStatus: subscriptionStatus,
          stripeEventId: subscription.id
        }).catch(err => console.error('Audit log failed:', err));
        return;
      }

      // Detect plan changes so the tier column stays in sync with Stripe.
      // This handles changes made via the billing portal or the change-tier endpoint.
      const newPriceId = subscription.items?.data?.[0]?.price?.id;
      let newTier = null;
      if (newPriceId === this.env.STRIPE_PRICE_BASIC) {
        newTier = 'basic';
      } else if (newPriceId === this.env.STRIPE_PRICE_PRO) {
        newTier = 'pro';
      }

      // Log price comparison to help diagnose mismatches in production
      console.log('handleSubscriptionUpdated: priceId', newPriceId, '-> tier', newTier,
        '| BASIC configured:', !!this.env.STRIPE_PRICE_BASIC, '| PRO configured:', !!this.env.STRIPE_PRICE_PRO);

      if (newTier) {
        await this.db
          .prepare("UPDATE users SET subscription_status = ?, tier = ?, stripe_subscription_id = ?, updated_at = datetime('now') WHERE id = ?")
          .bind(subscriptionStatus, newTier, subscriptionId, user.id)
          .run();
      } else {
        await this.db
          .prepare("UPDATE users SET subscription_status = ?, stripe_subscription_id = ?, updated_at = datetime('now') WHERE id = ?")
          .bind(subscriptionStatus, subscriptionId, user.id)
          .run();
      }

      // When no recognized price ID is present, newTier is null and the DB tier is unchanged.
      // Compare against the effective resulting tier to avoid false audit entries.
      const effectiveTier = newTier ?? user.tier;

      if (user.tier !== effectiveTier || user.subscription_status !== subscriptionStatus) {
        await this.logSubscriptionEvent({
          email: user.email,
          eventType: 'subscription_updated',
          fromTier: user.tier,
          toTier: effectiveTier,
          fromStatus: user.subscription_status,
          toStatus: subscriptionStatus,
          stripeEventId: subscription.id
        });
      }
    } catch (error) {
      console.error('Subscription update handler error:', error);
    }
  }

  /**
   * Change subscription tier (upgrade/downgrade) with proration
   * POST /api/subscription/change-tier
   *
   * Uses Stripe's proration_behavior=always_invoice so the customer is
   * immediately billed (upgrade) or credited (downgrade) for the partial period.
   */
  async changeTier(request) {
    try {
      const user = await this.auth.authenticate(request);
      if (!user) {
        return jsonResponse({ error: 'Not authenticated' }, 401);
      }

      // Rate limit to prevent abuse with compromised license keys
      const clientId = getClientIdentifier(request);
      const rateLimitError = await checkRateLimit(
        `change-tier:${clientId}`,
        RateLimitPresets.CHECKOUT.limit,
        RateLimitPresets.CHECKOUT.windowMs,
        this.env,
        RateLimitPresets.CHECKOUT.bindingName
      );
      if (rateLimitError && rateLimitError.error) {
        return jsonResponse(rateLimitError, 429);
      }

      const body = await validateRequestBody(request);
      const newTier = body.tier;

      if (newTier !== 'basic' && newTier !== 'pro') {
        return jsonResponse({ error: 'Invalid tier. Must be "basic" or "pro"' }, 400);
      }

      const newPriceId = newTier === 'basic' ? this.env.STRIPE_PRICE_BASIC : this.env.STRIPE_PRICE_PRO;
      if (!newPriceId) {
        return jsonResponse({ error: 'Price not configured' }, 500);
      }

      const userData = await this.db
        .prepare('SELECT id, tier, stripe_subscription_id FROM users WHERE id = ?')
        .bind(user.userId)
        .first();

      if (!userData) {
        return jsonResponse({ error: 'User not found' }, 404);
      }

      if (userData.tier === newTier) {
        return jsonResponse({ error: 'Already on this tier' }, 400);
      }

      if (!userData.stripe_subscription_id) {
        return jsonResponse({ error: 'No active subscription found' }, 400);
      }

      // Fetch current subscription from Stripe to get the subscription item ID
      const subResponse = await fetchWithTimeout(
        `https://api.stripe.com/v1/subscriptions/${userData.stripe_subscription_id}`,
        { headers: { 'Authorization': `Bearer ${this.stripeKey}` } },
        5000
      );

      if (!subResponse.ok) {
        const stripeError = await subResponse.json();
        console.error('Failed to fetch subscription:', stripeError);
        return jsonResponse({ error: 'Failed to fetch current subscription' }, 400);
      }

      const subscription = await subResponse.json();

      if (subscription.status !== 'active' && subscription.status !== 'trialing') {
        return jsonResponse({ error: 'Subscription is not active' }, 400);
      }

      const subscriptionItemId = subscription.items?.data?.[0]?.id;
      if (!subscriptionItemId) {
        return jsonResponse({ error: 'Subscription item not found' }, 400);
      }

      // Update the subscription with proration_behavior=always_invoice:
      // - Upgrade (basic→pro): Stripe immediately invoices the prorated difference
      // - Downgrade (pro→basic): Stripe credits the unused amount and invoices immediately
      const updateResponse = await fetchWithTimeout(
        `https://api.stripe.com/v1/subscriptions/${userData.stripe_subscription_id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            'items[0][id]': subscriptionItemId,
            'items[0][price]': newPriceId,
            'proration_behavior': 'always_invoice',
            'metadata[tier]': newTier,
            'expand[]': 'latest_invoice'
          })
        },
        5000
      );

      if (!updateResponse.ok) {
        const stripeError = await updateResponse.json();
        console.error('Failed to update subscription:', stripeError);
        return jsonResponse({ error: stripeError.error?.message || 'Failed to update subscription' }, 400);
      }

      const updatedSubscription = await updateResponse.json();

      // Only update DB tier when the invoice is settled (paid or zero-due).
      // If the invoice requires payment action, the webhook will update the tier
      // once payment succeeds — prevents brief tier escalation on card decline.
      const invoice = updatedSubscription.latest_invoice;
      if (!invoice || this.isInvoiceSettled(invoice)) {
        await this.db
          .prepare("UPDATE users SET tier = ?, updated_at = datetime('now') WHERE id = ?")
          .bind(newTier, userData.id)
          .run();

        await this.logSubscriptionEvent({
          email: user.email,
          eventType: 'tier_changed',
          fromTier: userData.tier,
          toTier: newTier,
          toStatus: 'active',
          stripeEventId: userData.stripe_subscription_id
        }).catch(err => console.error('Audit log failed:', err));
      }

      const nextBillingDate = updatedSubscription.current_period_end
        ? new Date(updatedSubscription.current_period_end * 1000).toISOString()
        : null;

      if (this.logger) {
        logSubscription(this.logger, 'tier_changed', {
          userId: userData.id,
          oldTier: userData.tier,
          newTier,
          subscriptionId: userData.stripe_subscription_id
        });
      }

      return jsonResponse({ success: true, tier: newTier, nextBillingDate });

    } catch (error) {
      console.error('Change tier error:', error);
      if (error instanceof ValidationError) {
        return jsonResponse({ error: error.message, field: error.field }, 400);
      }
      return jsonResponse({ error: 'Failed to change tier' }, 500);
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
        return jsonResponse({ error: 'Not authenticated' }, 401);
      }

      const userData = await this.db
        .prepare('SELECT id, stripe_customer_id, stripe_subscription_id FROM users WHERE id = ?')
        .bind(user.userId)
        .first();

      if (!userData?.stripe_customer_id) {
        return jsonResponse({ error: 'No subscription found' }, 400);
      }

      const { searchParams } = new URL(request.url);
      const tier = searchParams.get('tier');

      let portalUrl;
      if ((tier === 'basic' || tier === 'pro') && userData.stripe_subscription_id) {
        try {
          portalUrl = await this.createPortalWithPlanChange(userData.stripe_customer_id, userData.stripe_subscription_id, tier);
        } catch (planChangeError) {
          // If plan change portal fails (stale subscription, missing item, etc.),
          // fall back to regular billing portal. User can still upgrade from there.
          if (this.isStripeMissingResourceError(planChangeError)) {
            // Subscription is stale in Stripe - clear it and fall back to regular portal
            await this.db
              .prepare("UPDATE users SET stripe_subscription_id = ?, subscription_status = ?, updated_at = datetime('now') WHERE id = ?")
              .bind(null, 'inactive', userData.id)
              .run();
          }
          // Fall back to basic billing portal for any error
          const portal = await this.createBillingPortal(userData.stripe_customer_id);
          portalUrl = portal.url;
        }
      } else {
        const portal = await this.createBillingPortal(userData.stripe_customer_id);
        portalUrl = portal.url;
      }

      return jsonResponse({ url: portalUrl });

    } catch (error) {
      console.error('Portal error:', error);
      return jsonResponse({ error: 'Failed to create portal' }, 500);
    }
  }

  /**
   * Get available plans
   * GET /api/subscription/plans
   */
  async getPlans(request) {
    const dailyLimit = parseInt(this.env.BASIC_TIER_DAILY_LIMIT || '50');
    return jsonResponse({
      plans: [
        {
          tier: 'basic',
          name: 'Basic',
          billingPeriod: 'weekly',
          price: 1.99,
          dailyLimit,
          features: []
        },
        {
          tier: 'basic',
          name: 'Basic',
          billingPeriod: 'monthly',
          price: 5.99,
          dailyLimit,
          features: []
        },
        {
          tier: 'pro',
          name: 'Pro',
          billingPeriod: 'weekly',
          price: 3.49,
          dailyLimit: null,
          rateLimit: '20 per minute',
          features: ['Unlimited requests', 'GPT-5 Nano', '20 requests/minute']
        },
        {
          tier: 'pro',
          name: 'Pro',
          billingPeriod: 'monthly',
          price: 9.99,
          dailyLimit: null,
          rateLimit: '20 per minute',
          features: ['Unlimited requests', 'GPT-5 Nano', '20 requests/minute'],
          recommended: true
        }
      ]
    });
  }

  /**
   * Verify payment session
   * POST /api/subscription/verify-payment
   */
  async verifyPayment(request) {
    try {
      // Rate limit to prevent session ID brute-forcing
      const clientId = getClientIdentifier(request);
      const rateLimitError = await checkRateLimit(
        'verify:' + clientId,
        RateLimitPresets.AUTH.limit,
        RateLimitPresets.AUTH.windowMs,
        this.env,
        RateLimitPresets.AUTH.bindingName
      );
      if (rateLimitError && rateLimitError.error) {
        return jsonResponse(rateLimitError, 429);
      }

      const body = await validateRequestBody(request);
      const sessionId = body.sessionId;

      if (!sessionId) {
        return jsonResponse({ error: 'Session ID is required' }, 400);
      }

      // Validate sessionId format to prevent SSRF/path traversal
      // Stripe checkout session IDs match pattern: cs_test_... or cs_live_...
      if (!/^cs_(test|live)_[a-zA-Z0-9_]+$/.test(sessionId)) {
        return jsonResponse({ error: 'Invalid session ID format' }, 400);
      }

      // Retrieve the session from Stripe
      const response = await fetchWithTimeout(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${this.stripeKey}`
        }
      }, 5000);

      if (!response.ok) {
        const error = await response.json();
        console.error('Stripe session retrieval failed:', error);
        return jsonResponse({ error: 'Failed to verify payment session' }, 400);
      }

      const session = await response.json();

      // Check if the session was completed successfully
      if (session.payment_status === 'paid' && session.status === 'complete') {
        const tier = (session.metadata?.tier === 'basic' || session.metadata?.tier === 'pro')
          ? session.metadata.tier
          : 'pro';
        return jsonResponse({
          success: true,
          tier,
          email: session.customer_details?.email || session.customer_email
        });
      } else {
        return jsonResponse({
          error: 'Payment not completed',
          status: session.payment_status
        }, 400);
      }

    } catch (error) {
      if (this.logger) {
        this.logger.error('Payment verification error', error);
      }
      if (error instanceof ValidationError) {
        return jsonResponse({ error: error.message, field: error.field }, 400);
      }
      return jsonResponse({ error: 'Failed to verify payment' }, 500);
    }
  }

  /**
   * Swap plan from Basic to Pro with proration via Stripe Checkout.
   * Authenticates via license key, then creates a Checkout upgrade session.
   * The existing checkout.session.completed webhook handles the tier update.
   * POST /api/subscription/swap-plan
   */
  async swapPlan(request) {
    try {
      // Authenticate user
      const user = await this.auth.authenticate(request);
      if (!user) {
        return jsonResponse({ error: 'Not authenticated' }, 401);
      }

      // Rate limit
      const clientId = getClientIdentifier(request);
      const rateLimitError = await checkRateLimit(
        `swap:${clientId}`,
        RateLimitPresets.CHECKOUT.limit,
        RateLimitPresets.CHECKOUT.windowMs,
        this.env,
        RateLimitPresets.CHECKOUT.bindingName
      );
      if (rateLimitError && rateLimitError.error) {
        return jsonResponse(rateLimitError, 429);
      }

      const proPriceId = this.env.STRIPE_PRICE_PRO;
      if (!proPriceId) {
        return jsonResponse({ error: 'Pro price not configured' }, 500);
      }

      // Get full user data from DB
      const userData = await this.db
        .prepare('SELECT tier, stripe_subscription_id, stripe_customer_id, email FROM users WHERE id = ?')
        .bind(user.userId)
        .first();

      if (!userData) {
        return jsonResponse({ error: 'User not found' }, 404);
      }

      if (userData.tier !== 'basic') {
        return jsonResponse({ error: 'Plan swap is only available for Basic tier users' }, 400);
      }

      if (!userData.stripe_subscription_id) {
        return jsonResponse({ error: 'No active subscription found' }, 400);
      }

      // Upgrade natively generating a prorated invoice.
      const upgradeResult = await this.upgradeStripeSubscription(
        userData.stripe_subscription_id,
        proPriceId,
        user.userId,
        userData.email
      );

      return jsonResponse({ ...upgradeResult, sessionId: 'upgrade_' + userData.stripe_subscription_id });

    } catch (error) {
      console.error('Plan swap error:', error);
      return jsonResponse({ error: 'Failed to initiate plan upgrade' }, 500);
    }
  }

  /**
   * Create Stripe customer
   */
  async createStripeCustomer(email) {
    const response = await fetchWithTimeout('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        email: email
      })
    }, 5000);

    if (!response.ok) {
      const error = await response.json();
      console.error('Stripe customer creation failed:', error);
      const stripeError = new Error(error.error?.message || 'Failed to create Stripe customer');
      stripeError.stripeCode = error.error?.code;
      stripeError.stripeType = error.error?.type;
      throw stripeError;
    }

    return await response.json();
  }

  /**
   * Resolve a Stripe price ID from tier + billing period.
   * @param {'basic'|'pro'} tier
   * @param {'weekly'|'monthly'} billingPeriod
   * @returns {string|undefined}
   */
  getPriceId(tier, billingPeriod) {
    if (tier === 'basic') {
      return billingPeriod === 'monthly'
        ? this.env.STRIPE_PRICE_BASIC_MONTHLY
        : this.env.STRIPE_PRICE_BASIC_WEEKLY;
    }
    return billingPeriod === 'monthly'
      ? this.env.STRIPE_PRICE_PRO_MONTHLY
      : this.env.STRIPE_PRICE_PRO_WEEKLY;
  }

  /**
   * Create Stripe checkout session.
   */
  async createStripeCheckout(customerId, priceId, email, tier = 'pro', billingPeriod = 'weekly') {
    const extensionUrl = this.env.EXTENSION_URL || 'https://captureai.dev';
    const params = {
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      mode: 'subscription',
      success_url: `${extensionUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${extensionUrl}/activate`,
      'metadata[tier]': tier,
      'metadata[billing_period]': billingPeriod
    };

    // Use customer ID if available, otherwise use email
    if (customerId) {
      params.customer = customerId;
    } else {
      params.customer_email = email;
    }

    const response = await fetchWithTimeout('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(params)
    }, 5000);

    if (!response.ok) {
      const error = await response.json();
      console.error('Stripe checkout creation failed:', error);
      const stripeError = new Error(error.error?.message || 'Failed to create checkout session');
      stripeError.stripeCode = error.error?.code;
      stripeError.stripeType = error.error?.type;
      throw stripeError;
    }

    return await response.json();
  }

  /**
   * Upgrade an existing Stripe subscription directly.
   * Uses native proration (always_invoice) + billing cycle reset to handle interval changes.
   * Returns the hosted invoice URL for payment, or success URL if already paid.
   */
  async upgradeStripeSubscription(subscriptionId, newPriceId, userId, email) {
    const extensionUrl = this.env.EXTENSION_URL || 'https://captureai.dev';

    // 1. Fetch current subscription to get the old item ID
    const subResponse = await fetchWithTimeout(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      { headers: { 'Authorization': `Bearer ${this.stripeKey}` } },
      5000
    );

    if (!subResponse.ok) {
      throw new Error('Failed to retrieve existing subscription for upgrade');
    }

    const sub = await subResponse.json();
    const itemId = sub.items?.data?.[0]?.id;
    if (!itemId) {
      throw new Error('No subscription item found to upgrade');
    }

    // 2. Update subscription changing price, generating invoice immediately
    const params = new URLSearchParams({
      'items[0][id]': itemId,
      'items[0][price]': newPriceId,
      'proration_behavior': 'always_invoice',  // Invoice immediately for the difference
      'billing_cycle_anchor': 'now',           // Required when changing intervals (weekly->monthly)
      'metadata[tier]': 'pro',
      'expand[]': 'latest_invoice'             // Get the generated invoice
    });

    const updateResponse = await fetchWithTimeout(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      },
      5000
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      console.error('Subscription update failed:', error);
      throw new Error(error.error?.message || 'Failed to update subscription');
    }

    const updatedSub = await updateResponse.json();

    // 3. Check if invoice needs payment first
    const invoice = updatedSub.latest_invoice;
    // Update DB if invoice already collected; the webhook handles any deferred payment.
    if (updatedSub.status === 'active' || !invoice || this.isInvoiceSettled(invoice)) {
      await this.db
        .prepare("UPDATE users SET tier = ?, subscription_status = ?, updated_at = datetime('now') WHERE id = ?")
        .bind('pro', 'active', userId)
        .run();

      await this.logSubscriptionEvent({
        email,
        eventType: 'tier_changed',
        fromTier: 'basic',
        toTier: 'pro',
        toStatus: 'active',
        stripeEventId: subscriptionId
      }).catch(err => console.error('Audit log failed:', err));

      if (this.logger) {
        logSubscription(this.logger, 'plan_swapped', { userId, oldTier: 'basic', newTier: 'pro' });
      }
    }

    return { url: `${extensionUrl}/payment-success?upgraded=1&tier=pro` };
  }

  /**
   * Switch an active subscription to a different tier with Stripe native proration.
   * Returns hosted invoice URL when payment action is required, otherwise success URL.
   */
  async switchExistingSubscriptionTier(subscriptionId, newTier, userId, email) {
    const extensionUrl = this.env.EXTENSION_URL || 'https://captureai.dev';
    const newPriceId = newTier === 'basic' ? this.env.STRIPE_PRICE_BASIC : this.env.STRIPE_PRICE_PRO;

    if (!newPriceId) {
      throw new Error('Price not configured');
    }

    const subResponse = await fetchWithTimeout(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      { headers: { 'Authorization': `Bearer ${this.stripeKey}` } },
      5000
    );

    if (!subResponse.ok) {
      const error = await subResponse.json();
      const stripeError = new Error(error.error?.message || 'Failed to fetch current subscription');
      stripeError.stripeCode = error.error?.code;
      stripeError.stripeType = error.error?.type;
      throw stripeError;
    }

    const subscription = await subResponse.json();
    const subscriptionItemId = subscription.items?.data?.[0]?.id;

    if (!subscriptionItemId) {
      throw new Error('Subscription item not found');
    }

    const updateResponse = await fetchWithTimeout(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'items[0][id]': subscriptionItemId,
          'items[0][price]': newPriceId,
          'proration_behavior': 'always_invoice',
          'billing_cycle_anchor': 'now',
          'metadata[tier]': newTier,
          'expand[]': 'latest_invoice'
        })
      },
      5000
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      const stripeError = new Error(error.error?.message || 'Failed to update subscription');
      stripeError.stripeCode = error.error?.code;
      stripeError.stripeType = error.error?.type;
      throw stripeError;
    }

    const updatedSubscription = await updateResponse.json();
    const invoice = updatedSubscription.latest_invoice;

    // Update DB now if payment is already collected; webhook covers any deferred payment.
    if (!invoice || this.isInvoiceSettled(invoice)) {
      await this.db
        .prepare("UPDATE users SET tier = ?, subscription_status = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(newTier, 'active', userId)
        .run();

      if (email) {
        await this.logSubscriptionEvent({
          email,
          eventType: 'tier_changed',
          toTier: newTier,
          toStatus: 'active',
          stripeEventId: subscriptionId
        }).catch(err => console.error('Audit log failed:', err));
      }
    }

    return { url: `${extensionUrl}/payment-success?upgraded=1&tier=${newTier}` };
  }

  /**
   * Preview the prorated cost of a subscription tier change using Stripe's invoice preview.
   * Does NOT create an invoice or charge the customer.
   */
  async previewSubscriptionTierChange(subscriptionId, newTier, newBillingPeriod = 'weekly') {
    const newPriceId = this.getPriceId(newTier, newBillingPeriod);
    if (!newPriceId) {
      throw new Error('Price not configured');
    }

    const subResponse = await fetchWithTimeout(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      { headers: { 'Authorization': `Bearer ${this.stripeKey}` } }, 5000
    );
    if (!subResponse.ok) {
      const error = await subResponse.json();
      const e = new Error(error.error?.message || 'Failed to fetch subscription');
      e.stripeCode = error.error?.code; e.stripeType = error.error?.type;
      throw e;
    }
    const subscription = await subResponse.json();
    const itemId = subscription.items?.data?.[0]?.id;
    const customerId = subscription.customer;

    if (!itemId) {
      throw new Error('No subscription item found');
    }

    const previewResponse = await fetchWithTimeout(
      'https://api.stripe.com/v1/invoices/create_preview',
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          customer: customerId,
          subscription: subscriptionId,
          'subscription_details[items][0][id]': itemId,
          'subscription_details[items][0][price]': newPriceId,
          'subscription_details[proration_behavior]': 'always_invoice',
          'subscription_details[billing_cycle_anchor]': 'now'
        })
      }, 5000
    );
    if (!previewResponse.ok) {
      const error = await previewResponse.json();
      const e = new Error(error.error?.message || 'Failed to preview subscription change');
      e.stripeCode = error.error?.code; e.stripeType = error.error?.type;
      throw e;
    }
    const preview = await previewResponse.json();
    return this.extractInvoicePreview(preview);
  }

  /**
   * Create billing portal session
   */
  async createBillingPortal(customerId) {
    const extensionUrl = this.env.EXTENSION_URL || 'https://captureai.dev';
    const response = await fetchWithTimeout('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: `${extensionUrl}/activate`
      })
    }, 5000);

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    return await response.json();
  }

  /**
   * Create a Customer Portal session pre-configured to confirm a specific plan change.
   * The portal lands directly on the subscription update confirmation page, showing
   * the prorated amount. Stripe applies the change when the customer confirms.
   */
  async createPortalWithPlanChange(customerId, subscriptionId, newTier, newBillingPeriod = 'weekly') {
    const extensionUrl = this.env.EXTENSION_URL || 'https://captureai.dev';
    const newPriceId = this.getPriceId(newTier, newBillingPeriod);

    if (!newPriceId) {
      throw new Error('Price not configured');
    }

    const subResponse = await fetchWithTimeout(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      { headers: { 'Authorization': `Bearer ${this.stripeKey}` } },
      5000
    );

    if (!subResponse.ok) {
      const error = await subResponse.json();
      const e = new Error(error.error?.message || 'Failed to fetch subscription');
      e.stripeCode = error.error?.code;
      e.stripeType = error.error?.type;
      throw e;
    }

    const subscription = await subResponse.json();
    const itemId = subscription.items?.data?.[0]?.id;

    if (!itemId || subscription.items?.data?.length === 0) {
      throw new Error('Subscription item not found - subscription may be inactive');
    }

    const response = await fetchWithTimeout('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: `${extensionUrl}/activate`,
        'flow_data[type]': 'subscription_update_confirm',
        'flow_data[subscription_update_confirm][subscription]': subscriptionId,
        'flow_data[subscription_update_confirm][items][0][id]': itemId,
        'flow_data[subscription_update_confirm][items][0][price]': newPriceId,
        'flow_data[subscription_update_confirm][items][0][quantity]': '1'
      })
    }, 5000);

    if (!response.ok) {
      const error = await response.json();
      const e = new Error(error.error?.message || 'Failed to create portal session');
      e.stripeCode = error.error?.code;
      e.stripeType = error.error?.type;
      throw e;
    }

    const portal = await response.json();
    return portal.url;
  }

  /**
   * Detect Stripe resource-missing errors (e.g. stale customer/subscription IDs)
   */
  isStripeMissingResourceError(error) {
    if (!error) {
      return false;
    }

    if (error.stripeCode === 'resource_missing') {
      return true;
    }

    return typeof error.message === 'string' && error.message.includes('No such');
  }

  /**
   * Determine if the invoice still requires customer payment action.
   */
  isInvoicePendingPayment(invoice) {
    if (!invoice) {
      return false;
    }

    if (invoice.status === 'paid' || invoice.paid === true) {
      return false;
    }

    const amountDue = Number(invoice.amount_due ?? invoice.amount_remaining ?? 0);
    return amountDue > 0;
  }

  /**
   * Determine if an invoice is settled (paid or zero due).
   */
  isInvoiceSettled(invoice) {
    if (!invoice) {
      return true;
    }

    if (invoice.status === 'paid' || invoice.paid === true) {
      return true;
    }

    const amountDue = Number(invoice.amount_due ?? invoice.amount_remaining ?? 0);
    return amountDue === 0;
  }

  /**
   * Extract preview pricing fields from Stripe invoice for UI display before payment.
   */
  extractInvoicePreview(invoice) {
    return {
      amountDueCents: Number(invoice.amount_due ?? invoice.amount_remaining ?? 0),
      subtotalCents: Number(invoice.subtotal ?? 0),
      totalCents: Number(invoice.total ?? 0),
      currency: typeof invoice.currency === 'string' ? invoice.currency : 'usd'
    };
  }

  /**
   * Verify Stripe webhook signature using HMAC SHA256
   * Includes replay attack detection with processed event tracking
   */
  async verifyWebhookSignature(payload, signature) {
    // Validate signature format first
    const signatureParts = validateStripeSignature(signature);

    const timestamp = signatureParts.t;
    const expectedSignature = signatureParts.v1;

    // Check timestamp to prevent replay attacks (tightened to 2 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - parseInt(timestamp);

    if (timeDiff > 120) {
      if (this.logger) {
        this.logger.security('Webhook timestamp too old', {
          timeDiff,
          timestamp,
          currentTime
        });
      }
      const err = new Error('Webhook timestamp too old (max 2 minutes)');
      err.isSignatureError = true;
      throw err;
    }

    // Reject future timestamps (clock skew tolerance: 30 seconds)
    if (timeDiff < -30) {
      if (this.logger) {
        this.logger.security('Webhook timestamp in future', {
          timeDiff,
          timestamp,
          currentTime
        });
      }
      const err = new Error('Webhook timestamp is in the future');
      err.isSignatureError = true;
      throw err;
    }

    // Construct signed payload
    const signedPayload = `${timestamp}.${payload}`;

    // Compute HMAC SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload)
    );

    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison to prevent timing attacks
    if (!constantTimeCompare(computedSignature, expectedSignature)) {
      if (this.logger) {
        this.logger.security('Webhook signature verification failed');
      }
      const err = new Error('Signature verification failed');
      err.isSignatureError = true;
      throw err;
    }

    const event = JSON.parse(payload);

    // Check for duplicate webhook processing (replay attack detection)
    const eventId = event.id;
    if (eventId) {
      const processed = await this.checkWebhookProcessed(eventId);
      if (processed) {
        if (this.logger) {
          this.logger.security('Duplicate webhook detected (replay attack)', {
            eventId,
            eventType: event.type
          });
        }
        throw new Error('Webhook already processed');
      }

      // Mark event as processed
      await this.markWebhookProcessed(eventId, event.type, timestamp);
    }

    return event;
  }

  /**
   * Check if webhook event has been processed
   */
  async checkWebhookProcessed(eventId) {
    try {
      const result = await this.db
        .prepare('SELECT id FROM webhook_events WHERE event_id = ?')
        .bind(eventId)
        .first();

      return !!result;
    } catch (error) {
      // If table doesn't exist, event hasn't been processed
      if (this.logger) {
        this.logger.warn('Webhook tracking table may not exist', { error: error.message });
      }
      return false;
    }
  }

  /**
   * Mark webhook event as processed
   */
  async markWebhookProcessed(eventId, eventType, timestamp) {
    try {
      await this.db
        .prepare('INSERT INTO webhook_events (event_id, event_type, processed_at, webhook_timestamp) VALUES (?, ?, datetime(\'now\'), ?)')
        .bind(eventId, eventType, timestamp)
        .run();
    } catch (error) {
      if (this.logger) {
        this.logger.error('Failed to mark webhook as processed', error, { eventId });
      }
      return;
    }

    // Cleanup old events separately so failure doesn't affect the insert
    try {
      await this.db
        .prepare("DELETE FROM webhook_events WHERE processed_at < datetime('now', '-24 hours')")
        .run();
    } catch (error) {
      if (this.logger) {
        this.logger.warn('Webhook cleanup failed', { error: error.message });
      }
    }
  }
}
