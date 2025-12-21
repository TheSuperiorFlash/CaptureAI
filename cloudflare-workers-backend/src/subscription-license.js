/**
 * Subscription Handler (License Key System)
 * Handles Stripe subscription payments and license key generation
 */

import { jsonResponse, parseJSON, generateUUID } from './utils';
import { AuthHandler } from './auth-license';

export class SubscriptionHandler {
  constructor(env) {
    this.env = env;
    this.db = env.DB;
    this.auth = new AuthHandler(env);
    this.stripeKey = env.STRIPE_SECRET_KEY;
    this.webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  }

  /**
   * Create Stripe checkout session for Pro tier
   * POST /api/subscription/create-checkout
   */
  async createCheckout(request) {
    try {
      const { email } = await parseJSON(request);

      if (!email) {
        return jsonResponse({ error: 'Email required' }, 400);
      }

      const priceId = this.env.STRIPE_PRICE_PRO;
      if (!priceId) {
        return jsonResponse({ error: 'Price not configured' }, 500);
      }

      // Create or get Stripe customer
      let customerId;
      const existingUser = await this.db
        .prepare('SELECT stripe_customer_id FROM users WHERE email = ?')
        .bind(email)
        .first();

      if (existingUser?.stripe_customer_id) {
        customerId = existingUser.stripe_customer_id;
      } else {
        const customer = await this.createStripeCustomer(email);
        customerId = customer.id;
      }

      // Create checkout session
      const session = await this.createStripeCheckout(customerId, priceId, email);

      return jsonResponse({
        url: session.url,
        sessionId: session.id
      });

    } catch (error) {
      console.error('Checkout creation error:', error);
      return jsonResponse({ error: 'Failed to create checkout: ' + error.message }, 500);
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

      // In production, verify webhook signature properly
      // For now, just parse the event
      const event = JSON.parse(body);

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
      return jsonResponse({ error: 'Webhook failed' }, 500);
    }
  }

  /**
   * Handle successful checkout - generate and send license key
   */
  async handleCheckoutCompleted(session) {
    try {
      const customerEmail = session.customer_email;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      if (!customerEmail) {
        console.error('No customer email in checkout session');
        return;
      }

      // Check if user already exists
      let user = await this.db
        .prepare('SELECT * FROM users WHERE email = ?')
        .bind(customerEmail)
        .first();

      if (user) {
        // User exists - upgrade to pro
        await this.db
          .prepare(`
            UPDATE users
            SET tier = ?,
                subscription_status = ?,
                stripe_customer_id = ?,
                stripe_subscription_id = ?,
                updated_at = datetime('now')
            WHERE email = ?
          `)
          .bind('pro', 'active', customerId, subscriptionId, customerEmail)
          .run();

        // Send upgrade email with existing license key
        await this.auth.sendLicenseKeyEmail(customerEmail, user.license_key, 'pro');

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

          if (!existing) break;
          attempts++;
        }

        const userId = generateUUID();
        await this.db
          .prepare(`
            INSERT INTO users (id, license_key, email, tier, stripe_customer_id, stripe_subscription_id, subscription_status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(userId, licenseKey, customerEmail, 'pro', customerId, subscriptionId, 'active')
          .run();

        // Send welcome email with license key
        await this.auth.sendLicenseKeyEmail(customerEmail, licenseKey, 'pro');
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
          .prepare('UPDATE users SET subscription_status = ?, tier = ? WHERE email = ?')
          .bind('active', 'pro', customerEmail)
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
          .prepare('UPDATE users SET subscription_status = ? WHERE email = ?')
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
        .prepare('UPDATE users SET tier = ?, subscription_status = ? WHERE stripe_subscription_id = ?')
        .bind('free', 'cancelled', subscriptionId)
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

      const newTier = status === 'active' ? 'pro' : 'free';
      const subscriptionStatus = status === 'active' ? 'active' : 'inactive';

      await this.db
        .prepare('UPDATE users SET tier = ?, subscription_status = ? WHERE stripe_subscription_id = ?')
        .bind(newTier, subscriptionStatus, subscriptionId)
        .run();
    } catch (error) {
      console.error('Subscription update handler error:', error);
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
          tier: 'free',
          name: 'Free',
          price: 0,
          dailyLimit: parseInt(this.env.FREE_TIER_DAILY_LIMIT || '10'),
          features: []
        },
        {
          tier: 'pro',
          name: 'Pro',
          price: 9.99,
          dailyLimit: null,
          rateLimit: '60 per minute',
          features: ['Unlimited requests', 'GPT-5 Nano', '60 requests/minute'],
          recommended: true
        }
      ]
    });
  }

  /**
   * Create Stripe customer
   */
  async createStripeCustomer(email) {
    const response = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        email: email
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create Stripe customer');
    }

    return await response.json();
  }

  /**
   * Create Stripe checkout session
   */
  async createStripeCheckout(customerId, priceId, email) {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        customer: customerId,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        mode: 'subscription',
        success_url: `${this.env.EXTENSION_URL || 'https://your-extension-url.com'}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.env.EXTENSION_URL || 'https://your-extension-url.com'}/popup.html`,
        customer_email: email
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    return await response.json();
  }

  /**
   * Create billing portal session
   */
  async createBillingPortal(customerId) {
    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: `${this.env.EXTENSION_URL || 'https://your-extension-url.com'}/popup.html`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    return await response.json();
  }
}
