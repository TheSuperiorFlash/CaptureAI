/**
 * General utility functions
 */

export const Utils = {
  /**
         * Debounce function to limit execution frequency (optimized)
         * @param {Function} func - Function to debounce
         * @param {number} wait - Wait time in milliseconds
         * @returns {Function}
         */
  debounce(func, wait) {
    let timeout;
    let lastCallTime = 0;

    return function executedFunction(...args) {
      const now = Date.now();
      const shouldExecute = now - lastCallTime >= wait;

      const later = () => {
        clearTimeout(timeout);
        lastCallTime = Date.now();
        func.apply(this, args);
      };

      clearTimeout(timeout);

      if (shouldExecute) {
        later();
      } else {
        timeout = setTimeout(later, wait - (now - lastCallTime));
      }
    };
  },

  /**
         * Generate a unique ID
         * @returns {string}
         */
  generateId() {
    return 'captureai_' + Math.random().toString(36).substr(2, 9);
  },

  /**
         * Create a promise that resolves after specified time
         * @param {number} ms - Milliseconds to wait
         * @returns {Promise<void>}
         */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
         * Check if element is visible
         * @param {HTMLElement} element - Element to check
         * @returns {boolean}
         */
  isElementVisible(element) {
    if (!element) {
      return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 &&
                   getComputedStyle(element).display !== 'none' &&
                   getComputedStyle(element).visibility !== 'hidden';
  },

  /**
         * Sanitize HTML content
         * @param {string} html - HTML string to sanitize
         * @returns {string}
         */
  sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },

  /**
         * Get element coordinates relative to viewport
         * @param {HTMLElement} element - Element to get coordinates for
         * @returns {Object}
         */
  getElementCoordinates(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height
    };
  },

  /**
         * Check if coordinates are within viewport
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @returns {boolean}
         */
  isInViewport(x, y) {
    return x >= 0 && x <= window.innerWidth &&
                   y >= 0 && y <= window.innerHeight;
  },

  /**
         * Check if ask mode is currently active
         * @returns {boolean}
         */
  isAskModeActive() {
    const askModeContainer = document.getElementById('ask-mode-container');
    return askModeContainer && askModeContainer.style.display !== 'none';
  }
};
