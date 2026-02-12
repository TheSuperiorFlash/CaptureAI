/**
 * Storage utility functions for Chrome extension storage
 */

/**
 * Set a value in Chrome storage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {Promise<void>}
 */
export function setValue(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

/**
 * Get a value from Chrome storage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key not found
 * @returns {Promise<*>}
 */
export function getValue(key, defaultValue = null) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] !== undefined ? result[key] : defaultValue);
    });
  });
}

/**
 * Get multiple values from Chrome storage
 * @param {string[]} keys - Array of storage keys
 * @returns {Promise<Object>}
 */
export function getValues(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

/**
 * Remove a value from Chrome storage
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export function removeValue(key) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, resolve);
  });
}

/**
 * Clear all Chrome storage
 * @returns {Promise<void>}
 */
export function clear() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(resolve);
  });
}

// Export as object for backward compatibility
export const StorageUtils = {
  setValue,
  getValue,
  getValues,
  removeValue,
  clear
};
