# License Key System Implementation Guide

This is a **simplified alternative** to the username/password system. Instead of users creating accounts, they simply receive a license key via email after purchase.

## How It Works

### For Free Users
1. User visits your website or landing page
2. Clicks "Get Free License Key"
3. Enters their email (optional)
4. Receives a free license key instantly
5. Enters the key in the extension
6. Gets 10 requests per day

### For Pro Users
1. User clicks "Upgrade to Pro" in extension
2. Redirected to Stripe checkout
3. Enters email and payment info
4. Completes payment
5. **Receives license key via email automatically**
6. Enters the key in the extension
7. Gets unlimited requests (60/minute)

## Key Benefits

✅ **Simpler UX**: No password to remember
✅ **Email-based**: Key sent directly to inbox
✅ **Portable**: Can use on multiple devices with same key
✅ **Secure**: Keys are randomly generated and unique
✅ **Easy Recovery**: Just check your email

## Backend Changes

### 1. Updated Database Schema

The new schema (`schema-license.sql`) is much simpler:

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  license_key TEXT UNIQUE NOT NULL,       -- The license key
  email TEXT,                             -- Email (optional for free, required for pro)
  tier TEXT DEFAULT 'free',               -- 'free' or 'pro'
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  created_at TEXT,
  updated_at TEXT,
  last_validated_at TEXT
);
```

No more password hashing, JWT tokens, or complex auth!

### 2. Updated Auth Handler

`auth-license.js` provides:

- `generateLicenseKey()` - Creates keys like `AB3D-X9K2-7MNP-Q4R5-Z8WY`
- `validateKey()` - Validates a license key
- `authenticate()` - Uses `Authorization: LicenseKey YOUR-KEY` header
- `createFreeKey()` - Generates free license keys
- `sendLicenseKeyEmail()` - Sends keys via SendGrid

### 3. Updated Subscription Handler

`subscription-license.js`:

- On successful payment → Generates Pro license key → Emails to customer
- Handles subscription lifecycle (renewal, cancellation, failures)
- Automatically upgrades existing free users who purchase Pro

## Extension Changes Needed

The extension UI needs to be updated from login/password to license key:

### Current (Password System):
```
[ Email    ]
[ Password ]
[  Login   ]
```

### New (License Key System):
```
[     Enter License Key     ]
[  ABX3-KD92-MN47-QR56-ZW89 ]
[        Activate          ]
```

### Flow:

1. **First Time User**:
   - Opens extension → Sees "Enter License Key" screen
   - Can click "Get Free Key" → Opens website → Gets key via email
   - Or click "Buy Pro" → Stripe checkout → Gets key via email
   - Enters key → Validated → Ready to use

2. **Returning User**:
   - Key stored in chrome.storage
   - Automatically validated on extension load
   - If key is valid → Works immediately
   - If invalid (subscription cancelled) → Shows "Reactivate" screen

## API Endpoints

### Validate License Key
```
POST /api/auth/validate-key
Body: { "licenseKey": "ABCD-EFGH-IJKL-MNOP-QRST" }
Response: {
  "user": {
    "id": "...",
    "email": "user@example.com",
    "tier": "pro",
    "subscriptionStatus": "active"
  }
}
```

### Create Free Key (Optional - Can be frontend-only)
```
POST /api/auth/create-free-key
Body: { "email": "user@example.com" }  // Optional
Response: {
  "licenseKey": "ABCD-EFGH-IJKL-MNOP-QRST",
  "tier": "free"
}
```

### Create Checkout (Buy Pro)
```
POST /api/subscription/create-checkout
Body: { "email": "user@example.com" }
Response: {
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

### Get Current User
```
GET /api/auth/me
Headers: Authorization: LicenseKey ABCD-EFGH-IJKL-MNOP-QRST
Response: {
  "id": "...",
  "email": "...",
  "tier": "pro",
  "licenseKey": "ABCD-EFGH-IJKL-MNOP-QRST",
  "subscriptionStatus": "active"
}
```

## Email Service Setup

The system uses **SendGrid** to send license keys via email.

### 1. Create SendGrid Account
1. Go to https://sendgrid.com/
2. Sign up for free account (100 emails/day free)
3. Verify your sender email address
4. Create an API key

### 2. Set Environment Variables
```bash
wrangler secret put SENDGRID_API_KEY
# Paste your SendGrid API key

wrangler secret put FROM_EMAIL
# Enter your verified sender email (e.g., support@yourdomain.com)
```

### 3. Email Template

The system sends beautiful HTML emails with:
- Welcome message
- **Large, prominent license key**
- Activation instructions
- Feature list (for Pro users)

## Deployment Steps

### 1. Update Backend Files

Replace the old auth/subscription files:
```bash
cd cloudflare-workers-backend/src

# Backup old files
mv auth.js auth.old.js
mv subscription.js subscription.old.js

# Use new license key versions
mv auth-license.js auth.js
mv subscription-license.js subscription.js
```

### 2. Update Database Schema

```bash
# Drop old schema and create new one
wrangler d1 execute database --file=schema-license.sql
```

### 3. Set New Environment Variables

```bash
# SendGrid for email
wrangler secret put SENDGRID_API_KEY
wrangler secret put FROM_EMAIL

# Extension URL (for Stripe redirects)
wrangler secret put EXTENSION_URL
# Enter: chrome-extension://YOUR-EXTENSION-ID
```

### 4. Deploy
```bash
wrangler deploy
```

## Extension Implementation

Here's the simplified auth-service for the extension:

```javascript
const AuthService = {
  DEFAULT_BACKEND_URL: 'https://backend.YOUR-SUBDOMAIN.workers.dev',

  // Validate and store license key
  async validateKey(licenseKey) {
    const response = await fetch(`${this.DEFAULT_BACKEND_URL}/api/auth/validate-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Invalid license key');
    }

    const data = await response.json();

    // Store license key
    await chrome.storage.local.set({
      'captureai-license-key': licenseKey,
      'captureai-user-email': data.user.email,
      'captureai-user-tier': data.user.tier
    });

    return data.user;
  },

  // Get stored license key
  async getLicenseKey() {
    const result = await chrome.storage.local.get('captureai-license-key');
    return result['captureai-license-key'] || null;
  },

  // Send AI request with license key
  async sendAIRequest({ question, imageData, promptType, reasoningLevel }) {
    const licenseKey = await this.getLicenseKey();

    if (!licenseKey) {
      throw new Error('No license key. Please activate CaptureAI.');
    }

    const response = await fetch(`${this.DEFAULT_BACKEND_URL}/api/ai/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `LicenseKey ${licenseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question, imageData, promptType, reasoningLevel })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return await response.json();
  },

  // Create Stripe checkout
  async createCheckout(email) {
    const response = await fetch(`${this.DEFAULT_BACKEND_URL}/api/subscription/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout');
    }

    return await response.json();
  }
};
```

## Testing

### Test Free Key
```bash
curl -X POST https://backend.YOUR-SUBDOMAIN.workers.dev/api/auth/create-free-key \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Returns: {"licenseKey":"ABCD-...","tier":"free"}
```

### Test Key Validation
```bash
curl -X POST https://backend.YOUR-SUBDOMAIN.workers.dev/api/auth/validate-key \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"YOUR-KEY-HERE"}'
```

### Test AI Request
```bash
curl -X POST https://backend.YOUR-SUBDOMAIN.workers.dev/api/ai/complete \
  -H "Authorization: LicenseKey YOUR-KEY-HERE" \
  -H "Content-Type: application/json" \
  -d '{"question":"Test","promptType":"ask","reasoningLevel":1}'
```

## Free Key Distribution

You have several options for distributing free keys:

### Option 1: Landing Page
Create a simple landing page where users can get a free key:
```html
<form id="get-key-form">
  <input type="email" placeholder="Enter your email" required>
  <button>Get Free License Key</button>
</form>
```

### Option 2: Extension Itself
Add a "Get Free Key" button in the extension that calls the API

### Option 3: On-Demand Generation
Generate keys automatically when users first open the extension (no email required)

## Migration from Password System

If you already have users with username/password:

1. Generate license keys for all existing users
2. Email them their new license keys
3. Keep old auth system active for 30 days
4. Show migration notice in extension
5. Switch to license key system after migration period

```sql
-- Generate keys for existing users
UPDATE users
SET license_key = (/* generate unique key */),
    updated_at = datetime('now');
```

## Summary

The license key system is **much simpler** than username/password:

- ✅ No registration form
- ✅ No password requirements
- ✅ No "forgot password" flow
- ✅ Easy to share/transfer between devices
- ✅ Automatic email delivery on purchase
- ✅ Simple validation (just check if key exists)

The trade-off is less security (keys can be shared), but for a browser extension with affordable pricing, this simplicity is often preferred!
