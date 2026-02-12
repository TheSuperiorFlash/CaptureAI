# CaptureAI - GitHub Copilot Instructions

## Project Overview

CaptureAI is a Chrome extension that enables users to capture questions from any webpage and receive instant AI-powered answers. The project consists of three main components:

1. **Chrome Extension** (Manifest V3) - Client-side capture and UI
2. **Cloudflare Workers API** - Backend API with D1 database
3. **Next.js Website** - Marketing and support site

## Technology Stack

### Chrome Extension
- **Runtime**: Manifest V3, ES6 Modules
- **OCR**: Tesseract.js v7.0.0 for text extraction
- **Storage**: Chrome Storage API
- **Architecture**: Modular with service worker background script
- **Content Scripts**: Main world injection for privacy protection

### Backend API
- **Platform**: Cloudflare Workers (serverless)
- **Database**: Cloudflare D1 (SQLite)
- **AI Provider**: OpenAI API via Cloudflare AI Gateway
- **Payments**: Stripe integration for Pro subscriptions
- **Rate Limiting**: Built-in request throttling

### Development Tools
- **Linting**: ESLint v9 with flat config
- **Testing**: Jest v30 with jsdom environment
- **Build**: PowerShell and bash scripts

## Project Structure

```
CaptureAI/
├── extension/                  # Chrome Extension
│   ├── manifest.json          # Extension configuration (Manifest V3)
│   ├── background.js          # Service worker (API communication)
│   ├── content.js             # Main content script entry point
│   ├── popup.html/js          # Extension popup interface
│   ├── inject.js              # MAIN world privacy protection script
│   └── modules/               # Modular JavaScript components
│       ├── config.js          # Constants and state management
│       ├── auth-service.js    # License key authentication
│       ├── ocr-service.js     # Tesseract.js OCR integration
│       ├── capture-system.js  # Area selection and capture
│       ├── auto-solve.js      # Auto-solve functionality
│       ├── ui-*.js            # UI components and theming
│       ├── privacy-guard.js   # Privacy protection coordinator
│       └── messaging.js       # Chrome extension messaging
│
├── api/                       # Cloudflare Workers API
│   ├── wrangler.toml         # Cloudflare configuration
│   ├── schema.sql            # Database schema
│   └── src/
│       ├── index.js          # Main router
│       ├── auth.js           # License key management
│       ├── ai.js             # OpenAI API integration
│       ├── subscription.js   # Stripe payment handling
│       └── durable-objects/  # Rate limiting objects
│
├── website/                   # Next.js support website
├── tests/                     # Test files
│   ├── unit/                 # Unit tests
│   └── setup/                # Test setup files
│
├── config/                    # Build and lint configs
│   ├── eslint.config.mjs     # ESLint flat config
│   └── jest.config.js        # Jest test configuration
│
└── docs/                      # Documentation
```

## Code Organization and Conventions

### Module System
- **Extension**: ES6 modules with explicit imports/exports
- **API**: CommonJS for Cloudflare Workers compatibility
- Use explicit file extensions in imports when required by Chrome

