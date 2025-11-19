// Security utilities for input validation and sanitization

// Input sanitization functions
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
};

export const sanitizeHTML = (input) => {
  if (typeof input !== "string") return input;

  // Basic HTML sanitization - remove tags but preserve basic formatting
  return input
    .replace(/<[^>]*>/g, " ") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
};

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
export const isStrongPassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

// Input validation for forms
export const validateFormInput = (value, type, options = {}) => {
  switch (type) {
    case "email":
      if (!value) return { valid: false, error: "Email is required" };
      if (!isValidEmail(value))
        return { valid: false, error: "Please enter a valid email address" };
      return { valid: true };

    case "password":
      if (!value) return { valid: false, error: "Password is required" };
      if (value.length < 8)
        return {
          valid: false,
          error: "Password must be at least 8 characters long",
        };
      if (options.requireStrong && !isStrongPassword(value)) {
        return {
          valid: false,
          error:
            "Password must contain uppercase, lowercase, number, and special character",
        };
      }
      return { valid: true };

    case "text":
      if (!value) return { valid: false, error: "This field is required" };
      if (value.length < 2)
        return { valid: false, error: "Must be at least 2 characters long" };
      if (value.length > 500)
        return { valid: false, error: "Must be less than 500 characters" };
      return { valid: true };

    case "number":
      if (!value) return { valid: false, error: "This field is required" };
      const num = parseFloat(value);
      if (isNaN(num))
        return { valid: false, error: "Please enter a valid number" };
      if (options.min !== undefined && num < options.min) {
        return { valid: false, error: `Must be at least ${options.min}` };
      }
      if (options.max !== undefined && num > options.max) {
        return { valid: false, error: `Must be at most ${options.max}` };
      }
      return { valid: true };

    case "url":
      if (!value) return { valid: true }; // Optional URL field
      try {
        new URL(value);
        return { valid: true };
      } catch {
        return { valid: false, error: "Please enter a valid URL" };
      }

    default:
      return { valid: true };
  }
};

// Rate limiting simulation
export class RateLimiter {
  constructor(maxRequests = 5, timeWindow = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Remove old requests
    const validRequests = userRequests.filter(
      (time) => now - time < this.timeWindow,
    );

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  reset() {
    this.requests.clear();
  }
}

// CSRF protection
export const generateCSRFToken = () => {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export const validateCSRFToken = (token, sessionToken) => {
  return token === sessionToken;
};

// XSS prevention
export const escapeHTML = (str) => {
  if (typeof str !== "string") return str;

  return str
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "&#039;");
};

// File validation
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ["image/jpeg", "image/png", "image/gif"],
  } = options;

  if (!file) {
    return { valid: false, error: "No file selected" };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${maxSize / 1024 / 1024}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "File type not allowed" };
  }

  return { valid: true };
};

// SQL injection prevention
export const escapeSQL = (str) => {
  if (typeof str !== "string") return str;

  // Replace known dangerous characters using a mapping to avoid control-character regex
  const replacements = {
    "\0": "\\0",
    "\b": "\\b",
    "\t": "\\t",
    "\x1a": "\\z",
    "\n": "\\n",
    "\r": "\\r",
    '"': '\\"',
    "'": "\\'",
    "\\": "\\\\",
    "%": "\\%",
  };

  return str
    .split("")
    .map((ch) => replacements[ch] || ch)
    .join("");
};

// Security headers configuration
export const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

// Session management utilities
export const sessionUtils = {
  generateSessionId: () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  },

  isSessionValid: (session) => {
    if (!session || !session.createdAt || !session.expiresAt) {
      return false;
    }

    const now = Date.now();
    return now < session.expiresAt;
  },

  createSession: (userId, ttl = 3600000) => {
    // 1 hour default
    return {
      id: sessionUtils.generateSessionId(),
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      lastActivity: Date.now(),
    };
  },
};

// Export default security utilities
const securityUtils = {
  sanitizeInput,
  sanitizeHTML,
  isValidEmail,
  isStrongPassword,
  validateFormInput,
  RateLimiter,
  generateCSRFToken,
  validateCSRFToken,
  escapeHTML,
  validateFile,
  escapeSQL,
  securityHeaders,
  sessionUtils,
};

export default securityUtils;
