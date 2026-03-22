# GEMINI.md

> **Self-update rule:** When you change coding standards, commands, key concepts, or storage keys — update this file, [CLAUDE.md](CLAUDE.md), and [.github/copilot-instructions.md](.github/copilot-instructions.md).

Development guide for CaptureAI Chrome extension.

## Documentation Maintenance — MANDATORY

**After every code change, update the relevant markdown files before committing.** Stale docs poison future sessions. This is not optional.

| What you changed | Update these files |
|------------------|--------------------|
| API routes, auth, rate limits, AI models, webhooks | This file + [CLAUDE.md](CLAUDE.md) (Key Concepts) + [api/ARCHITECTURE.md](api/ARCHITECTURE.md) |
| Extension modules, storage keys, message actions, Privacy Guard | This file + [CLAUDE.md](CLAUDE.md) (Storage Keys) + [extension/ARCHITECTURE.md](extension/ARCHITECTURE.md) |
| Database tables, columns, indexes, views | [api/DATABASE_GUIDE.md](api/DATABASE_GUIDE.md) |
| New migration file added | [api/migrations/README.md](api/migrations/README.md) |
| CORS config, extension IDs | [api/CHROME_EXTENSIONS.md](api/CHROME_EXTENSIONS.md) |
| Test files added/removed, coverage thresholds, test setup | [tests/README.md](tests/README.md) |
| Website components, design tokens, pages | [website/DESIGN_SYSTEM.md](website/DESIGN_SYSTEM.md) |
| npm scripts, dependencies, dev tooling | This file + [CLAUDE.md](CLAUDE.md) (Commands) + [.github/copilot-instructions.md](.github/copilot-instructions.md) |
| Coding standards, critical rules, git workflow | This file + [CLAUDE.md](CLAUDE.md) + [.github/copilot-instructions.md](.github/copilot-instructions.md) |

**Every doc has a self-update reminder at the top. Follow it.**

## Project Overview

Full-stack Chrome extension with Cloudflare Workers backend for AI-powered screenshot analysis. Users capture screen areas, text is extracted via OCR, and AI provides answers.

**Stack:** Chrome Extension (Manifest V3) + Cloudflare Workers + D1 (SQLite) + OpenAI via AI Gateway + Stripe + Resend + Tesseract.js v7

**Tiers:** Basic ($1.99/week or $5.99/month, 50 req/day) | Pro ($3.49/week or $9.99/month, unlimited requests, 20 req/min rate limit)

## Commands

```bash
npm test                    # Run all tests (Jest, 25 test files)
npm run test:coverage       # Coverage report (thresholds: 40%)
npm run test:e2e            # Playwright e2e tests
npm run test:all            # All tests (extension + API + e2e)
npm run lint                # ESLint
npm run lint:fix            # ESLint auto-fix
cd api && npm run dev       # Local dev server on http://localhost:8787
cd api && npm run deploy    # Deploy to production
cd api && npm run db:migrate  # Run migrations
```

## Working Principles

**Planning:** Enter plan mode for any non-trivial task (3+ steps or architectural decisions). Write detailed specs upfront. If something goes sideways, stop and re-plan — don't keep pushing.

**Subagents:** Use subagents liberally to keep the main context window clean. Offload research, exploration, and parallel analysis. One task per subagent for focused execution.

**Verification:** Never mark a task complete without proving it works. Run tests, check logs, demonstrate correctness.

**Elegance:** For non-trivial changes, ask "is there a more elegant way?" If a fix feels hacky, implement the elegant solution. Skip for simple, obvious fixes.

**Bug Fixing:** Given a bug report, fix it — don't ask for hand-holding. Point at logs, errors, and failing tests, then resolve them.

**Self-Improvement:** After any correction from the user, update `tasks/lessons.md` with the pattern to prevent the same mistake.

**Task Management:**
1. Write plan to `tasks/todo.md` with checkable items before starting
2. Check in with user before implementation
3. Mark items complete as you go
4. Add review section to `tasks/todo.md` when done
5. Update `tasks/lessons.md` after corrections

## Key Concepts

