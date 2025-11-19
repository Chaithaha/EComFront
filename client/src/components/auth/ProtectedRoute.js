import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if we have an auth session missing error
    const hasAuthError =
      localStorage.getItem("auth_error") === "AUTH_SESSION_MISSING";
    if (hasAuthError) {
      // Clear the error and continue with normal flow
      localStorage.removeItem("auth_error");
    }

    // Simulate checking authentication state
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading || isChecking) {
    return <LoadingSpinner />;
  }

  if (!user) {
    // Store the current location for redirect after login
    localStorage.setItem("redirect_after_login", window.location.pathname);
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    // Redirect to home if admin access is required but user is not admin
    return <Navigate to="/" replace />;
  }

  // Render the protected component
  return children;
};

export default ProtectedRoute;
