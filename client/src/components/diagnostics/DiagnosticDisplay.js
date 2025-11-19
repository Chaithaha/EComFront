import React from "react";
import "../../styles/common.css";

const DiagnosticDisplay = ({ report }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case "excellent":
        return "#4CAF50";
      case "good":
        return "#8BC34A";
      case "fair":
        return "#FF9800";
      case "poor":
        return "#F44336";
      default:
        return "#666";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#4CAF50";
    if (score >= 60) return "#8BC34A";
    if (score >= 40) return "#FF9800";
    return "#F44336";
  };

  const hardwareTestLabels = {
    screen: "Screen/Display",
    camera: "Camera",
    speakers: "Speakers",
    microphone: "Microphone",
    buttons: "Physical Buttons",
    ports: "Charging/USB Ports",
    wifi: "Wi-Fi Connectivity",
    bluetooth: "Bluetooth",
    gps: "GPS",
    accelerometer: "Accelerometer",
    gyroscope: "Gyroscope",
    fingerprint: "Fingerprint Scanner",
    face_id: "Face ID",
  };

  const passedTests = Object.values(report.hardware_tests || {}).filter(
    Boolean,
  ).length;
  const totalTests = Object.keys(report.hardware_tests || {}).length;
  const hardwareScore =
    totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  return (
    <div className="diagnostic-display">
      <div className="diagnostic-header">
        <h3>Diagnostic Report</h3>
        <div className="report-meta">
          <span className="report-date">{formatDate(report.created_at)}</span>
          {report.users && (
            <span className="report-author">by {report.users.username}</span>
          )}
        </div>
      </div>

      <div className="diagnostic-summary">
        <div className="summary-card">
          <h4>Overall Score</h4>
          <div className="score-display">
            <div
              className="score-circle"
              style={{
                background: `conic-gradient(${getScoreColor(report.performance_score)} ${report.performance_score * 3.6}deg, #e0e0e0 0deg)`,
              }}
            >
              <span className="score-number">{report.performance_score}%</span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <h4>Hardware Health</h4>
          <div className="score-display">
            <div
              className="score-circle"
              style={{
                background: `conic-gradient(${getScoreColor(hardwareScore)} ${hardwareScore * 3.6}deg, #e0e0e0 0deg)`,
              }}
            >
              <span className="score-number">{hardwareScore}%</span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <h4>Battery Health</h4>
          <div className="score-display">
            <div
              className="score-circle"
              style={{
                background: `conic-gradient(${getScoreColor(report.battery_health)} ${report.battery_health * 3.6}deg, #e0e0e0 0deg)`,
              }}
            >
              <span className="score-number">{report.battery_health}%</span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <h4>Condition</h4>
          <div className="condition-display">
            <span
              className="condition-badge"
              style={{
                backgroundColor: getConditionColor(report.overall_condition),
              }}
            >
              {report.overall_condition?.charAt(0).toUpperCase() +
                report.overall_condition?.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="diagnostic-details">
        <div className="details-section">
          <h4>Hardware Test Results</h4>
          <div className="hardware-tests-results">
            {Object.entries(hardwareTestLabels).map(([test, label]) => (
              <div key={test} className="test-result">
                <span className="test-label">{label}</span>
                <span
                  className={`test-status ${report.hardware_tests?.[test] ? "pass" : "fail"}`}
                >
                  {report.hardware_tests?.[test] ? "✓ Pass" : "✗ Fail"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {report.notes && (
          <div className="details-section">
            <h4>Additional Notes</h4>
            <div className="notes-content">{report.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticDisplay;
