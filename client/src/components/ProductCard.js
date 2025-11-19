import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getProductImageUrl,
  getBatteryHealthColor,
  getBatteryHealthLabel,
} from "../utils/productUtils";
import { getProductFields } from "../utils/localProductStorage";
import { useImageFallback } from "../utils/imageFallback";
import Button from "./common/Button";
import "./ProductCard.css";
import "../styles/common.css";

const ProductCard = ({ product, onViewDetails }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState(null);
  const [imageDebugInfo, setImageDebugInfo] = React.useState(null);
  const [additionalFields, setAdditionalFields] = React.useState({});
  const {
    fallbackUrl,
    isUsingFallback,
    handleImageError: handleFallbackError,
  } = useImageFallback(product);

  React.useEffect(() => {
    const loadImageUrl = async () => {
      console.log("🖼️ Loading image URL for product:", {
        productId: product.id,
        productTitle: product.title,
        hasImageUrl: !!product.image_url,
        hasImages: !!product.images,
        imagesCount: product.images?.length || 0,
      });

      try {
        const url = await getProductImageUrl(product);

        console.log("📡 Image URL result:", {
          productId: product.id,
          url: url,
          urlType: typeof url,
          isNull: url === null,
          isUndefined: url === undefined,
          isEmpty: url === "",
        });

        setImageUrl(url);

        // Set debug info for troubleshooting
        setImageDebugInfo({
          productId: product.id,
          generatedUrl: url,
          productData: {
            image_url: product.image_url,
            images: product.images,
            hasDirectUrl: !!product.image_url,
            hasImagesArray: !!(product.images && product.images.length > 0),
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("❌ Error loading image URL:", {
          productId: product.id,
          error: error.message,
          stack: error.stack,
          product: product,
        });

        setImageDebugInfo({
          productId: product.id,
          error: error.message,
          productData: product,
          timestamp: new Date().toISOString(),
        });
      }
    };

    loadImageUrl();
  }, [product]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = async (event) => {
    console.error("❌ Image failed to load:", {
      productId: product.id,
      imageUrl: imageUrl,
      imageDebugInfo,
      event: {
        type: event.type,
        target: {
          src: event.target?.src,
          naturalWidth: event.target?.naturalWidth,
          naturalHeight: event.target?.naturalHeight,
          complete: event.target?.complete,
        },
      },
    });

    setImageError(true);
    setImageLoaded(false);

    // Use the fallback system
    await handleFallbackError();
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(product.id);
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  const handleChatWithSeller = () => {
    // Navigate to chat page with product information
    navigate('/chat', {
      state: {
        productId: product.id,
        productTitle: product.title,
        productPrice: product.price,
        sellerId: product.seller_id || 'demo-seller'
      }
    });
  };

  const calculateTrustScore = () => {
    // Calculate trust score based on battery health and other factors
    const batteryHealth = product.battery_health || 0;
    const hasDiagnostics = product.has_diagnostics || false;
    const hasImages = product.images && product.images.length > 0;

    // Start with battery health score (0-100)
    let score = batteryHealth;

    // Add bonus for diagnostics (up to 20 points)
    if (hasDiagnostics) {
      score += 20;
    }

    // Add bonus for images (up to 10 points)
    if (hasImages) {
      score += 10;
    }

    // Cap at 100
    return Math.min(100, score);
  };

  const getTrustScoreColor = (score) => {
    if (score >= 80) return "#10b981"; // Green
    if (score >= 60) return "#f59e0b"; // Yellow
    if (score >= 40) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  const getTrustScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  return (
    <div className="product-card">
      <div className="product-image-container" data-alt={product.title}>
        {!imageLoaded && !imageError && (
          <div className="product-image-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        {imageUrl || fallbackUrl ? (
          <img
            src={fallbackUrl || imageUrl}
            alt={product.title}
            className={`product-image ${imageLoaded ? "loaded" : ""} ${isUsingFallback ? "fallback-image" : ""}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <div className="product-image-placeholder">
            <span>No image</span>
          </div>
        )}
        {isUsingFallback && (
          <div className="fallback-indicator">
            <span>Fallback Image</span>
          </div>
        )}
        {imageError && !isUsingFallback && (
          <div className="product-image-error">
            <span>Image not available</span>
          </div>
        )}
      </div>

      <div className="product-content">
        <div className="product-header">
          <h3 className="product-title">{product.title}</h3>
          <div className="product-category">
            {product.category || "Electronics"}
          </div>
        </div>

        {/* Trust Score Meter */}
        <div className="trust-score-section">
          <div className="trust-score-label">Trust Score</div>
          <div className="trust-score-meter">
            <div
              className="trust-score-fill"
              style={{
                width: `${calculateTrustScore()}%`,
                backgroundColor: getTrustScoreColor(calculateTrustScore())
              }}
            ></div>
          </div>
          <div className="trust-score-info">
            <span
              className="trust-score-value"
              style={{ color: getTrustScoreColor(calculateTrustScore()) }}
            >
              {calculateTrustScore()}/100
            </span>
            <span className="trust-score-text">
              {getTrustScoreLabel(calculateTrustScore())}
            </span>
          </div>
        </div>

        <div className="product-price-section">
          <div className="product-price">${product.price}</div>
          {product.battery_health && (
            <div
              className={`status-chip ${getBatteryHealthColor(product.battery_health)}`}
            >
              {getBatteryHealthLabel(product.battery_health)} Battery
            </div>
          )}
        </div>

        <div className="product-details">
          <div className="product-detail-item">
            <span className="detail-label">Battery Health:</span>
            <span
              className={`detail-value ${getBatteryHealthColor(product.battery_health || 0)}`}
            >
              {product.battery_health ? `${product.battery_health}%` : "N/A"}
            </span>
          </div>
          <div className="product-detail-item">
            <span className="detail-label">Market Value:</span>
            <span className="detail-value market-value">
              {product.market_value ? `$${parseFloat(product.market_value).toFixed(2)}` : "N/A"}
            </span>
          </div>
        </div>
      </div>

      <div className="product-actions">
        <Button
          variant="primary"
          size="large"
          fullWidth
          onClick={handleViewDetails}
        >
          View Details
        </Button>

        {isAuthenticated && (
          <Button
            variant="secondary"
            size="large"
            fullWidth
            onClick={handleChatWithSeller}
            style={{ marginTop: '8px' }}
          >
            Chat with Seller
          </Button>
        )}

        {/* Debug button - only visible in development */}
        {process.env.NODE_ENV === "development" &&
          user &&
          (user.email === "admin@example.com" || user.role === "admin") && (
            <button
              className="debug-button"
              onClick={() => {
                console.log("🔍 Product Card Debug Info:", {
                  product,
                  imageUrl,
                  imageDebugInfo,
                  imageLoaded,
                  imageError,
                });

                // Test image loading manually
                if (imageUrl) {
                  const testImg = new Image();
                  testImg.onload = () =>
                    console.log("✅ Manual image test successful");
                  testImg.onerror = (e) =>
                    console.error("❌ Manual image test failed:", e);
                  testImg.src = imageUrl;
                }
              }}
              style={{
                marginTop: "8px",
                padding: "4px 8px",
                fontSize: "12px",
                backgroundColor: "#ff6b6b",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Debug Image
            </button>
          )}
      </div>
    </div>
  );
};

export default ProductCard;
