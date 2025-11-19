import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../utils/apiClient";
import Header from "./Header";
import Button from "./common/Button";
import LoadingSpinner from "./common/LoadingSpinner";
import ErrorMessage from "./common/ErrorMessage";
import "./MyPostsPage.css";

const MyPostsPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode state
  useEffect(() => {
    setIsDarkMode(
      localStorage.getItem("darkMode") === "true" ||
        (!localStorage.getItem("darkMode") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches),
    );
  }, []);

  // Fetch user's posts
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/home");
      return;
    }

    const fetchUserPosts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiClient.get("/api/items");
        
        if (response.success) {
          // Filter posts to show only current user's posts
          const userPosts = response.data.filter(post => post.user?.id === user.id);
          setPosts(userPosts);
        } else {
          setError(response.error || "Failed to fetch posts");
        }
      } catch (err) {
        console.error("Error fetching user posts:", err);
        setError("Failed to load your posts");
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [isAuthenticated, user, navigate]);

  const handleEditPost = (postId) => {
    navigate(`/edit-post/${postId}`);
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        const response = await apiClient.delete(`/api/items/${postId}`);
        
        if (response.success) {
          // Remove the post from the list
          setPosts(posts.filter(post => post.id !== postId));
        } else {
          alert("Failed to delete post: " + response.error);
        }
      } catch (err) {
        console.error("Error deleting post:", err);
        alert("Failed to delete post");
      }
    }
  };

  const handleViewPost = (postId) => {
    navigate(`/product/${postId}`);
  };

  const handleCreateNewPost = () => {
    navigate("/create-post");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#10b981"; // Green
      case "pending":
        return "#f59e0b"; // Yellow
      case "sold":
        return "#6b7280"; // Gray
      case "rejected":
        return "#ef4444"; // Red
      default:
        return "#6b7280"; // Gray
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Active";
      case "pending":
        return "Pending";
      case "sold":
        return "Sold";
      case "rejected":
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="my-posts-page">
      <div className="my-posts-content">
        {loading && (
          <div className="my-posts-content loading">
            <div className="loading-spinner"></div>
            <p>Loading your posts...</p>
          </div>
        )}
        <div className="my-posts-header">
          <h1>My Posts</h1>
          <p>Manage your posted items</p>
          <Button onClick={handleCreateNewPost} variant="primary">
            Create New Post
          </Button>
        </div>

        {error && <ErrorMessage message={error} />}

        {posts.length === 0 ? (
          <div className="no-posts">
            <h2>No posts yet</h2>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-image-container">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="post-image"
                      onError={(e) => {
                        e.target.src = null;
                      }}
                    />
                  ) : (
                    <div className="post-image-placeholder">
                      <span>No image</span>
                    </div>
                  )}
                  <div
                    className="post-status"
                    style={{ backgroundColor: getStatusColor(post.status) }}
                  >
                    {getStatusLabel(post.status)}
                  </div>
                </div>

                <div className="post-content">
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-description">
                    {post.description ? post.description.substring(0, 100) + "..." : "No description"}
                  </p>
                  <div className="post-meta">
                    <span className="post-price">${post.price}</span>
                    <span className="post-category">{post.category}</span>
                    <span className="post-date">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="post-actions">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleViewPost(post.id)}
                  >
                    View
                  </Button>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => handleEditPost(post.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleDeletePost(post.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPostsPage;