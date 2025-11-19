import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAdmin()) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    // Fetch real data from API
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users
        const usersResponse = await apiClient.get('/api/users');
        if (usersResponse.success) {
          setUsers(usersResponse.data);
        } else {
          console.error('Failed to fetch users:', usersResponse.error);
        }
        
        // Fetch posts
        const postsResponse = await apiClient.get('/api/posts');
        if (postsResponse.success) {
          setPosts(postsResponse.data);
        } else {
          console.error('Failed to fetch posts:', postsResponse.error);
        }
        
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserAction = async (userId, action) => {
    try {
      if (action === 'edit') {
        // For now, just log the action - in a real app, this would open an edit modal
        console.log(`Edit user ${userId}`);
        alert('User editing functionality would be implemented here');
      } else if (action === 'delete') {
        if (window.confirm('Are you sure you want to delete this user?')) {
          const response = await apiClient.delete(`/api/users/${userId}`);
          if (response.success) {
            // Refresh the users list
            const usersResponse = await apiClient.get('/api/users');
            if (usersResponse.success) {
              setUsers(usersResponse.data);
            }
          } else {
            alert('Failed to delete user: ' + response.error);
          }
        }
      }
    } catch (err) {
      console.error('User action error:', err);
      alert('An error occurred while processing user action');
    }
  };

  const handlePostAction = async (postId, action) => {
    try {
      if (action === 'edit') {
        console.log(`Edit post ${postId}`);
        alert('Post editing functionality would be implemented here');
      } else if (action === 'approve') {
        const response = await apiClient.put(`/api/posts/${postId}/status`, { status: 'active' });
        if (response.success) {
          // Refresh the posts list
          const postsResponse = await apiClient.get('/api/posts');
          if (postsResponse.success) {
            setPosts(postsResponse.data);
          }
        } else {
          alert('Failed to approve post: ' + response.error);
        }
      } else if (action === 'delete') {
        if (window.confirm('Are you sure you want to delete this post?')) {
          const response = await apiClient.delete(`/api/posts/${postId}`);
          if (response.success) {
            // Refresh the posts list
            const postsResponse = await apiClient.get('/api/posts');
            if (postsResponse.success) {
              setPosts(postsResponse.data);
            }
          } else {
            alert('Failed to delete post: ' + response.error);
          }
        }
      }
    } catch (err) {
      console.error('Post action error:', err);
      alert('An error occurred while processing post action');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: '#28a745', text: 'Active' },
      pending: { color: '#ffc107', text: 'Pending' },
      rejected: { color: '#dc3545', text: 'Rejected' },
      inactive: { color: '#6c757d', text: 'Inactive' }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <span className="status-badge" style={{ backgroundColor: config.color }}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="error-container">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Manage users and posts</p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users ({users.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts ({posts.length})
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
          </svg>
        </div>

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h2>Active Users</h2>
              <p>Manage registered users and their accounts</p>
            </div>
            
            <div className="users-table">
              <div className="table-header">
                <div className="table-cell">Name</div>
                <div className="table-cell">Email</div>
                <div className="table-cell">Role</div>
                <div className="table-cell">Last Login</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Actions</div>
              </div>
              
              {filteredUsers.map(user => (
                <div key={user.id} className="table-row">
                  <div className="table-cell">{user.name}</div>
                  <div className="table-cell">{user.email}</div>
                  <div className="table-cell">
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="table-cell">
                    {new Date(user.lastLogin).toLocaleString()}
                  </div>
                  <div className="table-cell">
                    {getStatusBadge(user.status)}
                  </div>
                  <div className="table-cell">
                    <div className="action-buttons">
                      <button
                        className="action-btn"
                        onClick={() => handleUserAction(user.id, 'edit')}
                        title="Edit User"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                        </svg>
                      </button>
                      <button
                        className="action-btn danger"
                        onClick={() => handleUserAction(user.id, 'delete')}
                        title="Delete User"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                          <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="posts-section">
            <div className="section-header">
              <h2>Post Management</h2>
              <p>Review and manage all user posts</p>
            </div>
            
            <div className="posts-table">
              <div className="table-header">
                <div className="table-cell">Title</div>
                <div className="table-cell">Category</div>
                <div className="table-cell">Price</div>
                <div className="table-cell">Author</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Actions</div>
              </div>
              
              {filteredPosts.map(post => (
                <div key={post.id} className="table-row">
                  <div className="table-cell">
                    <div className="post-title">{post.title}</div>
                    <div className="post-description">{post.description}</div>
                  </div>
                  <div className="table-cell">{post.category}</div>
                  <div className="table-cell">${post.price.toFixed(2)}</div>
                  <div className="table-cell">{post.user.name}</div>
                  <div className="table-cell">
                    {getStatusBadge(post.status)}
                  </div>
                  <div className="table-cell">
                    <div className="action-buttons">
                      <button
                        className="action-btn"
                        onClick={() => handlePostAction(post.id, 'edit')}
                        title="Edit Post"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                        </svg>
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handlePostAction(post.id, 'approve')}
                        title="Approve Post"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                        </svg>
                      </button>
                      <button
                        className="action-btn danger"
                        onClick={() => handlePostAction(post.id, 'delete')}
                        title="Delete Post"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                          <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;