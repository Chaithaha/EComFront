// Dark mode utility functions
export const isDarkMode = () => {
  return (
    localStorage.getItem("darkMode") === "true" ||
    (!localStorage.getItem("darkMode") &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
};

export const setDarkMode = (enabled) => {
  if (enabled) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("darkMode", "true");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", "false");
  }
};

export const toggleDarkMode = () => {
  const currentMode = isDarkMode();
  setDarkMode(!currentMode);
  return !currentMode;
};

// Initialize dark mode on app load
export const initializeDarkMode = () => {
  setDarkMode(isDarkMode());
};
