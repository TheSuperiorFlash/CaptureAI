# SEO Optimization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve CaptureAI website's search visibility through structured data, canonical URL fixes, sitemap cleanup, and expanded FAQ content.

**Architecture:** All changes are confined to the Next.js website (`website/`). A new shared data module (`lib/faq-data.ts`) is introduced to allow the FAQ data to be consumed by both a Client Component (the accordion) and Server Components (JSON-LD generation). No new pages are created.

**Tech Stack:** Next.js App Router, TypeScript, schema.org JSON-LD

**Note:** `public/og-image.png` has already been replaced with the correct 1200x630px version — that part of the spec is done.

**Verification command** (run after each task): `cd website && npm run build`

**JSON-LD pattern:** All JSON-LD script tags follow the pattern already established in `app/page.tsx` — a `<script type="application/ld+json">` tag using the same approach used for the existing SoftwareApplication schema. Follow that file as the reference implementation.

---

## Chunk 1: FAQ Data + Home Page Schemas

### Task 1: Extract FAQ data to shared module

**Files:**
- Create: `website/lib/faq-data.ts`
- Modify: `website/components/FAQ.tsx`

- [ ] **Step 1: Create `website/lib/faq-data.ts`**

Move the `faqs` array out of `FAQ.tsx` into a plain data file (no `'use client'`). Also add the two new FAQ items for keyword coverage.

```typescript
// website/lib/faq-data.ts

export const faqs = [
  {
    question: 'Which browsers are supported?',
    answer:
      'CaptureAI is built for Google Chrome only. It uses Chrome-specific extension APIs and has been tested exclusively on Chrome.',
  },
  {
    question: 'What happens when I hit the daily limit?',
    answer:
      'Basic accounts get 50 requests per day. When you reach the limit, you can wait for the daily reset or upgrade to Pro for unlimited requests.',
  },
  {
    question: 'Can I upgrade or cancel anytime?',
    answer:
      'Yes. You can upgrade to Pro at any point, and cancel your subscription whenever you want. No questions asked.',
  },
  {
    question: 'Is my data stored anywhere?',
    answer:
      "Screenshots are processed securely and are not stored on our servers. We don't keep copies of your captured images or the questions they contain.",
  },
  {
    question: 'Will my school detect the extension?',
    answer:
      'With Privacy Guard (Pro), the extension prevents quiz platforms from detecting its presence. Your browser activity logs appear as normal browsing.',
  },
  {
    question: 'How accurate are the answers?',
    answer:
      'CaptureAI uses a capable AI model to analyze questions. Accuracy is high for most subjects, but we recommend reviewing answers as part of your study process.',
  },
  {
    question: 'Does CaptureAI work on Canvas, Moodle, and Blackboard?',
    answer:
      'Yes. CaptureAI works on Canvas, Moodle, Blackboard, Top Hat, Schoology, and virtually every other learning platform. If you can see it on screen, you can capture it.',
  },
  {
    question: 'What types of questions can CaptureAI answer?',
    answer:
      'CaptureAI handles multiple choice, short answer, true/false, math problems, science questions, and written prompts. It reads the question from your screen and provides a direct answer with explanation.',
  },
]
```

- [ ] **Step 2: Update `website/components/FAQ.tsx` to import from the shared module**

Remove the `export const faqs = [...]` block. Replace with:

```typescript
import { faqs } from '@/lib/faq-data'
```

The rest of the file is unchanged.

- [ ] **Step 3: Verify build passes**

```bash
cd website && npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add website/lib/faq-data.ts website/components/FAQ.tsx
git commit -m "refactor(website): extract FAQ data to shared lib/faq-data.ts"
```

---

### Task 2: Add FAQPage and Organization JSON-LD to home page

**Files:**
- Modify: `website/app/page.tsx`

- [ ] **Step 1: Add import and new JSON-LD blocks**

Add to imports at top of file:
```typescript
import { faqs } from '@/lib/faq-data'
```

Inside `Home()`, after the existing `jsonLd` variable, add:

```typescript
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'CaptureAI',
  url: 'https://captureai.dev',
  logo: 'https://captureai.dev/logo.png',
}
```

In the JSX return, add two more `<script type="application/ld+json">` tags immediately after the existing one. Follow the exact same pattern as the existing SoftwareApplication script tag in this file — same attributes, same structure, just with `faqJsonLd` and `orgJsonLd` as the data.

- [ ] **Step 2: Verify build passes**

```bash
cd website && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add website/app/page.tsx
git commit -m "feat(website): add FAQPage and Organization JSON-LD to home page"
```

---

## Chunk 2: Metadata Fixes + Help Page

### Task 3: Fix OG image dimensions in root layout

**Files:**
- Modify: `website/app/layout.tsx`

- [ ] **Step 1: Update OG image dimensions**

Find the `openGraph.images` array in the `metadata` export. Change `width: 1737, height: 1584` to `width: 1200, height: 630`.

- [ ] **Step 2: Verify build passes**

```bash
cd website && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add website/app/layout.tsx
git commit -m "fix(website): correct OG image dimensions to 1200x630"
```

---

### Task 4: Fix sitemap lastModified

**Files:**
- Modify: `website/app/sitemap.ts`

