# Cloudflare Workers - Ultra Quick Start

## 🚀 Get Running in 10 Commands

```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Navigate to project
cd cloudflare-workers-backend

# 4. Install dependencies
npm install

# 5. Create D1 database
wrangler d1 create captureai-db
# Copy the database_id from output

# 6. Update wrangler.toml
# Edit wrangler.toml:
# - Set account_id (get from dashboard)
# - Set database_id (from step 5)

# 7. Create database tables
wrangler d1 execute captureai-db --file=./schema.sql

# 8. Set secrets
wrangler secret put JWT_SECRET        # Generate with: openssl rand -hex 32
wrangler secret put OPENAI_API_KEY    # Your OpenAI key
wrangler secret put STRIPE_SECRET_KEY # Your Stripe key

# 9. Deploy!
wrangler deploy

# 10. Test
curl https://YOUR-WORKER.workers.dev/health
```

## ✅ Success!

Your backend is live at: `https://captureai-backend.captureai.workers.dev`

## 📝 What to Do Next

1. **Set up Stripe webhook:**
   - Go to https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://YOUR-WORKER.workers.dev/api/subscription/webhook`
   - Copy signing secret
   - Run: `wrangler secret put STRIPE_WEBHOOK_SECRET`

2. **Create Stripe products:**
   - Basic: $4.99/month → Copy price ID → `wrangler secret put STRIPE_PRICE_BASIC`
   - Pro: $9.99/month → Copy price ID → `wrangler secret put STRIPE_PRICE_PRO`

3. **Update your extension:**
   - In `modules/auth-service.js`, change backend URL to your Worker URL
   - Reload extension
   - Test!

## 🔍 Helpful Commands

```bash
# View real-time logs
wrangler tail

# Test locally
wrangler dev

# View database
wrangler d1 execute captureai-db --command="SELECT * FROM users"

# List secrets
wrangler secret list

# Update code and redeploy
wrangler deploy
```

## 💰 Cost

**Free tier:**
- 100,000 requests/day
- 10GB outbound/day
- 5GB D1 storage
- 5M D1 reads/day

**After free tier:**
- $0.50 per million requests
- $0.75 per million D1 reads

**For 1,000 users making 50 req/month = FREE!** ✅

## 📚 Full Documentation

See `../docs/CLOUDFLARE_WORKERS_SETUP.md` for detailed guide.

## 🆘 Troubleshooting

**"Account ID not found"**
→ Set `account_id` in `wrangler.toml` (get from dashboard)

**"Database not found"**
→ Run `wrangler d1 create captureai-db` and update `database_id`

**"Invalid OpenAI key"**
→ Check secret: `wrangler secret list`
→ Reset: `wrangler secret put OPENAI_API_KEY`

**View errors:**
```bash
wrangler tail
```

---

**That's it! You're done in 10 minutes.** 🎉
