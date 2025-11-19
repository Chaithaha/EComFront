import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import LoadingSpinner from "./components/common/LoadingSpinner";
// Removed unused ErrorMessage import
import ErrorBoundary from "./components/common/ErrorBoundary";
// import LandingPage from "./components/LandingPage"; // Unused for now
import HomePage from "./components/HomePage";
// Removed unused ProductCard import
import ChatPage from "./components/ChatPage";
import Header from "./components/Header";

import ProductDetailsPage from "./components/ProductDetailsPage";

import AdminDashboard from "./components/admin/AdminDashboard";
import Auth from "./components/auth/Auth";
import CreatePost from "./components/CreatePost";
import MyPostsPage from "./components/MyPostsPage";
import EditPost from "./components/EditPost";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import "./App.css";

// Add network request interceptor for debugging
if (process.env.NODE_ENV === "development") {
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const url = args[0];
    const options = args[1] || {};

    // Log image requests
    if (typeof url === "string" && url.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
      console.log("🖼️ Image fetch request:", {
        url,
        method: options.method || "GET",
        mode: options.mode || "cors",
        timestamp: new Date().toISOString(),
      });

      const startTime = Date.now();

      try {
        const response = await originalFetch.apply(this, args);
        const endTime = Date.now();

        console.log("✅ Image fetch response:", {
          url,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          duration: endTime - startTime + "ms",
          contentType: response.headers.get("content-type"),
          contentLength: response.headers.get("content-length"),
        });

        return response;
      } catch (error) {
        const endTime = Date.now();
        console.error("❌ Image fetch error:", {
          url,
          error: error.message,
          duration: endTime - startTime + "ms",
          isCorsError:
            error.message.includes("CORS") ||
            error.message.includes("cross-origin"),
          isNetworkError:
            error.message.includes("Network") ||
            error.message.includes("fetch"),
        });

        throw error;
      }
    } else {
      // For non-image requests, just pass through
      return originalFetch.apply(this, args);
    }
  };

  console.log("🔧 Image fetch interceptor installed");
}

function AppContent() {
  const { loading, user, isAuthenticated, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  // Initialize dark mode state
  useEffect(() => {
    setIsDarkMode(
      localStorage.getItem("darkMode") === "true" ||
        (!localStorage.getItem("darkMode") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches),
    );
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Show loading spinner while checking auth state
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />

            <Route
              path="/home"
              element={
                <HomePage
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                />
              }
            />

            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />

            <Route
              path="/create-post"
              element={
                <ProtectedRoute>
                  <div className="landing-page">
                    <div className="layout-container">
                      <Header
                        isDarkMode={isDarkMode}
                        setIsDarkMode={setIsDarkMode}
                        isAuthenticated={isAuthenticated}
                        user={user}
                        username={user?.email || ""}
                        onLogout={handleLogout}
                      />
                      <main className="main-content">
                        <CreatePost />
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />

            <Route path="/product/:id" element={<ProductDetailsPage />} />

            <Route
              path="/my-posts"
              element={
                <ProtectedRoute>
                  <div className="landing-page">
                    <div className="layout-container">
                      <Header
                        isDarkMode={isDarkMode}
                        setIsDarkMode={setIsDarkMode}
                        isAuthenticated={isAuthenticated}
                        user={user}
                        username={user?.email || ""}
                        onLogout={handleLogout}
                      />
                      <main className="main-content">
                        <MyPostsPage />
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/edit-post/:id"
              element={
                <ProtectedRoute>
                  <div className="landing-page">
                    <div className="layout-container">
                      <Header
                        isDarkMode={isDarkMode}
                        setIsDarkMode={setIsDarkMode}
                        isAuthenticated={isAuthenticated}
                        user={user}
                        username={user?.email || ""}
                        onLogout={handleLogout}
                      />
                      <main className="main-content">
                        <EditPost />
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/chat"
              element={
                <div className="landing-page">
                  <div className="layout-container">
                    <Header
                      isDarkMode={isDarkMode}
                      setIsDarkMode={setIsDarkMode}
                      isAuthenticated={isAuthenticated}
                      user={user}
                      username={user?.email || ""}
                      onLogout={handleLogout}
                    />
                    <main className="main-content chat-page-content">
                      <ChatPage initialSession={null} />
                    </main>
                  </div>
                </div>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <main className="main-content">
                    <AdminDashboard />
                  </main>
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={
                <main className="main-content">
                  <div className="App-header">
                    <h1>Page Not Found</h1>
                    <button onClick={() => (window.location.href = "/home")}>
                      Back to Posts
                    </button>
                  </div>
                </main>
              }
            />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
