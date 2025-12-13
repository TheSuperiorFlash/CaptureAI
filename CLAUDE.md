# CLAUDE.md

This file provides guidance for development of the CaptureAI Chrome extension.

## 🎯 Project Overview - CaptureAI

**CaptureAI** is a Chrome extension that captures screenshots of web page areas and uses OpenAI GPT-5 nano for AI-powered analysis.

### Core Features
- **Manual Capture**: Select screen area → AI analysis → Display answer
- **Quick Recapture**: Reuse last capture area for fast repeated captures
- **Ask Mode**: Ask questions with optional image attachments (text-only or image+text)
- **Auto-solve Mode**: Automatic question processing on educational sites (Vocabulary.com, Quizlet.com)
- **Keyboard Shortcuts**:
  - `Ctrl+Shift+X`: Start new capture
  - `Ctrl+Shift+F`: Quick recapture (use last area)
  - `Ctrl+Shift+E`: Toggle panel visibility
  - `Escape`: Cancel operations

### AI Analysis Workflow
1. User selects screen area with mouse
2. Extension captures visible tab screenshot
3. Image cropped to selection and compressed to WebP
4. Sent to OpenAI GPT-5 nano with appropriate prompt
5. Response displayed in stealthy overlay or panel

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)
Choose straightforward solutions. Simple code is easier to understand, maintain, and debug.

### YAGNI (You Aren't Gonna Need It)
Implement features only when needed, not when anticipated.

### Design Principles
- **Single Responsibility**: Each function/module has one clear purpose
- **Fail Fast**: Check for errors early and handle them immediately
- **Open/Closed**: Open for extension, closed for modification
- **Modular Architecture**: Split functionality into focused modules

## 🏗️ Architecture & File Structure

### Project Structure
```
CaptureAI/
├── manifest.json              # Manifest V3 configuration
├── background.js              # Service worker (screenshot, API, messaging)
├── content.js                 # Main entry point, module loader
├── popup.html                 # Extension popup UI
├── popup.js                   # Popup logic and state management
├── icons/                     # Extension icons (16, 48, 128px + UI icons)
└── modules/                   # Modular components
    ├── config.js              # Constants, storage keys, state
    ├── storage.js             # Chrome storage utilities
    ├── domains.js             # Domain detection, CSP checking
    ├── utils.js               # General utilities
    ├── image-processing.js    # Image crop, compress, canvas operations
    ├── messaging.js           # Chrome message passing handlers
    ├── keyboard.js            # Keyboard shortcuts
    ├── event-manager.js       # Global error handling
    ├── capture-system.js      # Screenshot selection logic
    ├── auto-solve.js          # Auto-solve mode for educational sites
    ├── ui-core.js             # Main UI panel
    ├── ui-components.js       # Reusable UI components
    └── ui-stealthy-result.js  # Stealthy answer overlay
```

### Core Files

#### background.js
Service worker that handles:
- Screenshot capture via `chrome.tabs.captureVisibleTab()`
- OpenAI API communication (GPT-5 nano)
- Message routing between popup and content script
- Image processing coordination
- Ask mode (text-only and image+text questions)

#### content.js
Main entry point that:
- Dynamically imports all modules from `/modules`
- Initializes global `window.CaptureAI` namespace
- Sets up event handlers and keyboard shortcuts
- Initializes auto-solve on supported sites
- Manages UI lifecycle

#### modules/config.js
Central configuration including:
- `CONFIG`: Debug flags, UI IDs, timing constants
- `STORAGE_KEYS`: Chrome storage key definitions
- `PROMPT_TYPES`: AI prompt type constants
- `ICONS`: UI icon URLs (initialized at runtime)
- `STATE`: Global application state object
- `DOM_CACHE`: Cached DOM element references

#### modules/storage.js
Promise-based Chrome storage wrapper:
- `setValue(key, value)`: Store data
- `getValue(key, defaultValue)`: Retrieve data
- `getValues(keys)`: Bulk retrieval
- `removeValue(key)`: Delete data
- `clear()`: Clear all storage

Uses `chrome.storage.local` for all data.

#### modules/domains.js
Domain detection utilities:
- `isOnSupportedSite()`: Check if auto-solve is available
- `isOnQuizlet()` / `isOnVocabulary()`: Site-specific checks
- `isOnStrictCSPSite()`: Detect CSP-restricted domains
- `isValidUrl(url)`: Validate extension-compatible URLs

