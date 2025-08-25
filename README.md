# CaptureAI

AI-powered screenshot capture and question analysis Chrome extension that helps you get instant answers from any web page content.

## Features

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

## Installation

### Prerequisites
- Google Chrome
- OpenAI API key (get one at [platform.openai.com](https://platform.openai.com))

### Install Extension
1. **Download** the CaptureAI extension files to your computer
2. **Open your browser** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top-right corner
4. **Click "Load unpacked"** and select the CaptureAI folder
5. **Pin the extension** by clicking the puzzle piece icon and pinning CaptureAI

### Configure API Key
1. **Click the CaptureAI extension icon** in your browser toolbar
2. **Enter your OpenAI API key** in the input field
3. **Click "Save API Key"** - the extension will automatically validate it
4. **Start capturing** once you see "API key saved successfully!"

### Verify Installation
- Extension icon appears in toolbar
- Keyboard shortcuts work (`Ctrl+Shift+X` to test capture)
- No error messages in the popup

## How to Use

### Basic Capture
1. **Start Capture**: Press `Ctrl+Shift+X` or click "Capture A Question"
2. **Select Area**: Click and drag to select the area you want to analyze
3. **Get Answer**: Wait for AI analysis and view the result

### Keyboard Shortcuts
- `Ctrl+Shift+E` - Toggle UI panel visibility
- `Ctrl+Shift+X` - Start area capture
- `Ctrl+Shift+F` - Quick capture (repeat last area)

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

---

**Version**: 2.4.0  
**Author**: Grayson Kramer  
**License**: MIT

For support or feature requests, please check the extension's GitHub repository.