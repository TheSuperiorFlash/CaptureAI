# CLAUDE.md

Development guide for CaptureAI Chrome extension.

## Project Overview

Full-stack Chrome extension with Cloudflare Workers backend for AI-powered screenshot analysis. Users capture screen areas, text is extracted via OCR, and AI provides answers.

**Stack:** Chrome Extension (Manifest V3) + Cloudflare Workers + D1 (SQLite) + OpenAI via AI Gateway + Stripe + Resend + Tesseract.js

**Tiers:** Free (10 req/day) | Pro ($9.99/mo, 20 req/min unlimited)

## Commands

```bash
# Root-level commands
npm test                    # Run all tests (Jest)
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npm run lint                # ESLint
npm run lint:fix            # ESLint auto-fix

# Backend (Cloudflare Workers)
cd api && npm run dev       # Local dev server on http://localhost:8787
cd api && npm run deploy    # Deploy to production
wrangler tail               # Monitor logs

# Backend database
cd api && npm run db:init     # Initialize D1 database
cd api && npm run db:migrate  # Run migrations

# Extension development
# 1. Edit files in extension/
# 2. chrome://extensions → Reload CaptureAI
# 3. Test on a webpage
```

## Project Structure

```
CaptureAI/
├── extension/                    # Chrome Extension source
│   ├── manifest.json             # Manifest V3 config
│   ├── background.js             # Service worker (API communication)
│   ├── content.js                # Content script entry point, module loader
│   ├── inject.js                 # MAIN world script for Privacy Guard
│   ├── popup.html / popup.js / popup.css  # Extension popup UI
│   ├── icons/                    # Extension icons
│   ├── libs/tesseract/           # Tesseract.js OCR library
│   └── modules/                  # Extension modules (17 total)
│       ├── config.js             # CONFIG, TIMING, STORAGE_KEYS, STATE, DOM_CACHE
│       ├── storage.js            # Chrome storage utilities
│       ├── auth-service.js       # Backend API client, license validation
│       ├── ocr-service.js        # OCR text extraction with Tesseract.js
│       ├── domains.js            # Site detection, CSP checking
│       ├── utils.js              # General utilities
│       ├── image-processing.js   # Image crop, compress, OCR integration
│       ├── messaging.js          # Chrome message passing handlers
│       ├── keyboard.js           # Keyboard shortcuts
│       ├── event-manager.js      # Global error handling, cleanup
│       ├── capture-system.js     # Screenshot selection logic
│       ├── auto-solve.js         # Auto-solve mode (Pro only)
│       ├── ui-core.js            # Main UI panel with tier logic
│       ├── ui-components.js      # Reusable UI components, Pro indicators
│       ├── ui-stealthy-result.js # Stealth answer overlay
│       ├── privacy-guard.js      # Privacy protection coordinator
│       └── migration.js          # API key → license key migration
│
├── api/                          # Cloudflare Workers backend
│   ├── wrangler.toml             # Workers config, D1 bindings, env vars
│   ├── schema.sql                # D1 database schema
│   ├── migrations/               # Database migrations
│   └── src/
│       ├── index.js              # Worker entry, CORS, routing
│       ├── router.js             # Request routing
│       ├── auth.js               # License key auth, tier validation
│       ├── subscription.js       # Stripe webhooks, payment handling
│       ├── ai.js                 # AI Gateway integration, usage tracking
│       ├── validation.js         # Input validation, security
│       ├── logger.js             # Structured logging
│       ├── utils.js              # Helpers
│       ├── ratelimit.js          # Rate limiting logic
│       └── durable-objects/
│           └── RateLimiter.js    # Distributed rate limiting (Durable Objects)
│
├── website/                      # Next.js support website (separate app)
├── tests/                        # Jest test suites
│   ├── setup/                    # Chrome mocks, test setup
│   └── unit/                     # Unit tests (~19 test files)
├── config/                       # ESLint, Jest, EditorConfig configs
├── package.json                  # Root deps, test/lint scripts
└── babel.config.js               # Babel config for Jest
```

