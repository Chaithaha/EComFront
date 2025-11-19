import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Button from "./common/Button";
import ErrorMessage from "./common/ErrorMessage";
import apiClient from "../utils/apiClient";
import { storeProductFields } from "../utils/localProductStorage";
import "./EditPost.css";

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
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
  const [existingImages, setExistingImages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch existing post data
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/home");
      return;
    }

    const fetchPost = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiClient.get(`/api/items/${id}`);
        
        if (response.success) {
          const post = response.data;
          
          // Check if user owns this post
          if (post.user?.id !== user.id) {
            setError("You don't have permission to edit this post");
            return;
          }

          // Populate form data
          setFormData({
            title: post.title || "",
            description: post.description || "",
            price: post.price || "",
            category: post.category || "",
            condition: post.condition || "good",
            battery_health: post.battery_health || "",
            date_bought: post.date_bought || "",
            market_value: post.market_value || "",
          });

          // Store existing images
          if (post.images && post.images.length > 0) {
            setExistingImages(post.images);
          }
        } else {
          setError(response.error || "Failed to fetch post data");
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Failed to load post data");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, isAuthenticated, user, navigate]);

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

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      setError("You must be logged in to edit posts");
      return;
    }

    setError("");
    setSaving(true);

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

      const updateData = {
        ...formData,
        price: parseFloat(formData.price),
        images: images.length > 0 ? images : undefined,
      };

      // Convert battery_health to number if provided
      if (formData.battery_health) {
        updateData.battery_health = parseInt(formData.battery_health);
      }

      // Convert market_value to number if provided
      if (formData.market_value) {
        updateData.market_value = parseFloat(formData.market_value);
      }

      console.log("Updating post with data:", updateData);
      const response = await apiClient.put(`/api/items/${id}`, updateData);
      console.log("Server response:", response);

      if (response.success) {
        // Store additional fields locally for frontend use
        const additionalFields = {
          battery_health: formData.battery_health
            ? parseInt(formData.battery_health)
            : null,
          market_value: formData.market_value
            ? parseFloat(formData.market_value)
            : null,
          has_diagnostics: !!formData.battery_health,
        };

        // Get the product ID from the response
        const productId = response.data?.id || id;
        console.log("🔍 Debug - Full API response:", response);
        console.log("🔍 Debug - Response data:", response.data);
        console.log("🔍 Debug - Product ID:", productId);

        if (productId) {
          console.log("💾 Storing additional fields for product:", {
            productId: productId,
            additionalFields: additionalFields,
          });
          storeProductFields(productId, additionalFields);

          // Verify storage worked
          setTimeout(() => {
            const storedFields = JSON.parse(
              localStorage.getItem("productAdditionalFields") || "{}",
            );
            console.log(
              "✅ Verification - Stored fields in localStorage:",
              storedFields[productId],
            );
          }, 100);
        } else {
          console.warn("⚠️ No product ID found in response:", response);
        }

        console.log("Post updated successfully, navigating to my posts");
        navigate("/my-posts");
      } else {
        console.error("Post update failed:", response.error);
        setError(response.error || "Failed to update post");
      }
    } catch (err) {
      console.error("Post update error:", err);
      setError(err.message || "Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-post-container">
        <div className="loading-spinner"></div>
        <p>Loading post data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-post-container">
        <ErrorMessage message={error} />
        <Button onClick={() => navigate("/my-posts")} variant="secondary">
          Back to My Posts
        </Button>
      </div>
    );
  }

  return (
    <div className="edit-post-container">
      <div className="edit-post-form">
        <h2>Edit Post</h2>
        <p>Update your item details</p>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="post-form">
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
                <h4>New Images</h4>
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

            {existingImages.length > 0 && (
              <div className="existing-images-container">
                <h4>Existing Images</h4>
                {existingImages.map((image, index) => (
                  <div key={index} className="image-preview-item">
                    <img
                      src={image.image_url || image.publicUrl}
                      alt={`Existing ${index + 1}`}
                      className="image-preview"
                      onError={(e) => {
                        e.target.src = null;
                      }}
                    />
                    <button
                      type="button"
                      className="remove-image-button"
                      onClick={() => removeExistingImage(index)}
                    >
                      × Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/my-posts")}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : "Update Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPost;