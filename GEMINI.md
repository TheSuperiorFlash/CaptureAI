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

**Tiers:** Basic ($1.49/week, 50 req/day) | Pro ($9.99/mo, 20 req/min unlimited)

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
- **Usage Tracking**: Two-table strategy — `usage_records` (per-request) + `usage_daily` (O(1) rate limit checks)
- **Stripe Proration**: Basic (weekly) to Pro (monthly) upgrades use the native Subscription Update API with `billing_cycle_anchor: 'now'` and `proration_behavior: 'always_invoice'` to handle cross-interval credits.
- **Checkout Tier Switching**: `/api/subscription/create-checkout` now auto-switches active subscribers to the requested tier and returns Stripe-hosted invoice pages so users can review proration amounts.
- **Checkout Invoice Preview**: Tier-switch responses include invoice preview fields (`amountDueCents`, `subtotalCents`, `totalCents`, `currency`) so the website can display exact prorated cost before redirecting to Stripe.

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
captureai-backend-url          # Backend URL (default: https://api.captureai.workers.dev)
captureai-migration-license-v3-complete  # Migration completion flag
captureai-migration-notice     # Message shown in popup after migration
captureai-api-key              # Legacy API key (deprecated, migration fallback)
```

## Coding Standards

### Formatting & Language

- Vanilla JS only (extension), 2-space indentation, single quotes, semicolons required
- `camelCase` variables/functions, `UPPER_SNAKE_CASE` constants, `PascalCase` classes
- `isX`/`hasX`/`canX` booleans, `handleEventName` event handlers
- kebab-case filenames (`auth-service.js`)

### Variables

- Use meaningful, pronounceable, searchable names — never single letters or mental mappings
- Avoid Hungarian notation, type prefixes, and redundant context (e.g., `userEmail` not `strUserEmailAddress`)
- One declaration per `const`/`let` statement; no `var`

### Functions

- Each function does exactly one thing at a single level of abstraction
- Keep functions short (≤ 50 lines); extract when logic branches or nests deeply
- **Command Query Separation**: a function either performs an action OR returns a value, never both
- Eliminate side effects — a function should not modify state outside its scope unless that is its sole declared purpose
- Apply DRY: if logic repeats three or more times, extract it; two similar lines are fine
- JSDoc all public functions; omit for trivial internal helpers

### Comments

- Delete comments that restate what the code does syntactically (`// increment counter` above `counter++`)
- Retain or write comments only to explain *why* — business rules, historical context, non-obvious tradeoffs
- Retain comments that explain highly specific visual formatting or alignment choices

### Dead Code

- Trace execution paths; remove entirely unused functions, variables, imports, and unreachable branches
- When removing dead code, also remove any unit tests that exclusively cover it

### Error Handling

- Catch specific exceptions; never swallow errors with empty `catch` blocks
- Do not use exceptions for standard control flow (e.g., don't throw to signal "not found")
- Always check `chrome.runtime.lastError` in extension callbacks
- Try-catch all async operations; surface meaningful error messages

### Constants & Magic Values

- Extract all magic numbers and hardcoded configuration strings into well-named constants
- Group related constants in `config.js` or at the top of the module they belong to

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

**Always:** Read files before editing | Parameterized DB queries | Validate input at boundaries | Verify webhook signatures | Try-catch async ops | Check `chrome.runtime.lastError` | Extract magic values into constants

**Never:** `innerHTML` with untrusted content | Hardcode secrets | Log sensitive data | Bypass tier restrictions | Deploy without testing | Modify schema without migrations | Commit secrets | Swallow errors with empty catch | Use exceptions for control flow

## Backend Environment

**Secrets:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BASIC`, `RESEND_API_KEY`, `FROM_EMAIL`
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
- **Migration Scripts**: [api/migrations/README.md](api/migrations/README.md) — all 8 migrations
- **Testing Guide**: [tests/README.md](tests/README.md) — 25 test files, setup, patterns
- **Website Design System**: [website/DESIGN_SYSTEM.md](website/DESIGN_SYSTEM.md) — tokens, components, patterns
