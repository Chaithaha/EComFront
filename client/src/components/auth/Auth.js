import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../common/Button";
import ErrorMessage from "../common/ErrorMessage";
import { supabase } from "../../utils/supabase";
import "./auth.css";

const Auth = ({ onAuthSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  // Handle mode toggle
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError("");
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLoginMode) {
        // Login mode - use direct Supabase authentication
        const email = formData.email || formData.username;
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: formData.password,
        });

        if (error) {
          setError(error.message || "Login failed");
        } else {
          // Supabase automatically handles session storage
          // AuthContext will detect the state change via onAuthStateChange
          handleAuthSuccess();
        }
      } else {
        // Register mode
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters long");
          setLoading(false);
          return;
        }

        // Use direct Supabase signup
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.username
            }
          }
        });

        if (error) {
          setError(error.message || "Registration failed");
        } else {
          // Check if user needs email confirmation
          if (data.user && !data.user.email_confirmed_at) {
            setError("Account created successfully. Please check your email to confirm your account, then login.");
          } else {
            // Auto-login if email confirmation is bypassed
            const { error: loginError } = await supabase.auth.signInWithPassword({
              email: formData.email,
              password: formData.password,
            });

            if (loginError) {
              setError("Account created successfully. Please login with your credentials.");
            } else {
              handleAuthSuccess();
            }
          }
        }
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    // Check for stored redirect path first
    const redirectPath = localStorage.getItem("redirect_after_login");

    if (redirectPath && redirectPath !== "/login") {
      // Remove the stored redirect path
      localStorage.removeItem("redirect_after_login");
      // Redirect to the intended destination
      navigate(redirectPath);
    } else {
      // Default redirect to home page
      navigate("/home");
    }

    // Call the original onAuthSuccess if provided
    onAuthSuccess && onAuthSuccess();
  };

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user && !authLoading) {
      onAuthSuccess && onAuthSuccess();
    }
  }, [user, authLoading, onAuthSuccess]);

  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <h1>Welcome</h1>
          <p>Your journey to amazing products starts here</p>
        </div>
      </div>

      <div className="auth-form-wrapper">
        <div className="auth-form">
          <h2>{isLoginMode ? "Sign In" : "Sign Up"}</h2>
          <p>
            {isLoginMode
              ? "Welcome back! Please sign in to your account."
              : "Create your account to get started"}
          </p>

          {error && <ErrorMessage message={error} />}

          <form onSubmit={handleSubmit} className="auth-form-fields">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="Enter your username"
              />
            </div>

            {!isLoginMode && (
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required={!isLoginMode}
                  placeholder="Enter your email"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your password"
              />
            </div>

            {!isLoginMode && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!isLoginMode}
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? "Processing..." : isLoginMode ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <button className="toggle-auth-button" onClick={toggleMode}>
            {isLoginMode
              ? "Need an account? Sign Up"
              : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
