# Doc Optimization Design — 2026-03-24

## Goal

Slim CLAUDE.md and GEMINI.md down to rules and operating instructions only. Architectural context moves to the dedicated architecture files. A minimal Quick Reference section stays in both files for the most commonly needed facts mid-task.

## What Gets Removed from CLAUDE.md / GEMINI.md

Three full sections are stripped:

- **Key Concepts** — entire section (~20 bullet points, fully routed per table below)
- **Storage Keys** — routed to `extension/ARCHITECTURE.md` (already mostly covered; one key to add)
- **Backend Environment** — secrets list and env var list move to `api/ARCHITECTURE.md`

### Key Concepts routing table

| Bullet | Destination | Notes |
|--------|-------------|-------|
| Module System | `extension/ARCHITECTURE.md` | Already partially there; ensure "14 modules, window.CaptureAI namespace" is explicit |
| Auto-solve Sites | `extension/ARCHITECTURE.md` | Add "Supported auto-solve site: Vocabulary.com" as a standalone line |
| Backend URL | Quick Reference | Already in api/ARCHITECTURE.md line 5 |
| AI Models | Quick Reference | Already in api/ARCHITECTURE.md AI Integration section |
| Privacy Guard | Quick Reference + `extension/ARCHITECTURE.md` | Already extensively documented in extension/ARCHITECTURE.md |
| OCR Flow | Quick Reference + `extension/ARCHITECTURE.md` | Expand ocr-service.js row with full pipeline description |
| Shortcuts | `extension/ARCHITECTURE.md` | Add new Shortcuts section |
| Rate Limiting | Quick Reference | Already in api/ARCHITECTURE.md Rate Limiting section |
| Auth | Quick Reference | Already in api/ARCHITECTURE.md Authentication section |
| Usage Tracking | `api/ARCHITECTURE.md` | Expand existing dual-table paragraph; reconcile table name: CLAUDE.md says `usage_breakdown`, api/ARCHITECTURE.md says `usage_records` — use `usage_breakdown` (correct name per code) |
| Subscription Audit Log | `api/ARCHITECTURE.md` | Add to new Subscription Rules section |
| Past-Due Auth | `api/ARCHITECTURE.md` | Add to new Subscription Rules section |
| Stripe Proration | `api/ARCHITECTURE.md` | Add to new Subscription Rules section |
| Checkout Tier Switching | Already in `api/ARCHITECTURE.md` | Route 42 covers it — no action needed |
| Checkout Invoice Preview | Already in `api/ARCHITECTURE.md` | Route 42 covers it — no action needed |
| Plan-Switch OTP Verification | `api/ARCHITECTURE.md` | Route 43 covers the endpoint; add the planKey/TTL/cleanup mechanics to a new Subscription Rules section |
| Trial Offer | `api/ARCHITECTURE.md` | Route 42 covers endpoints; add coupon detection metadata (`is_trial`/`is_trial_monthly`) and sequential pricing to Subscription Rules section |
| Reasoning Level Enforcement | `api/ARCHITECTURE.md` | Already in AI Integration section (line 82); add explicit RULE callout so it is not treated as passive context |
| Website Account System | `api/ARCHITECTURE.md` | Add to new Subscription Rules section |

## What Gets Added to Architecture Files

### api/ARCHITECTURE.md

**1. New "Backend Environment" section** (at end of file):

```
## Backend Environment

**Secrets:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BASIC_WEEKLY`,
`STRIPE_PRICE_BASIC_MONTHLY`, `STRIPE_PRICE_PRO_WEEKLY`, `STRIPE_PRICE_PRO_MONTHLY`,
`STRIPE_COUPON_PRO_TRIAL` (Stripe coupon ID, $2.50 off once — weekly trial),
`STRIPE_COUPON_PRO_TRIAL_MONTHLY` (Stripe coupon ID, $7.00 off once — monthly trial),
`RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_KEY` (protects `GET /api/ai/total-usage`)

