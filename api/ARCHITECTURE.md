# API Architecture

> **Self-update rule:** When you add/change routes, auth logic, rate limit presets, AI models, prompt types, webhook events, CORS origins, or security headers — update this file and the Quick Reference section of [CLAUDE.md](../CLAUDE.md) before committing.

Backend runs on Cloudflare Workers with D1 (SQLite) database, accessed at `https://api.captureai.dev`.

## Routes

All routes prefixed with `/api/` (defined in `src/router.js`).

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Status message |
| GET | `/health` | Health check |

### Authentication (`src/auth.js`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/auth/validate-key` | None | 10/min | Validate and activate license key |
| GET | `/api/auth/me` | LicenseKey | — | Get current user info |
| POST | `/api/auth/send-login-code` | None | 5/min (AUTH) | Send 6-digit OTP for website login |
| POST | `/api/auth/verify-login` | None | 5/min (AUTH) | Verify OTP and return license key + user info |

### AI (`src/ai.js`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/ai/solve` | LicenseKey | Tier-based | AI completion (alias for complete) |
| POST | `/api/ai/complete` | LicenseKey | Tier-based | AI completion with question/image/OCR |
| GET | `/api/ai/usage` | LicenseKey | — | Usage statistics |
| GET | `/api/ai/models` | LicenseKey | — | Available models |
| GET | `/api/ai/analytics` | LicenseKey | — | 30-day analytics (CTE query) |
| GET | `/api/ai/total-usage` | Admin (X-Admin-Key) | — | Global usage stats |

### Subscription (`src/subscription.js`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/subscription/create-checkout` | None | 10/min | Stripe checkout session; accepts `tier` + `billingPeriod` (`weekly`/`monthly`); auto-switches active subscribers and returns Stripe-hosted invoice page plus prorated amount preview fields. Pass `trial: true` with `tier: 'pro'` for the trial (new users only): `billingPeriod: 'weekly'` uses `STRIPE_COUPON_PRO_TRIAL` coupon ($0.99 first week → $3.49/wk); `billingPeriod: 'monthly'` uses `STRIPE_COUPON_PRO_TRIAL_MONTHLY` coupon ($2.99 first month → $9.99/mo) |
| POST | `/api/subscription/send-verification` | None | 5/min (AUTH) | Send 6-digit OTP email for plan-switch confirmation (any tier or billing period change); accepts `tier` + `billingPeriod` |
| POST | `/api/subscription/change-tier` | LicenseKey | 10/min (CHECKOUT) | Upgrade/downgrade active subscription with proration |
| POST | `/api/subscription/webhook` | Stripe signature | — | Stripe webhook handler |
| POST | `/api/subscription/verify-payment` | None | — | Verify checkout session |
| GET | `/api/subscription/portal` | LicenseKey | — | Stripe billing portal |
| GET | `/api/subscription/plans` | None | — | Available plans |
| POST | `/api/subscription/swap-plan` | LicenseKey | 10/min | Upgrade Basic → Pro with proration |

## Authentication

