# CaptureAI Production Deployment Plan

Comprehensive, step-by-step plan to deploy CaptureAI v2.0.0 to the Chrome Web Store and acquire real paying users. Every task specifies exact files, exact changes, and verification steps.

---

## Current State

### Done
| Component | Status | Details |
|-----------|--------|---------|
| Chrome Extension | Feature-complete v2.0.0 | Manifest V3, OCR, auto-solve, privacy guard, stealth mode |
| Backend | Deployed at `api.captureai.workers.dev` | Auth, AI proxy, Stripe, rate limiting, email |
| D1 Database | Schema + migrations exist | users, usage_records, webhook_events tables |
| Stripe | Working in **test** mode | Checkout, webhooks, subscription lifecycle |
| Website | Live on Vercel at `captureai.dev` | All pages: /, /activate, /payment-success, /privacy, /terms, /pricing, /download, /help, /contact |
| Secrets | All configured | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PRO, RESEND_API_KEY, FROM_EMAIL |
| Security | 13 vulnerabilities fixed | Crypto keys, CORS lockdown, rate limiting, security headers |

### Remaining Gaps
| # | Gap | Severity | Phase |
|---|-----|----------|-------|
| 1 | 12 of 19 test suites fail (path resolution + `importScripts`) | High | 1 |
| 2 | Jest coverage paths point to project root, not `extension/` | Medium | 1 |
| 3 | Stale `thesuperiorflash.github.io` in CORS allow lists | Medium | 2 |
| 4 | `manifest.json` `homepage_url` points to GitHub | Medium | 2 |
| 5 | `manifest.json` `description` is generic | Low | 2 |
| 6 | Backend health endpoint doesn't verify D1 connectivity | Medium | 2 |
| 7 | Backend router says `version: '1.0.0'`, extension is `2.0.0` | Low | 2 |
| 8 | Stale URLs in README.md and docs/CLAUDE.md | Low | 2 |
| 9 | Test seed user (`TEST-FREE-KEY-12345`) may exist in production D1 | Medium | 2 |
| 10 | `api/.wrangler/tmp/` build artifacts not gitignored | Low | 2 |
| 11 | `schema.sql` contains test INSERT statement | Low | 2 |
| 12 | No CI/CD pipeline (GitHub Actions) | High | 3 |
| 13 | No `build:extension` packaging script | Medium | 3 |
| 14 | No Chrome Web Store assets (screenshots, description) | High | 4 |
| 15 | Chrome Web Store privacy practices not filled in | High | 4 |
| 16 | Stripe not yet in live mode | High | 5 |
| 17 | No uptime monitoring or alerting | Medium | 6 |
| 18 | No operational runbooks documented | Low | 6 |

### Decision Log
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Permission narrowing (`<all_urls>` refactor) | **Keep as-is** | PrivacyGuard requires content scripts to run on page load. Prepare strong CWS justifications instead. |
| Old GitHub Pages CORS origin | **Remove** | Old site is no longer used. Tighten CORS to `captureai.dev` only. |

---

## Phase 1: Fix the Test Suite

### Task 1.1 — Add `importScripts` mock to test setup

**Why:** `background.js` line 27 calls `importScripts('modules/auth-service.js', 'modules/migration.js')` — a service worker API that doesn't exist in Node.js. Any test that `require()`s `background.js` crashes immediately with `ReferenceError: importScripts is not defined`.

**File:** `/home/user/CaptureAI/tests/setup/test-setup.js`

**Change:** Add this line before the existing code:
```javascript
// Mock importScripts (service worker API not available in Node.js/Jest)
global.importScripts = jest.fn();
```

**Verification:** After this change alone, `require('../../extension/background.js')` in a Node REPL should not throw.

---

### Task 1.2 — Fix import paths in all 12 broken test files

**Why:** Tests use `require('../../background.js')` which resolves to project root. The file lives at `extension/background.js`. Similarly, 3 module-importing tests use `../../modules/` instead of `../../extension/modules/`.

**Files to modify (change the `require`/`import` path):**

| File | Current import | Fixed import |
|------|---------------|--------------|
| `tests/unit/edge-cases.test.js:15` | `require('../../background.js')` | `require('../../extension/background.js')` |
| `tests/unit/format-error.test.js:8` | `require('../../background.js')` | `require('../../extension/background.js')` |
| `tests/unit/message-builder.test.js:13` | `require('../../background.js')` | `require('../../extension/background.js')` |
| `tests/unit/message-handlers.test.js` | `require('../../background.js')` | `require('../../extension/background.js')` |
| `tests/unit/openai-api.test.js` | `require('../../background.js')` | `require('../../extension/background.js')` |
| `tests/unit/screenshot.test.js:9` | `require('../../background.js')` | `require('../../extension/background.js')` |
| `tests/unit/storage.test.js:9` | `require('../../background.js')` | `require('../../extension/background.js')` |
| `tests/unit/url-validator.test.js` | `require('../../background.js')` | `require('../../extension/background.js')` |
| `tests/unit/auto-solve-module.test.js:9` | `from '../../modules/auto-solve.js'` | `from '../../extension/modules/auto-solve.js'` |
| `tests/unit/utils-functions.test.js:8` | `from '../../modules/utils.js'` | `from '../../extension/modules/utils.js'` |
| `tests/unit/domains-utils.test.js` | `from '../../modules/domains.js'` | `from '../../extension/modules/domains.js'` |

