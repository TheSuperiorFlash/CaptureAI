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

      const priceId = tier === 'basic' ? this.env.STRIPE_PRICE_BASIC : this.env.STRIPE_PRICE_PRO;
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

      // Block same-tier re-subscription when the user already has a live subscription.
      // 'inactive' is CaptureAI's sentinel for a canceled/cleared subscription.
      if (
        existingUser?.stripe_subscription_id &&
        existingUser?.tier === tier &&
        existingUser?.subscription_status !== 'inactive'
      ) {
        const tierLabel = tier === 'pro' ? 'Pro' : 'Basic';
        return jsonResponse({
          error: `You already have an active ${tierLabel} subscription. To switch plans, select the other plan.`,
          alreadySubscribed: true,
          currentTier: existingUser.tier,
        }, 409);
      }

      // Any subscriber with an existing subscription requesting a different tier
      // goes through the two-step preview+confirm flow regardless of subscription_status.
      // This prevents bypassing the preview when status is e.g. 'trialing' or 'past_due'.
      if (
        existingUser?.stripe_subscription_id &&
        existingUser?.tier !== tier
      ) {
        existingSubscriptionId = existingUser.stripe_subscription_id;

        if (!body.confirmed) {
          // Step 1: return price preview — no charge, no invoice created
          try {
            const preview = await this.previewSubscriptionTierChange(existingSubscriptionId, tier);
            return jsonResponse({ requiresConfirmation: true, tier, ...preview });
          } catch (previewError) {
            if (!this.isStripeMissingResourceError(previewError)) { throw previewError; }
            // Stale subscription ID — clear and fall through to fresh checkout
            await this.db
              .prepare('UPDATE users SET stripe_subscription_id = ?, subscription_status = ? WHERE id = ?')
              .bind(null, 'inactive', existingUser.id).run();
          }
        } else {
          // Step 2: confirmed — verify email ownership via OTP before applying the tier switch
          const verificationCode = validateVerificationCode(body.verificationCode, true);
          const codeValid = await this.consumeVerificationCode(email, verificationCode, 'tier_switch', tier);
          if (!codeValid) {
            return jsonResponse({ error: 'Invalid or expired verification code' }, 403);
          }

          try {
            const switchResult = await this.switchExistingSubscriptionTier(existingSubscriptionId, tier, existingUser.id);
            return jsonResponse({ ...switchResult, sessionId: 'tier_change_' + existingSubscriptionId, changedTier: true });
          } catch (switchError) {
            if (!this.isStripeMissingResourceError(switchError)) { throw switchError; }
            // Stale subscription ID — clear and fall through to fresh checkout
            await this.db
              .prepare('UPDATE users SET stripe_subscription_id = ?, subscription_status = ? WHERE id = ?')
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
        session = await this.createStripeCheckout(customerId, priceId, email, tier);
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
                  subscription_status = ?
              WHERE id = ?
            `)
            .bind(customerId, null, 'inactive', existingUser.id)
            .run();
        }

        session = await this.createStripeCheckout(customerId, priceId, email, tier);
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

      if (tier !== 'basic' && tier !== 'pro') {
        return jsonResponse({ error: 'Invalid tier' }, 400);
      }

      // Verify user exists with an active subscription requesting a different tier
      const existingUser = await this.db
        .prepare('SELECT id, tier, stripe_subscription_id FROM users WHERE email = ?')
        .bind(email)
        .first();

      if (!existingUser?.stripe_subscription_id || existingUser.tier === tier) {
        // Don't reveal whether the email exists — return generic success
        return jsonResponse({ success: true, message: 'If an account exists, a verification code has been sent' });
      }

      // Invalidate previous unused codes for this email+action
      await this.db
        .prepare('UPDATE verification_codes SET used = 1 WHERE email = ? AND action = ? AND used = 0')
        .bind(email, 'tier_switch')
        .run();

      // Generate and store code with 10-minute TTL
      const code = this.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await this.db
        .prepare('INSERT INTO verification_codes (email, code, action, tier, expires_at) VALUES (?, ?, ?, ?, ?)')
        .bind(email, code, 'tier_switch', tier, expiresAt)
        .run();

      // Send code via email
      if (this.env.RESEND_API_KEY) {
        const tierLabel = tier === 'pro' ? 'Pro' : 'Basic';
        const subject = `CaptureAI — Verify your plan change to ${tierLabel}`;
        const htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <h2 style="color: #0ea5e9; margin: 0 0 16px;">Verify Your Plan Change</h2>
            <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">You requested to switch to the <strong>${tierLabel}</strong> plan. Enter this code to confirm:</p>
            <div style="background: #0f172a; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
              <span style="font-family: 'SF Mono', Monaco, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #fff;">${code}</span>
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">This code expires in 10 minutes. If you did not request this change, you can safely ignore this email.</p>
          </div>`;
        const textContent = `CaptureAI Verification Code: ${code}\n\nEnter this code to confirm your plan change to ${tierLabel}.\nThis code expires in 10 minutes.\n\nIf you did not request this change, ignore this email.`;

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
   * Clean up expired or used verification codes
   */
  async cleanupVerificationCodes() {
    await this.db
      .prepare("DELETE FROM verification_codes WHERE expires_at < datetime('now') OR used = 1")
      .run();
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

      // Determine purchased tier from checkout session metadata
      const purchasedTier = (session.metadata?.tier === 'basic' || session.metadata?.tier === 'pro')
        ? session.metadata.tier
        : 'pro';

      if (user) {
        // User exists - set to purchased tier
        await this.db
          .prepare(`
            UPDATE users
            SET tier = ?,
                subscription_status = ?,
                stripe_customer_id = ?,
                stripe_subscription_id = ?
            WHERE id = ?
          `)
          .bind(purchasedTier, 'active', customerId, subscriptionId, user.id)
          .run();

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
            INSERT INTO users (id, license_key, email, tier, stripe_customer_id, stripe_subscription_id, subscription_status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(userId, licenseKey, customerEmail, purchasedTier, customerId, subscriptionId, 'active')
          .run();

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

      if (customerEmail) {
        await this.db
          .prepare('UPDATE users SET subscription_status = ? WHERE LOWER(email) = LOWER(?)')
          .bind('active', customerEmail)
          .run();
      }
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
          .prepare('UPDATE users SET subscription_status = ? WHERE LOWER(email) = LOWER(?)')
          .bind('past_due', customerEmail)
          .run();
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

      await this.db
        .prepare('UPDATE users SET subscription_status = ?, tier = ? WHERE stripe_subscription_id = ?')
        .bind('cancelled', null, subscriptionId)
        .run();
    } catch (error) {
      console.error('Subscription cancellation handler error:', error);
    }
  }

  /**
   * Handle subscription update
   */
  async handleSubscriptionUpdated(subscription) {
    try {
      const subscriptionId = subscription.id;
      const status = subscription.status;

      // Map Stripe subscription statuses to subscription_status
      // active, trialing = access allowed
      // past_due = access allowed but flagged
      // unpaid, canceled, incomplete_expired, paused = access denied
      const subscriptionStatus = status === 'past_due' ? 'past_due'
        : ['active', 'trialing'].includes(status) ? 'active'
          : 'inactive';

      if (subscriptionStatus === 'inactive') {
        // Revoke tier access when subscription lapses
        await this.db
          .prepare('UPDATE users SET subscription_status = ?, tier = ? WHERE stripe_subscription_id = ?')
          .bind(subscriptionStatus, null, subscriptionId)
          .run();
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

      if (newTier) {
        await this.db
          .prepare('UPDATE users SET subscription_status = ?, tier = ? WHERE stripe_subscription_id = ?')
          .bind(subscriptionStatus, newTier, subscriptionId)
          .run();
      } else {
        await this.db
          .prepare('UPDATE users SET subscription_status = ? WHERE stripe_subscription_id = ?')
          .bind(subscriptionStatus, subscriptionId)
          .run();
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
          .prepare('UPDATE users SET tier = ? WHERE id = ?')
          .bind(newTier, userData.id)
          .run();
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
        .prepare('SELECT stripe_customer_id FROM users WHERE id = ?')
        .bind(user.userId)
        .first();

      if (!userData?.stripe_customer_id) {
        return jsonResponse({ error: 'No subscription found' }, 400);
      }

      const portal = await this.createBillingPortal(userData.stripe_customer_id);

      return jsonResponse({ url: portal.url });

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
    return jsonResponse({
      plans: [
        {
          tier: 'basic',
          name: 'Basic',
          price: 1.49,
          billingPeriod: 'week',
          dailyLimit: parseInt(this.env.BASIC_TIER_DAILY_LIMIT || '50'),
          features: []
        },
        {
          tier: 'pro',
          name: 'Pro',
          price: 9.99,
          billingPeriod: 'month',
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
   * Create Stripe checkout session.
   */
  async createStripeCheckout(customerId, priceId, email, tier = 'pro') {
    const extensionUrl = this.env.EXTENSION_URL || 'https://captureai.dev';
    const params = {
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      mode: 'subscription',
      success_url: `${extensionUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${extensionUrl}/activate`,
      'metadata[tier]': tier
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
        .prepare('UPDATE users SET tier = ?, subscription_status = ? WHERE id = ?')
        .bind('pro', 'active', userId)
        .run();

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
  async switchExistingSubscriptionTier(subscriptionId, newTier, userId) {
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
        .prepare('UPDATE users SET tier = ?, subscription_status = ? WHERE id = ?')
        .bind(newTier, 'active', userId)
        .run();
    }

    return { url: `${extensionUrl}/payment-success?upgraded=1&tier=${newTier}` };
  }

  /**
   * Preview the prorated cost of a subscription tier change using Stripe's invoice preview.
   * Does NOT create an invoice or charge the customer.
   */
  async previewSubscriptionTierChange(subscriptionId, newTier) {
    const newPriceId = newTier === 'basic' ? this.env.STRIPE_PRICE_BASIC : this.env.STRIPE_PRICE_PRO;
    if (!newPriceId) { throw new Error('Price not configured'); }

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

    if (!itemId) { throw new Error('No subscription item found'); }

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
          'subscription_details[billing_cycle_anchor]': 'now',
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
      await this.markWebhookProcessed(eventId, timestamp);
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
  async markWebhookProcessed(eventId, timestamp) {
    try {
      await this.db
        .prepare('INSERT INTO webhook_events (event_id, processed_at, webhook_timestamp) VALUES (?, datetime(\'now\'), ?)')
        .bind(eventId, timestamp)
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
