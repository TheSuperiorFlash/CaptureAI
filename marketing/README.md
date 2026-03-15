# CaptureAI — Promotional Materials

HTML-based promo tiles and ad templates. Open in Chrome and screenshot at 1× zoom (100%) to export at the exact target dimensions.

## Files

| File | Dimensions | Use |
|------|-----------|-----|
| `tile-small-440x280.html` | 440×280 | Chrome Web Store — small promo tile (category listings) |
| `tile-large-920x680.html` | 920×680 | Chrome Web Store — large promo tile (extension page) |
| `tile-marquee-1400x560.html` | 1400×560 | Chrome Web Store — marquee tile (featured extensions) |
| `ad-social-1200x628.html` | 1200×628 | Social media ad (Facebook, Twitter/X, LinkedIn) |

## How to Export

1. Open the HTML file in Chrome
2. Set zoom to **100%** (Ctrl+0)
3. Open DevTools → toggle device toolbar → set custom dimensions matching the file
4. Screenshot with DevTools: Ctrl+Shift+P → "Capture screenshot"

Or use Playwright/Puppeteer to automate screenshots at exact pixel dimensions.

## Design System

Uses the CaptureAI "Abyssal Neon" aesthetic:
- Background: `#08090b`
- Blue accent: `#0047ff`
- Cyan accent: `#00f0ff`
- Fonts: Outfit (headings) + Plus Jakarta Sans (body) via Google Fonts
