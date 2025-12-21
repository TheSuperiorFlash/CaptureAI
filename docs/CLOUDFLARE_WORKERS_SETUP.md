# Cloudflare Workers Setup Guide - Complete Walkthrough

## Why Cloudflare Workers? 🚀

**Better than traditional backend in every way:**

| Feature | Node.js Server | Cloudflare Workers |
|---------|---------------|-------------------|
| **Cost** | $5-20/month | $0-5/month (100K free/day) |
| **Setup Time** | 1-2 hours | 10 minutes |
| **Scaling** | Manual | Automatic |
| **Speed** | Single region | Global edge network |
| **Maintenance** | You manage it | Cloudflare manages it |
| **Cold Starts** | 1-5 seconds | 0ms (always hot) |
| **SSL/HTTPS** | Configure yourself | Built-in |

---

## 📋 Prerequisites

1. ✅ Cloudflare account (https://dash.cloudflare.com/sign-up)
2. ✅ OpenAI API key
3. ✅ Stripe account (for payments)
4. ✅ Node.js installed (v16+)

**Time Required:** 30-45 minutes total

---

## Part 1: Install Wrangler CLI (5 minutes)

### Step 1.1: Install Wrangler
```bash
npm install -g wrangler
```

### Step 1.2: Login to Cloudflare
```bash
wrangler login
```

This opens a browser window. Click "Allow" to authorize.

### Step 1.3: Verify Installation
```bash
wrangler whoami
```

You should see your Cloudflare email.

---

## Part 2: Set Up AI Gateway (5 minutes)

### Step 2.1: Create AI Gateway
1. Go to https://dash.cloudflare.com
2. Click **AI** → **AI Gateway** in sidebar
3. Click **Create Gateway**
4. Name: `captureai-gateway`
5. Click **Create**

### Step 2.2: Get Your Account ID
1. Still in Cloudflare dashboard
2. Look at the right sidebar
3. Copy your **Account ID** (looks like: abc123def456)
4. **SAVE THIS:**
   ```
   Account ID: ________________
   ```

---

## Part 3: Create D1 Database (5 minutes)

### Step 3.1: Navigate to Backend Folder
```bash
cd cloudflare-workers-backend
npm install
```

### Step 3.2: Create D1 Database
```bash
wrangler d1 create captureai-db
```

You'll see output like:
```
✅ Successfully created DB 'captureai-db'!

Add the following to your wrangler.toml:

[[d1_databases]]
binding = "DB"
database_name = "captureai-db"
database_id = "abc-123-def-456"
```

### Step 3.3: Copy Database ID
Copy the `database_id` from the output above.

**SAVE THIS:**
```
Database ID: ________________
```

### Step 3.4: Update wrangler.toml
Open `wrangler.toml` and update:

```toml
account_id = "YOUR_ACCOUNT_ID_HERE"  # From Part 2

[[d1_databases]]
binding = "DB"
database_name = "captureai-db"
database_id = "YOUR_DATABASE_ID_HERE"  # Paste here
```

### Step 3.5: Create Tables
```bash
wrangler d1 execute captureai-db --file=./schema.sql
```

You should see: `✅ Successfully executed SQL`

### Step 3.6: Verify Tables Created
```bash
wrangler d1 execute captureai-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

You should see: `users`, `usage_records`, `subscriptions`

---

## Part 4: Set Secrets (5 minutes)

Cloudflare Workers uses "secrets" for sensitive data (API keys, etc.)

### Step 4.1: Set JWT Secret
First, generate a random secret:
```bash
# Windows (PowerShell)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Mac/Linux
openssl rand -hex 32
```

Copy the output, then:
```bash
wrangler secret put JWT_SECRET
# Paste the secret when prompted
```

### Step 4.2: Set OpenAI API Key
```bash
wrangler secret put OPENAI_API_KEY
# Paste your OpenAI key (sk-proj-...)
```

### Step 4.3: Set Stripe Keys
```bash
wrangler secret put STRIPE_SECRET_KEY
# Paste your Stripe secret key (sk_test_... or sk_live_...)

wrangler secret put STRIPE_WEBHOOK_SECRET
# We'll get this after creating the webhook
```

### Step 4.4: Set Stripe Price IDs

First, create your Stripe products (if you haven't):

1. Go to https://dashboard.stripe.com/products
2. Create **Basic** product ($4.99/month) → Copy Price ID
3. Create **Pro** product ($9.99/month) → Copy Price ID

Then:
```bash
wrangler secret put STRIPE_PRICE_BASIC
# Paste price_xxxxx for Basic

wrangler secret put STRIPE_PRICE_PRO
# Paste price_xxxxx for Pro
```

---

## Part 5: Update Configuration (2 minutes)

### Step 5.1: Update wrangler.toml

Open `wrangler.toml` and verify these settings:

```toml
name = "captureai-backend"
account_id = "YOUR_ACCOUNT_ID"  # From Part 2

[vars]
CLOUDFLARE_GATEWAY_NAME = "captureai-gateway"
FREE_TIER_DAILY_LIMIT = "20"
BASIC_TIER_DAILY_LIMIT = "100"
PRO_TIER_DAILY_LIMIT = "500"

[[d1_databases]]
binding = "DB"
database_name = "captureai-db"
database_id = "YOUR_DATABASE_ID"  # From Part 3
```

---

## Part 6: Deploy! (2 minutes)

### Step 6.1: Test Locally First
```bash
wrangler dev
```

This starts a local server at `http://localhost:8787`

Test it:
```bash
curl http://localhost:8787/health
```

You should see:
```json
{
  "status": "ok",
  "service": "CaptureAI Workers Backend"
}
```

Press Ctrl+C to stop.

### Step 6.2: Deploy to Production
```bash
wrangler deploy
```

You'll see:
```
✨ Build completed successfully!
✨ Successfully deployed to Cloudflare!

Your worker is available at:
https://captureai-backend.YOUR-SUBDOMAIN.workers.dev
```

**SAVE YOUR WORKER URL:**
```
Worker URL: ________________
```

### Step 6.3: Test Production
```bash
curl https://captureai-backend.YOUR-SUBDOMAIN.workers.dev/health
```

Should return the same health check response.

---

## Part 7: Set Up Stripe Webhook (5 minutes)

### Step 7.1: Create Webhook in Stripe
1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://captureai-backend.YOUR-SUBDOMAIN.workers.dev/api/subscription/webhook`
4. Description: `CaptureAI subscription events`
5. Events to send:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
6. Click **Add endpoint**

### Step 7.2: Get Webhook Secret
1. Click on your newly created webhook
2. Click **Reveal** next to "Signing secret"
3. Copy the secret (starts with `whsec_`)

### Step 7.3: Add Secret to Workers
```bash
wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste the whsec_... secret
```

---

## Part 8: Test Everything (5 minutes)

### Test 1: Register User
```bash
curl -X POST https://your-worker-url.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

Expected: Token and user object returned
**SAVE THE TOKEN:**
```
Test Token: ________________
```

### Test 2: Login
```bash
curl -X POST https://your-worker-url.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

Expected: Same token and user

### Test 3: AI Request
```bash
curl -X POST https://your-worker-url.workers.dev/api/ai/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"question":"What is 2+2?","promptType":"ask","reasoningLevel":1}'
```

Expected: AI response with answer

### Test 4: Check Usage
```bash
curl https://your-worker-url.workers.dev/api/ai/usage \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected: Usage stats showing 1 request used

### Test 5: Rate Limiting
Make 21 requests quickly (free tier = 20/day). The 21st should return:
```json
{
  "error": "Daily limit reached",
  "limit": 20,
  "used": 20
}
```

---

## Part 9: Update Extension (5 minutes)

### Step 9.1: Update Backend URL in Extension

Open your extension's `modules/auth-service.js` and update:

```javascript
async getBackendUrl() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const result = await chrome.storage.local.get('captureai-backend-url');
    // Change this line:
    return result['captureai-backend-url'] || 'https://captureai-backend.YOUR-SUBDOMAIN.workers.dev';
  }
  return 'https://captureai-backend.YOUR-SUBDOMAIN.workers.dev';
}
```

### Step 9.2: Reload Extension
1. Go to `chrome://extensions/`
2. Click reload icon on your extension
3. Open extension popup
4. Register a new account
5. Make a test capture
6. Check that it works!

