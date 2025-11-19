import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize authentication state with Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setLoading(true);
          
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user);
            console.log("User signed in:", session.user.email);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            console.log("User signed out");
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            setUser(session.user);
            console.log("Token refreshed for user:", session.user.email);
          }
        } catch (err) {
          console.error("Auth state change error:", err);
        } finally {
          setLoading(false);
        }
      }
    );

    // Check initial session
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting initial session:", error);
        } else if (session?.user) {
          setUser(session.user);
          console.log("Initial session found for user:", session.user.email);
        } else {
          console.log("No active session found - user needs to sign in");
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError(
          "Authentication service unavailable. Please check your configuration.",
        );
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use Supabase to sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Supabase logout error:", error);
        setError("Logout failed");
        return { success: false, error: "Logout failed" };
      }

      setUser(null);
      return { success: true };
    } catch (err) {
      console.error("Logout error:", err);
      setError("Logout failed");
      return { success: false, error: "Logout failed" };
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.email === "admin@example.com" || user?.role === "admin";
  };

  // Get user display name
  const getDisplayName = () => {
    return user?.full_name || user?.email || "User";
  };

  // Force refresh authentication state (useful after login)
  const refreshAuth = async () => {
    try {
      setLoading(true);

      // Check current Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error refreshing auth state:", error);
        setUser(null);
      } else if (session?.user) {
        setUser(session.user);
        console.log("Authentication state refreshed:", session.user.email);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error refreshing auth state:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    logout,
    refreshAuth,
    isAdmin,
    getDisplayName,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
