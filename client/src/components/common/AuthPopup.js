import React, { useEffect, useState } from "react";
import "./AuthPopup.css";

const AuthPopup = ({ isAuthenticated, username, isVisible, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);

      // Auto-close after 1 second
      const timer = setTimeout(() => {
        setIsAnimating(false);
        // Allow time for fade out animation before calling onClose
        setTimeout(() => {
          onClose();
        }, 300);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const message = isAuthenticated
    ? "✅ Successfully authenticated"
    : "⚠️ Please log in to create posts";

  const popupClass = isAuthenticated
    ? "auth-popup auth-popup--success"
    : "auth-popup auth-popup--warning";

  return (
    <div
      className={`auth-popup-overlay ${isAnimating ? "auth-popup-overlay--visible" : ""}`}
    >
      <div className={popupClass}>
        <span className="auth-popup-icon">{isAuthenticated ? "✓" : "!"}</span>
        <span className="auth-popup-message">{message}</span>
      </div>
    </div>
  );
};

export default AuthPopup;