### Storage Keys
```javascript
const STORAGE_KEYS = {
  API_KEY: 'captureai-api-key',                  // OpenAI API key
  AUTO_SOLVE_MODE: 'captureai-auto-solve-mode',  // Auto-solve toggle state
  LAST_CAPTURE_AREA: 'captureai-last-capture-area', // Quick recapture coordinates
  ASK_MODE: 'captureai-ask-mode'                 // Ask mode toggle state
};
```

### Prompt Types
```javascript
const PROMPT_TYPES = {
  ANSWER: 'answer',           // Standard answer extraction
  AUTO_SOLVE: 'auto_solve',   // Multiple choice (1-4) response
  ASK: 'ask'                  // User-provided question
};
```

## 🔧 Module System

### ES6 Module Pattern
All modules use ES6 `export` and are loaded dynamically:

```javascript
// Module definition (modules/example.js)
export const ExampleModule = {
  doSomething() {
    // Implementation
  }
};

// Dynamic import (content.js)
const module = await import(chrome.runtime.getURL('modules/example.js'));
window.CaptureAI.Example = module.ExampleModule;
```

### Global Namespace
All modules are accessible via `window.CaptureAI`:

```javascript
window.CaptureAI = {
  CONFIG, STORAGE_KEYS, PROMPT_TYPES, ICONS, STATE, DOM_CACHE,
  StorageUtils, DomainUtils, Utils, ImageProcessing,
  UIStealthyResult, UICore, UIComponents, CaptureSystem,
  AutoSolve, Messaging, Keyboard, EventManager
};
```

### Module Best Practices
- Export single object with methods (avoid default exports)
- Keep modules under 500 lines
- Functions under 50 lines with single responsibility
- Use JSDoc for all public functions
- Access shared state via `window.CaptureAI.STATE`
- Access config via `window.CaptureAI.CONFIG`

## 📋 Coding Standards

### JavaScript Style
- **Line length**: Max 100 characters
- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **JSDoc**: Document all public functions

### Naming Conventions
- **Variables/functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Event handlers**: `handleEventName`
- **Booleans**: `isCondition`, `hasProperty`, `canAction`
- **DOM elements**: Suffix with `Element` or context (e.g., `panelElement`, `captureBtn`)

### File Limits
- **Max 500 lines per file** - refactor by splitting into modules
- **Functions under 50 lines** - break into smaller functions
- **Line length max 100 characters**

## 🔌 Chrome Extension Patterns

### Message Passing
```javascript
// Background → Content
chrome.tabs.sendMessage(tabId, { action: 'displayResponse', response }, (response) => {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError.message);
  }
});

// Content → Background
chrome.runtime.sendMessage({
  action: 'captureArea',
  coordinates: { startX, startY, width, height }
}, (response) => {
  if (response?.success) {
    // Handle success
  }
});
```

### Storage Utilities
```javascript
// Store data
await window.CaptureAI.setValue('my-key', { data: 'value' });

// Retrieve data
const data = await window.CaptureAI.getValue('my-key', defaultValue);

// Multiple keys
const result = await window.CaptureAI.getValues(['key1', 'key2']);
```

### Required Permissions
```json
{
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": ["<all_urls>"]
}
```

## 🛡️ Security Best Practices

- **Never use `eval()` or `innerHTML` with untrusted content**
- **Validate all input** before processing
- **Use `textContent` instead of `innerHTML`** for user-generated content
- **Strict CSP** defined in manifest.json
- **Minimal permissions** - only request what's needed
- **API key stored in chrome.storage.local** (not synced)

```javascript
// Safe HTML insertion
element.textContent = userProvidedText; // ✅ Safe
element.innerHTML = userProvidedText;   // ❌ XSS risk

// URL validation
function isValidUrl(url) {
  return (url.startsWith('http://') || url.startsWith('https://')) &&
         !url.startsWith('chrome://') &&
         !url.startsWith('chrome-extension://');
}
```

## 🚀 Performance Patterns

### Debouncing
```javascript
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};
```

### DOM Caching
```javascript
// Cache frequently accessed elements in DOM_CACHE
window.CaptureAI.DOM_CACHE.panel = document.getElementById('captureai-panel');
```

### Event Listener Cleanup
```javascript
// Track listeners for cleanup
window.CaptureAI.STATE.eventListeners.push({ element, event, handler });

// Cleanup on destroy
STATE.eventListeners.forEach(({ element, event, handler }) => {
  element.removeEventListener(event, handler);
});
```

## 🧪 Testing & Debugging

### Development Workflow
No build process required:

1. Make changes to any `.js` file
2. Open `chrome://extensions`
3. Click reload on CaptureAI extension
4. Test functionality on a web page

