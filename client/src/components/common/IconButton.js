import React from "react";
import "../../styles/common.css";

/**
 * Reusable IconButton component for icon-only buttons
 */
const IconButton = ({
  children,
  onClick,
  disabled = false,
  type = "button",
  className = "",
  ...props
}) => {
  const buttonClasses = ["btn-icon", className].filter(Boolean).join(" ");

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;
