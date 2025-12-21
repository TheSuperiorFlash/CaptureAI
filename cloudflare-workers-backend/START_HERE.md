# CaptureAI Backend - Start Here

**Welcome!** This guide will get your CaptureAI backend deployed in under 30 minutes.

## What You're Building

A complete serverless backend with:
- 🔑 **License key authentication** (no passwords!)
- 📧 **Automatic email delivery** of license keys
- 💳 **Stripe payment integration**
- 🤖 **AI-powered question solving**
- 📊 **Usage tracking and rate limiting**

## Choose Your Path

### Path A: Quick Test (10 minutes)

Just want to test it out? Skip email and Stripe for now.

```bash
# 1. Install and login
npm install -g wrangler
wrangler login

# 2. Create database
cd cloudflare-workers-backend
wrangler d1 create captureai-db
# Copy the database_id from output

# 3. Update wrangler.toml with your database_id

# 4. Set your OpenAI key
wrangler secret put OPENAI_API_KEY

# 5. Deploy
wrangler deploy
```

**Done!** You can now use the `/api/auth/create-free-key` endpoint to generate license keys (without email).

---

### Path B: Full Production Setup (30 minutes)

Ready to go live with payments and emails?

#### Step 1: Email Setup (5 minutes)

**Use Resend** (recommended - no domain needed!)

See: [RESEND_SETUP.md](./RESEND_SETUP.md)

```bash
# Get API key from resend.com
wrangler secret put RESEND_API_KEY
```

#### Step 2: Stripe Setup (15 minutes)

See: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#stripe-integration-setup)

```bash
# Create product and get keys from stripe.com
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_PRICE_PRO
wrangler secret put STRIPE_WEBHOOK_SECRET
```

#### Step 3: Database Setup (5 minutes)

```bash
wrangler d1 create captureai-db
wrangler d1 execute captureai-db --file=schema-license.sql
```

#### Step 4: Deploy (1 minute)

```bash
wrangler deploy
```

**Done!** Your backend is live globally.

---

## What Each File Does

| File | Purpose |
|------|---------|
| `DEPLOYMENT_GUIDE.md` | **Complete step-by-step setup** including Stripe webhooks |
| `RESEND_SETUP.md` | **Email setup** (5 minutes, no domain needed) |
| `EMAIL_COMPARISON.md` | Resend vs SendGrid comparison |
| `QUICK_START.md` | Basic deployment instructions |
| `README.md` | Overview and cost estimates |

## Need Help?

### I don't have a custom domain

✅ **Use Resend!** It works without domain verification.
See: [RESEND_SETUP.md](./RESEND_SETUP.md)

### I want to set up Stripe payments

✅ See the detailed Stripe webhook section in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#stripe-webhook-configuration)

### I just want to test locally

✅ Use `wrangler dev` to run locally:
```bash
wrangler dev
```

### My emails aren't sending

✅ Check [RESEND_SETUP.md](./RESEND_SETUP.md#troubleshooting) for solutions

### Stripe webhook isn't working

✅ See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#troubleshooting) webhook section

## Quick Reference

### Environment Variables You Need

**Required:**
```bash
wrangler secret put OPENAI_API_KEY
```

**For email (choose one):**
```bash
wrangler secret put RESEND_API_KEY        # Recommended
wrangler secret put SENDGRID_API_KEY      # Alternative
```

**For Stripe payments:**
```bash
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_PRICE_PRO
wrangler secret put STRIPE_WEBHOOK_SECRET
```

### Test Your Backend

```bash
# Health check
curl https://your-worker.workers.dev/

# Create free license key
curl -X POST https://your-worker.workers.dev/api/auth/create-free-key \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Validate license key
curl -X POST https://your-worker.workers.dev/api/auth/validate-key \
  -H "Content-Type: application/json" \
  -d '{"licenseKey": "YOUR-KEY-HERE"}'
```

## Recommended Setup Order

For the smoothest experience:

1. **Deploy basic backend** (10 min)
   - Get it running first
   - Test with manual license keys

2. **Add email service** (5 min)
   - Set up Resend
   - Test email delivery

3. **Add Stripe** (15 min)
   - Create product
   - Set up webhooks
   - Test payment flow

This way you can test each component independently!

## Cost Breakdown

**Free tier** covers most small to medium deployments:

- Cloudflare Workers: 100,000 requests/day FREE
- D1 Database: 5M reads/day FREE
- Resend: 3,000 emails/month FREE
- Stripe: No monthly fee, just 2.9% + $0.30 per transaction

**Total monthly cost for 1,000 users:** $0-5

## Next Steps

1. **Choose your path** (Quick Test or Full Production)
2. **Follow the deployment guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
3. **Set up email**: [RESEND_SETUP.md](./RESEND_SETUP.md)
4. **Update your Chrome extension** with the backend URL

## Support

- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Resend**: https://resend.com/docs
- **Stripe**: https://stripe.com/docs

---

**Ready to deploy?** Start with [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for the complete walkthrough!
