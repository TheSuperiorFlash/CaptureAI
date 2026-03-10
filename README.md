# CaptureAI - AI-Powered Screenshot Question Solver

<div align="center">

![CaptureAI Logo](extension/icons/icon128.png)

**Capture questions from your screen and get instant AI-powered answers**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-brightgreen)](https://chromewebstore.google.com/detail/captureai/idpdleplccjjbmdmjkppmkecmoeomnjd)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-orange.svg)](manifest.json)

</div>

---

## Overview

CaptureAI is a Chrome extension that captures questions from any webpage and delivers instant AI answers. Built for students, researchers, and anyone who needs quick answers while browsing.

### Features

- **Smart Screenshot Capture** — Select any screen area to capture questions
- **OCR Text Extraction** — Tesseract.js v7.0.0 extracts text for 90% token cost reduction
- **AI-Powered Answers** — Instant responses via OpenAI (gpt-4.1-nano / gpt-5-nano)
- **Quick Capture** — Repeat last capture area with one click
- **Auto-Solve Mode** — Automatically answers multiple-choice questions (Vocabulary.com)
- **Ask Mode** — Custom questions with optional image attachments
- **Stealth Mode** — Invisible operation when UI is hidden
- **Privacy Guard** — Blocks focus/visibility detection, spoofs `hasFocus()`, removes AI honeypots, blocks clipboard events
- **Reasoning Slider** — Adjustable AI reasoning level (Pro)
- **Keyboard Shortcuts** — `Ctrl+Shift+X` capture | `Ctrl+Shift+F` recapture | `Ctrl+Shift+E` toggle

---

## Quick Start

### Installation

1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/captureai/idpdleplccjjbmdmjkppmkecmoeomnjd)
2. Click **Add to Chrome**
3. Activate with a license key (free or Pro)

### Getting a License Key

**Free (10 requests/day):** Click extension icon -> [activation page](https://captureai.dev/activate) -> enter email

**Pro ($9.99/month, unlimited):** Click "Buy Pro Key" in popup -> Stripe checkout -> key delivered via email

---

## Usage

### Basic Capture

1. Press `Ctrl+Shift+X` (or click "Capture a Question")
2. Click and drag to select a question area
3. Release to get an AI answer

### Quick Capture

Press `Ctrl+Shift+F` to re-capture the same area — ideal for sequential questions.

### Auto-Solve (Vocabulary.com)

1. Enable auto-solve toggle
2. Perform one manual capture to set the area
3. Extension automatically captures and answers subsequent questions
4. Press `Escape` to stop

### Ask Mode

Toggle to **Ask** mode, type a question, optionally attach a screenshot, press `Enter`.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+X` | Start area capture |
| `Ctrl+Shift+F` | Quick capture (repeat last area) |
| `Ctrl+Shift+E` | Toggle UI panel |
| `Escape` | Cancel capture / Stop auto-solve |
| `Enter` | Submit in Ask mode |

---

## Architecture

```text
User Action -> Content Script -> Background Script -> Cloudflare Workers -> OpenAI
                    |                                        |
              OCR (Tesseract.js)                    License Validation
                    |                               Rate Limiting (native CF)
              UI Display <-----------------------------  AI Response
```

**Stack:** Manifest V3 + ES6 Modules + Tesseract.js v7.0.0 + Cloudflare Workers (D1) + AI Gateway + Stripe

---

## Pricing

| Feature | Free | Pro ($9.99/mo) |
|---------|------|----------------|
| Daily Requests | 10 | Unlimited (20/min) |
| Screenshot Capture + OCR | Yes | Yes |
| Stealth Mode | Yes | Yes |
| Auto-Solve / Ask Mode | — | Yes |
| Privacy Guard / Reasoning Slider | — | Yes |

---

## Development

### Prerequisites

Google Chrome, Node.js 18+, Cloudflare account (for API deployment)

### Local Setup

1. Clone the repository
2. `chrome://extensions/` -> Developer mode -> **Load unpacked** -> select `extension/`
3. Make changes, click refresh on the extension card

### Testing

```bash
npm test              # Jest tests (30 files)
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright e2e tests
npm run test:all      # All tests
npm run lint          # ESLint check
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Extension not working | Refresh page, check license key, verify not on `chrome://` page |
| Capture not starting | Refresh extension at `chrome://extensions/`, check console |
| License key issues | Verify format `XXXX-XXXX-XXXX-XXXX-XXXX`, check connection |
| Auto-solve not working | Do one manual capture first, confirm supported site, check toggle |

---

## Privacy

No data collection, no analytics, no telemetry. Screenshots are processed and discarded immediately. See [privacy-policy.html](privacy-policy.html).

---

## Version History

| Version | Highlights |
|---------|------------|
| **v2.0.0** | Cloudflare Workers API, license key system, Stripe integration, usage tracking |
| **v1.1.0** | Privacy Guard, reasoning slider, improved stealth mode |
| **v1.0.0** | Initial release: capture, OCR, AI answers, auto-solve, ask mode, stealth, shortcuts |

---

## Contributing

Contributions welcome. Areas for improvement: more educational sites, formula recognition, additional OCR languages, options page.

## License

MIT License — see [LICENSE](LICENSE).

## Author

**Grayson Kramer** — [@TheSuperiorFlash](https://github.com/TheSuperiorFlash)

---

<div align="center">

[Report Bug](https://github.com/TheSuperiorFlash/CaptureAI/issues) · [Request Feature](https://github.com/TheSuperiorFlash/CaptureAI/issues)

</div>