License key format: `XXXX-XXXX-XXXX-XXXX-XXXX` (chars: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`)

Header: `Authorization: LicenseKey YOUR-KEY`

Generated with `crypto.getRandomValues()`. Basic and Pro users must have `subscription_status = 'active'`.

`authenticateAccount()` variant skips the active-status check, allowing cancelled/inactive users to access read-only account endpoints.

## Rate Limiting

Uses **Cloudflare native Rate Limiting API** via bindings in `wrangler.toml`. In-memory fallback for local dev.

| Preset | Binding | Limit | Window | Scope |
|--------|---------|-------|--------|-------|
| AUTH | `RATE_LIMITER_AUTH` (1001) | 5/min | 60s | Per IP |
| LICENSE_VALIDATION | `RATE_LIMITER_LICENSE` (1003) | 10/min | 60s | Per IP |
| CHECKOUT | `RATE_LIMITER_CHECKOUT` (1004) | 10/min | 60s | Per IP |
| GLOBAL | `RATE_LIMITER_GLOBAL` (1005) | 60/min | 60s | Per IP |
| PRO_AI | `RATE_LIMITER_AI_PRO` (1006) | 20/min | 60s | Per user |

IP detection: `CF-Connecting-IP` > `X-Forwarded-For` > `X-Real-IP`

## AI Integration

Requests go through **Cloudflare AI Gateway** (provider-agnostic OpenAI endpoint). 30-second timeout.

**Models:**
- Level 0: `gpt-4.1-nano` — fastest, no reasoning, legacy params (`max_tokens`)
- Level 1: `gpt-5-nano` + `reasoningEffort: 'low'` — default
- Level 2: `gpt-5-nano` + `reasoningEffort: 'medium'` — Pro only (server-side enforced; non-Pro requests are clamped to level 1). **RULE:** Never allow client-supplied `reasoningLevel` to bypass this — enforcement is server-side in `ai.js` only.

**Prompt types:** `answer`, `answer_image`, `ask`, `ask_image`, `auto_solve`, `auto_solve_image`

**Max tokens:** AUTO_SOLVE=2500, ASK=8000, TEXT_ONLY=4000, DEFAULT=5000

**Usage tracking:** Dual-table — `usage_breakdown` (per-day analytics keyed on email+date+prompt_type+model, reliable writes) + `usage_daily` (O(1) daily limit checks, authoritative daily totals via atomic upsert)

## Webhook Security

Stripe webhooks verified with: HMAC-SHA256 signature + constant-time comparison + timestamp validation (2-min window) + event deduplication via `webhook_events` table.

Handled events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`

## Security Headers

Applied to all responses: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(), microphone=(), camera=()`

## CORS

**Response CORS** (`getCORSHeaders` in `index.js`): `https://captureai.dev` + chrome extensions from `CHROME_EXTENSION_IDS` env var. Dev mode adds `localhost:3000/8080` and `127.0.0.1:3000`.

**Preflight CORS** (`handleCORS` in `utils.js`): Same origins as above. Credentials header only set for non-null origins.

## File Map

| File | Purpose |
|------|---------|
| `src/index.js` | Entry point, response CORS, security headers, env validation |
| `src/router.js` | Route definitions, dispatch, global rate limiting |
| `src/auth.js` | License key CRUD, email delivery (Resend), authentication |
| `src/ai.js` | AI Gateway integration, usage tracking, analytics |
| `src/subscription.js` | Stripe checkout, webhooks, billing portal, payment verification |
| `src/ratelimit.js` | Native Cloudflare rate limiting with in-memory fallback |
| `src/validation.js` | Input validation, disposable email blocking, sanitization |
| `src/utils.js` | JSON responses, fetchWithTimeout, PBKDF2 hashing, JWT, preflight CORS, constant-time comparison |
| `src/logger.js` | Structured logging with PII redaction, CORS rejection logging |
| `wrangler.toml` | Worker config, D1 binding, rate limit bindings, env vars |
| `schema.sql` | Complete database schema (users, usage_records, usage_daily, webhook_events, verification_codes, views) |

## Scheduled Jobs

A daily cron trigger (`0 3 * * *`, defined in `wrangler.toml`) calls the `scheduled` handler in `src/index.js`, which deletes expired and used rows from the `verification_codes` table.

## Subscription Rules

- **Subscription Audit Log**: Every tier/status change is written to `subscription_events` (immutable, never deleted). Query it to answer billing disputes.
- **Past-Due Auth**: Users with `subscription_status = 'past_due'` are granted Basic-tier access (Pro features blocked) until payment resolves. Cancelled/inactive users get no access at all.
- **Stripe Proration**: Plan changes (any tier or billing period switch) use the Subscription Update API with `billing_cycle_anchor: 'now'` and `proration_behavior: 'always_invoice'` to handle cross-interval credits.
- **Plan-Switch OTP Verification**: Any plan change via `create-checkout` (confirmed flow) requires a 6-digit email OTP. Codes stored in `verification_codes` with a `planKey` (`tier_billingPeriod`, e.g. `pro_monthly`) in the `tier` column; 10-min TTL; cleaned up by daily cron.
- **Trial Offer**: Two variants, both new-users-only (existing email → 409).
  - Weekly: `STRIPE_COUPON_PRO_TRIAL` coupon → $0.99 first week → $3.49/wk; detected via `subscription.metadata.is_trial = 'true'`
  - Monthly: `STRIPE_COUPON_PRO_TRIAL_MONTHLY` coupon → $2.99 first month → $9.99/mo; detected via `subscription.metadata.is_trial_monthly = 'true'`
- **Website Account System**: Email + 6-digit OTP login at `/account/login`; dashboard at `/account`; session stored in `localStorage` as `captureai-web-session` / `captureai-web-user` keys using the license key as token. Backend routes: `POST /api/auth/send-login-code`, `POST /api/auth/verify-login`.

## Backend Environment

**Secrets:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BASIC_WEEKLY`, `STRIPE_PRICE_BASIC_MONTHLY`, `STRIPE_PRICE_PRO_WEEKLY`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_COUPON_PRO_TRIAL` (Stripe coupon ID, $2.50 off once — weekly trial), `STRIPE_COUPON_PRO_TRIAL_MONTHLY` (Stripe coupon ID, $7.00 off once — monthly trial), `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_KEY` (protects `GET /api/ai/total-usage`)

**Env vars:** `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_GATEWAY_NAME`, `BASIC_TIER_DAILY_LIMIT`, `PRO_TIER_RATE_LIMIT_PER_MINUTE`, `EXTENSION_URL`, `CHROME_EXTENSION_IDS`
