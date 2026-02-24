/**
 * Unit Tests for Migration Module
 * Tests license key migration from API key based system
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks, storageMock } = require('../setup/chrome-mock');

let Migration;

beforeEach(() => {
  resetChromeMocks();
  jest.resetModules();
  Migration = require('../../extension/modules/migration.js');
});

describe('Migration', () => {
  describe('MIGRATION_KEY', () => {
    test('should have the correct migration key', () => {
      expect(Migration.MIGRATION_KEY).toBe('captureai-migration-license-v3-complete');
    });
  });

  describe('runMigration', () => {
    test('should skip if migration already completed', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        const result = { 'captureai-migration-license-v3-complete': true };
        if (callback) { callback(result); return undefined; }
        return Promise.resolve(result);
      });

      const ran = await Migration.runMigration();
      expect(ran).toBe(false);
    });

    test('should run migration when not yet completed', async () => {
      // First call: check migration key (not done)
      // Second call: check old auth data
      // Third+ calls: other storage operations
      let callCount = 0;
      storageMock.local.get.mockImplementation((keys, callback) => {
        callCount++;
        let result;
        if (callCount === 1) {
          // Migration key check - not completed
          result = {};
        } else if (callCount === 2) {
          // Old auth data check - no old data
          result = {};
        } else {
          // Backend URL check
          result = {};
        }
        if (callback) { callback(result); return undefined; }
        return Promise.resolve(result);
      });

      const ran = await Migration.runMigration();
      expect(ran).toBe(true);
      // Should mark migration as complete
      expect(storageMock.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'captureai-migration-license-v3-complete': true
        })
      );
    });

    test('should set migration notice when old auth data exists', async () => {
      let callCount = 0;
      storageMock.local.get.mockImplementation((keys, callback) => {
        callCount++;
        let result;
        if (callCount === 1) {
          result = {}; // Not migrated yet
        } else if (callCount === 2) {
          result = { 'captureai-api-key': 'old-key-123' }; // Has old auth
        } else {
          result = {}; // Backend URL check
        }
        if (callback) { callback(result); return undefined; }
        return Promise.resolve(result);
      });

      await Migration.runMigration();

      // Should set migration notice
      expect(storageMock.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'captureai-migration-notice': expect.stringContaining('license key')
        })
      );
    });

    test('should remove old authentication data', async () => {
      let callCount = 0;
      storageMock.local.get.mockImplementation((keys, callback) => {
        callCount++;
        const result = callCount === 2
          ? { 'captureai-auth-token': 'old-token' }
          : {};
        if (callback) { callback(result); return undefined; }
        return Promise.resolve(result);
      });

      await Migration.runMigration();

      expect(storageMock.local.remove).toHaveBeenCalledWith([
        'captureai-api-key',
        'captureai-auth-token',
        'captureai-user-email'
      ]);
    });

    test('should update backend URL if it contains YOUR-SUBDOMAIN', async () => {
      let callCount = 0;
      storageMock.local.get.mockImplementation((keys, callback) => {
        callCount++;
        let result;
        if (callCount === 3) {
          result = { 'captureai-backend-url': 'https://YOUR-SUBDOMAIN.workers.dev' };
        } else {
          result = {};
        }
        if (callback) { callback(result); return undefined; }
        return Promise.resolve(result);
      });

      await Migration.runMigration();

      expect(storageMock.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'captureai-backend-url': 'https://api.captureai.workers.dev'
        })
      );
    });

    test('should update backend URL from old domain', async () => {
      let callCount = 0;
      storageMock.local.get.mockImplementation((keys, callback) => {
        callCount++;
        let result;
        if (callCount === 3) {
          result = { 'captureai-backend-url': 'https://backend.captureai.workers.dev' };
        } else {
          result = {};
        }
        if (callback) { callback(result); return undefined; }
        return Promise.resolve(result);
      });

      await Migration.runMigration();

      expect(storageMock.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'captureai-backend-url': 'https://api.captureai.workers.dev'
        })
      );
    });

    test('should set backend URL when none exists', async () => {
      let callCount = 0;
      storageMock.local.get.mockImplementation((keys, callback) => {
        callCount++;
        if (callback) { callback({}); return undefined; }
        return Promise.resolve({});
      });

      await Migration.runMigration();

      expect(storageMock.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'captureai-backend-url': 'https://api.captureai.workers.dev'
        })
      );
    });
  });

  describe('getMigrationNotice', () => {
    test('should return notice when set', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        const result = { 'captureai-migration-notice': 'Please get a license key' };
        if (callback) { callback(result); return undefined; }
        return Promise.resolve(result);
      });

      const notice = await Migration.getMigrationNotice();
      expect(notice).toBe('Please get a license key');
    });

    test('should return null when no notice', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        if (callback) { callback({}); return undefined; }
        return Promise.resolve({});
      });

      const notice = await Migration.getMigrationNotice();
      expect(notice).toBeNull();
    });
  });

  describe('clearMigrationNotice', () => {
    test('should remove the migration notice from storage', async () => {
      await Migration.clearMigrationNotice();

      expect(storageMock.local.remove).toHaveBeenCalledWith('captureai-migration-notice');
    });
  });
});
