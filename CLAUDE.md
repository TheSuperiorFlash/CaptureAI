# CLAUDE.md

Development guide for CaptureAI Chrome extension.

## Project Overview

Full-stack Chrome extension with Cloudflare Workers backend for AI-powered screenshot analysis. Users capture screen areas, text is extracted via OCR, and AI provides answers.

**Stack:** Chrome Extension (Manifest V3) + Cloudflare Workers + D1 (SQLite) + OpenAI via AI Gateway + Stripe + Resend + Tesseract.js

**Tiers:** Free (10 req/day) | Pro ($9.99/mo, 20 req/min unlimited)

## Commands

```bash
npm test                    # Run all tests (Jest)
npm run lint                # ESLint
npm run lint:fix            # ESLint auto-fix
cd api && npm run dev       # Local dev server on http://localhost:8787
cd api && npm run deploy    # Deploy to production
cd api && npm run db:migrate  # Run migrations
```

## Key Concepts

- **Module System**: ES6 exports loaded dynamically in `content.js`, accessible via `window.CaptureAI` namespace
- **Storage Keys**: Defined in `config.js` as `STORAGE_KEYS` constants (e.g., `captureai-api-key`)
- **AI Models**: `gpt-4.1-nano` (fastest) | `gpt-5-nano` low reasoning (default) | `gpt-5-nano` medium reasoning (Pro only)
- **Privacy Guard**: `inject.js` in MAIN world overrides `document.hasFocus()`, blocks visibility/focus events, removes AI honeypots
- **OCR Flow**: Capture -> Tesseract.js -> if confidence >60% send text only (90% savings) -> else fallback to image
- **Shortcuts**: `Ctrl+Shift+X` capture | `Ctrl+Shift+F` recapture | `Ctrl+Shift+E` toggle panel
- **Rate Limiting**: Cloudflare Durable Objects (`RateLimiterDO`). Free: 10/day, Pro: 20/min

## Coding Standards

- Vanilla JS only, 2-space indentation, single quotes, semicolons required
- Max 100 char lines, 500 line modules, 50 line functions
- JSDoc all public functions
- `camelCase` vars/functions, `UPPER_SNAKE_CASE` constants, `isX`/`hasX`/`canX` booleans, `handleEventName` handlers

## Critical Rules

**Always:** Read files before editing | `textContent` over `innerHTML` | `STORAGE_KEYS` constants | Access state via `window.CaptureAI.STATE`/`CONFIG` | Parameterized DB queries | Validate all input | Verify webhook signatures | Try-catch async ops | Check `chrome.runtime.lastError`

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

- **Chrome Extension Config**: [api/CHROME_EXTENSIONS.md](api/CHROME_EXTENSIONS.md)
- **Database Guide**: [api/DATABASE_GUIDE.md](api/DATABASE_GUIDE.md)
- **Security Audit**: [api/SECURITY_FIXES.md](api/SECURITY_FIXES.md)
- **Backend Improvements**: [api/IMPROVEMENTS_IMPLEMENTED.md](api/IMPROVEMENTS_IMPLEMENTED.md)
- **Migration Scripts**: [api/migrations/README.md](api/migrations/README.md)
- **Testing Guide**: [tests/README.md](tests/README.md)
- **Website Design System**: [website/DESIGN_SYSTEM.md](website/DESIGN_SYSTEM.md)
