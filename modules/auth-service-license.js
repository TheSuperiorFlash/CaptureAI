/**
 * Authentication Service for CaptureAI Extension (License Key System)
 * Handles communication with backend API using license keys
 */

const AuthService = {
  /**
   * Default backend URL (production Cloudflare Workers)
   */
  DEFAULT_BACKEND_URL: 'https://backend.captureai.workers.dev',

  /**
   * Get backend URL from storage
   * @returns {Promise<string>} Backend URL
   */
  async getBackendUrl() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get('captureai-backend-url');
      return result['captureai-backend-url'] || this.DEFAULT_BACKEND_URL;
    }
    return this.DEFAULT_BACKEND_URL;
  },

  /**
   * Get stored license key
   * @returns {Promise<string|null>} License key or null
   */
  async getLicenseKey() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get('captureai-license-key');
      return result['captureai-license-key'] || null;
    }
    return null;
  },

  /**
   * Validate and activate license key
   * @param {string} licenseKey - The license key to validate
   * @returns {Promise<Object>} User data
   */
  async validateKey(licenseKey) {
    const backendUrl = await this.getBackendUrl();

    try {
      const response = await fetch(`${backendUrl}/api/auth/validate-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey })
      });

      // Check content type to see if we got JSON or HTML
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error(`Backend returned non-JSON response. Check backend URL: ${backendUrl}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid license key');
      }

      // Store license key and user info
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          'captureai-license-key': licenseKey,
          'captureai-user-email': data.user.email,
          'captureai-user-tier': data.user.tier
        });
      }

      return data.user;
    } catch (error) {
      // If it's already our error, rethrow it
      if (error.message.includes('Backend returned')) {
        throw error;
      }
      // Otherwise, it might be a network error or parsing error
      throw new Error(`Validation failed: ${error.message}. Check if backend is running at ${backendUrl}`);
    }
  },

  /**
   * Clear license key (logout)
   * @returns {Promise<void>}
   */
  async clearKey() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.remove([
        'captureai-license-key',
        'captureai-user-email',
        'captureai-user-tier'
      ]);
    }
  },

  /**
   * Get current user information
   * @returns {Promise<Object>} User object
   */
  async getCurrentUser() {
    const backendUrl = await this.getBackendUrl();
    const licenseKey = await this.getLicenseKey();

    if (!licenseKey) {
      throw new Error('No license key found');
    }

    const response = await fetch(`${backendUrl}/api/auth/me`, {
      headers: {
        'Authorization': `LicenseKey ${licenseKey}`
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Invalid key, clear it
        await this.clearKey();
        throw new Error('License key is invalid or expired');
      }
      throw new Error('Failed to fetch user info');
    }

    const user = await response.json();

    // Update stored user info
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        'captureai-user-email': user.email,
        'captureai-user-tier': user.tier
      });
    }

    return user;
  },

  /**
   * Get current usage statistics
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsage() {
    const backendUrl = await this.getBackendUrl();
    const licenseKey = await this.getLicenseKey();

    if (!licenseKey) {
      throw new Error('No license key found');
    }

    const response = await fetch(`${backendUrl}/api/ai/usage`, {
      headers: {
        'Authorization': `LicenseKey ${licenseKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch usage statistics');
    }

    return await response.json();
  },

  /**
   * Send AI request to backend
   * @param {Object} params - Request parameters
   * @param {string} params.question - User question (optional)
   * @param {string} params.imageData - Base64 image data (optional)
   * @param {string} params.promptType - Prompt type (answer, auto_solve, ask)
   * @param {number} params.reasoningLevel - Reasoning level (0, 1, 2)
   * @returns {Promise<Object>} { answer, usage, cached, responseTime }
   */
  async sendAIRequest({ question, imageData, promptType, reasoningLevel }) {
    const backendUrl = await this.getBackendUrl();
    const licenseKey = await this.getLicenseKey();

    if (!licenseKey) {
      throw new Error('No license key. Please activate CaptureAI.');
    }

    const response = await fetch(`${backendUrl}/api/ai/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `LicenseKey ${licenseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question,
        imageData,
        promptType,
        reasoningLevel
      })
    });

    if (!response.ok) {
      const error = await response.json();

      if (response.status === 429) {
        // Rate limit exceeded - backend returns specific messages
        throw new Error(error.error || 'Rate limit exceeded');
      }

      if (response.status === 401 || response.status === 403) {
        // Auth error - clear invalid key
        await this.clearKey();
        throw new Error('License key is invalid or expired. Please reactivate.');
      }

      throw new Error(error.error || 'AI request failed');
    }

    return await response.json();
  },

  /**
   * Create subscription checkout session
   * @param {string} email - User's email address
   * @returns {Promise<Object>} { url } - Stripe checkout URL
   */
  async createCheckoutSession(email) {
    const backendUrl = await this.getBackendUrl();

    const response = await fetch(`${backendUrl}/api/subscription/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    return await response.json();
  },

  /**
   * Get subscription portal URL (for managing subscription)
   * @returns {Promise<Object>} { url } - Stripe portal URL
   */
  async getPortalUrl() {
    const backendUrl = await this.getBackendUrl();
    const licenseKey = await this.getLicenseKey();

    if (!licenseKey) {
      throw new Error('No license key found');
    }

    const response = await fetch(`${backendUrl}/api/subscription/portal`, {
      headers: {
        'Authorization': `LicenseKey ${licenseKey}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get portal URL');
    }

    return await response.json();
  },

  /**
   * Get available subscription plans
   * @returns {Promise<Object>} { plans } - Array of plans
   */
  async getPlans() {
    const backendUrl = await this.getBackendUrl();
    const response = await fetch(`${backendUrl}/api/subscription/plans`);

    if (!response.ok) {
      throw new Error('Failed to fetch plans');
    }

    return await response.json();
  },

  /**
   * Check if user has a valid license key
   * @returns {Promise<boolean>} True if has valid key
   */
  async isActivated() {
    const licenseKey = await this.getLicenseKey();
    if (!licenseKey) return false;

    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Request a free license key
   * @param {string} email - Optional email to receive the key
   * @returns {Promise<string>} The generated license key
   */
  async requestFreeKey(email) {
    const backendUrl = await this.getBackendUrl();

    const response = await fetch(`${backendUrl}/api/auth/create-free-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email || undefined })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create free key');
    }

    const data = await response.json();

    // Automatically activate the key
    await this.validateKey(data.licenseKey);

    return data.licenseKey;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthService;
}

// Make available globally for content scripts
if (typeof window !== 'undefined') {
  window.AuthService = AuthService;
}
