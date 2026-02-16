# CaptureAI Deployment Plan

A phased plan to ship CaptureAI v2.0.0 to real users on the Chrome Web Store.

---

## Current State Assessment

### What's done
| Component | Status |
|-----------|--------|
| Chrome Extension (Manifest V3) | Feature-complete v2.0.0 |
| Cloudflare Workers backend | Deployed, secrets configured |
| D1 database schema | Defined, migrations exist |
| Stripe payment flow | Working in test mode |
| Support website (Next.js) | Deployed to Vercel — homepage, pricing, docs, download, activate, payment-success, privacy, terms |
| Cloudflare secrets | All configured (Stripe, Resend, etc.) |
| Security | 13 vulnerabilities fixed |
| Chrome Web Store listing | Extension ID exists (`idpdleplccjjbmdmjkppmkecmoeomnjd`) |

### Remaining gaps blocking production launch
1. **No CI/CD pipeline** — all testing and deployment is manual
2. **Broken test paths** — 12 of 19 test suites fail to resolve modules (165 individual tests pass)
3. **No Chrome Web Store assets** — screenshots, detailed description, promotional images
4. **`<all_urls>` host permission** — triggers Chrome Web Store review scrutiny; needs justification or narrowing
5. **No monitoring or alerting** — zero observability into production errors
6. **Database cleanup** — test seed user may exist in production D1
7. **Manifest metadata** — `homepage_url` still points to GitHub instead of live site
8. **Stripe live mode** — payment flow verified in test mode, needs switch to live keys

---

## Phase 1: Fix the Foundation

### 1.1 Fix the Test Suite

**Problem:** 12 test suites fail because they import from `../../background.js` but the jest `rootDir` doesn't align with the `extension/` directory structure.

**Tasks:**
- [ ] Update `config/jest.config.js` `roots` and `moduleNameMapper` to resolve `background.js` and module paths correctly from the `extension/` directory
- [ ] Fix all 12 broken test suites so they import from the correct paths
- [ ] Achieve 100% suite pass rate (all 19 suites green)
- [ ] Set meaningful coverage thresholds (currently all 0%) — start with 50% line coverage minimum
- [ ] Run `npm test` and confirm zero failures

### 1.2 Set Up CI/CD Pipeline

**Create `.github/workflows/ci.yml`:**
```yaml
# Triggers: push to main, pull requests to main
# Jobs:
#   1. lint     — ESLint on extension + API code
#   2. test     — Jest unit tests with coverage reporting
#   3. build    — Verify extension can be packaged (zip)
```

**Tasks:**
- [ ] Create GitHub Actions workflow for lint + test on every PR and push to `main`
- [ ] Add a `build:extension` npm script that zips the `extension/` directory into a `.zip` for Chrome Web Store upload
- [ ] Add a `deploy:api` npm script wrapping `wrangler deploy` (for manual or CD trigger)
- [ ] Add branch protection rules on `main` requiring CI to pass

### 1.3 Database Cleanup

- [ ] Run `wrangler d1 migrations apply captureai-db` to ensure all migrations are current
- [ ] Verify schema matches `schema.sql`: `wrangler d1 execute captureai-db --command "SELECT sql FROM sqlite_master WHERE type='table'"`
- [ ] Remove the test seed user (`TEST-FREE-KEY-12345`) from production D1 if present
- [ ] Confirm indexes exist for query performance

---

## Phase 2: Chrome Web Store Preparation

### 2.1 Chrome Web Store Listing Assets

**Required assets:**
- [ ] **Screenshots** (1280x800 or 640x400) — at least 3-5 showing:
  1. Extension popup with license key entry
  2. Screen capture selection in action
  3. AI answer overlay displaying a result
  4. Auto-solve mode on a quiz page
  5. Ask mode with a custom question
- [ ] **Promotional tile** (440x280): branded image for store listing
- [ ] **Detailed description** (up to 16,000 chars): expand current "AI-powered question capture tool" into a full feature description covering OCR, tiers, privacy guard, keyboard shortcuts
- [ ] **Category**: Productivity (or Education)

