/**
 * Get the best image URL for a product/post
 * Handles legacy image_url and new images array format with storage paths
 * @param {Object} product - Product or post object (now using unified items structure)
 * @returns {Promise<string|null>} - Image URL or null if no image available
 */
export const getProductImageUrl = async (product) => {
  try {
    console.log("🔍 Getting image URL for product:", {
      productId: product.id,
      hasImageUrl: !!product.image_url,
      hasImages: !!(product.images && product.images.length > 0),
      imagesCount: product.images?.length || 0,
    });

    // If product has a direct image_url (main image)
    if (product.image_url) {
      console.log("✅ Using main image_url:", product.image_url);
      return product.image_url;
    }

    // If product has images array, use the first one
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      console.log("📸 Processing first image:", {
        imageId: firstImage.id,
        hasPublicUrl: !!firstImage.publicUrl,
        hasImageUrl: !!firstImage.image_url,
        hasStoragePath: !!firstImage.storage_path,
      });

      // Priority order: publicUrl > image_url > storage_path
      if (firstImage.publicUrl) {
        console.log("✅ Using image.publicUrl:", firstImage.publicUrl);
        return firstImage.publicUrl;
      }
      if (firstImage.image_url) {
        console.log("✅ Using image.image_url:", firstImage.image_url);
        return firstImage.image_url;
      }
      // If we have storage path, construct a basic URL
      if (firstImage.storage_path) {
        console.log("🔗 Using storage_path directly:", firstImage.storage_path);
        return firstImage.storage_path;
      }
    }

    console.log("⚠️ No image URL found for product:", product.id);
    // Fallback to null - let the component handle missing images
    return null;
  } catch (error) {
    console.error("❌ Error getting image URL:", error);
    return null;
  }
};

/**
 * Get image URLs for multiple storage paths
 * @param {Array} storagePaths - Array of storage paths
 * @returns {Array} - Array of objects with storage_path and publicUrl
 */
export const getImageUrls = (storagePaths) => {
  return storagePaths.map((path) => {
    return {
      storage_path: path,
      publicUrl: path, // Simple fallback - use path directly
      success: true,
      error: null,
    };
  });
};

/**
 * Get battery health color class based on health percentage
 * @param {number} health - Battery health percentage
 * @returns {string} - CSS class name
 */
export const getBatteryHealthColor = (health) => {
  if (health >= 90) return "battery-health-good";
  if (health >= 80) return "battery-health-medium";
  return "battery-health-poor";
};

/**
 * Get battery health label based on health percentage
 * @param {number} health - Battery health percentage
 * @returns {string} - Human readable label
 */
export const getBatteryHealthLabel = (health) => {
  if (health >= 90) return "Excellent";
  if (health >= 80) return "Good";
  if (health >= 70) return "Fair";
  return "Poor";
};

/**
 * Get stock status text based on stock quantity
 * @param {number} stock - Stock quantity
 * @returns {string} - Stock status text
 */
export const getStockStatus = (stock = 1) => {
  if (stock <= 3) return `Only ${stock} left in stock!`;
  if (stock <= 10) return `${stock} available`;
  return "In stock";
};

/**
 * Calculate battery health based on product attributes
 * @param {Object} product - Product object
 * @returns {number} - Calculated battery health percentage
 */
export const calculateBatteryHealth = (product) => {
  // If battery_health exists in the data, use it
  if (product.battery_health !== undefined && product.battery_health !== null) {
    return parseInt(product.battery_health);
  }

  // For electronics, estimate based on category and age
  if (product.category === "electronics") {
    const createdAt = new Date(product.created_at);
    const now = new Date();
    const daysOld = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    // Assume battery health decreases by 1% per month for electronics
    const monthsOld = daysOld / 30;
    const estimatedHealth = Math.max(50, 100 - monthsOld * 2);

    return Math.round(estimatedHealth);
  }

  // For non-electronics, return a default value
  return 85;
};

/**
 * Calculate market value based on product attributes
 * @param {Object} product - Product object
 * @returns {number} - Calculated market value
 */
export const calculateMarketValue = (product) => {
  // If market_value exists in the data, use it
  if (product.market_value !== undefined && product.market_value !== null) {
    return parseFloat(product.market_value);
  }

  const basePrice = parseFloat(product.price) || 0;
  const category = product.category || "electronics";
  const condition = product.condition || "good";
  const batteryHealth = calculateBatteryHealth(product);

  // Base multiplier by category
  const categoryMultipliers = {
    electronics: 1.2,
    clothing: 0.8,
    home: 1.0,
    sports: 1.1,
    books: 0.6,
    other: 0.9,
  };

  // Condition multiplier
  const conditionMultipliers = {
    new: 1.3,
    "like-new": 1.2,
    good: 1.0,
    fair: 0.8,
    poor: 0.6,
  };

  // Battery health multiplier (for electronics)
  const batteryMultiplier =
    category === "electronics" ? batteryHealth / 100 : 1.0;

  const categoryMultiplier = categoryMultipliers[category] || 1.0;
  const conditionMultiplier = conditionMultipliers[condition] || 1.0;

  // Calculate market value
  const marketValue =
    basePrice * categoryMultiplier * conditionMultiplier * batteryMultiplier;

  // Round to 2 decimal places
  return Math.round(marketValue * 100) / 100;
};
