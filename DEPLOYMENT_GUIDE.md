# CaptureAI Deployment Guide

This guide walks you through deploying the Cloudflare Workers backend and updating the Chrome extension to use it.

## Overview

The backend integration is now complete! Here's what has been implemented:

### ✅ Backend Features
- **Authentication**: JWT-based user authentication with 30-day token expiry
- **Subscription Management**: Stripe integration with Free and Pro tiers
- **AI Gateway**: Routes all AI requests through Cloudflare AI Gateway with caching
- **Rate Limiting**:
  - Free tier: 10 requests per day
  - Pro tier: 60 requests per minute (unlimited daily)
- **Database**: D1 SQLite database for users, subscriptions, and usage tracking

### ✅ Extension Integration
- **Migration System**: Automatically migrates from API key to backend authentication
- **Authentication UI**: Login/Register forms in the popup
- **Usage Stats**: Real-time usage statistics display
- **Subscription Flow**: Stripe checkout integration for upgrades

---

## Step 1: Deploy Cloudflare Workers Backend

### Prerequisites
- Cloudflare account (free tier works)
- Node.js and npm installed
- Stripe account for payment processing

### 1.1 Install Wrangler CLI

```bash
npm install -g wrangler
```

### 1.2 Login to Cloudflare

```bash
wrangler login
```

This will open a browser window to authorize Wrangler.

### 1.3 Create D1 Database

```bash
cd cloudflare-workers-backend
wrangler d1 create captureai-db
```

**Important**: Copy the `database_id` from the output and update it in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "database"
database_name = "database"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace with the ID from wrangler d1 create
```

### 1.4 Initialize Database Schema

```bash
wrangler d1 execute database --file=schema.sql
```

### 1.5 Set Environment Secrets

Set all required secrets:

```bash
# JWT secret (generate a random string)
wrangler secret put JWT_SECRET
# When prompted, enter a long random string (e.g., 64 characters)

# OpenAI API key
wrangler secret put OPENAI_API_KEY
# When prompted, enter your OpenAI API key

# Stripe secrets
wrangler secret put STRIPE_SECRET_KEY
# Enter your Stripe secret key (sk_...)

wrangler secret put STRIPE_WEBHOOK_SECRET
# Enter your Stripe webhook secret (whsec_...)

wrangler secret put STRIPE_PRICE_PRO
# Enter your Stripe Pro tier price ID (price_...)
```

### 1.6 Deploy the Worker

```bash
wrangler deploy
```

After deployment, you'll see output like:

```
Published backend (1.23 sec)
  https://backend.your-subdomain.workers.dev
```

**Copy this URL** - you'll need it in Step 2.

---

## Step 2: Configure Stripe Webhooks

### 2.1 Create Webhook Endpoint

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your Worker URL + `/api/subscription/webhook`:
   ```
   https://backend.your-subdomain.workers.dev/api/subscription/webhook
   ```

4. Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`

5. Click "Add endpoint"

### 2.2 Get Webhook Secret