### 2.2 Privacy Practices Disclosure

Fill in the Chrome Web Store Developer Dashboard privacy practices section:

- [ ] **Single purpose description**: "Captures screenshots on any webpage and uses OCR + AI to analyze and answer questions from the captured content"
- [ ] **Permission justifications:**
  - `<all_urls>` / `host_permissions`: "Extension needs to capture screenshots and inject the capture overlay UI on any page the user is viewing"
  - `activeTab`: "Required to capture the current tab's visible content when the user triggers a capture"
  - `scripting`: "Injects the capture overlay and answer display UI into the active page"
  - `storage`: "Stores license key and user preferences locally"
  - `contextMenus`: "Provides right-click menu option to start a capture"
  - `alarms`: "Periodic license key validation to check subscription status"
- [ ] **Data usage certification**: certify what data is collected/not collected
- [ ] **Host permission justification**: same as `<all_urls>` above

### 2.3 Update `manifest.json` Metadata

- [ ] Change `homepage_url` from GitHub to `https://captureai.dev`
- [ ] Review `description` field — make it compelling but accurate for store search
- [ ] Confirm `version` is `2.0.0` (increment to `2.0.1` if any code changes are made during this process)

### 2.4 Consider Permission Narrowing (Risk Mitigation)

The `<all_urls>` host permission combined with content scripts injected on every page is the **#1 rejection risk** in Chrome Web Store review.

**Option A — Keep as-is:** Prepare strong justifications (see 2.2). Accept the risk of a slower or rejected review.

**Option B — Refactor to `activeTab` + programmatic injection:**
- Remove the `content_scripts` section from `manifest.json`
- Remove `<all_urls>` from `host_permissions`
- Keep `activeTab` permission
- Use `chrome.scripting.executeScript()` in `background.js` to inject `content.js` and Tesseract only when the user triggers a capture (via keyboard shortcut or popup button)
- This makes the extension inject nothing until the user explicitly acts, which Chrome reviewers strongly prefer

**Trade-off:** Option B requires refactoring the content script injection model but dramatically reduces review friction and is the Chrome team's recommended pattern for extensions that don't need to run on every page load.

**Recommendation:** Option B is worth doing. The extension doesn't need to be injected on every page — it only needs to activate when the user presses Ctrl+Shift+X or clicks the popup. This is a genuine architectural improvement, not just review theater.

---

## Phase 3: Pre-Launch Testing

### 3.1 Extension End-to-End Testing (Manual)

Test every user flow with the unpacked extension loaded in Chrome:

**License key flow:**
- [ ] Install extension from unpacked `extension/` directory
- [ ] Open popup, enter a free license key, verify it activates
- [ ] Verify free tier shows "10 requests remaining" counter
- [ ] Test with an invalid key — should show clear error
- [ ] Test with an expired Pro subscription — should downgrade to free behavior

**Capture flow:**
- [ ] Navigate to any webpage
- [ ] Press Ctrl+Shift+X, select a region, verify answer appears
- [ ] Test Quick Capture (Ctrl+Shift+F) — should reuse the last capture area
- [ ] Test Ctrl+Shift+E to toggle UI panel visibility
- [ ] Test Escape to cancel an in-progress capture

**OCR verification:**
- [ ] Capture a text-heavy screenshot, verify OCR extracts text (check console for confidence score)
- [ ] Capture an image-heavy screenshot, verify it falls back to image mode
- [ ] Confirm token usage is lower for OCR captures vs image captures

**Ask mode:**
- [ ] Click Ask mode, type a question, submit
- [ ] (Pro only) Attach an image in Ask mode, verify it sends correctly
- [ ] Test with empty question — should show validation error

**Auto-solve mode (Pro only):**
- [ ] Navigate to Vocabulary.com
- [ ] Activate auto-solve, verify it detects and answers questions automatically
- [ ] Press Escape, verify auto-solve stops

