/**
 * Migration Module for CaptureAI Extension (License Key System)
 * Handles one-time migration from API key based system to license key system
 */

const Migration = {
  /**
   * Migration version key (v2: fixes backend URL)
   */
  MIGRATION_KEY: 'captureai-migration-license-v2-complete',

  /**
   * Run migration if not already completed
   * @returns {Promise<boolean>} True if migration was run, false if already completed
   */
  async runMigration() {
    // Check if migration already completed
    const result = await chrome.storage.local.get(this.MIGRATION_KEY);

    if (result[this.MIGRATION_KEY]) {
      console.log('[Migration] Already completed, skipping...');
      return false;
    }

    console.log('[Migration] Starting migration to license key system...');

    // Check if user had an API key or old auth token stored
    const oldData = await chrome.storage.local.get([
      'captureai-api-key',
      'captureai-auth-token'
    ]);

    const hadOldAuth = !!(oldData['captureai-api-key'] || oldData['captureai-auth-token']);

    if (hadOldAuth) {
      console.log('[Migration] Found old authentication, setting migration notice...');

      // Set a notice for the user
      await chrome.storage.local.set({
        'captureai-migration-notice': 'CaptureAI now uses license keys! Get your free license key to continue using the extension.'
      });
    }

    // Remove old authentication data
    await chrome.storage.local.remove([
      'captureai-api-key',
      'captureai-auth-token',
      'captureai-user-email',
      'captureai-user-tier'
    ]);

    // Force update backend URL to correct production URL
    const backendUrlResult = await chrome.storage.local.get('captureai-backend-url');
    const currentUrl = backendUrlResult['captureai-backend-url'];

    // Update if not set or if it's the old placeholder URL
    if (!currentUrl || currentUrl.includes('YOUR-SUBDOMAIN')) {
      await chrome.storage.local.set({
        'captureai-backend-url': 'https://api.captureai.dev'
      });
      console.log('[Migration] Updated backend URL to production');
    }

    // Mark migration as complete
    await chrome.storage.local.set({ [this.MIGRATION_KEY]: true });

    console.log('[Migration] Migration completed successfully');
    return true;
  },

  /**
   * Check if migration notice needs to be shown
   * @returns {Promise<string|null>} Migration notice or null
   */
  async getMigrationNotice() {
    const result = await chrome.storage.local.get('captureai-migration-notice');
    return result['captureai-migration-notice'] || null;
  },

  /**
   * Clear migration notice (after user has seen it)
   * @returns {Promise<void>}
   */
  async clearMigrationNotice() {
    await chrome.storage.local.remove('captureai-migration-notice');
  },

  /**
   * Reset migration (for testing purposes only)
   * @returns {Promise<void>}
   */
  async resetMigration() {
    await chrome.storage.local.remove([
      this.MIGRATION_KEY,
      'captureai-migration-notice',
      'captureai-license-key',
      'captureai-user-email',
      'captureai-user-tier'
    ]);
    console.log('[Migration] Migration reset complete');
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Migration;
}

// Make available globally for background scripts
if (typeof window !== 'undefined') {
  window.Migration = Migration;
}