Also check any other test files that import from `../../modules/` and update them similarly.

**Verification:** `npm test` — all 19 suites should pass, 165+ tests green.

---

### Task 1.3 — Fix `collectCoverageFrom` paths in jest.config.js

**Why:** Coverage collection targets `background.js` and `modules/**/*.js` at the project root, but those files are under `extension/`. Coverage reports show 0% because no matching files are found.

**File:** `/home/user/CaptureAI/config/jest.config.js` (lines 21-28)

**Change from:**
```javascript
collectCoverageFrom: [
  'background.js',
  'modules/**/*.js',
  'popup.js',
  ...
],
```

**Change to:**
```javascript
collectCoverageFrom: [
  'extension/background.js',
  'extension/modules/**/*.js',
  'extension/popup.js',
  '!**/node_modules/**',
  '!**/tests/**',
  '!**/__tests__/**'
],
```

**Verification:** `npm run test:coverage` shows actual coverage percentages for `extension/background.js` and `extension/modules/*.js`.

---

### Task 1.4 — Set meaningful coverage thresholds

**Why:** Current thresholds are all 0% (the config has a TODO comment to raise to 70%). Start conservatively.

**File:** `/home/user/CaptureAI/config/jest.config.js` (lines 33-39)

**Change from:**
```javascript
coverageThreshold: {
  global: {
    statements: 0,
    branches: 0,
    functions: 0,
    lines: 0
  }
},
```

**Change to:**
```javascript
coverageThreshold: {
  global: {
    statements: 30,
    branches: 20,
    functions: 30,
    lines: 30
  }
},
```

**Verification:** `npm run test:coverage` passes. Adjust thresholds up or down based on actual coverage numbers.

---

## Phase 2: Code Fixes

### Task 2.1 — Remove stale GitHub Pages origin from CORS allow lists

**Why:** `thesuperiorflash.github.io` is the old site. Keeping it in CORS widens the attack surface for no benefit.

**File 1:** `/home/user/CaptureAI/api/src/index.js` (lines 152-155)

**Change from:**
```javascript
const allowedOrigins = [
  'https://captureai.dev',
  'https://thesuperiorflash.github.io',
];
```
**Change to:**
```javascript
const allowedOrigins = [
  'https://captureai.dev',
];
```

**File 2:** `/home/user/CaptureAI/api/src/utils.js` (lines 51-54)

**Same change** — remove `'https://thesuperiorflash.github.io'` from the `allowedOrigins` array.

**Verification:** Deploy the Worker (`cd api && npx wrangler deploy`). Then:
```bash
curl -I -H "Origin: https://thesuperiorflash.github.io" https://api.captureai.workers.dev/health
# Access-Control-Allow-Origin should be 'null', NOT the old origin

curl -I -H "Origin: https://captureai.dev" https://api.captureai.workers.dev/health
# Access-Control-Allow-Origin should be 'https://captureai.dev'
```

---

### Task 2.2 — Fix `homepage_url` in manifest.json

**File:** `/home/user/CaptureAI/extension/manifest.json` (line 8)

**Change from:**
```json
"homepage_url": "https://github.com/TheSuperiorFlash/CaptureAI",
```
**Change to:**
```json
"homepage_url": "https://captureai.dev",
```

**Verification:** Load unpacked extension, click the "Homepage" link in `chrome://extensions` — it should open `captureai.dev`.

---

### Task 2.3 — Improve manifest description for CWS search

**File:** `/home/user/CaptureAI/extension/manifest.json` (line 7)

**Change from:**
```json
"description": "AI-powered question capture tool",
```
**Change to (max 132 chars):**
```json
"description": "Screenshot any question and get instant AI answers. Uses OCR for text extraction, with stealth mode and auto-solve.",
```

**Verification:** Load unpacked, confirm the description in `chrome://extensions` reads correctly.

---

### Task 2.4 — Align backend version with extension version

**File:** `/home/user/CaptureAI/api/src/router.js`

**Line 31** — change `version: '1.0.0'` to `version: '2.0.0'`
**Line 42** — change `version: '1.0.0'` to `version: '2.0.0'`

**Verification:** `curl https://api.captureai.workers.dev/health` returns `"version": "2.0.0"`.

---

### Task 2.5 — Upgrade /health endpoint to verify D1 connectivity

**Why:** Current `/health` returns static JSON with no database check. A real health check should verify D1 is reachable so uptime monitors can detect database outages.

