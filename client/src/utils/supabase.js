import { createClient } from "@supabase/supabase-js";

// Environment variables with fallbacks for development
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing Supabase configuration. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY in your environment variables.",
  );
  console.error("Current environment variables:", {
    REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
    REACT_APP_SUPABASE_KEY: process.env.REACT_APP_SUPABASE_KEY
      ? "***SET***"
      : "***NOT SET***",
  });
}

// Create Supabase client
const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage, // Let Supabase handle storage
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Error handling utilities
export const handleSupabaseError = (error) => {
  console.error("Supabase error:", error);

  // Handle auth session missing error specifically
  if (error.message?.includes("Auth session missing") || error.code === "400") {
    return {
      success: false,
      error: "No active authentication session. Please sign in.",
      code: "AUTH_SESSION_MISSING",
    };
  }

  if (error.code === "PGRST116") {
    return {
      success: false,
      error: "Authentication required. Please sign in.",
      code: "AUTH_REQUIRED",
    };
  }

  if (error.code === "PGRST301") {
    return {
      success: false,
      error: "Permission denied. You may not have access to this resource.",
      code: "PERMISSION_DENIED",
    };
  }

  return {
    success: false,
    error: error.message || "An unexpected error occurred.",
    code: error.code || "UNKNOWN_ERROR",
  };
};

// Export default instance for backward compatibility
export default supabaseClient;
export { supabaseClient as supabase };
