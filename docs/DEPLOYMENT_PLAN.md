# CaptureAI Deployment Plan

A phased plan to ship CaptureAI v2.0.0 to real users on the Chrome Web Store, with a production-hardened backend, a live support website, and CI/CD automation.

---

## Current State Assessment

### What exists today
| Component | Status | Notes |
|-----------|--------|-------|
| Chrome Extension (Manifest V3) | Feature-complete v2.0.0 | All core features implemented, privacy guard, OCR, auto-solve |
| Cloudflare Workers backend | Deployed but needs verification | Auth, AI proxy, Stripe integration, rate limiting |
| D1 database schema | Defined, migrations exist | Users, usage_records, webhook_events tables |
| Support website (Next.js) | Partially implemented | Homepage, pricing, docs, download pages exist; activation and legal pages missing |
| Test suite | 165 tests passing, 12 suites broken (path issues) | Unit tests cover modules; broken suites reference wrong paths to `background.js` |
| CI/CD | **None** | No GitHub Actions, no automated testing or deployment |
| Security | 13 vulnerabilities fixed | Crypto-secure keys, CORS lockdown, rate limiting, security headers |
| Chrome Web Store listing | Extension ID exists (`idpdleplccjjbmdmjkppmkecmoeomnjd`) | Listed but unclear if v2.0.0 is published |

### Critical gaps blocking a production launch
1. **No CI/CD pipeline** - all testing and deployment is manual
2. **Broken test paths** - 12 of 19 test suites fail to resolve modules
3. **Missing legal pages** - no Privacy Policy or Terms of Service (required by Chrome Web Store)
4. **Missing activation flow** - `/activate` and `/payment-success` pages not built in Next.js
5. **No environment/secrets audit** - need to verify all Cloudflare secrets are configured
6. **No monitoring or alerting** - zero observability into production errors
7. **No Chrome Web Store assets** - screenshots, detailed description, promotional images
8. **`<all_urls>` host permission** - triggers Chrome Web Store review scrutiny; needs justification or narrowing

---

## Phase 1: Fix the Foundation (Pre-Launch)

Everything in this phase must be done before submitting to the Chrome Web Store for review.

### 1.1 Fix the Test Suite

**Problem:** 12 test suites fail because they import from `../../background.js` but the jest `rootDir` doesn't align with the extension directory structure.

**Tasks:**
- [ ] Update `config/jest.config.js` `roots` and `moduleNameMapper` to resolve `background.js` and module paths correctly from the `extension/` directory
- [ ] Fix all 12 broken test suites so they import from the correct paths
- [ ] Achieve 100% suite pass rate (all 19 suites green)
- [ ] Set meaningful coverage thresholds (currently all 0%) - start with 50% line coverage minimum
- [ ] Run `npm test` and confirm zero failures

### 1.2 Set Up CI/CD Pipeline

**Create `.github/workflows/ci.yml`:**
```yaml
# Triggers: push to main, pull requests to main
# Jobs:
#   1. lint     - ESLint on extension + API code
#   2. test     - Jest unit tests with coverage reporting
#   3. build    - Verify extension can be packaged (zip)
#   4. api-test - Wrangler dry-run or type check on API code
```

**Tasks:**
- [ ] Create GitHub Actions workflow for lint + test on every PR and push to `main`
- [ ] Add a `build:extension` npm script that zips the `extension/` directory into a `.zip` for Chrome Web Store upload
- [ ] Add a `deploy:api` npm script wrapping `wrangler deploy` (for manual or CD trigger)
- [ ] Add branch protection rules on `main` requiring CI to pass

### 1.3 Audit Secrets and Environment Configuration

All backend secrets must be set before the backend can serve real traffic.

**Required Cloudflare Worker secrets (verify each is set):**
- [ ] `STRIPE_SECRET_KEY` - Stripe API key for payment processing
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signature verification
- [ ] `STRIPE_PRICE_PRO` - Stripe price ID for the $9.99/mo Pro plan
- [ ] `RESEND_API_KEY` - Resend API key for transactional emails
- [ ] `FROM_EMAIL` - Sender address (e.g., `CaptureAI <license@mail.captureai.dev>`)

**Verification steps:**
- [ ] Run `wrangler secret list` and confirm all 5 secrets are present
- [ ] Verify `CHROME_EXTENSION_IDS` in `wrangler.toml` contains the correct production extension ID
- [ ] Deploy the backend with `wrangler deploy` and test `/api/auth/create-free-key` with a real email
- [ ] Verify the Stripe webhook endpoint is configured in the Stripe dashboard pointing to `https://api.captureai.workers.dev/api/subscription/webhook`
- [ ] Send a test email via the Resend integration and confirm delivery

### 1.4 Database Readiness

- [ ] Run `wrangler d1 migrations apply captureai-db` to ensure all migrations are applied
- [ ] Verify the schema matches `schema.sql` by running `wrangler d1 execute captureai-db --command "SELECT sql FROM sqlite_master WHERE type='table'"`
- [ ] Remove the test seed user (`TEST-FREE-KEY-12345`) from the production database if present
- [ ] Confirm indexes are created for query performance

---

## Phase 2: Legal, Compliance, and Store Listing

Chrome Web Store requires specific legal pages, assets, and metadata.

### 2.1 Create Privacy Policy Page

**Route:** `/privacy` in the Next.js website

**Must cover:**
- [ ] What data is collected (email for license keys, usage metrics in D1)
- [ ] What data is NOT collected (no browsing history, no screenshot storage, no PII beyond email)
- [ ] Third-party services used (OpenAI for AI processing, Stripe for payments, Resend for email, Cloudflare for hosting)
- [ ] How OCR processing works (local in-browser via Tesseract.js, text sent to API, images not stored)
- [ ] Data retention and deletion policies
- [ ] Contact information for privacy inquiries
- [ ] Chrome storage usage (license key, settings stored locally)
- [ ] `<all_urls>` permission justification: extension needs to run on any page to capture screenshots

### 2.2 Create Terms of Service Page

**Route:** `/terms` in the Next.js website

**Must cover:**
- [ ] License key terms (one key per email, non-transferable)
- [ ] Free tier limitations (10 requests/day)
- [ ] Pro tier terms ($9.99/month, cancel anytime)
- [ ] Acceptable use policy (no abuse, no automated mass usage)
- [ ] Refund policy
- [ ] Service availability (no SLA guarantee for free tier)
- [ ] Intellectual property
- [ ] Limitation of liability

### 2.3 Build the Activation Flow (Website)

These are the two missing critical pages in the Next.js website.

**`/activate` page:**
- [ ] Email input form
- [ ] Free tier: calls `/api/auth/create-free-key`, shows "check your email" confirmation
- [ ] Pro tier: calls `/api/subscription/create-checkout`, redirects to Stripe checkout
- [ ] Error handling for rate limits, invalid emails, disposable email rejection
- [ ] Matches the existing dark theme design system

**`/payment-success` page:**
- [ ] Reads Stripe session ID from URL params
- [ ] Calls `/api/subscription/verify-payment` to confirm
- [ ] Displays Pro activation confirmation with next steps
- [ ] "Enter your license key in the extension" instructions
- [ ] Link back to home

### 2.4 Chrome Web Store Listing Assets

**Required assets:**
- [ ] **Screenshots** (1280x800 or 640x400): at least 3-5 screenshots showing:
  1. Extension popup with license key entry
  2. Screen capture selection in action
  3. AI answer overlay displaying a result
  4. Auto-solve mode on a quiz page
  5. Ask mode with a custom question
- [ ] **Promotional tile** (440x280): branded image for store listing
- [ ] **Detailed description** (up to 16,000 chars): expand current "AI-powered question capture tool" into a full feature description
- [ ] **Category**: Productivity (or Education)
- [ ] **Privacy practices disclosure** in Chrome Web Store Developer Dashboard:
  - Single purpose description
  - Permission justifications (especially `<all_urls>` and `activeTab`)
  - Data usage certification
  - Host permission justification

### 2.5 Update `manifest.json` Metadata

- [ ] Review `description` field - make it compelling but accurate for store listing
- [ ] Verify `homepage_url` points to live website (currently GitHub, should be `https://captureai.dev` once live)
- [ ] Confirm `version` is `2.0.0` and increment if changes are made

---

## Phase 3: Pre-Launch Testing

Systematic testing before submitting to the Chrome Web Store.

### 3.1 Extension End-to-End Testing (Manual)

Test every user flow with the unpacked extension loaded in Chrome:

**License key flow:**
- [ ] Install extension from unpacked `extension/` directory
- [ ] Open popup, enter a free license key, verify it activates
- [ ] Verify free tier shows "10 requests remaining" counter
- [ ] Test with an invalid key (should show clear error)
- [ ] Test with an expired Pro subscription (should downgrade to free behavior)

**Capture flow:**
- [ ] Navigate to any webpage
- [ ] Press Ctrl+Shift+X, select a region, verify answer appears
- [ ] Test Quick Capture (Ctrl+Shift+F) - should reuse the last capture area
- [ ] Test Ctrl+Shift+E to toggle UI panel visibility
- [ ] Test Escape to cancel an in-progress capture

**OCR verification:**
- [ ] Capture a text-heavy screenshot, verify OCR extracts text (check console for confidence score)
- [ ] Capture an image-heavy screenshot (low text), verify it falls back to image mode
- [ ] Confirm token usage is lower for OCR captures vs image captures

**Ask mode:**
- [ ] Click Ask mode, type a question, submit
- [ ] (Pro only) Attach an image in Ask mode, verify it sends correctly
- [ ] Test with empty question (should show validation error)

**Auto-solve mode (Pro only):**
- [ ] Navigate to Vocabulary.com
- [ ] Activate auto-solve, verify it detects and answers questions automatically
- [ ] Press Escape, verify auto-solve stops

**Stealth/Privacy:**
- [ ] Enable stealth mode, verify UI is hidden but Ctrl+Shift+X still works
- [ ] Check that privacy guard prevents canvas fingerprinting detection (test on a fingerprinting test site)

**Edge cases:**
- [ ] Test on a CSP-restricted page (e.g., GitHub, Google)
- [ ] Test on about:blank and chrome:// pages (should gracefully handle inability to inject)
- [ ] Test with network disconnected (should show offline error)
- [ ] Test rapid consecutive captures

### 3.2 Backend Load Testing

- [ ] Use a tool like `wrk`, `k6`, or `curl` scripts to test:
  - `/api/auth/validate-key` under concurrent load
  - `/api/query` with a valid license key
  - Rate limit enforcement (verify 429 responses after threshold)
- [ ] Monitor Cloudflare Workers dashboard for error rates and latency
- [ ] Verify Durable Objects rate limiter works across multiple Worker instances

### 3.3 Payment Flow End-to-End

- [ ] Use Stripe test mode to complete a full Pro upgrade:
  1. Create free account via `/activate`
  2. Click upgrade to Pro
  3. Complete Stripe checkout with test card `4242 4242 4242 4242`
  4. Verify webhook fires and updates user tier in D1
  5. Verify license key now has Pro access
- [ ] Test subscription cancellation flow
- [ ] Test payment failure (use Stripe test card `4000 0000 0000 0002`)
- [ ] Verify past_due and cancelled subscription statuses deny Pro access

### 3.4 Cross-Browser and Version Testing

- [ ] Test on Chrome stable (latest)
- [ ] Test on Chrome Beta (if available)
- [ ] Test on Chromium-based browsers: Edge, Brave, Opera (document if supported)
- [ ] Test on Windows, macOS, and Linux if possible

---

## Phase 4: Chrome Web Store Submission

### 4.1 Package the Extension

- [ ] Create a clean zip of the `extension/` directory (exclude `.git`, `node_modules`, `tests/`, `api/`, `website/`, `docs/`, config files)
- [ ] Verify zip size is reasonable (Tesseract.js + lang data may be large - check against Chrome Web Store limits)
- [ ] If zip exceeds size limits, investigate lazy-loading Tesseract worker/lang data from CDN

**Build script to add to `package.json`:**
```json
{
  "scripts": {
    "build:extension": "cd extension && zip -r ../captureai-v2.0.0.zip . -x '*.DS_Store' '__MACOSX/*'"
  }
}
```

### 4.2 Submit to Chrome Web Store

