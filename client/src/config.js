// Universal configuration helper
// Works in both Create React App (process.env) and Vite/Vercel (import.meta.env) environments

const getEnv = (key, defaultValue) => {
  // 1. Try process.env (Standard for CRA/Node)
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }

  // 2. Try import.meta.env (Standard for Vite/Vercel)
  // We use a try-catch to prevent syntax errors in environments that don't support import.meta
  try {
    // eslint-disable-next-line
    if (
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env[key]
    ) {
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore errors if import.meta is not available
  }

  return defaultValue;
};

export const API_URL = getEnv(
  "REACT_APP_API_URL",
  "https://peechey.vercel.app",
);
export const SUPABASE_URL = getEnv("REACT_APP_SUPABASE_URL");
export const SUPABASE_KEY = getEnv("REACT_APP_SUPABASE_KEY");