- **Module System**: ES6 exports loaded dynamically in `content.js`, accessible via `window.CaptureAI` namespace (14 modules)
- **Auto-solve Sites**: Vocabulary.com
- **Backend URL**: `https://api.captureai.workers.dev`
- **AI Models**: `gpt-4.1-nano` (level 0, fastest) | `gpt-5-nano` low reasoning (level 1, default) | `gpt-5-nano` medium reasoning (level 2, Pro only)
- **Privacy Guard**: `inject.js` in `MAIN` world overrides `document.hasFocus()`, blocks visibility/focus/lifecycle events, blocks clipboard events, removes AI honeypots. Pro only, requires enabled in settings. Prevents `unload` policy violations.
- **OCR Flow**: Capture -> Tesseract.js v7 -> if confidence >60% send text only (90% savings) -> else fallback to image
- **Shortcuts**: `Ctrl+Shift+X` capture | `Ctrl+Shift+F` recapture | `Ctrl+Shift+E` toggle panel
- **Rate Limiting**: Cloudflare native Rate Limiting API with 5 presets (AUTH: 5/min, LICENSE: 10/min, CHECKOUT: 10/min, GLOBAL: 60/min, PRO_AI: 20/min)
- **Auth**: License key system (`XXXX-XXXX-XXXX-XXXX-XXXX`), sent via `Authorization: LicenseKey YOUR-KEY` header
- **Usage Tracking**: Two-table strategy — `usage_breakdown` (per-day analytics by prompt_type + model, reliable writes) + `usage_daily` (O(1) rate limit checks, authoritative daily totals)
- **Subscription Audit Log**: Every tier/status change is written to `subscription_events` (immutable, never deleted). Query it to answer billing disputes.
- **Past-Due Auth**: Users with `subscription_status = 'past_due'` are granted Basic-tier access (Pro features blocked) until payment resolves. Cancelled/inactive users get no access.
- **Stripe Proration**: Plan changes (any tier or billing period switch) use the native Subscription Update API with `billing_cycle_anchor: 'now'` and `proration_behavior: 'always_invoice'` to handle cross-interval credits.
- **Checkout Tier Switching**: `/api/subscription/create-checkout` now auto-switches active subscribers to the requested tier and returns Stripe-hosted invoice pages so users can review proration amounts.
- **Checkout Invoice Preview**: Tier-switch responses include invoice preview fields (`amountDueCents`, `subtotalCents`, `totalCents`, `currency`) so the website can display exact prorated cost before redirecting to Stripe.
- **Plan-Switch OTP Verification**: Any plan change (tier or billing period) via `create-checkout` (confirmed flow) requires a 6-digit email OTP code. Codes are sent via `/api/subscription/send-verification` (accepts `tier` + `billingPeriod`), stored in `verification_codes` table with a `planKey` (`tier_billingPeriod`, e.g. `pro_monthly`) in the `tier` column (10-min TTL), and cleaned up by a daily cron trigger.
- **Trial Offer**: `POST /api/subscription/create-checkout` with `{ trial: true, tier: 'pro', billingPeriod: 'weekly' }` creates a Pro Weekly checkout with a Stripe coupon applied ($2.50 off = $0.99 first week). New users only — existing email returns 409. Trial detected at webhook time via `subscription.metadata.is_trial = 'true'`; sends trial-specific welcome email. Subsequent weeks bill at $3.49/week. Requires `STRIPE_COUPON_PRO_TRIAL` secret (Stripe coupon ID, `duration: once`, $2.50 off).
- **Reasoning Level Enforcement**: Server-side clamping in `ai.js` — non-Pro users have `reasoningLevel` capped at 1 regardless of client-sent value.
- **Website Account System**: Email + 6-digit OTP login at `/account/login`. Dashboard at `/account` shows subscription, usage, billing portal, and account details. Session stored in `localStorage` using the license key as token (`captureai-web-session`, `captureai-web-user`). Backend routes: `POST /api/auth/send-login-code`, `POST /api/auth/verify-login`.

## Storage Keys

```
captureai-license-key          # Current license key
captureai-user-email           # User email
captureai-user-tier            # 'basic' or 'pro'
captureai-user-cache           # Cached user object with timestamp
captureai-auto-solve-mode      # Boolean
captureai-ask-mode             # Boolean
captureai-last-capture-area    # {startX, startY, width, height}
captureai-reasoning-level      # 0, 1, or 2
captureai-settings             # {privacyGuard: {enabled, domainBlacklist}, ocr: {disabled}, theme}
captureai-last-usage           # Cached AI response usage stats
captureai-privacy-guard-defaulted  # Auto-enable flag on first Pro upgrade
captureai-privacy-guard-notice-seen   # True once user dismisses the auto-enable banner
captureai-backend-url          # Backend URL (default: https://api.captureai.workers.dev)
captureai-api-key              # Legacy API key (deprecated, kept for reference only)
captureai-web-session-ts       # Timestamp of last successful /api/auth/me validation (ISO string)
```

