/**
 * LocalStorage utilities for MetricTree state management
 */

/**
 * Generate storage key for a specific page and state type
 * @param {string} currentPage - The current page ID
 * @param {string} key - The state key (e.g., 'expandedMetrics', 'viewNodes')
 * @returns {string} The storage key
 */
export const getStorageKey = (currentPage, key) => {
  return `metricTreeState-${currentPage}-${key}`;
};

/**
 * Load state from localStorage with error handling
 * @param {string} currentPage - The current page ID
 * @param {string} key - The state key
 * @param {*} defaultValue - Default value if not found or parse fails
 * @returns {*} The parsed state or default value
 */
export const loadState = (currentPage, key, defaultValue) => {
  try {
    const storageKey = getStorageKey(currentPage, key);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      return JSON.parse(saved);
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Save state to localStorage with error handling
 * @param {string} currentPage - The current page ID
 * @param {string} key - The state key
 * @param {*} value - The value to save
 */
export const saveState = (currentPage, key, value) => {
  try {
    const storageKey = getStorageKey(currentPage, key);
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

/**
 * Clear all state for a specific page
 * @param {string} currentPage - The current page ID
 */
export const clearPageState = (currentPage) => {
  const keys = ['fullState', 'expandedMetrics', 'viewNodes', 'manuallyMovedViewNodes', 'hiddenNodes', 'snapshotDate'];
  keys.forEach(key => {
    try {
      const storageKey = getStorageKey(currentPage, key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Error clearing ${key} from localStorage:`, error);
    }
  });
};

/**
 * Load full MetricTree state from localStorage
 * @param {string} currentPage - The current page ID
 * @returns {Object|null} The full state or null if not found
 */
export const loadFullState = (currentPage) => {
  return loadState(currentPage, 'fullState', null);
};

/**
 * Save full MetricTree state to localStorage (for React Flow's toObject() format)
 * @param {string} currentPage - The current page ID
 * @param {Object} state - The full state object
 */
export const saveFullState = (currentPage, state) => {
  saveState(currentPage, 'fullState', state);
};
