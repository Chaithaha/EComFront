import React from 'react';
import { useNavigate } from 'react-router-dom';
import { imageService } from '../utils/imageService';
import './ProductCard.css';

const ProductCard = ({ product, onViewDetails }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState(null);

  React.useEffect(() => {
    // Determine the best image URL to use
    const getImageUrl = async () => {
      try {
        // If product has a direct image_url (legacy support)
        if (product.image_url) {
          return product.image_url;
        }
        
        // If product has images array, use the first one
        if (product.images && product.images.length > 0) {
          const firstImage = product.images[0];
          if (firstImage.publicUrl) {
            return firstImage.publicUrl;
          }
          if (firstImage.image_url) {
            return firstImage.image_url;
          }
          // If we have storage path, generate public URL
          if (firstImage.storage_path) {
            return imageService.getPublicUrl(firstImage.storage_path);
          }
        }
        
        // Fallback to null - let the component handle missing images
        return null;
      } catch (error) {
        console.error('Error getting image URL:', error);
        return null;
      }
    };

    const loadImageUrl = async () => {
      const url = await getImageUrl();
      setImageUrl(url);
    };

    loadImageUrl();
  }, [product]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    // Try to get a fallback image URL
    if (imageUrl) {
      setImageUrl(null);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(product.id);
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  const getBatteryHealthColor = (health) => {
    if (health >= 90) return 'battery-health-good';
    if (health >= 80) return 'battery-health-medium';
    return 'battery-health-poor';
  };

  return (
    <div className="product-card">
      <div className="product-image-container" data-alt={product.title}>
        {!imageLoaded && !imageError && (
          <div className="product-image-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            className={`product-image ${imageLoaded ? 'loaded' : ''}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <div className="product-image-placeholder">
            <span>No image</span>
          </div>
        )}
        {imageError && (
          <div className="product-image-error">
            <span>Image not available</span>
          </div>
        )}
      </div>
      <div className="product-info">
        <p className="product-title">{product.title}</p>
        <p className="product-price">${product.price}</p>
        <div className="product-details">
          <p className={getBatteryHealthColor(product.battery_health || 0)}>
            <span>Battery Health:</span> {product.battery_health || 0}%
          </p>
          <p className="market-value">
            <span>Market Value:</span> ${product.market_value || 0}
          </p>
          <p className="seller-score">
            <span>Seller Score:</span> {product.seller_score || 0}
          </p>
        </div>
        <button
          className="btn btn-primary view-details-btn"
          onClick={handleViewDetails}
        >
          <span>View Details</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;