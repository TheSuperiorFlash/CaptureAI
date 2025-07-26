# CaptureAI - AI-Powered Question Solver

CaptureAI is a powerful browser extension that helps you quickly find answers to questions using AI. Whether you're studying, researching, or just curious, CaptureAI makes it easy to get accurate answers by simply capturing questions from any webpage.

## 🌟 Features

### 📸 Smart Capture
- Capture questions from any website with a simple selection
- Supports both text and image-based questions (Pro Mode only)
- Remembers your last capture area for quick access

### 🤖 AI-Powered Answers
- Utilizes advanced AI to provide accurate answers
- Two processing modes:
  - **Standard Mode**: Text-based question processing only
  - **Pro Mode**: Processes both text and image-based questions with faster performance (uses more tokens)

### ⚡ Quick Actions
- Keyboard shortcuts for seamless operation
- Auto-solve mode for multiple-choice questions
- Persistent settings across sessions

### 🎨 User Interface
- Clean, intuitive popup interface
- Draggable overlay
- Real-time processing feedback

## 🛠 Installation

### Prerequisites
- Google Chrome or Chromium-based browser
- An OpenAI API key (get yours at [OpenAI API Keys](https://platform.openai.com/account/api-keys))

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

## 🌐 Browser Compatibility

### ✅ Supported Browsers
- **Google Chrome** (recommended)
- **Microsoft Edge** (Chromium-based)
- **Brave**
- **Opera**
- **Vivaldi**
- Other Chromium-based browsers

### ❌ Not Currently Supported
- Mozilla Firefox
- Safari
- Internet Explorer
- Non-Chromium browsers

### Technical Note
This extension uses Chrome's `tabs.captureVisibleTab` API for screen capture functionality, which is specific to Chromium-based browsers. While the extension may load in other browsers, the screen capture feature will not work as expected.

## 🎯 How to Use

### Basic Usage
1. **Capture a Question**
   - Click the CaptureAI icon or press `Ctrl+Shift+X`
   - Select the area containing your question
   - The answer will appear in the overlay

2. **Quick Capture**
   - After your first capture, use `Ctrl+Shift+F` to quickly capture the same area again

3. **Toggle Panel**
   - Press `Ctrl+Shift+E` to show/hide the CaptureAI panel

### Advanced Features

#### Pro Mode
- Toggle Pro Mode in the settings to process image-based questions
- The only mode that can analyze and answer questions from images
- Also provides faster processing than Standard Mode
- Uses more API tokens but enables image processing capabilities

#### Auto-Solve Mode
- Enable Auto-Solve in the panel to automatically answer multiple-choice questions
- The extension will automatically detect and select the correct answer
- Press `Escape` to cancel auto-solve mode

## ⚙️ Settings

### API Configuration
- **OpenAI API Key**: Required for the extension to function

### Display Options
- **Pro Mode Toggle**: Switch between Standard and Pro modes

## 🚀 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+X` | Capture a new question |
| `Ctrl+Shift+F` | Quick capture (uses last area) |
| `Ctrl+Shift+E` | Toggle panel visibility |
| `Escape` | Cancel auto-solve mode |

## 🔧 Troubleshooting

### Common Issues

#### API Key Not Working
- Ensure your API key is entered correctly
- Check that your OpenAI account has available credits

#### Capture Not Working
- Try refreshing the page
- Ensure the website allows content scripts to run
- Check the browser console for errors (right-click → Inspect → Console)

---

✨ **Happy Learning with CaptureAI!** ✨
