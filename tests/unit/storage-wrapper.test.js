/**
 * Unit Tests for Storage Module Wrapper Functions
 *
 * Tests the chrome.storage.local wrapper functions from modules/storage.js
 * Note: This is different from storage.test.js which tests background.js storage functions
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { resetChromeMocks, storageMock } from '../setup/chrome-mock.js';
import {
  setValue,
  getValue,
  getValues,
  removeValue,
  clear,
  StorageUtils
} from '../../modules/storage.js';

describe('Storage Module Wrapper Functions', () => {
  beforeEach(() => {
    resetChromeMocks();
  });

  describe('setValue', () => {
    test('should store a string value', async () => {
      const key = 'testKey';
      const value = 'testValue';

      await setValue(key, value);

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { [key]: value },
        expect.any(Function)
      );
    });

    test('should store a number value', async () => {
      const key = 'numberKey';
      const value = 42;

      await setValue(key, value);

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { [key]: value },
        expect.any(Function)
      );
    });

    test('should store an object value', async () => {
      const key = 'objectKey';
      const value = { foo: 'bar', nested: { value: 123 } };

      await setValue(key, value);

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { [key]: value },
        expect.any(Function)
      );
    });

    test('should store an array value', async () => {
      const key = 'arrayKey';
      const value = [1, 2, 3, 'four'];

      await setValue(key, value);

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { [key]: value },
        expect.any(Function)
      );
    });

    test('should store boolean values', async () => {
      await setValue('trueKey', true);
      await setValue('falseKey', false);

      expect(storageMock.local.set).toHaveBeenCalledTimes(2);
    });

    test('should store null value', async () => {
      const key = 'nullKey';
      const value = null;

      await setValue(key, value);

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { [key]: value },
        expect.any(Function)
      );
    });

    test('should resolve promise when storage completes', async () => {
      const result = setValue('key', 'value');

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });

    test('should handle special characters in key', async () => {
      const key = 'key-with_special.chars@123';
      const value = 'test';

      await setValue(key, value);

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { [key]: value },
        expect.any(Function)
      );
    });

    test('should handle empty string value', async () => {
      await setValue('emptyKey', '');

      expect(storageMock.local.set).toHaveBeenCalled();
    });

    test('should handle zero as value', async () => {
      await setValue('zeroKey', 0);

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { zeroKey: 0 },
        expect.any(Function)
      );
    });
  });

  describe('getValue', () => {
    test('should retrieve existing value', async () => {
      const key = 'existingKey';
      const expectedValue = 'storedValue';

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ [key]: expectedValue });
      });

      const result = await getValue(key);

      expect(result).toBe(expectedValue);
      expect(storageMock.local.get).toHaveBeenCalledWith(
        [key],
        expect.any(Function)
      );
    });

    test('should return default value when key does not exist', async () => {
      const key = 'nonExistentKey';
      const defaultValue = 'defaultValue';

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const result = await getValue(key, defaultValue);

      expect(result).toBe(defaultValue);
    });

    test('should return null as default when no default provided', async () => {
      const key = 'nonExistentKey';

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const result = await getValue(key);

      expect(result).toBeNull();
    });

    test('should retrieve number value', async () => {
      const key = 'numberKey';
      const expectedValue = 42;

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ [key]: expectedValue });
      });

      const result = await getValue(key);

      expect(result).toBe(42);
      expect(typeof result).toBe('number');
    });

    test('should retrieve object value', async () => {
      const key = 'objectKey';
      const expectedValue = { foo: 'bar', nested: { value: 123 } };

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ [key]: expectedValue });
      });

      const result = await getValue(key);

      expect(result).toEqual(expectedValue);
    });

    test('should retrieve array value', async () => {
      const key = 'arrayKey';
      const expectedValue = [1, 2, 3, 'four'];

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ [key]: expectedValue });
      });

      const result = await getValue(key);

      expect(result).toEqual(expectedValue);
    });

    test('should handle stored null value', async () => {
      const key = 'nullKey';

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ [key]: null });
      });

      const result = await getValue(key);

      expect(result).toBeNull();
    });

    test('should return default for undefined value', async () => {
      const key = 'undefinedKey';
      const defaultValue = 'default';

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ [key]: undefined });
      });

      const result = await getValue(key, defaultValue);

      expect(result).toBe(defaultValue);
    });

    test('should handle boolean values', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ trueKey: true, falseKey: false });
      });

      expect(await getValue('trueKey')).toBe(true);
      expect(await getValue('falseKey')).toBe(false);
    });

    test('should handle zero value', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ zeroKey: 0 });
      });

      const result = await getValue('zeroKey', 999);

      expect(result).toBe(0);
    });

    test('should handle empty string value', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ emptyKey: '' });
      });

      const result = await getValue('emptyKey', 'default');

      expect(result).toBe('');
    });
  });

  describe('getValues', () => {
    test('should retrieve multiple values', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const expectedResult = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      };

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback(expectedResult);
      });

      const result = await getValues(keys);

      expect(result).toEqual(expectedResult);
      expect(storageMock.local.get).toHaveBeenCalledWith(
        keys,
        expect.any(Function)
      );
    });

    test('should handle empty keys array', async () => {
      const keys = [];

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const result = await getValues(keys);

      expect(result).toEqual({});
    });

    test('should handle mix of existing and non-existing keys', async () => {
      const keys = ['existingKey', 'nonExistingKey', 'anotherKey'];

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({
          existingKey: 'value1',
          anotherKey: 'value3'
        });
      });

      const result = await getValues(keys);

      expect(result).toEqual({
        existingKey: 'value1',
        anotherKey: 'value3'
      });
      expect(result.nonExistingKey).toBeUndefined();
    });

    test('should call chrome.storage.local.get with keys array', async () => {
      const keys = ['key1', 'key2'];

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      await getValues(keys);

      expect(storageMock.local.get).toHaveBeenCalledWith(
        keys,
        expect.any(Function)
      );
    });

    test('should handle single key in array', async () => {
      const keys = ['singleKey'];

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ singleKey: 'singleValue' });
      });

      const result = await getValues(keys);

      expect(result).toEqual({ singleKey: 'singleValue' });
    });

    test('should handle various data types', async () => {
      const keys = ['stringKey', 'numberKey', 'objectKey', 'arrayKey'];
      const expectedResult = {
        stringKey: 'test',
        numberKey: 42,
        objectKey: { foo: 'bar' },
        arrayKey: [1, 2, 3]
      };

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback(expectedResult);
      });

      const result = await getValues(keys);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('removeValue', () => {
    test('should remove value by key', async () => {
      const key = 'keyToRemove';

      await removeValue(key);

      expect(storageMock.local.remove).toHaveBeenCalledWith(
        key,
        expect.any(Function)
      );
    });

    test('should resolve when removal completes', async () => {
      const result = removeValue('testKey');

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });

    test('should handle removing non-existent key', async () => {
      const key = 'nonExistentKey';

      await expect(removeValue(key)).resolves.toBeUndefined();

      expect(storageMock.local.remove).toHaveBeenCalledWith(
        key,
        expect.any(Function)
      );
    });

    test('should handle special characters in key', async () => {
      const key = 'key-with_special.chars@123';

      await removeValue(key);

      expect(storageMock.local.remove).toHaveBeenCalledWith(
        key,
        expect.any(Function)
      );
    });
  });

  describe('clear', () => {
    test('should clear all storage', async () => {
      await clear();

      expect(storageMock.local.clear).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    test('should resolve when clear completes', async () => {
      const result = clear();

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });

    test('should work multiple times', async () => {
      await clear();
      await clear();

      expect(storageMock.local.clear).toHaveBeenCalledTimes(2);
    });
  });

  describe('StorageUtils object', () => {
    test('should have all expected methods', () => {
      expect(StorageUtils).toHaveProperty('setValue');
      expect(StorageUtils).toHaveProperty('getValue');
      expect(StorageUtils).toHaveProperty('getValues');
      expect(StorageUtils).toHaveProperty('removeValue');
      expect(StorageUtils).toHaveProperty('clear');
    });

    test('should allow calling via StorageUtils object', async () => {
      await StorageUtils.setValue('key', 'value');

      expect(storageMock.local.set).toHaveBeenCalled();
    });

    test('should work with all methods via object', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ testKey: 'testValue' });
      });

      await StorageUtils.setValue('key', 'value');
      const value = await StorageUtils.getValue('testKey');
      const values = await StorageUtils.getValues(['key1', 'key2']);
      await StorageUtils.removeValue('key');
      await StorageUtils.clear();

      expect(storageMock.local.set).toHaveBeenCalled();
      expect(storageMock.local.get).toHaveBeenCalled();
      expect(storageMock.local.remove).toHaveBeenCalled();
      expect(storageMock.local.clear).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long keys', async () => {
      const longKey = 'k'.repeat(1000);

      await setValue(longKey, 'value');

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { [longKey]: 'value' },
        expect.any(Function)
      );
    });

    test('should handle very long values', async () => {
      const longValue = 'v'.repeat(10000);

      await setValue('key', longValue);

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { key: longValue },
        expect.any(Function)
      );
    });

    test('should handle Unicode characters', async () => {
      const unicodeValue = '你好世界 🌍 مرحبا';

      await setValue('unicodeKey', unicodeValue);

      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ unicodeKey: unicodeValue });
      });

      const result = await getValue('unicodeKey');

      expect(result).toBe(unicodeValue);
    });

    test('should handle nested objects', async () => {
      const nestedObject = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        }
      };

      await setValue('nested', nestedObject);

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { nested: nestedObject },
        expect.any(Function)
      );
    });

    test('should handle arrays with mixed types', async () => {
      const mixedArray = [1, 'two', { three: 3 }, [4, 5], true, null];

      await setValue('mixed', mixedArray);

      expect(storageMock.local.set).toHaveBeenCalledWith(
        { mixed: mixedArray },
        expect.any(Function)
      );
    });
  });
});
