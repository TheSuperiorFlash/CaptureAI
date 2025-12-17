# CaptureAI - AI-Powered Screenshot Question Solver

<div align="center">

![CaptureAI Logo](icons/icon128.png)

**Capture questions from your screen and get instant AI-powered answers**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-brightgreen)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)](manifest.json)

</div>

---

## 📋 Overview

CaptureAI is a Chrome extension that lets you capture questions from any webpage and get instant answers powered by OpenAI's GPT models. Perfect for students, researchers, and anyone who needs quick answers while browsing.

### Key Features

- **🖼️ Smart Screenshot Capture** - Select any area on your screen to capture questions
- **🤖 AI-Powered Answers** - Get instant, accurate responses using OpenAI's GPT-5-nano model
- **⚡ Quick Capture** - Repeat captures of the same area with one click
- **🎯 Auto-Solve Mode** - Automatically solve multiple-choice questions (Quizlet, Vocabulary.com)
- **💬 Ask Mode** - Ask custom questions with optional image attachments
- **👻 Stealth Mode** - Invisible operation when UI is hidden
- **🛡️ Privacy Guard** - Prevents websites from detecting focus loss or tab switches
- **⌨️ Keyboard Shortcuts** - Fast workflow with hotkeys
- **🔒 Privacy-First** - No data collection, everything stays local

---

## 🚀 Quick Start

### Installation

1. **Clone or download** this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked** and select the extension folder
5. Click the CaptureAI icon and enter your OpenAI API key

### Getting an OpenAI API Key

1. Visit [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API keys section
4. Create a new API key
5. Copy and paste it into CaptureAI popup

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

*Available on supported sites: Quizlet, Vocabulary.com*

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

## 🏗️ Architecture

### Core Components
```
CaptureAI/
├── manifest.json              # Extension configuration
├── background.js              # Service worker (API communication)
├── content.js                 # Main content script entry point
├── popup.html/js              # Extension popup interface
├── privacy-policy.html        # Privacy policy
│
├── modules/                   # Modular JavaScript components
│   ├── config.js             # Constants and state management
│   ├── storage.js            # Chrome storage utilities
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
│   └── privacy-guard.js      # Privacy protection coordinator
│
├── inject.js                  # MAIN world privacy protection script
│
└── icons/                     # Extension icons
    ├── icon16.png
    ├── icon48.png
    ├── icon128.png
    ├── camera.png
    ├── attach.png
    └── attached.png
```

### Data Flow
```
User Action → Content Script → Background Script → OpenAI API
                    ↓
            Image Processing
                    ↓
              UI Display ← API Response
```

### Key Technologies

- **Manifest V3** - Modern Chrome extension architecture
- **ES6 Modules** - Clean, modular code organization
- **OpenAI GPT-5-nano** - Advanced AI model for accurate answers
- **Canvas API** - Screenshot processing and optimization
- **Chrome Storage API** - Secure local data persistence

---

## 🎨 Features Deep Dive

### Image Processing

- **Smart compression** - Reduces token usage while maintaining quality
- **Multiple format support** - WebP and JPEG with quality optimization
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

**How it works:**
1. Injects into MAIN world (same context as page)
2. Overrides native browser APIs before page loads
3. Blocks privacy-sensitive event listeners
4. Monitors and removes AI detection elements

See [docs/PRIVACY_GUARD.md](docs/PRIVACY_GUARD.md) for technical details.

### Auto-Solve Intelligence

- Detects multiple-choice format (1-4 answers)
- Identifies invalid questions automatically
- Avoids red/incorrect answer choices
- Handles "Spell the word" prompts
- Stops after 2 consecutive invalid questions

### Privacy & Security

- ✅ **No data collection** - Zero telemetry or analytics
- ✅ **Local storage only** - API key stored securely in Chrome
- ✅ **Direct API calls** - No intermediary servers
- ✅ **HTTPS encryption** - All API communication encrypted
- ✅ **Minimal permissions** - Only requests necessary access

---

## 🔧 Configuration

### API Settings

Modify `background.js` to customize OpenAI parameters:
```javascript
const OPENAI_CONFIG = {
    MODEL: 'gpt-5-nano',           // AI model to use
    REASONING_EFFORT: 'low',        // Reasoning level
    VERBOSITY: 'low',               // Response verbosity
    MAX_TOKENS: {
        AUTO_SOLVE: 2500,
        ASK: 8000,
        DEFAULT: 5000
    }
};
```

### Prompt Customization

Customize prompts in `background.js`:
```javascript
const PROMPTS = {
    AUTO_SOLVE: 'Answer with only the number...',
    ANSWER: 'Reply with answer only...',
    ASK_SYSTEM: 'You are a helpful assistant...'
};
```

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

- Chrome/Chromium browser
- OpenAI API key
- Basic understanding of Chrome extensions

### Local Development

1. Make changes to source files
2. Go to `chrome://extensions/`
3. Click refresh icon on CaptureAI card
4. Test changes on target websites

### Adding New Supported Sites

Edit `modules/domains.js`:
```javascript
isOnSupportedSite() {
    return this.isOnVocabulary() || 
           this.isOnQuizlet() ||
           this.isOnYourNewSite();
},

isOnYourNewSite() {
    return window.location.hostname.includes('yoursite.com');
}
```

### Testing

Test on various scenarios:
- Different question formats
- Multiple-choice vs text questions
- Various zoom levels
- Different screen resolutions
- Supported educational sites

---

## 📊 Supported Websites

### Full Auto-Solve Support
- ✅ Quizlet.com - Flashcards and practice tests
- ✅ Vocabulary.com - Vocabulary practice

### Universal Capture Mode
Works on **all websites** for manual question capture and AI answers.

---

## 🐛 Troubleshooting

### Extension Not Working

1. Refresh the page after installing
2. Check if API key is set correctly
3. Verify you're on a valid webpage (not chrome://)
4. Check browser console for errors (F12)

### Capture Not Starting

- Ensure you're not on a restricted page
- Try refreshing the extension: `chrome://extensions/`
- Check if content script loaded: inspect page console

### API Errors

- Verify API key is valid
- Check API usage limits on OpenAI dashboard
- Ensure network connection is stable

### Auto-Solve Not Working

- Perform one manual capture first to set area
- Confirm you're on a supported site
- Check if toggle is enabled
- Verify question format is multiple-choice

---

## 📝 Privacy Policy

CaptureAI respects your privacy:

- **No data collection** - We don't collect any usage data
- **Local storage only** - API key stored in Chrome's secure storage
- **Direct API calls** - Screenshots sent directly to OpenAI, never to our servers
- **No tracking** - Zero analytics or telemetry
- **Open source** - All code is visible and auditable

See [privacy-policy.html](privacy-policy.html) for full details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Areas for Improvement

- Add more supported educational sites
- Implement OCR for better text extraction
- Add support for formula/equation recognition
- Create options page for advanced settings
- Add support for other AI providers

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👤 Author

**Grayson Kramer**

- Contact: wonhappyheart@gmail.com

---

## 🙏 Acknowledgments

- OpenAI for the GPT API
- Chrome Extensions team for excellent documentation
- All contributors and users

---

## 📈 Version History

### v1.0.0 (Current)
- Initial release
- Basic capture and AI answer functionality
- Auto-solve mode for supported sites
- Ask mode with image attachments
- Stealth mode for invisible operation
- Keyboard shortcuts

---

<div align="center">

**Made with ❤️ for students and learners everywhere**

[Report Bug](https://github.com/yourusername/captureai/issues) · [Request Feature](https://github.com/yourusername/captureai/issues)

</div>
