import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { toggleDarkMode } from "../../utils/darkMode";
import Button from "../common/Button";
import IconButton from "../common/IconButton";
import "./AdminNavbar.css";

const AdminNavbar = ({ isDarkMode, setIsDarkMode }) => {
  const navigate = useNavigate();
  const { user, getDisplayName, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const handleLogout = async () => {
    if (logout) {
      try {
        await logout();
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
    navigate("/");
  };

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

  const handleDropdownItemClick = async (handler) => {
    if (handler) {
      await handler();
    }
    closeDropdown();
  };

  const handleToggleDarkMode = () => {
    const newMode = toggleDarkMode();
    setIsDarkMode(newMode);
  };

  const handleNavigateToLanding = () => {
    navigate("/");
  };

  const handleNavigateToCreatePost = () => {
    navigate("/create-post");
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest(".admin-user-dropdown")) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-main">
        <div className="admin-logo-section">
          <button
            onClick={handleNavigateToLanding}
            className="admin-logo-button"
          >
            <span className="admin-logo-text">🍊 ForOranges</span>
            <span className="admin-badge">ADMIN</span>
          </button>
        </div>

        <div className="admin-nav-section">
          <nav className="admin-nav-links">
            <a href="/admin" className="admin-nav-link active">
              <span className="material-symbols-outlined">dashboard</span>
              Dashboard
            </a>
            <a href="/admin/users" className="admin-nav-link">
              <span className="material-symbols-outlined">people</span>
              Users
            </a>
            <a href="/admin/items" className="admin-nav-link">
              <span className="material-symbols-outlined">inventory_2</span>
              Items
            </a>
            <a href="/admin/analytics" className="admin-nav-link">
              <span className="material-symbols-outlined">analytics</span>
              Analytics
            </a>
            <a href="/admin/settings" className="admin-nav-link">
              <span className="material-symbols-outlined">settings</span>
              Settings
            </a>
          </nav>
        </div>

        <div className="admin-action-buttons">
          <Button
            variant="primary"
            onClick={handleNavigateToCreatePost}
            className="admin-create-btn"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Create Post
          </Button>

          <div className="admin-user-dropdown">
            <button className="admin-dropdown-trigger" onClick={toggleDropdown}>
              <span className="material-symbols-outlined admin-user-icon">
                admin_panel_settings
              </span>
              <span className="admin-welcome-text">
                Admin: {getDisplayName()}
              </span>
              <span className="material-symbols-outlined admin-dropdown-arrow">
                {isDropdownOpen ? "expand_less" : "expand_more"}
              </span>
            </button>

            {isDropdownOpen && (
              <div className="admin-dropdown-menu">
                <button
                  className="admin-dropdown-item"
                  onClick={() =>
                    handleDropdownItemClick(handleNavigateToLanding)
                  }
                >
                  <span className="material-symbols-outlined">storefront</span>
                  <span>View Marketplace</span>
                </button>
                <button
                  className="admin-dropdown-item"
                  onClick={() =>
                    handleDropdownItemClick(handleNavigateToCreatePost)
                  }
                >
                  <span className="material-symbols-outlined">add_circle</span>
                  <span>Create Post</span>
                </button>
                <button
                  className="admin-dropdown-item admin-logout-item"
                  onClick={() => handleDropdownItemClick(handleLogoutClick)}
                >
                  <span className="material-symbols-outlined">logout</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          <IconButton
            onClick={handleToggleDarkMode}
            className="admin-theme-toggle"
          >
            <span className="material-symbols-outlined">
              {isDarkMode ? "light_mode" : "dark_mode"}
            </span>
          </IconButton>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
