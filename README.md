# CaptureAI - AI-Powered Screenshot Question Solver

<div align="center">

![CaptureAI Logo](icons/icon128.png)

**Capture questions from your screen and get instant AI-powered answers**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-brightgreen)](https://chromewebstore.google.com/detail/captureai/idpdleplccjjbmdmjkppmkecmoeomnjd)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-orange.svg)](manifest.json)

</div>

---

## 📋 Overview

CaptureAI is a Chrome extension that lets you capture questions from any webpage and get instant answers powered by AI. Perfect for students, researchers, and anyone who needs quick answers while browsing.

### Key Features

- **🖼️ Smart Screenshot Capture** - Select any area on your screen to capture questions
- **🔤 OCR Technology** - Extracts text from screenshots using Tesseract.js for 90% token cost reduction
- **🤖 AI-Powered Answers** - Get instant, accurate responses powered by OpenAI
- **⚡ Quick Capture** - Repeat captures of the same area with one click
- **🎯 Auto-Solve Mode** - Automatically solve multiple-choice questions on Vocabulary.com
- **💬 Ask Mode** - Ask custom questions with optional image attachments
- **👻 Stealth Mode** - Invisible operation when UI is hidden
- **🛡️ Privacy Guard** - Prevents websites from detecting focus loss, tab switches, or extension usage
- **🧠 Reasoning Slider** - Adjust AI reasoning level for Pro users (low/medium/high)
- **⌨️ Keyboard Shortcuts** - Fast workflow with customizable hotkeys
- **🔑 License Key System** - Free tier (10 requests/day) or Pro tier (unlimited)
- **🔒 Privacy-First** - No data collection, secure API processing

---

## 🚀 Quick Start

### Installation

1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/captureai/idpdleplccjjbmdmjkppmkecmoeomnjd)
2. Click **Add to Chrome**
3. Click the CaptureAI icon and activate with a license key

### Getting a License Key

