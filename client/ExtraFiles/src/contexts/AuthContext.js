import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, handleSupabaseError } from '../utils/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Check if auth object exists
        if (!auth || typeof auth.getUser !== 'function') {
          console.warn('Auth service not available');
          setLoading(false);
          return;
        }
        
        // First check if we have a stored session
        const result = await auth.getUser();
        
        if (result.success && result.data) {
          setUser(result.data);
          console.log('User authenticated:', result.data.email);
        } else {
          // Handle different error scenarios
          if (result.error?.code === 'SUPABASE_NOT_CONFIGURED') {
            console.log('Supabase not configured - using mock mode');
          } else if (result.error?.code === 'AUTH_SESSION_MISSING' || result.error?.message?.includes('Auth session missing')) {
            console.log('No active session found - user needs to sign in');
          } else if (result.error) {
            console.warn('Auth initialization error:', result.error);
            setError(result.error || 'Authentication failed. Please sign in.');
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        
        // Handle specific Supabase auth errors
        if (err.message?.includes('Auth session missing') || err.code === 'AUTH_SESSION_MISSING') {
          console.log('No active session - this is normal for new users');
        } else if (err.code !== 'SUPABASE_NOT_CONFIGURED') {
          setError('Authentication service unavailable. Please check your configuration.');
        }
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure Supabase client is fully initialized
    const timer = setTimeout(initializeAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setError(null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setError(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Attempt to recover session on app load
  useEffect(() => {
    const recoverSession = async () => {
      try {
        // Check if we have a stored session
        const storedSession = localStorage.getItem('supabase.auth.token');
        if (storedSession) {
          console.log('Found stored session, attempting recovery');
          const result = await auth.getUser();
          if (result.success && result.data) {
            setUser(result.data);
            console.log('Session recovered successfully');
          }
        }
      } catch (err) {
        console.log('Session recovery failed:', err);
        // This is expected if no valid session exists
      }
    };

    // Only run recovery after initial auth check
    const timer = setTimeout(recoverSession, 500);
    return () => clearTimeout(timer);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await auth.signIn(email, password);
      
      if (result.success) {
        setUser(result.data?.user || null);
        return { success: true, data: result.data };
      } else {
        // For mock client, show the error message but don't set it as a state error
        if (result.error?.code === 'SUPABASE_NOT_CONFIGURED') {
          console.log('Login attempted but Supabase not configured:', result.error.message);
        } else {
          setError(result.error);
        }
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorResult = handleSupabaseError(err);
      if (errorResult.error?.code !== 'SUPABASE_NOT_CONFIGURED' && errorResult.error?.code !== 'AUTH_SESSION_MISSING') {
        setError(errorResult.error);
      }
      return { success: false, error: errorResult.error };
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (email, password, metadata = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await auth.signUp(email, password, metadata);
      
      if (result.success) {
        setUser(result.data?.user || null);
        return { success: true, data: result.data };
      } else {
        // For mock client, show the error message but don't set it as a state error
        if (result.error?.code === 'SUPABASE_NOT_CONFIGURED') {
          console.log('Signup attempted but Supabase not configured:', result.error.message);
        } else {
          setError(result.error);
        }
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorResult = handleSupabaseError(err);
      if (errorResult.error?.code !== 'SUPABASE_NOT_CONFIGURED') {
        setError(errorResult.error);
      }
      return { success: false, error: errorResult.error };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await auth.signOut();
      
      if (result.success) {
        setUser(null);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorResult = handleSupabaseError(err);
      setError(errorResult.error);
      return { success: false, error: errorResult.error };
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.email === 'admin@example.com' || user?.role === 'admin';
  };

  // Get user display name
  const getDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email || 'User';
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAdmin,
    getDisplayName,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;