# CaptureAI - AI-Powered Question Solver

CaptureAI is a powerful browser extension that helps you quickly find answers to questions using AI. Whether you're studying, researching, or just curious, CaptureAI makes it easy to get accurate answers by simply capturing questions from any webpage.

## 🌟 Features

### 🎯 Core Functionality
- **Area Screenshot Capture** - Select any area on a webpage to capture
- **AI-Powered Analysis** - Uses OpenAI GPT models to analyze and answer questions)

### 🚀 Smart Modes
- **Manual Capture** - Click and drag to select specific areas
- **Quick Capture** - Instantly recapture your last selected area
- **Ask Mode** - Type custom questions inside the webpage
- **Auto-Solve** - Automatically processes questions on supported educational sites

### ⚡ Convenience Features
- **Floating UI Panel** - Movable interface that stays on top
- **Keyboard Shortcuts** - Fast access without clicking
- **Stealthy Results** - Discrete result display when UI is hidden
- 
## 🛠 Installation

### Prerequisites
- Google Chrome or Chromium-based browser
- OpenAI API key (get yours at [OpenAI API Keys](https://platform.openai.com/account/api-keys))

### Installation Steps

1. **Download the Extension**
   - Download the latest release from our [GitHub releases page](https://github.com/yourusername/CaptureAI/releases)
   - Extract the ZIP file to a folder on your computer

2. **Load the Extension in Developer Mode**
   - Open your browser and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top-right corner)
   - Click "Load unpacked" and select the folder where you extracted the extension

3. **Configure Your API Key**
   - Click the CaptureAI extension icon in your toolbar
   - Enter your OpenAI API key in the provided field
   - Click "Save"

4. **You're Ready to Go!**
   - The extension is now ready to use
   - Use the keyboard shortcuts or click the extension icon to get started

### Technical Note
This extension uses Chrome's `tabs.captureVisibleTab` API for screen capture functionality, which is specific to Chromium-based browsers. While the extension may load in other browsers, the screen capture feature will not work as expected.

## 🎯 How to Use

## How to Use

### Basic Capture
1. **Start Capture**: Press `Ctrl+Shift+X` or click "Capture A Question"
2. **Select Area**: Click and drag to select the area you want to analyze
3. **Get Answer**: Wait for AI analysis and view the result

### Keyboard Shortcuts
- `Ctrl+Shift+E` - Toggle UI panel visibility
- `Ctrl+Shift+X` - Start area capture
- `Ctrl+Shift+F` - Quick capture (repeat last area)
- `Escape` - Cancel auto-solve

### UI Modes
- **Capture Mode** - Screenshot and analyze images
- **Ask Mode** - Type custom questions about captured content
- **Auto-Solve** - Automatically answer questions on supported sites

### Pro Tips
- Use **Quick Capture** for repeated captures of the same area
- Enable **Auto-Solve** on educational sites for automatic answers
- Use the **floating panel** to keep results visible while browsing

## Troubleshooting

### Common Issues

#### Extension Not Working
- **Refresh the page** after installation
- **Check API key** is correctly entered in popup
- **Verify permissions** are granted in chrome://extensions

#### Capture Not Starting
- **Page restrictions**: Cannot capture on chrome:// or extension pages
- **Try keyboard shortcut**: Press `Ctrl+Shift+X` instead of clicking
- **Reload extension**: Disable and re-enable in chrome://extensions

#### AI Analysis Fails
- **Check API key**: Must be valid OpenAI API key with credits
- **Network issues**: Verify internet connection
- **Rate limits**: Wait a moment if you've made many requests

#### Auto-Solve Not Working
- **Supported sites only**: Works on Vocabulary.com and Quizlet.com
- **Enable auto-solve**: Toggle must be ON in floating UI
- **Page must be loaded**: Wait for page to fully load before expecting auto-solve

### Getting Help
- **Check console**: Press F12 and look for error messages
- **Reset settings**: Clear extension data in chrome://extensions
- **Reload page**: Refresh the webpage and try again

### Known Limitations
- Cannot capture on browser internal pages (chrome://, about:, etc.)
- Some sites with strict CSP may limit functionality
- Auto-solve only works on specifically supported educational platforms

### ✨ **Happy Learning with CaptureAI!** ✨

---

**Version**: 2.4.0  
**Author**: Grayson Kramer  
**License**: MIT

For support or feature requests, please check the extension's GitHub repository.
