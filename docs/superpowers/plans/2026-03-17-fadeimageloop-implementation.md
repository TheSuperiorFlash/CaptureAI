# FadeImageLoop Component Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a reusable FadeImageLoop component that smoothly fades between two images in a continuous loop, and integrate it into the Privacy Guard feature card.

**Architecture:** Build a standalone React component that manages image fade animation using Framer Motion keyframes. The component receives two image paths and timing configuration, handling all animation logic internally. Integrate into Features.tsx by adding an `images` property to the Feature interface and conditional rendering in FeatureCard.

**Tech Stack:** React, Framer Motion, CSS (for rendering optimizations)

---

## Chunk 1: Create FadeImageLoop Component

### Task 1: Create FadeImageLoop.tsx

**Files:**
- Create: `website/components/FadeImageLoop.tsx`

- [ ] **Step 1: Write the FadeImageLoop component**

```typescript
'use client'

import { motion } from 'framer-motion'

interface FadeImageLoopProps {
  image1: string
  image2: string
  duration1?: number
  fadeDuration?: number
  duration2?: number
}

export default function FadeImageLoop({
  image1,
  image2,
  duration1 = 2,
  fadeDuration = 1,
  duration2 = 2,
}: FadeImageLoopProps) {
  const totalDuration = duration1 + fadeDuration + duration2 + fadeDuration

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  return (
    <div className="relative w-full h-full" style={{ backfaceVisibility: 'hidden', WebkitFontSmoothing: 'antialiased' }}>
      {/* Image 1 */}
      <motion.img
        src={image1}
        alt="Fade loop image 1"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          imageRendering: 'auto',
          WebkitFontSmoothing: 'antialiased',
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
        animate={{
          opacity: [1, 1, 0, 0],
        }}
        transition={{
          duration: totalDuration,
          times: [0, duration1 / totalDuration, (duration1 + fadeDuration) / totalDuration, 1],
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Image 2 */}
      <motion.img
        src={image2}
        alt="Fade loop image 2"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          imageRendering: 'auto',
          WebkitFontSmoothing: 'antialiased',
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
        animate={{
          opacity: [0, 0, 1, 1],
        }}
        transition={{
          duration: totalDuration,
          times: [0, (duration1 + fadeDuration) / totalDuration, (duration1 + fadeDuration * 2) / totalDuration, 1],
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify the component syntax is correct**

Check: Component exports properly, props are typed, Framer Motion usage is correct, CSS rendering optimizations are in place.

---

## Chunk 2: Update Features.tsx to Integrate FadeImageLoop

### Task 2: Update Feature Interface

**Files:**
- Modify: `website/components/Features.tsx:7-16`

- [ ] **Step 1: Update the Feature interface to add images property**

Change from:
```typescript
interface Feature {
    icon: LucideIcon
    title: string
    description: string
    pro?: boolean
    color: string
    glow: string
    image?: string
    video?: string
}
```

To:
```typescript
interface Feature {
    icon: LucideIcon
    title: string
    description: string
    pro?: boolean
    color: string
    glow: string
    image?: string
    video?: string
    images?: [string, string]
}
```

### Task 3: Import FadeImageLoop and Update FeatureCard Rendering

**Files:**
- Modify: `website/components/Features.tsx:1-6` (imports)
- Modify: `website/components/Features.tsx:141-160` (image/video rendering section)

- [ ] **Step 1: Add FadeImageLoop import**

Add to the imports at the top after the other component imports:
```typescript
import FadeImageLoop from './FadeImageLoop'
```

- [ ] **Step 2: Update the image/video rendering logic in FeatureCard**

Change from:
```typescript
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/5 bg-black/20 aspect-square" style={{ backfaceVisibility: 'hidden', WebkitFontSmoothing: 'antialiased' }}>
                    {feature.video ? (
                        <video
                            src={feature.video}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : feature.image ? (
                        <img
                            src={feature.image}
                            alt={feature.title}
                            className="w-full h-full object-cover"
                            style={{
                                imageRendering: 'auto',
                                WebkitFontSmoothing: 'antialiased',
                                backfaceVisibility: 'hidden',
                                willChange: 'transform'
                            }}
                        />
                    ) : (
                        <div className="w-full h-full" />
                    )}
                </div>
```

To:
```typescript
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/5 bg-black/20 aspect-square" style={{ backfaceVisibility: 'hidden', WebkitFontSmoothing: 'antialiased' }}>
                    {feature.images ? (
                        <FadeImageLoop image1={feature.images[0]} image2={feature.images[1]} />
                    ) : feature.video ? (
                        <video
                            src={feature.video}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : feature.image ? (
                        <img
                            src={feature.image}
                            alt={feature.title}
                            className="w-full h-full object-cover"
                            style={{
                                imageRendering: 'auto',
                                WebkitFontSmoothing: 'antialiased',
                                backfaceVisibility: 'hidden',
                                willChange: 'transform'
                            }}
                        />
                    ) : (
                        <div className="w-full h-full" />
                    )}
                </div>
```

### Task 4: Update Privacy Guard Feature Configuration

**Files:**
- Modify: `website/components/Features.tsx:40-47`

- [ ] **Step 1: Add images property to Privacy Guard card**

Change from:
```typescript
    {
        icon: Shield,
        title: 'Privacy Guard',
        description: 'Prevents quiz platforms from detecting extension activity. Your browser logs show only normal browsing.',
        pro: true,
        color: 'from-teal-500/30 to-teal-600/10',
        glow: 'group-hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] group-hover:border-teal-500/30',
        image: '/action-log-canvas-2.png',
    },
```

To:
```typescript
    {
        icon: Shield,
        title: 'Privacy Guard',
        description: 'Prevents quiz platforms from detecting extension activity. Your browser logs show only normal browsing.',
        pro: true,
        color: 'from-teal-500/30 to-teal-600/10',
        glow: 'group-hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] group-hover:border-teal-500/30',
        images: ['/action-log-canvas-1.png', '/action-log-canvas-2.png'],
    },
```

---

## Chunk 3: Testing & Verification

### Task 5: Manual Testing

- [ ] **Step 1: Start the dev server**

Run: `cd website && npm run dev`
Expected: Dev server starts on http://localhost:3000

- [ ] **Step 2: Navigate to the features section**

Open http://localhost:3000 in browser, scroll to the features section

- [ ] **Step 3: Verify Privacy Guard card animation**

Check:
- ✅ Image 1 displays for ~2 seconds
- ✅ Smooth fade transition (~1 second)
- ✅ Image 2 displays for ~2 seconds
- ✅ Smooth fade back to image 1
- ✅ Loop repeats continuously
- ✅ Images are sharp and not pixelated
- ✅ Animation is smooth with no stuttering

- [ ] **Step 4: Verify other cards still work**

Check:
- ✅ Floating Interface card still shows static image
- ✅ Other cards display correctly
- ✅ No console errors

### Task 6: Final Commit

- [ ] **Step 1: Stage files and commit**

```bash
cd website
git add components/FadeImageLoop.tsx components/Features.tsx
git commit -m "feat(website): add FadeImageLoop component for Privacy Guard fade animation"
```

Expected: Commit succeeds with message shown

---