## Key Concepts

### Module System
All extension modules use ES6 exports, loaded dynamically in `content.js`:
```javascript
const mod = await import(chrome.runtime.getURL('modules/example.js'));
window.CaptureAI.Example = mod.ExampleModule;
```
All modules accessible via `window.CaptureAI` global namespace.

### Storage Keys (from config.js)
```javascript
API_KEY: 'captureai-api-key'
AUTO_SOLVE_MODE: 'captureai-auto-solve-mode'
LAST_CAPTURE_AREA: 'captureai-last-capture-area'
ASK_MODE: 'captureai-ask-mode'
REASONING_LEVEL: 'captureai-reasoning-level'
```

### AI Models & Reasoning
- `gpt-4.1-nano`: Fastest, no reasoning
- `gpt-5-nano` with low reasoning: Default
- `gpt-5-nano` with medium reasoning: Best quality, Pro only

### Privacy Guard System
- `inject.js`: Runs in MAIN world before page scripts; overrides `document.hasFocus()`, blocks `visibilitychange`/`focus`/`blur` events, removes AI honeypot elements
- `privacy-guard.js`: Coordinator module; checks Pro access/settings, verifies MAIN world overrides are active

### OCR Flow
Capture → Tesseract.js extracts text → if confidence >60%, send text only (90% token savings) → else fallback to image

### Keyboard Shortcuts
- `Ctrl+Shift+X`: Start capture
- `Ctrl+Shift+F`: Quick recapture
- `Ctrl+Shift+E`: Toggle panel

### Backend Rate Limiting
Uses Cloudflare Durable Objects (`RateLimiterDO`) for distributed rate limiting. Free: 10/day, Pro: 60/min.

### Webhook Security
Stripe webhooks verified with HMAC SHA256 + timestamp validation (2-min window) + event deduplication via `webhook_events` table + constant-time comparison.

## Coding Standards

- Vanilla JS only (no TypeScript)
- 2-space indentation, single quotes, semicolons required
- Max 100 char line length
- Modules: max 500 lines; functions: max 50 lines
- JSDoc all public functions
- `camelCase` vars/functions, `UPPER_SNAKE_CASE` constants
- Booleans: `isX`, `hasX`, `canX`
- Event handlers: `handleEventName`

## Critical Rules

**Always:**
- Read files before editing
- Use `textContent` for user content (never `innerHTML` with untrusted data)
- Use `STORAGE_KEYS` constants (never hardcode storage keys)
- Access state via `window.CaptureAI.STATE`
- Use parameterized queries in backend (never string concatenation)
- Validate all input (email, license keys, request bodies)
- Verify webhook signatures
- Try-catch all async operations
- Check `chrome.runtime.lastError` in callbacks

**Never:**
- Use `innerHTML` with untrusted content or dynamic code execution
- Hardcode API keys, secrets, or credentials
- Log sensitive data (license keys, emails, tokens)
- Bypass tier restrictions
- Deploy without testing locally
- Modify database schema without migrations
- Commit secrets to git

## Backend Environment

**Secrets (via `wrangler secret put`):**
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `RESEND_API_KEY`, `FROM_EMAIL`

**Env vars (in wrangler.toml):**
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_GATEWAY_NAME`, `FREE_TIER_DAILY_LIMIT`, `PRO_TIER_RATE_LIMIT_PER_MINUTE`, `EXTENSION_URL`, `CHROME_EXTENSION_IDS`

## Manifest Permissions
`storage`, `activeTab`, `scripting`, `contextMenus`, `alarms` + `host_permissions: <all_urls>`

## Git Workflow

Commit format: `<type>(<scope>): <subject>`
Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

## Debugging

- **Background**: `chrome://extensions` → CaptureAI service worker
- **Content**: F12 console on any webpage
- **Popup**: Right-click extension icon → "Inspect popup"
- **State**: `window.CaptureAI.STATE` in content script console
- **Storage**: `await chrome.storage.local.get(null)` in any extension context
