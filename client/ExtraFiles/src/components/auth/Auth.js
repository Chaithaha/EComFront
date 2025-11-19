import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Login from './Login';
import Signup from './Signup';
import './auth.css';

const Auth = ({ onAuthSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { user, loading } = useAuth();

  // Handle mode toggle
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    onAuthSuccess && onAuthSuccess();
  };

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user && !loading) {
      onAuthSuccess && onAuthSuccess();
    }
  }, [user, loading, onAuthSuccess]);

  if (loading) {
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
      <div className="auth-background">
        <div className="auth-background-overlay"></div>
        <div className="auth-background-content">
          <div className="auth-welcome">
            <h1>Welcome to E-Commerce Platform</h1>
            <p>Your one-stop shop for all your needs</p>
          </div>
          <div className="auth-features">
            <div className="feature-item">
              <div className="feature-icon">🛍️</div>
              <div className="feature-text">
                <h3>Wide Selection</h3>
                <p>Thousands of posts across multiple categories</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🚚</div>
              <div className="feature-text">
                <h3>Fast Delivery</h3>
                <p>Quick and reliable shipping to your doorstep</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💳</div>
              <div className="feature-text">
                <h3>Secure Payments</h3>
                <p>Multiple payment options with bank-level security</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎁</div>
              <div className="feature-text">
                <h3>Great Deals</h3>
                <p>Exclusive offers and discounts for our customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-form-wrapper">
        {isLoginMode ? (
          <Login 
            onToggleMode={toggleMode} 
            onLoginSuccess={handleAuthSuccess}
          />
        ) : (
          <Signup 
            onToggleMode={toggleMode} 
            onSignupSuccess={handleAuthSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default Auth;