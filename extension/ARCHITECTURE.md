# Extension Architecture

Chrome Extension (Manifest V3) with modular ES6 architecture. All modules loaded dynamically in `content.js` and accessible via `window.CaptureAI`.

## Script Contexts

| Script | World | Purpose |
|--------|-------|---------|
| `background.js` | Service Worker | API communication, screenshot capture, message routing, Privacy Guard registration |
| `content.js` | Isolated | Module loader, initialization, event coordination |
| `inject.js` | MAIN | Privacy Guard — runs before page scripts at `document_start` |
| `popup.js` | Extension | Popup UI, settings, license activation |

## Module Map

| Module | Responsibility |
|--------|---------------|
| `config.js` | CONFIG, TIMING, STORAGE_KEYS, STATE, DOM_CACHE constants |
| `storage.js` | Chrome storage wrappers (setValue, getValue, removeValue, clear) |
| `auth-service.js` | Backend API client (`api.captureai.workers.dev`), license validation, user cache (5-min fresh, 1-hour max) |
| `ocr-service.js` | Tesseract.js v5 OCR with 60% confidence threshold, 3x upscale preprocessing, site-specific cleanup |
| `domains.js` | Site detection (vocabulary.com), strict CSP site detection, URL validation |
| `utils.js` | Debounce, delay, visibility checks, ID generation, HTML sanitization |
| `image-processing.js` | WebP/JPEG compression (0.3 quality), max 800x600, zoom-aware capture |
| `messaging.js` | Chrome message listener/dispatcher for content script actions |
| `keyboard.js` | Keyboard shortcuts (Escape two-stage: disable auto-solve, then hide UI) |
| `event-manager.js` | Event listener tracking, global error handling, timer cleanup |
| `capture-system.js` | Overlay creation, drag-to-select, quick capture from saved area |
| `auto-solve.js` | Vocabulary.com auto-solve, 2500ms cycle delay, max 2 invalid questions |
| `ui-core.js` | Main UI panel, theme management (auto/light/dark), Google Fonts |
| `ui-components.js` | Floating panel buttons, Pro indicators, mode switching |
| `ui-stealthy-result.js` | Invisible answer overlay (bottom-right, rgba gray, 2s fadeout, pointer-events: none) |
| `privacy-guard.js` | Content-side coordinator — checks Pro + settings, verifies inject.js active |
| `migration.js` | One-time API key -> license key migration (v3) |

## Storage Keys

### Authentication
| Key | Type | Description |
|-----|------|-------------|
| `captureai-license-key` | string | Active license key |
| `captureai-user-email` | string | User email |
| `captureai-user-tier` | string | `free` or `pro` |
| `captureai-user-cache` | object | Cached user data with timestamp |
| `captureai-backend-url` | string | Backend URL (default: `api.captureai.workers.dev`) |

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
| `captureai-last-usage` | object | Cached AI response usage stats with timestamp |
| `captureai-privacy-guard-defaulted` | boolean | Auto-enable flag on first Pro upgrade |
| `captureai-migration-license-v3-complete` | boolean | Migration completion flag |

## Privacy Guard System

**Protections** (all in `inject.js`, MAIN world, `document_start`):
1. **Visibility**: `document.visibilityState` -> 'visible', `document.hidden` -> false, `document.hasFocus()` -> true
2. **Events blocked**: visibilitychange, blur, focus, focusin, focusout, pagehide, pageshow (via WeakMap tracking)
3. **Property handlers blocked**: window.onblur, window.onfocus, document.onvisibilitychange
4. **Clipboard**: Intercepts copy/cut/paste, enables user-select CSS, enables pointer-events
5. **AI Honeypots**: Removes hidden elements with keywords (ignore, disregard, ai, bot, llm, gpt, claude), watches via MutationObserver

**Activation**: Pro tier required + `settings.privacyGuard.enabled` + registered dynamically via `chrome.scripting.registerContentScripts`

## Message Flow

```
Popup -> chrome.runtime.sendMessage() -> Background (service worker)
Background -> chrome.tabs.sendMessage() -> Content Script
Content Script -> chrome.runtime.sendMessage() -> Background
```

**Content script actions:** ping, getState, startCapture, quickCapture, togglePanel, setAutoSolve, setAskModeImage, processCapturedImage, displayAnswer

## OCR Pipeline

1. Screenshot captured via `chrome.tabs.captureVisibleTab()` (PNG)
2. Image sent to content script for cropping/compression
3. If OCR enabled: Tesseract.js v5 processes with 3x upscale + grayscale + contrast stretch
4. If confidence >= 60%: Send text only (90% token savings)
5. If confidence < 60% OR image-selection question detected OR wrong-answer prompt: Send image
6. Site-specific OCR cleanup for vocabulary.com artifacts

## Manifest Permissions

`storage`, `activeTab`, `scripting`, `contextMenus`, `alarms` + `host_permissions: <all_urls>`

CSP: `wasm-unsafe-eval` required for Tesseract.js