## Coding Standards

### Formatting & Language

- Vanilla JS only (extension), 2-space indentation, single quotes, semicolons required
- `camelCase` variables/functions, `UPPER_SNAKE_CASE` constants, `PascalCase` classes
- `isX`/`hasX`/`canX` booleans, `handleEventName` event handlers
- kebab-case filenames (`auth-service.js`)
- Meaningful, pronounceable, searchable names — never single letters; no Hungarian notation or type prefixes
- One declaration per `const`/`let` statement; no `var`

### Functions

- Each function does exactly one thing at a single level of abstraction
- Keep functions short (≤ 50 lines); extract when logic branches or nests deeply
- **Command Query Separation**: a function either performs an action OR returns a value, never both
- Eliminate side effects — a function should not modify state outside its scope unless that is its sole declared purpose
- Apply DRY: if logic repeats three or more times, extract it; two similar lines are fine
- JSDoc all public functions; omit for trivial internal helpers

### Comments

- Delete comments that restate what the code does syntactically
- Retain comments only to explain *why* — business rules, historical context, non-obvious tradeoffs

### Error Handling

- Catch specific exceptions; never swallow errors with empty `catch` blocks
- Do not use exceptions for standard control flow
- Always check `chrome.runtime.lastError` in extension callbacks
- Try-catch all async operations; surface meaningful error messages

### Chrome Extension Specifics

- Manifest V3: service workers, not background pages — handle lifecycle restarts
- Persist state in `chrome.storage.local`, never in service worker memory
- `textContent` over `innerHTML`; never inject untrusted content via `innerHTML`
- Access shared state only via `window.CaptureAI.STATE` / `window.CaptureAI.CONFIG`
- Message passing: `chrome.runtime.sendMessage()` (content → background), `chrome.tabs.sendMessage()` (background → content)
- `wasm-unsafe-eval` required in CSP for Tesseract.js

### API / Backend Specifics

- Parameterized D1 queries (`.bind()`) — no string concatenation in SQL
- Validate all input at the handler boundary
- Verify Stripe webhook signatures (HMAC-SHA256 + timestamp)
- Never hardcode secrets; never log sensitive data

## Critical Rules

**Always:** Read files before editing | Parameterized DB queries | Validate input at boundaries | Verify webhook signatures | Try-catch async ops | Check `chrome.runtime.lastError` | Extract magic values into constants | Find root causes — no temp fixes | Make changes as simple and minimal as possible

**Never:** `innerHTML` with untrusted content | Hardcode secrets | Log sensitive data | Bypass tier restrictions | Modify schema without migrations | Commit secrets | Swallow errors with empty catch | Use exceptions for control flow

## Backend Environment

**Secrets:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BASIC_WEEKLY`, `STRIPE_PRICE_BASIC_MONTHLY`, `STRIPE_PRICE_PRO_WEEKLY`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_COUPON_PRO_TRIAL` (Stripe coupon ID, $2.50 off once, for trial offer), `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_KEY` (protects `GET /api/ai/total-usage`)
**Env vars:** `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_GATEWAY_NAME`, `BASIC_TIER_DAILY_LIMIT`, `PRO_TIER_RATE_LIMIT_PER_MINUTE`, `EXTENSION_URL`, `CHROME_EXTENSION_IDS`

## Git Workflow

Commit format: `<type>(<scope>): <subject>`
Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

## Debugging

- **Background**: `chrome://extensions` -> CaptureAI service worker
- **Content**: F12 console on any webpage
- **Popup**: Right-click extension icon -> "Inspect popup"
- **State**: `window.CaptureAI.STATE` in content script console

## Deep Documentation

- **API Architecture**: [api/ARCHITECTURE.md](api/ARCHITECTURE.md) — routes, auth, rate limiting, AI integration
- **Extension Architecture**: [extension/ARCHITECTURE.md](extension/ARCHITECTURE.md) — modules, storage keys, privacy guard
- **Chrome Extension Config**: [api/CHROME_EXTENSIONS.md](api/CHROME_EXTENSIONS.md) — CORS extension ID management
- **Database Guide**: [api/DATABASE_GUIDE.md](api/DATABASE_GUIDE.md) — schema, queries, maintenance
- **Migration Scripts**: [api/migrations/README.md](api/migrations/README.md) — all 9 migrations
- **Testing Guide**: [tests/README.md](tests/README.md) — 25 test files, setup, patterns
- **Website Design System**: [website/DESIGN_SYSTEM.md](website/DESIGN_SYSTEM.md) — tokens, components, patterns
