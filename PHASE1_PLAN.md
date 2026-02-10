# Phase 1 Implementation Plan — Security & Correctness

> **Scope:** 12 issues across extension (E1-E6), API (A1-A4), and website (W1-W2)
> **Goal:** Eliminate all critical security vulnerabilities and correctness failures

---

## Table of Contents

1. [Dependency Graph & Execution Order](#dependency-graph--execution-order)
2. [Extension Fixes (E1-E6)](#extension-fixes)
3. [API Fixes (A1-A4)](#api-fixes)
4. [Website Fixes (W1-W2)](#website-fixes)
5. [Testing Strategy](#testing-strategy)
6. [Rollback Plan](#rollback-plan)

---

## Dependency Graph & Execution Order

The fixes are grouped into 4 independent work streams that can be developed in parallel. Within each stream, items are ordered by dependency.

```
Stream 1: Extension Privacy Guard (E1 → E2 → E4-inject)
Stream 2: Extension Globals & Debug (E4-bg/config → E5 → E6)
Stream 3: API Security (A1 → A3+A4 → A2)
Stream 4: Website Accessibility (W1 → W2)
```

**Recommended commit order** (minimizes risk, each commit is independently deployable):

| Order | Item(s) | Risk | Reason |
|-------|---------|------|--------|
| 1 | E4 | Very Low | Flipping debug flags has no behavioral side effects |
| 2 | E6 | Low | Removing a test method; no production code calls it |
| 3 | E5 | Low | `window.Migration` removal (MAIN world); content script `window.CaptureAI` is isolated world (safe) |
| 4 | E1 | Medium | Core privacy guard change — must verify no internal callers use `_addEventListener` |
| 5 | E2 | Medium | Behavioral change to event blocking scope — must test forms on target sites |
| 6 | A1 | Medium | Rate limiter fix — must verify Durable Object stub API usage |
| 7 | A3 + A4 | Medium | CORS changes affect both preflight and response headers |
| 8 | A2 | Low | Input validation addition — purely additive |
| 9 | W1 | Low | HTML element change — purely additive accessibility |
| 10 | W2 | Low | URL validation addition — purely additive |

---

## Extension Fixes

### E1 — Privacy Guard Bypass Methods on Prototypes

**File:** `inject.js:200-206`

**Problem:** Original `addEventListener`/`removeEventListener` are stored on public prototypes as `_addEventListener` and `_removeEventListener`. Any page script can call `window._addEventListener('visibilitychange', handler)` to bypass the privacy guard entirely.

**Current code (lines 200-206):**
```javascript
// Also create backup references for internal use
Window.prototype._addEventListener = originalAddEventListener;
Window.prototype._removeEventListener = originalRemoveEventListener;
Document.prototype._addEventListener = originalAddEventListener;
Document.prototype._removeEventListener = originalRemoveEventListener;
Element.prototype._addEventListener = originalAddEventListener;
Element.prototype._removeEventListener = originalRemoveEventListener;
```

**Fix:** Delete all 6 lines entirely. The `originalAddEventListener` and `originalRemoveEventListener` constants are already closure-scoped (declared at lines 125-126) and are referenced by the override functions via closure. No other code in the codebase references `_addEventListener` or `_removeEventListener` (verified via grep).

**What depends on this:**
- Nothing. Grep confirms `_addEventListener` and `_removeEventListener` are only referenced at these 6 lines.
- The override functions at lines 132 and 169 reference `originalAddEventListener`/`originalRemoveEventListener` through closure, not through the prototype properties.

**What could break:**
- Nothing in the CaptureAI codebase. The only risk is if a future developer expects these backup methods to exist, but they shouldn't — the entire point is to hide them.

**Verification:**
- Visit a site with privacy guard active
- Open DevTools console and confirm `window._addEventListener` is `undefined`
- Confirm `document.addEventListener` still works for non-blocked events (e.g., `click`)
- Confirm blocked events (e.g., `visibilitychange`) are still silently dropped

---

### E2 — Focus/Blur Events Blocked on ALL Elements

**File:** `inject.js:100-111, 132-158`

**Problem:** The `BLOCKED_EVENTS` set includes `focus`, `blur`, `focusin`, `focusout`. The `addEventListener` override at line 132 blocks these events on ALL `EventTarget` instances (including `<input>`, `<select>`, `<textarea>`, etc.), breaking form validation, dropdown menus, autocomplete, and accessibility features on every website.

**Current code (lines 100-111):**
```javascript
const BLOCKED_EVENTS = new Set([
  'visibilitychange',
  'webkitvisibilitychange',
  'mozvisibilitychange',
  'msvisibilitychange',
  'blur',
  'focus',
  'focusin',
  'focusout',
  'pagehide',
  'pageshow'
]);
```

**Current blocking logic (line 132-158):**
```javascript
EventTarget.prototype.addEventListener = function(type, listener, options) {
  if (BLOCKED_EVENTS.has(type)) {
    // ... blocks for ALL targets
    return;
  }
  return originalAddEventListener.call(this, type, listener, options);
};
```

**Fix:** Split the blocked events into two categories:
1. **Always blocked** (visibility events): block on all targets
2. **Window/document-only blocked** (focus events): block only when `this === window` or `this === document`

```javascript
// Events blocked on ALL targets (visibility detection)
const ALWAYS_BLOCKED_EVENTS = new Set([
  'visibilitychange',
  'webkitvisibilitychange',
  'mozvisibilitychange',
  'msvisibilitychange',
  'pagehide',
  'pageshow'
]);

// Events blocked only on window and document (focus detection)
const WINDOW_DOC_BLOCKED_EVENTS = new Set([
  'blur',
  'focus',
  'focusin',
  'focusout'
]);
```

Then update the `addEventListener` override (line 134) condition to:
```javascript
if (ALWAYS_BLOCKED_EVENTS.has(type) ||
    (WINDOW_DOC_BLOCKED_EVENTS.has(type) && (this === window || this === document))) {
```

And the same for `removeEventListener` override (line 171):
```javascript
if (ALWAYS_BLOCKED_EVENTS.has(type) ||
    (WINDOW_DOC_BLOCKED_EVENTS.has(type) && (this === window || this === document))) {
```

Also update the direct property blocking in Section 2.5 (lines 216-265) — this is already correctly scoped to `window` and `document` only, so no change needed there.

**What depends on this:**
- The `blockedListeners` WeakMap stores blocked listeners for cleanup. The logic works the same with the split — only now fewer listeners are blocked.
- `BLOCKED_EVENTS` is referenced at lines 134, 171. Both need the updated condition.

**What could break:**
- Websites that detect tab switching via `focus`/`blur` on individual DOM elements (not `window`/`document`) would no longer be blocked. This is acceptable — element-level focus events are used for legitimate UI purposes, not tab-switch detection.

**Verification:**
- Visit a form-heavy website and confirm inputs receive focus/blur events normally
- Visit a tab-detection site and confirm `window.addEventListener('blur', ...)` is still blocked
- Confirm `document.addEventListener('visibilitychange', ...)` is still blocked

---

### E4 — Debug Mode Hardcoded to `true`

**Files:** `background.js:37`, `modules/config.js:7`, `inject.js:114`

**Problem:** Debug flags are `true` in three locations, causing:
- `background.js`: Captured screenshots logged as base64 to console
- `config.js`: Content script debug messages enabled
- `inject.js`: Privacy guard debug messages logged in MAIN world (visible to page scripts, directly undermining stealth)

**Fix:** Change all three to `false`:

1. **`background.js:37`:**
   ```javascript
   // Before:
   const DEBUG = true;
   // After:
   const DEBUG = false;
   ```

2. **`modules/config.js:7`:**
   ```javascript
   // Before:
   DEBUG: true,
   // After:
   DEBUG: false,
   ```

3. **`inject.js:114`:**
   ```javascript
   // Before:
   const DEBUG_PRIVACY_GUARD = true;
   // After:
   const DEBUG_PRIVACY_GUARD = false;
   ```

**What depends on this:**
- `background.js`: `DEBUG` is checked at lines 283-293 (`debugLogImage`) and various `console.log` calls. All debug code paths are guarded by `if (DEBUG)` — setting to `false` simply silences them.
- `config.js`: `CONFIG.DEBUG` is checked throughout content script modules for console logging.
- `inject.js`: `DEBUG_PRIVACY_GUARD` is checked at lines 136-138, 173-175, 239-241, 258-260 for `safeLog` calls. Setting to `false` silences all privacy guard logging.

**What could break:**
- Nothing. Debug logging is not functional behavior. Developers can re-enable for local testing.

**Verification:**
- Load extension, open DevTools console
- Confirm no `[Privacy Guard]` messages appear in the page console
- Confirm no `CaptureAI Debug` messages appear in the service worker console
- Capture a screenshot and confirm no base64 data is logged

---

### E5 — `window.CaptureAI` / `window.Migration` Global Exposure

**File:** `modules/migration.js:110-111`, `content.js:81`

**Problem:** Two separate exposure vectors:

1. `window.Migration` (migration.js:110-111) — **MAIN world accessible.** `migration.js` is loaded via `<script>` tags in `popup.html` and `activate.html`, where it's exposed as `window.Migration`. While popup/activate pages are extension pages (not MAIN world), the global pattern is risky.

2. `window.CaptureAI` (content.js:81) — **Content script isolated world.** This is NOT accessible to page scripts. Chrome content scripts run in an isolated JavaScript context. This is safe by design but worth noting.

**Fix for `migration.js:110-111`:** The `window.Migration` global is needed because `popup.js` and `activate.html` reference `Migration` as a global. We cannot remove it without refactoring how popup.html loads scripts. However, we can **remove the dangerous `resetMigration` method** (see E6) and note this for Phase 4 refactoring when a module bundler is introduced.

No code change for `window.CaptureAI` — it's already in an isolated world and is architecturally safe.

**Note for Phase 4:** When a bundler is introduced (E51), `migration.js` should be converted to an ES module imported by `popup.js` instead of a `<script>` tag + global pattern.

---

### E6 — `resetMigration()` Test Method Exposed in Production

**File:** `modules/migration.js:88-101`

**Problem:** `resetMigration()` deletes the license key, user email, and user tier from storage. It's documented as "for testing purposes only" but available in production. Since `Migration` is on `window`, any page script in popup/activate context could call it.

**Current code (lines 88-101):**
```javascript
/**
 * Reset migration (for testing purposes only)
 * @returns {Promise<void>}
 */
async resetMigration() {
  await chrome.storage.local.remove([
    this.MIGRATION_KEY,
    'captureai-migration-notice',
    'captureai-license-key',
    'captureai-user-email',
    'captureai-user-tier'
  ]);
  console.log('[Migration] Migration reset complete');
}
```

**Fix:** Remove the `resetMigration` method entirely from the production code. If it's needed for testing, it should live only in test setup files.

Delete lines 88-101 (the entire `resetMigration` method including JSDoc).

**What depends on this:**
- Grep for `resetMigration` to check test files. If tests call `Migration.resetMigration()`, they should directly call `chrome.storage.local.remove()` instead.

**What could break:**
- Any test that calls `Migration.resetMigration()` will need updating. Since the Chrome mock handles storage operations, tests can call `chrome.storage.local.remove(...)` directly.

---

## API Fixes

### A1 — Durable Object Rate Limiter Completely Broken

**File:** `api/src/ratelimit.js:14-44`

**Problem:** At line 21, the code does:
```javascript
const response = await fetch(stub.url + '/check', { ... });
```

Cloudflare Durable Object stubs do **not** have a `.url` property. `stub.url` is `undefined`, so `undefined + '/check'` produces `"undefined/check"`. The global `fetch()` tries to fetch that URL, throws an error, and the `catch` block at line 40-43 returns `null` (fail open). **Every rate limit check silently passes.**

The correct API is `stub.fetch(url, options)` where `url` can be any URL (the Durable Object ignores the host).

**Current code (lines 20-25):**
```javascript
// Call the Durable Object
const response = await fetch(stub.url + '/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: identifier, limit, windowMs })
});
```

**Fix:** Replace `fetch(stub.url + '/check', ...)` with `stub.fetch(...)`:
```javascript
// Call the Durable Object
const response = await stub.fetch('https://rate-limiter.internal/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: identifier, limit, windowMs })
});
```

The URL `https://rate-limiter.internal/check` is arbitrary — Durable Objects only look at the pathname. Using a descriptive fake host is conventional.

**Also fix the Durable Object's alarm scheduling (lines 148-161):**
The alarm is only scheduled at the end of an alarm handler, but it's never initially scheduled. Add initial scheduling in the constructor or first `fetch`:

In `api/src/durable-objects/RateLimiter.js`, add to the `checkRateLimit` method (after line 53, inside the "first request" block):
```javascript
// Schedule cleanup alarm if not already set
const currentAlarm = await this.state.storage.getAlarm();
if (!currentAlarm) {
  await this.state.storage.setAlarm(Date.now() + 3600000);
}
```

**What depends on this:**
- `checkRateLimit` in `ratelimit.js:122` calls `checkRateLimitDO`. This is the only caller.
- All auth endpoints that call `checkRateLimit(identifier, limit, windowMs, env)` will now actually be rate-limited.

**What could break:**
- Legitimate users who were previously not rate-limited may now hit limits. This is the intended behavior. Verify rate limit presets are reasonable:
  - AUTH: 5/min (reasonable)
  - FREE_KEY_CREATION: 3/hour (reasonable)
  - LICENSE_VALIDATION: 10/min (reasonable)
  - CHECKOUT: 5/hour (reasonable)

**Verification:**
- Deploy to staging
- Send 6 requests to `/api/auth/validate-key` within 1 minute
- Confirm the 11th request returns 429 with `Rate limit exceeded`
- Confirm the rate limit resets after the window expires

---

### A2 — SSRF via Unvalidated `sessionId` in Stripe API URL

**File:** `api/src/subscription.js:368-382`

**Problem:** User-supplied `sessionId` is interpolated directly into a Stripe API URL:
```javascript
const response = await fetchWithTimeout(
  `https://api.stripe.com/v1/checkout/sessions/${sessionId}`, ...
);
```

An attacker could send `sessionId: "../customers"` to hit `https://api.stripe.com/v1/checkout/sessions/../customers` which resolves to `https://api.stripe.com/v1/customers`, using the server's `STRIPE_SECRET_KEY` to access arbitrary Stripe API endpoints.

**Fix:** Validate that `sessionId` matches the Stripe session ID format (alphanumeric with underscores, starting with `cs_`):

```javascript
// After line 373 (the existing null check)
if (!sessionId) {
  return jsonResponse({ error: 'Session ID is required' }, 400);
}

// Add format validation
if (!/^cs_(test_|live_)?[a-zA-Z0-9]+$/.test(sessionId)) {
  return jsonResponse({ error: 'Invalid session ID format' }, 400);
}
```

**What depends on this:**
- The extension's payment success flow sends `sessionId` from the URL query parameter. Legitimate session IDs from Stripe always match `cs_test_*` or `cs_live_*`.

**What could break:**
- Nothing for legitimate flows. Only malicious/malformed session IDs are rejected.

**Verification:**
- Send a request with `sessionId: "../customers"` — should return 400
- Send a request with `sessionId: "cs_test_abc123"` — should proceed normally

---

### A3 — CORS Accepts ANY `*.github.io` Origin

**Files:** `api/src/index.js:189`, `api/src/utils.js:88`

**Problem:** Both `getCORSHeaders()` and `handleCORS()` accept any `*.github.io` origin:
```javascript
else if (origin.match(/^https:\/\/.*\.github\.io$/)) {
  allowedOrigin = origin;
}
```

Combined with `Access-Control-Allow-Credentials: true`, any attacker-controlled GitHub Pages site (e.g., `https://evil.github.io`) can make authenticated cross-origin requests to the API.

**Fix:** Replace the wildcard pattern with the exact allowed origin in both files:

In `api/src/utils.js:88` (inside `handleCORS`):
```javascript
// Before:
else if (origin.match(/^https:\/\/.*\.github\.io$/)) {
// After:
else if (origin === 'https://thesuperiorflash.github.io') {
```

In `api/src/index.js:189` (inside `getCORSHeaders`):
```javascript
// Before:
else if (origin.match(/^https:\/\/.*\.github\.io$/)) {
// After:
else if (origin === 'https://thesuperiorflash.github.io') {
```

**What depends on this:**
- The website at `thesuperiorflash.github.io` makes API calls. This exact origin is already in the `allowedOrigins` array in `handleCORS` (line 52) but NOT in `getCORSHeaders` (line 152-154). The `getCORSHeaders` list only has `captureai.dev`. So this fix also addresses the A4 mismatch.

---

### A4 — CORS Configuration Mismatch Between Preflight and Responses

**Files:** `api/src/utils.js:50-53` vs `api/src/index.js:152-154`

**Problem:** The two CORS functions have different allowed origin lists:

| Origin | `handleCORS` (preflight) | `getCORSHeaders` (response) |
|--------|--------------------------|----------------------------|
| `captureai.dev` | Yes | Yes |
| `thesuperiorflash.github.io` | Yes (exact match) | No (only wildcard `*.github.io`) |
| Localhost (dev) | Yes | Yes |
| Chrome extensions | Yes | Yes |

This means a preflight from `thesuperiorflash.github.io` succeeds, but the actual response gets the wildcard `*.github.io` match instead of the exact match.

**Fix:** Consolidate CORS logic into a single shared function to eliminate the mismatch. Extract the allowed origins check into a helper in `utils.js` and have both functions use it:

```javascript
/**
 * Check if an origin is allowed for CORS
 * @param {string} origin - The request origin
 * @param {object} env - Environment object
 * @returns {string} - The allowed origin or 'null'
 */
export function getAllowedOrigin(origin, env) {
  if (!origin) return 'null';

  const allowedOrigins = [
    'https://captureai.dev',
    'https://thesuperiorflash.github.io',
  ];

  const isDev = env?.ENVIRONMENT === 'development';
  if (isDev) {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000');
  }

  // Exact match
  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  // Chrome extension support
  if (origin.startsWith('chrome-extension://')) {
    const extensionIds = env?.CHROME_EXTENSION_IDS;
    if (extensionIds) {
      const allowedExtensionIds = extensionIds.split(',').map(id => id.trim());
      const allowedExtensions = allowedExtensionIds.map(id => `chrome-extension://${id}`);
      if (allowedExtensions.includes(origin)) {
        return origin;
      }
    } else if (isDev) {
      return origin;
    }
  }

  return 'null';
}
```

Then update both `handleCORS` and `getCORSHeaders` to call `getAllowedOrigin(origin, env)` instead of duplicating the logic.

**What depends on this:**
- Every API request goes through `getCORSHeaders` (via `addSecurityHeaders` in `index.js:129`).
- Every OPTIONS request goes through `handleCORS` (via `index.js:73`).

**What could break:**
- Requests from the GitHub Pages site that previously matched the wildcard `*.github.io` will now only match the exact `thesuperiorflash.github.io` origin. This is the desired behavior.

**Verification:**
- Send a request with `Origin: https://thesuperiorflash.github.io` — should get `Access-Control-Allow-Origin: https://thesuperiorflash.github.io` in both preflight and response
- Send a request with `Origin: https://evil.github.io` — should get `Access-Control-Allow-Origin: null`
- Send a request with `Origin: https://captureai.dev` — should work
- Test Chrome extension origin — should work when ID is in env var

---

## Website Fixes

### W1 — Plan Selection Cards Not Keyboard Accessible

**File:** `website/app/activate/page.tsx:170-177, 214-221`

**Problem:** Plan selection cards are `<div>` elements with `onClick` but no keyboard support. Keyboard-only users cannot select a plan (WCAG 2.1.1 failure).

**Current code (Free plan card, line 170-177):**
```tsx
<div
  className={`glass-card cursor-pointer rounded-2xl p-7 transition-all duration-300 ${...}`}
  onClick={() => setSelectedTier('free')}
>
```

**Fix:** Change `<div>` to `<button>` elements for both plan cards. This provides keyboard support (`Enter`/`Space`), focus management, and screen reader announcements automatically.

Free plan card:
```tsx
<button
  type="button"
  className={`glass-card cursor-pointer rounded-2xl p-7 text-left transition-all duration-300 w-full ${...}`}
  onClick={() => setSelectedTier('free')}
  aria-pressed={selectedTier === 'free'}
>
```

Pro plan card (line 214-221):
```tsx
<button
  type="button"
  className={`relative cursor-pointer rounded-2xl text-left transition-all duration-300 w-full ${...}`}
  onClick={() => setSelectedTier('pro')}
  aria-pressed={selectedTier === 'pro'}
>
```

Key additions:
- `type="button"` prevents form submission behavior
- `text-left` preserves the visual layout (buttons default to center-aligned)
- `w-full` ensures the button fills its grid cell
- `aria-pressed` communicates the selected state to screen readers

**What could break:**
- Button styling resets (browsers apply default button styles). The `text-left` and existing Tailwind classes should handle this, but verify there's no padding/border reset needed. May need to add `bg-transparent border-0` to the className if browser defaults interfere.

---

### W2 — Unvalidated Redirect from API Response

**File:** `website/app/activate/page.tsx:135-143`

**Problem:** After creating a checkout session, the API returns a URL that the client redirects to without validation:
```tsx
const data = await apiPost(`${API_BASE_URL}/api/subscription/create-checkout`, { email })
if (data.url) {
  window.location.href = data.url as string
}
```

If the API is compromised, users could be redirected to phishing sites.

**Fix:** Validate the URL before redirecting. Stripe checkout URLs always start with `https://checkout.stripe.com/`:

```tsx
const handleProSignup = async () => {
  const data = await apiPost(`${API_BASE_URL}/api/subscription/create-checkout`, { email })

  if (data.url) {
    const url = data.url as string
    // Validate the redirect URL points to Stripe
    if (!url.startsWith('https://checkout.stripe.com/')) {
      throw new Error('Invalid checkout URL received')
    }
    window.location.href = url
  } else {
    throw new Error('No checkout URL received')
  }
}
```

**What depends on this:**
- Only the Pro signup flow. Free signups don't redirect.

**What could break:**
- If Stripe changes their checkout URL format (extremely unlikely for a breaking change). The `https://checkout.stripe.com/` prefix has been stable for years.

---

## Testing Strategy

### Manual Testing Checklist

**Extension (after E1, E2, E4):**
- [ ] Visit a Canvas/LMS site — privacy guard still blocks visibility detection
- [ ] Visit a form-heavy site (e.g., Google Forms) — inputs receive focus/blur normally
- [ ] Open DevTools console on any page — no `[Privacy Guard]` messages
- [ ] Open service worker console — no debug image data logged
- [ ] In DevTools, confirm `window._addEventListener` is `undefined`
- [ ] Confirm `window.Migration.resetMigration` is `undefined` (or `Migration.resetMigration`)

**API (after A1-A4):**
- [ ] Send 11+ requests to `/api/auth/validate-key` in 1 minute — 11th should return 429
- [ ] Send `sessionId: "../customers"` to `/api/subscription/verify-payment` — should return 400
- [ ] Send request with `Origin: https://evil.github.io` — should get `null` CORS origin
- [ ] Send request with `Origin: https://thesuperiorflash.github.io` — should work
- [ ] Send OPTIONS preflight + actual request — both should have matching CORS headers

**Website (after W1, W2):**
- [ ] Navigate to `/activate` page using keyboard only (Tab key) — can select plan
- [ ] Press Enter/Space on a plan card — card becomes selected
- [ ] Screen reader announces plan selection state
- [ ] Complete a Pro signup — redirect goes to `checkout.stripe.com`

### Automated Tests to Add

| Test | File | What to assert |
|------|------|----------------|
| Rate limiter uses `stub.fetch` | `api/tests/ratelimit.test.js` (new) | Mock DO stub, verify `stub.fetch` called with correct URL |
| Session ID validation | `api/tests/subscription.test.js` (new) | `../customers` rejected, `cs_test_abc` accepted |
| CORS exact match | `api/tests/cors.test.js` (new) | `evil.github.io` rejected, exact origins accepted |
| Privacy guard no bypass | `tests/unit/inject.test.js` (new) | `_addEventListener` not on prototypes |
| Focus events not globally blocked | `tests/unit/inject.test.js` (new) | Input elements can add focus listeners |

---

## Rollback Plan

Each fix is independently revertable via `git revert <commit>`:

| Fix | Rollback Impact |
|-----|-----------------|
| E4 (debug flags) | Re-enables debug logging. No functional impact. |
| E6 (resetMigration) | Re-exposes test method. Low risk. |
| E5 (globals) | Minimal since content script is isolated world. |
| E1 (bypass methods) | Re-exposes `_addEventListener` on prototypes. |
| E2 (focus scope) | Reverts to global focus blocking. Forms break again. |
| A1 (rate limiter) | Reverts to broken rate limiter (fail open). |
| A3+A4 (CORS) | Reverts to wildcard + mismatched CORS. |
| A2 (SSRF) | Reverts to unvalidated session ID. |
| W1 (accessibility) | Reverts to div-based cards. |
| W2 (redirect) | Reverts to unvalidated redirect. |

**Emergency rollback:** If rate limiter (A1) causes issues for legitimate users, the in-memory fallback is still functional. Set `RATE_LIMITER` binding to undefined in `wrangler.toml` to bypass Durable Objects entirely while investigating.
