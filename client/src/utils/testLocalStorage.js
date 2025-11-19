// Test utility for localStorage functionality
// This can be run in the browser console to test the storage system

import {
  storeProductFields,
  getProductFields,
  getStoredProductFields,
} from "./localProductStorage";

// Test data
const testProductId = "test-product-123";
const testFields = {
  battery_health: 85,
  market_value: 1299.99,
};

// Test storing fields
console.log("Testing storage...");
storeProductFields(testProductId, testFields);

// Test retrieving fields
const retrievedFields = getProductFields(testProductId);
console.log("Retrieved fields:", retrievedFields);

// Test getting all stored fields
const allFields = getStoredProductFields();
console.log("All stored fields:", allFields);

// Verify the data
console.log(
  "Test passed:",
  JSON.stringify(retrievedFields) === JSON.stringify(testFields),
);
