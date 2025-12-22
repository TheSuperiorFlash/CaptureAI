# CLAUDE.md

Development guide for CaptureAI Chrome extension.

## Project Overview

Full-stack Chrome extension with Cloudflare Workers backend for AI-powered screenshot analysis.

### System Architecture
- **Frontend**: Chrome Extension (Manifest V3)
- **Backend**: Cloudflare Workers (serverless)
- **Database**: D1 (distributed SQLite at edge)
- **AI**: OpenAI GPT-5 Nano via Cloudflare AI Gateway
- **Payments**: Stripe with webhook integration
- **Email**: Resend API for transactional emails
- **OCR**: Tesseract.js for text extraction

### Core Features
- **Manual Capture**: Select screen area → OCR/AI analysis → Display answer
- **Quick Recapture**: Reuse last capture area
- **Ask Mode**: Questions with optional image attachments (Pro tier)
- **Auto-solve Mode**: Automatic question processing (Pro tier only)
- **OCR Processing**: Extract text from images to reduce token costs by 90%
- **License Key System**: Secure authentication with Free/Pro tiers
- **Keyboard Shortcuts**:
  - `Ctrl+Shift+X`: Start new capture
  - `Ctrl+Shift+F`: Quick recapture
  - `Ctrl+Shift+E`: Toggle panel visibility
  - `Escape`: Cancel operations

### Tier System
**Free Tier:**
- 10 requests/day
- Basic capture and Ask mode (text-only)
- OCR processing

**Pro Tier ($9.99/month):**
- 60 requests/minute (unlimited daily)
- Auto-solve mode on supported sites
- Image attachments in Ask mode
- Multiple AI reasoning levels
- Priority support

### AI Analysis Workflow
1. User selects screen area
2. Capture visible tab screenshot
3. Crop and compress to WebP
4. **OCR Processing**: Extract text with Tesseract.js
   - If confidence >60%: send text only (90% token savings)
   - If confidence <60%: send image
5. Send to Cloudflare Workers backend with license key
6. Backend validates key, checks tier limits
7. Backend forwards to OpenAI via AI Gateway (with caching)
8. Response sent back to extension
9. Display in overlay/panel with usage stats

## Development Philosophy

- **KISS**: Simple, straightforward solutions
- **YAGNI**: Implement only when needed
- **Single Responsibility**: One purpose per function/module
- **Fail Fast**: Early error checking and handling
- **Modular Architecture**: Split into focused modules

## Architecture & File Structure

### Project Structure
```
CaptureAI/
├── manifest.json              # Manifest V3 configuration
├── background.js              # Service worker (orchestrates backend calls)
├── content.js                 # Main entry point, module loader
├── popup.html                 # Extension popup UI
├── popup.js                   # License key activation, tier status
├── icons/                     # Extension icons
├── libs/tesseract/            # Tesseract.js OCR library
│   ├── tesseract.min.js
│   ├── worker.min.js
│   └── lang-data/eng.traineddata.gz
├── modules/                   # Extension modules
│   ├── config.js              # Constants, storage keys, state
│   ├── storage.js             # Chrome storage utilities
│   ├── auth-service.js        # Backend API client, license validation
│   ├── ocr-service.js         # OCR text extraction with Tesseract.js
│   ├── migration.js           # Migrate from old API key system
│   ├── migration-license.js   # License key migration logic
│   ├── domains.js             # Domain detection, CSP checking
│   ├── utils.js               # General utilities
│   ├── image-processing.js    # Image crop, compress, OCR integration
│   ├── messaging.js           # Chrome message passing handlers
│   ├── keyboard.js            # Keyboard shortcuts
│   ├── event-manager.js       # Global error handling
│   ├── capture-system.js      # Screenshot selection logic
│   ├── auto-solve.js          # Auto-solve mode (Pro tier only)
│   ├── ui-core.js             # Main UI panel with tier logic
│   ├── ui-components.js       # Reusable UI components, Pro indicators
│   └── ui-stealthy-result.js  # Stealthy answer overlay
└── backend/                   # Cloudflare Workers backend
    ├── wrangler.toml          # Cloudflare Workers configuration
    ├── package.json           # Backend dependencies
    ├── schema.sql             # D1 database schema
    ├── migrations/            # Database migrations
    └── src/
        ├── index.js           # Main Worker entry, CORS handling
        ├── router.js          # Request routing system
        ├── auth.js            # License key authentication
        ├── subscription.js    # Stripe payment & webhook handling
        ├── ai.js              # AI Gateway integration, usage tracking
        ├── validation.js      # Input validation, security
        ├── logger.js          # Structured logging
        └── utils.js           # Helper utilities
```