**File:** `/home/user/CaptureAI/api/src/router.js` (lines 37-44)

**Replace the existing health check block with:**
```javascript
if (path === '/health' && method === 'GET') {
  try {
    const dbCheck = await this.env.DB.prepare('SELECT 1 AS ok').first();
    return jsonResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'CaptureAI Workers Backend',
      version: '2.0.0',
      database: dbCheck?.ok === 1 ? 'connected' : 'error'
    });
  } catch (error) {
    return jsonResponse({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      service: 'CaptureAI Workers Backend',
      version: '2.0.0',
      database: 'error'
    }, 503);
  }
}
```

**Verification:** `curl https://api.captureai.workers.dev/health` returns `"database": "connected"`.

---

### Task 2.6 — Update stale URLs in README.md

**File:** `/home/user/CaptureAI/README.md` (line 50)

**Change from:**
```markdown
2. Visit the [activation page](https://thesuperiorflash.github.io/CaptureAI/activate.html)
```
**Change to:**
```markdown
2. Visit the [activation page](https://captureai.dev/activate)
```

Scan the rest of the file for any other `thesuperiorflash.github.io` or stale links and fix them.

**Verification:** `grep "thesuperiorflash" README.md` returns no results.

---

### Task 2.7 — Update stale URLs in docs/CLAUDE.md

**File:** `/home/user/CaptureAI/docs/CLAUDE.md`

**Find and replace all occurrences:**
| Find | Replace with |
|------|-------------|
| `captureai-backend.thesuperiorflash.workers.dev` | `api.captureai.workers.dev` |
| `https://thesuperiorflash.github.io/CaptureAI` | `https://captureai.dev` |
| `thesuperiorflash.github.io` | `captureai.dev` |

Affected lines: approximately 377, 752, 815, 1072, 1075, 1187, 1188.

**Verification:** `grep "thesuperiorflash" docs/CLAUDE.md` returns no results.

---

### Task 2.8 — Clean up stale wrangler build artifacts

**Why:** `/home/user/CaptureAI/api/.wrangler/tmp/` contains old compiled Worker bundles with stale URLs. These should not be tracked in git.

**File:** `/home/user/CaptureAI/.gitignore`

**Add the line:**
```
api/.wrangler/
```

**Then run:**
```bash
rm -rf api/.wrangler/tmp/
git rm -r --cached api/.wrangler/ 2>/dev/null || true
```

**Verification:** `ls api/.wrangler/tmp/` shows directory is gone. `git status` shows `api/.wrangler/` in `.gitignore`.

---

### Task 2.9 — Remove test seed user from production D1

**Why:** `schema.sql` lines 72-74 insert a test user `TEST-FREE-KEY-12345`. This should not exist in the production database.

**Command (run manually — NOT a code change):**
```bash
cd api && npx wrangler d1 execute captureai-db --remote --command "DELETE FROM users WHERE license_key = 'TEST-FREE-KEY-12345'"
```

**Verify:**
```bash
cd api && npx wrangler d1 execute captureai-db --remote --command "SELECT COUNT(*) as count FROM users WHERE license_key = 'TEST-FREE-KEY-12345'"
```
Should return `count: 0`.

---

### Task 2.10 — Remove test INSERT from schema.sql

**Why:** Prevents accidentally re-creating the test user if the schema is re-applied.

**File:** `/home/user/CaptureAI/api/schema.sql` (lines 72-74)

**Remove these lines entirely:**
```sql
-- Create a default free user (for testing)
INSERT INTO users (id, license_key, email, tier)
VALUES ('test-user-id', 'TEST-FREE-KEY-12345', 'test@example.com', 'free');
```

**Verification:** `grep 'TEST-FREE-KEY' api/schema.sql` returns no results.

---

### Task 2.11 — Verify database schema and indexes are current

**Commands (run manually):**
```bash
cd api && npx wrangler d1 migrations apply captureai-db --remote

npx wrangler d1 execute captureai-db --remote --command "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'index') ORDER BY type, name"
```

**Expected tables:** `users`, `usage_records`, `webhook_events`
**Expected indexes:** All 12 indexes from `schema.sql` (idx_users_license_key, idx_users_email, idx_users_stripe_customer, idx_users_stripe_subscription, idx_users_tier, idx_users_created_at, idx_usage_records_user_id, idx_usage_records_created_at, idx_usage_records_user_date, idx_usage_records_model, idx_usage_records_cost, idx_usage_records_user_cost, idx_webhook_events_event_id, idx_webhook_events_created_at)

---

## Phase 3: CI/CD Pipeline

### Task 3.1 — Create GitHub Actions CI workflow

**File to create:** `/home/user/CaptureAI/.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test

  package:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - name: Package extension
        run: |
          cd extension && zip -r ../captureai-extension.zip . \
            -x '*.DS_Store' -x '__MACOSX/*'
      - name: Report zip size
        run: ls -lh captureai-extension.zip
      - uses: actions/upload-artifact@v4
        with:
          name: captureai-extension-${{ github.sha }}
          path: captureai-extension.zip
          retention-days: 30
```

