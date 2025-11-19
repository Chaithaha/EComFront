import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "./common/LoadingSpinner";
import ErrorMessage from "./common/ErrorMessage";
import Header from "./Header";
import ProductCard from "./ProductCard";
import AuthDebug from "./AuthDebug";
import AuthPopup from "./common/AuthPopup";
import "../NewLandingPage.css";
import { API_URL } from "../config";

const HomePage = ({ isDarkMode, setIsDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Handle authentication popup - only show after initial mount
  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      return;
    }

    // Show popup when authentication state changes
    setShowAuthPopup(true);
  }, [isAuthenticated, hasMounted]);

  // Fetch products when component mounts, when page gains focus, or when location changes
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);


        const url = `${API_URL}/api/items`;

        console.log("Fetching products from:", url);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("Fetched products:", data.length);

        setProducts(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Network error. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Add event listener for when page gains focus (e.g., navigating back from create post)
    const handleFocus = () => {
      fetchProducts();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [location.key]); // Add location.key as dependency to refresh on navigation

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);


      const response = await fetch(
        `${API_URL}/api/items?search=${encodeURIComponent(searchQuery)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setProducts(data);
      } else {
        setError(data.error || "Search failed");
      }
    } catch (err) {
      setError("Network error during search");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="landing-page">
      <div className="layout-container">
        {/* Debug Component */}
        {user &&
          (user.email === "admin@example.com" || user.role === "admin") && (
            <AuthDebug />
          )}

        {/* Header Component */}
        <Header
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isAuthenticated={isAuthenticated}
          user={user}
          username={user?.email || ""}
          onLogout={async () => {
            try {
              await logout();
              navigate("/home");
            } catch (error) {
              console.error("Logout failed:", error);
              // Still navigate even if logout fails
              navigate("/home");
            }
          }}
        />

        {/* Main Content */}
        <main className="main-content">
          <div className="content-container">
            {/* Hero Section */}
            <div className="hero">
              <div className="hero-content">
                <h1 className="hero-title">
                  ForOranges. Verified. Transparent.
                </h1>
                <h2 className="hero-subtitle">
                  The Marketplace Where Diagnostics Aren't Optional.
                </h2>
              </div>
              {/* Search Section */}
              <div className="search-section">
                <form onSubmit={handleSearch} className="search-form">
                  <div className="search-wrapper">
                    <span className="search-icon">
                      <span className="material-symbols-outlined">search</span>
                    </span>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search by Device, Model, or... Battery Health."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="search-btn">
                      Search
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Products Section */}
            <div className="products-section">
              <div className="products-header">
                <h2>Latest Listings</h2>
              </div>
              <div className="products-grid">
                {loading ? (
                  <div className="loading-container">
                    <LoadingSpinner />
                  </div>
                ) : error ? (
                  <div className="error-container">
                    <ErrorMessage message={error} />
                  </div>
                ) : products.length === 0 ? (
                  <div className="no-products-container">
                    <h3>No products found</h3>
                    <p>Check back later for new listings.</p>
                  </div>
                ) : (
                  products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onViewDetails={handleViewDetails}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Authentication Popup */}
      <AuthPopup
        isAuthenticated={isAuthenticated}
        username={user?.email || ""}
        isVisible={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
      />
    </div>
  );
};

export default HomePage;