- [ ] Log into [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [ ] Upload the zip package
- [ ] Fill in all required fields:
  - Detailed description
  - Screenshots (minimum 1, recommended 3-5)
  - Category
  - Language
  - Privacy policy URL (must be live: `https://captureai.dev/privacy`)
- [ ] Complete the **Privacy Practices** section:
  - Certify data usage
  - Justify `<all_urls>` permission: "Extension captures screenshots on any page the user is viewing to provide AI-powered analysis"
  - Justify `activeTab`: "Required to capture the current tab's visible content"
  - Justify `scripting`: "Injects content scripts for the capture overlay UI"
  - Justify `storage`: "Stores license key and user preferences locally"
  - Justify `contextMenus`: "Provides right-click menu integration"
  - Justify `alarms`: "Periodic license key validation"
- [ ] Submit for review

### 4.3 Chrome Web Store Review Expectations

The review process typically involves:
- **Automated scan** for malware, policy violations, and permission abuse
- **Human review** (especially for `<all_urls>` permission)
- **Common rejection reasons to pre-empt:**
  - Insufficient justification for broad host permissions
  - Missing or inadequate privacy policy
  - Single-purpose violation (extension must have one clear purpose)
  - Misleading description or screenshots
  - Obfuscated code (not an issue here since code is not minified/bundled)

**Mitigation:**
- [ ] Consider narrowing `host_permissions` from `<all_urls>` to using `activeTab` + programmatic injection via `chrome.scripting.executeScript()` instead of blanket content scripts. This significantly reduces review friction. (This would require refactoring `content_scripts` in the manifest to be injected on-demand instead of at `document_idle` on all URLs.)

---

## Phase 5: Website Deployment

### 5.1 Deploy the Next.js Website

- [ ] Choose hosting: **Vercel** (recommended, per README) or Cloudflare Pages
- [ ] Connect GitHub repo to Vercel for automatic deployments
- [ ] Configure custom domain: `captureai.dev`
- [ ] Set up DNS:
  - `captureai.dev` → Vercel
  - `api.captureai.workers.dev` → already on Cloudflare (or set up `api.captureai.dev` as a custom domain for the Worker)
- [ ] Verify HTTPS is working on all routes
- [ ] Test all pages load correctly in production:
  - `/` (homepage)
  - `/pricing`
  - `/download`
  - `/docs`
  - `/contact`
  - `/activate`
  - `/payment-success`
  - `/privacy`
  - `/terms`

### 5.2 Configure Production Environment

- [ ] Set environment variables in Vercel for any API URLs the website needs
- [ ] Verify the website's API calls point to the production Worker URL
- [ ] Set up Vercel preview deployments for PRs

---

## Phase 6: Post-Launch Monitoring and Operations

### 6.1 Set Up Monitoring

- [ ] **Cloudflare Workers analytics**: Monitor request volume, error rates, latency in the Cloudflare dashboard
- [ ] **Wrangler tail**: Set up log streaming for debugging (`wrangler tail`)
- [ ] **Stripe dashboard**: Monitor payment events, failed charges, disputes
- [ ] **Uptime monitoring**: Use a free service (UptimeRobot, Better Stack) to ping the API health endpoint
- [ ] Add a `/health` endpoint to the Worker that returns 200 if D1 and secrets are accessible

### 6.2 Error Tracking (Optional but Recommended)

- [ ] Consider adding lightweight error reporting in `background.js` (e.g., send anonymized error events to a `/api/telemetry/error` endpoint)
- [ ] Track common failure modes: OCR failures, API timeouts, license validation errors
- [ ] Set up Cloudflare Workers alerts for elevated error rates

### 6.3 User Support Readiness

- [ ] Verify contact email (`wonhappyheart@gmail.com`) is monitored
- [ ] Prepare canned responses for common issues:
  - "I didn't receive my license key" → check spam folder, resend from `/activate`
  - "The extension doesn't work on this site" → CSP restrictions, specific site issues
  - "I was charged but don't have Pro access" → webhook delay, manual DB check
- [ ] Document how to manually query the D1 database for user support (`query-db.sh`)

### 6.4 Operational Runbooks

- [ ] **How to deploy a backend update**: `cd api && wrangler deploy`
- [ ] **How to deploy an extension update**: increment `manifest.json` version, zip, upload to Chrome Web Store
- [ ] **How to check user status**: `wrangler d1 execute captureai-db --command "SELECT * FROM users WHERE email = '...'"`
- [ ] **How to manually upgrade a user to Pro**: Document the SQL UPDATE command
- [ ] **How to roll back a bad Worker deploy**: `wrangler rollback`
- [ ] **How to handle a Stripe webhook failure**: reprocess from Stripe dashboard

---

## Phase 7: Growth and Iteration (Post-Launch)

### 7.1 Feedback Loop

- [ ] Add an in-extension feedback mechanism (e.g., a "Report Issue" link in the popup)
- [ ] Monitor Chrome Web Store reviews and respond promptly
- [ ] Track feature requests from users

### 7.2 Analytics (Privacy-Respecting)

- [ ] Leverage existing `usage_records` table to understand:
  - Daily active users
  - Requests per user per day
  - OCR vs image mode ratio
  - Average response time
  - Conversion rate from free to Pro
- [ ] Build a simple admin dashboard or use D1 queries to pull these metrics

### 7.3 Performance Optimization

- [ ] Monitor OpenAI API costs via Cloudflare AI Gateway analytics
- [ ] Tune OCR confidence threshold (currently 60%) based on real-world data
- [ ] Consider caching common AI responses at the Cloudflare edge
- [ ] Optimize Tesseract.js loading time (lazy-load if it impacts page performance)

### 7.4 Expansion

- [ ] **Firefox Add-on**: Port to Firefox if demand warrants (Manifest V3 is now supported)
- [ ] **Additional quiz sites**: Expand auto-solve beyond Vocabulary.com
- [ ] **Team/Education plans**: If institutional demand emerges

---

## Launch Checklist Summary

A condensed pre-launch checklist. Every item must be checked before going live:

### Backend
- [ ] All Cloudflare secrets configured and verified
- [ ] D1 database schema is current, test data removed
- [ ] Rate limiting tested and working
- [ ] Stripe webhooks configured and tested
- [ ] Email delivery confirmed via Resend
- [ ] CORS restricted to production extension ID

### Extension
- [ ] All features tested end-to-end manually
- [ ] Manifest version is correct (`2.0.0`)
- [ ] `homepage_url` points to live website
- [ ] Extension packaged as clean zip
- [ ] No console errors or warnings in normal operation

### Website
- [ ] All pages deployed and accessible
- [ ] `/activate` flow works end-to-end
- [ ] `/payment-success` flow works end-to-end
- [ ] Privacy policy and Terms of Service are live
- [ ] Links in footer and navigation are correct

### Chrome Web Store
- [ ] Screenshots uploaded (3-5)
- [ ] Detailed description written
- [ ] Privacy practices completed
- [ ] Permission justifications documented
- [ ] Extension zip uploaded and submitted for review

### Operations
- [ ] Monitoring dashboards accessible
- [ ] Contact email monitored
- [ ] Runbooks documented
- [ ] CI/CD pipeline running on every PR

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Chrome Web Store rejects due to `<all_urls>` | Medium | High | Prepare permission justifications; consider refactoring to `activeTab` + programmatic injection |
| Stripe webhook failures miss subscription updates | Low | High | Monitor Stripe dashboard; add webhook retry logic; manual DB correction runbook |
| OpenAI API cost overruns | Medium | Medium | AI Gateway caching; OCR reduces tokens by 90%; monitor costs daily in early launch |
| Tesseract.js bundle size causes slow page loads | Low | Medium | Lazy-load OCR worker; measure performance impact before launch |
| Rate limit bypass via multiple extension installs | Low | Low | Rate limits are per-license-key, not per-extension-instance |
| DDOS on Worker endpoint | Low | Medium | Cloudflare's built-in DDoS protection; rate limiting via Durable Objects |
| User data breach | Very Low | Critical | No passwords stored; license keys are random; D1 at edge is encrypted at rest |

---

## Recommended Phase Timeline

| Phase | Description | Dependencies |
|-------|-------------|-------------|
| **Phase 1** | Fix foundation (tests, CI/CD, secrets) | None |
| **Phase 2** | Legal pages, activation flow, store assets | Phase 1 |
| **Phase 3** | Pre-launch testing | Phases 1-2 |
| **Phase 4** | Chrome Web Store submission | Phases 1-3 |
| **Phase 5** | Website deployment | Phase 2 (can run parallel with Phase 3-4) |
| **Phase 6** | Post-launch monitoring | Phase 4-5 |
| **Phase 7** | Growth and iteration | Phase 6 |

Phases 1-2 can partially overlap. Phase 5 can run in parallel with Phases 3-4. Phase 3 must complete before Phase 4.
