import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toggleDarkMode } from "../utils/darkMode";
import Button from "./common/Button";
import IconButton from "./common/IconButton";
import "./Header.css";
import "../styles/common.css";

const Header = ({
  isDarkMode,
  setIsDarkMode,
  isAuthenticated,
  user,
  username,
  onLogout,
}) => {
  const navigate = useNavigate();
  const { isAdmin, logout } = useAuth();

  const handleSignIn = () => {
    navigate("/login");
  };

  const handleSignUp = () => {
    navigate("/signup");
  };

  const handleCreatePost = () => {
    navigate("/create-post");
  };

  const handleMyPosts = () => {
    navigate("/my-posts");
  };

  const handleNavigateToAdmin = () => {
    navigate("/admin");
  };

  const handleLogout = async () => {
    try {
      // Use AuthContext logout function if available, otherwise fall back to prop
      if (logout) {
        await logout();
      } else if (onLogout) {
        await onLogout();
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // Still navigate even if logout fails
    }
    navigate("/home");
  };

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const handleLogoutClick = async () => {
    await handleLogout();
    closeDropdown();
  };

  // Handle dropdown item clicks to prevent blur from closing dropdown first
  const handleDropdownItemClick = async (handler) => {
    if (handler) {
      await handler();
    }
    closeDropdown();
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest(".user-dropdown")) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleToggleDarkMode = () => {
    const newMode = toggleDarkMode();
    setIsDarkMode(newMode);
  };

  return (
    <header className="header">
      <div className="header-main">
        <div className="logo-section">
          <a href="/home" className="logo-link">
            <h2 className="logo-text">🍊 ForOranges</h2>
          </a>
        </div>
        <div className="nav-section">
          <div className="nav-links">
            <a href="/home" className="nav-link">Home</a>
            {/* <a href="/categories">Shop by Category</a> */}
            {/* <a href="/how-it-works">How it Works</a> */}
            {/* <a href="/about">About Us</a> */}
            <a href="/chat" className="nav-link">Chat</a>
          </div>
        </div>
        <div className="action-buttons">
          {isAuthenticated ? (
            // Authenticated user UI
            <>
              <div className="user-dropdown">
                <button className="dropdown-trigger" onClick={toggleDropdown}>
                  <span className="material-symbols-outlined user-icon">
                    account_circle
                  </span>
                  <span className="welcome-text">Welcome, {username}</span>
                  <span className="material-symbols-outlined dropdown-arrow">
                    {isDropdownOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    {isAdmin() && (
                      <button
                        className="dropdown-item admin-item"
                        onClick={() =>
                          handleDropdownItemClick(handleNavigateToAdmin)
                        }
                      >
                        <span className="material-symbols-outlined">
                          dashboard
                        </span>
                        <span>Dashboard</span>
                      </button>
                    )}
                    <button
                      className="dropdown-item"
                      onClick={() => handleDropdownItemClick(handleMyPosts)}
                    >
                      <span className="material-symbols-outlined">
                        folder
                      </span>
                      <span>My Posts</span>
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => handleDropdownItemClick(handleCreatePost)}
                    >
                      <span className="material-symbols-outlined">
                        add_circle
                      </span>
                      <span>Create Post</span>
                    </button>
                    <button
                      className="dropdown-item logout-item"
                      onClick={() => handleDropdownItemClick(handleLogoutClick)}
                    >
                      <span className="material-symbols-outlined">logout</span>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>

              <IconButton onClick={handleToggleDarkMode}>
                <span className="material-symbols-outlined">
                  {isDarkMode ? "light_mode" : "dark_mode"}
                </span>
              </IconButton>
            </>
          ) : (
            // Unauthenticated user UI
            <>
              <Button variant="primary" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button variant="secondary" onClick={handleSignUp}>
                Sign Up
              </Button>
              <IconButton onClick={handleToggleDarkMode}>
                <span className="material-symbols-outlined">
                  {isDarkMode ? "light_mode" : "dark_mode"}
                </span>
              </IconButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
