import React from "react";

/**
 * Fallback image handling utility with multiple strategies
 */

// Fallback image URLs (you can customize these)
const FALLBACK_STRATEGIES = {
  // Placeholder images from various sources
  placeholderImages: [
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+",
    "https://via.placeholder.com/300x200/cccccc/999999?text=Image+Not+Available",
    "https://picsum.photos/seed/fallback/300/200.jpg",
  ],

  // Category-specific fallback images
  categoryImages: {
    Electronics:
      "https://via.placeholder.com/300x200/4a90e2/ffffff?text=Electronics",
    Clothing: "https://via.placeholder.com/300x200/e24a90/ffffff?text=Clothing",
    "Home & Garden":
      "https://via.placeholder.com/300x200/90e24a/ffffff?text=Home+Garden",
    "Sports & Outdoors":
      "https://via.placeholder.com/300x200/e2a04a/ffffff?text=Sports",
    Books: "https://via.placeholder.com/300x200/a04ae2/ffffff?text=Books",
    "Toys & Games":
      "https://via.placeholder.com/300x200/e24a4a/ffffff?text=Toys",
    Automotive:
      "https://via.placeholder.com/300x200/4ae2a0/ffffff?text=Automotive",
    "Health & Beauty":
      "https://via.placeholder.com/300x200/e24aa0/ffffff?text=Beauty",
    Other: "https://via.placeholder.com/300x200/cccccc/999999?text=Other",
  },
};

/**
 * Get fallback image URL with multiple strategies
 * @param {Object} product - Product object to determine category
 * @param {number} attempt - Current attempt number (for cycling through strategies)
 * @returns {string} Fallback image URL
 */
export const getFallbackImageUrl = (product, attempt = 0) => {
  console.log("🔄 Getting fallback image:", {
    productId: product?.id,
    category: product?.category,
    attempt,
  });

  // Strategy 1: Category-specific fallback
  if (
    product?.category &&
    FALLBACK_STRATEGIES.categoryImages[product.category]
  ) {
    console.log("📂 Using category-specific fallback for:", product.category);
    return FALLBACK_STRATEGIES.categoryImages[product.category];
  }

  // Strategy 2: Cycle through placeholder images
  const placeholderIndex =
    attempt % FALLBACK_STRATEGIES.placeholderImages.length;
  const fallbackUrl = FALLBACK_STRATEGIES.placeholderImages[placeholderIndex];

  console.log("🖼️ Using placeholder fallback:", {
    index: placeholderIndex,
    url: fallbackUrl,
  });

  return fallbackUrl;
};

/**
 * Test if a URL is accessible
 * @param {string} url - URL to test
 * @returns {Promise<boolean>} True if URL is accessible
 */
export const testImageUrl = async (url) => {
  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
    });
    return true;
  } catch (error) {
    console.warn("⚠️ Image URL test failed:", url, error.message);
    return false;
  }
};

/**
 * Get working fallback image with retry logic
 * @param {Object} product - Product object
 * @param {number} maxAttempts - Maximum number of attempts
 * @returns {Promise<string>} Working fallback image URL
 */
export const getWorkingFallbackImage = async (product, maxAttempts = 3) => {
  console.log("🔍 Searching for working fallback image...");

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const fallbackUrl = getFallbackImageUrl(product, attempt);

    console.log(
      `🧪 Testing fallback image (attempt ${attempt + 1}):`,
      fallbackUrl,
    );

    // For data URLs and certain placeholder services, skip the test and return directly
    if (
      fallbackUrl.startsWith("data:image/") ||
      fallbackUrl.includes("via.placeholder.com") ||
      fallbackUrl.includes("picsum.photos")
    ) {
      console.log("✅ Using trusted fallback image:", fallbackUrl);
      return fallbackUrl;
    }

    // Test other URLs
    const isAccessible = await testImageUrl(fallbackUrl);
    if (isAccessible) {
      console.log("✅ Found working fallback image:", fallbackUrl);
      return fallbackUrl;
    }
  }

  // If all attempts fail, return the first placeholder
  console.warn("⚠️ All fallback attempts failed, using default placeholder");
  return FALLBACK_STRATEGIES.placeholderImages[0];
};

/**
 * Image fallback component hook
 * @param {Object} product - Product object
 * @returns {Object} Fallback state and methods
 */
export const useImageFallback = (product) => {
  const [fallbackAttempt, setFallbackAttempt] = React.useState(0);
  const [isUsingFallback, setIsUsingFallback] = React.useState(false);
  const [fallbackUrl, setFallbackUrl] = React.useState(null);

  const handleImageError = React.useCallback(async () => {
    console.log("🔄 Image load failed, attempting fallback...");

    try {
      const workingFallback = await getWorkingFallbackImage(
        product,
        fallbackAttempt + 1,
      );
      setFallbackUrl(workingFallback);
      setIsUsingFallback(true);
      setFallbackAttempt((prev) => prev + 1);
    } catch (error) {
      console.error("❌ Failed to get fallback image:", error);
    }
  }, [product, fallbackAttempt]);

  const resetFallback = React.useCallback(() => {
    setFallbackAttempt(0);
    setIsUsingFallback(false);
    setFallbackUrl(null);
  }, []);

  return {
    fallbackUrl,
    isUsingFallback,
    fallbackAttempt,
    handleImageError,
    resetFallback,
  };
};

export default {
  getFallbackImageUrl,
  testImageUrl,
  getWorkingFallbackImage,
  useImageFallback,
};
