# CaptureAI Design System — Abyssal Neon

> **Self-update rule:** When you add/change design tokens, CSS utility classes, component patterns, or page files — update this file.

Maximalist/expressive aesthetic: pure dark backgrounds, rich deep blue + electric cyan luminous accents, glassmorphic surfaces, ambient glow effects.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lenis (smooth scroll), Lucide React
**Fonts:** Outfit (headings, via `@fontsource`), Plus Jakarta Sans (body, via `@fontsource`), Inter (numeric displays / `.font-inter`, via `@fontsource`)
**Source of truth:** `app/globals.css` (all tokens, utilities, animations)

---

## Color Tokens

Defined in `globals.css` under `@theme inline`:

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `#111214` | Page background (deepest Discord gray) |
| `--color-foreground` | `#fafafa` | Foreground fallback |
| `--color-surface` | `#0a0b0c` | Card/panel fills (even darker gray) |
| `--color-surface-raised` | `#050505` | Elevated surfaces |
| `--color-surface-glass` | `rgba(17,18,20,0.85)` | Glassmorphic panels |
| `--color-border` | `#0a0b0c` | Standard borders |
| `--color-border-subtle` | `#111214` | Subtle borders |
| `--color-border-glow` | `rgba(0,240,255,0.08)` | Electric cyan glow border |
| `--color-text` | `#ffffff` | Primary text |
| `--color-text-secondary` | `#a3b1c6` | Secondary text |
| `--color-text-tertiary` | `#67748e` | Tertiary/muted text |
| `--color-accent` | `#0047ff` | Vivid pure blue accent |
| `--color-accent-hover` | `#1a5cff` | Blue hover state |
| `--color-accent-muted` | `rgba(0,71,255,0.1)` | Muted accent background |
| `--color-accent-border` | `rgba(0,71,255,0.3)` | Accent border |
| `--color-cyan` | `#00f0ff` | Electric cyan accent |
| `--color-cyan-muted` | `rgba(0,240,255,0.1)` | Muted cyan background |
| `--color-cyan-bright` | `#33f3ff` | Bright cyan variant |

---

## CSS Utility Classes

### Surfaces
- **`.glass`** — Frosted glass panel: `var(--color-surface-glass)` + `backdrop-blur(24px)` + `rgba(255,255,255,0.03)` border
- **`.glass-card`** — Gradient glass card (`rgba(11,17,32,0.8)` → `rgba(6,9,19,0.6)`) + `backdrop-blur(20px)` + hover: cyan glow border + `translateY(-2px)` lift + inset glow

### Borders
- **`.gradient-border`** — Pseudo-element gradient border (cyan→blue→cyan) using mask-composite. Hover brightens to white→cyan→blue.
- **`.divider-gradient`** — 1px horizontal gradient line: transparent → blue/40% → cyan/20% → blue/40% → transparent

### Text
- **`.text-gradient`** — Animated blue(`#0047ff`)→cyan(`#00f0ff`)→blue gradient text (200% background-size)
- **`.text-gradient-static`** — Static blue(`#3388ff`)→cyan(`#00f0ff`) gradient text for headlines
- **`.text-shadow-glow`** — Text shadow for mobile readability over animated backgrounds
- **`.font-inter`** — Forces Inter font family (used for price displays)

### Glow Effects
- **`.glow-blue`** — Subtle blue box-shadow (`rgba(0,71,255)`)
- **`.glow-blue-lg`** — Large blue box-shadow with dark depth layer
- **`.glow-cyan`** — Subtle cyan box-shadow (`rgba(0,240,255)`)
- **`.glow-btn`** — CTA button glow, transitions from blue to cyan on hover

### Backgrounds
- **`.gradient-blur`** — Absolute-positioned blurred circle (`blur(150px)`, `opacity: 0.25`). Used as ambient glow orbs. Add `.gradient-blur-animated` for `will-change` on animated orbs.
- **`.aurora-bg`** — Multi-radial aurora gradient (blue at 10%/40%, cyan at 85%/60%, deep blue at 50%/90%)
- **`.gradient-mesh`** — Multi-radial gradient page background (blue + cyan, softer than aurora)
- **`.gradient-section`** — Top-centered radial gradient overlay (`rgba(0,71,255,0.1)`)

### Animations
- **`.animate-float-slow`** — Gentle 10s vertical float (`translateY(-25px)`) + slight rotation (2deg)
- **`.animate-pulse-glow`** — Opacity pulse (0.15→0.3) + scale pulse (1→1.05), 6s cycle
- **`.animate-shimmer`** — Background-position shimmer, 8s cycle
- **`.animate-marquee`** — Linear translateX marquee, 30s cycle (used for platform logos)

### Entrance Animations
- **`.reveal-up`** — Fade-in-up entrance (opacity 0→1, translateY 20px→0), 0.8s spring
- **`.delay-100`** through **`.delay-500`** — Staggered animation delays (100ms increments)
- All animations respect `prefers-reduced-motion: reduce` and `prefers-reduced-transparency: reduce`

