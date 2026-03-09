# Security Fixes - CaptureAI Backend

**Audit Date:** December 24, 2024
**Status:** All critical issues resolved (8 Critical/High, 5 Medium/Low)

---

## Critical/High Fixes

### 1. Insecure Random Number Generation (CRITICAL)
**`api/src/auth.js`** — Replaced `Math.random()` with `crypto.getRandomValues()` for license key generation to prevent key prediction.

### 2. Missing Database Columns (CRITICAL)
**`api/schema.sql`** — Added missing columns (`input_tokens`, `output_tokens`, `reasoning_tokens`, `cached_tokens`, `total_cost`) with proper types and indexes.

### 3. Email Enumeration Attack (HIGH)
**`api/src/auth.js`** — The `/api/auth/create-free-key` endpoint no longer reveals whether an email exists. License keys are sent via email only, with identical responses for new and existing users.

### 4. Missing Subscription Status Checks (HIGH)
**`api/src/auth.js`** — Pro users with cancelled/inactive subscriptions are now denied access in `authenticate()`.

### 5. Overly Permissive CORS (HIGH)
**`api/src/index.js`, `api/src/utils.js`, `api/wrangler.toml`** — CORS now restricts to specific extension IDs via `CHROME_EXTENSION_IDS` env var (comma-separated). All-extension access limited to development mode only.

## Medium Fixes

### 6. Missing Security Headers (MEDIUM)
**`api/src/index.js`** — Added `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`.

### 7. Inadequate Disposable Email Blocking (MEDIUM)
**`api/src/validation.js`** — Expanded from 3 to 27+ blocked disposable email domains.

### 8. Missing Rate Limiting (MEDIUM-HIGH)
**`api/src/ratelimit.js` (new), `api/src/auth.js`, `api/src/subscription.js`**

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/validate-key` | 10 requests | 1 minute |
| `/api/auth/create-free-key` | 3 requests | 1 hour |
| `/api/subscription/create-checkout` | 5 requests | 1 hour |

## Already Secure (No Changes Needed)

- **SQL Injection**: All queries use parameterized `.bind()` statements
- **Webhook Security**: HMAC-SHA256 + constant-time comparison + timestamp validation (2-min window) + event deduplication
- **Password Hashing**: PBKDF2 with 100,000 iterations, SHA-256, proper salt

## Configuration Required

1. **Update `CHROME_EXTENSION_IDS`** in `api/wrangler.toml` with production and development extension IDs
2. **Run migration** if existing DB: `wrangler d1 execute captureai-db --file=migrations/002_add_token_breakdown.sql`

## Recommended Future Improvements

**Short-term:** Distributed rate limiting (Durable Objects), API request signing, security monitoring, DDoS rules, CSP headers

**Long-term:** CAPTCHA on free key creation, 2FA, audit logging, SAST/DAST integration, bug bounty program

---

**Next Review Recommended:** 3-6 months from audit date