### Naming Conventions
- **Files**: kebab-case (e.g., `auth-service.js`, `ui-core.js`)
- **Classes**: PascalCase (e.g., `CaptureSystem`, `OCRService`)
- **Functions/Variables**: camelCase (e.g., `handleCapture`, `isValidKey`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_INVALID_QUESTIONS`)

### Code Style
- **Indentation**: 4 spaces (not tabs)
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line Length**: Aim for 80-100 characters
- **Comments**: JSDoc format for functions, inline for complex logic

### Error Handling
- Always use try-catch blocks for async operations
- Log errors to console for debugging
- Provide user-friendly error messages in the UI
- Never expose sensitive data in error messages

## Development Guidelines

### Chrome Extension Development

#### Content Scripts vs Background Scripts
- **Content Scripts**: Run in isolated world, have DOM access
- **Background Script**: Service worker, handles API calls and storage
- **Inject Script**: Runs in MAIN world for privacy protection

#### Message Passing
- Use `chrome.runtime.sendMessage()` for content → background
- Use `chrome.tabs.sendMessage()` for background → content
- Always include error handling for disconnected ports

#### Storage
- Use `chrome.storage.local` for persistent data
- Wrap storage operations in utility functions from `modules/storage.js`
- Always await storage operations

#### Permissions
- Only request necessary permissions in manifest.json
- Use `activeTab` instead of broad permissions when possible
- Document why each permission is needed

### API Development

#### Cloudflare Workers Best Practices
- Keep responses under 1MB
- Use D1 prepared statements to prevent SQL injection
- Implement proper CORS headers
- Use AI Gateway for OpenAI API calls (caching, rate limiting)
- Return appropriate HTTP status codes

#### Database Operations
- Always use parameterized queries
- Handle database errors gracefully
- Use transactions for multi-step operations
- Keep queries efficient with proper indexes

#### Authentication
- Validate license keys on every API request
- Check usage limits before processing requests
- Log authentication failures for security monitoring
- Never expose full license keys in responses

### Testing

#### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # With coverage report
npm run test:verbose  # Detailed output
```

#### Test Organization
- Unit tests in `tests/unit/`
- Integration tests separate from unit tests
- Mock Chrome APIs using jest-chrome or manual mocks
- Test both success and failure paths

#### Test Coverage
- Aim for 80%+ coverage on critical paths
- Focus on business logic and edge cases
- Don't test trivial getters/setters
- Mock external dependencies (Chrome APIs, OpenAI)

### Linting and Code Quality

#### Running Linter
```bash
npm run lint          # Check code style
npm run lint:fix      # Auto-fix issues
```

#### ESLint Configuration
- Uses ESLint v9 with flat config format
- Enforces ES2022 standards
- Checks for security issues (no-eval, no-implied-eval)
- Allows console.log for debugging
- Warns on unused variables (except those prefixed with _)

#### Before Committing
1. Run `npm run lint:fix` to fix auto-fixable issues
2. Run `npm test` to ensure tests pass
3. Manually test affected functionality in Chrome
4. Review changes for unintended modifications

## Chrome Extension Specific Guidance

### Manifest V3 Requirements
- Use service workers instead of background pages
- Use `chrome.scripting.executeScript` for dynamic injection
- Handle service worker lifecycle (may restart frequently)
- Store state in chrome.storage, not memory

### Content Security Policy
- No inline scripts in HTML files
- External scripts must be bundled
- `wasm-unsafe-eval` required for Tesseract.js
- Worker scripts must be self-hosted

### Web Accessible Resources
- Only expose resources that must be accessible to web pages
- Include all modules used by injected scripts
- Be aware of security implications of exposed resources

### Privacy and Security
- **Privacy Guard System**: Prevents websites from detecting extension usage
- Block focus/blur detection events
- Spoof `document.hasFocus()` to return true
- Remove AI detection honeypots from pages
- Never collect or transmit user data without consent

### OCR Integration
- Use Tesseract.js for text extraction
- 60% confidence threshold for OCR fallback to image
- Clean extracted text (remove artifacts, normalize whitespace)
- Handle OCR errors gracefully (fall back to image-only mode)

### Image Processing
- Compress screenshots before API transmission
- Use WebP format when supported, JPEG as fallback
- Respect browser zoom levels in capture dimensions
- Optimize for API token efficiency

## API and Backend Guidance

### OpenAI Integration
- Use Cloudflare AI Gateway for all requests
- Implement proper error handling for rate limits
- Support multiple models (GPT-4o, o1-mini, etc.)
- Include reasoning effort parameter for Pro users
- Keep prompts concise and clear

### License Key System
- **Free Tier**: 10 requests per day
- **Pro Tier**: Unlimited requests
- Validate key format: `XXXX-XXXX-XXXX-XXXX-XXXX`
- Track usage in D1 database
- Reset daily limits at midnight UTC

### Rate Limiting
- Use Durable Objects for distributed rate limiting
- Implement per-key and per-IP limits
- Return 429 status code with retry-after header
- Log rate limit violations

### Stripe Integration
- Use Stripe webhooks for subscription events
- Verify webhook signatures
- Handle subscription lifecycle (created, updated, cancelled)
- Store subscription status in D1 database
- Never expose Stripe API keys in client-side code

## Common Tasks

### Adding a New Module
1. Create file in `extension/modules/` with kebab-case name
2. Export functions/classes using ES6 export syntax
3. Import in `content.js` or consuming module
4. Add to web_accessible_resources in manifest.json if needed
5. Write unit tests in `tests/unit/`

### Adding a New API Endpoint
1. Create route handler in `api/src/router.js`
2. Implement business logic in appropriate module (auth.js, ai.js, etc.)
3. Add authentication check if required
4. Return JSON responses with proper status codes
5. Update API documentation

### Adding Support for a New Website
1. Add detection method in `extension/modules/domains.js`
2. Update `isOnSupportedSite()` to include new site
3. Implement site-specific logic in `auto-solve.js` if needed
4. Test thoroughly on the target site
5. Update README.md with new supported site

### Updating Dependencies
1. Check for security vulnerabilities: `npm audit`
2. Update package.json version
3. Run `npm install` to update lock file
4. Test all functionality after update
5. Run full test suite
6. Update documentation if API changes

## Debugging Tips

### Chrome Extension Debugging
- Check background script console: `chrome://extensions` → Inspect views: service worker
- Check content script console: Right-click page → Inspect → Console
- View storage: `chrome://extensions` → CaptureAI → Storage
- Test message passing: Add console.log in message handlers
- Clear storage: `chrome.storage.local.clear()` in console

### API Debugging
- Use `wrangler dev` for local development
- Check logs: `wrangler tail` for live logs
- Test endpoints with curl or Postman
- Query D1 database: `wrangler d1 execute captureai-db --command="SELECT * FROM license_keys LIMIT 5"`
- Monitor AI Gateway usage in Cloudflare dashboard

### Common Issues
- **Extension not loading**: Check manifest.json syntax, verify all files exist
- **Content script not injecting**: Check matches pattern, verify run_at timing
- **API returning 401**: Check license key validation, verify key in database
- **OCR not working**: Verify Tesseract.js loaded, check worker.min.js path
- **Capture not starting**: Check permissions, verify activeTab is granted

## Performance Considerations

### Extension Performance
- Minimize content script size (use lazy loading)
- Debounce keyboard events
- Use efficient DOM queries (avoid repeated querySelector)
- Clean up event listeners when not needed
- Optimize image compression settings

### API Performance
- Use D1 indexes for frequently queried columns
- Cache AI Gateway responses when appropriate
- Minimize database queries per request
- Use prepared statements for repeated queries
- Keep Workers bundle size small

## Security Best Practices

### Input Validation
- Sanitize all user inputs
- Validate license key format before database query
- Check image size limits before processing
- Validate URL parameters
- Use allowlists over denylists

### Data Protection
- Never log sensitive data (API keys, license keys)
- Use HTTPS for all external requests
- Implement CORS properly
- Encrypt sensitive data at rest
- Follow principle of least privilege

### Chrome Extension Security
- Validate message sources
- Sanitize DOM manipulation
- Use textContent instead of innerHTML when possible
- Avoid eval() and Function()
- Keep manifest permissions minimal

## Documentation Standards

### Code Comments
- Document public APIs with JSDoc format
- Explain complex algorithms or business logic
- Include examples for non-obvious usage
- Keep comments up-to-date with code changes
- Remove commented-out code before committing

### Commit Messages
- Use conventional commits format when possible
- Start with verb in imperative mood (Add, Fix, Update, Remove)
- Be concise but descriptive
- Reference issue numbers when applicable
- Example: "Add OCR fallback for low confidence scores (#42)"

## Additional Notes

- **Browser Compatibility**: Chrome only (uses Chrome-specific APIs)
- **Node Version**: Development requires Node.js 18+ for testing
- **Cloudflare Account**: Required for API deployment
- **OpenAI API Key**: Required for AI functionality
- **Stripe Account**: Required for payment processing

## Helpful Commands

```bash
# Extension Development
# (No build step - load directly from extension/ directory)
# Chrome → chrome://extensions/ → Developer mode → Load unpacked

# API Development
cd api
npm run dev              # Start local development server
npm run deploy           # Deploy to Cloudflare
npm run db:init          # Initialize database schema
npm run db:migrate       # Run database migrations

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report

# Linting
npm run lint             # Check code style
npm run lint:fix         # Auto-fix issues

# Git
git status               # Check working tree
git diff                 # View changes
git add .                # Stage all changes
git commit -m "message"  # Commit changes
```

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/migrating/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)
- [Jest Testing Framework](https://jestjs.io/)
- [ESLint Documentation](https://eslint.org/)

## Contact

For questions or issues, please refer to the [GitHub Issues](https://github.com/TheSuperiorFlash/CaptureAI/issues) page.