**Stealth/Privacy:**
- [ ] Enable stealth mode, verify UI is hidden but Ctrl+Shift+X still works
- [ ] Check that privacy guard prevents canvas fingerprinting detection

**Edge cases:**
- [ ] Test on a CSP-restricted page (e.g., GitHub, Google)
- [ ] Test on about:blank and chrome:// pages — should gracefully fail
- [ ] Test with network disconnected — should show offline error
- [ ] Test rapid consecutive captures

### 3.2 Backend Smoke Tests

- [ ] Manually hit `/api/auth/create-free-key` with a real email, verify key arrives via email
- [ ] Validate the key via `/api/auth/validate-key`
- [ ] Hit rate limits and verify 429 responses
- [ ] Monitor Cloudflare Workers dashboard during tests for error rates

### 3.3 Switch Stripe to Live Mode

- [ ] Create live Stripe products/prices matching test mode ($9.99/mo Pro plan)
- [ ] Update Cloudflare Worker secrets with live Stripe keys:
  - `wrangler secret put STRIPE_SECRET_KEY` (live key)
  - `wrangler secret put STRIPE_WEBHOOK_SECRET` (live webhook secret)
  - `wrangler secret put STRIPE_PRICE_PRO` (live price ID)
- [ ] Configure the live webhook endpoint in Stripe dashboard pointing to `https://api.captureai.workers.dev/api/subscription/webhook`
- [ ] Do one real $9.99 test purchase with your own card, verify the full flow, then refund

### 3.4 Cross-Browser Testing

- [ ] Chrome stable (latest)
- [ ] Edge (Chromium-based)
- [ ] Brave (document if supported)

---

## Phase 4: Chrome Web Store Submission

### 4.1 Package the Extension

- [ ] Create a clean zip of the `extension/` directory (exclude dev files)
- [ ] Verify zip size (Tesseract.js + lang data may be large — Chrome Web Store limit is ~500MB, but smaller is better for user installs)

**Add to root `package.json`:**
```json
"build:extension": "cd extension && zip -r ../captureai-v2.0.0.zip . -x '*.DS_Store' '__MACOSX/*'"
```

### 4.2 Submit for Review

