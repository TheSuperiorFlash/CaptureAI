# CaptureAI - Cloudflare Workers Backend

**License Key System** - No passwords, just simple license keys emailed after purchase!

## Why Cloudflare Workers is Better

✅ **Serverless** - No server to manage, auto-scales
✅ **Fast** - Runs on Cloudflare's edge network (globally distributed)
✅ **Cheap** - 100,000 requests/day FREE, then $0.50 per million
✅ **Built-in AI Gateway** - Same infrastructure, no external calls
✅ **D1 Database** - Built-in SQLite database (also free tier)
✅ **Zero cold starts** - Always fast

**vs Traditional Backend:**
- Node.js server: $5-20/month + maintenance
- Cloudflare Workers: $0-5/month + zero maintenance

## Quick Start

### 1. Install Wrangler (Cloudflare CLI)
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Deploy
```bash
cd cloudflare-workers-backend
npm install
wrangler deploy
```

That's it! Your backend is live globally in ~30 seconds.

**For complete setup with Stripe, email, and database:** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## What's Included

- ✅ **License Key Authentication** - No passwords needed!
- ✅ **Automatic Email Delivery** - Keys sent via Resend/SendGrid
- ✅ **Cloudflare AI Gateway** - GPT integration
- ✅ **D1 Database** - SQLite database for users and usage
- ✅ **Stripe Integration** - Subscription payments with webhooks
- ✅ **Rate Limiting** - 10/day free, 60/min pro
- ✅ **Usage Tracking** - Per-user usage monitoring
- ✅ **CORS Handling** - Chrome extension compatible
- ✅ **Error Handling** - Comprehensive error responses

## Cost Estimate

**Cloudflare Workers (Free Tier):**
- 100,000 requests/day FREE
- 10GB requests/month FREE
- After: $0.50 per million requests

**D1 Database (Free Tier):**
- 5GB storage FREE
- 5 million reads/day FREE
- After: $0.75 per million reads

**For 1,000 users making 50 requests/month:**
- Total requests: 50,000/month
- Cost: $0 (within free tier!)

## File Structure

```
cloudflare-workers-backend/
├── src/
│   ├── index.js              # Main worker entry point
│   ├── router.js             # Route handling
│   ├── auth-license.js       # License key authentication
│   ├── ai.js                 # AI Gateway integration
│   ├── subscription-license.js # Stripe integration with license keys
│   ├── rate-limiter.js       # Rate limiting
│   └── utils.js              # Utility functions
├── schema-license.sql        # D1 database schema for license keys
├── wrangler.toml             # Cloudflare configuration
├── package.json
├── DEPLOYMENT_GUIDE.md       # Complete deployment guide
├── RESEND_SETUP.md          # Resend email setup (recommended)
├── EMAIL_COMPARISON.md      # Resend vs SendGrid comparison
└── README.md
```

## Email Service Setup

**Recommended: Resend** (no domain verification needed!)

Perfect for GitHub Pages users - see [RESEND_SETUP.md](./RESEND_SETUP.md) for 5-minute setup.

**Alternative: SendGrid** (requires custom domain)

See [EMAIL_COMPARISON.md](./EMAIL_COMPARISON.md) for comparison.

## Documentation

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete setup guide with Stripe webhooks
- **[RESEND_SETUP.md](./RESEND_SETUP.md)** - Quick email setup (recommended)
- **[EMAIL_COMPARISON.md](./EMAIL_COMPARISON.md)** - Email service comparison
- **[QUICK_START.md](./QUICK_START.md)** - Get started quickly

## Deployment URL

After deployment, you'll get a URL like:
```
https://captureai-backend.your-subdomain.workers.dev
```

Use this in your extension's `backendUrl` setting.
