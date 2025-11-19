/**
 * Frontend-only storage for product additional fields
 * This stores battery_health and market_value that users enter during post creation
 */

const STORAGE_KEY = "productAdditionalFields";

/**
 * Store additional fields for a product
 * @param {string} productId - The product ID
 * @param {Object} fields - Additional fields to store (battery_health, market_value)
 */
export const storeProductFields = (productId, fields) => {
  try {
    const existingData = getStoredProductFields();
    existingData[productId] = {
      ...existingData[productId],
      ...fields,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
  } catch (error) {
    console.error("Error storing product fields:", error);
  }
};

/**
 * Get stored additional fields for a product
 * @param {string} productId - The product ID
 * @returns {Object} - Stored fields or empty object
 */
export const getProductFields = (productId) => {
  try {
    const allData = getStoredProductFields();
    return allData[productId] || {};
  } catch (error) {
    console.error("Error getting product fields:", error);
    return {};
  }
};

/**
 * Get all stored product fields
 * @returns {Object} - All stored product fields
 */
export const getStoredProductFields = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error parsing stored product fields:", error);
    return {};
  }
};

/**
 * Remove stored fields for a product
 * @param {string} productId - The product ID
 */
export const removeProductFields = (productId) => {
  try {
    const existingData = getStoredProductFields();
    delete existingData[productId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
  } catch (error) {
    console.error("Error removing product fields:", error);
  }
};

/**
 * Clean up old entries (older than 30 days)
 */
export const cleanupOldEntries = () => {
  try {
    const allData = getStoredProductFields();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const cleanedData = Object.keys(allData).reduce((acc, productId) => {
      if (allData[productId].timestamp > thirtyDaysAgo) {
        acc[productId] = allData[productId];
      }
      return acc;
    }, {});

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedData));
  } catch (error) {
    console.error("Error cleaning up old entries:", error);
  }
};
