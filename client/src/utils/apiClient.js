import { supabase } from "./supabase";
import { API_URL } from "../config";

// Helper function to get the current authentication token from Supabase
const getAuthToken = async () => {
  try {
    // Get current session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting auth token:", error);
      return null;
    }

    return session?.access_token || null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

const apiClient = {
  async get(endpoint) {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      // Add authorization header if token exists
      const token = await getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, { headers });
      
      // Handle different response types
      let data;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { error: text || "Request failed" };
        }
      }
      
      return {
        success: response.ok,
        data: response.ok ? data : null,
        error: response.ok ? null : (data.error || data.message || `HTTP ${response.status}`),
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message || "Network error. Please try again later.",
      };
    }
  },

  async post(endpoint, data) {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      // Add authorization header if token exists
      const token = await getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      return {
        success: response.ok,
        data: response.ok ? responseData : null,
        error: response.ok ? null : responseData.error,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message || "Network error. Please try again later.",
      };
    }
  },

  async put(endpoint, data) {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      // Add authorization header if token exists
      const token = await getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      return {
        success: response.ok,
        data: response.ok ? responseData : null,
        error: response.ok ? null : responseData.error,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message || "Network error. Please try again later.",
      };
    }
  },

  async delete(endpoint) {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      // Add authorization header if token exists
      const token = await getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "DELETE",
        headers,
      });
      const responseData = await response.json();
      return {
        success: response.ok,
        data: response.ok ? responseData : null,
        error: response.ok
          ? null
          : responseData.error || "Failed to delete resource",
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message || "Network error. Please try again later.",
      };
    }
  },
};

export default apiClient;
