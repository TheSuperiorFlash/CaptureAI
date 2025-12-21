/**
 * License Key Authentication Handler
 * Handles license key validation and user management
 */

import { jsonResponse, parseJSON, generateUUID } from './utils';

export class AuthHandler {
  constructor(env) {
    this.env = env;
    this.db = env.DB;
  }

  /**
   * Generate a unique license key
   * Format: XXXX-XXXX-XXXX-XXXX-XXXX
   */
  generateLicenseKey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like I, O, 0, 1
    const segments = 5;
    const segmentLength = 4;

    let key = '';
    for (let i = 0; i < segments; i++) {
      if (i > 0) key += '-';
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
      const { licenseKey } = await parseJSON(request);

      if (!licenseKey) {
        return jsonResponse({ error: 'License key required' }, 400);
      }

      // Normalize key (remove spaces, uppercase)
      const normalizedKey = licenseKey.replace(/\s+/g, '').toUpperCase();

      // Find user by license key
      const user = await this.db
        .prepare('SELECT * FROM users WHERE license_key = ?')
        .bind(normalizedKey)
        .first();

      if (!user) {
        return jsonResponse({ error: 'Invalid license key' }, 401);
      }

      // Update last validated timestamp
      await this.db
        .prepare('UPDATE users SET last_validated_at = datetime(\'now\') WHERE id = ?')
        .bind(user.id)
        .run();

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
      console.error('License validation error:', error);
      return jsonResponse({ error: 'Validation failed: ' + error.message }, 500);
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

      // Return user data in JWT-like format for compatibility
      return {
        userId: user.id,
        email: user.email,
        tier: user.tier,
        licenseKey: user.license_key
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
   * Optional: Can require email for sending the key
   */
  async createFreeKey(request) {
    try {
      const body = await parseJSON(request).catch(() => ({}));
      const { email } = body;

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
        .bind(userId, licenseKey, email || null, 'free', 'inactive')
        .run();

      // If email provided and email service configured, send the key
      if (email && (this.env.RESEND_API_KEY || this.env.SENDGRID_API_KEY)) {
        await this.sendLicenseKeyEmail(email, licenseKey, 'free');
      }

      return jsonResponse({
        message: 'Free license key created successfully',
        licenseKey: licenseKey,
        tier: 'free'
      }, 201);

    } catch (error) {
      console.error('Create free key error:', error);
      return jsonResponse({ error: 'Failed to create license key: ' + error.message }, 500);
    }
  }

  /**
   * Send license key via email
   * Supports both Resend and SendGrid
   * Resend is recommended (no domain verification needed)
   */
  async sendLicenseKeyEmail(email, licenseKey, tier) {
    try {
      // Check which email service is configured
      const resendKey = this.env.RESEND_API_KEY;
      const sendgridKey = this.env.SENDGRID_API_KEY;

      if (!resendKey && !sendgridKey) {
        console.warn('No email service configured, skipping email');
        return;
      }

      const subject = tier === 'pro'
        ? 'Your CaptureAI Pro License Key'
        : 'Your CaptureAI Free License Key';

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to CaptureAI!</h2>
          <p>Thank you for ${tier === 'pro' ? 'upgrading to' : 'trying'} CaptureAI ${tier === 'pro' ? 'Pro' : ''}!</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your License Key:</h3>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #218aff;">
              ${licenseKey}
            </p>
          </div>

          <h3>How to activate:</h3>
          <ol>
            <li>Open the CaptureAI extension</li>
            <li>Click "Enter License Key"</li>
            <li>Copy and paste your license key above</li>
            <li>Start using CaptureAI!</li>
          </ol>

          ${tier === 'pro' ? `
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h3>Pro Features:</h3>
            <ul>
              <li>Unlimited requests (60 per minute)</li>
              <li>GPT-5 Nano AI model</li>
              <li>Priority support</li>
            </ul>
          </div>
          ` : `
          <p>Free tier includes 10 requests per day. Upgrade to Pro for unlimited access!</p>
          `}

          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            Keep this email safe - you'll need your license key to use CaptureAI.
          </p>
        </div>
      `;

      // Use Resend if available (recommended)
      if (resendKey) {
        await this.sendEmailViaResend(email, subject, htmlContent);
      }
      // Fallback to SendGrid
      else if (sendgridKey) {
        await this.sendEmailViaSendGrid(email, subject, htmlContent);
      }

    } catch (error) {
      console.error('Email sending error:', error);
      // Don't throw - email is not critical
    }
  }

  /**
   * Send email via Resend (recommended - no domain verification needed)
   */
  async sendEmailViaResend(email, subject, htmlContent) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: this.env.FROM_EMAIL || 'CaptureAI <onboarding@resend.dev>',
        to: [email],
        subject: subject,
        html: htmlContent
      })
    });

    if (!response.ok) {
      console.error('Resend error:', await response.text());
    }
  }

  /**
   * Send email via SendGrid (requires domain verification)
   */
  async sendEmailViaSendGrid(email, subject, htmlContent) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: email }]
        }],
        from: {
          email: this.env.FROM_EMAIL || 'noreply@captureai.com',
          name: 'CaptureAI'
        },
        subject: subject,
        content: [{
          type: 'text/html',
          value: htmlContent
        }]
      })
    });

    if (!response.ok) {
      console.error('SendGrid error:', await response.text());
    }
  }
}
