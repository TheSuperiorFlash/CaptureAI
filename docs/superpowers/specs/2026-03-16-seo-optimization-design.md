# SEO Optimization Design

**Date:** 2026-03-16
**Scope:** On-page improvements to existing pages only. No new pages.

## Goal

Improve CaptureAI's search visibility on two dimensions:
1. Rank higher for existing keywords (technical fixes, structured data)
2. Capture new keyword targets through expanded FAQ content on existing pages

Google Search Console was just connected; indexing is in progress. This work establishes a clean baseline before GSC data arrives.

## Changes

### 1. FAQPage Structured Data

Add `FAQPage` JSON-LD to two pages.

**Prerequisite — extract FAQ data to a shared module:**
`components/FAQ.tsx` is a Client Component (`'use client'`). Server Components cannot import named data exports from Client Component files. Before writing any JSON-LD, extract the `faqs` array into a new plain data file `lib/faq-data.ts` (no `'use client'` directive). Update `components/FAQ.tsx` to import `faqs` from `lib/faq-data.ts`. Then both the Server Component (`app/page.tsx`) and the Client Component can import from the shared source.

**Home page (`app/page.tsx`):**
- Import `faqs` from `lib/faq-data.ts` and map it to a `FAQPage` JSON-LD block
- Add a second `<script type="application/ld+json">` block alongside the existing `SoftwareApplication` schema
- When Section 7 adds new items to `lib/faq-data.ts`, the JSON-LD updates automatically

**Help page (`app/help/page.tsx`):**
- Source: `FAQ_ITEMS` (8 items) + `TROUBLESHOOTING_ITEMS` (6 items)
- Do not include numbered setup steps or keyboard shortcuts — those are not Q&A structures
- Several answers are `React.ReactNode` (contain `<Link>`, `<a>`, HTML entities). The stripping strategy: include only items where `typeof a === 'string'`. Items with JSX answers are silently excluded. On inspection this yields approximately 11 of 14 items; the exact count is fine — do not force JSX items in
- Add the `FAQPage` JSON-LD as a `<script>` tag in the page's server component render

**Why:** FAQPage schema enables rich results (expandable Q&A directly in search listings), increasing CTR without requiring a ranking improvement.

### 2. Fix Per-Page Canonical URLs

**Problem:** Root layout sets `alternates: { canonical: '/' }` as the default. Every page inherits this, claiming to be the homepage.

**Fix:** Add explicit `alternates: { canonical: '/page-path' }` to the metadata export of each page. Note: `/activate` metadata lives in `app/activate/layout.tsx` — its `page.tsx` is a client component with no metadata export.

| Page | File to edit | Canonical to add |
|------|-------------|-----------------|
| `/activate` | `app/activate/layout.tsx` | `/activate` |
| `/download` | `app/download/page.tsx` | `/download` |
| `/help` | `app/help/page.tsx` | `/help` |
| `/contact` | `app/contact/page.tsx` | `/contact` |
| `/privacy` | `app/privacy/page.tsx` | `/privacy` |
| `/terms` | `app/terms/page.tsx` | `/terms` |

**`/payment-success` is intentionally excluded** — it is already disallowed in `robots.ts` and is a transient post-payment page that should not be indexed.

The root layout default `canonical: '/'` remains unchanged — only the homepage should inherit it.

### 3. Fix Sitemap `lastModified`

**Problem:** Every URL uses `new Date()`, so Google sees all pages as modified today on every crawl. This erodes crawl-budget trust signals.

**Fix:** Replace `new Date()` with hardcoded ISO date string `'2026-03-16'` for all entries. Update individual entries in future commits when a page's content meaningfully changes.

The existing `changeFrequency` values are intentional and carry over unchanged.

### 4. Improve Help Page Metadata

**Current:**
```
title: 'Help'
description: 'Learn how to use CaptureAI. Guides, keyboard shortcuts, and FAQ.'
```

**Proposed:**
```
title: 'Help & FAQ'
description: 'CaptureAI help center. Setup guides, troubleshooting for Canvas, Moodle, and Blackboard, keyboard shortcuts, and FAQ.'
```

**Why:** "Help" alone is too generic. The improved description includes platform names and specific topics people search for when stuck.