- [ ] **Step 1: Replace dynamic dates with hardcoded dates**

Replace every instance of `lastModified: new Date()` with `lastModified: new Date('2026-03-16')`. There are 7 entries — all get the same date for now. Update individual entries in future commits when a page's content meaningfully changes.

- [ ] **Step 2: Verify build passes**

```bash
cd website && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add website/app/sitemap.ts
git commit -m "fix(website): use hardcoded lastModified dates in sitemap"
```

---

### Task 5: Fix per-page canonical URLs

**Files:**
- Modify: `website/app/activate/layout.tsx`
- Modify: `website/app/download/page.tsx`
- Modify: `website/app/contact/page.tsx`
- Modify: `website/app/privacy/page.tsx`
- Modify: `website/app/terms/page.tsx`

**Context:** The root layout sets `alternates: { canonical: '/' }` as the default. Every page that doesn't override this incorrectly claims to be the homepage. Note: `/activate` metadata lives in `app/activate/layout.tsx` — its `page.tsx` is a client component with no metadata export.

- [ ] **Step 1: Add `alternates.canonical` to each page's metadata export**

For each file, add this field to the existing `metadata` object:

| File | Value to add |
|------|-------------|
| `app/activate/layout.tsx` | `alternates: { canonical: '/activate' }` |
| `app/download/page.tsx` | `alternates: { canonical: '/download' }` |
| `app/contact/page.tsx` | `alternates: { canonical: '/contact' }` |
| `app/privacy/page.tsx` | `alternates: { canonical: '/privacy' }` |
| `app/terms/page.tsx` | `alternates: { canonical: '/terms' }` |

- [ ] **Step 2: Verify build passes**

```bash
cd website && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add website/app/activate/layout.tsx website/app/download/page.tsx website/app/contact/page.tsx website/app/privacy/page.tsx website/app/terms/page.tsx
git commit -m "fix(website): add per-page canonical URLs to prevent homepage inheritance"
```

---

### Task 6: Update help page — metadata, canonical, FAQPage JSON-LD, and new FAQ items

**Files:**
- Modify: `website/app/help/page.tsx`

- [ ] **Step 1: Update metadata export**

```typescript
export const metadata: Metadata = {
  title: 'Help & FAQ',
  description:
    'CaptureAI help center. Setup guides, troubleshooting for Canvas, Moodle, and Blackboard, keyboard shortcuts, and FAQ.',
  alternates: {
    canonical: '/help',
  },
}
```

- [ ] **Step 2: Add two new items to `TROUBLESHOOTING_ITEMS`**

Append after the last existing item in `TROUBLESHOOTING_ITEMS`:

```typescript
{
  q: 'Does CaptureAI work on locked-down browsers like Respondus?',
  a: "CaptureAI captures from your screen, not the browser's internal state, so it works alongside Respondus Monitor. Privacy Guard (Pro) goes further — it prevents the exam page from detecting tab switches, focus loss, and extension activity. Respondus LockDown Browser blocks all extensions by design and is not supported.",
},
{
  q: "Why isn't CaptureAI working on my school's LMS?",
  a: "First check that the extension is enabled at chrome://extensions. Some school LMS pages use strict Content Security Policies — try pressing Ctrl+Shift+E to force the UI to appear. If the site runs inside an iframe (common on Blackboard and Canvas), the extension may not inject into nested frames. On exam platforms, enable Privacy Guard (Pro) to prevent the site from blocking extension activity.",
},
```

Both answers are plain strings — they will be included in the JSON-LD without any stripping needed.

- [ ] **Step 3: Add FAQPage JSON-LD**

Inside `HelpPage()` before the return statement, add:

```typescript
const allItems = [...FAQ_ITEMS, ...TROUBLESHOOTING_ITEMS]
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: allItems
    .filter((item) => typeof item.a === 'string')
    .map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a as string,
      },
    })),
}
```

Add a `<script type="application/ld+json">` tag as the first element in the JSX return, following the same pattern as `app/page.tsx`. If the return is a single element, wrap in a fragment `<>...</>` first.

- [ ] **Step 4: Verify build passes**

```bash
cd website && npm run build
```

Expected: build succeeds. The `item.a as string` cast is safe because the `.filter` above guarantees only string values reach that point.

- [ ] **Step 5: Commit**

```bash
git add website/app/help/page.tsx
git commit -m "feat(website): update help page metadata, add canonical, FAQPage JSON-LD, and new FAQ items"
```

---

## Post-Implementation Verification

After all tasks are complete:

- [ ] **Validate JSON-LD on home page** using Google's Rich Results Test (search "rich results test google") — enter `https://captureai.dev` and confirm FAQPage and Organization schemas are detected.

- [ ] **Validate JSON-LD on help page** using the same tool with `https://captureai.dev/help`.

- [ ] **Check canonical tags** by viewing page source on any page (`Ctrl+U`) and searching for `rel="canonical"` — confirm it points to that page's own URL, not `/`.

- [ ] **Check OG image** using opengraph.xyz — paste `https://captureai.dev` and confirm the image previews correctly without cropping.

- [ ] **Submit updated sitemap** in Google Search Console: Sitemaps section → `https://captureai.dev/sitemap.xml` → Resubmit.