### Overlay
- **`.noise`** — Fixed SVG noise texture overlay at 2% opacity (applied to `<body>` via `layout.tsx`)

### Focus & Selection
- **`::selection`** — Cyan background (`rgba(0,240,255,0.3)`) + white text
- **`:focus-visible`** — 2px cyan outline with 2px offset

---

## Typography Scale

| Element | Size | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|
| h1 | `clamp(2.75rem, 6vw + 0.5rem, 4.5rem)` | 700 | -0.04em | 1.05 |
| h2 | `clamp(2rem, 4vw + 0.25rem, 3.25rem)` | 600 | -0.03em | 1.1 |
| h3 | `clamp(1.25rem, 2.5vw + 0.125rem, 1.75rem)` | 500 | -0.02em | 1.25 |
| h4 | 1.125rem | 500 | -0.01em | 1.35 |
| p | 16px (15px mobile) | 400 | -0.01em | 1.7 |

**Heading font:** Outfit (all h1–h6)
**Body font:** Plus Jakarta Sans (default body, paragraphs)
**Hero title:** `.hero-title` — responsive breakpoints: `clamp(1.5rem, 8.5vw, 2.5rem)` → `3rem` (sm) → `4.5rem` (md) → `5rem` (lg, line-height 1.1)

---

## Component Patterns

### Page Structure

Every page follows this layout:

```jsx
<div className="relative overflow-x-hidden py-20 md:py-28">
  {/* Ambient background */}
  <div className="pointer-events-none absolute inset-0 gradient-mesh" />
  <div className="absolute ... rounded-full bg-blue-600 gradient-blur gradient-blur-animated animate-pulse-glow" />

  {/* Content */}
  <div className="relative z-10 mx-auto max-w-{3xl|5xl|6xl} px-6">
    {/* Header: badge + gradient title + subtitle */}
    {/* Sections */}
  </div>
</div>
```

### Page Headers

```jsx
<span className="mb-4 inline-block rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
  Badge Text
</span>
<h1 className="mb-3">
  <span className="text-[--color-text]">White part </span>
  <span className="text-gradient-static">gradient part</span>
</h1>
<p className="text-[--color-text-secondary]">Subtitle</p>
```

### Cards

- **Standard card**: `glass-card rounded-2xl p-7` (or `rounded-3xl p-7` for Features)
- **Featured/highlighted card**: Wrap with `gradient-border rounded-2xl`, inner div gets `rounded-2xl bg-gradient-to-b from-blue-500/[0.06] to-cyan-500/[0.02] p-8`

### Scroll Reveal

Components use `ScrollReveal`, `ScrollRevealStagger`, and `ScrollRevealItem` from `components/ScrollReveal.tsx` (framer-motion `whileInView`). All respect `useReducedMotion()`.

### Interactive Effects

- **MagneticButton** — Wraps CTAs with spring-based cursor-following magnetic pull effect
- **FeatureCard** — 3D tilt on hover with dynamic glass glare overlay (framer-motion springs)
- **PlatformMarquee** — `useAnimationFrame`-driven infinite logo scroll (25px/s)

### Icon Containers

Each section uses a unique color pair for visual variety:

```jsx
<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-{color}-500/15 to-{color}-500/10">
  <Icon className="h-5 w-5 text-{color}-400" />
</div>
```

Colors in use: blue/cyan, violet/blue, amber/orange, emerald/cyan, teal/teal, indigo/indigo, sky/sky

### Buttons

**Primary CTA**:

```text
glow-btn rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500
```

**Hero CTA** (larger):

```text
glow-btn rounded-2xl bg-gradient-to-r from-[#0047ff] to-[#1a5cff] px-10 py-4 text-base font-bold tracking-wide text-white hover:from-[#1a5cff] hover:to-[#00f0ff] hover:shadow-[0_0_40px_rgba(0,71,255,0.4)]
```

**Secondary**:

```text
rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-[--color-text-secondary] transition-all hover:border-white/[0.15] hover:text-[--color-text]
```

**Glass secondary** (pricing):

```text
glass rounded-xl py-3.5 text-center text-[15px] font-medium text-[--color-text-secondary] hover:text-[--color-text] hover:bg-white/[0.05]
```

**Text link**:

```text
text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300
```

### Numbered Steps

```jsx
<div className="relative flex-shrink-0">
  <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md" />
  <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0047ff] to-[#00f0ff] text-sm font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.25)]">
    {number}
  </div>
</div>
```

### Section Dividers

- Between page sections: `<div className="divider-gradient absolute left-0 right-0 top-0" />`
- Inside cards: `<div className="divider-gradient mb-8" />`

### PRO Badges

```jsx
<span className="rounded-full bg-gradient-to-r from-[#0047ff]/20 to-[#00f0ff]/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-cyan-400 border border-cyan-500/20 shadow-lg">
  PRO
</span>
```

