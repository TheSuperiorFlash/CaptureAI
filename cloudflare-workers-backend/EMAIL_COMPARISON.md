# Email Service Comparison: Resend vs SendGrid

Quick comparison to help you choose the right email service for CaptureAI.

---

## TL;DR (Too Long; Didn't Read)

**Use Resend** if you:
- Don't have a custom domain (using GitHub Pages)
- Want the fastest setup (5 minutes)
- Don't want to deal with DNS records

**Use SendGrid** if you:
- Already have SendGrid set up
- Have a custom domain and want branded emails
- Need more advanced features

---

## Feature Comparison

| Feature | Resend | SendGrid |
|---------|--------|----------|
| **Domain Verification** | ❌ Not required | ✅ Required |
| **Setup Time** | 5 minutes | 30-60 minutes |
| **Free Tier** | 100/day, 3,000/month | 100/day |
| **Works with GitHub Pages** | ✅ Yes | ❌ No |
| **Custom Domain Support** | ✅ Yes (optional) | ✅ Yes (required) |
| **Default From Address** | `onboarding@resend.dev` | Requires verification |
| **API Simplicity** | Very simple | More complex |
| **Email Analytics** | ✅ Yes | ✅ Yes |
| **Deliverability** | Excellent | Excellent |

---

## Resend

### Pros
✅ **No domain verification needed** - Works immediately with `onboarding@resend.dev`
✅ **Perfect for GitHub Pages** - No custom domain required
✅ **Super simple setup** - Just API key, no DNS configuration
✅ **Modern API** - Clean, well-documented
✅ **Fast setup** - 5 minutes start to finish
✅ **Great free tier** - 3,000 emails/month

### Cons
❌ Default from address is `onboarding@resend.dev` (can be customized with domain verification)
❌ Newer service (less established than SendGrid)

### Best For
- Users without custom domains
- GitHub Pages users
- Quick prototyping and testing
- Users who want simplest setup

### Setup
See: [RESEND_SETUP.md](./RESEND_SETUP.md)

```bash
# Just one command!
wrangler secret put RESEND_API_KEY
```

---

## SendGrid

### Pros
✅ **Industry standard** - Been around for years
✅ **Advanced features** - Templates, A/B testing, etc.
✅ **Extensive documentation** - Lots of tutorials and guides
✅ **Custom branding** - Full control over from address

### Cons
❌ **Requires custom domain** - Won't work with just GitHub Pages
❌ **DNS configuration required** - SPF, DKIM records
❌ **Longer setup time** - 30-60 minutes
❌ **Verification wait time** - Can take up to 48 hours
❌ **More complex API** - More configuration needed

### Best For
- Users with custom domains
- Enterprises and established businesses
- Users who need advanced email features
- Users who already use SendGrid

### Setup
See: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#alternative-sendgrid-requires-domain-verification)

---

## Setup Comparison

### Resend Setup (5 minutes)

```bash
# 1. Create account at resend.com
# 2. Get API key
# 3. Set secret
wrangler secret put RESEND_API_KEY

# 4. Deploy
wrangler deploy

# Done! Emails work immediately.
```

### SendGrid Setup (30-60 minutes)

```bash
# 1. Create account at sendgrid.com
# 2. Get API key
# 3. Verify your domain in SendGrid dashboard
# 4. Add DNS records (SPF, DKIM) to your domain provider
# 5. Wait for verification (up to 48 hours)
# 6. Set secrets
wrangler secret put SENDGRID_API_KEY

# 7. Update wrangler.toml with verified email
# 8. Deploy
wrangler deploy
```

---

## Email Examples

### Resend Email
```
From: CaptureAI <onboarding@resend.dev>
To: user@example.com
Subject: Your CaptureAI Free License Key

[Beautiful HTML email with license key]
```

### SendGrid Email (with custom domain)
```
From: CaptureAI <noreply@captureai.com>
To: user@example.com
Subject: Your CaptureAI Free License Key

[Beautiful HTML email with license key]
```

---

## Switching Between Services

The backend supports both! It checks in this order:

1. **Resend** (if `RESEND_API_KEY` is set)
2. **SendGrid** (if `SENDGRID_API_KEY` is set)

### Switch from SendGrid to Resend

```bash
wrangler secret put RESEND_API_KEY
# Resend will now be used automatically

# Optionally remove SendGrid
wrangler secret delete SENDGRID_API_KEY
```

### Switch from Resend to SendGrid

```bash
wrangler secret put SENDGRID_API_KEY
wrangler secret delete RESEND_API_KEY
# SendGrid will now be used
```

---

## Pricing

### Resend Pricing

**Free Tier:**
- 100 emails/day
- 3,000 emails/month
- Perfect for starting out

**Paid Plans:**
- $20/month - 50,000 emails
- $80/month - 100,000 emails
- See: https://resend.com/pricing

### SendGrid Pricing

**Free Tier:**
- 100 emails/day
- No monthly limit specified

**Paid Plans:**
- $19.95/month - 50,000 emails
- $89.95/month - 100,000 emails
- See: https://sendgrid.com/pricing

---

## Recommendation

### For GitHub Pages Users (No Custom Domain)

**Use Resend** - It's the only option that works without domain verification.

```bash
wrangler secret put RESEND_API_KEY
```

### For Custom Domain Users

**Still use Resend** for faster setup. You can always add domain verification later if you want branded emails.

### Already Using SendGrid?

Keep using it! The code supports both, so no need to switch unless you want simpler setup.

---

## Support Links

**Resend:**
- Dashboard: https://resend.com/
- Docs: https://resend.com/docs
- API Reference: https://resend.com/docs/api-reference
- Support: support@resend.com

**SendGrid:**
- Dashboard: https://sendgrid.com/
- Docs: https://docs.sendgrid.com/
- API Reference: https://docs.sendgrid.com/api-reference
- Support: https://support.sendgrid.com/

---

## Summary

| Criteria | Winner |
|----------|--------|
| **Fastest Setup** | 🏆 Resend |
| **No Domain Needed** | 🏆 Resend |
| **GitHub Pages Compatible** | 🏆 Resend |
| **Custom Branding** | 🏆 SendGrid |
| **Advanced Features** | 🏆 SendGrid |
| **Free Tier** | 🏆 Resend (more emails) |
| **Overall for CaptureAI** | 🏆 **Resend** |

**Resend is recommended** for most CaptureAI users, especially those using GitHub Pages.