### Debug Console Access
- **Background**: `chrome://extensions` → CaptureAI → "background page" (service worker)
- **Content**: F12 → Console on any webpage
- **Popup**: Right-click extension icon → "Inspect popup"

### Common Issues
- **CSP Restrictions**: Some sites block content scripts. Check `DomainUtils.isOnStrictCSPSite()`
- **Message Passing Errors**: Always check `chrome.runtime.lastError` in callbacks
- **Storage Issues**: Use DevTools → Application → Storage → Extension Storage
- **API Errors**: Check background console for OpenAI API response details

### Debug Utilities
Access via browser console:

```javascript
// Check storage
await chrome.storage.local.get(null);

// Check state
window.CaptureAI.STATE;

// Check config
window.CaptureAI.CONFIG;

// Check last capture area
await window.CaptureAI.getValue('captureai-last-capture-area');
```

## 📝 Documentation Standards

### JSDoc Format
```javascript
/**
 * Capture screenshot area and send to OpenAI for analysis
 * @param {Object} coordinates - Selection coordinates
 * @param {number} coordinates.startX - Top-left X position
 * @param {number} coordinates.startY - Top-left Y position
 * @param {number} coordinates.width - Selection width
 * @param {number} coordinates.height - Selection height
 * @param {string} promptType - Type of prompt (ANSWER, AUTO_SOLVE, ASK)
 * @returns {Promise<Object>} API response with analysis
 * @throws {Error} When capture or API request fails
 */
async function captureArea(coordinates, promptType) {
  // Implementation
}
```

## 🔄 Git Workflow

### Commit Format
```
<type>(<scope>): <subject>

Examples:
feat(auto-solve): add support for Quizlet.com
fix(capture): handle edge case when selection is off-screen
refactor(modules): split ui.js into separate components
docs: update CLAUDE.md with module architecture
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

## ⚠️ Critical Guidelines

### When Working on CaptureAI

1. **Read before editing**: Always read existing files before making changes
2. **Maintain module boundaries**: Don't mix concerns across modules
3. **Test on educational sites**: Verify auto-solve on Vocabulary.com and Quizlet.com
4. **Check CSP compatibility**: Test on Google Docs, Outlook, etc.
5. **Verify all prompt types**: Test ANSWER, AUTO_SOLVE, and ASK modes
6. **Storage key consistency**: Use constants from `STORAGE_KEYS`
7. **State management**: Access global state via `window.CaptureAI.STATE`
8. **Error handling**: All async operations must have try-catch blocks

### Never Do This

- ❌ Use `eval()` or `innerHTML` with untrusted content
- ❌ Hardcode storage keys (use `STORAGE_KEYS` constants)
- ❌ Access Chrome APIs before checking availability
- ❌ Ignore `chrome.runtime.lastError` in callbacks
- ❌ Create files over 500 lines without refactoring
- ❌ Skip JSDoc on public functions
- ❌ Assume the user wants TypeScript (project uses vanilla JS)

### Always Do This

- ✅ Use modular architecture - split large files into focused modules
- ✅ Document with JSDoc for all public functions
- ✅ Handle errors with try-catch blocks
- ✅ Check `chrome.runtime.lastError` in all Chrome API callbacks
- ✅ Use `textContent` for user-generated text
- ✅ Cache frequently accessed DOM elements in `DOM_CACHE`
- ✅ Test keyboard shortcuts after UI changes
- ✅ Validate URLs before operations

## 🏪 Chrome Web Store

### Pre-submission Checklist
- [ ] Test manual capture on multiple websites
- [ ] Test auto-solve on Vocabulary.com and Quizlet.com
- [ ] Test Ask mode (text-only and with images)
- [ ] Verify all keyboard shortcuts work
- [ ] Test quick recapture functionality
- [ ] Check for console errors in all contexts
- [ ] Validate API key handling (save, reset, validation)
- [ ] Test on CSP-restricted sites (should gracefully handle)
- [ ] Verify icons display correctly (16, 48, 128px)
- [ ] All permissions justified in manifest

### Package for Store
```bash
# Ensure clean state
git status  # No uncommitted changes

# Test locally first
# Open chrome://extensions → Load unpacked → Test all features

# Create distribution package
zip -r captureai-extension.zip . \
  -x "*.git*" \
  -x "*.DS_Store" \
  -x "node_modules/*" \
  -x "tests/*" \
  -x ".claude/*"
```

---

*Last updated: December 2024*
*Keep this guide synchronized with actual codebase structure*
