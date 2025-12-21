# CaptureAI License Key System - Complete Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Cloudflare Workers Deployment](#cloudflare-workers-deployment)
3. [D1 Database Setup](#d1-database-setup)
4. [SendGrid Email Configuration](#sendgrid-email-configuration)
5. [Stripe Integration Setup](#stripe-integration-setup)
6. [Stripe Webhook Configuration](#stripe-webhook-configuration)
7. [Environment Variables](#environment-variables)
8. [Testing the System](#testing-the-system)
9. [Production Checklist](#production-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- A Cloudflare account (free tier works)
- A Stripe account
- A SendGrid account (free tier works)
- Wrangler CLI installed: `npm install -g wrangler`
- Your Chrome extension ready to deploy

---

## Cloudflare Workers Deployment

### Step 1: Login to Cloudflare

```bash
cd cloudflare-workers-backend
wrangler login
```

This will open a browser window asking you to authorize Wrangler.

### Step 2: Create the Worker

```bash
wrangler deploy
```

This creates your Worker and gives you a URL like:
```
https://captureai-backend.your-username.workers.dev
```

**Important**: Save this URL - you'll need it for your Chrome extension.

### Step 3: Verify Deployment

Visit your Worker URL in a browser. You should see:
```json
{"status":"CaptureAI License Key Backend is running","version":"1.0.0"}
```

---

## D1 Database Setup

### Step 1: Create D1 Database

```bash
wrangler d1 create captureai-db
```

Copy the database ID and binding from the output.

### Step 2: Update wrangler.toml

Add the D1 binding to `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "captureai-db"
database_id = "YOUR-DATABASE-ID-HERE"  # Paste the ID from Step 1
```

### Step 3: Initialize Database Schema

Run the license key schema:

```bash
wrangler d1 execute captureai-db --file=schema-license.sql
```

You should see:
```
Successfully executed SQL
```

### Step 4: Verify Database

```bash
wrangler d1 execute captureai-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

Expected output:
```
users
usage_records
```

### Step 5: Deploy with Database

```bash
wrangler deploy
```

---

## Email Service Configuration

### Recommended: Resend (No Domain Verification Needed)

**Perfect for GitHub Pages users!** Resend doesn't require domain verification.

#### Step 1: Create Resend Account

1. Go to: https://resend.com/
2. Click **"Sign Up"**
3. Create account and verify your email

#### Step 2: Get API Key

1. Go to: https://resend.com/api-keys
2. Click **"Create API Key"**
3. Name: `CaptureAI Production`
4. Permission: **Full Access**
5. Click **"Create"**
6. **Copy the API key** (format: `re_xxxxxxxxxxxxxxxxxxxxx`)

#### Step 3: Set Environment Variable

```bash
wrangler secret put RESEND_API_KEY
# Paste your key when prompted
```

#### Step 4: (Optional) Set From Email

By default, emails come from `CaptureAI <onboarding@resend.dev>` - this works immediately!

To customize, update `wrangler.toml`:

```toml
[vars]
FROM_EMAIL = "CaptureAI <onboarding@resend.dev>"
```

#### Step 5: Test Email Sending

After deployment, test with:

```bash
curl -X POST https://your-worker-url.workers.dev/api/auth/create-free-key \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@example.com"}'
```

Check your inbox for the license key email!

**Free Tier**: 100 emails/day, 3,000 emails/month

For detailed Resend setup instructions, see: [RESEND_SETUP.md](./RESEND_SETUP.md)

---

### Alternative: SendGrid (Requires Domain Verification)

<details>
<summary>Click to expand SendGrid setup instructions</summary>

**Note**: SendGrid requires domain verification, which won't work with just GitHub Pages. Use Resend instead if you don't have a custom domain.

#### Step 1: Create SendGrid Account

1. Go to https://sendgrid.com/
2. Sign up for a free account (100 emails/day)
3. Verify your email address

#### Step 2: Create API Key

1. Log into SendGrid dashboard
2. Navigate to: **Settings** → **API Keys**
3. Click **"Create API Key"**
4. Name: `CaptureAI License Keys`
5. Permissions: **Full Access** (or at minimum: Mail Send)
6. Click **"Create & View"**
7. **IMPORTANT**: Copy the API key immediately - you won't see it again!

Format: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### Step 3: Verify Your Domain

SendGrid requires domain verification. You need a custom domain (not GitHub Pages).

1. Go to: **Settings** → **Sender Authentication**
2. Click **"Authenticate Your Domain"**
3. Enter your domain (e.g., `captureai.com`)
4. Add DNS records provided by SendGrid
5. Wait for verification (can take up to 48 hours)

#### Step 4: Set Environment Variable

```bash
wrangler secret put SENDGRID_API_KEY
# Paste your key when prompted
```

Update `wrangler.toml`:

```toml
[vars]
FROM_EMAIL = "noreply@yourdomain.com"  # Must match verified domain
```

</details>

---

## Stripe Integration Setup

### Step 1: Create Stripe Account

1. Go to https://stripe.com/
2. Sign up for an account
3. Complete business verification (required for live mode)

### Step 2: Enable Test Mode

1. In Stripe dashboard, toggle **"Test mode"** ON (top right)
2. You'll see a "TEST DATA" banner at the top

### Step 3: Create Product and Price

1. Go to: **Products** → **Add Product**
2. Fill in details:
   - **Name**: `CaptureAI Pro`
   - **Description**: `Unlimited AI-powered question solving with GPT-5 Nano`
   - **Pricing**:
     - Model: `Recurring`
     - Price: `$9.99`
     - Billing period: `Monthly`
   - **Metadata** (optional):
     - `tier`: `pro`
     - `daily_limit`: `unlimited`
3. Click **"Save product"**

### Step 4: Get Price ID

1. Click on the product you just created
2. Under **Pricing**, find your price
3. Click on the price to see details
4. Copy the **Price ID** (format: `price_xxxxxxxxxxxxxxxxxxxxx`)

**Important**: Save this Price ID - you'll need it for environment variables.

### Step 5: Get API Keys

1. Go to: **Developers** → **API keys**
2. You'll see two keys:
   - **Publishable key**: `pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Secret key**: Click **"Reveal test key"** → `sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Important**: Copy the **Secret key** - you'll need it for environment variables.

---

## Stripe Webhook Configuration

This is the most critical part for automatic license key generation!

### Step 1: Expose Local Endpoint (For Testing)

Before setting up webhooks in Stripe, test locally:

```bash
wrangler dev
```

In a new terminal, use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI
# Windows: Download from https://github.com/stripe/stripe-cli/releases
# Mac: brew install stripe/stripe-cli/stripe
# Linux: Download from releases page

# Login to Stripe CLI
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to http://localhost:8787/api/subscription/webhook
```

You'll see:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Copy this webhook secret** - you'll need it!

### Step 2: Test Webhook Locally

Trigger a test event:

```bash
stripe trigger checkout.session.completed
```

Check your local server logs - you should see the webhook being processed!

### Step 3: Deploy Your Worker

```bash
wrangler deploy
```

Get your production URL (e.g., `https://captureai-backend.your-username.workers.dev`)

### Step 4: Create Production Webhook Endpoint

1. Go to Stripe Dashboard: **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Fill in details:
   - **Endpoint URL**: `https://your-worker-url.workers.dev/api/subscription/webhook`
   - **Description**: `CaptureAI License Key Generation`
4. Click **"Select events"**

### Step 5: Select Webhook Events

Select these events:

**Checkout Events:**
- ✅ `checkout.session.completed` - **CRITICAL** - Generates license keys!

**Invoice Events:**
- ✅ `invoice.payment_succeeded` - Handles monthly renewals
- ✅ `invoice.payment_failed` - Handles failed payments

**Subscription Events:**
- ✅ `customer.subscription.deleted` - Handles cancellations
- ✅ `customer.subscription.updated` - Handles subscription changes

### Step 6: Get Webhook Signing Secret

1. After creating the endpoint, click on it
2. Click **"Reveal"** next to **"Signing secret"**
3. Copy the secret (format: `whsec_xxxxxxxxxxxxxxxxxxxxx`)

**Important**: This is different from your API key! Save it for environment variables.

### Step 7: Test Production Webhook

1. In Stripe Dashboard, go to your webhook endpoint
2. Click **"Send test webhook"**
3. Select `checkout.session.completed`
4. Click **"Send test webhook"**
5. Check the **Response** tab - you should see `200 OK`

---

## Environment Variables

### Step 1: Set Secrets in Cloudflare

Set each secret using Wrangler:

```bash
# OpenAI API Key
wrangler secret put OPENAI_API_KEY
# Paste your key when prompted: sk-proj-xxxxx

# Stripe Secret Key
wrangler secret put STRIPE_SECRET_KEY
# Paste: sk_test_xxxxx (or sk_live_xxxxx for production)

# Stripe Webhook Secret
wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste: whsec_xxxxx

# Email Service (Choose ONE)
# Option A: Resend (Recommended - no domain verification needed)
wrangler secret put RESEND_API_KEY
# Paste: re_xxxxx

# Option B: SendGrid (Requires domain verification)
wrangler secret put SENDGRID_API_KEY
# Paste: SG.xxxxx

# Stripe Price ID for Pro Tier
wrangler secret put STRIPE_PRICE_PRO
# Paste: price_xxxxx
```

### Step 2: Set Non-Secret Environment Variables

Update `wrangler.toml`:

```toml
[vars]
# Rate Limits
FREE_TIER_DAILY_LIMIT = "10"
PRO_TIER_RATE_LIMIT = "60"  # per minute

# Email Configuration
# For Resend (no verification needed):
FROM_EMAIL = "CaptureAI <onboarding@resend.dev>"

# For SendGrid (requires verified domain):
# FROM_EMAIL = "noreply@yourdomain.com"

# Extension URL (for Stripe redirects)
EXTENSION_URL = "chrome-extension://YOUR-EXTENSION-ID"
```

### Step 3: Get Your Extension ID

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Find CaptureAI extension
4. Copy the **ID** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)
5. Update `EXTENSION_URL` in wrangler.toml:
   ```toml
   EXTENSION_URL = "chrome-extension://abcdefghijklmnopqrstuvwxyz123456"
   ```

### Step 4: Deploy with All Variables

```bash
wrangler deploy
```

---

## Testing the System

### Test 1: Health Check

```bash
curl https://your-worker-url.workers.dev/
```

Expected:
```json
{"status":"CaptureAI License Key Backend is running","version":"1.0.0"}
```

### Test 2: Create Free License Key

```bash
curl -X POST https://your-worker-url.workers.dev/api/auth/create-free-key \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Expected:
```json
{
  "licenseKey": "ABCD-EFGH-IJKL-MNOP-QRST",
  "tier": "free",
  "dailyLimit": 10
}
```

**Check your email** - you should receive the license key!

### Test 3: Validate License Key

```bash
curl -X POST https://your-worker-url.workers.dev/api/auth/validate-key \
  -H "Content-Type: application/json" \
  -d '{"licenseKey": "ABCD-EFGH-IJKL-MNOP-QRST"}'
```

Expected:
```json
{
  "valid": true,
  "tier": "free",
  "dailyLimit": 10,
  "userId": "uuid-here"
}
```

### Test 4: AI Request with License Key

```bash
curl -X POST https://your-worker-url.workers.dev/api/ai/solve \
  -H "Content-Type: application/json" \
  -H "Authorization: LicenseKey ABCD-EFGH-IJKL-MNOP-QRST" \
  -d '{
    "question": "What is 2+2?",
    "promptType": "detailed",
    "reasoningLevel": "medium"
  }'
```

Expected:
```json
{
  "answer": "4",
  "usageRemaining": 9
}
```

### Test 5: Check Usage

```bash
curl https://your-worker-url.workers.dev/api/auth/usage \
  -H "Authorization: LicenseKey ABCD-EFGH-IJKL-MNOP-QRST"
```

Expected:
```json
{
  "tier": "free",
  "dailyLimit": 10,
  "usedToday": 1,
  "remaining": 9
}
```

### Test 6: Stripe Checkout (Test Mode)

```bash
curl -X POST https://your-worker-url.workers.dev/api/subscription/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"email": "buyer@example.com"}'
```

Expected:
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxxxx",
  "sessionId": "cs_test_xxxxx"
}
```

**Open the URL** and complete checkout with test card: `4242 4242 4242 4242`

### Test 7: Verify Webhook Processed

After completing test checkout:
1. Check email for license key
2. Check Stripe Dashboard → Webhooks → Your endpoint → Events
3. Should see `checkout.session.completed` with ✅ success

---

## Production Checklist

### Before Going Live

- [ ] **Switch Stripe to Live Mode**
  - Get live API keys from Stripe Dashboard
  - Update `STRIPE_SECRET_KEY` secret: `wrangler secret put STRIPE_SECRET_KEY`
  - Create new webhook endpoint with live mode URL
  - Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

- [ ] **SendGrid Domain Authentication**
  - Complete domain authentication (not just single sender)
  - Update DNS records for your domain
  - Wait for verification

- [ ] **Environment Variables**
  - Verify all secrets are set correctly
  - Update `EXTENSION_URL` with final extension ID
  - Set appropriate rate limits

- [ ] **Database**
  - Backup D1 database: `wrangler d1 backup create captureai-db`
  - Test restore procedure

- [ ] **Security**
  - Enable webhook signature verification in `subscription-license.js` (line 72-73)
  - Review CORS settings
  - Test rate limiting

- [ ] **Monitoring**
  - Set up Cloudflare Analytics
  - Monitor Stripe webhooks
  - Set up SendGrid email analytics

- [ ] **Testing**
  - Complete end-to-end test with real payment
  - Verify license key email delivery
  - Test all API endpoints
  - Test Chrome extension with production backend

### Extension Configuration

Update your Chrome extension's backend URL:

1. Open `modules/auth-service-license.js`
2. Update line 3-4:
```javascript
const BACKEND_URL = await getBackendUrl() ||
  'https://captureai-backend.your-username.workers.dev';
```

3. Or set in extension storage:
```javascript
chrome.storage.local.set({
  backendUrl: 'https://your-worker-url.workers.dev'
});
```

---

## Troubleshooting

### Issue: Emails Not Sending

**Symptoms**: Free key creation succeeds but no email received

**Solutions**:

**For Resend:**
1. Check API key is set: `wrangler secret list`
2. Check spam folder
3. Check Resend dashboard: https://resend.com/emails
   - View all sent emails
   - Check delivery status
   - See error messages
4. Verify FROM_EMAIL is set correctly in `wrangler.toml`

**For SendGrid:**
1. Check SendGrid API key is correct: `wrangler secret list`
2. Verify sender email in SendGrid dashboard
3. Check spam folder
4. Check SendGrid Activity dashboard for delivery errors
5. Verify FROM_EMAIL matches verified sender

### Issue: Webhook Not Triggering

**Symptoms**: Payment succeeds but no license key generated

**Solutions**:
1. Check Stripe Dashboard → Webhooks → Your endpoint → Events
2. Verify endpoint URL is correct
3. Check webhook secret is correct: `wrangler secret list`
4. Ensure events are selected (checkout.session.completed)
5. Check Worker logs: `wrangler tail`

### Issue: License Key Validation Fails

**Symptoms**: "Invalid license key" error

**Solutions**:
1. Verify database is initialized: `wrangler d1 execute captureai-db --command="SELECT COUNT(*) FROM users"`
2. Check license key format (20 chars with hyphens)
3. Verify key exists in database
4. Check backend URL in extension

### Issue: Rate Limiting Not Working

**Symptoms**: Exceeding daily limits

**Solutions**:
1. Check `usage_records` table
2. Verify timezone handling in rate limiter
3. Check `FREE_TIER_DAILY_LIMIT` environment variable
4. Review rate limiter code in `auth-license.js`

### Issue: Stripe Checkout Redirect Fails

**Symptoms**: After payment, redirect doesn't work

**Solutions**:
1. Update `EXTENSION_URL` with correct extension ID
2. Ensure `payment-success.html` is in web_accessible_resources
3. Check extension manifest permissions
4. Test with `chrome-extension://EXTENSION-ID/payment-success.html`

### View Worker Logs

```bash
wrangler tail
```

This shows real-time logs from your Worker - extremely helpful for debugging!

---

## Support

- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Stripe API**: https://stripe.com/docs/api
- **SendGrid API**: https://docs.sendgrid.com/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/

---

## Summary

You now have a complete license key system with:
- ✅ Automatic license key generation on purchase
- ✅ Email delivery via SendGrid
- ✅ Stripe integration with webhooks
- ✅ Rate limiting (10/day free, 60/min pro)
- ✅ Chrome extension integration
- ✅ Production-ready backend on Cloudflare Workers

**Next Steps:**
1. Complete production checklist
2. Deploy extension to Chrome Web Store
3. Monitor analytics and usage
4. Scale as needed!
