/**
 * Integration Tests: Migration → Auth Flow
 * Tests migration from old API key system to new license key system
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks, storageMock } = require('../setup/chrome-mock');

let storageState;
global.fetch = jest.fn();

let Migration, AuthService;

beforeEach(() => {
  resetChromeMocks();
  jest.resetModules();
  global.fetch.mockReset();
  storageState = {};

  storageMock.local.get.mockImplementation((keys, callback) => {
    const result = {};
    const keyList = Array.isArray(keys) ? keys : (typeof keys === 'string' ? [keys] : Object.keys(keys || {}));
    keyList.forEach(k => {
      if (storageState[k] !== undefined) {
        result[k] = storageState[k];
      }
    });
    if (callback) { callback(result); return undefined; }
    return Promise.resolve(result);
  });

  storageMock.local.set.mockImplementation((items, callback) => {
    Object.assign(storageState, items);
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  });

  storageMock.local.remove.mockImplementation((keys, callback) => {
    const keyList = Array.isArray(keys) ? keys : [keys];
    keyList.forEach(k => delete storageState[k]);
    if (callback) { callback(); return undefined; }
    return Promise.resolve();
  });

  Migration = require('../../extension/modules/migration.js');
  AuthService = require('../../extension/modules/auth-service.js');
});

describe('Migration → Auth Integration', () => {
  test('should migrate old API key user, then allow new license key activation', async () => {
    // Pre-state: User has old API key
    storageState['captureai-api-key'] = 'sk-old-api-key-12345';
    storageState['captureai-auth-token'] = 'old-jwt-token';
    storageState['captureai-user-email'] = 'old@user.com';

    // Run migration
    const migrated = await Migration.runMigration();
    expect(migrated).toBe(true);

    // Verify old data removed
    expect(storageState['captureai-api-key']).toBeUndefined();
    expect(storageState['captureai-auth-token']).toBeUndefined();
    expect(storageState['captureai-user-email']).toBeUndefined();

    // Verify migration notice set
    const notice = await Migration.getMigrationNotice();
    expect(notice).toContain('license key');

    // Verify backend URL updated
    expect(storageState['captureai-backend-url']).toBe('https://api.captureai.workers.dev');

    // Verify migration marked complete
    expect(storageState['captureai-migration-license-v3-complete']).toBe(true);

    // Running migration again should skip
    const migratedAgain = await Migration.runMigration();
    expect(migratedAgain).toBe(false);

    // User now activates new license key
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        user: { email: 'new@user.com', tier: 'free' }
      }),
      text: async () => '{}'
    });

    await AuthService.validateKey('NEW1-KEY2-KEY3-KEY4-KEY5');

    // Verify new key stored
    expect(storageState['captureai-license-key']).toBe('NEW1-KEY2-KEY3-KEY4-KEY5');
    expect(storageState['captureai-user-email']).toBe('new@user.com');

    // Clear migration notice
    await Migration.clearMigrationNotice();
    const noticeAfter = await Migration.getMigrationNotice();
    expect(noticeAfter).toBeNull();
  });

  test('should handle user without old auth data', async () => {
    // No old data - fresh install
    const migrated = await Migration.runMigration();
    expect(migrated).toBe(true);

    // No migration notice for fresh users
    expect(storageState['captureai-migration-notice']).toBeUndefined();

    // Backend URL should still be set
    expect(storageState['captureai-backend-url']).toBe('https://api.captureai.workers.dev');

    // Should be able to get a free key immediately
    const key = await AuthService.getLicenseKey();
    expect(key).toBeNull(); // No key yet

    const activated = await AuthService.isActivated();
    expect(activated).toBe(false);
  });

  test('should fix old backend.captureai.workers.dev URL during migration', async () => {
    storageState['captureai-backend-url'] = 'https://backend.captureai.workers.dev';

    await Migration.runMigration();

    // URL should be corrected
    expect(storageState['captureai-backend-url']).toBe('https://api.captureai.workers.dev');

    // AuthService should use the corrected URL
    const backendUrl = await AuthService.getBackendUrl();
    expect(backendUrl).toBe('https://api.captureai.workers.dev');
  });
});
