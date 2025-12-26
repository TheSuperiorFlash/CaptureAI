# Stripe Pro Plan Implementation Plan

## Current State Analysis

**Good news**: Most infrastructure already exists!

- ✅ Stripe integration code in `subscription.js`
- ✅ Webhook handlers for checkout, payments, cancellations
- ✅ Database schema supports subscriptions
- ✅ Payment success page (`payment-success.html`)
- ✅ Router has subscription endpoints
- ✅ Auth service structure ready

**What's Missing**:
1. Webhook signature verification (currently bypassed)
2. Success/cancel URLs point to wrong domain
3. `handleUpgrade()` in popup.js incomplete
4. Email service integration for Pro tier

## Implementation Plan

### 1. **Update Backend Webhook Security**
- **File**: `cloudflare-workers-api/src/subscription.js`
- Add proper Stripe webhook signature verification (line 72-74)
- Currently just parsing JSON - needs `stripe-signature` header verification

### 2. **Fix Checkout URLs**
- **File**: `cloudflare-workers-api/src/subscription.js` (line 350-351)
- Update success URL: `https://thesuperiorflash.github.io/CaptureAI/payment-success.html`
- Update cancel URL: `https://thesuperiorflash.github.io/CaptureAI/activate.html`

### 3. **Complete Upgrade Handler**
- **File**: `popup.js` (line 198)
- Implement `handleUpgrade()` to:
  - Get user email from current user
  - Call `/api/subscription/create-checkout` with email
  - Open Stripe checkout in new tab

### 4. **Update Payment Success Page**
- **File**: `payment-success.html` (line 234)
- Change gradient from purple to blue (#218aff)
- Update "Close" button to redirect to activation page

### 5. **Update Activate Page Pro Flow**
- **File**: `activate.html` (line 432-446)
- Already calls `/api/subscription/create-checkout`
- Needs backend URL update if different

### 6. **Environment Configuration**
- Backend needs:
  - `STRIPE_SECRET_KEY` (secret)
  - `STRIPE_WEBHOOK_SECRET` (secret)
  - `STRIPE_PRICE_PRO` (secret) - Price ID from Stripe dashboard
  - `EXTENSION_URL` (var) = `https://thesuperiorflash.github.io/CaptureAI`

## Stripe Setup Steps

1. **Create Stripe Product & Price**
   - Go to Stripe Dashboard → Products
   - Create "CaptureAI Pro" product
   - Set recurring price: $9.99/month
   - Copy Price ID (starts with `price_`)

2. **Configure Webhook**
   - Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://backend.captureai.workers.dev/api/subscription/webhook`
   - Select events:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.deleted`
     - `customer.subscription.updated`
   - Copy webhook signing secret (starts with `whsec_`)

3. **Set Cloudflare Secrets**
   ```bash
   cd backend
   wrangler secret put STRIPE_SECRET_KEY      # sk_live_...
   wrangler secret put STRIPE_WEBHOOK_SECRET  # whsec_...
   wrangler secret put STRIPE_PRICE_PRO       # price_...
   ```

## Testing Flow

**User Journey**:
1. User on Free tier sees "Upgrade to Pro" button in popup
2. Clicks button → Opens Stripe checkout
3. Completes payment
4. Redirected to payment-success.html on GitHub Pages
5. Backend receives webhook → Updates user tier to 'pro'
6. Success page verifies tier update
7. User can close tab and use Pro features

## Key Files to Modify

1. `cloudflare-workers-api/src/subscription.js` - Webhook security & URLs
2. `popup.js` - Complete handleUpgrade()
3. `payment-success.html` - Branding update
4. `wrangler.toml` - Add EXTENSION_URL variable

## Implementation Order

1. ✅ Backend webhook security (critical for production)
2. ✅ Update checkout URLs
3. ✅ Implement popup upgrade handler
4. ✅ Update payment success page branding
5. ✅ Test end-to-end flow with Stripe test mode
6. ✅ Deploy and configure production webhooks
