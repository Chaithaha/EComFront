import React from "react";
import "../../styles/common.css";

const PriceBreakdown = ({ analysis, currentPrice }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getPriceDifference = () => {
    if (!analysis || !currentPrice) return null;
    return currentPrice - analysis.finalValue;
  };

  const getPriceDifferencePercentage = () => {
    if (!analysis || !currentPrice || analysis.finalValue === 0) return null;
    return ((currentPrice - analysis.finalValue) / analysis.finalValue) * 100;
  };

  const difference = getPriceDifference();
  const differencePercentage = getPriceDifferencePercentage();

  const getMarketPosition = () => {
    if (!analysis || !currentPrice) return "neutral";

    if (currentPrice > analysis.finalValue * 1.1) return "overpriced";
    if (currentPrice < analysis.finalValue * 0.9) return "underpriced";
    return "fair";
  };

  const marketPosition = getMarketPosition();

  const getPositionColor = () => {
    switch (marketPosition) {
      case "overpriced":
        return "#F44336";
      case "underpriced":
        return "#4CAF50";
      case "fair":
        return "#FF9800";
      default:
        return "#666";
    }
  };

  const getPositionLabel = () => {
    switch (marketPosition) {
      case "overpriced":
        return "Overpriced";
      case "underpriced":
        return "Underpriced";
      case "fair":
        return "Fair Price";
      default:
        return "Unknown";
    }
  };

  const getPositionIcon = () => {
    switch (marketPosition) {
      case "overpriced":
        return "📈";
      case "underpriced":
        return "📉";
      case "fair":
        return "⚖️";
      default:
        return "❓";
    }
  };

  if (!analysis) {
    return (
      <div className="price-breakdown no-data">
        <p>Price breakdown not available</p>
      </div>
    );
  }

  return (
    <div className="price-breakdown">
      <div className="breakdown-header">
        <h3>Price Breakdown</h3>
        <div className="price-comparison">
          <span className="current-price">{formatCurrency(currentPrice)}</span>
          <span className="vs">vs</span>
          <span className="market-value">
            {formatCurrency(analysis.finalValue)}
          </span>
        </div>
      </div>

      <div className="price-position">
        <div
          className="position-indicator"
          style={{ backgroundColor: getPositionColor() }}
        >
          <span className="position-icon">{getPositionIcon()}</span>
          <span className="position-label">{getPositionLabel()}</span>
        </div>

        {difference !== null && (
          <div className="price-difference">
            <span
              className={`difference-amount ${difference > 0 ? "positive" : "negative"}`}
            >
              {difference > 0 ? "+" : ""}
              {formatCurrency(difference)}
            </span>
            {differencePercentage !== null && (
              <span
                className={`difference-percentage ${difference > 0 ? "positive" : "negative"}`}
              >
                ({differencePercentage > 0 ? "+" : ""}
                {differencePercentage.toFixed(1)}%)
              </span>
            )}
            <span className="difference-label">from market value</span>
          </div>
        )}
      </div>

      <div className="breakdown-components">
        <div className="component-section">
          <h4>Value Components</h4>
          <div className="component-list">
            <div className="component-item">
              <div className="component-info">
                <span className="component-label">Base Market Value</span>
                <span className="component-value">
                  {formatCurrency(analysis.baseMarketValue)}
                </span>
              </div>
              <div className="component-bar">
                <div
                  className="component-fill base"
                  style={{
                    width: `${(analysis.baseMarketValue / analysis.finalValue) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {analysis.conditionAdjustment !== 0 && (
              <div className="component-item">
                <div className="component-info">
                  <span className="component-label">Condition Adjustment</span>
                  <span
                    className={`component-value ${analysis.conditionAdjustment > 0 ? "positive" : "negative"}`}
                  >
                    {analysis.conditionAdjustment > 0 ? "+" : ""}
                    {formatCurrency(analysis.conditionAdjustment)}
                  </span>
                </div>
                <div className="component-bar">
                  <div
                    className={`component-fill ${analysis.conditionAdjustment > 0 ? "positive" : "negative"}`}
                    style={{
                      width: `${Math.abs(analysis.conditionAdjustment / analysis.finalValue) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            <div className="component-item total">
              <div className="component-info">
                <span className="component-label">Final Market Value</span>
                <span className="component-value">
                  {formatCurrency(analysis.finalValue)}
                </span>
              </div>
              <div className="component-bar total-bar">
                <div
                  className="component-fill total"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="component-section">
          <h4>Market Context</h4>
          <div className="market-context">
            <div className="context-item">
              <span className="context-label">Market Average</span>
              <span className="context-value">
                {formatCurrency(analysis.marketAverage)}
              </span>
            </div>
            <div className="context-item">
              <span className="context-label">Price Range</span>
              <span className="context-value">
                {formatCurrency(analysis.marketRange.min)} -{" "}
                {formatCurrency(analysis.marketRange.max)}
              </span>
            </div>
            <div className="context-item">
              <span className="context-label">Confidence Score</span>
              <span className="context-value">{analysis.confidence}%</span>
            </div>
          </div>

          <div className="price-recommendation">
            <h4>Recommendation</h4>
            <div className="recommendation-content">
              {marketPosition === "overpriced" && (
                <div className="recommendation overpriced">
                  <span className="recommendation-icon">⚠️</span>
                  <p>
                    Consider reducing the price to align with market value and
                    attract more buyers.
                  </p>
                </div>
              )}
              {marketPosition === "underpriced" && (
                <div className="recommendation underpriced">
                  <span className="recommendation-icon">💰</span>
                  <p>
                    The price is below market value. This could be a great deal
                    for buyers or an opportunity to increase price.
                  </p>
                </div>
              )}
              {marketPosition === "fair" && (
                <div className="recommendation fair">
                  <span className="recommendation-icon">✅</span>
                  <p>
                    The price is well-aligned with market value. Good
                    competitive positioning.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceBreakdown;