### 5. Organization Schema on Home Page

Add an `Organization` JSON-LD block to `app/page.tsx` alongside the existing schemas:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "CaptureAI",
  "url": "https://captureai.dev",
  "logo": "https://captureai.dev/logo.png"
}
```

**Notes:**
- Omit `sameAs` — an empty array adds no value
- `logo.png` is confirmed at 750×750px, well above Google's 112×112px minimum

**Why:** Helps Google establish CaptureAI as a known brand entity. Improves Knowledge Panel eligibility.

### 6. Fix OG Image Dimensions

**Problem:** `app/layout.tsx` currently declares `width: 1737, height: 1584` in `openGraph.images`. The standard is 1200×630px. Non-standard dimensions are cropped incorrectly when shared on Twitter, LinkedIn, Discord, and iMessage.

**Fix (two parts):**
1. Correct `app/layout.tsx` `openGraph.images` entry to `width: 1200, height: 630`
2. Replace `/public/og-image.png` with a new file at exactly 1200×630px (manual asset task — the code path is already correct)

**Note on `/activate` layout:** `app/activate/layout.tsx` sets `openGraph.images: ['/og-image.png']` without explicit dimensions. Correcting its dimensions is deferred — it inherits the same physical file, and scraper dimension negotiation will use the actual file size once the image is replaced.

### 7. Expand FAQ Content for Keyword Coverage

Add new items to `lib/faq-data.ts` (home page FAQ) and to the help page FAQ arrays. These additions flow through to Section 1 JSON-LD automatically via the shared data module.

**`lib/faq-data.ts` (home page FAQ) — add 2 questions:**
- "Does CaptureAI work on Canvas, Moodle, and Blackboard?" — Answer explicitly mentions all supported platforms including Schoology and Top Hat
- "What types of questions can CaptureAI answer?" — Answer covers multiple choice, short answer, math, science, and written prompts

**Help page FAQ (`app/help/page.tsx`) — add 2 questions as plain string answers:**
- "Does CaptureAI work on locked-down browsers like Respondus?" — Addresses a common search query; answer clarifies what Privacy Guard does and does not cover. (This is a FAQ answer only — a dedicated `/respondus` page remains out of scope)
- "Why isn't CaptureAI working on my school's LMS?" — Targets platform-specific troubleshooting searches; answer covers common causes (extension disabled, CSP restrictions, unsupported iframe)

## Files Modified

| File | Change |
|------|--------|
| `lib/faq-data.ts` | **New file** — extracts `faqs` array from FAQ.tsx; add 2 new FAQ items |
| `components/FAQ.tsx` | Import `faqs` from `lib/faq-data.ts` instead of defining inline |
| `app/page.tsx` | Add FAQPage + Organization JSON-LD (import `faqs` from `lib/faq-data.ts`) |
| `app/layout.tsx` | Correct OG image dimensions to 1200×630 |
| `app/activate/layout.tsx` | Add canonical `/activate` |
| `app/download/page.tsx` | Add canonical `/download` |
| `app/help/page.tsx` | Add FAQPage JSON-LD; update metadata title/description; add 2 FAQ items |
| `app/contact/page.tsx` | Add canonical `/contact` |
| `app/privacy/page.tsx` | Add canonical `/privacy` |
| `app/terms/page.tsx` | Add canonical `/terms` |
| `app/sitemap.ts` | Replace `new Date()` with hardcoded ISO date strings |
| `public/og-image.png` | Replace with 1200×630px version (manual asset task) |

## Out of Scope

- New pages (`/canvas`, `/moodle`, `/respondus`, etc.) — deferred until GSC data shows demand
- Blog or long-form content — deferred
- Google Analytics / tracking setup — separate concern
- `/account` and `/account/login` pages — exist but are auth-gated; excluded from this SEO pass
- OG image dimensions in `app/activate/layout.tsx` — deferred (no explicit dimensions declared; will use physical file size once image is replaced)

## Success Criteria

- FAQPage rich results appearing in Google Search for CaptureAI queries
- No canonical self-referencing errors in GSC Coverage report
- OG image renders correctly at 1200×630px when shared
- Help page appearing for platform-specific troubleshooting queries
- GSC shows impressions on FAQ-related queries within 2–4 weeks of indexing