**Free Tier (10 requests/day):**
1. Click the CaptureAI extension icon
2. Visit the [activation page](https://thesuperiorflash.github.io/CaptureAI/activate.html)
3. Enter your email to receive a free license key

**Pro Tier (Unlimited - $9.99/month):**
1. Click "Buy Pro Key" in the extension popup
2. Complete checkout via Stripe
3. Receive your Pro license key via email

---

## 📖 Usage Guide

### Basic Capture Mode

1. **Open the extension** - Click the CaptureAI icon or press `Ctrl+Shift+E`
2. **Start capture** - Click "Capture a Question" or press `Ctrl+Shift+X`
3. **Select area** - Click and drag to select the question on screen
4. **Get answer** - Release to capture and receive AI response instantly

### Quick Capture

Repeat your last capture area instantly:
- Click **Quick Capture** button, or
- Press `Ctrl+Shift+F`

Perfect for answering multiple questions in the same location.

### Auto-Solve Mode

*Available on Vocabulary.com*

1. Enable **Auto-solve toggle** in the panel
2. Perform one manual capture to set the question area
3. Extension automatically captures and answers subsequent questions
4. Handles multiple-choice questions (1-4) intelligently
5. Press `Escape` to stop auto-solve

### Ask Mode

Ask custom questions with optional images:

1. Toggle to **Ask** mode in the header
2. Type your question in the text field
3. *Optional:* Click attach icon to add screenshot context
4. Press `Enter` or click **Ask Question**

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+X` | Start area capture |
| `Ctrl+Shift+F` | Quick capture (repeat last area) |
| `Ctrl+Shift+E` | Toggle UI panel visibility |
| `Escape` | Cancel capture / Stop auto-solve |
| `Enter` | Submit question in Ask mode |

---

## 🔤 OCR Technology

CaptureAI uses **Tesseract.js** for optical character recognition, providing significant benefits:

- **90% Token Savings** - Extracted text uses far fewer tokens than images
- **Faster Processing** - Text-based queries are processed more quickly
- **Smart Fallback** - Automatically uses image if OCR confidence is below 60%
- **Text Cleaning** - Removes OCR artifacts and normalizes formatting

---

## 🏗️ Architecture

### Core Components
```
CaptureAI/
├── manifest.json              # Extension configuration (Manifest V3)
├── background.js              # Service worker (API communication)
├── content.js                 # Main content script entry point
├── popup.html/js              # Extension popup interface
├── inject.js                  # MAIN world privacy protection script
├── privacy-policy.html        # Privacy policy
│
├── modules/                   # Modular JavaScript components
│   ├── config.js             # Constants and state management
│   ├── storage.js            # Chrome storage utilities
│   ├── auth-service.js       # License key authentication
│   ├── ocr-service.js        # Tesseract.js OCR integration
│   ├── domains.js            # Site detection logic
│   ├── utils.js              # Helper functions
│   ├── image-processing.js   # Screenshot compression/optimization
│   ├── capture-system.js     # Area selection and capture
│   ├── auto-solve.js         # Auto-solve functionality
│   ├── ui-core.js            # Main UI panel and theming
│   ├── ui-components.js      # Buttons, toggles, ask mode
│   ├── ui-stealthy-result.js # Stealth mode result display
│   ├── messaging.js          # Chrome extension messaging
│   ├── keyboard.js           # Keyboard shortcut handling
│   ├── event-manager.js      # Event cleanup and error handling
│   ├── privacy-guard.js      # Privacy protection coordinator
│   └── migration.js          # API key to license key migration
│
├── libs/tesseract/            # OCR library
│   ├── tesseract.min.js
│   ├── worker.min.js
│   └── lang-data/eng.traineddata.gz
│
├── api/                       # Cloudflare Workers API
│   └── src/
│       ├── index.js          # Main router
│       ├── auth.js           # License key management
│       ├── ai.js             # OpenAI API integration
│       └── subscription.js   # Stripe payment handling
│
├── website/                   # Next.js support website
│
└── icons/                     # Extension icons
```

### Data Flow
```
User Action → Content Script → Background Script → API Server → OpenAI
                    ↓                                    ↓
            OCR Processing                        License Validation
                    ↓                                    ↓
              UI Display ←←←←←←←←←←←←←←←←←←←←← API Response
```

### Key Technologies

- **Manifest V3** - Modern Chrome extension architecture
- **ES6 Modules** - Clean, modular code organization
- **Tesseract.js** - Client-side OCR for text extraction
- **Cloudflare Workers** - Serverless API with D1 database
- **OpenAI API** - GPT models for AI-powered answers
- **Stripe** - Payment processing for Pro subscriptions
- **Chrome Storage API** - Secure local data persistence

---

## 🎨 Features Deep Dive

### OCR Processing

- **Tesseract.js v5.1.0** - Industry-standard OCR library
- **60% Confidence Threshold** - Falls back to image if text extraction is unreliable
- **Text Cleaning** - Removes artifacts, normalizes whitespace
- **Token Optimization** - Reduces API costs by ~90%

### Image Processing

- **Smart compression** - Reduces file size while maintaining quality
- **WebP/JPEG optimization** - Chooses best format for efficiency
- **Intelligent resizing** - Optimizes dimensions for API efficiency
- **Zoom-aware capture** - Handles browser zoom levels correctly

### Stealth Mode

When UI is hidden:
- No visible overlay during capture
- No selection box shown
- Results appear subtly in bottom-right corner
- Completely invisible operation

### Privacy Guard System

**Prevents websites from detecting extension usage:**

- ✅ **Blocks focus/blur detection** - Websites can't tell when you click the extension
- ✅ **Hides tab switches** - `visibilitychange` events are blocked
- ✅ **Spoofs focus state** - `document.hasFocus()` always returns true
- ✅ **Removes AI honeypots** - Automatically deletes hidden AI detection traps
- ✅ **MAIN world injection** - Runs before page scripts, undetectable by websites

### Reasoning Slider (Pro Only)

Adjust AI reasoning effort:
- **Low** - Fast responses for simple questions
- **Medium** - Balanced reasoning
- **High** - Deep analysis for complex problems

### Auto-Solve Intelligence

- Detects multiple-choice format (1-4 answers)
- Identifies invalid questions automatically
- Avoids red/incorrect answer choices
- Handles "Spell the word" prompts
- Stops after 2 consecutive invalid questions

### License Key System

- **Free Tier** - 10 requests per day, all core features
- **Pro Tier** - Unlimited requests, reasoning slider, priority support
- **Secure Validation** - Backend validates all requests
- **Usage Tracking** - View remaining requests in popup

---

## 💰 Pricing

| Feature | Free | Pro ($9.99/mo) |
|---------|------|----------------|
| Daily Requests | 10 | Unlimited |
| Screenshot Capture | ✅ | ✅ |
| OCR Text Extraction | ✅ | ✅ |
| Auto-Solve Mode | ✅ | ✅ |
| Ask Mode | ✅ | ✅ |
| Stealth Mode | ✅ | ✅ |
| Privacy Guard | ✅ | ✅ |
| Reasoning Slider | ❌ | ✅ |
| Priority Support | ❌ | ✅ |

---

## 📊 Supported Websites

### Auto-Solve Support
- ✅ Vocabulary.com - Vocabulary practice

### Universal Capture Mode
Works on **all websites** for manual question capture and AI answers.

---

## 🔧 Configuration

### Auto-Solve Timing

Adjust auto-solve behavior in `modules/config.js`:
```javascript
export const CONFIG = {
    MAX_INVALID_QUESTIONS: 2,       // Stop after N invalid questions
    AUTO_SOLVE_ANSWER_DELAY: 500,   // Delay before entering answer (ms)
    AUTO_SOLVE_CYCLE_DELAY: 2500,   // Delay between questions (ms)
};
```

---

## 🛠️ Development

### Prerequisites

- Google Chrome browser
- Node.js (for website development)
- Cloudflare account (for API deployment)

### Local Development

1. Clone the repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked** and select the extension folder
5. Make changes and click refresh icon on the extension card

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Adding New Supported Sites

Edit `modules/domains.js`:
```javascript
isOnSupportedSite() {
    return this.isOnVocabulary() ||
           this.isOnYourNewSite();
},

isOnYourNewSite() {
    return window.location.hostname.includes('yoursite.com');
}
```

---

## 🐛 Troubleshooting

### Extension Not Working

1. Refresh the page after installing
2. Check if license key is activated
3. Verify you're on a valid webpage (not chrome://)
4. Check browser console for errors (F12)

### Capture Not Starting

- Ensure you're not on a restricted page
- Try refreshing the extension: `chrome://extensions/`
- Check if content script loaded: inspect page console

### License Key Issues

- Verify key format: `XXXX-XXXX-XXXX-XXXX-XXXX`
- Check internet connection
- Try deactivating and reactivating

### Auto-Solve Not Working

- Perform one manual capture first to set area
- Confirm you're on a supported site
- Check if toggle is enabled
- Verify question format is multiple-choice

---

## 📝 Privacy Policy

CaptureAI respects your privacy:

- **No data collection** - We don't collect any usage data
- **Secure API** - License keys validated via encrypted connection
- **Direct processing** - Screenshots processed and discarded immediately
- **No tracking** - Zero analytics or telemetry
- **Open source** - All code is visible and auditable

See [privacy-policy.html](privacy-policy.html) for full details.

---

## 🌐 Browser Compatibility

CaptureAI is built specifically for **Google Chrome** and uses Chrome-specific APIs for screenshot capture. The extension is designed and tested exclusively for Google Chrome.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Areas for Improvement

- Add more supported educational sites
- Implement formula/equation recognition
- Add support for additional languages in OCR
- Create options page for advanced settings

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👤 Author

**Grayson Kramer**

- GitHub: [@TheSuperiorFlash](https://github.com/TheSuperiorFlash)
- Contact: wonhappyheart@gmail.com

---

## 🙏 Acknowledgments

- OpenAI for the GPT API
- Tesseract.js team for the OCR library
- Cloudflare for Workers platform
- Chrome Extensions team for excellent documentation

---

## 📈 Version History

### v2.0.0 (Current)
- **API System** - Cloudflare Workers API with D1 database
- **License Key System** - Free tier (10/day) and Pro tier (unlimited)
- **Stripe Integration** - Secure payment processing for Pro subscriptions
- **Usage Tracking** - View remaining requests in popup

### v1.1.0
- **Privacy Guard** - Prevents websites from detecting extension usage
- **Reasoning Slider** - Adjustable AI reasoning level for Pro users
- **Improved Stealth Mode** - Enhanced invisible operation

### v1.0.0
- Initial release
- Basic capture and AI answer functionality
- OCR text extraction with Tesseract.js
- Auto-solve mode for supported sites
- Ask mode with image attachments
- Stealth mode for invisible operation
- Keyboard shortcuts

---

<div align="center">

**Made with ❤️ for students and learners everywhere**

[Report Bug](https://github.com/TheSuperiorFlash/CaptureAI/issues) · [Request Feature](https://github.com/TheSuperiorFlash/CaptureAI/issues)

</div>
