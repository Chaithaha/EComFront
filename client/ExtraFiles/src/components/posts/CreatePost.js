import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { validateFormInput, sanitizeInput } from '../../utils/security';
import apiClient from '../../utils/apiClient';
import { imageService } from '../../utils/imageService';
import './CreatePost.css';

/**
 * Convert technical error messages to user-friendly messages
 */
const getUserFriendlyErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  const errorString = typeof error === 'string' ? error : error.message || error.toString();
  
  // Handle Supabase storage errors
  if (errorString.includes('row-level security policy') || errorString.includes('StorageApiError')) {
    return 'Permission denied. You may not have permission to upload images. Please contact support.';
  }
  
  if (errorString.includes('invalid JWT') || errorString.includes('Auth session missing')) {
    return 'Session expired. Please sign in again.';
  }
  
  if (errorString.includes('network error') || errorString.includes('Failed to fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  if (errorString.includes('file size exceeds') || errorString.includes('too large')) {
    return 'File size is too large. Please choose a smaller file (max 5MB).';
  }
  
  if (errorString.includes('file type') || errorString.includes('invalid format')) {
    return 'Invalid file type. Please upload JPG, PNG, GIF, or WebP images.';
  }
  
  if (errorString.includes('rate limit') || errorString.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  // Generic fallbacks
  if (errorString.includes('permission')) {
    return 'Permission denied. Please check your account settings.';
  }
  
  if (errorString.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  // For unknown errors, provide a generic message but log the actual error
  console.error('Unknown error type:', errorString);
  return 'An error occurred. Please try again.';
};

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'new',
    location: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({
    isUploading: false,
    currentImage: 0,
    totalImages: 0,
    progress: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = [];
    
    for (const file of files) {
      // Validate file using the new image service
      const fileValidation = imageService.validateFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      });
      
      if (!fileValidation.valid) {
        setError(fileValidation.errors.join(', '));
        continue;
      }
      
      try {
        // Create preview using the new image service
        const previewData = await imageService.createImagePreview(file);
        
        // Add to previews (we'll upload later when creating the post)
        newPreviews.push({
          file: fileValidation.file,
          preview: previewData.preview,
          originalName: file.name,
          dimensions: previewData.dimensions,
        });
        
      } catch (error) {
        console.error('Error processing image:', error);
        setError('Failed to process image. Please try again.');
      }
    }
    
    if (newPreviews.length > 0) {
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    // Input sanitization
    const sanitizedTitle = sanitizeInput(formData.title);
    const sanitizedDescription = sanitizeInput(formData.description);
    const sanitizedPrice = sanitizeInput(formData.price);
    // Title validation
    const titleValidation = validateFormInput(sanitizedTitle, 'text');
    if (!titleValidation.valid) {
      setError(titleValidation.error);
      return false;
    }
    
    // Description validation
    const descriptionValidation = validateFormInput(sanitizedDescription, 'text');
    if (!descriptionValidation.valid) {
      setError(descriptionValidation.error);
      return false;
    }
    
    // Price validation
    const priceValidation = validateFormInput(sanitizedPrice, 'number', { min: 0.01, max: 999999.99 });
    if (!priceValidation.valid) {
      setError(priceValidation.error);
      return false;
    }
    
    // Category validation
    if (!formData.category) {
      setError('Please select a category');
      return false;
    }
    
    if (!user) {
      setError('You must be logged in to create a post');
      return false;
    }
    
    return true;
  };

  const uploadImages = async (postId) => {
    if (imagePreviews.length === 0) return [];
    
    try {
      console.log(`Uploading ${imagePreviews.length} images for post ${postId}`);
      
      // Extract files from previews
      const files = imagePreviews.map(preview => preview.file);
      
      // Use the new image service to upload multiple images
      const uploadResult = await imageService.uploadMultipleImages(files, postId, {
        maxSizeMB: 5,
        maxWidthOrHeight: 1920,
        quality: 0.8,
        maxRetries: 3,
        retryDelay: 1000,
      });
      
      console.log('Image upload result:', uploadResult);
      
      if (uploadResult.success) {
        // NEW: Send image metadata to server to store in database
        const imageMetadata = uploadResult.successfulUploads.map(image => ({
          storage_path: image.storage_path,
          filename: image.filename,
          original_filename: image.original_filename,
          file_size: image.file_size,
          mime_type: image.mime_type,
          image_url: image.publicUrl
        }));
        
        console.log('Sending image metadata to server:', imageMetadata);
        
        // Store metadata in database via server endpoint
        try {
          const response = await apiClient.post('/api/images/store-metadata', {
            postId: postId,
            images: imageMetadata
          });
          
          if (response.success) {
            console.log('Image metadata stored in database successfully');
          } else {
            console.error('Failed to store image metadata:', response.error);
          }
        } catch (metadataError) {
          console.error('Error sending image metadata to server:', metadataError);
        }
        
        return uploadResult.successfulUploads.map(image => ({
          id: image.storage_path.split('/').pop(),
          url: image.publicUrl,
          filename: image.filename,
          original_filename: image.original_filename,
          storage_path: image.storage_path,
          success: true,
        }));
      } else {
        // Handle failed uploads with better error messages
        const failedImages = uploadResult.failedUploads.map(failed => ({
          filename: failed.file,
          error: getUserFriendlyErrorMessage(failed.error),
          success: false,
        }));
        
        console.warn('Failed uploads:', failedImages);
        return failedImages;
      }
      
    } catch (error) {
      console.error('Error in image upload process:', error);
      
      // Return user-friendly error information for each image
      return imagePreviews.map(preview => ({
        filename: preview.originalName,
        error: getUserFriendlyErrorMessage(error),
        success: false,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create post data with sanitized inputs
      const postData = {
        title: sanitizeInput(formData.title),
        description: sanitizeInput(formData.description),
        price: parseFloat(formData.price),
        category: formData.category,
        location: sanitizeInput(formData.location),
      };
      
      console.log('Creating post with data:', postData);
      
      // Make API call to create post
      const postResponse = await apiClient.post('/api/posts', postData);
      
      if (postResponse.success) {
        console.log('Post created successfully:', postResponse.data);
        
        // Upload images if any
        if (imagePreviews.length > 0) {
          setUploadStatus({
            isUploading: true,
            currentImage: 0,
            totalImages: imagePreviews.length,
            progress: 0
          });
          
          const uploadedImages = await uploadImages(postResponse.data.id);
          console.log('Images uploaded successfully:', uploadedImages);
          
          // Check if any images failed to upload
          const failedUploads = uploadedImages.filter(img => img.success === false || !img.url);
          const successfulUploads = uploadedImages.filter(img => img.success !== false && img.url);
          
          if (failedUploads.length > 0) {
            console.warn(`${failedUploads.length} images failed to upload:`, failedUploads);
            
            // Get user-friendly error messages (error messages are already user-friendly from uploadImages)
            const errorMessages = failedUploads.map(img =>
              img.filename ? `${img.filename}: ${img.error}` : img.error
            );
            
            setError(`Post created successfully! However, ${failedUploads.length} image(s) failed to upload: ${errorMessages.join('; ')}`);
          } else if (successfulUploads.length > 0) {
            console.log(`All ${successfulUploads.length} images uploaded successfully!`);
          }
          
          // Note: The server now automatically updates the post with the primary image URL
          // So we don't need to manually update it here anymore
          
          setUploadStatus({
            isUploading: false,
            currentImage: 0,
            totalImages: 0,
            progress: 0
          });
        }
        
        // Redirect to home page on success
        navigate('/');
      } else {
        console.error('API error:', postResponse.error);
        setError(postResponse.error || 'Failed to create post. Please try again.');
      }
      
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Electronics',
    'Clothing',
    'Home & Garden',
    'Sports & Outdoors',
    'Books',
    'Toys & Games',
    'Automotive',
    'Health & Beauty',
    'Other'
  ];

  return (
    <div className="create-post-container">
      <div className="create-post-form">
        <div className="form-header">
          <h1>Create New Post</h1>
          <p>Share your item with the community</p>
        </div>
        
        {error && (
          <div className="error-message">
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="post-form">
          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a descriptive title"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your item in detail"
                rows="4"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price ($) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="condition">Condition</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, State"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          {/* Upload Progress Indicator */}
          {uploadStatus.isUploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadStatus.progress}%` }}
                ></div>
              </div>
              <div className="progress-text">
                Uploading image {uploadStatus.currentImage} of {uploadStatus.totalImages} ({uploadStatus.progress}%)
              </div>
            </div>
          )}
          
          <div className="form-section">
            <h2>Images</h2>
            <p>Add up to 5 images to showcase your item</p>
            
            <div className="image-upload">
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={loading || imagePreviews.length >= 5}
              />
              <label htmlFor="images" className="upload-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                </svg>
                Choose Images
              </label>
              <span className="upload-hint">
                {imagePreviews.length >= 5 ? 'Maximum 5 images reached' : 'JPG, PNG, GIF, WebP (Max 5MB each)'}
              </span>
            </div>
            
            {imagePreviews.length > 0 && (
              <div className="image-previews">
                {imagePreviews.map((imageData, index) => (
                  <div key={index} className="image-preview">
                    <img src={imageData.preview} alt={`Preview ${index + 1}`} />
                    <div className="image-info">
                      <span className="image-name">{imageData.originalName}</span>
                    </div>
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(index)}
                      disabled={loading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                  </svg>
                  Create Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;