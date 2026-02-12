# Comprehensive Test Plan for Phase 1 & 2 Improvements

> **Purpose:** Ensure that security, correctness, and reliability improvements from Phase 1 and Phase 2 did not introduce regressions or break existing functionality.

---

## Table of Contents

1. [Extension Tests](#extension-tests)
2. [API Tests](#api-tests)
3. [Website Tests](#website-tests)
4. [Automated Test Requirements](#automated-test-requirements)
5. [Regression Testing Priority](#regression-testing-priority)

---

## Extension Tests

### Privacy Guard (Phase 1: E1, E2, E4)

**Test E1: Privacy Guard Bypass Removed**
- [ ] Open any webpage with the extension active
- [ ] Open DevTools console on the page
- [ ] Run: `window._addEventListener`
- [ ] **Expected:** Should be `undefined` (not a function)
- [ ] Run: `document._addEventListener`
- [ ] **Expected:** Should be `undefined` (not a function)
- [ ] **Why:** Confirms the privacy guard bypass methods were properly removed

**Test E2: Focus/Blur Events Work on Form Elements**
- [ ] Visit a form-heavy website (e.g., Google Forms, any login page)
- [ ] Tab through input fields
- [ ] **Expected:** Focus rings appear on inputs as you tab through
- [ ] Click in an input field, then click outside
- [ ] **Expected:** Validation messages appear if applicable (blur events working)
- [ ] Test dropdown menus and autocomplete features
- [ ] **Expected:** All work normally
- [ ] **Why:** Confirms focus/blur blocking is scoped to window/document only

**Test E2: Focus/Blur Still Blocked on Window/Document**
- [ ] Visit a tab-detection test site (create one if needed with `window.addEventListener('blur', ...)`)
- [ ] Add a listener: `window.addEventListener('blur', () => console.log('blur!'))`
- [ ] Switch tabs
- [ ] **Expected:** Console message does NOT appear (event blocked)
- [ ] **Why:** Confirms window/document-level blocking still works for privacy

**Test E4: Debug Mode Disabled**
- [ ] Load the extension
- [ ] Open DevTools console on any webpage
- [ ] Navigate and interact with pages
- [ ] **Expected:** No `[Privacy Guard]` messages appear in console
- [ ] Open extension service worker console (chrome://extensions → service worker)
- [ ] Capture a screenshot
- [ ] **Expected:** No base64 debug data logged
- [ ] **Expected:** No `CaptureAI Debug` messages appear
- [ ] **Why:** Confirms all debug flags are set to false

### Extension Globals (Phase 1: E5, E6)

**Test E6: resetMigration Method Removed**
- [ ] Open extension popup
- [ ] Open DevTools console in popup
- [ ] Run: `Migration.resetMigration`
- [ ] **Expected:** Should be `undefined` (method removed)
- [ ] **Why:** Confirms dangerous test method is not in production

### URL Validation (Phase 2: E8)

**Test E8: Chrome Web Store Blocked**
- [ ] Navigate to `https://chrome.google.com/webstore/category/extensions`
- [ ] Try to capture a screenshot
- [ ] **Expected:** Extension should NOT offer to capture or show any UI
- [ ] Navigate to `https://chromewebstore.google.com/`
- [ ] **Expected:** Extension should NOT work here either
- [ ] **Why:** Confirms URL validation properly blocks Chrome Web Store

**Test E8: Normal Sites Still Work**
- [ ] Navigate to any normal website (e.g., `https://google.com`, `https://github.com`)
- [ ] **Expected:** Extension capture functionality works normally
- [ ] **Why:** Ensures URL validation doesn't block legitimate sites

### Popup Functionality (Phase 2: E9)

**Test E9: Buy Pro Button Works**
- [ ] Open extension popup
- [ ] If on free tier, click "Buy Pro" or "Upgrade" button
- [ ] **Expected:** No TypeError in console
- [ ] **Expected:** Button shows "Opening checkout..." text
- [ ] **Expected:** Stripe checkout opens in new tab
- [ ] **Why:** Confirms buyProBtn reference was fixed

### Error Handling (Phase 2: E10, E13, E14)

**Test E10: UI Fallback Doesn't Crash**
- [ ] This is difficult to test manually without modifying code
- [ ] **Automated test required:** Mock `window.CaptureAI.UICore` as undefined and verify fallback uses `UIComponents`
- [ ] **Why:** Confirms null dereference is fixed

**Test E13: Extension Rejects Don't Reset State**
- [ ] Visit any webpage
- [ ] Open DevTools console
- [ ] Trigger a promise rejection from page script: `Promise.reject('test')`
- [ ] Check if extension state was affected (try capturing, check if settings persist)
- [ ] **Expected:** Extension continues working normally (no state reset)
- [ ] **Why:** Confirms unhandled rejection handler filters correctly

**Test E14: Storage Error Handling**
- [ ] This requires simulating storage quota exceeded or corruption
- [ ] **Automated test required:** Mock `chrome.runtime.lastError` and verify promises reject
- [ ] **Why:** Confirms storage operations properly reject on error

### Auto-solve (Phase 2: E11, E12)

**Test E11: Answer Extraction Accuracy**
- [ ] Enable auto-solve on a multiple choice quiz
- [ ] Capture a question where the answer is option 2
- [ ] **Expected:** Option 2 is selected (not option 1 or any other digit in the response)
- [ ] Test with various AI response formats
- [ ] **Why:** Confirms improved regex matches the correct answer

**Test E12: Enter Key Pressed Once**
- [ ] Enable auto-solve
- [ ] Add event listener to track Enter key presses:
   ```javascript
   document.addEventListener('keydown', (e) => {
     if (e.key === 'Enter') console.log('Enter pressed!');
   });
   ```
- [ ] Let auto-solve run through a question
- [ ] **Expected:** Only one "Enter pressed!" message per question
- [ ] **Why:** Confirms duplicate Enter dispatch was removed

### Fonts & Privacy (Phase 2: E15)

**Test E15: No External Font Requests**
- [ ] Open extension popup
- [ ] Open DevTools Network tab
- [ ] Filter by "fonts.googleapis.com" or "fonts.gstatic.com"
- [ ] **Expected:** No requests to Google Fonts CDN
- [ ] Visit any webpage with extension active
- [ ] Check Network tab again
- [ ] **Expected:** No external font requests from content script
- [ ] **Why:** Confirms fonts are bundled locally

### Migration (Phase 2: E16)

**Test E16: User Tier Preserved After Migration**
- [ ] Set up a test environment with old API key storage
- [ ] Set `captureai-user-tier` to "pro" in chrome.storage.local
- [ ] Trigger migration (reload extension or manually call migration)
- [ ] Check chrome.storage.local after migration
- [ ] **Expected:** `captureai-user-tier` is still "pro" (not deleted)
- [ ] **Why:** Confirms migration doesn't delete user tier

---

## API Tests

### Rate Limiting (Phase 1: A1, Phase 2: A5)

**Test A1: Rate Limiter Works**
- [ ] Send 6 requests to `/api/auth/validate-key` within 1 minute (limit is 5/min)
- [ ] **Expected:** 6th request returns 429 with `Rate limit exceeded` message
- [ ] Wait for the rate limit window to expire (1 minute)
- [ ] Send another request
- [ ] **Expected:** Request succeeds
- [ ] **Why:** Confirms Durable Object rate limiter is fixed (stub.fetch instead of fetch(stub.url))

**Test A5: IP-Based Rate Limiting on AI Endpoints**
- [ ] Send 61 requests from same IP to `/api/ai/complete` within 1 minute (limit is 60/min)
- [ ] **Expected:** 61st request returns 429
- [ ] Use different authentication but same IP
- [ ] **Expected:** Still rate limited by IP
- [ ] **Why:** Confirms IP-based rate limiting protects against DoS

### Security (Phase 1: A2, A3, A4)

**Test A2: Session ID Validation Blocks SSRF**
- [ ] Send POST to `/api/subscription/verify-payment` with:
   ```json
   {"sessionId": "../customers"}
   ```
- [ ] **Expected:** Returns 400 with "Invalid session ID format"
- [ ] Send with valid session ID:
   ```json
   {"sessionId": "cs_test_abc123"}
   ```
- [ ] **Expected:** Proceeds normally (may fail for other reasons, but not rejected at validation)
- [ ] **Why:** Confirms SSRF vulnerability is fixed

**Test A3: CORS Rejects Wildcard GitHub Pages**
- [ ] Send request with header:
   ```
   Origin: https://evil.github.io
   ```
- [ ] **Expected:** Response has `Access-Control-Allow-Origin: null` or header is missing
- [ ] Send request with:
   ```
   Origin: https://thesuperiorflash.github.io
   ```
- [ ] **Expected:** Response has `Access-Control-Allow-Origin: https://thesuperiorflash.github.io`
- [ ] **Why:** Confirms wildcard *.github.io is removed

**Test A4: CORS Headers Match Between Preflight and Response**
- [ ] Send OPTIONS preflight to any API endpoint with:
   ```
   Origin: https://captureai.dev
   ```
- [ ] Note the `Access-Control-Allow-Origin` value
- [ ] Send actual POST request with same origin
- [ ] **Expected:** Both responses have matching CORS headers
- [ ] Repeat with `https://thesuperiorflash.github.io`
- [ ] **Expected:** Both match for this origin too
- [ ] **Why:** Confirms CORS configuration is consistent

### Request Handling (Phase 2: A6, A7)

**Test A6: AI Endpoint Body Size Limit**
- [ ] Send POST to `/api/ai/complete` with a >10MB request body
- [ ] **Expected:** Returns 413 (Payload Too Large) or 400
- [ ] Send with normal-sized request (~100KB screenshot)
- [ ] **Expected:** Processes normally
- [ ] **Why:** Confirms validateRequestBody replaced parseJSON with size limit

**Test A7: Email Case Normalization**
- [ ] Register a user with email `User@Email.com`
- [ ] Send Stripe webhook with email `user@email.com` (lowercase)
- [ ] Check database
- [ ] **Expected:** User subscription updated correctly despite case difference
- [ ] Try license validation with `USER@EMAIL.COM` (uppercase)
- [ ] **Expected:** User found and validated correctly
- [ ] **Why:** Confirms email queries use LOWER() for case-insensitive matching

### Configuration & Reliability (Phase 2: A8, A10, A11)

**Test A8: Correct Token Parameter for GPT-4.1-nano**
- [ ] Make an AI completion request with `reasoningLevel: 0` (gpt-4.1-nano)
- [ ] Log or inspect the payload sent to AI Gateway
- [ ] **Expected:** Payload contains `max_tokens`, NOT `max_completion_tokens`
- [ ] Try with `reasoningLevel: 1` or `2` (gpt-5-nano)
- [ ] **Expected:** Payload contains `max_completion_tokens`
- [ ] **Why:** Confirms useLegacyTokenParam is set correctly for gpt-4.1-nano

**Test A10: Production Stripe URL in Emails**
- [ ] Trigger a Pro subscription welcome email
- [ ] Check email content
- [ ] **Expected:** Billing portal link is NOT `https://billing.stripe.com/p/login/test_123`
- [ ] **Expected:** Link points to production billing URL or env variable value
- [ ] **Why:** Confirms hardcoded test URL was removed

**Test A11: AI Gateway Timeout**
- [ ] This requires simulating a hanging gateway
- [ ] **Automated test required:** Mock fetch to hang, verify timeout after 30 seconds
- [ ] **Manual verification:** Check logs for timeout errors if gateway is slow
- [ ] **Why:** Confirms fetchWithTimeout is used for AI Gateway calls

---

## Website Tests

### Accessibility (Phase 1: W1, Phase 2: W5-W7)

**Test W1: Plan Selection Keyboard Accessible**
- [ ] Navigate to `/activate` page
- [ ] Tab from address bar to the page
- [ ] **Expected:** Can tab to Free plan card
- [ ] Press Enter or Space on Free plan card
- [ ] **Expected:** Card becomes selected (visual indication)
- [ ] Tab to Pro plan card
- [ ] Press Enter or Space
- [ ] **Expected:** Pro plan becomes selected
- [ ] **Why:** Confirms cards are button elements with proper keyboard support

**Test W1: Screen Reader Announces Plan Selection**
- [ ] Enable screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Navigate to plan cards
- [ ] **Expected:** Screen reader announces "Free plan button, pressed" or similar
- [ ] Select Pro plan
- [ ] **Expected:** Screen reader announces state change
- [ ] **Why:** Confirms aria-pressed attribute works correctly

**Test W5: Skip Navigation Link**
- [ ] Navigate to website homepage
- [ ] Press Tab once (should focus skip link)
- [ ] **Expected:** "Skip to main content" link becomes visible
- [ ] Press Enter
- [ ] **Expected:** Focus jumps to main content area
- [ ] **Why:** Confirms skip link exists and works

**Test W6: Email Input Accessible**
- [ ] Navigate to `/activate` page with screen reader enabled
- [ ] Tab to email input field
- [ ] **Expected:** Screen reader announces "Email address" (not just placeholder)
- [ ] **Why:** Confirms aria-label is present

**Test W7: Loading Spinner Accessible**
- [ ] On `/activate` page, click "Get Started" to trigger loading
- [ ] With screen reader enabled
- [ ] **Expected:** Screen reader announces "Loading" status
- [ ] **Why:** Confirms spinner has role="status" and aria-label

### Security (Phase 1: W2)

**Test W2: Checkout URL Validation**
- [ ] On `/activate` page, select Pro plan
- [ ] Enter email and click signup
- [ ] **Expected:** Redirects to `https://checkout.stripe.com/...`
- [ ] **Simulated test:** Mock API to return malicious URL like `https://evil.com/phishing`
- [ ] **Expected:** Error thrown, no redirect occurs
- [ ] **Why:** Confirms URL validation before redirect

### SEO & Polish (Phase 2: W3, W4, W8)

**Test W3: Metadata and OpenGraph**
- [ ] Visit website homepage
- [ ] View page source (Ctrl+U or Cmd+U)
- [ ] Search for `<meta property="og:image"`
- [ ] **Expected:** Image URL is absolute with `https://captureai.dev` domain
- [ ] Check `/activate` and `/payment-success` pages
- [ ] **Expected:** Both have proper title and description meta tags
- [ ] **Why:** Confirms metadataBase is set and client pages have metadata

**Test W4: Tertiary Text Contrast**
- [ ] Visit website and inspect tertiary text elements
- [ ] Open DevTools → Elements → Computed → Accessibility
- [ ] Check contrast ratio for tertiary text
- [ ] **Expected:** Contrast ratio ≥ 4.5:1 against background
- [ ] **Visual check:** Tertiary text should be readable
- [ ] **Why:** Confirms color was lightened from #5f6577 to #8a8fa0

**Test W8: Consistent Contact Emails**
- [ ] Visit `/privacy` page
- [ ] Search for email addresses in the content
- [ ] **Expected:** All emails are `support@captureai.dev` (not wonhappyheart@gmail.com)
- [ ] Visit `/terms` page
- [ ] **Expected:** All emails are `support@captureai.dev`
- [ ] Visit `/contact` page
- [ ] **Expected:** Uses branded emails (support@, feedback@)
- [ ] **Why:** Confirms professional branded emails throughout

---

## Automated Test Requirements

These tests should be added to the test suite to prevent regressions:

### Extension Tests

| Test | File | What to Assert |
|------|------|----------------|
| Privacy guard bypass removed | `tests/unit/inject.test.js` | `_addEventListener` not on Window/Document/Element prototypes |
| Focus events not globally blocked | `tests/unit/inject.test.js` | Input elements can add focus/blur listeners; window/document cannot |
| URL validation blocks Chrome Web Store | `tests/unit/domains.test.js` | `isValidUrl('https://chrome.google.com/webstore/...')` returns `false` |
| URL validation allows normal sites | `tests/unit/domains.test.js` | `isValidUrl('https://google.com')` returns `true` |
| Storage rejects on error | `tests/unit/storage.test.js` | Mock `chrome.runtime.lastError`, verify promise rejection |
| Answer extraction uses correct digit | `tests/unit/auto-solve.test.js` | "Question 3 is option 2" extracts `2`, not `3` |
| Enter key pressed once | `tests/unit/auto-solve.test.js` | Verify only one Enter event dispatched |
| Unhandled rejection filters | `tests/unit/event-manager.test.js` | Non-extension rejections don't trigger handleError |

### API Tests

| Test | File | What to Assert |
|------|------|----------------|
| Rate limiter uses stub.fetch | `api/tests/ratelimit.test.js` | Mock DO stub, verify `stub.fetch` called (not `fetch(stub.url)`) |
| Session ID validation | `api/tests/subscription.test.js` | `../customers` rejected, `cs_test_abc` accepted |
| CORS exact match | `api/tests/cors.test.js` | `evil.github.io` rejected, exact origins accepted |
| CORS consistency | `api/tests/cors.test.js` | Preflight and response headers match for same origin |
| Email normalization | `api/tests/subscription.test.js` | Mixed-case email matches lowercased DB entry |
| AI endpoint body size limit | `api/tests/ai.test.js` | >10MB body rejected with 413/400 |
| AI gateway timeout | `api/tests/ai.test.js` | Mock hanging fetch, verify timeout error after 30s |
| IP-based rate limiting | `api/tests/ai.test.js` | 61st request from same IP returns 429 |

### Website Tests

| Test | File | What to Assert |
|------|------|----------------|
| Plan cards are buttons | `website/tests/activate.test.tsx` | Cards render as `<button>` elements with aria-pressed |
| Plan cards keyboard accessible | `website/tests/activate.test.tsx` | Enter/Space key selects plan |
| Checkout URL validation | `website/tests/activate.test.tsx` | Non-Stripe URLs rejected |
| Skip link present | `website/tests/layout.test.tsx` | Skip navigation link rendered in layout |
| Email input accessible | `website/tests/activate.test.tsx` | Email input has aria-label="Email address" |
| Loading spinner accessible | `website/tests/activate.test.tsx` | Spinner has role="status" and aria-label |

---

## Regression Testing Priority

### Critical (Must Test Before Release)

1. **Rate Limiting Works (A1)** — API was completely unprotected before
2. **Privacy Guard Bypass Removed (E1)** — Critical security issue
3. **Focus Events Work on Forms (E2)** — Breaks user experience on many sites
4. **CORS Fixed (A3, A4)** — Security vulnerability
5. **Session ID Validation (A2)** — SSRF vulnerability
6. **Buy Pro Button Works (E9)** — Breaks payment flow

### High Priority (Test During Release Verification)

7. **URL Validation (E8)** — Prevents issues on Chrome Web Store
8. **Debug Mode Off (E4)** — Privacy leak if not fixed
9. **Auto-solve Accuracy (E11, E12)** — Core feature functionality
10. **Migration Preserves Tier (E16)** — Would lose Pro users
11. **Email Case Handling (A7)** — Causes subscription update failures
12. **Keyboard Accessibility (W1)** — Legal compliance (WCAG)

### Medium Priority (Monitor in Production)

13. **Storage Error Handling (E14)** — Rare but important
14. **External Fonts Removed (E15)** — Privacy improvement
15. **IP Rate Limiting (A5)** — DoS protection
16. **AI Gateway Timeout (A11)** — Prevents hanging requests
17. **Body Size Limits (A6)** — Resource protection

### Low Priority (Nice to Have)

18. **resetMigration Removed (E6)** — Low risk issue
19. **Stripe URL Fixed (A10)** — Only affects email aesthetics
20. **Website Accessibility (W3-W8)** — Improvements, unlikely to break

---

## Testing Environment Setup

### Extension Testing
- **Browser:** Chrome/Chromium (latest stable)
- **Test sites:** Google Forms, Canvas LMS, Quizlet, generic login forms
- **Tools:** DevTools console, Network tab, Accessibility inspector

### API Testing
- **Environment:** Staging environment with test Stripe keys
- **Tools:** curl, Postman, or custom test scripts
- **Database:** Staging database with test users

### Website Testing
- **Browsers:** Chrome, Firefox, Safari (latest stable)
- **Screen readers:** VoiceOver (Mac), NVDA (Windows)
- **Tools:** Lighthouse, aXe DevTools, WAVE

---

## Sign-off Checklist

Before merging to production:

- [ ] All Critical tests passed
- [ ] All High Priority tests passed
- [ ] At least 80% of Medium Priority tests passed
- [ ] No new errors in browser console
- [ ] No new errors in API logs
- [ ] Automated test suite runs successfully
- [ ] Performance metrics unchanged or improved
- [ ] Manual smoke test completed on staging

---

**Last Updated:** 2026-02-12
**Covers:** Phase 1 (E1-E6, A1-A4, W1-W2) and Phase 2 (E8-E16, A5-A11, W3-W8)
