# Extension Architecture

> **Self-update rule:** When you add/change modules, storage keys, message actions, manifest permissions, Privacy Guard protections, or OCR pipeline behavior — update this file and the Quick Reference section of [CLAUDE.md](../CLAUDE.md) before committing.

Chrome Extension (Manifest V3) with modular ES6 architecture. Supported auto-solve site: **Vocabulary.com**.

- **`content.js`** (Isolated world): Loads 14 modules via `import()` and exposes each via `window.CaptureAI`.
- **`background.js`** (Service Worker): Loads `auth-service.js` and `migration.js` directly via `importScripts()` — these are not exposed via `window.CaptureAI`.
- **`ocr-service.js`**: Not loaded directly by `content.js`; it is a transitive ES module dependency of `image-processing.js`.

## Script Contexts

| Script | World | Purpose |
|--------|-------|---------|
| `background.js` | Service Worker | API communication, screenshot capture, message routing, Privacy Guard registration, context menu, periodic cache refresh |
| `content.js` | Isolated | Module loader, initialization, event coordination |
| `inject.js` | MAIN | Privacy Guard — runs before page scripts at `document_start` |
| `popup.js` | Extension | Popup UI, settings, license activation |

## Module Map

| Module | Load Context | Responsibility |
|--------|-------------|---------------|
| `config.js` | content.js (`import()`) → `window.CaptureAI` | CONFIG, TIMING, STORAGE_KEYS, PROMPT_TYPES, ICONS, STATE, DOM_CACHE constants |
| `storage.js` | content.js (`import()`) → `window.CaptureAI` | Chrome storage wrappers (setValue, getValue, getValues, removeValue, clear) |
| `auth-service.js` | background.js (`importScripts()`) | Backend API client (`api.captureai.dev`), license validation, user cache (5-min fresh, 1-hour max) |
| `ocr-service.js` | transitive dep of `image-processing.js` | Tesseract.js v7 OCR with 60% confidence threshold, 3x upscale preprocessing, site-specific cleanup. See OCR Pipeline section for full flow. |
| `domains.js` | content.js (`import()`) → `window.CaptureAI` | Site detection (vocabulary.com), strict CSP site detection, URL validation |
| `utils.js` | content.js (`import()`) → `window.CaptureAI` | Debounce, delay, visibility checks, ID generation, HTML sanitization |
| `image-processing.js` | content.js (`import()`) → `window.CaptureAI` | WebP/JPEG compression (default 0.3 quality, WebP effective 0.24), max 800x600, zoom-aware capture |
| `messaging.js` | content.js (`import()`) → `window.CaptureAI` | Chrome message listener/dispatcher for content script actions |
| `keyboard.js` | content.js (`import()`) → `window.CaptureAI` | Keyboard shortcuts (Escape two-stage: disable auto-solve, then hide UI) |
| `event-manager.js` | content.js (`import()`) → `window.CaptureAI` | Event listener tracking, global error handling, timer cleanup |
| `capture-system.js` | content.js (`import()`) → `window.CaptureAI` | Overlay creation, drag-to-select, quick capture from saved area |
| `auto-solve.js` | content.js (`import()`) → `window.CaptureAI` | Vocabulary.com auto-solve, 2500ms cycle delay, max 2 invalid questions |
| `ui-core.js` | content.js (`import()`) → `window.CaptureAI` | Main UI panel, theme management (auto/light/dark), Google Fonts loading |
| `ui-components.js` | content.js (`import()`) → `window.CaptureAI` | Floating panel buttons, Pro indicators, mode switching, ask mode UI |
| `ui-stealthy-result.js` | content.js (`import()`) → `window.CaptureAI` | Invisible answer overlay (bottom-right, rgba gray, 2s fadeout, pointer-events: none) |
| `privacy-guard.js` | content.js (`import()`) → `window.CaptureAI` | Content-side coordinator — checks Pro + settings, verifies inject.js active |
| `migration.js` | background.js (`importScripts()`) | One-time API key -> license key migration (v3) |

## Storage Keys

### Authentication
| Key | Type | Description |
|-----|------|-------------|
| `captureai-license-key` | string | Active license key |
| `captureai-user-email` | string | User email |
| `captureai-user-tier` | string | `basic` or `pro` |
| `captureai-user-cache` | object | `{user, updatedAt}` — cached user data with timestamp |
| `captureai-backend-url` | string | Backend URL (default: `https://api.captureai.dev`) |

### User Preferences
| Key | Type | Description |
|-----|------|-------------|
| `captureai-auto-solve-mode` | boolean | Auto-solve toggle state |
| `captureai-ask-mode` | boolean | Ask mode toggle state |
| `captureai-last-capture-area` | object | `{startX, startY, width, height}` |
| `captureai-reasoning-level` | number | 0 (low), 1 (medium/default), 2 (high/Pro) |
| `captureai-settings` | object | `{privacyGuard: {enabled, domainBlacklist}, ocr: {disabled}, theme}` |