---

## Part 10: Monitor & Maintain (Ongoing)

### View Logs
```bash
wrangler tail
```

This shows real-time logs from your Worker.

### View Analytics
1. Go to https://dash.cloudflare.com
2. Click **Workers & Pages**
3. Click **captureai-backend**
4. See requests, errors, CPU time, etc.

### View Database
```bash
# List all users
wrangler d1 execute captureai-db --command="SELECT * FROM users"

# Check usage
wrangler d1 execute captureai-db --command="SELECT COUNT(*) as total FROM usage_records"
```

### Update Worker
After making code changes:
```bash
wrangler deploy
```

Deploys instantly with zero downtime!

---

## Cost Breakdown (Workers vs Traditional)

### Cloudflare Workers - 1,000 active users

**Workers Requests:**
- 1,000 users × 50 requests/month = 50,000 requests
- Free tier: 100,000 requests/day
- **Cost: $0** ✅

**D1 Database:**
- Storage: ~100MB
- Reads: ~150,000/month
- Free tier: 5GB storage, 5M reads/day
- **Cost: $0** ✅

**AI Gateway:**
- Built into Workers, no extra cost
- **Cost: $0** ✅

**Total: $0/month** (within free tiers!)

### Traditional Backend - Same Scale

- Server hosting (Railway/Render): $5-20/month
- Database (Supabase paid): $25/month
- SSL certificate: $0 (Let's Encrypt)
- **Total: $30-45/month** ❌

**Savings: $360-540/year with Workers!**

---

## Troubleshooting

### "Account ID not found"
- Make sure you set `account_id` in `wrangler.toml`
- Get it from Cloudflare dashboard (right sidebar)

### "Database not found"
- Run `wrangler d1 create captureai-db` first
- Update `database_id` in `wrangler.toml`

### "OpenAI API error"
- Verify secret: `wrangler secret list`
- Re-set it: `wrangler secret put OPENAI_API_KEY`

### "Stripe webhook fails"
- Check webhook URL is correct
- Check signing secret matches
- View logs: `wrangler tail`

### "CORS errors"
- CORS is built-in to the Worker
- Check browser console for actual error

---

## Advanced Features

### Custom Domain
1. Add domain to Cloudflare
2. In `wrangler.toml`, add:
   ```toml
   routes = [
     { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
   ]
   ```
3. Deploy: `wrangler deploy`

### Multiple Environments
```bash
# Deploy to staging
wrangler deploy --env dev

# Deploy to production
wrangler deploy --env production
```

### Scheduled Tasks (Cron)
Add to `wrangler.toml`:
```toml
[triggers]
crons = ["0 0 * * *"]  # Run daily at midnight
```

Then in code:
```javascript
export default {
  async scheduled(event, env, ctx) {
    // Clean up old usage records
  }
}
```

---

## Security Checklist

- ✅ All secrets stored in Wrangler secrets (not code)
- ✅ Passwords hashed with PBKDF2
- ✅ JWT tokens expire after 30 days
- ✅ HTTPS enforced automatically
- ✅ CORS restricted to extension
- ✅ Rate limiting per user
- ✅ SQL injection protected (prepared statements)

---

## Next Steps

1. ✅ **Deploy Worker** - Done!
2. ✅ **Update Extension** - Done!
3. 📝 **Create Privacy Policy** - Required for Chrome Web Store
4. 📝 **Create Terms of Service** - Required for payments
5. 🚀 **Publish Extension** - Submit to Chrome Web Store
6. 📊 **Set Up Monitoring** - Track errors and usage
7. 💰 **Launch!** - Start accepting payments

---

## Support

**Cloudflare Workers Docs:**
- https://developers.cloudflare.com/workers/

**Wrangler CLI Docs:**
- https://developers.cloudflare.com/workers/wrangler/

**D1 Database Docs:**
- https://developers.cloudflare.com/d1/

**Need Help?**
- Check logs: `wrangler tail`
- Check status: https://www.cloudflarestatus.com/
- Community: https://discord.gg/cloudflaredev

---

## Summary

You now have:

✅ **Serverless backend** - Runs globally on Cloudflare's edge
✅ **D1 database** - SQLite at the edge
✅ **AI Gateway** - Built-in caching and monitoring
✅ **Stripe integration** - Subscription payments
✅ **$0 cost** - For up to 100K requests/day
✅ **Zero maintenance** - Cloudflare handles everything
✅ **Instant deploys** - `wrangler deploy` takes 10 seconds
✅ **Global distribution** - Fast everywhere

**You're done! 🎉**

Your extension now has a production-ready, globally distributed backend that costs nothing and scales automatically!
