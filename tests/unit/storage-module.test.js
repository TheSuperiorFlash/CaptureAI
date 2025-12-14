/**
 * Unit Tests for Storage Module Functions
 *
 * Tests Chrome storage wrapper utilities from modules/storage.js
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks, storageMock } = require('../setup/chrome-mock');

// Storage utilities to test (copied from modules/storage.js)
function setValue(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

function getValue(key, defaultValue = null) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] !== undefined ? result[key] : defaultValue);
    });
  });
}

function getValues(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

function removeValue(key) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, resolve);
  });
}

function clear() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(resolve);
  });
}

describe('Storage Module', () => {
  beforeEach(() => {
    resetChromeMocks();
  });

  describe('setValue', () => {
    test('should store string value', async () => {
      storageMock.local.set.mockImplementation((items, callback) => {
        if (callback) callback();
      });

      await setValue('test-key', 'test-value');

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { 'test-key': 'test-value' },
        expect.any(Function)
      );
    });

    test('should store number value', async () => {
      storageMock.local.set.mockImplementation((items, callback) => {
        if (callback) callback();
      });

      await setValue('count', 42);

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { 'count': 42 },
        expect.any(Function)
      );
    });

    test('should store object value', async () => {
      const testObject = { name: 'test', value: 123 };

      storageMock.local.set.mockImplementation((items, callback) => {
        if (callback) callback();
      });

      await setValue('config', testObject);

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { 'config': testObject },
        expect.any(Function)
      );
    });

    test('should store array value', async () => {
      const testArray = [1, 2, 3, 4, 5];

      storageMock.local.set.mockImplementation((items, callback) => {
        if (callback) callback();
      });

      await setValue('list', testArray);

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { 'list': testArray },
        expect.any(Function)
      );
    });

    test('should store null value', async () => {
      storageMock.local.set.mockImplementation((items, callback) => {
        if (callback) callback();
      });

      await setValue('nullable', null);

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { 'nullable': null },
        expect.any(Function)
      );
    });

    test('should resolve when storage operation completes', async () => {
      storageMock.local.set.mockImplementation((items, callback) => {
        if (callback) callback();
      });

      const result = await setValue('test', 'value');

      expect(result).toBeUndefined();
    });
  });

  describe('getValue', () => {
    test('should retrieve existing value', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'test-key': 'test-value' });
      });

      const result = await getValue('test-key');

      expect(result).toBe('test-value');
      expect(storageMock.local.get).toHaveBeenCalledWith(
        ['test-key'],
        expect.any(Function)
      );
    });

    test('should return default value when key does not exist', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const result = await getValue('missing-key', 'default-value');

      expect(result).toBe('default-value');
    });

    test('should return null as default when no default provided', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const result = await getValue('missing-key');

      expect(result).toBeNull();
    });

    test('should retrieve number value', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'count': 42 });
      });

      const result = await getValue('count');

      expect(result).toBe(42);
    });

    test('should retrieve object value', async () => {
      const testObject = { name: 'test', value: 123 };

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'config': testObject });
      });

      const result = await getValue('config');

      expect(result).toEqual(testObject);
    });

    test('should retrieve array value', async () => {
      const testArray = [1, 2, 3];

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'list': testArray });
      });

      const result = await getValue('list');

      expect(result).toEqual(testArray);
    });

    test('should handle stored null value', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'nullable': null });
      });

      const result = await getValue('nullable', 'default');

      // null is a valid stored value, so it should be returned
      expect(result).toBeNull();
    });

    test('should return default for undefined value', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'key': undefined });
      });

      const result = await getValue('key', 'default');

      expect(result).toBe('default');
    });
  });

  describe('getValues', () => {
    test('should retrieve multiple values', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({
          'key1': 'value1',
          'key2': 'value2',
          'key3': 'value3'
        });
      });

      const result = await getValues(['key1', 'key2', 'key3']);

      expect(result).toEqual({
        'key1': 'value1',
        'key2': 'value2',
        'key3': 'value3'
      });
    });

    test('should handle empty keys array', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const result = await getValues([]);

      expect(result).toEqual({});
    });

    test('should handle mix of existing and non-existing keys', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'key1': 'value1' });
      });

      const result = await getValues(['key1', 'key2']);

      expect(result).toEqual({ 'key1': 'value1' });
      expect(result.key2).toBeUndefined();
    });

    test('should call chrome.storage.local.get with keys array', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      await getValues(['a', 'b', 'c']);

      expect(storageMock.local.get).toHaveBeenCalledWith(
        ['a', 'b', 'c'],
        expect.any(Function)
      );
    });
  });

  describe('removeValue', () => {
    test('should remove value by key', async () => {
      storageMock.local.remove.mockImplementation((key, callback) => {
        if (callback) callback();
      });

      await removeValue('test-key');

      expect(storageMock.local.remove).toHaveBeenCalledWith(
        'test-key',
        expect.any(Function)
      );
    });

    test('should resolve when removal completes', async () => {
      storageMock.local.remove.mockImplementation((key, callback) => {
        if (callback) callback();
      });

      const result = await removeValue('test-key');

      expect(result).toBeUndefined();
    });

    test('should handle removing non-existent key', async () => {
      storageMock.local.remove.mockImplementation((key, callback) => {
        if (callback) callback();
      });

      await expect(removeValue('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('clear', () => {
    test('should clear all storage', async () => {
      storageMock.local.clear.mockImplementation((callback) => {
        if (callback) callback();
      });

      await clear();

      expect(storageMock.local.clear).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    test('should resolve when clear completes', async () => {
      storageMock.local.clear.mockImplementation((callback) => {
        if (callback) callback();
      });

      const result = await clear();

      expect(result).toBeUndefined();
    });
  });
});
