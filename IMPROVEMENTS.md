# CaptureAI Improvement Summary

**Date:** February 12, 2026
**Scope:** 122+ issues across 4 phases, 3 components
**Files changed:** 37 modified, 5 created, 4 deleted

> **Notes (Feb 12, 2026):**
> - E17 (`use_dynamic_url: true`) was reverted due to incompatibility with ES module imports. The setting broke dynamic imports because modules with internal relative dependencies (e.g., `image-processing.js` → `ocr-service.js`) cannot resolve when URLs are randomized.
> - **A12b added:** Pro tier rate limiting had a critical race condition. Database-based counting allowed multiple concurrent requests to bypass limits. Fixed by using Durable Object rate limiter for atomic check-and-increment operations.

---

## Phase 1 — Security & Correctness (Critical)

### Extension

| ID | Issue | Fix | File |
|----|-------|-----|------|
| E1 | `_addEventListener`/`_removeEventListener` exposed on prototypes | Removed prototype exposure; originals stored in closure only | `inject.js` |
| E3 | `innerHTML` in popup with API data (XSS risk) | Replaced with DOM API (`createElement`, `textContent`) | `popup.js` |
| E4 | `DEBUG = true` in production | Set `DEBUG = false` in background.js, config.js, inject.js; removed debug image logging | `background.js`, `config.js`, `inject.js` |
| E5 | `window.CaptureAI` writable and enumerable | Used `Object.defineProperty` with `writable: false, enumerable: false, configurable: false` | `content.js` |
| E6 | `window.Migration` and `resetMigration()` exposed | Removed `window.Migration` exposure and deleted `resetMigration()` | `migration.js` |
| E22 | `configurable: true` on visibility property descriptors | Changed to `configurable: false` on all 4 visibility overrides | `inject.js` |
| E35 | `checkProtection()` checked value instead of descriptor | Now checks `descriptor.configurable === false` on `Document.prototype` | `privacy-guard.js` |

> **E2 skipped** — focus/blur events blocking all elements was intentionally left as-is because dropdowns still work correctly.

### API

| ID | Issue | Fix | File |
|----|-------|-----|------|
| A1 | Durable Object rate limiter called `fetch(stub.url)` (undefined) | Changed to `stub.fetch('https://rate-limiter/check', ...)` | `ratelimit.js` |
| A2 | `sessionId` passed unsanitized to Stripe URL (SSRF) | Added regex validation: `/^cs_(test\|live)_[a-zA-Z0-9]+$/` | `subscription.js` |
| A3 | Wildcard `*.github.io` CORS matching | Removed wildcard; only exact `https://thesuperiorflash.github.io` allowed | `index.js`, `utils.js` |
| A4 | Preflight and response CORS headers diverged | Unified allowed origins between `handleCORS()` and `getCORSHeaders()` | `index.js`, `utils.js` |

### Website

| ID | Issue | Fix | File |
|----|-------|-----|------|
| W1 | Plan cards not keyboard-accessible | Added `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space) | `activate/page.tsx` |
| W2 | API redirect URL not validated (open redirect) | Validate hostname against `['checkout.stripe.com', 'billing.stripe.com']` | `activate/page.tsx` |

---

## Phase 2 — Bug Fixes & Data Integrity

### Extension

| ID | Issue | Fix | File |
|----|-------|-----|------|
| E8 | `isValidUrl` didn't catch Chrome Web Store subpaths | Changed to `!url.includes('chrome.google.com/webstore')` | `background.js`, `domains.js` |
| E9 | `elements.buyProBtn` referenced but undefined | Removed dead references in `handleBuyPro()` | `popup.js` |
| E10 | Null dereference in `displayRegularResponse` | Added optional chaining: `UICore?.displayAIResponse` and `UICore?.showMessage` | `messaging.js` |
| E11 | Auto-solve used first digit match from response | Changed to last match: `answerMatches[answerMatches.length - 1]` | `auto-solve.js` |
| E12 | Double Enter dispatch in auto-solve | Unified to single target: `document.activeElement \|\| activeElement` | `auto-solve.js` |
| E13 | Unhandled rejection handler caught all page errors | Added filter: only handle errors with `chrome-extension://` in stack | `event-manager.js` |
| E14 | No `chrome.runtime.lastError` checks in storage | Added error checks with `reject()` to all 5 storage functions | `storage.js` |
| E16 | Migration deleted `captureai-user-tier` (downgraded Pro) | Removed `'captureai-user-tier'` from `storage.remove()` call | `migration.js` |

### API

