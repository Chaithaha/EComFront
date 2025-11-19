import React from "react";
import "../../styles/common.css";

/**
 * Reusable Button component with consistent styling
 */
const Button = ({
  children,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  onClick,
  disabled = false,
  type = "button",
  className = "",
  ...props
}) => {
  const buttonClasses = [
    "btn-base",
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? "btn-full-width" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

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

export default Button;
