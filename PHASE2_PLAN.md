# Phase 2 Implementation Plan — Reliability & Core Bugs

> **Scope:** 23 issues across extension (E8-E16), API (A5-A11), and website (W3-W8)
> **Goal:** Fix bugs that cause crashes, incorrect behavior, and data integrity issues
> **Prerequisite:** Phase 1 (branch `claude/implement-phase1-improvements-BVOsF`) merged

---

## Table of Contents

1. [Dependency Graph & Execution Order](#dependency-graph--execution-order)
2. [Extension Fixes (E8-E16)](#extension-fixes-e8-e16)
3. [API Fixes (A5-A11)](#api-fixes-a5-a11)
4. [Website Fixes (W3-W8)](#website-fixes-w3-w8)
5. [Testing Strategy](#testing-strategy)
6. [Rollback Plan](#rollback-plan)

---

## Dependency Graph & Execution Order

The fixes are grouped into independent work streams. Items within a stream are ordered by dependency and risk.

```
Stream 1: Extension URL/Validation (E8)
Stream 2: Extension Popup Crash Fix (E9)
Stream 3: Extension Null Deref Fix (E10)
Stream 4: Extension Auto-solve (E11 → E12)
Stream 5: Extension Error Handling (E13 → E14)
Stream 6: Extension Privacy/UX (E15 → E16)
Stream 7: API Security & Correctness (A5 → A6 → A7 → A8 → A10 → A11)
Stream 8: Website Accessibility & SEO (W3 → W4 → W5 → W6 → W7 → W8)
```

**Recommended commit order** (safest first):

| Order | Item(s) | Risk | Reason |
|-------|---------|------|--------|
| 1 | E9 | Very Low | Fix undefined element reference, no behavioral change |
| 2 | E10 | Very Low | Fix guaranteed null dereference in fallback path |
| 3 | E8 | Low | Fix URL validation logic, additive check |
| 4 | E13 | Low | Add filtering to unhandled rejection handler |
| 5 | E14 | Low | Add error handling to storage wrappers |
| 6 | E11 | Low | Improve regex for answer extraction |
| 7 | E12 | Low | Remove duplicate Enter dispatch |
| 8 | E16 | Medium | Stop migration from deleting user tier |
| 9 | E15 | Medium | Bundle fonts locally, removes external CDN requests |
| 10 | A5 | Medium | Add IP-based rate limiting to AI endpoints |
| 11 | A6 | Low | Replace deprecated parseJSON with validateRequestBody |
| 12 | A7 | Medium | Normalize email case in all DB queries |
| 13 | A8 | Low | Add missing useLegacyTokenParam to config |
| 14 | A10 | Very Low | Replace hardcoded test Stripe URL |
| 15 | A11 | Low | Add timeout to AI Gateway fetch |
| 16 | W3 | Very Low | Add metadataBase for SEO |
| 17 | W4 | Very Low | Improve contrast for tertiary text |
| 18 | W5 | Very Low | Add skip navigation link |
| 19 | W6 | Very Low | Add aria-label to email input |
| 20 | W7 | Very Low | Add text alternative to loading spinner |
| 21 | W8 | Very Low | Standardize contact emails |

---

## Extension Fixes (E8-E16)

### E8 — `isValidUrl` Chrome Web Store Check Never Matches

**Files:** `background.js:703-708`, `modules/domains.js:87-92`

**Problem:** The URL validation has two bugs:
1. `url.startsWith('http://')` is checked first, so `!url.startsWith('chrome://')` is always true for HTTP/HTTPS URLs (redundant, not harmful).
2. `!url.startsWith('chrome.google.com')` — a URL never starts with a bare domain (it starts with `https://`), so the Chrome Web Store is never blocked.

**Current code (both files, identical):**
```javascript
function isValidUrl(url) {
  return (url.startsWith('http://') || url.startsWith('https://')) &&
         !url.startsWith('chrome://') &&
         !url.startsWith('chrome-extension://') &&
         !url.startsWith('chrome.google.com');
}
```

**Fix:** Replace the bare domain check with a proper URL-based check. Also consolidate the redundant `chrome://` check (already excluded by the `http://`/`https://` requirement).

```javascript
function isValidUrl(url) {
  if (!url) return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    // Block Chrome Web Store
    if (hostname === 'chrome.google.com' || hostname === 'chromewebstore.google.com') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
```

**Apply to both:** `background.js:703-708` and `modules/domains.js:87-92`.

**What could break:** Sites that previously matched the non-functional check will now be properly blocked. This is the intended behavior.

---

### E9 — `elements.buyProBtn` is Undefined — TypeError on Access

**File:** `popup.js:151-171`

**Problem:** The `handleBuyPro` function references `elements.buyProBtn` (lines 151, 152, 164, 165, 170, 171) but the `elements` object (lines 8-32) has no `buyProBtn` property. It does have `upgradeBtn` (line 23).

**Current code (line 151-152):**
```javascript
elements.buyProBtn.disabled = true;
elements.buyProBtn.textContent = 'Opening checkout...';
```

**Fix:** Replace all `elements.buyProBtn` references with `elements.upgradeBtn`:

```javascript
// Line 151-152
elements.upgradeBtn.disabled = true;
elements.upgradeBtn.textContent = 'Opening checkout...';

// Line 164-165
elements.upgradeBtn.disabled = false;
elements.upgradeBtn.textContent = 'Buy Pro Key ($9.99/month)';

// Line 170-171
elements.upgradeBtn.disabled = false;
elements.upgradeBtn.textContent = 'Buy Pro Key ($9.99/month)';
```

**What could break:** Nothing — this fixes a guaranteed TypeError.

---

### E10 — Null Dereference in `displayRegularResponse` Fallback

**File:** `modules/messaging.js:305-320`

**Problem:** The `else` branch at line 314 executes when `window.CaptureAI.UICore` is falsy, then immediately calls `window.CaptureAI.UICore.showMessage()` on line 317, which is guaranteed to throw TypeError.

**Current code:**
```javascript
if (window.CaptureAI.UICore) {
  window.CaptureAI.UICore.displayAIResponse(response, isError);
} else {
  STATE.isShowingAnswer = true;
  window.CaptureAI.UICore.showMessage(response, isError); // TypeError
  STATE.isShowingAnswer = false;
}
```

**Fix:** The fallback should use `UIComponents` instead of `UICore`, or log a warning if neither is available:

```javascript
if (window.CaptureAI.UICore) {
  window.CaptureAI.UICore.displayAIResponse(response, isError);
} else if (window.CaptureAI.UIComponents) {
  STATE.isShowingAnswer = true;
  window.CaptureAI.UIComponents.showMessage(response, isError);
  STATE.isShowingAnswer = false;
} else {
  console.error('[Messaging] No UI system available to display response');
}
```

**What could break:** Nothing — this replaces a guaranteed crash with a working fallback.

---

### E11 — Auto-solve Answer Extraction Matches Wrong Digit

**File:** `modules/auto-solve.js:248`

**Problem:** `cleanResponse.match(/[1-4]/)` matches the **first** digit 1-4 anywhere in the response. For a response like "Question 3 is answered by option 2", it matches `3` instead of `2`.

**Current code:**
```javascript
const answerMatch = cleanResponse.match(/[1-4]/);
```

**Fix:** Use a more targeted regex that looks for the answer pattern. The AI is prompted to respond with just the number, so we should match the last digit 1-4 in the response (most likely to be the actual answer), or better yet, match a standalone digit:

```javascript
// Match a standalone digit 1-4 (not part of a larger number)
const answerMatch = cleanResponse.match(/(?:^|[^0-9])([1-4])(?:[^0-9]|$)/);
if (answerMatch) {
  const answerNumber = answerMatch[1]; // Capture group
```

If the response is just a bare number (most common case from the AI prompt "Answer with only the number"), the standalone pattern handles it. If the response contains "Question 3 is answered by option 2", the last standalone match is `2`.

**Alternative simpler approach:** Since the prompt tells the AI to respond with only the number, match the last occurrence:

```javascript
const matches = cleanResponse.match(/[1-4]/g);
const answerNumber = matches ? matches[matches.length - 1] : null;
```

**Recommended:** Use the last-occurrence approach — it's simpler and handles edge cases better.

**What could break:** Responses where a preceding digit was coincidentally correct would now use the last digit instead. Given the AI prompt format ("Answer with only the number"), the last digit is more reliable.

---

### E12 — Enter Key Dispatched Twice in Auto-solve

**File:** `modules/auto-solve.js:393-417`

**Problem:** The Enter key event is dispatched to both `activeElement` (captured earlier) and `document.activeElement`. These are usually the same element, causing Enter to fire twice — potentially double-submitting or skipping questions.

**Current code:**
```javascript
if (activeElement && activeElement.dispatchEvent) {
  activeElement.dispatchEvent(enterEvent);
}

// Also try document.activeElement
if (document.activeElement && document.activeElement.dispatchEvent) {
  document.activeElement.dispatchEvent(enterEvent);
}
```

**Fix:** Remove the duplicate dispatch. Use `document.activeElement` as the single target since it reflects the current state at dispatch time:

```javascript
const target = document.activeElement || activeElement;
if (target && target.dispatchEvent) {
  target.dispatchEvent(enterEvent);
}
```

**What could break:** Edge cases where `activeElement` and `document.activeElement` differ (e.g., focus moved between capture and dispatch). Using `document.activeElement` is correct because it reflects current state at the time of dispatch.

---

### E13 — `unhandledrejection` Handler Resets Entire Extension State

**File:** `modules/event-manager.js:172-185`

**Problem:** The `error` handler at line 174 properly filters for extension errors (`event.filename.includes('chrome-extension://')`), but the `unhandledrejection` handler at line 182 has **no filtering**. Any unhandled promise rejection from any source on the page triggers `handleError`, which calls `resetState()`.

**Current code:**
```javascript
window.addEventListener('unhandledrejection', (event) => {
  this.handleError(event.reason, 'Unhandled Promise');
});
```

**Fix:** Add filtering to only handle rejections from our extension. Since `unhandledrejection` events don't have a `filename`, we need to check the error's stack trace:

```javascript
window.addEventListener('unhandledrejection', (event) => {
  // Only handle rejections from our extension
  const reason = event.reason;
  const stack = reason?.stack || '';
  if (stack.includes('chrome-extension://')) {
    this.handleError(reason, 'Unhandled Promise');
  }
});
```

**What could break:** Extension rejections without a stack trace (e.g., `Promise.reject('string')`) would no longer trigger the handler. This is acceptable since string rejections shouldn't trigger full state resets anyway.

---

### E14 — Storage Wrapper Promises Never Reject

**File:** `modules/storage.js:1-70`

**Problem:** All Chrome storage wrappers use `new Promise((resolve) => ...)` with no `reject` parameter. `chrome.runtime.lastError` is never checked. Storage failures (quota exceeded, corruption) are silently swallowed.

**Current code (example):**
```javascript
export function setValue(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}
```

**Fix:** Add `reject` parameter and check `chrome.runtime.lastError`:

```javascript
export function setValue(key, value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

export function getValue(key, defaultValue = null) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result[key] !== undefined ? result[key] : defaultValue);
      }
    });
  });
}

export function getValues(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}

export function removeValue(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(key, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

export function clear() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}
```

**What could break:** Callers that don't handle rejections will now get unhandled promise rejections. This is actually desirable — silent storage failures are worse than visible errors. Callers should add `.catch()` handlers where appropriate, but that's a broader refactor for later.

---

### E15 — External Google Fonts CDN Requests Leak Extension Usage

**Files:** `popup.html:5`, `modules/ui-core.js:22-28`, `modules/ui-stealthy-result.js:19-25`

**Problem:** Three separate external font requests to Google's CDN:
1. `popup.html:5` — `<link>` tag loads Inter font
2. `ui-core.js:22-28` — Dynamic `<link>` injection loads Inter font
3. `ui-stealthy-result.js:19-25` — Dynamic `<link>` injection loads Roboto font (but uses Inter on line 43)

This leaks extension usage to Google on every page/popup load.

**Fix (multi-step):**

**Step 1:** Download Inter font files and bundle them with the extension:
- Download Inter-Regular (400), Inter-Medium (500), Inter-SemiBold (600), Inter-Bold (700) WOFF2 files
- Place them in a new `fonts/` directory

**Step 2:** Create a `fonts/fonts.css` file with `@font-face` declarations:
```css
@font-face {
  font-family: 'Inter';
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url('Inter-Regular.woff2') format('woff2');
}
/* ... repeat for 500, 600, 700 weights */
```

**Step 3:** Update `popup.html:5` — replace Google Fonts link with local CSS:
```html
<link href="fonts/fonts.css" rel="stylesheet">
```

**Step 4:** Update `ui-core.js:22-28` — load local font CSS instead of Google CDN:
```javascript
loadFont() {
  if (!document.querySelector('link[href*="fonts.css"]')) {
    const fontLink = document.createElement('link');
    fontLink.href = chrome.runtime.getURL('fonts/fonts.css');
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
  }
}
```

**Step 5:** Update `ui-stealthy-result.js:19-25` — remove Roboto font loading entirely (it uses Inter, not Roboto):
```javascript
// Remove the Roboto font loading block entirely
```

**Step 6:** Add font files to `manifest.json` `web_accessible_resources` if needed for content script access.

**What could break:** Font rendering may differ slightly between Google Fonts CDN and locally bundled files (subsetting, hinting). Visual testing required.

---

### E16 — Migration Deletes `captureai-user-tier`, Breaking Pro Features

**File:** `modules/migration.js:44-50`

**Problem:** The migration removes `captureai-user-tier` from storage (line 49), but `ui-core.js:393` and `ui-components.js:547` read it to determine Pro feature visibility. After migration, all users default to free tier.

**Current code (line 44-50):**
```javascript
await chrome.storage.local.remove([
  'captureai-api-key',
  'captureai-auth-token',
  'captureai-user-email',
  'captureai-user-tier'
]);
```

**Fix:** Remove `captureai-user-tier` from the list of keys deleted during migration. The old API key and auth token are legitimately obsolete, but user tier should be preserved:

```javascript
await chrome.storage.local.remove([
  'captureai-api-key',
  'captureai-auth-token',
  'captureai-user-email'
]);
```

**Note:** `captureai-user-email` removal is also questionable — if the user has a known email, deleting it forces re-entry. However, the migration is moving from API keys to license keys, so the email context changes. We remove only `captureai-user-tier` from this deletion list.

**What could break:** Nothing — we're removing a destructive operation on user data that should never have been there.

---

## API Fixes (A5-A11)

### A5 — No IP-based Rate Limiting on AI Endpoints

**Files:** `api/src/ai.js:43-49`, `api/src/router.js:61-65`

**Problem:** The AI endpoints (`/api/ai/solve`, `/api/ai/complete`) authenticate first, then check usage limits. However:
1. Unauthenticated requests with invalid keys still trigger a DB query in `authenticate()` before being rejected.
2. There is no IP-based rate limiting to prevent brute-force or DoS attacks on these endpoints.

**Fix:** Add IP-based rate limiting before authentication in the `complete` and `solve` methods:

```javascript
async complete(request) {
  try {
    // IP-based rate limiting (before auth to prevent DoS)
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipRateLimit = await checkRateLimit(
      `ai:${clientIP}`,
      60,        // 60 requests
      60000,     // per minute
      this.env
    );
    if (ipRateLimit && !ipRateLimit.allowed) {
      return jsonResponse({ error: 'Too many requests. Please try again later.' }, 429);
    }

    // Authenticate
    const user = await this.auth.authenticate(request);
    // ... rest of method
  }
}
```

Import `checkRateLimit` from `./ratelimit` in `ai.js`.

**What could break:** Legitimate users behind shared IPs (NAT, corporate networks) could hit the IP limit. 60/min is generous enough for normal use. The per-user limits still apply separately.

---

### A6 — AI Endpoint Uses Deprecated `parseJSON` with No Body Size Limit

**File:** `api/src/ai.js:6,68`

**Problem:** Line 68 uses `parseJSON(request)` instead of `validateRequestBody(request)`. Since `imageData` can contain large base64 images, there's no body size limit.

**Current code:**
```javascript
import { jsonResponse, parseJSON } from './utils';
// ...
const { question, imageData, ocrText, ocrConfidence, promptType, reasoningLevel } = await parseJSON(request);
```

**Fix:** Replace `parseJSON` with `validateRequestBody` from `validation.js`:

```javascript
import { jsonResponse } from './utils';
import { validateRequestBody } from './validation';
// ...
const body = await validateRequestBody(request); // Has 10MB default size limit
const { question, imageData, ocrText, ocrConfidence, promptType, reasoningLevel } = body;
```

Remove `parseJSON` from the import. Apply to both `complete()` and `solve()` methods if both use `parseJSON`.

**What could break:** Legitimate requests larger than the default size limit (10MB) would be rejected. Base64-encoded screenshots are typically 100KB-2MB, well within limits.

---

### A7 — Email-Based User Lookup is Case-Sensitive in Webhooks

**Files:** `api/src/subscription.js:50-53,169-172,244,262`

**Problem:** `auth.js` normalizes emails with `LOWER()` in queries, but `subscription.js` uses raw `email = ?` comparisons. If a user registers as `User@Email.com` but Stripe sends `user@email.com`, the subscription won't update.

**Affected queries in `subscription.js`:**
- Line 50: `WHERE email = ?` (checkout creation)
- Line 169: `WHERE email = ? OR stripe_customer_id = ?` (webhook handler)
- Line 244: `WHERE email = ?` (payment success update)
- Line 262: `WHERE email = ?` (payment failure update)

**Fix:** Normalize email to lowercase in all queries:

1. At the beginning of each method that receives an email, normalize it:
   ```javascript
   const normalizedEmail = email.toLowerCase().trim();
   ```

2. Update all SQL queries to use `LOWER()`:
   ```sql
   -- Line 50
   WHERE LOWER(email) = ?
   -- Line 169
   WHERE LOWER(email) = ? OR stripe_customer_id = ?
   -- Line 244
   WHERE LOWER(email) = ?
   -- Line 262
   WHERE LOWER(email) = ?
   ```

3. Bind the normalized email value.

**What could break:** Nothing — case normalization is strictly more correct.

---

### A8 — `buildPayload` References Non-Existent `config.useLegacyTokenParam`

**File:** `api/src/ai.js:562-676`

**Problem:** At line 662, the code checks `config.useLegacyTokenParam`, but the `configs` object (lines 570-574) doesn't define this property. It's always `undefined`, so `gpt-4.1-nano` (level 0) always gets `max_completion_tokens` instead of `max_tokens`.

**Current code:**
```javascript
const configs = {
  0: { model: 'openai/gpt-4.1-nano', reasoningEffort: null },
  1: { model: 'openai/gpt-5-nano', reasoningEffort: 'low' },
  2: { model: 'openai/gpt-5-nano', reasoningEffort: 'medium' }
};
// ...
if (config.useLegacyTokenParam) {  // Always undefined → false
    payload.max_tokens = maxTokens;
} else {
    payload.max_completion_tokens = maxTokens;
}
```

**Fix:** Add `useLegacyTokenParam: true` to the gpt-4.1-nano config:

```javascript
const configs = {
  0: { model: 'openai/gpt-4.1-nano', reasoningEffort: null, useLegacyTokenParam: true },
  1: { model: 'openai/gpt-5-nano', reasoningEffort: 'low' },
  2: { model: 'openai/gpt-5-nano', reasoningEffort: 'medium' }
};
```

**What could break:** If `gpt-4.1-nano` was already working with `max_completion_tokens`, this change would switch it to `max_tokens`. Check the OpenAI API docs for the model — `gpt-4.1-nano` uses `max_tokens`, so this fix is correct.

---

### A9 — No Database Schema or Migrations

**Status: RESOLVED.** Database schema files already exist:
- `api/schema.sql` — Main schema with `users`, `usage_records`, `webhook_events` tables
- `api/schema-license.sql` — License-specific schema
- `api/migrations/001_add_indexes_and_webhook_tracking.sql` — Index migration
- `api/migrations/002_add_token_breakdown.sql` — Token tracking migration

**No action required.** The IMPROVEMENTS.md was written before these files were created.

---

### A10 — Hardcoded Test Stripe Billing Portal URL in Email Template

**File:** `api/src/auth.js:709`

**Problem:** The welcome email for Pro users contains a hardcoded test Stripe billing portal URL:
```html
<a href="https://billing.stripe.com/p/login/test_123">billing settings</a>
```

**Fix:** Use the `STRIPE_BILLING_PORTAL_URL` environment variable, or generate the URL dynamically via the Stripe API. The simplest fix is to use an env var with a fallback:

```javascript
const billingUrl = this.env.STRIPE_BILLING_PORTAL_URL || 'https://billing.stripe.com';
// ...
`<a href="${billingUrl}" style="color: #218aff; text-decoration: underline;">billing settings</a>`
```

Alternatively, replace the hardcoded URL with the production portal URL and read it from the env. Since the billing portal URL is created via the Stripe API (`/api/subscription/portal` endpoint already exists at `router.js:84`), the email could link to the app's portal endpoint instead:

```html
<a href="https://captureai.dev/billing">billing settings</a>
```

**Recommended approach:** Use the environment variable for flexibility.

**What could break:** Nothing — the current hardcoded URL doesn't work anyway.

---

### A11 — No Timeout on AI Gateway Fetch Call

**File:** `api/src/ai.js:681-712`

**Problem:** `sendToGateway` uses bare `fetch()` with no timeout. `fetchWithTimeout` exists in `utils.js` but isn't used here. A hanging gateway consumes the full Worker execution time (30s on free plan, 60s on paid).

**Current code:**
```javascript
const response = await fetch(this.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
});
```

**Fix:** Replace `fetch` with `fetchWithTimeout`:

```javascript
import { jsonResponse, fetchWithTimeout } from './utils';
// ...
const response = await fetchWithTimeout(this.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
}, 30000); // 30-second timeout for AI completions
```

Use 30 seconds since AI completions (especially with reasoning) can take longer than the default 10 seconds.

**What could break:** Slow AI completions that take >30 seconds would now fail with a timeout error instead of hanging. Users get a clear error message instead of waiting indefinitely.

---

## Website Fixes (W3-W8)

### W3 — Missing `metadataBase` and Metadata on Client Pages

**File:** `website/app/layout.tsx:13-53`

**Problem:** No `metadataBase` is defined, so relative OpenGraph image paths resolve incorrectly. Client component pages (`activate`, `payment-success`) can't export metadata.

**Fix:** Add `metadataBase` to the root layout:

```typescript
export const metadata: Metadata = {
    metadataBase: new URL('https://captureai.dev'),
    title: {
      default: 'CaptureAI - AI-Powered Screenshot Answers for Students',
      template: '%s | CaptureAI'
    },
    // ... rest of existing metadata
}
```

For client component pages, use `generateMetadata` in a separate layout or convert the metadata-relevant parts. Since `activate/page.tsx` and `payment-success/page.tsx` are `'use client'`, create server-side metadata via:

1. **`website/app/activate/layout.tsx`** (new file):
```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Activate',
  description: 'Get your CaptureAI license key'
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
```

2. **`website/app/payment-success/layout.tsx`** (new file):
```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Payment Successful',
  description: 'Your CaptureAI Pro subscription is active'
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
```

**What could break:** Nothing — purely additive SEO improvement.

---

### W4 — Low Contrast on Tertiary Text

**File:** `website/app/globals.css:21`

**Problem:** `--color-text-tertiary: #5f6577` on background `#06060a` yields ~4.0:1 contrast. WCAG AA requires 4.5:1 for normal text.

**Current code:**
```css
--color-text-tertiary: #5f6577;
```

**Fix:** Lighten to `#8a8fa0` which gives ~5.5:1 contrast against `#06060a`:

```css
--color-text-tertiary: #8a8fa0;
```

**What could break:** Visual design may look slightly different (lighter tertiary text). Designers should verify the aesthetic impact.

---

### W5 — No Skip Navigation Link

**File:** `website/app/layout.tsx:60-72`

**Problem:** No skip navigation link for keyboard users. WCAG 2.4.1 failure.

**Fix:** Add a skip link before `<Navbar />`:

```tsx
<body className={`noise ${inter.className}`}>
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
  >
    Skip to main content
  </a>
  {/* Blue glow behind translucent navbar */}
  <div className="pointer-events-none fixed top-0 left-0 right-0 z-40 h-32 bg-[radial-gradient(...)]" />
  <Navbar />
  <main id="main-content" className="min-h-screen pt-16">
    {children}
  </main>
  <Footer />
</body>
```

**What could break:** Nothing — the link is visually hidden until focused via keyboard.

---

### W6 — No `aria-label` on Email Input

**File:** `website/app/activate/page.tsx:295-307`

**Problem:** Email input has placeholder text but no `<label>` element or `aria-label`. Screen readers only announce "you@email.com".

**Fix:** Add `aria-label`:

```tsx
<input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    onKeyDown={(e) => {
        if (e.key === 'Enter' && !loading) {
            e.preventDefault()
            handleSignup()
        }
    }}
    placeholder="you@email.com"
    autoComplete="email"
    aria-label="Email address"
    className="..."
/>
```

**What could break:** Nothing — purely additive accessibility.

---

### W7 — Loading Spinner Has No Text Alternative

**File:** `website/app/activate/page.tsx:319-326`

**Problem:** The loading spinner is a CSS-only `<span>` with no accessible name.

**Current code:**
```tsx
{loading ? (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
) : ( ... )}
```

**Fix:** Add `role="status"` and `aria-label`:

```tsx
{loading ? (
    <span
      role="status"
      aria-label="Loading"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
    />
) : ( ... )}
```

**What could break:** Nothing — purely additive accessibility.

---

### W8 — Inconsistent Contact Emails Across Site

**Files:** `website/app/contact/page.tsx:44,62`, `website/app/privacy/page.tsx:149`, `website/app/terms/page.tsx:99,183`

**Problem:** Contact page uses branded emails (`support@captureai.dev`, `feedback@captureai.dev`) but Privacy Policy and Terms use a personal Gmail (`wonhappyheart@gmail.com`). This is unprofessional in legal documents.

**Fix:** Replace all Gmail references with the branded email:

1. **`privacy/page.tsx:149`:** Replace `wonhappyheart@gmail.com` with `support@captureai.dev`
2. **`terms/page.tsx:99`:** Replace `wonhappyheart@gmail.com` with `support@captureai.dev`
3. **`terms/page.tsx:183`:** Replace `wonhappyheart@gmail.com` with `support@captureai.dev`

**What could break:** Users who previously emailed the Gmail address need to be informed. The branded email should forward appropriately.

---

## Testing Strategy

### Manual Testing Checklist

**Extension (E8-E16):**
- [ ] Navigate to Chrome Web Store — extension should NOT offer capture (E8)
- [ ] Click "Buy Pro" button in popup — no TypeError (E9)
- [ ] Trigger `displayRegularResponse` when UICore is null — no crash (E10)
- [ ] Run auto-solve on a multiple choice question — correct answer selected (E11)
- [ ] Auto-solve presses Enter only once per question (E12)
- [ ] Trigger a non-extension promise rejection — extension state NOT reset (E13)
- [ ] Exhaust storage quota — storage operations properly reject (E14)
- [ ] Check DevTools Network tab — no requests to fonts.googleapis.com (E15)
- [ ] After migration, verify user tier is preserved (E16)

**API (A5-A11):**
- [ ] Send 61+ requests from same IP in 1 minute to `/api/ai/complete` — 429 response (A5)
- [ ] Send >10MB request body to `/api/ai/complete` — 413/400 rejection (A6)
- [ ] Register as `User@Email.com`, send Stripe webhook as `user@email.com` — subscription updates (A7)
- [ ] Use reasoning level 0 (gpt-4.1-nano) — payload uses `max_tokens` not `max_completion_tokens` (A8)
- [ ] Check Pro welcome email — billing link is not a test URL (A10)
- [ ] Simulate a hanging AI gateway — request times out after 30s with error (A11)

**Website (W3-W8):**
- [ ] Check page source for `<meta property="og:image">` — has full URL with captureai.dev domain (W3)
- [ ] Check tertiary text contrast in DevTools — ratio >= 4.5:1 (W4)
- [ ] Tab from address bar — "Skip to main content" link appears (W5)
- [ ] Navigate with screen reader on activate page — email input announced as "Email address" (W6)
- [ ] Start loading with screen reader — spinner announced as "Loading" (W7)
- [ ] Check privacy policy and terms — all emails are `support@captureai.dev` (W8)

### Automated Tests to Add

| Test | File | What to assert |
|------|------|----------------|
| URL validation blocks CWS | `tests/unit/domains.test.js` | `isValidUrl('https://chrome.google.com/webstore/...')` returns `false` |
| URL validation allows normal URLs | `tests/unit/domains.test.js` | `isValidUrl('https://google.com')` returns `true` |
| Storage rejects on error | `tests/unit/storage.test.js` | Mock `chrome.runtime.lastError`, verify rejection |
| Answer extraction uses last digit | `tests/unit/auto-solve.test.js` | "Question 3 is option 2" → extracts `2` |
| Email normalization in webhooks | `api/tests/subscription.test.js` | Mixed-case email matches lowercased DB entry |
| AI endpoint body size limit | `api/tests/ai.test.js` | >10MB body returns 400 |
| AI gateway timeout | `api/tests/ai.test.js` | Mock hanging fetch, verify timeout error |

---

## Rollback Plan

Each fix is independently revertable via `git revert <commit>`:

| Fix | Rollback Impact |
|-----|-----------------|
| E8 (URL validation) | Chrome Web Store accessible again. Low impact. |
| E9 (buyProBtn) | TypeError returns. Users can't use Buy Pro. |
| E10 (null deref) | Crash returns in fallback path. |
| E11 (answer regex) | Returns to first-match behavior. |
| E12 (double Enter) | Returns to double Enter dispatch. |
| E13 (rejection handler) | All rejections reset state again. |
| E14 (storage errors) | Errors silently swallowed again. |
| E15 (bundled fonts) | Need to restore CDN links. |
| E16 (migration tier) | Migration deletes tier again. |
| A5 (IP rate limit) | AI endpoints open to DoS again. |
| A6 (body validation) | Unlimited request body size. |
| A7 (email case) | Case-sensitive email matching. |
| A8 (token param) | gpt-4.1-nano uses wrong token param. |
| A10 (Stripe URL) | Test URL in emails again. |
| A11 (gateway timeout) | No timeout on AI requests. |
| W3-W8 (website) | SEO/accessibility regressions. |