| ID | Issue | Fix | File |
|----|-------|-----|------|
| A5 | No IP rate limiting before auth on AI endpoints | Added 30/min IP-based rate limit before authentication | `ai.js` |
| A6 | `parseJSON` had no size validation | Replaced with `validateRequestBody` (10MB limit) | `ai.js` |
| A7 | Email lookups case-sensitive | Changed to `WHERE LOWER(email) = LOWER(?)` | `subscription.js` |
| A10 | Test Stripe billing portal URL hardcoded | Replaced with `https://captureai.dev/activate` | `auth.js` |
| A11 | No timeout on OpenAI gateway fetch | Added `fetchWithTimeout(url, options, 30000)` | `ai.js` |
| A12 | Pro rate limit default 30 mismatched getUsage default 60 | Unified to 60 per minute | `ai.js` |
| A12b | **Pro tier rate limiting had race condition** | **Changed to use Durable Object rate limiter for atomic check-and-increment** | `ai.js` |
| A13 | AIHandler constructor didn't accept logger | Added `logger` parameter to constructor | `ai.js` |
| A14 | Webhook errors returned 400 (caused Stripe retries) | Return 200 for business logic errors; 400 only for signature failures | `subscription.js` |
| A15 | `trialing` and `past_due` not treated as active | Added to `activeStatuses` array | `subscription.js` |
| A30 | 404 response leaked request path | Removed `path` from error response | `router.js` |
| A32 | Error responses leaked `error.message` | Removed `message: error.message` from AI error responses | `ai.js` |

### Website

| ID | Issue | Fix | File |
|----|-------|-----|------|
| W3 | No `metadataBase` (relative OG URLs broken) | Added `metadataBase: new URL('https://captureai.dev')` | `layout.tsx` |
| W4 | Tertiary text color failed WCAG contrast | Changed `--color-text-tertiary` from `#5f6577` to `#8088a0` | `globals.css` |
| W5 | No skip navigation link | Added skip-to-content link before Navbar | `layout.tsx` |
| W6 | Email input missing accessible label | Added `aria-label="Email address"` | `activate/page.tsx` |
| W8 | Contact emails inconsistent (`wonhappyheart@gmail.com` vs `@captureai.dev`) | Updated privacy and terms pages to `support@captureai.dev` | `privacy/page.tsx`, `terms/page.tsx` |
| W9 | No sitemap or robots.txt | Created `sitemap.ts` (7 routes) and `robots.ts` | `sitemap.ts`, `robots.ts` |
| W10 | No canonical URLs | Added `alternates: { canonical: '/' }` to root metadata | `layout.tsx` |
| W20 | No title template | Added `title: { template: '%s \| CaptureAI' }` and fixed sub-page titles | `layout.tsx`, all page files |
| W26 | No security headers | Added CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | `next.config.ts` |

---

## Phase 3 — Performance & UX

### Extension

| ID | Issue | Fix | File |
|----|-------|-----|------|
| E15 | External Google Font loaded (Roboto, unused) | Removed Roboto font link; component already uses Inter | `ui-stealthy-result.js` |
| ~~E17~~ | ~~`web_accessible_resources` fingerprint-able~~ | ~~Added `use_dynamic_url: true`~~ **REVERTED** - Broke ES module imports with internal dependencies | `manifest.json` |
| E18 | `getComputedStyle` override created closure per call | Patched `CSSStyleDeclaration.prototype.getPropertyValue` once | `inject.js` |
| E20/21 | Panel draggable off-screen | Added right/bottom boundary constraints; cleared conflicting `right` CSS | `ui-core.js` |
| E23 | `.value` mutation didn't trigger React/Vue change detection | Use native `HTMLInputElement.prototype.value` setter | `auto-solve.js` |
| E24 | OCR character whitelist too restrictive | Added `%@#$^&*{}[]<>_\|\~` to whitelist | `ocr-service.js` |
| E25 | Inconsistent OCR confidence thresholds (30 vs 60) | Unified to 40% across `extractText()` and `isValidOCRResult()` | `ocr-service.js` |
| E26 | Escape in ask mode started new capture | Now exits ask mode and recreates UI without starting capture | `keyboard.js` |
| E27 | No request timeouts on `fetch()` calls | Added `fetchWithTimeout()` with AbortController (30s default, 60s for AI) | `auth-service.js` |
| E28 | `startCapture(forAskMode)` parameter ignored | Now uses `forAskMode` parameter to set `STATE.isForAskMode` | `capture-system.js` |
| E29 | `hostname.includes('chase.com')` matched `notchase.com` | Changed to `hostname === domain \|\| hostname.endsWith('.' + domain)` | `domains.js` |
| E30 | Hardcoded 3-second wait after content script injection | Replaced with polling readiness check (200ms intervals, max 15 attempts) | `popup.js` |
| E32 | `style.color = '... !important'` silently fails | Changed to `style.setProperty('color', value, 'important')` | `ui-stealthy-result.js` |
| E33 | Stealth result timeout race condition | Added `_showCounter` to prevent stale timers from hiding new messages | `ui-stealthy-result.js` |

### API