### Links

```
text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300
```

### Check Marks

- Pro features: `text-cyan-400`
- Free features: `text-[--color-text-tertiary]`
- Excluded features: `opacity-30` + `XIcon text-[--color-text-tertiary]`

---

## Spacing System

Based on an 8pt grid. Common values:

| Context | Value |
|---|---|
| Card padding | `p-7` (28px) or `p-8` (32px) |
| Section vertical padding | `py-24 md:py-32` |
| Page top padding | `py-20 md:py-28` |
| Header bottom margin | `mb-14` or `mb-16` |
| Within-card element spacing | `mb-5`, `mb-6`, `space-y-3` |
| Card border radius | `rounded-2xl` or `rounded-3xl` (Features) |
| Button/input border radius | `rounded-xl` or `rounded-2xl` (hero CTA) |
| Icon container border radius | `rounded-xl` |

---

## Navbar

Floating pill navbar with two rendering modes:

- **Standard browsers**: SVG displacement filter (`#displacementFilter`) for liquid glass refraction effect + minimal opacity background
- **Low performance / mobile / Safari**: Falls back to solid glass (`bg-[#060913]/85 backdrop-blur-xl`)

Features: framer-motion `layoutId` hover pill, animated border-radius on scroll (CTA pill→rounded), MagneticButton CTA, mobile dropdown sheet.

Detection: `prefers-reduced-motion`, `prefers-reduced-transparency`, Safari UA sniffing, viewport width < 768px.

---

## File Map

### Components

| File | Purpose |
|---|---|
| `components/Navbar.tsx` | Floating pill nav with liquid glass + mobile dropdown |
| `components/Hero.tsx` | Homepage hero with interactive mouse-tracking glow orbs, word-by-word spring entrance, platform marquee |
| `components/ScrollStory.tsx` | Apple-style scroll-pinned story (400vh container, 3 sequences with mock quiz UI transitions) |
| `components/FloatingUIShowcase.tsx` | Interactive 1.75× replica of extension popup (capture/ask mode toggle) |
| `components/PrivacyGuardSlider.tsx` | Before/after image comparison with pointer-driven slider (mobile only) |
| `components/Features.tsx` | 8-feature grid with 3D tilt cards + dynamic glass glare, infinite mobile swipe carousel |
| `components/HowItWorks.tsx` | 3-step flow with gradient connecting line |
| `components/Pricing.tsx` | Free vs Pro pricing cards with mobile swipe-to-switch (stacked card deck) |
| `components/FAQ.tsx` | Two-column layout: left header + right accordion with glass card wrapper |
| `components/Footer.tsx` | 4-column footer with gradient divider |
| `components/ScrollReveal.tsx` | Framer Motion scroll-triggered reveal primitives (ScrollReveal, ScrollRevealStagger, ScrollRevealItem) |
| `components/SmoothScroll.tsx` | Lenis smooth scroll provider (lerp: 0.1, duration: 1.2) |
| `components/MagneticButton.tsx` | Magnetic cursor-following button wrapper (spring-based) |
| `components/AnimatedCounter.tsx` | Spring-animated number counter (triggers on viewport entry) |

### Pages

| File | Purpose |
|---|---|
| `app/layout.tsx` | Root layout: Outfit + Plus Jakarta Sans + Inter fonts, noise overlay, Navbar, Footer, SmoothScroll |
| `app/page.tsx` | Homepage: Hero, ScrollStory, FloatingUIShowcase, PrivacyGuardSlider, Features, HowItWorks, Pricing, FAQ, Final CTA |
| `app/activate/page.tsx` | Subscription page: Free vs Pro plan selection + email signup/Stripe checkout |
| `app/activate/layout.tsx` | Activate page metadata (SEO) |
| `app/download/page.tsx` | Chrome extension download + 4-step setup guide |
| `app/help/page.tsx` | Help center: getting started, keyboard shortcuts, FAQ, contact CTA |
| `app/contact/page.tsx` | Contact cards (Support email + Feedback email) |
| `app/privacy/page.tsx` | Privacy Policy (legal page, minimal styling) |
| `app/terms/page.tsx` | Terms of Service (legal page, minimal styling) |
| `app/payment-success/page.tsx` | Post-payment verification with retry logic (max 5 retries, exponential backoff) |
| `app/error.tsx` | Error boundary page |
| `app/not-found.tsx` | 404 page |
| `app/loading.tsx` | Global loading spinner |
| `app/robots.ts` | Robots.txt generation |
| `app/sitemap.ts` | Sitemap generation |

### Hooks & Lib

| File | Purpose |
|---|---|
| `hooks/useSwipeTier.ts` | Mobile swipe gesture hook for Free/Pro tier card switching (40px threshold) |
| `lib/constants.ts` | `SITE_URL` = `https://captureai.dev` |
| `lib/api.ts` | `API_BASE_URL` from `NEXT_PUBLIC_API_URL` env or `https://api.captureai.workers.dev` |
