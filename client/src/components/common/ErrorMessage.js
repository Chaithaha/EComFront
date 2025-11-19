import React from "react";
import "./ErrorMessage.css";

const ErrorMessage = ({ message }) => {
  // Handle both string and object inputs
  const errorMessage =
    typeof message === "string"
      ? message
      : message?.error || message?.message || "An unknown error occurred";

  return (
    <div className="error-message-container">
      <div className="error-icon">⚠️</div>
      <div className="error-message">
        <h3>Oops! Something went wrong</h3>
        <p>{errorMessage}</p>
      </div>
      <button className="retry-button" onClick={() => window.location.reload()}>
        Try Again
      </button>
    </div>
  );
};

export default ErrorMessage;
