/**
 * Omits specified keys from an object
 * @param {Object} obj - The source object
 * @param {string[]} keys - Array of keys to omit
 * @returns {Object} - New object without specified keys
 */
const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

/**
 * Checks if a string is a valid URL
 * @param {string} str - The string to check
 * @returns {boolean} - True if the string is a valid URL
 */
const isUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  omit,
  isUrl
}; 