**Verification:** Push to a branch, open a PR against `main`, confirm all 3 jobs (lint, test, package) pass green. The `package` job should upload the zip as a downloadable artifact.

---

### Task 3.2 — Add `build:extension` script to root package.json

**File:** `/home/user/CaptureAI/package.json`

**Add to the `"scripts"` object:**
```json
"build:extension": "cd extension && zip -r ../captureai-extension.zip . -x '*.DS_Store' -x '__MACOSX/*' -x '.git*'"
```

**Verification:** `npm run build:extension` creates `captureai-extension.zip` in the project root. Unzip it somewhere and confirm it contains `manifest.json`, `background.js`, `content.js`, `popup.html`, `icons/`, `modules/`, `libs/`.

---

### Task 3.3 — Add `deploy:api` script to root package.json

**File:** `/home/user/CaptureAI/package.json`

**Add to the `"scripts"` object:**
```json
"deploy:api": "cd api && npx wrangler deploy"
```

**Verification:** `npm run deploy:api` deploys the Worker to Cloudflare.

---

## Phase 4: Chrome Web Store Assets and Submission

### Task 4.1 — Create Chrome Web Store screenshots

**Not a code change — create these assets manually.**

You need **3-5 screenshots** at **1280x800** or **640x400** resolution:

1. **Extension popup** — Show the popup with a license key entered and tier status visible (free or pro). Take a screenshot of the Chrome extension popup in its dark/light theme.

2. **Capture selection** — Navigate to a webpage with visible questions (e.g., a quiz site), press Ctrl+Shift+X, and screenshot the selection overlay highlighting a question area.

3. **AI answer result** — After a successful capture, screenshot the floating answer panel showing the AI response with the answer, usage stats, and the reasoning indicator.

4. **Auto-solve in action** — Navigate to Vocabulary.com, enable auto-solve, screenshot it actively solving a question.

5. **Ask mode** — Show the Ask mode text input with a typed question and the AI response.

**How to take these:**
- Load the unpacked extension from `extension/` in Chrome
- Use Chrome DevTools device toolbar or Window Resizer extension to set the viewport to 1280x800
- Take full-window screenshots (not just the extension popup)
- Annotate if desired with arrows or callouts

**Save to:** `store-assets/screenshots/` (create this directory)

---

### Task 4.2 — Create promotional tile

**Not a code change.**

Create a **440x280** branded image. Include:
- CaptureAI logo (from `extension/icons/icon128.png`)
- Tagline: "Screenshot. Capture. Answer."
- Blue/dark color scheme matching the website

**Save to:** `store-assets/promotional-tile.png`

---

### Task 4.3 — Write detailed Chrome Web Store description

**Not a code change — prepare this text for the CWS Developer Dashboard.**

```
CaptureAI — Screenshot Any Question, Get Instant AI Answers

CaptureAI is an AI-powered Chrome extension that lets you capture any question on your screen and get instant, accurate answers using advanced AI and OCR technology.

HOW IT WORKS
1. Press Ctrl+Shift+X (or click the extension icon)
2. Select the area containing your question
3. Get an instant AI-powered answer

KEY FEATURES

🔍 Smart Screenshot Capture
Select any area on any webpage. CaptureAI uses OCR (Optical Character Recognition) to extract text from your selection, reducing AI processing costs by 90%.

⚡ Quick Capture
Press Ctrl+Shift+F to instantly re-capture the same screen area — perfect for progressing through question sets.

💬 Ask Mode
Type any question directly and get an AI answer. Pro users can attach images for visual questions.

🛡️ Privacy Guard (Pro)
Prevents websites from detecting that you're using the extension. Blocks canvas fingerprinting and other detection methods.

👻 Stealth Mode
Hide the UI panel completely. Answers appear as subtle overlays that only you can see. Toggle with Ctrl+Shift+E.

🤖 Auto-Solve (Pro)
Automatically detects and answers multiple-choice questions on supported sites like Vocabulary.com.

📊 AI Reasoning Levels (Pro)
Adjust how deeply the AI thinks about your question — from quick answers to detailed reasoning.

TIERS

Free — 10 requests per day, all core features
Pro ($9.99/month) — Unlimited requests, auto-solve, image attachments, privacy guard, reasoning levels

KEYBOARD SHORTCUTS
• Ctrl+Shift+X — Start capture
• Ctrl+Shift+F — Quick capture (repeat last area)
• Ctrl+Shift+E — Toggle UI panel
• Escape — Cancel capture / Stop auto-solve

PRIVACY
• OCR processing happens locally in your browser — your screenshots are not stored
• Only extracted text is sent to the AI for processing
• License key stored locally in Chrome storage
• Full privacy policy: https://captureai.dev/privacy

SUPPORT
Visit https://captureai.dev for documentation, activation, and support.
```

---