- [ ] Log into [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [ ] Upload the zip
- [ ] Fill in: detailed description, screenshots, category, language
- [ ] Set privacy policy URL to `https://captureai.dev/privacy`
- [ ] Complete Privacy Practices section (prepared in 2.2)
- [ ] Submit for review

### 4.3 Review Expectations

- **Timeline:** Typically 1-3 business days; can take longer for extensions with broad permissions
- **Automated scan** runs first (malware, policy violations)
- **Human review** likely due to `<all_urls>` (or `activeTab` + `scripting` if refactored)
- **If rejected:** Read the rejection reason carefully, fix the cited issue, and resubmit. Most common: insufficient permission justification or single-purpose violation

---

## Phase 5: Post-Launch Monitoring and Operations

### 5.1 Set Up Monitoring

- [ ] **Cloudflare Workers analytics**: Monitor request volume, error rates, latency in the Cloudflare dashboard
- [ ] **Wrangler tail**: Use `wrangler tail` for live log streaming when debugging
- [ ] **Stripe dashboard**: Monitor payment events, failed charges, disputes
- [ ] **Uptime monitoring**: Use a free service (UptimeRobot, Better Stack) to ping a `/health` endpoint
- [ ] Add a `/health` endpoint to the Worker that returns 200 if D1 is reachable

### 5.2 User Support Readiness

- [ ] Verify contact email is monitored
- [ ] Prepare canned responses for common issues:
  - "I didn't receive my license key" → check spam, resend from `/activate`
  - "Extension doesn't work on this site" → CSP restrictions
  - "Charged but no Pro access" → webhook delay, manual DB check
- [ ] Document how to query D1 for user support: `wrangler d1 execute captureai-db --command "SELECT * FROM users WHERE email = '...'"`

### 5.3 Operational Runbooks

- [ ] **Deploy backend update**: `cd api && wrangler deploy`
- [ ] **Deploy extension update**: increment `manifest.json` version → zip → upload to Chrome Web Store → submit for review
- [ ] **Check user status**: `wrangler d1 execute captureai-db --command "SELECT * FROM users WHERE email = '...'"`
- [ ] **Manually upgrade user to Pro**: `UPDATE users SET tier = 'pro', subscription_status = 'active' WHERE email = '...'`
- [ ] **Roll back bad Worker deploy**: `wrangler rollback`
- [ ] **Reprocess failed Stripe webhook**: Use Stripe dashboard "Resend" on the failed event

---

## Phase 6: Growth and Iteration (Post-Launch)

### 6.1 Feedback Loop

- [ ] Add a "Report Issue" link in the extension popup
- [ ] Monitor and respond to Chrome Web Store reviews
- [ ] Track feature requests

### 6.2 Analytics (Privacy-Respecting)

Leverage the existing `usage_records` table to understand:
- Daily active users
- Requests per user per day
- OCR vs image mode ratio
- Average response time
- Free → Pro conversion rate

### 6.3 Performance Optimization

- [ ] Monitor OpenAI API costs via Cloudflare AI Gateway analytics
- [ ] Tune OCR confidence threshold (currently 60%) based on real-world data
- [ ] Consider Cloudflare edge caching for common AI responses
- [ ] Measure Tesseract.js impact on page load time; lazy-load if needed

### 6.4 Expansion

- [ ] **Firefox Add-on**: Port if demand warrants (Manifest V3 supported)
- [ ] **Additional quiz sites**: Expand auto-solve beyond Vocabulary.com
- [ ] **Team/Education plans**: If institutional demand emerges

---

## Launch Checklist Summary

Every item must be checked before going live:

### Backend
- [x] All Cloudflare secrets configured
- [ ] D1 database schema current, test data removed
- [ ] Rate limiting verified
- [x] Stripe webhooks configured (test mode)
- [ ] Stripe switched to live mode
- [x] Email delivery confirmed via Resend
- [x] CORS restricted to production extension ID

### Extension
- [ ] All features tested end-to-end manually
- [ ] Manifest version correct
- [ ] `homepage_url` points to live website
- [ ] Extension packaged as clean zip
- [ ] No console errors in normal operation

### Website
- [x] All pages deployed and accessible on Vercel
- [x] `/activate` flow works
- [x] `/payment-success` flow works
- [x] Privacy policy and Terms of Service live
- [ ] Verify all links in footer/nav are correct and point to live URLs

### Chrome Web Store
- [ ] Screenshots uploaded (3-5)
- [ ] Detailed description written
- [ ] Privacy practices completed
- [ ] Permission justifications documented
- [ ] Extension zip uploaded and submitted for review

### Operations
- [ ] Monitoring set up (Cloudflare dashboard, uptime check)
- [ ] Contact email monitored
- [ ] Runbooks documented
- [ ] CI/CD pipeline running on every PR

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Chrome Web Store rejects due to `<all_urls>` | Medium | High | Prepare justifications; strongly consider refactoring to `activeTab` + programmatic injection (see 2.4) |
| Stripe webhook failures miss subscription updates | Low | High | Monitor Stripe dashboard; manual DB correction runbook |
| OpenAI API cost overruns | Medium | Medium | AI Gateway caching; OCR reduces tokens by 90%; monitor costs daily in early launch |
| Tesseract.js bundle size causes slow page loads | Low | Medium | Lazy-load OCR worker; measure before launch |
| Rate limit bypass via multiple installs | Low | Low | Rate limits are per-license-key, not per-extension-instance |

---

## Phase Dependencies

```
Phase 1 (Foundation) ──┐
                       ├──▶ Phase 3 (Testing) ──▶ Phase 4 (Submission) ──▶ Phase 5 (Monitoring) ──▶ Phase 6 (Growth)
Phase 2 (Store Prep) ──┘
```

Phases 1 and 2 can run in parallel. Phase 3 requires both to be complete. Phase 4 requires Phase 3. Phases 5-6 follow launch.
