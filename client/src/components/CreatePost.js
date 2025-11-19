import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Button from "./common/Button";
import ErrorMessage from "./common/ErrorMessage";
import apiClient from "../utils/apiClient";
import { storeProductFields } from "../utils/localProductStorage";
import "./CreatePost.css";

const CreatePost = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Debug: Log user authentication state
  console.log("CreatePost - Auth state:", { isAuthenticated, user });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      console.log("User not authenticated, redirecting to home");
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "good",
    battery_health: "",
    date_bought: "",
    market_value: "",
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }

    const validFiles = files.filter((file) => {
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!validTypes.includes(file.type)) {
        setError(
          `Invalid file type: ${file.name}. Only JPEG, PNG, WebP, and GIF are allowed.`,
        );
        return false;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError(`File too large: ${file.name}. Maximum size is 20MB.`);
        return false;
      }
      return true;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);

    // Create preview URLs
    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    setError("");
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      setError("You must be logged in to create a post");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Convert files to base64 for upload
      const imagePromises = selectedFiles.map((file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const base64 = reader.result.split(",")[1];
            resolve({
              base64: base64,
              mimetype: file.type,
              originalname: file.name,
              size: file.size,
            });
          };
          reader.onerror = reject;
        });
      });

      const images = await Promise.all(imagePromises);

      const postData = {
        ...formData,
        price: parseFloat(formData.price),
        user_id: user.id,
        images: images,
        seller: user?.name || "Unknown",
        posted: new Date().toISOString().split("T")[0],
      };

      console.log("Sending post data to server:", postData);
      const response = await apiClient.post("/api/items", postData);
      console.log("Server response:", response);

      if (response.success) {
        console.log("Post created successfully, navigating to home");
        navigate("/home");
      } else {
        console.error("Post creation failed:", response.error);
        setError(response.error || "Failed to create post");
      }
    } catch (err) {
      console.error("Post creation error:", err);
      setError(err.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-container">
      <div className="create-post-form">
        <h2>Create New Post</h2>
        <p>Share your item with the community</p>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="post-form">
          {/* Images Section - Moved to Top */}
          <div className="form-section images-section">
            <h3 className="form-section-title">Images</h3>

            <div className="form-group">
              <label htmlFor="images">Images (Optional - Max 5)</label>
              <div className="file-upload-container">
                <input
                  type="file"
                  id="images"
                  name="images"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleFileSelect}
                  disabled={selectedFiles.length >= 5}
                  className="file-input"
                />
                <label htmlFor="images" className="file-upload-button">
                  Choose Images
                </label>
                <span className="file-count">
                  {selectedFiles.length}/5 images selected
                </span>
              </div>

              {previewUrls.length > 0 && (
                <div className="image-preview-container">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="image-preview-item">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="image-preview"
                      />
                      <button
                        type="button"
                        className="remove-image-button"
                        onClick={() => removeFile(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="form-section basic-info-section">
            <h3 className="form-section-title">Basic Information</h3>

            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter post title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Describe your item"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Price ($)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a category</option>
                <option value="phones">Phones & Tablets</option>
                <option value="home-appliances">Home Appliances</option>
                <option value="computers">Computers & Laptops</option>
                <option value="audio">Audio & Headphones</option>
                <option value="other">Other Electronics</option>
              </select>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="form-section product-details-section">
            <h3 className="form-section-title">Product Details</h3>

            <div className="form-group">
              <label htmlFor="condition">Condition</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                required
              >
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="battery_health">Battery Health (%)</label>
              <input
                type="number"
                id="battery_health"
                name="battery_health"
                value={formData.battery_health}
                onChange={handleInputChange}
                placeholder="Enter battery health percentage"
                min="0"
                max="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="date_bought">Date Bought</label>
              <input
                type="date"
                id="date_bought"
                name="date_bought"
                value={formData.date_bought}
                onChange={handleInputChange}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="market_value">Market Value ($)</label>
              <input
                type="number"
                id="market_value"
                name="market_value"
                value={formData.market_value}
                onChange={handleInputChange}
                placeholder="Enter estimated market value"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/home")}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
