/**
 * Authentication Service for CaptureAI Extension (License Key System)
 * Handles communication with backend API using license keys
 */

const AuthService = {
  /**
   * Default backend URL (production Cloudflare Workers)
   */
  DEFAULT_BACKEND_URL: 'https://api.captureai.workers.dev',

  /**
   * Default request timeout in milliseconds
   */
  REQUEST_TIMEOUT: 30000,

  /**
   * Storage key for the user cache
   */
  CACHE_KEY: 'captureai-user-cache',

  /**
   * Cache freshness threshold - popup skips background refresh if within this
   */
  CACHE_FRESHNESS_MS: 5 * 60 * 1000, // 5 minutes

  /**
   * Cache hard expiry - force synchronous API check if older
   */
  CACHE_MAX_AGE_MS: 60 * 60 * 1000, // 1 hour

  /**
   * Fetch with timeout using AbortController
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<Response>}
   */
  async fetchWithTimeout(url, options = {}, timeout = this.REQUEST_TIMEOUT) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(id);
    }
  },

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
      const response = await this.fetchWithTimeout(`${backendUrl}/api/auth/validate-key`, {
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
        'captureai-user-tier',
        this.CACHE_KEY,
        'captureai-last-usage'
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

    const response = await this.fetchWithTimeout(`${backendUrl}/api/auth/me`, {
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

    // Update stored user info and cache
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        'captureai-user-email': user.email,
        'captureai-user-tier': user.tier
      });
      await this.setCachedUser(user);
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

    const response = await this.fetchWithTimeout(`${backendUrl}/api/ai/usage`, {
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
   * @param {string} params.ocrText - OCR extracted text (optional)
   * @param {number} params.ocrConfidence - OCR confidence percentage (optional)
   * @param {string} params.promptType - Prompt type (answer, auto_solve, ask)
   * @param {number} params.reasoningLevel - Reasoning level (0, 1, 2)
   * @returns {Promise<Object>} { answer, usage, cached, responseTime }
   */
  async sendAIRequest({ question, imageData, ocrText, ocrConfidence, promptType, reasoningLevel }) {
    const backendUrl = await this.getBackendUrl();
    const licenseKey = await this.getLicenseKey();

    if (!licenseKey) {
      throw new Error('No license key. Please activate CaptureAI.');
    }

    try {
      const response = await this.fetchWithTimeout(`${backendUrl}/api/ai/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `LicenseKey ${licenseKey}`,
          'Content-Type': 'application/json',
          'Priority': 'u=1'
        },
        body: JSON.stringify({
          question,
          imageData,
          ocrText,
          ocrConfidence,
          promptType,
          reasoningLevel
        })
      }, 60000);

      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch (parseError) {
          // If response isn't JSON, use status text
          throw new Error(`AI request failed (HTTP ${response.status}): ${response.statusText}. Backend may be down or misconfigured.`);
        }

        if (response.status === 429) {
          // Rate limit exceeded - backend returns specific messages
          throw new Error(error.error || 'Rate limit exceeded');
        }

        if (response.status === 401 || response.status === 403) {
          // Auth error - clear invalid key
          await this.clearKey();
          throw new Error('License key is invalid or expired. Please reactivate.');
        }

        if (response.status === 500) {
          throw new Error(`Backend error: ${error.error || 'Internal server error. Please try again later.'}`);
        }

        if (response.status === 503) {
          throw new Error('Backend is temporarily unavailable. Please try again later.');
        }

        throw new Error(error.error || `AI request failed (HTTP ${response.status})`);
      }

      return await response.json();
    } catch (error) {
      // Timeout errors
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. The server may be overloaded. Please try again.');
      }
      // Network errors (fetch failed completely)
      if (error.message.includes('fetch') || error.message.includes('network') || error.name === 'TypeError') {
        throw new Error(`Network error: Cannot reach backend at ${backendUrl}. Check your internet connection.`);
      }
      // Re-throw our custom errors
      throw error;
    }
  },

  /**
   * Create subscription checkout session
   * @param {string} email - User's email address
   * @returns {Promise<Object>} { url } - Stripe checkout URL
   */
  async createCheckoutSession(email) {
    const backendUrl = await this.getBackendUrl();

    const response = await this.fetchWithTimeout(`${backendUrl}/api/subscription/create-checkout`, {
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

    const response = await this.fetchWithTimeout(`${backendUrl}/api/subscription/portal`, {
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
    const response = await this.fetchWithTimeout(`${backendUrl}/api/subscription/plans`);

    if (!response.ok) {
      throw new Error('Failed to fetch plans');
    }

    return await response.json();
  },

  /**
   * Read cached user data from chrome.storage.local
   * @returns {Promise<Object|null>} Cached user object with updatedAt, or null
   */
  async getCachedUser() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(this.CACHE_KEY);
      return result[this.CACHE_KEY] || null;
    }
    return null;
  },

  /**
   * Write user data to cache with current timestamp
   * @param {Object} user - User object from API (must have email, tier)
   * @returns {Promise<void>}
   */
  async setCachedUser(user) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        [this.CACHE_KEY]: {
          email: user.email,
          tier: user.tier,
          updatedAt: Date.now(),
          userData: user
        }
      });
    }
  },

  /**
   * Clear the user cache
   * @returns {Promise<void>}
   */
  async clearCachedUser() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.remove(this.CACHE_KEY);
    }
  },

  /**
   * In-flight refresh promise to deduplicate concurrent refresh calls
   */
  _refreshInFlight: null,

  /**
   * Refresh the cache by calling the API and storing the result.
   * Deduplicates concurrent calls - if a refresh is already in-flight, reuses it.
   * @returns {Promise<Object|null>} Fresh user object, or null on failure
   */
  async refreshUserCache() {
    if (this._refreshInFlight) {
      return this._refreshInFlight;
    }

    this._refreshInFlight = this.getCurrentUser()
      .catch(() => null)
      .finally(() => { this._refreshInFlight = null; });

    return this._refreshInFlight;
  },

  /**
   * Get user from cache, falling back to API if cache is missing or expired.
   * @param {Object} [options]
   * @param {boolean} [options.allowStale=false] - If true, return stale cache without API call
   * @returns {Promise<{user: Object|null, fromCache: boolean, needsRefresh: boolean}>}
   */
  async getCachedOrFreshUser({ allowStale = false } = {}) {
    const cached = await this.getCachedUser();

    if (cached && cached.updatedAt) {
      const age = Date.now() - cached.updatedAt;

      // Cache is fresh - return immediately, no refresh needed
      if (age < this.CACHE_FRESHNESS_MS) {
        return { user: cached.userData, fromCache: true, needsRefresh: false };
      }

      // Cache is stale but not expired - return it, flag for background refresh
      if (age < this.CACHE_MAX_AGE_MS) {
        return { user: cached.userData, fromCache: true, needsRefresh: true };
      }

      // Cache expired, but caller accepts stale data (e.g., background.js auth check)
      if (allowStale) {
        return { user: cached.userData, fromCache: true, needsRefresh: true };
      }
    }

    // No cache or hard-expired: must call API synchronously
    try {
      const user = await this.getCurrentUser();
      return { user, fromCache: false, needsRefresh: false };
    } catch {
      return { user: null, fromCache: false, needsRefresh: false };
    }
  },

  /**
   * Check if user has a valid license key
   * @returns {Promise<boolean>} True if has valid key
   */
  async isActivated() {
    const licenseKey = await this.getLicenseKey();
    if (!licenseKey) return false;

    // Try cache first to avoid blocking API call
    const cached = await this.getCachedUser();
    if (cached && cached.updatedAt) {
      const age = Date.now() - cached.updatedAt;
      if (age < this.CACHE_MAX_AGE_MS) {
        return true;
      }
    }

    // Cache missing or expired: fall back to API call
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

    const response = await this.fetchWithTimeout(`${backendUrl}/api/auth/create-free-key`, {
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
