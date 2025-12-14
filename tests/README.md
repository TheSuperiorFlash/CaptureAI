# CaptureAI Testing Guide

## Overview

This directory contains unit and integration tests for the CaptureAI Chrome extension.

## Test Structure

```
tests/
├── setup/                      # Test configuration and mocks
│   ├── test-setup.js          # Global test setup
│   └── chrome-mock.js         # Chrome API mocks
├── unit/                       # Unit tests for individual functions
│   ├── message-builder.test.js   # OpenAI message builder tests
│   ├── url-validator.test.js     # URL validation tests
│   ├── storage.test.js           # Storage function tests
│   ├── screenshot.test.js        # Screenshot capture tests
│   └── utils.test.js             # Utility function tests
├── integration/                # Integration tests (future)
└── fixtures/                   # Test data and mock responses (future)
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests verbosely
```bash
npm run test:verbose
```

### Run specific test file
```bash
npm test tests/unit/message-builder.test.js
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="should build message"
```

## Test Coverage Goals

Current coverage thresholds (configured in jest.config.js):
- **Statements:** 70%
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%

## Writing New Tests

### Test File Naming Convention
- Unit tests: `<module-name>.test.js`
- Integration tests: `<feature-name>.integration.test.js`
- Place in appropriate directory

### Test Structure

```javascript
const { describe, test, expect, beforeEach } = require('@jest/globals');

describe('Module or Function Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('specific functionality', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Using Chrome API Mocks

```javascript
const { resetChromeMocks, storageMock } = require('../setup/chrome-mock');

describe('Function using Chrome APIs', () => {
  beforeEach(() => {
    resetChromeMocks();
  });

  test('should interact with chrome.storage', async () => {
    storageMock.local.get.mockImplementation((keys, callback) => {
      callback({ 'key': 'value' });
    });

    const result = await yourFunction();

    expect(storageMock.local.get).toHaveBeenCalledTimes(1);
  });
});
```

## Current Test Coverage

### Tested Modules
✅ **background.js**
- `buildMessages()` - Message builder (15 tests)
- `isValidUrl()` - URL validator (21 tests)
- `captureScreenshot()` - Screenshot capture (5 tests)
- `getStoredApiKey()` - Storage retrieval (6 tests)

✅ **modules/utils.js**
- `generateId()` - ID generation (4 tests)
- `delay()` - Delay utility (3 tests)
- `debounce()` - Debounce utility (4 tests)

**Total:** 58 unit tests

### Not Yet Tested
⏳ `sendToOpenAI()` - Requires fetch mocking
⏳ `processImage()` - Complex integration test
⏳ `handleCaptureArea()` - Integration test
⏳ Modules: `image-processing.js`, `capture-system.js`, `auto-solve.js`

## Best Practices

### DO:
- ✅ Test one thing per test
- ✅ Use descriptive test names
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Reset mocks between tests
- ✅ Test edge cases and error conditions
- ✅ Keep tests independent

### DON'T:
- ❌ Test implementation details
- ❌ Write overly complex tests
- ❌ Share state between tests
- ❌ Mock everything
- ❌ Ignore failing tests

## Debugging Tests

### Run single test with verbose output
```bash
npm test -- tests/unit/message-builder.test.js --verbose
```

### Run tests with Node debugger
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

### See what's being called
```javascript
console.log(mockFunction.mock.calls);
console.log(mockFunction.mock.results);
```

## Common Issues

### Issue: "Cannot find module"
**Solution:** Check import paths in test files. Module imports need relative paths.

### Issue: "chrome is not defined"
**Solution:** Import Chrome mocks: `const { setupChromeMock } = require('../setup/chrome-mock');`

### Issue: "Timer not advancing"
**Solution:** Use fake timers:
```javascript
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
```

### Issue: "async test not completing"
**Solution:** Make sure to `await` promises and use `async` keyword:
```javascript
test('should work', async () => {
  const result = await asyncFunction();
  expect(result).toBe('value');
});
```

## Coverage Reports

After running `npm run test:coverage`, open:
```
coverage/index.html
```

This provides detailed line-by-line coverage information.

## Future Enhancements

### Planned Test Additions:
1. Integration tests for full capture workflow
2. Tests for image processing functions
3. Tests for auto-solve logic
4. Tests for UI components
5. E2E tests using Puppeteer

### CI/CD Integration:
- GitHub Actions workflow
- Automatic test runs on PR
- Coverage reporting to Codecov

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Chrome Extension Testing](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)

---

**Last Updated:** December 13, 2024
**Test Framework:** Jest 30.2.0
**Coverage Goal:** 70%+