### Task 4.4 — Prepare privacy practices disclosure for CWS Developer Dashboard

**Not a code change — fill this in on the Chrome Web Store Developer Dashboard.**

**Single purpose description:**
> "Captures screen regions on any webpage and uses OCR text extraction combined with AI to analyze and answer questions from the captured content."

**Permission justifications:**

| Permission | Justification |
|-----------|---------------|
| `host_permissions: <all_urls>` | Required for `chrome.tabs.captureVisibleTab()` to screenshot any page the user is viewing, and for content script injection to display the capture overlay and answer UI on any webpage. The extension also includes Privacy Guard, which needs to run on page load to prevent detection by websites. |
| `activeTab` | Captures the current tab's visible content when the user triggers a screenshot via keyboard shortcut or popup. |
| `scripting` | Injects the capture overlay, OCR processing, and answer display UI into the active page. |
| `storage` | Stores the user's license key, preferences (reasoning level, privacy guard toggle), and capture settings in Chrome's local storage. |
| `contextMenus` | Adds a "Capture with CaptureAI" option to the right-click context menu. |
| `alarms` | Runs periodic license key validation (every 24 hours) to check subscription status. |

**Data usage certification:**

| Data type | Collected? | Details |
|-----------|-----------|---------|
| Email address | Yes | Collected during license key activation only. Used to send the license key via email. Not shared with third parties. |
| Screenshot/image data | Yes (transient) | Captured screen regions are sent to OpenAI API for AI analysis. Images are NOT stored on our servers — they are processed and discarded. |
| Authentication info | Yes | License keys are stored locally and sent to our backend for validation. |
| Browsing history | No | |
| Financial data | No | Payments are handled entirely by Stripe. We never see or store card details. |
| Location | No | |
| Health info | No | |
| Web content | Yes (transient) | OCR-extracted text from screenshots is sent to OpenAI for processing. Not stored. |

---

### Task 4.5 — Package and submit the extension

**Prerequisites:** All code changes from Phases 1-3 are committed and deployed.

**Step 1 — Verify the version:**
```bash
grep '"version"' extension/manifest.json
# Should show "2.0.0" (or "2.0.1" if code changes warranted a bump)
```

**Step 2 — Package:**
```bash
npm run build:extension
ls -lh captureai-extension.zip
# Note the file size. Tesseract + lang data is ~4-5MB.
```

**Step 3 — Verify the zip contents:**
```bash
unzip -l captureai-extension.zip | head -30
# Should include: manifest.json, background.js, content.js, popup.html,
# popup.js, inject.js, icons/, modules/, libs/tesseract/
# Should NOT include: tests/, api/, website/, docs/, node_modules/, .git/
```

**Step 4 — Submit to Chrome Web Store:**
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Select the existing listing (ID: `idpdleplccjjbmdmjkppmkecmoeomnjd`) or create a new one
3. Upload `captureai-extension.zip`
4. Fill in:
   - **Detailed description:** Paste the text from Task 4.3
   - **Screenshots:** Upload the 3-5 screenshots from Task 4.1
   - **Promotional tile:** Upload from Task 4.2
   - **Category:** Productivity
   - **Language:** English
   - **Privacy policy URL:** `https://captureai.dev/privacy`
5. Complete the **Privacy Practices** tab using the data from Task 4.4
6. Click **Submit for Review**

**Expected review timeline:** 1-3 business days. Extensions with `<all_urls>` will likely get a human review, which can take longer. If the extension has been previously listed, updates may be faster.

---

### Task 4.6 — If rejected: common fixes

| Rejection reason | Fix |
|-----------------|-----|
| "Broad host permission not justified" | Update the privacy practices justification with more specific detail about PrivacyGuard needing page-load injection. Emphasize that screenshotting any page is the core feature. |
| "Single purpose violation" | Ensure the description clearly states one purpose: "capture and answer questions from screenshots." Remove any tangential feature descriptions. |
| "Misleading description/screenshots" | Ensure screenshots show real functionality, not mock-ups. Remove any feature claims not implemented. |
| "Content policy: academic dishonesty" | The Terms of Service at `/terms` already states users are responsible for academic integrity compliance. Reference this in the description if needed. |

---

## Phase 5: Stripe Live Mode

### Task 5.1 — Create live Stripe products (Stripe Dashboard — not code)