### Internal State
| Key | Type | Description |
|-----|------|-------------|
| `captureai-last-usage` | object | `{data, updatedAt}` — cached AI response usage stats |
| `captureai-privacy-guard-defaulted` | boolean | Auto-enable flag on first Pro upgrade |
| `captureai-privacy-guard-notice-seen` | boolean | Track if PrivacyGuard banner seen |
| `captureai-usage-warning-shown-date` | string | Track daily limit warning (YYYY-MM-DD) |
| `captureai-usage-critical-shown-date` | string | Track daily limit critical warning (YYYY-MM-DD) |
| `captureai-migration-license-v3-complete` | boolean | Migration completion flag |
| `captureai-migration-notice` | string | Message shown in popup after migration |
| `captureai-api-key` | string | Legacy API key (deprecated, read as fallback during migration) |
| `captureai-web-session-ts` | string | ISO timestamp of last successful `/api/auth/me` validation |

## Privacy Guard System

**Protections** (all in `inject.js`, MAIN world, `document_start`):
1. **Visibility**: `document.visibilityState` -> 'visible', `document.hidden` -> false, `document.hasFocus()` -> true
2. **Events blocked**: visibilitychange, blur, focus, focusin, focusout, pagehide, pageshow, unload, beforeunload (via WeakMap tracking)
3. **Property handlers blocked**: window.onblur, window.onfocus, document.onvisibilitychange, window.onunload, window.onbeforeunload, window.onpagehide, window.onpageshow
4. **Clipboard**: Intercepts copy/cut/paste, enables user-select CSS, enables pointer-events
5. **AI Honeypots**: Removes hidden elements with keywords (ignore, disregard, ai, bot, llm, gpt, claude), watches via MutationObserver for dynamically added honeypots
6. **Canvas-specific**: Extra protections for Canvas/Instructure sites (detected via meta tag)
7. **Style overrides**: `getComputedStyle()` overridden for user-select and pointer-events properties

All property descriptors set with `configurable: false` to prevent page scripts from undoing overrides. Uses `Symbol.for()` as guard key to prevent double-injection.

**Activation**: Pro tier required + `settings.privacyGuard.enabled` + registered dynamically via `chrome.scripting.registerContentScripts`. Domain blacklist via `excludeMatches`.

## Message Flow

```
Popup -> chrome.runtime.sendMessage() -> Background (service worker)
Background -> chrome.tabs.sendMessage() -> Content Script
Content Script -> chrome.runtime.sendMessage() -> Background
Background -> chrome.runtime.sendMessage() -> Popup (fire-and-forget)
```

### Content script actions (messaging.js)

| Action | Purpose |
|--------|---------|
| `ping` | Keep-alive check |
| `getState` | Get current STATE object |
| `startCapture` | Begin capture mode |
| `quickCapture` | Repeat last capture |
| `togglePanel` | Show/hide floating UI |
| `setAutoSolve` | Enable/disable auto-solve mode |
| `setAskModeImage` | Attach captured image to ask mode |
| `processCapturedImage` | Crop/compress/OCR the screenshot |
| `showCapturingMessage` | Display "Capturing..." in UI |
| `showProcessingMessage` | Display "Processing..." in UI |
| `displayResponse` | Show AI response in UI + trigger auto-solve if applicable |
| `debugLogImage` | Log base64 image to console |
| `keyboardCommand` | Forward manifest keyboard shortcut command |

### Background script actions (background.js)

| Action | Purpose |
|--------|---------|
| `captureArea` | Capture screenshot, process image, send to AI |
| `askQuestion` | Process user question with optional image attachments |
| `enablePrivacyGuard` | Inject privacy protection script into MAIN world |
| `disablePrivacyGuard` | Acknowledge disable request (persists until page reload) |
| `getPrivacyGuardStatus` | Check if Privacy Guard is available |

### Popup action

| Action | Purpose |
|--------|---------|
| `updateResponse` | Background → Popup: relay AI response for display |

## Context Menu

"Ask CaptureAI" context menu item on text selection. Sends selected text directly to AI via `sendTextOnlyQuestion()`.

## Periodic Tasks

- `captureai-refresh-user-cache` alarm: Refreshes user cache every 30 minutes via `AuthService.refreshUserCache()`. Created on install and startup.

## OCR Pipeline

1. Screenshot captured via `chrome.tabs.captureVisibleTab()` (PNG)
2. Image sent to content script for cropping/compression
3. If OCR enabled: Tesseract.js v7 processes with 3x upscale + grayscale + box blur
4. If confidence >= 60%: Send text only (90% token savings)
5. If confidence < 60% OR image-selection question detected OR wrong-answer prompt: Send image
6. Site-specific OCR cleanup for vocabulary.com artifacts (removes QO/OO/QQ patterns)

## Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+X` | Capture new area |
| `Ctrl+Shift+F` | Recapture last area |
| `Ctrl+Shift+E` | Toggle panel |

## Manifest Permissions

`storage`, `activeTab`, `scripting`, `contextMenus`, `alarms` + `host_permissions: <all_urls>`

CSP: `script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; worker-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com;`
