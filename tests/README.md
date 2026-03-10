# CaptureAI Testing Guide

> **Self-update rule:** When you add/remove test files, change coverage thresholds, or modify test setup — update this file. Keep the file tree and counts accurate.

## Running Tests

```bash
npm test                    # Jest unit + integration tests (30 files)
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npm run test:e2e            # Playwright e2e tests
npm run test:e2e:headed     # E2e with visible browser
npm run test:all            # All tests (extension + API + e2e)
npm test tests/unit/FILE    # Specific file
```

## Structure

```
tests/
├── setup/
│   ├── test-setup.js           # Global setup, Chrome mocks, fetch mocks
│   ├── chrome-mock.js          # Chrome API mock implementation
│   └── privacy-guard-test.html # HTML fixture for Privacy Guard tests
├── unit/                       # 22 unit test files
│   ├── auth-service.test.js    # License key validation, caching, API
│   ├── auto-solve-module.test.js
│   ├── background.test.js      # Service worker logic
│   ├── capture-system.test.js
│   ├── config.test.js
│   ├── domains-utils.test.js   # Site detection, CSP checking
│   ├── edge-cases.test.js      # Error handling edge cases
│   ├── event-manager.test.js
│   ├── image-processing.test.js
│   ├── inject.test.js          # MAIN world Privacy Guard
│   ├── keyboard.test.js
│   ├── message-handlers.test.js
│   ├── messaging.test.js
│   ├── migration.test.js
│   ├── ocr-service.test.js
│   ├── openai-api.test.js
│   ├── privacy-guard.test.js
│   ├── screenshot.test.js
│   ├── storage-wrapper.test.js
│   ├── ui-components.test.js
│   ├── ui-stealthy-result.test.js
│   └── utils-functions.test.js
├── integration/                # 3 integration test files
│   ├── auth-flow.test.js
│   ├── message-routing.test.js
│   └── migration-auth.test.js
└── e2e/                        # 2 Playwright e2e tests + fixtures
    ├── extension-load.spec.js
    ├── popup-ui.spec.js
    └── fixtures.js
```

## Coverage

Thresholds (in `config/jest.config.js`): **40%** statements/branches/lines, **47%** functions.

DOM-heavy files excluded from coverage: `popup.js`, `ui-core.js`, `ui-components.js`, `content.js`.

View report after `npm run test:coverage` at `coverage/index.html`.

## Test Setup

`tests/setup/test-setup.js` provides:
- Chrome API mocks (`chrome.storage`, `chrome.runtime`, `chrome.tabs`, etc.)
- Global `fetch` mock via jest-fetch-mock
- `importScripts()` mock providing `AuthService` and `Migration` globals
- `AbortController` polyfill

## Writing Tests

- Name files `<module-name>.test.js` for both unit and integration tests
- Follow AAA pattern: Arrange, Act, Assert
- Reset mocks between tests with `resetChromeMocks()`

```javascript
const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks } = require('../setup/chrome-mock');

describe('Module Name', () => {
  beforeEach(() => resetChromeMocks());

  test('should do specific thing', () => {
    const result = functionToTest('input');
    expect(result).toBe('expected');
  });
});
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot find module` | Check relative import paths |
| `chrome is not defined` | Import mocks from `../setup/chrome-mock` |
| Timer not advancing | `jest.useFakeTimers()` / `jest.useRealTimers()` |
| Async test hanging | Ensure `await` and `async` keywords are present |