### Core Files - Extension

#### background.js
Service worker orchestrating backend communication:
- Screenshot capture via `chrome.tabs.captureVisibleTab()`
- Routes requests to Cloudflare Workers backend
- Message routing between popup and content script
- License key validation
- Handles backend API responses

#### content.js
Main entry point:
- Dynamically imports all modules from `/modules`
- Initializes global `window.CaptureAI` namespace
- Sets up event handlers and keyboard shortcuts
- Initializes auto-solve on supported sites (Pro tier)
- Manages UI lifecycle and tier state

#### modules/auth-service.js
Backend API client:
- `validateKey(licenseKey)`: Validate license key with backend
- `getCurrentUser()`: Get user info and tier
- `sendAIRequest(payload)`: Send AI completion requests
- `createCheckoutSession(email)`: Initiate Stripe payment
- `requestFreeKey(email)`: Request free license key
- `getAnalytics()`: Fetch usage analytics

#### modules/ocr-service.js
OCR text extraction:
- `processImageWithOCR(imageDataUrl)`: Extract text from image
- `shouldUseOCR(confidence)`: Determine if OCR is reliable (>60%)
- `preprocessImage(canvas)`: Optimize image for OCR
- Text cleaning and confidence scoring
- Fallback to image if OCR confidence low

#### modules/config.js
Central configuration:
- `CONFIG`: Debug flags, UI IDs, timing, backend URL
- `STORAGE_KEYS`: Chrome storage key definitions
- `PROMPT_TYPES`: AI prompt type constants
- `ICONS`: UI icon URLs
- `STATE`: Global state including `userTier`
- `DOM_CACHE`: Cached DOM elements

#### modules/storage.js
Chrome storage wrapper (same as before):
- `setValue(key, value)`, `getValue(key, defaultValue)`
- `getValues(keys)`, `removeValue(key)`, `clear()`
- All data in `chrome.storage.local`

#### modules/domains.js
Domain detection:
- `isOnSupportedSite()`: Check auto-solve availability
- `isOnQuizlet()`, `isOnVocabulary()`: Site checks
- `isOnStrictCSPSite()`: CSP detection
- `isValidUrl(url)`: URL validation

### Core Files - Backend

#### backend/src/index.js
Main Cloudflare Worker:
- CORS handling for allowed origins
- Request routing to handler functions
- Error handling and logging
- Health check endpoint

#### backend/src/router.js
Request routing system:
- Route matching and parameter extraction
- Handler function mapping
- 404 handling

#### backend/src/auth.js
Authentication and authorization:
- License key validation against D1 database
- Tier verification (Free/Pro)
- User lookup and creation
- Rate limiting enforcement (tier-based)
- License key generation (format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX)

#### backend/src/subscription.js
Stripe integration:
- `createCheckoutSession()`: Create Stripe payment session
- `handleWebhook()`: Process Stripe webhook events
  - `checkout.session.completed`: New subscription
  - `invoice.payment_succeeded`: Renewals
  - `customer.subscription.deleted`: Cancellations
- Webhook signature verification (HMAC SHA256)
- License key generation and email delivery

#### backend/src/ai.js
AI Gateway integration:
- OpenAI API proxy via Cloudflare AI Gateway
- Model selection (gpt-4.1-nano, gpt-5-nano)
- Reasoning level configuration (none/low/medium)
- Usage tracking (tokens, costs, response time)
- Caching via AI Gateway
- Analytics aggregation

#### backend/src/validation.js
Input validation and security:
- Email format validation (RFC 5322)
- License key format validation
- Request body size limits (1MB max)
- SQL injection prevention
- XSS protection

