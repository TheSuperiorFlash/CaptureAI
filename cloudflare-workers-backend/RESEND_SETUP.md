# Resend Email Setup Guide

Resend is the recommended email service for CaptureAI because it **doesn't require a custom domain** - you can use their free onboarding email address.

## Why Resend?

- **No domain verification needed** - Perfect for GitHub Pages users
- **Free tier**: 100 emails/day, 3,000 emails/month
- **Simple setup**: Just need an API key
- **Great for development**: Works immediately with `onboarding@resend.dev`
- **Modern API**: Clean, simple, well-documented

---

## Quick Setup (5 minutes)

### Step 1: Create Resend Account

1. Go to: https://resend.com/
2. Click **"Sign Up"**
3. Create account with your email
4. Verify your email address

### Step 2: Get API Key

1. Log into Resend dashboard: https://resend.com/api-keys
2. Click **"Create API Key"**
3. Name: `CaptureAI Production`
4. Permission: **Full Access** (or at minimum: Sending access)
5. Click **"Create"**
6. **Copy the API key** (format: `re_xxxxxxxxxxxxxxxxxxxxxxxxxx`)

**Important**: Save this key immediately - you won't see it again!

### Step 3: Set Environment Variable

Set the Resend API key in Cloudflare:

```bash
wrangler secret put RESEND_API_KEY
# Paste your key when prompted: re_xxxxx
```

### Step 4: (Optional) Set From Email

By default, emails will come from `CaptureAI <onboarding@resend.dev>`. This works immediately without any verification!

If you want to customize the sender name, update `wrangler.toml`:

```toml
[vars]
FROM_EMAIL = "CaptureAI <onboarding@resend.dev>"
```

### Step 5: Deploy

```bash
wrangler deploy
```

### Step 6: Test It

```bash
curl -X POST https://your-worker-url.workers.dev/api/auth/create-free-key \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

**Check your inbox!** You should receive an email with your license key.

---

## Using Your Own Domain (Optional)

If you later get a custom domain, you can verify it in Resend:

### Step 1: Add Domain

1. Go to Resend Dashboard: https://resend.com/domains
2. Click **"Add Domain"**
3. Enter your domain: `captureai.com`

### Step 2: Add DNS Records

Resend will show you DNS records to add. Go to your domain provider and add:

**SPF Record** (TXT):
```
v=spf1 include:resend.com ~all
```

**DKIM Record** (TXT):
```
resend._domainkey   →   [value provided by Resend]
```

### Step 3: Wait for Verification

Verification usually takes 1-5 minutes.

### Step 4: Update From Email

Update `wrangler.toml`:

```toml
[vars]
FROM_EMAIL = "CaptureAI <noreply@captureai.com>"
```

Then redeploy:

```bash
wrangler deploy
```

---

## Email Template Customization

The email template is defined in `src/auth-license.js` in the `sendLicenseKeyEmail()` method.

To customize:

1. Edit the `htmlContent` variable (starting around line 246)
2. Update colors, text, branding
3. Redeploy: `wrangler deploy`

---

## Troubleshooting

### Issue: Emails Not Arriving

**Check:**
1. Verify API key is set correctly: `wrangler secret list`
2. Check spam folder
3. Check Resend dashboard: https://resend.com/emails
   - Shows all sent emails
   - Shows delivery status
   - Shows error messages

### Issue: "Invalid API Key"

**Solution:**
```bash
# Reset the API key
wrangler secret put RESEND_API_KEY
# Paste your key again

# Redeploy
wrangler deploy
```

### Issue: Emails Going to Spam

**Solutions:**
1. Add domain verification (see "Using Your Own Domain" above)
2. Ask users to add `onboarding@resend.dev` to contacts
3. In production, use a verified custom domain

---

## Rate Limits

**Free Tier:**
- 100 emails/day
- 3,000 emails/month
- Perfect for starting out!

**Paid Plans:**
- Start at $20/month for 50,000 emails
- See pricing: https://resend.com/pricing

---

## Resend Dashboard Features

### Email Logs
https://resend.com/emails
- View all sent emails
- Check delivery status
- See error messages
- View email content

### API Keys
https://resend.com/api-keys
- Create/delete keys
- View key permissions
- Monitor usage

### Domains
https://resend.com/domains
- Add custom domains
- View DNS records
- Check verification status

---

## Testing During Development

Use `wrangler dev` to test locally:

```bash
# Terminal 1: Start local server
wrangler dev

# Terminal 2: Test email sending
curl -X POST http://localhost:8787/api/auth/create-free-key \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Emails will be sent even in dev mode! Check Resend dashboard to see them.

---

## Switching from SendGrid

If you already set up SendGrid, the system supports both! Priority order:

1. **Resend** (if `RESEND_API_KEY` is set)
2. **SendGrid** (if `SENDGRID_API_KEY` is set)

To switch to Resend:

```bash
# Add Resend key (Resend will be used automatically)
wrangler secret put RESEND_API_KEY

# Optionally remove SendGrid (not required)
wrangler secret delete SENDGRID_API_KEY

# Deploy
wrangler deploy
```

---

## Support

- **Resend Docs**: https://resend.com/docs
- **Resend API Reference**: https://resend.com/docs/api-reference
- **Resend Support**: support@resend.com

---

## Summary

Resend is the **easiest** email solution for CaptureAI:

✅ No domain verification required
✅ Works immediately with `onboarding@resend.dev`
✅ 100 emails/day free
✅ Simple setup (just API key)
✅ Great for GitHub Pages users

**Setup Time**: 5 minutes
**Cost**: Free for up to 3,000 emails/month