**Env vars:** `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_GATEWAY_NAME`, `BASIC_TIER_DAILY_LIMIT`,
`PRO_TIER_RATE_LIMIT_PER_MINUTE`, `EXTENSION_URL`, `CHROME_EXTENSION_IDS`
```

**2. Expand the "Usage Tracking" paragraph** in the AI Integration section:
- Fix table name: change `usage_records` → `usage_breakdown`
- Describe the two-table strategy: `usage_breakdown` (per-day analytics keyed on email+date+prompt_type+model, reliable writes) + `usage_daily` (O(1) rate limit checks, authoritative daily totals via atomic upsert)

**3. New "Subscription Rules" section** covering:

- **Subscription Audit Log** — every tier/status change written to `subscription_events` (immutable, never deleted); source of truth for billing disputes
- **Past-Due Auth** — `subscription_status = 'past_due'` grants Basic-tier access (Pro features blocked) until payment resolves; cancelled/inactive users get no access at all
- **Stripe Proration** — plan changes use Subscription Update API with `billing_cycle_anchor: 'now'` and `proration_behavior: 'always_invoice'`
- **Plan-Switch OTP Verification** — any plan change via `create-checkout` (confirmed flow) requires 6-digit OTP; codes stored in `verification_codes` table with a `planKey` (`tier_billingPeriod`, e.g. `pro_monthly`) in the `tier` column; 10-min TTL; cleaned up by daily cron
- **Trial Offer** — two variants, both new-users-only (existing email → 409):
  - Weekly: `STRIPE_COUPON_PRO_TRIAL` coupon → $0.99 first week → $3.49/wk; detected via `subscription.metadata.is_trial = 'true'`
  - Monthly: `STRIPE_COUPON_PRO_TRIAL_MONTHLY` coupon → $2.99 first month → $9.99/mo; detected via `subscription.metadata.is_trial_monthly = 'true'`
- **Website Account System** — email + 6-digit OTP login at `/account/login`; dashboard at `/account`; session stored in `localStorage` as `captureai-web-session` / `captureai-web-user` keys using the license key as token; backend routes: `POST /api/auth/send-login-code`, `POST /api/auth/verify-login`

**4. Add rule callout to Reasoning Level Enforcement** in AI Integration section:
- Current text: `non-Pro requests are clamped to level 1`
- Add: `**RULE:** Never allow client-supplied reasoningLevel to bypass this — enforcement is server-side in ai.js only.`

### extension/ARCHITECTURE.md

**1. Ensure Module System intro is explicit** — confirm or add: content.js loads 14 modules via dynamic import(), all exposed via `window.CaptureAI` namespace

**2. Add auto-solve site** — add line: "Supported auto-solve site: Vocabulary.com"

**3. Add Shortcuts section:**

```
## Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+X` | Capture new area |
| `Ctrl+Shift+F` | Recapture last area |
| `Ctrl+Shift+E` | Toggle panel |
```

**4. Expand OCR pipeline** — the `ocr-service.js` module row currently only notes "60% confidence threshold". Expand to: "Capture → Tesseract.js v7 → if confidence >60% send text only (90% cost savings) → else fallback to image"

**5. Add missing storage key** — `captureai-web-session-ts` is in CLAUDE.md's Storage Keys but absent from extension/ARCHITECTURE.md. Add it to the Internal State table: `captureai-web-session-ts` | string | ISO timestamp of last successful `/api/auth/me` validation

## What Stays in CLAUDE.md / GEMINI.md

All rules and operational content retained unchanged:

- Documentation Maintenance table (with two row updates — see below)
- Project Overview (brief stack + tiers summary)
- Commands
- Working Principles
- Coding Standards
- Critical Rules
- Git Workflow
- Debugging
- Deep Documentation links

## New Quick Reference Section

Replaces the three removed sections with a slim cheat sheet of the most commonly needed facts mid-task:

```markdown
## Quick Reference

- **Backend URL**: `https://api.captureai.dev`
- **AI Models**: `gpt-4.1-nano` (L0) | `gpt-5-nano` low (L1, default) | `gpt-5-nano` medium (L2, Pro only)
- **Auth header**: `Authorization: LicenseKey XXXX-XXXX-XXXX-XXXX-XXXX`
- **Rate limit presets**: AUTH (5/min) | LICENSE (10/min) | CHECKOUT (10/min) | GLOBAL (60/min) | PRO_AI (20/min)
- **Privacy Guard**: Pro only + `settings.privacyGuard.enabled`; `inject.js` runs in MAIN world at `document_start`
- **OCR threshold**: confidence >60% → send text only; else fallback to image
- **Extension namespace**: 14 modules loaded via `window.CaptureAI`; shared state at `window.CaptureAI.STATE`
```

## Doc Maintenance Table Updates

Two rows in both CLAUDE.md and GEMINI.md become stale once their sections are removed:

| Row | Old text | New text |
|-----|----------|----------|
| API routes, auth, rate limits… | "This file (Key Concepts) + GEMINI.md + api/ARCHITECTURE.md" | "api/ARCHITECTURE.md + GEMINI.md" (CLAUDE.md version) / "api/ARCHITECTURE.md + CLAUDE.md" (GEMINI.md version) |
| Extension modules, storage keys… | "This file (Storage Keys) + GEMINI.md + extension/ARCHITECTURE.md" | "extension/ARCHITECTURE.md + GEMINI.md" (CLAUDE.md version) / "extension/ARCHITECTURE.md + CLAUDE.md" (GEMINI.md version) |

## Self-Update Rule Updates in Architecture Files

The self-update reminders at the top of both architecture files reference sections of CLAUDE.md that will be deleted. Update them to point to the new Quick Reference section:

- `api/ARCHITECTURE.md` line 3: change `"the Key Concepts section of CLAUDE.md"` → `"the Quick Reference section of CLAUDE.md"`
- `extension/ARCHITECTURE.md` line 3: change `"the Storage Keys / Key Concepts sections of CLAUDE.md"` → `"the Quick Reference section of CLAUDE.md"`

## Files Changed

| File | Change |
|------|--------|
| `CLAUDE.md` | Remove Key Concepts, Storage Keys, Backend Environment; add Quick Reference; update doc maintenance table |
| `GEMINI.md` | Same as CLAUDE.md |
| `api/ARCHITECTURE.md` | Update self-update rule; add Backend Environment section; add Subscription Rules section; expand Usage Tracking (fix table name); add RULE callout to Reasoning Level Enforcement |
| `extension/ARCHITECTURE.md` | Update self-update rule; confirm Module System intro; add auto-solve site line; add Shortcuts section; expand OCR pipeline; add `captureai-web-session-ts` storage key |
