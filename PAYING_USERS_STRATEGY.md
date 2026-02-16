# CaptureAI: Paying Users Strategy

## Current State

- **Product:** Chrome extension — screenshot questions, OCR extraction, AI answers, Vocabulary.com auto-solve, privacy guard
- **Pricing:** Free (10 req/day) → Pro ($9.99/mo, unlimited)
- **Infrastructure:** Stripe billing, license keys, Cloudflare Workers API — all production-ready
- **Distribution:** Chrome Web Store listing

---

## Phase 1: Foundation (Weeks 1–3)

### 1.1 Fix the Free-to-Pro Conversion Funnel

The product already has a free tier and a payment system. The first priority is making the upgrade path frictionless and compelling.

**Actions:**

- **Add in-extension upgrade prompts.** When a free user hits their 10-request daily limit, show a clear "Upgrade to Pro for unlimited" CTA directly in the extension popup — not just on the website. This is where users feel the pain; capture intent at that exact moment.
- **Add a "requests remaining" counter** visible in the popup UI at all times. Scarcity awareness drives upgrades. Show "3/10 remaining today" with a progress bar.
- **Stripe checkout from within the extension.** Open the Stripe checkout in a new tab directly from the extension popup (the API endpoint `POST /api/subscription/create-checkout` already exists). Reduce clicks between "I want more" and "I'm paying."
- **Track funnel metrics.** Add anonymous, privacy-respecting event tracking (no PII): extension installed → free key activated → first query → hit limit → clicked upgrade → completed payment. Use Cloudflare Workers analytics or a simple counter table in D1. You can't optimize what you can't measure.

### 1.2 Chrome Web Store Optimization

This is the primary discovery channel right now.

**Actions:**

- **Rewrite the CWS listing copy.** Lead with the outcome, not the tech. "Get instant answers to any question on your screen" beats "OCR-powered AI screenshot tool." Focus on: students passing exams, professionals saving time, researchers getting answers fast.
- **Add screenshots/video.** Record a 30-second demo showing: capture a question → get answer instantly. Show the auto-solve feature on Vocabulary.com. Visual proof converts browsers into installers.
- **Keyword-optimize the listing.** Target: "AI homework helper," "screenshot answer tool," "AI study assistant," "vocabulary.com answers," "AI Chrome extension." Research what competitors rank for.
- **Request reviews.** After a user completes 20+ queries, prompt them (once) to leave a Chrome Web Store review. Reviews are the single biggest trust signal on CWS.

---

## Phase 2: Targeted Acquisition (Weeks 3–6)

### 2.1 Go Where Students Already Are

CaptureAI's strongest use case is students needing quick answers while studying online. This is the beachhead market.

**Actions:**

- **Reddit organic posts.** Participate genuinely in r/college, r/studytips, r/HomeworkHelp, r/APStudents, r/SAT, r/GRE. Share the tool where it naturally solves a problem someone posted about. Don't spam — be helpful and mention the tool in context. One viral Reddit post can drive thousands of installs.
- **Discord/Slack communities.** Join student-focused Discord servers (study groups, CS communities, SAT prep). Same approach — help first, mention the tool when relevant.
- **TikTok/YouTube Shorts.** Record 15–30 second screen recordings showing CaptureAI solving a difficult question instantly. "POV: you found the best study hack" format. This content style is proven for student-focused tools. Can be done with zero budget.
- **Student ambassador program.** Offer free Pro access to students who make content or refer classmates. Give each ambassador a referral code.

### 2.2 Vocabulary.com Angle (Niche Domination)

The auto-solve feature for Vocabulary.com is a unique differentiator. Own this niche completely.

**Actions:**

- **Create a dedicated landing page** at `/vocabulary-com` on the website. Target "vocabulary.com answers," "vocabulary.com helper," "vocabulary.com auto solver" — these are high-intent, low-competition keywords.
- **YouTube tutorial video.** "How to get 100% on Vocabulary.com" — walkthrough using CaptureAI. This is evergreen SEO content that will compound.
- **Reddit/forum posts** in communities where Vocabulary.com is used (language learning, school subreddits). The auto-solve feature is a strong hook.

### 2.3 Referral System

**Actions:**

- **Implement a referral program.** Each Pro user gets a referral link. When someone signs up and upgrades via that link:
  - Referrer gets 1 free month added to their subscription
  - New user gets a 7-day free Pro trial
- **Implementation:** Add a `referral_code` and `referred_by` column to the users table. Generate unique codes per user. Track conversions.

---

