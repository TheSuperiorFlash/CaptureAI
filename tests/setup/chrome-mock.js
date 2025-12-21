/**
 * Chrome API Mocks for Testing
 *
 * Provides mock implementations of Chrome extension APIs
 * for use in Jest tests
 */

// Storage API mock - supports both callback and Promise APIs (Manifest V3)
const storageMock = {
  local: {
    get: jest.fn((keys, callback) => {
      // Support both callback and Promise APIs
      if (callback) {
        callback({});
        return undefined;
      }
      // Return Promise for Manifest V3 API
      return Promise.resolve({});
    }),
    set: jest.fn((items, callback) => {
      if (callback) {
        callback();
        return undefined;
      }
      return Promise.resolve();
    }),
    remove: jest.fn((keys, callback) => {
      if (callback) {
        callback();
        return undefined;
      }
      return Promise.resolve();
    }),
    clear: jest.fn((callback) => {
      if (callback) {
        callback();
        return undefined;
      }
      return Promise.resolve();
    })
  }
};

// Runtime API mock
const runtimeMock = {
  lastError: null,
  sendMessage: jest.fn((message, callback) => {
    if (callback) {
      callback({ success: true });
    }
  }),
  onMessage: {
    addListener: jest.fn(),
    removeListener: jest.fn()
  },
  getURL: jest.fn((path) => `chrome-extension://mock-id/${path}`)
};

// Tabs API mock
const tabsMock = {
  captureVisibleTab: jest.fn((windowId, options, callback) => {
    callback('data:image/png;base64,mockImageData');
  }),
  sendMessage: jest.fn((tabId, message, callback) => {
    if (callback) {
      callback({ success: true });
    }
  }),
  query: jest.fn((queryInfo, callback) => {
    callback([{ id: 1, url: 'https://example.com' }]);
  })
};

// Scripting API mock
const scriptingMock = {
  executeScript: jest.fn((injection, callback) => {
    if (callback) {
      callback([{ result: true }]);
    }
  })
};

// Complete Chrome API mock
const chromeMock = {
  storage: storageMock,
  runtime: runtimeMock,
  tabs: tabsMock,
  scripting: scriptingMock
};

/**
 * Set up Chrome API mock globally
 */
function setupChromeMock() {
  global.chrome = chromeMock;
}

/**
 * Reset all Chrome API mocks
 */
function resetChromeMocks() {
  jest.clearAllMocks();
  runtimeMock.lastError = null;
}

/**
 * Set a runtime error for testing error handling
 * @param {string} message - Error message
 */
function setRuntimeError(message) {
  runtimeMock.lastError = { message };
}

/**
 * Clear runtime error
 */
function clearRuntimeError() {
  runtimeMock.lastError = null;
}

export {
  chromeMock,
  setupChromeMock,
  resetChromeMocks,
  setRuntimeError,
  clearRuntimeError,
  storageMock,
  runtimeMock,
  tabsMock,
  scriptingMock
};
