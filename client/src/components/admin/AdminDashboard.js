import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorMessage from "../common/ErrorMessage";
import Button from "../common/Button";
import AdminNavbar from "./AdminNavbar";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("user-items");
  const [users, setUsers] = useState([]);

  const [userItems, setUserItems] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode state
  useEffect(() => {
    setIsDarkMode(
      localStorage.getItem("darkMode") === "true" ||
        (!localStorage.getItem("darkMode") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches),
    );
  }, []);

  useEffect(() => {
    if (!isAdmin()) {
      setError("Access denied. Admin privileges required.");
      setLoading(false);
      return;
    }

    // Fetch real data from API
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch users
        const usersResponse = await apiClient.get("/api/users");
        if (usersResponse.success) {
          setUsers(usersResponse.data);
        } else {
          console.error("Failed to fetch users:", usersResponse.error);
        }

        // Fetch all user items (excluding admin's own items)
        const userItemsResponse = await apiClient.get(
          "/api/items?status=pending",
        );
        if (userItemsResponse.success) {
          setUserItems(
            userItemsResponse.data.filter((item) => item.user?.id !== user.id),
          );
        } else {
          console.error("Failed to fetch user items:", userItemsResponse.error);
        }

        // Fetch all posts for management
        const allPostsResponse = await apiClient.get("/api/items");
        if (allPostsResponse.success) {
          setAllPosts(allPostsResponse.data);
        } else {
          console.error("Failed to fetch all posts:", allPostsResponse.error);
        }
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, user?.id]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredUserItems = userItems.filter(
    (item) =>
      (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredAllPosts = allPosts.filter(
    (item) =>
      (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleUserAction = async (userId, action) => {
    try {
      if (action === "edit") {
        console.log(`Edit user ${userId}`);
        alert("User editing functionality would be implemented here");
      } else if (action === "delete") {
        if (window.confirm("Are you sure you want to delete this user?")) {
          const response = await apiClient.delete(`/api/users/${userId}`);
          if (response.success) {
            // Refresh the users list
            const usersResponse = await apiClient.get("/api/users");
            if (usersResponse.success) {
              setUsers(usersResponse.data);
            }
          } else {
            alert("Failed to delete user: " + response.error);
          }
        }
      }
    } catch (err) {
      console.error("User action error:", err);
      alert("An error occurred while processing user action");
    }
  };

  const handleItemAction = async (itemId, action) => {
    try {
      if (action === "edit") {
        navigate(`/edit-item/${itemId}`);
      } else if (action === "delete") {
        if (window.confirm("Are you sure you want to delete this item?")) {
          const response = await apiClient.delete(`/api/items/${itemId}`);
          if (response.success) {
            // Refresh the appropriate items list
            await refreshItems();
          } else {
            alert("Failed to delete item: " + response.error);
          }
        }
      } else if (action === "approve") {
        const response = await apiClient.put(`/api/items/${itemId}/status`, {
          status: "active",
        });
        if (response.success) {
          await refreshItems();
        } else {
          alert("Failed to approve item: " + response.error);
        }
      } else if (action === "reject") {
        const response = await apiClient.put(`/api/items/${itemId}/status`, {
          status: "rejected",
        });
        if (response.success) {
          await refreshItems();
        } else {
          alert("Failed to reject item: " + response.error);
        }
      }
    } catch (err) {
      console.error("Item action error:", err);
      alert("An error occurred while processing item action");
    }
  };

  const refreshItems = async () => {
    try {
      // Refresh user items
      const userItemsResponse = await apiClient.get(
        "/api/items?status=pending",
      );
      if (userItemsResponse.success) {
        setUserItems(
          userItemsResponse.data.filter((item) => item.user?.id !== user.id),
        );
      }

      // Refresh all posts
      const allPostsResponse = await apiClient.get("/api/items");
      if (allPostsResponse.success) {
        setAllPosts(allPostsResponse.data);
      }
    } catch (err) {
      console.error("Error refreshing items:", err);
    }
  };

  const handleCreateItem = () => {
    navigate("/create-post");
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <LoadingSpinner />
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-error">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <AdminNavbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      <div className="admin-dashboard-content">
        <div className="dashboard-header">
          <div className="dashboard-header-content">
            <div className="dashboard-title-section">
              <h1 className="dashboard-title">Admin Dashboard</h1>
              <p className="dashboard-subtitle">
                Manage your marketplace with powerful tools
              </p>
            </div>
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <span className="material-symbols-outlined">people</span>
                </div>
                <div className="stat-content">
                  <h3 className="stat-number">{users.length}</h3>
                  <p className="stat-label">Total Users</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <span className="material-symbols-outlined">
                    pending_actions
                  </span>
                </div>
                <div className="stat-content">
                  <h3 className="stat-number">{userItems.length}</h3>
                  <p className="stat-label">Pending Approval</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <span className="material-symbols-outlined">inventory</span>
                </div>
                <div className="stat-content">
                  <h3 className="stat-number">{allPosts.length}</h3>
                  <p className="stat-label">Total Posts</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === "user-items" ? "active" : ""}`}
            onClick={() => setActiveTab("user-items")}
          >
            <span className="material-symbols-outlined">public</span>
            Community Items ({userItems.length})
          </button>
          <button
            className={`tab-button ${activeTab === "all-posts" ? "active" : ""}`}
            onClick={() => setActiveTab("all-posts")}
          >
            <span className="material-symbols-outlined">inventory</span>
            All Posts ({allPosts.length})
          </button>
          <button
            className={`tab-button ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <span className="material-symbols-outlined">people</span>
            Users ({users.length})
          </button>
        </div>

        <div className="dashboard-content">
          <div className="search-bar">
            <div className="search-wrapper">
              <span className="search-icon">
                <span className="material-symbols-outlined">search</span>
              </span>
              <input
                type="text"
                placeholder="Search across all data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {activeTab === "user-items" && (
            <div className="user-items-section">
              <div className="section-header">
                <div className="section-title">
                  <h2>Community Items</h2>
                  <p>Review and approve items submitted by users</p>
                </div>
              </div>
              <div className="items-table">
                {filteredUserItems.length === 0 ? (
                  <p>No pending items to review.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Seller</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUserItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.title}</td>
                          <td>{item.category}</td>
                          <td>${item.price}</td>
                          <td>{item.user?.name || "Unknown"}</td>
                          <td>
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() =>
                                  handleItemAction(item.id, "approve")
                                }
                                className="approve-btn"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleItemAction(item.id, "reject")
                                }
                                className="reject-btn"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === "all-posts" && (
            <div className="all-posts-section">
              <div className="section-header">
                <div className="section-title">
                  <h2>All Posts Management</h2>
                  <p>View and manage all posts in the marketplace</p>
                </div>
              </div>
              <div className="items-table">
                {filteredAllPosts.length === 0 ? (
                  <p>No posts found.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Seller</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAllPosts.map((item) => (
                        <tr key={item.id}>
                          <td>{item.title}</td>
                          <td>{item.category}</td>
                          <td>${item.price}</td>
                          <td>
                            {item.user?.name ||
                              item.user?.username ||
                              "Unknown"}
                          </td>
                          <td>
                            <span className={`status-badge ${item.status}`}>
                              {item.status}
                            </span>
                          </td>
                          <td>
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() =>
                                  handleItemAction(item.id, "edit")
                                }
                                className="edit-btn"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleItemAction(item.id, "delete")
                                }
                                className="delete-btn"
                              >
                                Delete
                              </button>
                              {item.status === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleItemAction(item.id, "approve")
                                    }
                                    className="approve-btn"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleItemAction(item.id, "reject")
                                    }
                                    className="reject-btn"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="users-section">
              <div className="section-header">
                <div className="section-title">
                  <h2>User Management</h2>
                  <p>View and manage all registered users</p>
                </div>
                <div className="user-controls"></div>
              </div>
              <div className="users-table">
                {filteredUsers.length === 0 ? (
                  <p>No users found.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Last Activity</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.username || user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`role-badge ${user.role}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            {user.lastActivity
                              ? new Date(
                                  user.lastActivity,
                                ).toLocaleDateString() +
                                " " +
                                new Date(user.lastActivity).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )
                              : "Never"}
                          </td>
                          <td>
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() =>
                                  handleUserAction(user.id, "edit")
                                }
                                className="edit-btn"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleUserAction(user.id, "delete")
                                }
                                className="delete-btn"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
