# CaptureAI - Prioritized Improvement Lists

> Generated from a comprehensive line-by-line code review of the entire codebase.
> Each list is ordered by **impact** (most beneficial first).

---

## Table of Contents

1. [Extension Improvements](#1-extension-improvements)
2. [API Improvements](#2-api-improvements)
3. [Website Improvements](#3-website-improvements)

---

## 1. Extension Improvements

### Critical Priority

| # | Issue | Files | Description |
|---|-------|-------|-------------|
| E1 | **Privacy Guard exposes bypass methods on prototypes** | `inject.js:201-206` | The original `addEventListener`/`removeEventListener` are stored as `_addEventListener` and `_removeEventListener` on `Window.prototype`, `Document.prototype`, and `Element.prototype`. Any page script can call `window._addEventListener('visibilitychange', ...)` to completely bypass the privacy guard. These backup references need to be stored in a closure-scoped variable, not on the public prototype. |
| E2 | **Focus/blur events blocked on ALL elements, breaking forms** | `inject.js:100-111` | The `BLOCKED_EVENTS` set blocks `focus`, `blur`, `focusin`, `focusout` on every `EventTarget`, not just `window` and `document`. This breaks form input validation, dropdown menus, autocomplete, and accessibility features across every website. The block must be scoped to only `window` and `document` targets. |
| E3 | **XSS via unsanitized API data in popup `innerHTML`** | `popup.js:327-349` | Usage statistics from the backend API (`usage.today.used`, `usage.today.limit`, `usage.today.percentage`, etc.) are interpolated directly into HTML via template literals and assigned to `innerHTML`. If the API is compromised or returns malicious data, this allows arbitrary script injection. All dynamic values should use `textContent` or explicit sanitization. |
| E4 | **Debug mode hardcoded to `true` in production** | `background.js:37`, `config.js:7`, `inject.js:114` | `DEBUG = true` is hardcoded in three locations. This causes: (a) full base64 captured screenshots to be logged to the console, (b) privacy guard debug messages to appear in the page's console (visible to any website since `inject.js` runs in MAIN world), directly undermining stealth. Must default to `false`. |
| E5 | **`window.CaptureAI` global exposes all internals to page scripts** | `content.js:81`, multiple modules | Multiple modules attach themselves to `window.CaptureAI`, making all internal methods and state accessible to any page script. Any website can call `window.CaptureAI.AuthService.getLicenseKey()` to steal the license key, or read `window.CaptureAI.STATE.apiKey`. The content script runs in an isolated world so this is safe there, but `window.Migration` (`migration.js:111`) and the privacy guard backup methods ARE in MAIN world and directly exploitable. |
| E6 | **`resetMigration()` test method exposed in production** | `migration.js:92-101` | The `resetMigration()` method deletes the license key, user email, and user tier. It's documented as "for testing only" but exposed globally as `window.Migration.resetMigration()`. Any page script could call it to de-authenticate the user. |

### High Priority

| # | Issue | Files | Description |
|---|-------|-------|-------------|
| E7 | **Durable Object rate limiter is completely broken** | See API section (A1) | The extension relies on backend rate limiting that silently fails open. Every request is allowed through regardless of limits. |
| E8 | **`isValidUrl` Chrome Web Store check never matches** | `background.js:703-708`, `domains.js:88-91` | The URL validation first checks `url.startsWith('http://')`, making subsequent `!url.startsWith('chrome://')` checks always true. The Chrome Web Store URL (`https://chrome.google.com/webstore/...`) is never blocked. The `chrome.google.com` check has no protocol prefix so it can never match. |
| E9 | **`elements.buyProBtn` is undefined - TypeError on access** | `popup.js:151` | The `elements` object does not contain a `buyProBtn` property. `handleBuyPro` references `elements.buyProBtn.disabled` and `elements.buyProBtn.textContent`, which will throw TypeError. |
| E10 | **Null dereference in `displayRegularResponse` fallback** | `messaging.js:312-318` | The `else` branch executes when `window.CaptureAI.UICore` is falsy, then immediately calls `window.CaptureAI.UICore.showMessage()` on that same falsy value. Guaranteed TypeError. |
| E11 | **Auto-solve answer extraction matches wrong digit** | `auto-solve.js:248` | `cleanResponse.match(/[1-4]/)` matches the first digit 1-4 anywhere in the response. "Question 3 is answered by option 2" matches `3` instead of `2`. Needs a more precise pattern. |
| E12 | **Enter key dispatched twice in auto-solve** | `auto-solve.js:405-411` | `activeElement` (captured earlier) and `document.activeElement` are usually the same element, causing Enter to be dispatched twice. Can cause double-submission or skipping questions. |
| E13 | **`unhandledrejection` handler resets entire extension state** | `event-manager.js:182-184` | The handler has no filtering (unlike the `error` handler which checks for `chrome-extension://`). Any unhandled promise rejection from any source on the page triggers `resetState()`, clearing all processing flags, coordinates, and selection state. |
| E14 | **Storage wrapper Promises never reject** | `storage.js:11-61` | All Chrome storage wrappers use `new Promise((resolve) => ...)` with no `reject` parameter, and `chrome.runtime.lastError` is never checked. Storage failures (quota exceeded, corruption) are silently swallowed. |
| E15 | **External Google Fonts CDN requests leak extension usage** | `popup.html:5`, `ui-core.js:25`, `ui-stealthy-result.js:22` | Three separate external font requests to Google's CDN. This leaks browsing activity to Google on every page. Fonts should be bundled with the extension. Additionally, `ui-stealthy-result.js` loads Roboto but uses Inter (line 43), making the Roboto load entirely wasted. |
| E16 | **Migration deletes `captureai-user-tier`, breaking Pro features** | `migration.js:49` | The migration removes `captureai-user-tier` from storage, but `ui-core.js:393` and `ui-components.js:547` read it to determine Pro feature visibility. After migration, all users default to free tier even if they are paying Pro users. |
| E17 | **Overly broad `web_accessible_resources`** | `manifest.json:71-102` | Every module JS file, Tesseract assets, and `payment-success.html` are exposed to `<all_urls>`. Any website can probe these resources to fingerprint/detect the extension. |

### Medium Priority

| # | Issue | Files | Description |
|---|-------|-------|-------------|
| E18 | **`getComputedStyle` override creates closure on every call** | `inject.js:382-409` | Each call to `window.getComputedStyle()` creates a new closure and reassigns `styles.getPropertyValue`. This is called very frequently by browsers and JS frameworks, adding GC pressure and overhead. |
| E19 | **MutationObserver watches entire DOM at all times** | `inject.js:521-567` | The honeypot watcher observes `{ childList: true, subtree: true }` across the entire document. Every DOM mutation triggers `querySelectorAll` on added nodes. On SPAs this fires constantly. |
| E20 | **Panel can be dragged off-screen with no recovery** | `ui-core.js:456-457` | `makeDraggable` constrains to top/left edges but not right/bottom. The panel can be dragged entirely off-screen with no way to retrieve it. |
| E21 | **Panel drag has conflicting CSS positioning** | `ui-core.js:112,456` | Panel starts with `right: 20px` but dragging sets `left` without clearing `right`. Both `left` and `right` on a fixed element causes layout conflicts. |
| E22 | **Property overrides in inject.js are `configurable: true`** | `inject.js:45-50` | Page scripts can re-override `visibilityState`/`hidden` because the property descriptors are configurable. |
| E23 | **Direct `.value` mutation breaks framework reactivity** | `auto-solve.js:344` | Setting `activeElement.value` directly doesn't trigger React/Vue/Angular change detection. The input may be silently ignored or reverted on framework-heavy educational sites. |
| E24 | **OCR character whitelist too restrictive** | `ocr-service.js:44` | Missing: `@`, `#`, `$`, `%`, `^`, `&`, `*`, `{`, `}`, `[`, `]`, `<`, `>`, `_`, `\`, `|`. Math/science questions, code, URLs, and fill-in-the-blank underscores get corrupted. |
| E25 | **Inconsistent OCR confidence thresholds** | `ocr-service.js:44,112,192` | Three different thresholds: extractText defaults to 60, `isValidOCRResult` uses 30. A 40% result is "valid" but triggers fallback-to-image, giving contradictory signals. |
| E26 | **Escape in ask mode starts a capture instead of canceling** | `keyboard.js:123-129` | Pressing Escape in ask mode calls `startCapture()`. Escape should cancel/dismiss, not start a new operation. |
| E27 | **No request timeouts on `fetch()` calls** | `auth-service.js` | All fetch calls have no `AbortController` or timeout. If the backend hangs, the extension hangs indefinitely. The auto-solve comment on line 163 says "Safety timeout removed entirely!" |
| E28 | **`startCapture` parameter `forAskMode` is ignored** | `capture-system.js:26` | The parameter is accepted but the function checks `STATE.isForAskMode` instead, making the parameter useless. |
| E29 | **Subdomain matching too permissive** | `domains.js:79` | `hostname.includes('chase.com')` matches `notchase.com`, `chase.com.evil.com`, etc. Should use exact domain or suffix matching. |
| E30 | **Hardcoded 3-second wait after script injection** | `popup.js:550` | `ensureContentScriptLoaded` waits 3000ms unconditionally. Both slow (wastes 3 seconds) and unreliable (may not be enough). |
| E31 | **Double focus handler registration** | `content.js:205-218` | Both `document` and `window` get focus handlers, causing `refreshState()` to fire twice per focus event with three redundant storage reads each time. |
| E32 | **Stealth result `style.color` with `!important` silently fails** | `ui-stealthy-result.js:84-86` | Setting `element.style.color` via JS property does not support `!important`. Browsers silently discard the value. Must use `setProperty('color', '...', 'important')`. |
| E33 | **Stealth result inner timeout causes premature hiding** | `ui-stealthy-result.js:93-100` | The inner `setTimeout` (fade-out to `display: none`) is never tracked/cleared. Rapid `show()` calls during the 500ms fade window cause the new message to be hidden. |
| E34 | **XSS via unsanitized icon URLs in innerHTML** | `ui-components.js:118,132` | `ICONS.CAMERA` and `ICONS.ATTACH` are interpolated into innerHTML template literals. If values contain `"` followed by HTML, this creates an XSS vector. |
| E35 | **`privacy-guard.js` `checkProtection` is fundamentally flawed** | `privacy-guard.js:52-75` | It checks whether `document.visibilityState === 'visible'`, which is true for any foreground tab regardless of Privacy Guard. Never detects actual protection status. Also leaks event listeners on every call (line 65). |

### Low Priority

| # | Issue | Files | Description |
|---|-------|-------|-------------|
| E36 | **Debounce implementation is actually a leading-edge throttle** | `utils.js:12-34` | Fires immediately on first call, then after timeout. Standard debounce should only fire after calls stop. |
| E37 | **`Math.random()` for ID generation** | `utils.js:41` | Not cryptographically secure. `crypto.randomUUID()` is available. |
| E38 | **Deprecated `substr` method** | `utils.js:41` | `String.prototype.substr` is deprecated. Should use `substring(2, 11)`. |
| E39 | **WebP detection doesn't work** | `image-processing.js:69-77` | `canvas.toDataURL()` silently falls back to PNG for unsupported formats. The WebP-vs-JPEG branch is effectively broken. |
| E40 | **`cropImage` has no bounds validation** | `image-processing.js:110-132` | Out-of-bounds crop coordinates produce transparent/black regions silently. |
| E41 | **Inconsistent module export patterns** | Multiple files | Mix of ES modules, CommonJS, and window globals across the codebase. |
| E42 | **Dead code: `buildMessages` and `getStoredApiKey`** | `background.js:565-595,721-727` | Never called in production. |
| E43 | **`offline_enabled: false` is invalid MV3 key** | `manifest.json:9` | Chrome Apps key, not valid for MV3 extensions. Silently ignored. |
| E44 | **Duplicate CSS declarations in popup.html** | `popup.html:22-23,89,99,135-136,270-289` | Multiple duplicate `color`, `width`, and rule blocks. |
| E45 | **`beforeunload` cleanup may not fire reliably** | `event-manager.js:11` | Not guaranteed in all scenarios. `pagehide` is more reliable. |

### Infrastructure / Testing

| # | Issue | Files | Description |
|---|-------|-------|-------------|
| E46 | **10 of 17 modules + popup.js have zero test coverage** | `tests/unit/` | auth-service, capture-system, config, event-manager, messaging, migration, ocr-service, ui-core, ui-components, ui-stealthy-result have no tests at all. |
| E47 | **Coverage thresholds set to 0%** | `jest.config.js:33-39` | Coverage can regress without detection. |
| E48 | **Tests import from monolithic `background.js`, not modules** | All test files | Tests are coupled to the monolith, breaking module-level coverage instrumentation. |
| E49 | **4+ pairs of duplicate/overlapping test files** | `tests/unit/` | storage (3 files), auto-solve (2), domains (2), utils (2). No clear ownership. |
| E50 | **No CI/CD pipeline** | N/A | No GitHub Actions, no automated lint/test/build on PRs. |
| E51 | **No bundler or build pipeline** | N/A | No webpack/rollup/esbuild. Source files shipped raw with no tree-shaking or minification. |
| E52 | **No packaging script for Chrome Web Store** | N/A | No script to produce `.zip` or `.crx`. |
| E53 | **Chrome mock incomplete for MV3 Promise APIs** | `tests/setup/chrome-mock.js` | `tabs.captureVisibleTab`, `tabs.query`, `scripting.executeScript` don't return Promises. Missing mocks for `chrome.action`, `chrome.contextMenus`, etc. |
| E54 | **Bug codified as passing test** | `tests/unit/edge-cases.test.js:247-249` | `isValidUrl('http://')` asserts `true` — but `http://` is not a valid URL. |

---

## 2. API Improvements

### Critical Priority

| # | Issue | Files | Description |
|---|-------|-------|-------------|
| A1 | **Durable Object rate limiter is completely broken** | `ratelimit.js:21` | `stub.url` is `undefined` on Durable Object stubs. The code uses global `fetch()` instead of `stub.fetch()`. This means every rate limit check throws, hits the catch block, and returns `null` (fail open). **All rate limiting silently fails and every request is allowed through.** |
| A2 | **SSRF via unvalidated `sessionId` in Stripe API URL** | `subscription.js:378` | User-supplied `sessionId` is interpolated directly into `https://api.stripe.com/v1/checkout/sessions/${sessionId}`. An attacker could inject path traversal (e.g., `../customers`) to hit arbitrary Stripe API endpoints using the server's `STRIPE_SECRET_KEY`. |
| A3 | **CORS accepts ANY `*.github.io` origin with credentials** | `index.js:189`, `utils.js:88` | `origin.match(/^https:\/\/.*\.github\.io$/)` matches any GitHub Pages site. Combined with `Access-Control-Allow-Credentials: true`, any attacker-controlled `*.github.io` site can make authenticated requests. |

### High Priority

| # | Issue | Files | Description |
|---|-------|-------|-------------|
| A4 | **CORS configuration mismatch between preflight and responses** | `utils.js:52` vs `index.js:152` | `handleCORS()` (OPTIONS) and `getCORSHeaders()` (actual responses) have different allowed origin lists. Preflight may succeed but the actual request gets a different CORS header. |
| A5 | **No rate limiting on AI endpoints** | `ai.js:43-49` | `/api/ai/solve` and `/api/ai/complete` have no IP-based rate limiting. Usage checks are per-user, but unauthenticated requests with invalid keys still trigger DB queries before rejection — a DoS vector. |
| A6 | **AI endpoints use deprecated `parseJSON` with no body size limit** | `ai.js:68` | The `complete` endpoint uses `parseJSON()` instead of `validateRequestBody()`. Since `imageData` can contain large base64 images, requests of arbitrary size are accepted, potentially exhausting Worker memory. |
| A7 | **Email-based user lookup is case-sensitive in webhooks** | `subscription.js:244,264` | Webhook handlers use `WHERE email = ?` without `LOWER()`, but `createFreeKey` uses `WHERE LOWER(email) = ?`. If case differs between registration and Stripe webhook, the user's subscription won't update. |
| A8 | **`buildPayload` references non-existent `config.useLegacyTokenParam`** | `ai.js:662` | The property is always `undefined`, so the code always uses `max_completion_tokens` even for gpt-4.1-nano which may need `max_tokens`. |
| A9 | **No database schema or migrations** | N/A | Code references `users`, `usage_records`, `webhook_events` tables but no schema definitions exist. No way to verify indexes on frequently queried columns (`user_id`, `created_at`, `license_key`, `email`). |
| A10 | **Hardcoded test Stripe billing portal URL in email template** | `auth.js:709` | `https://billing.stripe.com/p/login/test_123` — a test URL that won't work in production. |
| A11 | **No timeout on AI Gateway fetch call** | `ai.js:692-696` | `sendToGateway` uses bare `fetch()` with no timeout. `fetchWithTimeout` exists in `utils.js` but isn't used. A hanging gateway consumes the full Worker execution time. |

### Medium Priority

| # | Issue | Files | Description |
|---|-------|-------|-------------|
| A12 | **Pro rate limit default inconsistency (30 vs 60)** | `ai.js:433` vs `ai.js:190` | `checkUsageLimit` defaults to 30/min, `getUsage` defaults to 60/min. If env var is unset, enforcement and display disagree. |
| A13 | **`AIHandler` constructor drops the `logger` parameter** | `ai.js:10` | Router passes `(env, logger)` but constructor only accepts `env`. All AI handler logging falls back to raw `console.error`. |
| A14 | **Webhook errors return 500, causing Stripe retries** | `subscription.js:134-137` | Stripe retries non-2xx responses. Business logic errors should return 200 with an error body to prevent duplicate processing. |
| A15 | **Incomplete Stripe subscription status mapping** | `subscription.js:290-305` | All non-`active` statuses (`trialing`, `past_due`, `unpaid`, `paused`) are treated as `inactive` + `free`. A `past_due` user who still has access per Stripe settings gets immediately downgraded. |
| A16 | **JWT verification uses non-constant-time comparison** | `utils.js:238` | `verifyJWT` uses `!==` for signature comparison instead of the `constantTimeCompare` function defined in the same file. |
| A17 | **Password verification uses early-return byte comparison** | `utils.js:196-197` | Leaks how many leading hash bytes are correct through timing analysis. |
| A18 | **`constantTimeCompare` leaks string length** | `utils.js:330-331` | Returns early when strings differ in length. For HMAC comparisons (always 64 chars) this is low risk but the function is not truly constant-time. |
| A19 | **No rate limiting on `verify-payment` endpoint** | `subscription.js:368` | Unlike other endpoints, `verify-payment` has no rate limiting. Could be used to brute-force session IDs. |
| A20 | **Validation functions defined but never called** | `validation.js` | `validatePrompt`, `validateBase64Image`, `validateReasoningLevel` exist but the AI endpoints use the deprecated `parseJSON` instead. |
| A21 | **`sanitizeLogData` defined but never called** | `logger.js:311-345` | Sensitive data (emails, license keys) flows to console output without sanitization. |
| A22 | **`inputMethod` calculated but not stored in DB** | `ai.js:104,527-557` | The value is computed and passed to `recordUsage` but the INSERT statement has no `input_method` column. Silently dropped. |
| A23 | **Duplicate route: `/api/auth/usage` and `/api/ai/usage`** | `router.js:57-58,67-68` | Both point to `this.ai.getUsage`. Confusing API surface. |

### Low Priority

| # | Issue | Files | Description |
|---|-------|-------|-------------|
| A24 | **Environment validation runs on every request** | `index.js:37-53` | `validateEnvironment(env)` has no caching. Minor but unnecessary overhead. |
| A25 | **License key generation loop with sequential DB checks** | `auth.js:249-260` | Each collision attempt makes a separate DB query. With the keyspace size, collisions are astronomically unlikely. Same pattern in `subscription.js:200-211`. |
| A26 | **3 separate `AuthHandler` instances created per request** | `router.js:14`, `ai.js:13`, `subscription.js:16` | Router, AIHandler, and SubscriptionHandler each create their own AuthHandler. |
| A27 | **Swallowed errors in webhook event handlers** | `subscription.js:230-232,248-250,267-269` | DB operation failures during checkout completion are caught and logged but never retried. The user silently doesn't get their license key. |
| A28 | **No admin endpoints** | N/A | No endpoints for user management, manual key generation, subscription override, or system health beyond basic `/health`. |
| A29 | **No cleanup of old usage records or webhook events** | N/A | Both tables grow indefinitely with no archival or deletion mechanism. Will degrade D1 performance over time. |
| A30 | **404 response leaks requested path** | `router.js:96` | `{ error: 'Route not found', path }` aids attacker reconnaissance. |
| A31 | **Email logged in plaintext** | `auth.js:794` | PII sent to console without redaction. |
| A32 | **Error messages leak internal details to clients** | `ai.js:147` | Raw `error.message` from OpenAI/AI Gateway returned to client. Could expose gateway URLs or account info. |
| A33 | **Durable Object alarm never initially scheduled** | `durable-objects/RateLimiter.js:148-161` | Expired entries accumulate indefinitely until first alarm fires. |
| A34 | **No API versioning** | N/A | No `/v1/` prefix or versioning strategy. Breaking changes require coordinated extension updates. |
| A35 | **No API tests** | N/A | Zero test files for the API backend. |

---

## 3. Website Improvements

### Critical Priority

| # | Issue | Files | Description |
|---|-------|-------|-------------|
| W1 | **Plan selection cards are not keyboard accessible** | `activate/page.tsx:170-177,214-221` | `<div>` elements with `onClick` but no `role`, `tabIndex`, or `onKeyDown`. Keyboard users cannot select a plan. WCAG 2.1 Level A failure (2.1.1 Keyboard). Should be `<button>` elements. |

### High Priority

| # | Issue | Files | Description |
|---|-------|-------|-------------|
| W2 | **Unvalidated redirect from API response** | `activate/page.tsx:135-143` | `window.location.href = data.url as string` — the URL is used directly without validating it points to a trusted domain. If the API is compromised, users could be redirected to phishing sites. |
| W3 | **Missing `metadataBase` and metadata on client pages** | `layout.tsx:29`, `activate/page.tsx`, `payment-success/page.tsx` | OG image uses a relative path with no `metadataBase`. Client components (`'use client'`) cannot export metadata, so activate and payment-success pages have no custom title/description. |
| W4 | **Low contrast on tertiary text** | `globals.css:21` | `--color-text-tertiary: #5f6577` on background `#06060a` yields ~4.0:1 contrast ratio. WCAG AA requires 4.5:1 for normal text. Used throughout site for descriptions. |
| W5 | **No skip navigation link** | `layout.tsx` | Keyboard users must tab through the entire navbar. WCAG 2.4.1 failure. |
| W6 | **No `aria-label` on email input** | `activate/page.tsx:286` | Has placeholder but no `<label>` element or `aria-label`. Screen readers only read "you@email.com". |
| W7 | **Loading spinner has no text alternative** | `activate/page.tsx:311` | CSS-only spinner with no `aria-label`, `role="status"`, or visually hidden text. |
| W8 | **Inconsistent contact emails across site** | `contact/page.tsx:44,62` vs `privacy/page.tsx:149`, `terms/page.tsx:183` | Contact page uses `support@captureai.dev` and `feedback@captureai.dev`. Privacy Policy and Terms use a personal Gmail address (`wonhappyheart@gmail.com`). Unprofessional in legal documents. |

### Medium Priority

| # | Issue | Files | Description |
|---|-------|-------|-------------|
| W9 | **No sitemap or robots.txt** | N/A | No `sitemap.ts` or `robots.ts`. Search engines can't efficiently discover all pages. |
| W10 | **No canonical URLs defined** | `layout.tsx` | No `alternates.canonical`. Search engines may index duplicate page versions. |
| W11 | **No structured data (JSON-LD)** | N/A | No `SoftwareApplication`, `FAQPage`, or `Organization` schema. Missing rich snippet opportunities. |
| W12 | **FAQ accordion content focusable when hidden** | `FAQ.tsx:75-88` | Uses `aria-hidden` + `grid-rows-[0fr]` with `overflow-hidden`, but content remains in DOM and focusable. Screen reader users can tab into hidden answers. |
| W13 | **No CSRF protection on activate page** | `activate/page.tsx:90-118` | POST requests with just an email. No CSRF token, no client-side rate limiting, no captcha. Automatable spam of free key generation. |
| W14 | **Multiple large gradient blurs hurt mobile performance** | `Hero.tsx:18-20`, `activate/page.tsx:149-150` | CSS `blur(140px)` is GPU-intensive. Hero alone has three animated blurs. Combined with permanent `will-change`, this consumes significant GPU memory on low-end devices. |
| W15 | **`will-change` applied permanently** | `globals.css:161` | `will-change: filter, opacity, transform` on `.gradient-blur-animated` forces persistent GPU layers. Should be applied just before animations. |
| W16 | **No 404 page** | N/A | No `not-found.tsx`. Users see unstyled default Next.js 404. |
| W17 | **No `error.tsx` error boundary** | N/A | Runtime errors crash the page with no styled fallback or recovery. |
| W18 | **No `loading.tsx` for route transitions** | N/A | No loading indicators between page navigations. |
| W19 | **Duplicated API request logic** | `activate/page.tsx:36-78` vs `payment-success/page.tsx:27-63` | Fetch + error handling logic is duplicated instead of using `lib/api.ts`. |
| W20 | **Missing `title.template` in root layout** | `layout.tsx:14` | Sub-pages manually format `title: 'Download - CaptureAI'` instead of using `{ template: '%s | CaptureAI' }`. |
| W21 | **Pricing cards don't align heights on desktop** | `page.tsx:149,193` | Both cards use `self-start`, creating visual imbalance when content lengths differ. |

### Low Priority

| # | Issue | Files | Description |
|---|-------|-------|-------------|
| W22 | **Inconsistent `aria-hidden` on decorative icons** | `page.tsx:168,178`, `activate/page.tsx:201-206` | Some `<Check>` and `<XIcon>` icons have `aria-hidden`, others don't. Screen readers attempt to read untagged SVGs. |
| W23 | **Dead components: Testimonials, Stats, AnnouncementBar** | `components/` | Defined but never imported or rendered by any page. Dead code. |
| W24 | **`apiPost` return type is too broad** | `activate/page.tsx:36` | Returns `Record<string, unknown>`. Callers need type guards for every property. Should use generics or discriminated unions. |
| W25 | **Payment success response body discarded** | `payment-success/page.tsx:61-63` | API response is parsed with `response.json()` but the result is thrown away. |
| W26 | **No CSP headers configured** | `next.config.ts` | Empty config with no Content-Security-Policy headers via `next.config.ts` or middleware. |
| W27 | **Email input not trimmed before validation** | `activate/page.tsx:81-98` | A leading/trailing space causes validation error. Email regex is also weak. |
| W28 | **Features component uses array index as React key** | `Features.tsx:97` | Should use `feature.title` for stability if list order changes. |
| W29 | **No web app manifest** | N/A | No `manifest.json` for PWA support or mobile home screen icons. |
| W30 | **Next.js config is completely empty** | `next.config.ts` | No image optimization (AVIF/WebP), no security headers, no redirects configuration. |
| W31 | **`overflow-x: hidden` applied three times** | `globals.css:33,44,54` | Redundant on `html` and `body` (twice). |
| W32 | **Inconsistent design system usage in Testimonials/Stats** | `Testimonials.tsx`, `Stats.tsx` | Use raw Tailwind colors (`text-gray-300`, `bg-gray-900/50`) instead of CSS variables used everywhere else. |
| W33 | **Hero image marked `priority` but is below fold** | `page.tsx:38` | Forces eager loading that competes with above-the-fold resources. |

---

## Implementation Recommendation

### Phase 1 — Security & Correctness (Immediate)
Focus on items that affect security and data integrity:
- **E1, E2, E4, E5, E6** (Privacy guard bypass, form breakage, debug leaks, global exposure)
- **A1, A2, A3, A4** (Rate limiter, SSRF, CORS)
- **W1, W2** (Keyboard accessibility, redirect validation)

### Phase 2 — Reliability & Core Bugs (1-2 weeks)
Fix bugs that cause crashes or incorrect behavior:
- **E8-E16** (URL validation, null derefs, auto-solve, storage)
- **A5-A11** (Rate limiting, body validation, email casing, Stripe URL)
- **W3-W8** (SEO metadata, accessibility, contact emails)

### Phase 3 — Performance & Quality (2-4 weeks)
Address performance bottlenecks and code quality:
- **E18-E35** (DOM observer, drag bounds, OCR, timeouts)
- **A12-A23** (Rate limit defaults, validation, logging)
- **W9-W21** (SEO, performance, error boundaries)

### Phase 4 — Infrastructure & Long-term (Ongoing)
Build out development infrastructure:
- **E46-E54** (Test coverage, CI/CD, build pipeline)
- **A34-A35** (API versioning, API tests)
- **W22-W33** (Dead code cleanup, design consistency)
