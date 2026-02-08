# CaptureAI Design System — Midnight Glow

A maximalist/expressive aesthetic with deep dark backgrounds, blue-to-cyan luminous accents, glassmorphic surfaces, and subtle ambient glow effects.

**Tech stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Lucide React icons, Inter font via Google Fonts

**Source of truth**: `app/globals.css` contains all tokens, utility classes, and animations.

---

## Color Tokens

Defined in `globals.css` under `@theme inline`:

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `#06060a` | Page background |
| `--color-surface` | `#0d0d12` | Card/panel fills |
| `--color-surface-raised` | `#131318` | Elevated surfaces |
| `--color-surface-glass` | `rgba(13,13,18,0.6)` | Glassmorphic panels |
| `--color-border` | `#1e1e26` | Standard borders |
| `--color-border-subtle` | `#141419` | Subtle borders |
| `--color-border-glow` | `rgba(56,189,248,0.12)` | Glow border hover |
| `--color-text` | `#f0f0f5` | Primary text |
| `--color-text-secondary` | `#9ca3b0` | Secondary text |
| `--color-text-tertiary` | `#5f6577` | Tertiary/muted text |
| `--color-accent` | `#2563eb` | Blue-600 accent |
| `--color-accent-hover` | `#3b82f6` | Blue-500 hover |
| `--color-cyan` | `#22d3ee` | Cyan accent |

---

## CSS Utility Classes

### Surfaces
- **`.glass`** — Frosted glass panel: `rgba(13,13,18,0.6)` background + `backdrop-blur(20px)` + subtle white border
- **`.glass-card`** — Gradient glass card with hover glow border. Default for all card-style containers.

### Borders
- **`.gradient-border`** — Pseudo-element gradient border (blue→cyan) using mask-composite
- **`.divider-gradient`** — 1px horizontal gradient line for section dividers

### Text
- **`.text-gradient`** — Animated blue→cyan gradient text (200% background-size)
- **`.text-gradient-static`** — Static blue-400→cyan gradient text for headlines

### Glow Effects
- **`.glow-blue`** — Subtle blue box-shadow
- **`.glow-blue-lg`** — Large blue box-shadow with dark depth
- **`.glow-cyan`** — Subtle cyan box-shadow
- **`.glow-btn`** — CTA button glow, intensifies on hover

### Backgrounds
- **`.gradient-blur`** — Absolute-positioned blurred circle (`blur(140px)`, `opacity 0.2`). Used as ambient glow orbs.
- **`.gradient-mesh`** — Multi-radial gradient page background (blue + cyan)
- **`.gradient-section`** — Top-centered radial gradient overlay for sections

### Animations
- **`.animate-float-slow`** — Gentle 8s vertical float + slight rotation
- **`.animate-pulse-glow`** — Opacity pulse between 0.15–0.25, 4s cycle
- **`.animate-shimmer`** — Background-position shimmer, 8s cycle

### Overlay
- **`.noise`** — Fixed noise texture overlay at 1.5% opacity (applied to `<body>` via `layout.tsx`)

---

## Typography Scale

| Element | Size | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|
| h1 | `clamp(2.5rem, 5vw + 0.5rem, 4rem)` | 800 | -0.035em | 1.05 |
| h2 | `clamp(1.75rem, 3vw + 0.25rem, 2.75rem)` | 700 | -0.025em | 1.1 |
| h3 | `clamp(1.25rem, 2vw + 0.125rem, 1.5rem)` | 600 | -0.02em | 1.3 |
| h4 | 1.125rem | 600 | -0.015em | 1.35 |
| p | 16px (15px mobile) | 400 | default | 1.7 |

**Font**: Inter with OpenType features `cv02, cv03, cv04, cv11`

---

## Component Patterns

### Page Structure

Every page follows this layout:

```jsx
<div className="relative py-20 md:py-28">
  {/* Ambient background */}
  <div className="pointer-events-none absolute inset-0 gradient-mesh" />
  <div className="absolute ... rounded-full bg-blue-600 gradient-blur animate-pulse-glow" />

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
<p className="mx-auto max-w-md text-[--color-text-secondary]">Subtitle</p>
```

### Cards

- **Standard card**: `glass-card rounded-2xl p-7` (or `p-8`)
- **Featured/highlighted card**: Wrap with `gradient-border rounded-2xl`, inner div gets `rounded-2xl bg-gradient-to-b from-blue-500/[0.06] to-cyan-500/[0.02] p-7`

### Icon Containers

Each section uses a unique color pair for visual variety:

```jsx
<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-{color}-500/15 to-{color}-500/10">
  <Icon className="h-5 w-5 text-{color}-400" />
</div>
```

Colors in use: blue/cyan, violet/blue, amber/orange, emerald/cyan, rose/pink, sky/blue

### Buttons

**Primary CTA**:
```
glow-btn rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500
```

**Secondary**:
```
rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-[--color-text-secondary] transition-all hover:border-white/[0.15] hover:text-[--color-text]
```

**Text link**:
```
text-cyan-400 transition-colors hover:text-cyan-300
```

### Numbered Steps

```jsx
<div className="relative flex-shrink-0">
  <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md" />
  <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.25)]">
    {number}
  </div>
</div>
```

### Section Dividers

- Between page sections: `<div className="divider-gradient absolute left-0 right-0 top-0" />`
- Inside cards: `<div className="divider-gradient mb-8" />`

### PRO Badges

```jsx
<span className="rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-400">
  Pro
</span>
```

### Links

```
text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300
```

### Check Marks

- Pro features: `text-cyan-400`
- Free features: `text-[--color-text-tertiary]`

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
| Card border radius | `rounded-2xl` |
| Button/input/icon border radius | `rounded-xl` |

---

## File Map

| File | Purpose |
|---|---|
| `app/globals.css` | All design tokens, utilities, animations |
| `app/layout.tsx` | Inter font loading, noise overlay on body |
| `components/Navbar.tsx` | Sticky nav with glass backdrop |
| `components/Hero.tsx` | Homepage hero with mesh gradient + glow orbs |
| `components/Features.tsx` | 8-feature grid with colored glass cards |
| `components/HowItWorks.tsx` | 3-step flow with gradient connecting line |
| `components/FAQ.tsx` | Accordion with glass card wrapper |
| `components/Footer.tsx` | Footer with gradient divider |
| `app/page.tsx` | Homepage (showcases, pricing, CTA) |
| `app/activate/page.tsx` | Subscription page (Free vs Pro plans) |
| `app/download/page.tsx` | Chrome extension download |
| `app/help/page.tsx` | Help center with guides + shortcuts |
| `app/contact/page.tsx` | Contact cards (Support + Feedback) |