| ID | Issue | Fix | File |
|----|-------|-----|------|
| A16 | JWT verification used `!==` (timing attack) | Changed to `constantTimeCompare()` | `utils.js` |
| A17 | Password hash comparison byte-by-byte with early return | Changed to XOR-accumulate comparison | `utils.js` |
| A18 | `constantTimeCompare` leaked length via early return | Now uses `Math.max(a.length, b.length)` and XORs length difference | `utils.js` |
| A19 | `verify-payment` endpoint had no rate limiting | Added rate limiting with `RateLimitPresets.AUTH` | `subscription.js` |
| A21 | `sanitizeLogData` existed but wasn't wired up | Integrated into `Logger.formatLog()` to auto-sanitize all logged data | `logger.js` |
| A27 | Webhook handlers swallowed errors silently | Handlers now re-throw; outer handler returns 200 with error info | `subscription.js` |

### Website

| ID | Issue | Fix | File |
|----|-------|-----|------|
| W7 | Loading spinner missing accessible label | Added `role="status"` and `aria-label="Loading"` | `activate/page.tsx` |
| W11 | No structured data for search engines | Added JSON-LD `SoftwareApplication` schema to homepage | `page.tsx` |
| W16 | No custom 404 page | Created `not-found.tsx` with styled error page | `not-found.tsx` |
| W17 | No error boundary | Created `error.tsx` with retry button | `error.tsx` |
| W18 | No loading state for route transitions | Created `loading.tsx` with spinner | `loading.tsx` |
| W27 | Email input not trimmed before validation | Added `email.trim()` before regex test | `activate/page.tsx` |

---

## Phase 4 — Infrastructure & Cleanup

| ID | Issue | Fix | File |
|----|-------|-----|------|
| W23 | Dead components never imported | Deleted `Stats.tsx`, `Testimonials.tsx`, `AnnouncementBar.tsx`, `README-AnnouncementBar.md` | (deleted) |
| W28 | Array index used as React key | Changed to stable keys: `faq.q`, `feature.title` | `FAQ.tsx`, `Features.tsx` |
| A23 | Duplicate route `/api/auth/usage` | Removed legacy duplicate (kept `/api/ai/usage`) | `router.js` |

---

## Changes By File

### Extension (19 files)
- `inject.js` — E1, E4, E18, E22
- `background.js` — E4, E8
- `content.js` — E5
- `popup.js` — E3, E9, E30
- `manifest.json` — ~~E17~~ (reverted)
- `modules/config.js` — E4
- `modules/migration.js` — E6, E16
- `modules/privacy-guard.js` — E35
- `modules/domains.js` — E8, E29
- `modules/messaging.js` — E10
- `modules/auto-solve.js` — E11, E12, E23
- `modules/event-manager.js` — E13
- `modules/storage.js` — E14
- `modules/keyboard.js` — E26
- `modules/auth-service.js` — E27
- `modules/capture-system.js` — E28
- `modules/ocr-service.js` — E24, E25
- `modules/ui-stealthy-result.js` — E15, E32, E33
- `modules/ui-core.js` — E20/E21

### API (8 files)
- `ratelimit.js` — A1
- `subscription.js` — A2, A7, A14, A15, A19, A27
- `index.js` — A3, A4
- `utils.js` — A3, A4, A16, A17, A18
- `ai.js` — A5, A6, A11, A12, A12b, A13, A32
- `router.js` — A23, A30
- `auth.js` — A10
- `logger.js` — A21

### Website (15 files: 10 modified, 5 created, 4 deleted)
- `layout.tsx` — W3, W5, W10, W20
- `activate/page.tsx` — W1, W2, W6, W7, W27
- `globals.css` — W4
- `privacy/page.tsx` — W8, W20
- `terms/page.tsx` — W8, W20
- `contact/page.tsx` — W20
- `download/page.tsx` — W20
- `help/page.tsx` — W20
- `next.config.ts` — W26
- `page.tsx` — W11
- `sitemap.ts` — W9 (new)
- `robots.ts` — W9 (new)
- `not-found.tsx` — W16 (new)
- `error.tsx` — W17 (new)
- `loading.tsx` — W18 (new)
- `Stats.tsx` — W23 (deleted)
- `Testimonials.tsx` — W23 (deleted)
- `AnnouncementBar.tsx` — W23 (deleted)
- `README-AnnouncementBar.md` — W23 (deleted)
- `FAQ.tsx` — W28
- `Features.tsx` — W28

---

## Intentionally Skipped

| ID | Reason |
|----|--------|
| E2 | Focus/blur event blocking scoped to window/document only — skipped because dropdowns still work |
| E17 | `use_dynamic_url: true` — reverted because it breaks ES module imports with internal relative dependencies (e.g., `image-processing.js` importing `ocr-service.js`). Chrome cannot resolve relative imports when resource URLs are randomized. |
| E46 | Test coverage infrastructure — high effort, deferred |
| E47 | Coverage thresholds — no jest.config.js exists |
| E50 | CI/CD pipeline — infrastructure decision needed |
| E51 | Module bundler — architectural change |
| A28 | Admin endpoints — feature design needed |
| A29 | Cleanup jobs — scheduling design needed |
| A34 | API versioning — migration strategy needed |
| A35 | API tests — test framework setup needed |
| W24 | TypeScript strict mode — many type errors to fix |
