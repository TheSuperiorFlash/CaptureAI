# CaptureAI Testing Guide

## Running Tests

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npm run test:verbose        # Detailed output
npm test tests/unit/FILE    # Specific file
npm test -- --testNamePattern="PATTERN"  # Match pattern
```

## Structure

```
tests/
├── setup/
│   ├── test-setup.js       # Global test setup
│   └── chrome-mock.js      # Chrome API mocks
├── unit/                   # Unit tests (58 total)
└── integration/            # Integration tests (planned)
```

## Coverage

Thresholds (configured in `jest.config.js`): 70% statements, branches, functions, lines.

After running `npm run test:coverage`, view report at `coverage/index.html`.

### Tested Modules

| Module | Tests | Coverage |
|--------|-------|----------|
| `background.js` — `buildMessages()` | 15 | Message building |
| `background.js` — `isValidUrl()` | 21 | URL validation |
| `background.js` — `captureScreenshot()` | 5 | Screenshot capture |
| `background.js` — `getStoredApiKey()` | 6 | Storage retrieval |
| `modules/utils.js` — `generateId()`, `delay()`, `debounce()` | 11 | Utilities |

### Not Yet Tested

`sendToOpenAI()`, `processImage()`, `handleCaptureArea()`, `image-processing.js`, `capture-system.js`, `auto-solve.js`

## Writing Tests

- Name files `<module-name>.test.js` (unit) or `<feature-name>.integration.test.js`
- Follow AAA pattern: Arrange, Act, Assert
- One assertion focus per test
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