#### backend/src/logger.js
Structured logging:
- Log levels: DEBUG, INFO, WARN, ERROR, SECURITY
- Request tracking with unique IDs
- Authentication event logging
- Webhook event logging

### Storage Keys
```javascript
const STORAGE_KEYS = {
  LICENSE_KEY: 'captureai-license-key',          // License key for authentication
  USER_TIER: 'captureai-user-tier',              // User tier (free/pro)
  USER_EMAIL: 'captureai-user-email',            // User email address
  API_KEY: 'captureai-api-key',                  // Deprecated: old API key system
  AUTO_SOLVE_MODE: 'captureai-auto-solve-mode',  // Auto-solve toggle (Pro only)
  LAST_CAPTURE_AREA: 'captureai-last-capture-area', // Quick recapture coords
  ASK_MODE: 'captureai-ask-mode',                // Ask mode toggle
  BACKEND_URL: 'captureai-backend-url'           // Backend URL (dev override)
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

### AI Models & Reasoning Levels

**Available Models:**
```javascript
const MODELS = {
  'gpt-4.1-nano': {
    reasoningLevel: 'none',
    pricing: { input: 0.10, output: 0.40, cached: 0.025 }
  },
  'gpt-5-nano-low': {
    model: 'gpt-5-nano',
    reasoningLevel: 'low',  // Default
    pricing: { input: 0.05, output: 0.40, cached: 0.005 }
  },
  'gpt-5-nano-medium': {
    model: 'gpt-5-nano',
    reasoningLevel: 'medium',
    pricing: { input: 0.05, output: 0.40, cached: 0.005, reasoning: 0.05 }
  }
};
```

**Reasoning Levels:**
- **none** (gpt-4.1-nano): Fastest, cheapest, no reasoning
- **low** (gpt-5-nano): Default, good balance of speed and quality
- **medium** (gpt-5-nano): Best quality, slower, includes reasoning tokens

**Selection Logic:**
- Free tier: Uses `gpt-5-nano` with low reasoning
- Pro tier: Can select reasoning level (low is default)

## Module System

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
  AuthService, OCRService, Migration,
  UIStealthyResult, UICore, UIComponents, CaptureSystem,
  AutoSolve, Messaging, Keyboard, EventManager
};
```

### Module Best Practices
- Export single object with methods (no default exports)
- Modules: max 500 lines
- Functions: max 50 lines, single responsibility
- JSDoc all public functions
- Access state via `window.CaptureAI.STATE`
- Access config via `window.CaptureAI.CONFIG`

## Backend Architecture

### Cloudflare Workers Overview

**Why Cloudflare Workers:**
- Serverless, edge computing (low latency globally)
- D1 database included (distributed SQLite)
- AI Gateway for caching and analytics
- Built-in DDoS protection and security
- Zero server management

### Database Schema (D1)

**Location:** `backend/schema.sql`

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  license_key TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Usage tracking
CREATE TABLE usage_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT NOT NULL,
  prompt_type TEXT NOT NULL,
  model TEXT NOT NULL,
  reasoning_level TEXT,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  reasoning_tokens INTEGER DEFAULT 0,
  cached_tokens INTEGER DEFAULT 0,
  total_cost REAL NOT NULL,
  response_time INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (license_key) REFERENCES users(license_key)
);

-- Webhook deduplication
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

**Base URL:** `https://captureai-backend.thesuperiorflash.workers.dev`

**Authentication Routes:**
```
POST /api/auth/create-free-key
  Body: { email: string }
  Response: { success: true, licenseKey: string }

POST /api/auth/validate-key
  Headers: { Authorization: "LicenseKey XXXXX-XXXXX-..." }
  Response: { valid: true, tier: "free"|"pro", email: string }

GET /api/auth/me
  Headers: { Authorization: "LicenseKey XXXXX-XXXXX-..." }
  Response: { email, tier, usage: {...} }
```

