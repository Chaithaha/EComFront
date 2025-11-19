import React, { useState, useEffect } from "react";
import Button from "../common/Button";
import "../../styles/common.css";

const MarketValueAnalysis = ({ productId, productName, brand, category }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMarketAnalysis = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/market-value/calculate/${productId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to calculate market value");
      }

      const data = await response.json();
      setAnalysis(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchMarketAnalysis();
    }
  }, [productId]);

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return "#4CAF50";
    if (confidence >= 60) return "#FF9800";
    return "#F44336";
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 80) return "High Confidence";
    if (confidence >= 60) return "Medium Confidence";
    return "Low Confidence";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="market-value-analysis loading">
        <div className="loading-spinner"></div>
        <p>Analyzing market value...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="market-value-analysis error">
        <div className="error-message">
          <p>{error}</p>
          <Button onClick={fetchMarketAnalysis} variant="secondary">
            Retry Analysis
          </Button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="market-value-analysis no-data">
        <p>Market value analysis not available</p>
        <Button onClick={fetchMarketAnalysis}>Calculate Market Value</Button>
      </div>
    );
  }

  return (
    <div className="market-value-analysis">
      <div className="analysis-header">
        <h3>Market Value Analysis</h3>
        <div className="analysis-meta">
          {lastUpdated && (
            <span className="last-updated">
              Updated: {lastUpdated.toLocaleString()}
            </span>
          )}
          <Button
            onClick={fetchMarketAnalysis}
            variant="secondary"
            size="small"
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="analysis-summary">
        <div className="summary-card primary">
          <h4>Estimated Market Value</h4>
          <div className="value-display">
            <span className="value-amount">
              {formatCurrency(analysis.finalValue)}
            </span>
            <div className="confidence-indicator">
              <span
                className="confidence-dot"
                style={{
                  backgroundColor: getConfidenceColor(analysis.confidence),
                }}
              ></span>
              <span className="confidence-text">
                {getConfidenceLabel(analysis.confidence)} ({analysis.confidence}
                %)
              </span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <h4>Market Average</h4>
          <div className="value-display">
            <span className="value-amount">
              {formatCurrency(analysis.marketAverage)}
            </span>
            <span className="value-label">Similar Products</span>
          </div>
        </div>

        <div className="summary-card">
          <h4>Market Range</h4>
          <div className="range-display">
            <span className="range-min">
              {formatCurrency(analysis.marketRange.min)}
            </span>
            <span className="range-separator">-</span>
            <span className="range-max">
              {formatCurrency(analysis.marketRange.max)}
            </span>
          </div>
          <span className="value-label">Price Range</span>
        </div>

        <div className="summary-card">
          <h4>Condition Adjustment</h4>
          <div className="adjustment-display">
            <span
              className={`adjustment-amount ${analysis.conditionAdjustment >= 0 ? "positive" : "negative"}`}
            >
              {analysis.conditionAdjustment >= 0 ? "+" : ""}
              {formatCurrency(analysis.conditionAdjustment)}
            </span>
            <span className="value-label">Based on Condition</span>
          </div>
        </div>
      </div>

      <div className="analysis-details">
        <div className="details-section">
          <h4>Value Breakdown</h4>
          <div className="breakdown-list">
            <div className="breakdown-item">
              <span className="breakdown-label">Base Market Value</span>
              <span className="breakdown-value">
                {formatCurrency(analysis.baseMarketValue)}
              </span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Condition Multiplier</span>
              <span className="breakdown-value">
                {analysis.factors.condition.toFixed(2)}x
              </span>
            </div>
            {analysis.factors.batteryHealth && (
              <div className="breakdown-item">
                <span className="breakdown-label">Battery Health</span>
                <span className="breakdown-value">
                  {analysis.factors.batteryHealth}%
                </span>
              </div>
            )}
            {analysis.factors.performanceScore && (
              <div className="breakdown-item">
                <span className="breakdown-label">Performance Score</span>
                <span className="breakdown-value">
                  {analysis.factors.performanceScore}%
                </span>
              </div>
            )}
            <div className="breakdown-item total">
              <span className="breakdown-label">Final Estimated Value</span>
              <span className="breakdown-value">
                {formatCurrency(analysis.finalValue)}
              </span>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h4>Market Insights</h4>
          <div className="insights-list">
            <div className="insight-item">
              <span className="insight-icon">📊</span>
              <div className="insight-content">
                <strong>Data Confidence:</strong>{" "}
                {getConfidenceLabel(analysis.confidence)}
                <p>Based on available market data and product condition</p>
              </div>
            </div>
            <div className="insight-item">
              <span className="insight-icon">🎯</span>
              <div className="insight-content">
                <strong>Competitive Position:</strong>
                <p>
                  {analysis.finalValue > analysis.marketAverage
                    ? "Above market average - good value proposition"
                    : analysis.finalValue < analysis.marketAverage
                      ? "Below market average - consider pricing strategy"
                      : "Aligned with market average"}
                </p>
              </div>
            </div>
            <div className="insight-item">
              <span className="insight-icon">⚡</span>
              <div className="insight-content">
                <strong>Condition Impact:</strong>
                <p>
                  {analysis.conditionAdjustment > 0
                    ? "Excellent condition adds value to the product"
                    : analysis.conditionAdjustment < 0
                      ? "Condition affects market value"
                      : "Condition is at market standard"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketValueAnalysis;
