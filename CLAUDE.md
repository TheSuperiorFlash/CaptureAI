# CLAUDE.md

Development guide for CaptureAI Chrome extension.

## Documentation Maintenance — MANDATORY

**After every code change, update the relevant markdown files before committing.** Stale docs poison future sessions. This is not optional.

| What you changed | Update these files |
|------------------|--------------------|
| API routes, auth, rate limits, AI models, webhooks | This file (Key Concepts) + [api/ARCHITECTURE.md](api/ARCHITECTURE.md) |
| Extension modules, storage keys, message actions, Privacy Guard | This file (Storage Keys) + [extension/ARCHITECTURE.md](extension/ARCHITECTURE.md) |
| Database tables, columns, indexes, views | [api/DATABASE_GUIDE.md](api/DATABASE_GUIDE.md) |
| New migration file added | [api/migrations/README.md](api/migrations/README.md) |
| CORS config, extension IDs | [api/CHROME_EXTENSIONS.md](api/CHROME_EXTENSIONS.md) |
| Test files added/removed, coverage thresholds, test setup | [tests/README.md](tests/README.md) |
| Website components, design tokens, pages | [website/DESIGN_SYSTEM.md](website/DESIGN_SYSTEM.md) |
| npm scripts, dependencies, dev tooling | This file (Commands) + [.github/copilot-instructions.md](.github/copilot-instructions.md) |
| Coding standards, critical rules, git workflow | This file + [.github/copilot-instructions.md](.github/copilot-instructions.md) |

**Every doc has a self-update reminder at the top. Follow it.**

## Project Overview

Full-stack Chrome extension with Cloudflare Workers backend for AI-powered screenshot analysis. Users capture screen areas, text is extracted via OCR, and AI provides answers.

**Stack:** Chrome Extension (Manifest V3) + Cloudflare Workers + D1 (SQLite) + OpenAI via AI Gateway + Stripe + Resend + Tesseract.js v5

**Tiers:** Free (10 req/day) | Pro ($9.99/mo, 20 req/min unlimited)

## Commands

```bash
npm test                    # Run all tests (Jest, 30 test files)
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
- **Backend URL**: `https://api.captureai.workers.dev`
- **AI Models**: `gpt-4.1-nano` (level 0, fastest) | `gpt-5-nano` low reasoning (level 1, default) | `gpt-5-nano` medium reasoning (level 2, Pro only)
- **Privacy Guard**: `inject.js` in MAIN world overrides `document.hasFocus()`, blocks visibility/focus events, blocks clipboard events, removes AI honeypots. Pro only, requires enabled in settings
- **OCR Flow**: Capture -> Tesseract.js v5 -> if confidence >60% send text only (90% savings) -> else fallback to image
- **Shortcuts**: `Ctrl+Shift+X` capture | `Ctrl+Shift+F` recapture | `Ctrl+Shift+E` toggle panel
- **Rate Limiting**: Cloudflare native Rate Limiting API with 6 presets (AUTH: 5/min, FREE_KEY: 3/min, LICENSE: 10/min, CHECKOUT: 10/min, GLOBAL: 60/min, PRO_AI: 20/min)
- **Auth**: License key system (`XXXX-XXXX-XXXX-XXXX-XXXX`), sent via `Authorization: LicenseKey YOUR-KEY` header
- **Usage Tracking**: Two-table strategy — `usage_records` (per-request) + `usage_daily` (O(1) rate limit checks)

## Storage Keys

```
captureai-license-key          # Current license key
captureai-user-email           # User email
captureai-user-tier            # 'free' or 'pro'
captureai-user-cache           # Cached user object with timestamp
captureai-auto-solve-mode      # Boolean
captureai-ask-mode             # Boolean
captureai-last-capture-area    # {startX, startY, width, height}
captureai-reasoning-level      # 0, 1, or 2
captureai-settings             # {privacyGuard: {enabled, domainBlacklist}, ocr: {disabled}, theme}
captureai-last-usage           # Cached AI response usage stats
captureai-privacy-guard-defaulted  # Auto-enable flag on first Pro upgrade
```

## Coding Standards

- Vanilla JS only, 2-space indentation, single quotes, semicolons required
- Max 100 char lines, 500 line modules, 50 line functions
- JSDoc all public functions
- `camelCase` vars/functions, `UPPER_SNAKE_CASE` constants, `isX`/`hasX`/`canX` booleans, `handleEventName` handlers

## Critical Rules

**Always:** Read files before editing | `textContent` over `innerHTML` | Access state via `window.CaptureAI.STATE`/`CONFIG` | Parameterized DB queries (`.bind()`) | Validate all input | Verify webhook signatures | Try-catch async ops | Check `chrome.runtime.lastError`

**Never:** `innerHTML` with untrusted content | Hardcode secrets | Log sensitive data | Bypass tier restrictions | Deploy without testing | Modify schema without migrations | Commit secrets

## Backend Environment

**Secrets:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `RESEND_API_KEY`, `FROM_EMAIL`
**Env vars:** `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_GATEWAY_NAME`, `FREE_TIER_DAILY_LIMIT`, `PRO_TIER_RATE_LIMIT_PER_MINUTE`, `EXTENSION_URL`, `CHROME_EXTENSION_IDS`

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
- **Migration Scripts**: [api/migrations/README.md](api/migrations/README.md) — all 7 migrations
- **Testing Guide**: [tests/README.md](tests/README.md) — 30 test files, setup, patterns
- **Website Design System**: [website/DESIGN_SYSTEM.md](website/DESIGN_SYSTEM.md) — tokens, components, patterns