**AI Routes:**
```
POST /api/ai/complete
  Headers: { Authorization: "LicenseKey XXXXX-XXXXX-..." }
  Body: {
    messages: Array<{role: string, content: string|object}>,
    reasoningLevel: "none"|"low"|"medium",
    promptType: "answer"|"ask"|"auto_solve"
  }
  Response: {
    success: true,
    response: string,
    usage: {
      inputTokens, outputTokens, reasoningTokens,
      cachedTokens, totalCost, responseTime
    }
  }

GET /api/ai/analytics
  Headers: { Authorization: "LicenseKey XXXXX-XXXXX-..." }
  Response: {
    overall: { totalRequests, totalCost, totalTokens },
    byPromptType: {...},
    byModel: {...},
    dailyUsage: Array<{date, requests, cost}>
  }
```

**Subscription Routes:**
```
POST /api/subscription/create-checkout
  Body: { email: string }
  Response: { success: true, url: string }

POST /api/subscription/webhook
  Headers: { stripe-signature: string }
  Body: Stripe webhook payload
  Response: { received: true }

GET /api/subscription/portal
  Headers: { Authorization: "LicenseKey XXXXX-XXXXX-..." }
  Response: { url: string }
```

### Rate Limiting

**Free Tier:**
- 10 requests per day
- Tracked in D1 database
- Resets at midnight UTC

**Pro Tier:**
- 60 requests per minute
- Sliding window implementation
- No daily limit

**Implementation:** `backend/src/auth.js` checks usage before allowing requests

### AI Gateway Integration

**Benefits:**
- **Caching**: Identical requests return cached responses (free)
- **Analytics**: Token usage, costs, latency tracking
- **Fallback**: Automatic failover if OpenAI is down
- **Universal API**: Works with OpenAI, Anthropic, etc.

**Configuration:**
```javascript
const GATEWAY_URL = `https://gateway.ai.cloudflare.com/v1/${ACCOUNT_ID}/${GATEWAY_NAME}/openai`;
```

### Cost Tracking

**Pricing (per 1M tokens):**
```javascript
const PRICING = {
  'gpt-4.1-nano': {
    input: 0.10,
    output: 0.40,
    cached: 0.025
  },
  'gpt-5-nano': {
    input: 0.05,
    output: 0.40,
    cached: 0.005,
    reasoning: 0.05  // Medium reasoning level
  }
};
```

**Cost Calculation:**
```javascript
const cost = (
  (inputTokens * pricing.input / 1_000_000) +
  (outputTokens * pricing.output / 1_000_000) +
  (cachedTokens * pricing.cached / 1_000_000) +
  (reasoningTokens * pricing.reasoning / 1_000_000)
);
```

All costs stored in `usage_records` table for analytics.

## OCR Integration

### Why OCR?

**Problem:** Sending images to AI is expensive
- Images: 1000-2000 tokens each
- Text: 50-200 tokens

**Solution:** Extract text with Tesseract.js before sending
- **Token savings:** 90% reduction
- **Cost savings:** Proportional to token reduction
- **Speed:** Faster processing with less data

### Implementation

**Library:** Tesseract.js v5.1.0
**Location:** `modules/ocr-service.js`

**Workflow:**
```javascript
// 1. Capture screenshot (image data URL)
const imageDataUrl = await captureScreenshot();

// 2. Process with OCR
const ocrResult = await OCRService.processImageWithOCR(imageDataUrl);