After creating the webhook:
1. Click on your webhook endpoint
2. Click "Reveal" under "Signing secret"
3. Copy the secret (starts with `whsec_...`)
4. Update the secret in Cloudflare:
   ```bash
   wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

---

## Step 3: Create Stripe Product and Price

### 3.1 Create Product

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click "Add product"
3. Name: "CaptureAI Pro"
4. Description: "Unlimited AI-powered question solving"
5. Pricing model: "Recurring"
6. Price: $9.99 / month
7. Click "Save product"

### 3.2 Copy Price ID

After creating the product:
1. Find the Price ID (starts with `price_...`)
2. Update the secret in Cloudflare:
   ```bash
   wrangler secret put STRIPE_PRICE_PRO
   ```

---

## Step 4: Update Extension Configuration

### 4.1 Update Backend URL

1. Open `modules/auth-service.js`
2. Find line 14:
   ```javascript
   DEFAULT_BACKEND_URL: 'https://backend.YOUR-SUBDOMAIN.workers.dev',
   ```
3. Replace with your actual Worker URL from Step 1.6

4. Open `modules/migration.js`
5. Find line 46:
   ```javascript
   'captureai-backend-url': 'https://backend.YOUR-SUBDOMAIN.workers.dev'
   ```
6. Replace with your actual Worker URL

### 4.2 Update Payment Success URL

1. Open `cloudflare-workers-backend/src/subscription.js`
2. Find lines 275-276:
   ```javascript
   success_url: 'https://your-extension-url.com/success',
   cancel_url: 'https://your-extension-url.com/cancel',
   ```
3. Replace with your extension's payment success page URL. For Chrome extensions, this will be:
   ```javascript
   success_url: 'chrome-extension://YOUR-EXTENSION-ID/payment-success.html',
   cancel_url: 'chrome-extension://YOUR-EXTENSION-ID/popup.html',
   ```
   **Note**: You'll get the extension ID after loading the extension (Step 5)

4. Also update line 301:
   ```javascript
   return_url: 'chrome-extension://YOUR-EXTENSION-ID/popup.html'
   ```

5. Redeploy the Worker:
   ```bash
   wrangler deploy
   ```

---

## Step 5: Load Extension in Chrome

### 5.1 Build Extension (if needed)

If you have a build step:
```bash
npm install
npm run build
```

### 5.2 Load Extension

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the extension directory
6. **Copy the Extension ID** shown on the extension card

### 5.3 Update Extension ID in Backend

1. Go back to `cloudflare-workers-backend/src/subscription.js`
2. Replace `YOUR-EXTENSION-ID` with the actual ID from Step 5.2
3. Redeploy:
   ```bash
   wrangler deploy
   ```

---

## Step 6: Test the Integration

### 6.1 Test Registration

1. Click the CaptureAI extension icon
2. Click "Register"
3. Enter an email and password
4. Should see "Account created successfully!"
5. Should be logged in and see "FREE" tier badge

### 6.2 Test AI Request

1. Go to any website
2. Use Ctrl+Shift+X to start capture
3. Select an area
4. Should see AI response (uses 1 of your 10 free daily requests)
5. Check usage stats in popup

### 6.3 Test Subscription Upgrade

1. Click "Upgrade to Pro" in the popup
2. Should open Stripe checkout
3. Use test card: `4242 4242 4242 4242`
4. Complete payment
5. Should redirect to payment success page
6. Refresh extension - should now see "PRO" tier badge
7. Usage stats should show per-minute limits instead of daily

### 6.4 Test Webhook (Payment)

After successful payment:
1. Check Stripe Dashboard → Webhooks → Events
2. Should see `checkout.session.completed` event
3. Should show successful delivery to your Worker
4. User tier in database should be updated to "pro"

---

## Step 7: Production Checklist

Before going live:

- [ ] Update `cloudflare-workers-backend/wrangler.toml`:
  - [ ] Set your actual `account_id`
  - [ ] Update `CLOUDFLARE_GATEWAY_NAME` if using custom gateway

- [ ] Environment Variables:
  - [ ] `JWT_SECRET` - Strong random string (64+ chars)
  - [ ] `OPENAI_API_KEY` - Valid OpenAI API key with credits
  - [ ] `STRIPE_SECRET_KEY` - Production Stripe secret key
  - [ ] `STRIPE_WEBHOOK_SECRET` - Production webhook secret
  - [ ] `STRIPE_PRICE_PRO` - Production price ID

- [ ] Extension:
  - [ ] Update all URLs to use production Worker URL
  - [ ] Update extension ID in backend
  - [ ] Test thoroughly before publishing

- [ ] Database:
  - [ ] Schema deployed to production database
  - [ ] Backups configured (Cloudflare handles this)

- [ ] Stripe:
  - [ ] Switch to live mode
  - [ ] Update webhook endpoint to production Worker
  - [ ] Test live payment with real card

---

## Common Issues & Solutions

### Issue: "Authentication service not available"
**Solution**: Make sure `modules/auth-service.js` and `modules/migration.js` are in the `web_accessible_resources` in `manifest.json` (already done).

### Issue: "Failed to load usage stats"
**Solution**: Check that your Worker is deployed and the URL in `auth-service.js` is correct. Open DevTools Console for detailed errors.

### Issue: Stripe webhook not firing
**Solution**:
1. Check Stripe Dashboard → Webhooks for delivery status
2. Verify webhook URL is correct
3. Check Worker logs: `wrangler tail`

### Issue: Payment successful but tier not updated
**Solution**:
1. Check Stripe webhook events
2. Check Worker logs for webhook processing
3. Verify `STRIPE_WEBHOOK_SECRET` is correct
4. Check database for user tier update

### Issue: CORS errors
**Solution**: The Worker is configured to allow all origins (`Access-Control-Allow-Origin: *`). If issues persist, check browser console for specific CORS errors.

---

## Monitoring & Debugging

### View Worker Logs

```bash
wrangler tail
```

This shows real-time logs from your Worker.

### Check Database

```bash
wrangler d1 execute database --command="SELECT * FROM users"
wrangler d1 execute database --command="SELECT * FROM usage_records ORDER BY created_at DESC LIMIT 10"
```

### Test Backend Endpoints

```bash
# Health check
curl https://backend.your-subdomain.workers.dev/health

# Get available plans
curl https://backend.your-subdomain.workers.dev/api/subscription/plans
```

---

## Support

If you encounter issues:

1. Check Worker logs: `wrangler tail`
2. Check browser DevTools Console
3. Check Stripe Dashboard for webhook delivery
4. Review database records with `wrangler d1 execute`

For Cloudflare Workers issues: https://developers.cloudflare.com/workers/
For Stripe issues: https://stripe.com/docs

---

## Next Steps

- **Custom Domain**: Configure a custom domain for your Worker (optional)
- **Analytics**: Add Cloudflare Web Analytics to track usage
- **Email Notifications**: Add email service for subscription updates
- **Admin Dashboard**: Build a dashboard to manage users and subscriptions
- **More Tiers**: Add additional subscription tiers (e.g., Team plan)

Congratulations! Your CaptureAI backend is now fully deployed and integrated! 🎉
