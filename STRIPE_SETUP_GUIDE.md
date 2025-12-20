# Stripe Pro Plan Setup Guide

## Implementation Complete ✅

All code changes have been implemented:

1. ✅ **Webhook Security**: Added HMAC SHA256 signature verification in `subscription.js:394-443`
2. ✅ **Checkout URLs**: Updated success/cancel URLs to GitHub Pages in `subscription.js:355-356`
3. ✅ **Upgrade Handler**: Already implemented in `popup.js:198-212` and `auth-service.js:243-260`
4. ✅ **Payment Success Branding**: Changed all gradients from purple to blue (#218aff)
5. ✅ **Environment Variable**: Added `EXTENSION_URL` to `wrangler.toml:32`

---

## Next Steps: Stripe Dashboard Configuration

### 1. Create Product & Price

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click **"+ Add product"**
3. Fill in:
   - **Name**: `CaptureAI Pro`
   - **Description**: `Pro tier subscription for CaptureAI extension`
   - **Pricing Model**: `Recurring`
   - **Price**: `$9.99 USD`
   - **Billing period**: `Monthly`
4. Click **"Save product"**
5. **Copy the Price ID** (starts with `price_`) - you'll need this for the next step

### 2. Configure Webhook Endpoint

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"+ Add endpoint"**
3. Set **Endpoint URL**: `https://backend.captureai.workers.dev/api/subscription/webhook`
4. Click **"Select events"** and choose:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Click **"Add endpoint"**
6. **Copy the Signing Secret** (starts with `whsec_`) - you'll need this for the next step

### 3. Set Cloudflare Secrets

Open terminal in the `cloudflare-workers-backend` directory and run:

```bash
cd cloudflare-workers-backend

# Set your Stripe secret key (from Stripe Dashboard → Developers → API keys)
wrangler secret put STRIPE_SECRET_KEY
# Paste: sk_live_... (or sk_test_... for testing)

# Set the webhook signing secret (from step 2 above)
wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste: whsec_...

# Set the Pro plan price ID (from step 1 above)
wrangler secret put STRIPE_PRICE_PRO
# Paste: price_...
```

### 4. Deploy Backend

```bash
cd cloudflare-workers-backend
wrangler deploy
```

---

## Testing the Flow

### Test Mode (Recommended First)

1. Use Stripe test mode keys (starts with `sk_test_`)
2. Use test webhook endpoint in Stripe dashboard
3. Test card: `4242 4242 4242 4242`, any future expiry, any CVC

### User Journey

1. **User visits**: `https://thesuperiorflash.github.io/CaptureAI/activate.html`
2. **Clicks "Get Started" on Pro tier**
3. **Redirected to Stripe Checkout**
4. **Completes payment**
5. **Stripe sends webhook** → Backend receives `checkout.session.completed`
6. **Backend creates/upgrades user** → Sets tier to 'pro', sends license key via email
7. **User redirected to**: `https://thesuperiorflash.github.io/CaptureAI/payment-success.html`
8. **Payment success page verifies** → Calls `/api/auth/me` to confirm tier is 'pro'
9. **User uses license key** → Pastes into extension popup

---

## Email Service Setup (Optional but Recommended)

To send license keys via email after payment, set up one of these:

### Option 1: Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Get API key from dashboard
3. Run: `wrangler secret put RESEND_API_KEY`
4. Backend will automatically use Resend to send emails

### Option 2: SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get API key from dashboard
3. Run: `wrangler secret put SENDGRID_API_KEY`
4. Backend will automatically use SendGrid to send emails

---

## Troubleshooting

### Webhook Not Receiving Events

- Check webhook URL is correct: `https://backend.captureai.workers.dev/api/subscription/webhook`
- Verify webhook secret is set correctly: `wrangler secret list` (should show STRIPE_WEBHOOK_SECRET)
- Check Stripe Dashboard → Webhooks for failed events

### Checkout Session Creation Fails

- Verify `STRIPE_SECRET_KEY` is set: `wrangler secret list`
- Verify `STRIPE_PRICE_PRO` is set with correct price ID
- Check backend logs: `wrangler tail`

### Payment Success Page Shows Error

- User tier not updated → Check webhook received event
- Database not updated → Check backend logs for errors
- Email service not configured → Set RESEND_API_KEY or SENDGRID_API_KEY

---

## Production Checklist

- [ ] Switch from test mode to live mode in Stripe
- [ ] Update all secrets with live keys (`sk_live_`, `whsec_` for live webhook)
- [ ] Test complete payment flow with real card
- [ ] Set up email service (Resend or SendGrid)
- [ ] Enable billing portal for customers to manage subscriptions
- [ ] Set up Stripe billing alerts

---

## Files Modified

1. `cloudflare-workers-backend/src/subscription.js` - Added webhook verification (line 67-79, 391-443)
2. `cloudflare-workers-backend/src/subscription.js` - Updated checkout URLs (line 355-356, 380)
3. `popup.js` - Upgrade handler already implemented (line 198-212)
4. `modules/auth-service.js` - Checkout session API already implemented (line 243-260)
5. `payment-success.html` - Changed to blue gradient (multiple style sections)
6. `cloudflare-workers-backend/wrangler.toml` - Added EXTENSION_URL (line 32)