## Phase 3: Growth Levers (Weeks 6–12)

### 3.1 Content & SEO

**Actions:**

- **Blog section on the website.** Write 5–10 SEO-optimized articles targeting:
  - "best AI study tools 2026"
  - "how to use AI for homework"
  - "Chrome extensions for students"
  - "AI screenshot tools"
  - "vocabulary.com tips and tricks"
- **Each article** should naturally lead to CaptureAI as the solution. This is long-term compounding traffic.
- **Product Hunt launch.** Prepare a solid launch with screenshots, demo video, and a compelling tagline. Coordinate with early users to upvote. A top-5 daily finish can drive 2,000–5,000 installs in a week.

### 3.2 Expand Auto-Solve to More Platforms

This is a product-led growth lever. Each new platform supported creates a new acquisition channel.

**Candidate platforms:**
- Quizlet (massive student user base)
- Khan Academy exercises
- Coursera/edX quizzes
- Duolingo
- Canvas LMS quizzes

Each new integration = a new niche to dominate with content and CWS keywords.

### 3.3 Free Trial for Pro

**Actions:**

- **Offer a 3-day Pro trial** for all new users (instead of hard-capping at 10 requests immediately). Let users experience the full product before restricting them. Users who've tasted unlimited are far more likely to pay.
- **Implementation:** Set `trial_ends_at` in the users table. During trial period, treat as Pro tier. After expiry, downgrade to free limits.

---

## Phase 4: Paid Acquisition (When Organic Works)

Only spend money on ads after you've validated that the free → Pro conversion funnel works and you know your unit economics.

### 4.1 Key Metrics to Track Before Spending

- **Install → Free activation rate** (target: >50%)
- **Free → Pro conversion rate** (target: >3–5%)
- **Pro monthly churn rate** (target: <8%)
- **Customer LTV** (at $9.99/mo with <8% churn ≈ $125)
- **Acceptable CAC** (target: <$30, ideally <$15)

### 4.2 Paid Channels (in priority order)

1. **Google Ads** — target "AI homework helper," "screenshot answer tool," "vocabulary.com solver." These are high-intent searches. Start with $10–20/day.
2. **YouTube pre-roll ads** — target study/education content viewers. 15-second demo showing instant answer capture.
3. **TikTok/Instagram ads** — repurpose organic content that performed well. Target 16–25 age group, student interests.

---

## Pricing Optimization

### Current pricing is reasonable but consider:

- **Annual plan:** Offer $79.99/year ($6.67/mo) — ~33% discount. Annual plans reduce churn dramatically and improve cash flow.
- **Student discount:** $4.99/mo with a .edu email verification. Lower price point, but students tell other students. Word-of-mouth is the best channel for this demographic.
- **Lifetime deal (limited):** $49.99 one-time during launch/Product Hunt. Creates urgency, funds early growth, builds user base for social proof.

---

## Implementation Priority (Ranked by Impact/Effort)

| Priority | Action | Impact | Effort |
|----------|--------|--------|--------|
| 1 | In-extension upgrade prompts + remaining counter | High | Low |
| 2 | Chrome Web Store listing optimization | High | Low |
| 3 | Vocabulary.com landing page + SEO | High | Low |
| 4 | TikTok/YouTube Shorts content (3–5 videos) | High | Medium |
| 5 | Reddit/Discord organic outreach | Medium | Low |
| 6 | 3-day Pro trial for new users | High | Medium |
| 7 | Referral program | Medium | Medium |
| 8 | Annual plan + student discount | Medium | Low |
| 9 | Product Hunt launch | High | Medium |
| 10 | Blog + SEO content | Medium | High |
| 11 | Expand auto-solve to Quizlet/Khan Academy | High | High |
| 12 | Paid ads (Google, YouTube, TikTok) | High | High |

---

## Key Principles

1. **Free users are your sales team.** Every free user who hits the limit is a potential paying customer AND a potential referrer. Make the free experience good enough to hook them, constrained enough to frustrate them.
2. **Capture intent at the point of pain.** The upgrade prompt must appear when users hit their limit — inside the extension, not on a separate website they have to navigate to.
3. **Own a niche before going broad.** Vocabulary.com auto-solve is your wedge. Dominate that keyword space, then expand to Quizlet, Khan Academy, etc.
4. **Measure everything.** You cannot optimize a conversion funnel you can't see. Add basic analytics before doing anything else.
5. **Content compounds.** Every blog post, YouTube video, and Reddit thread you create today will still drive traffic in 12 months. Invest early.