// 3. Check confidence
if (ocrResult.confidence > 60) {
  // Use extracted text (90% token savings)
  sendToAI({ text: ocrResult.text });
} else {
  // Fallback to image (low confidence)
  sendToAI({ image: imageDataUrl });
}
```

**OCR Configuration:**
```javascript
{
  lang: 'eng',
  tessedit_pageseg_mode: Tesseract.PSM.AUTO,
  tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?-'
}
```

**Text Cleaning:**
- Remove OCR artifacts (|||, ===)
- Normalize whitespace
- Remove excessive newlines
- Trim leading/trailing spaces

### When OCR is Used

**Enabled for:**
- Manual capture (always)
- Ask mode with image attachment (optional)
- Quick recapture (always)

**Not used for:**
- Text-only Ask mode (no image)
- Auto-solve mode (uses OCR but different flow)

## License Key System

### Authentication Flow

**Old System (deprecated):**
```
User stores OpenAI API key → Extension calls OpenAI directly
```

**New System (current):**
```
User gets license key → Extension calls backend → Backend validates → Backend calls OpenAI
```

### License Key Format

**Pattern:** `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX`
- 25 characters (5 groups of 5)
- Character set: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no I, O, 0, 1 to avoid confusion)
- Example: `A3B7K-9QWER-TYUSD-FGHJK-L2345`

### Key Generation

**Location:** `backend/src/auth.js`

```javascript
function generateLicenseKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [];
  for (let i = 0; i < 5; i++) {
    let segment = '';
    for (let j = 0; j < 5; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  return segments.join('-');
}
```

### Validation

**Client-side (format only):**
```javascript
const isValid = /^[A-Z2-9]{5}-[A-Z2-9]{5}-[A-Z2-9]{5}-[A-Z2-9]{5}-[A-Z2-9]{5}$/.test(key);
```

**Server-side (database lookup):**
```javascript
const user = await db.prepare(
  'SELECT * FROM users WHERE license_key = ?'
).bind(licenseKey).first();

if (!user) throw new Error('Invalid license key');
```

### Migration from API Keys

**Auto-migration on extension update:**
1. Check if old API key exists in storage
2. Show migration prompt to user
3. User provides email
4. Backend creates free license key
5. Extension stores license key, removes API key

**Files:** `modules/migration.js`, `modules/migration-license.js`

## Stripe Integration

### Payment Flow

**1. User initiates upgrade:**
```javascript
const { url } = await AuthService.createCheckoutSession(email);
window.open(url);  // Open Stripe Checkout
```

**2. Stripe Checkout Session:**
- User enters payment details
- Stripe processes payment
- Redirect back to success page

**3. Webhook fires:**
```
Stripe → POST /api/subscription/webhook → Backend processes → Send email
```

**4. Email sent with license key:**
```
Resend API → User receives HTML email with Pro license key
```

### Webhook Events

**Handled events:**
- `checkout.session.completed`: New Pro subscription created
- `invoice.payment_succeeded`: Monthly renewal successful
- `invoice.payment_failed`: Payment issue (grace period)
- `customer.subscription.deleted`: Subscription cancelled
- `customer.subscription.updated`: Plan changed

**Security:**
- HMAC SHA256 signature verification
- Timestamp validation (2-minute window)
- Replay attack prevention (deduplication in `webhook_events` table)
- Constant-time signature comparison

### Webhook Processing

**Location:** `backend/src/subscription.js`

```javascript
// 1. Verify signature
const signature = request.headers.get('stripe-signature');
const isValid = await verifyWebhookSignature(body, signature);

// 2. Check for replay
const eventId = event.id;
const exists = await db.prepare(
  'SELECT id FROM webhook_events WHERE id = ?'
).bind(eventId).first();
if (exists) return { received: true };  // Ignore duplicate

// 3. Process event
switch (event.type) {
  case 'checkout.session.completed':
    await upgradeUserToPro(email, customerId, subscriptionId);
    await sendProLicenseEmail(email, licenseKey);
    break;
  // ... other events
}

// 4. Record event
await db.prepare(
  'INSERT INTO webhook_events (id, event_type) VALUES (?, ?)'
).bind(eventId, event.type).run();
```

## Coding Standards

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

## Chrome Extension Patterns

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
  "host_permissions": [
    "<all_urls>",
    "https://captureai-backend.thesuperiorflash.workers.dev/*"
  ],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": [
        "libs/tesseract/tesseract.min.js",
        "content.js"
      ]
    }
  ]
}
```

## Security Best Practices

### Extension Security

- Never use `eval()` or `innerHTML` with untrusted content
- Validate all input before processing
- Use `textContent` for user-generated content (not `innerHTML`)
- Strict CSP in manifest.json
- Minimal permissions only
- License key in chrome.storage.local (not synced)
- Never log sensitive data (license keys, emails)

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

### Backend Security

**Input Validation:**
- Email format validation (RFC 5322)
- License key format validation
- Request body size limits (1MB max)
- SQL injection prevention (parameterized queries)
- XSS protection (sanitize all output)

**Authentication:**
- License key required for all protected routes
- Tier validation on every request
- Rate limiting enforced per tier
- No authentication bypass possible

**Webhook Security:**
- HMAC SHA256 signature verification
- Timestamp validation (2-minute window)
- Replay attack prevention (event deduplication)
- Constant-time signature comparison (timing attack prevention)

**CORS Protection:**
```javascript
const ALLOWED_ORIGINS = [
  'https://thesuperiorflash.github.io',
  /^chrome-extension:\/\/.+$/
];
```

**Database Security:**
- Parameterized queries only (no string concatenation)
- Foreign key constraints
- CHECK constraints on tier field
- No direct SQL execution from user input

**Secrets Management:**
```bash
# Never commit secrets to git
# Always use Wrangler secrets
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put RESEND_API_KEY
```

## Performance Patterns

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

## Testing & Debugging

### Development Workflow - Extension
1. Edit `.js` file
2. Open `chrome://extensions`
3. Reload CaptureAI
4. Test on web page

### Development Workflow - Backend
1. Edit backend source file in `backend/src/`
2. Test locally: `npm run dev` (starts local server)
3. Test with extension: Set backend URL to `http://localhost:8787`
4. Deploy: `npm run deploy` (deploy to Cloudflare Workers)
5. Monitor logs: `wrangler tail`

**Database operations:**
```bash
cd backend
npm run db:init      # Initialize database
npm run db:migrate   # Run migrations
npm run db:query     # Interactive SQL queries
```

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

## Documentation Standards

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

## Git Workflow

Commit format: `<type>(<scope>): <subject>`

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

Examples:
- `feat(auto-solve): add Quizlet.com support`
- `fix(capture): handle off-screen selection`
- `refactor(modules): split ui.js into components`

## Critical Guidelines

### Requirements

**Always - Extension:**
- Read files before editing
- Use modular architecture (split files >500 lines)
- JSDoc all public functions
- Try-catch all async operations
- Check `chrome.runtime.lastError` in callbacks
- Use `STORAGE_KEYS` constants (never hardcode)
- Access state via `window.CaptureAI.STATE`
- Use `textContent` for user content
- Cache DOM elements in `DOM_CACHE`
- Validate license key before API calls
- Respect tier restrictions (Pro features for Pro users only)
- Test on Vocabulary.com and Quizlet.com (Pro features)
- Validate URLs before operations

**Always - Backend:**
- Use parameterized queries (never string concatenation)
- Validate all input (email, license keys, request bodies)
- Check tier before allowing operations
- Log all authentication events
- Verify webhook signatures
- Use constant-time comparisons for secrets
- Return consistent error messages (no info leakage)
- Track usage in `usage_records` table
- Test locally before deploying
- Use `wrangler secret` for sensitive data (never hardcode)

**Never:**
- Use `eval()` or `innerHTML` with untrusted content
- Access Chrome APIs without availability check
- Skip JSDoc on public functions
- Hardcode API keys, secrets, or credentials
- Log sensitive data (license keys, emails, tokens)
- Bypass tier restrictions
- Assume TypeScript (project uses vanilla JS)
- Commit secrets to git
- Deploy without testing locally
- Modify database schema without migrations

## Deployment

### Backend Deployment (Cloudflare Workers)

**Initial Setup:**
```bash
cd backend
npm install
wrangler login

# Set up secrets
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put STRIPE_PRICE_PRO
wrangler secret put RESEND_API_KEY
wrangler secret put FROM_EMAIL

# Initialize database
npm run db:init
```

**Deploy:**
```bash
cd backend
npm run deploy  # Deploy to production

# Monitor logs
wrangler tail
```

**Environment Variables:**
Configure in `wrangler.toml`:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_GATEWAY_NAME`
- `FREE_TIER_DAILY_LIMIT`
- `PRO_TIER_RATE_LIMIT_PER_MINUTE`
- `EXTENSION_URL`

### Extension Deployment (Chrome Web Store)

**Pre-submission Checklist:**
- [ ] Test Free tier (10 requests/day limit)
- [ ] Test Pro tier (auto-solve, image attachments)
- [ ] Test manual capture with OCR
- [ ] Test Ask mode (text-only and with images)
- [ ] Test auto-solve on Vocabulary.com and Quizlet.com
- [ ] Verify all keyboard shortcuts
- [ ] Test license key activation flow
- [ ] Test migration from old API key system
- [ ] Test on CSP-restricted sites
- [ ] Verify backend connectivity
- [ ] Check console errors in all contexts
- [ ] Verify icons (16, 48, 128px)
- [ ] Test Stripe checkout flow (sandbox)
- [ ] Verify webhook processing
- [ ] Validate all permissions are justified

**Package:**
```bash
git status  # Ensure clean state

# Test locally first
# chrome://extensions → Load unpacked → Test all features

# Create package (exclude backend, docs, etc.)
zip -r captureai-extension.zip \
  manifest.json \
  background.js \
  content.js \
  popup.html \
  popup.js \
  icons/ \
  libs/ \
  modules/ \
  -x "*.git*" "*.DS_Store" "backend/*" "docs/*" ".claude/*" "node_modules/*"
```

### Post-Deployment Verification

**Backend:**
```bash
# Test health endpoint
curl https://captureai-backend.thesuperiorflash.workers.dev/health

# Test license key creation
curl -X POST https://captureai-backend.thesuperiorflash.workers.dev/api/auth/create-free-key \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Monitor logs
wrangler tail
```

**Extension:**
- Install from Chrome Web Store
- Activate with test license key
- Verify all features work
- Check analytics tracking
- Test upgrade flow

## Quick Reference

### Common Tasks

**Add new extension module:**
```javascript
// 1. Create modules/new-feature.js
export const NewFeature = {
  doSomething() { /* ... */ }
};

// 2. Import in content.js
const newFeature = await import(chrome.runtime.getURL('modules/new-feature.js'));
window.CaptureAI.NewFeature = newFeature.NewFeature;
```

**Add new backend API endpoint:**
```javascript
// 1. Add route in backend/src/router.js
routes.push({
  method: 'POST',
  path: '/api/new-endpoint',
  handler: handlers.newEndpoint
});

// 2. Implement handler in appropriate file
async function newEndpoint(request, env, params) {
  // Validate license key
  const user = await validateLicenseKey(request, env);

  // Process request
  // ...

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Add database migration:**
```bash
cd backend/migrations
# Create migration file: YYYY-MM-DD-description.sql

-- Add migration SQL
ALTER TABLE users ADD COLUMN new_field TEXT;

# Run migration
npm run db:migrate
```

**Test backend locally:**
```bash
cd backend
npm run dev  # Starts local server on http://localhost:8787

# In extension, set backend URL:
chrome.storage.local.set({
  'captureai-backend-url': 'http://localhost:8787'
});
```

**Debug OCR issues:**
```javascript
// In browser console
const result = await window.CaptureAI.OCRService.processImageWithOCR(imageDataUrl);
console.log('OCR Result:', result);
console.log('Confidence:', result.confidence);
console.log('Text:', result.text);
```

### Architecture Summary

**Data Flow:**
```
User Action
  → Content Script (content.js)
  → Background Worker (background.js)
  → Auth Service (modules/auth-service.js)
  → Cloudflare Workers (backend/src/index.js)
  → Auth Validation (backend/src/auth.js)
  → AI Gateway (backend/src/ai.js)
  → OpenAI API
  → Response flows back
  → Display in UI (modules/ui-*.js)
```

**Key Integration Points:**
1. **Extension → Backend**: License key in Authorization header
2. **Backend → D1**: Parameterized queries for all database operations
3. **Backend → AI Gateway**: Proxied OpenAI requests with caching
4. **Backend → Stripe**: Webhook events for subscription management
5. **Backend → Resend**: Email delivery for license keys
6. **Extension → OCR**: Tesseract.js for text extraction

### Important URLs

- **Backend Production**: https://captureai-backend.thesuperiorflash.workers.dev
- **Extension URL**: https://thesuperiorflash.github.io/CaptureAI
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Chrome Web Store**: https://chrome.google.com/webstore

### Support Documentation

Additional docs in project:
- `backend/README.md` - Backend setup and deployment
- `backend/DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- `backend/QUICK_START.md` - Quick start guide
- `STRIPE_SETUP_GUIDE.md` - Stripe integration guide
- `LICENSE_KEY_SYSTEM.md` - License key documentation
- `docs/OCR_IMPLEMENTATION.md` - OCR implementation details
- `docs/COST_TRACKING_SUMMARY.md` - Cost tracking overview