1. Log into [Stripe Dashboard](https://dashboard.stripe.com) in **live mode** (toggle in top-left)
2. Go to **Products** → **Add product**
3. Create: Name = "CaptureAI Pro", Price = $9.99/month (recurring, monthly)
4. Note the **live Price ID** (format: `price_xxxxx`)
5. Go to **Developers** → **Webhooks** → **Add endpoint**
6. URL: `https://api.captureai.workers.dev/api/subscription/webhook`
7. Events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
8. Note the **Webhook Signing Secret** (format: `whsec_xxxxx`)
9. Go to **Developers** → **API keys** → Note the **live Secret key** (format: `sk_live_xxxxx`)

---

### Task 5.2 — Update Cloudflare Worker secrets with live Stripe keys

**Commands (interactive — prompts for secret value):**
```bash
cd api
npx wrangler secret put STRIPE_SECRET_KEY
# Paste: sk_live_xxxxx

npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste: whsec_xxxxx

npx wrangler secret put STRIPE_PRICE_PRO
# Paste: price_xxxxx
```

**Verification:**
```bash
npx wrangler secret list
# Should show STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PRO
# (plus RESEND_API_KEY, FROM_EMAIL)
```

---

### Task 5.3 — Deploy the updated Worker

```bash
cd api && npx wrangler deploy
```

This deploys with the new secrets. The code reads secrets from `env` at runtime, so no code change is needed.

---

### Task 5.4 — Verify the live payment flow end-to-end

1. Go to `https://captureai.dev/activate`
2. Enter your own email, select Free tier, get a free license key
3. Install the extension, activate with the free key
4. Click "Upgrade to Pro" (or go to `/activate` and select Pro tier with same email)
5. Complete Stripe checkout **with a real card** ($9.99 charge)
6. After checkout redirects to `/payment-success?session_id=...`:
   - Confirm the page shows "Payment successful"
   - Check email for the Pro license key
7. In the D1 database, verify:
   ```bash
   cd api && npx wrangler d1 execute captureai-db --remote \
     --command "SELECT email, tier, subscription_status FROM users WHERE email = 'YOUR_EMAIL'"
   ```
   Should show `tier: 'pro'`, `subscription_status: 'active'`.
8. In the extension, verify Pro features are unlocked (auto-solve, image attachments, reasoning slider)
9. **Refund the charge** in Stripe Dashboard → Payments → find the charge → Refund
10. Cancel the subscription in Stripe Dashboard → Customers → find customer → Cancel subscription
11. Verify the cancellation webhook fires:
   ```bash
   cd api && npx wrangler d1 execute captureai-db --remote \
     --command "SELECT email, tier, subscription_status FROM users WHERE email = 'YOUR_EMAIL'"
   ```
   Should now show `subscription_status: 'cancelled'` or `'inactive'`.

---

## Phase 6: Post-Launch Monitoring and Operations

### Task 6.1 — Set up uptime monitoring

Use [UptimeRobot](https://uptimerobot.com) (free tier — 50 monitors, 5-min intervals):

1. Create account at uptimerobot.com
2. Add monitor:
   - Type: HTTP(S)
   - URL: `https://api.captureai.workers.dev/health`
   - Monitoring interval: 5 minutes
   - Alert contacts: Your email
3. Add second monitor:
   - URL: `https://captureai.dev`
   - Monitoring interval: 5 minutes

**Verification:** Intentionally break the Worker (temporarily), confirm you receive an alert email within 5-10 minutes.

---

### Task 6.2 — Set up Stripe webhook failure alerts

In Stripe Dashboard:
1. Go to **Developers** → **Webhooks** → Select your endpoint
2. Enable email notifications for failed deliveries
3. Periodically run:
   ```bash
   cd api && npx wrangler d1 execute captureai-db --remote \
     --command "SELECT email, subscription_status FROM users WHERE subscription_status = 'past_due'"
   ```

---

### Task 6.3 — Document operational runbooks

**File to create:** `/home/user/CaptureAI/docs/RUNBOOKS.md`

Contents:

```markdown
# CaptureAI Operational Runbooks

## Deploy a Backend Update
cd api && npx wrangler deploy

## Deploy an Extension Update
1. Increment version in extension/manifest.json
2. npm run build:extension
3. Upload captureai-extension.zip to Chrome Web Store Developer Dashboard
4. Submit for review (1-3 business days)

## Stream Live Worker Logs
cd api && npx wrangler tail

## Look Up a User by Email
cd api && npx wrangler d1 execute captureai-db --remote \
  --command "SELECT id, email, tier, subscription_status, created_at FROM users WHERE email = 'user@example.com'"

## Look Up a User by License Key
cd api && npx wrangler d1 execute captureai-db --remote \
  --command "SELECT id, email, tier, subscription_status FROM users WHERE license_key = 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX'"

## Check User's Daily Usage
cd api && npx wrangler d1 execute captureai-db --remote \
  --command "SELECT COUNT(*) as requests_today FROM usage_records WHERE user_id = 'USER_ID' AND created_at >= date('now')"

## Manually Upgrade a User to Pro (comp/support)
cd api && npx wrangler d1 execute captureai-db --remote \
  --command "UPDATE users SET tier = 'pro', subscription_status = 'active', updated_at = datetime('now') WHERE email = 'user@example.com'"

## Manually Downgrade a User
cd api && npx wrangler d1 execute captureai-db --remote \
  --command "UPDATE users SET tier = 'free', subscription_status = 'inactive', updated_at = datetime('now') WHERE email = 'user@example.com'"

## Roll Back a Bad Worker Deploy
cd api && npx wrangler rollback

## Reprocess a Failed Stripe Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Find the failed event
3. Click "Resend"

## Check Database Health
cd api && npx wrangler d1 execute captureai-db --remote \
  --command "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'index') ORDER BY type, name"

## Count Total Users
cd api && npx wrangler d1 execute captureai-db --remote \
  --command "SELECT tier, COUNT(*) as count FROM users GROUP BY tier"

## Count Requests Today
cd api && npx wrangler d1 execute captureai-db --remote \
  --command "SELECT COUNT(*) as total, SUM(total_cost) as cost FROM usage_records WHERE created_at >= date('now')"

## Revenue Query (Monthly)
cd api && npx wrangler d1 execute captureai-db --remote \
  --command "SELECT COUNT(*) as pro_users FROM users WHERE tier = 'pro' AND subscription_status = 'active'"
```

---

## Phase 7: Growth and Iteration (Post-Launch)

### Task 7.1 — Monitor Chrome Web Store reviews

Check the CWS Developer Dashboard weekly for:
- New reviews (respond promptly to negative reviews)
- Install/uninstall rates
- Rating trends

---

### Task 7.2 — Add in-extension feedback mechanism

**File:** `/home/user/CaptureAI/extension/popup.html`

Add a "Report an Issue" link at the bottom of the popup that opens `https://captureai.dev/contact` or `https://github.com/TheSuperiorFlash/CaptureAI/issues`.

---

### Task 7.3 — Track analytics from usage_records

Key D1 queries to run weekly:

```sql
-- Daily active users (last 7 days)
SELECT date(created_at) as day, COUNT(DISTINCT user_id) as dau
FROM usage_records
WHERE created_at >= date('now', '-7 days')
GROUP BY day ORDER BY day;

-- OCR vs image mode ratio
SELECT prompt_type, COUNT(*) as count
FROM usage_records
WHERE created_at >= date('now', '-7 days')
GROUP BY prompt_type;

-- Average response time
SELECT AVG(response_time) as avg_ms, MAX(response_time) as max_ms
FROM usage_records
WHERE created_at >= date('now', '-7 days');

-- Free to Pro conversion rate
SELECT
  (SELECT COUNT(*) FROM users WHERE tier = 'pro') as pro_users,
  (SELECT COUNT(*) FROM users) as total_users;

-- Daily API cost
SELECT date(created_at) as day, SUM(total_cost) as cost_usd
FROM usage_records
WHERE created_at >= date('now', '-30 days')
GROUP BY day ORDER BY day;
```

---

### Task 7.4 — Monitor OpenAI API costs

Check the Cloudflare AI Gateway dashboard (`dash.cloudflare.com` → AI Gateway → `captureai-gateway`) weekly for:
- Request volume
- Cache hit rate (higher = lower cost)
- Cost per request

If costs rise unexpectedly:
- Check if OCR confidence threshold (60%) needs tuning
- Check for abuse patterns (many requests from single license key)
- Consider enabling Cloudflare AI Gateway response caching more aggressively

---

## Pre-Launch Checklist

Every box must be checked before CWS submission:

### Code
- [ ] 12 broken test suites fixed (Phase 1, Tasks 1.1-1.2)
- [ ] Coverage paths corrected (Phase 1, Task 1.3)
- [ ] Stale CORS origins removed from `api/src/index.js` and `api/src/utils.js` (Phase 2, Task 2.1)
- [ ] `homepage_url` updated in manifest (Phase 2, Task 2.2)
- [ ] Manifest description improved (Phase 2, Task 2.3)
- [ ] Backend version aligned to 2.0.0 (Phase 2, Task 2.4)
- [ ] Health endpoint verifies D1 connectivity (Phase 2, Task 2.5)
- [ ] README URLs updated (Phase 2, Task 2.6)
- [ ] CLAUDE.md URLs updated (Phase 2, Task 2.7)
- [ ] Wrangler build artifacts cleaned and gitignored (Phase 2, Task 2.8)
- [ ] Test seed user removed from production D1 (Phase 2, Task 2.9)
- [ ] Test INSERT removed from schema.sql (Phase 2, Task 2.10)
- [ ] Database schema and indexes verified (Phase 2, Task 2.11)

### CI/CD
- [ ] GitHub Actions workflow created and passing (Phase 3, Task 3.1)
- [ ] `build:extension` script works (Phase 3, Task 3.2)
- [ ] `deploy:api` script works (Phase 3, Task 3.3)

### Backend
- [x] All Cloudflare secrets configured (pre-existing)
- [x] Email delivery via Resend confirmed (pre-existing)
- [x] CORS restricted to production extension ID (pre-existing)
- [ ] Stale CORS origin removed (Phase 2, Task 2.1)
- [ ] Worker deployed with all code fixes (after Phase 2)

### Extension
- [ ] All features manually tested end-to-end (before submission)
- [ ] Manifest metadata correct (homepage_url, description, version)
- [ ] Extension packaged as clean zip
- [ ] No console errors in normal operation

### Website
- [x] All pages live on Vercel (pre-existing)
- [x] /activate flow works (pre-existing)
- [x] /payment-success flow works (pre-existing)
- [x] Privacy policy and Terms of Service live (pre-existing)
- [ ] Verify footer/nav links all point to live URLs

### Chrome Web Store
- [ ] 3-5 screenshots at 1280x800 (Phase 4, Task 4.1)
- [ ] Promotional tile at 440x280 (Phase 4, Task 4.2)
- [ ] Detailed description written (Phase 4, Task 4.3)
- [ ] Privacy practices completed (Phase 4, Task 4.4)
- [ ] Extension zip uploaded and submitted for review (Phase 4, Task 4.5)

### Stripe Live
- [ ] Live Stripe products created (Phase 5, Task 5.1)
- [ ] Worker secrets updated with live keys (Phase 5, Task 5.2)
- [ ] Worker deployed with live keys (Phase 5, Task 5.3)
- [ ] Full payment flow verified with real card (Phase 5, Task 5.4)

### Operations
- [ ] Uptime monitoring configured (Phase 6, Task 6.1)
- [ ] Stripe webhook alerts enabled (Phase 6, Task 6.2)
- [ ] Runbooks documented (Phase 6, Task 6.3)

---

## Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | CWS rejects due to `<all_urls>` + `content_scripts` on all pages | Medium | High — blocks launch | Prepare detailed permission justifications (Task 4.4). Emphasize PrivacyGuard requires page-load injection. If still rejected, consider refactoring PrivacyGuard to use `chrome.scripting.registerContentScripts()` dynamically. |
| 2 | CWS rejects due to `wasm-unsafe-eval` CSP | Very Low | Medium | Legitimate for Tesseract.js WASM. Chrome team accepts this. |
| 3 | CWS review delays beyond 3 days | Medium | Low | Nothing to do but wait. Do not submit multiple times — it resets the queue. |
| 4 | Stripe webhook delivery failures | Low | High — users pay but don't get Pro | Monitor Stripe webhook dashboard. Manual DB correction via runbook. |
| 5 | OpenAI API cost overruns at scale | Medium | Medium | AI Gateway caching; OCR reduces tokens by 90%; daily cost monitoring query. Set a Cloudflare spend limit. |
| 6 | Users bypass free tier limits | Low | Low | Rate limits are per-license-key in D1. Multiple accounts with disposable emails are blocked by the 27+ domain blocklist. |
| 7 | `inject.js` PrivacyGuard causes CWS MAIN world scrutiny | Medium | Medium | Document that it only activates for Pro users who explicitly enable it. It overrides visibility APIs for legitimate privacy protection, not for malicious purposes. |

---

## Phase Dependencies

```
Phase 1 (Tests)  ───┐
                     ├──► Phase 3 (CI/CD) ──┐
Phase 2 (Code Fixes) ┘                      │
                                             ├──► Phase 4 (CWS Submission)
Phase 4.1-4.4 (Assets — parallel) ──────────┘         │
                                                       │
Phase 5 (Stripe Live — parallel with Phase 4) ─────────┤
                                                       │
                                              Phase 6 (Monitoring — after launch)
                                                       │
                                              Phase 7 (Growth — ongoing)
```

**Parallel tracks:**
- Phases 1 + 2 can run simultaneously
- Phase 4.1-4.4 (assets) can be done any time, in parallel with everything
- Phase 5 (Stripe live) is independent of Phases 1-3 and can run in parallel
- Phase 3 (CI/CD) requires Phase 1 (tests must pass)
- Phase 4.5 (submission) requires all code changes, CI passing, and assets ready
- Phase 5 should be completed before or shortly after CWS approval
- Phases 6-7 follow launch

---

## Complete API Endpoint Reference

For documentation and testing purposes:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | Root health check (status message) |
| GET | `/health` | No | Health check with D1 connectivity |
| POST | `/api/auth/create-free-key` | No | Create free license key `{email}` |
| POST | `/api/auth/validate-key` | License | Validate license key |
| GET | `/api/auth/me` | License | Get current user info + usage |
| POST | `/api/ai/solve` | License | AI query (alias for /complete) |
| POST | `/api/ai/complete` | License | AI query with image/OCR/text |
| GET | `/api/ai/usage` | License | Usage statistics |
| GET | `/api/ai/models` | License | Available AI models |
| GET | `/api/ai/analytics` | License | Detailed analytics |
| POST | `/api/subscription/create-checkout` | No | Create Stripe checkout `{email}` |
| POST | `/api/subscription/webhook` | Stripe sig | Stripe webhook handler |
| GET | `/api/subscription/portal` | License | Stripe billing portal URL |
| GET | `/api/subscription/plans` | No | Available plans/prices |
| POST | `/api/subscription/verify-payment` | No | Verify Stripe session `{sessionId}` |
